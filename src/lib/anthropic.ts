import Anthropic from "@anthropic-ai/sdk";
import { oidcFederationProvider } from "@anthropic-ai/sdk/lib/credentials/oidc-federation";
import type { AccessToken, AccessTokenProvider } from "@anthropic-ai/sdk/lib/credentials/types";
import { getVercelOidcToken } from "@vercel/oidc";

/**
 * One way to get a Claude client, in order of preference:
 *
 * 1. Workload Identity Federation with Vercel's OIDC token. The deployment
 *    (or `vercel env pull` locally) proves who it is; Anthropic's rule maps
 *    that identity to a short-lived access token. No static key exists.
 *    Needs ANTHROPIC_FEDERATION_RULE_ID, ANTHROPIC_ORGANIZATION_ID,
 *    ANTHROPIC_SERVICE_ACCOUNT_ID (and ANTHROPIC_WORKSPACE_ID when the rule
 *    spans workspaces), plus a Vercel OIDC token: the request header on
 *    Vercel, or VERCEL_OIDC_TOKEN in .env.local.
 * 2. ANTHROPIC_API_KEY, for a machine with no identity provider.
 *
 * `configured()` says whether either path exists, so pages can show an honest
 * "off" state. `client()` throws a plain sentence when neither does.
 */

const BASE = process.env.ANTHROPIC_BASE_URL ?? "https://api.anthropic.com";

function federationEnv() {
  const ruleId = process.env.ANTHROPIC_FEDERATION_RULE_ID;
  const organizationId = process.env.ANTHROPIC_ORGANIZATION_ID;
  const serviceAccountId = process.env.ANTHROPIC_SERVICE_ACCOUNT_ID;
  if (!ruleId || !organizationId || !serviceAccountId) return null;
  return { ruleId, organizationId, serviceAccountId, workspaceId: process.env.ANTHROPIC_WORKSPACE_ID || undefined };
}

/** True when the deployment can mint a token, or when a static key is set. */
export function anthropicConfigured(): boolean {
  if (process.env.ANTHROPIC_API_KEY) return true;
  return !!federationEnv() && (!!process.env.VERCEL || !!process.env.VERCEL_OIDC_TOKEN || !!process.env.VERCEL_OIDC_TOKEN_FILE);
}

export function anthropicMode(): "federation" | "api-key" | "off" {
  if (process.env.ANTHROPIC_API_KEY) return "api-key";
  return federationEnv() ? "federation" : "off";
}

// One cached access token per process; the SDK's provider re-exchanges on demand.
const g = globalThis as unknown as { __anthropicToken?: AccessToken | null };

function cached(provider: AccessTokenProvider): AccessTokenProvider {
  return async (opts) => {
    const t = g.__anthropicToken;
    const now = Math.floor(Date.now() / 1000);
    if (t && !opts?.forceRefresh && (t.expiresAt === null || t.expiresAt - now > 120)) return t;
    const fresh = await provider(opts);
    g.__anthropicToken = fresh;
    return fresh;
  };
}

/**
 * A client for this request. On Vercel the OIDC token rides on the request
 * (`x-vercel-oidc-token`); pass the request so the helper can read it there
 * before falling back to the environment.
 */
export function anthropicClient(req?: Request): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (key) return new Anthropic({ apiKey: key });
  const fed = federationEnv();
  if (!fed) throw new Error("No model credentials: set the federation variables (preferred) or ANTHROPIC_API_KEY.");
  const headerToken = req?.headers.get("x-vercel-oidc-token") ?? undefined;
  const identityTokenProvider = async () => headerToken ?? (await getVercelOidcToken());
  const provider = oidcFederationProvider({
    identityTokenProvider,
    federationRuleId: fed.ruleId,
    organizationId: fed.organizationId,
    serviceAccountId: fed.serviceAccountId,
    workspaceId: fed.workspaceId,
    baseURL: BASE,
    fetch: globalThis.fetch,
  });
  return new Anthropic({ credentials: cached(provider), baseURL: BASE });
}
