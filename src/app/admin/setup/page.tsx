import { readJson } from "@/lib/admin/store";
import { anthropicConfigured } from "@/lib/anthropic";
import type { Company } from "@/lib/admin/types";
import { getProfile } from "@/lib/admin/resume/profile";
import { ProfileEditor } from "@/components/admin/profile-editor";

export const dynamic = "force-dynamic";

export default function Setup() {
  const companies = readJson<Company[]>("companies", []);
  const profile = getProfile();
  const hasKey = anthropicConfigured();
  return (
    <div className="max-w-3xl">
      <h1 className="serif text-[2rem] leading-tight">Setup.</h1>
      <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-[12rem_1fr]">
        <dt className="text-fg-3">Model key</dt>
        <dd className={hasKey ? "text-emerald-300" : "text-amber-200"}>
          {hasKey
            ? "Claude is reachable (federated through the Vercel OIDC token, or a key). Scoring, editing, tailoring, and written answers are on. If it stops, run `vercel env pull` to refresh the 12-hour development token."
            : "No model credentials. Run `vercel env pull` to get a development token (federation), or set ANTHROPIC_API_KEY. Scanning, building, exporting, and form filling work regardless."}
        </dd>
        <dt className="text-fg-3">Boards</dt>
        <dd className="text-fg-2">{companies.length} companies across Greenhouse, Ashby, and Lever, plus the Hacker News thread. Edit data/admin/companies.json to add one: {"{ name, source, slug }"}. The slug is the one in the board&rsquo;s URL.</dd>
        <dt className="text-fg-3">Data</dt>
        <dd className="text-fg-2">data/admin/ on this Mac, git-ignored. Jobs, résumés, applications, exports, and the browser profile the agent signs in with.</dd>
        <dt className="text-fg-3">Phone</dt>
        <dd className="text-fg-2">{profile.phone ? profile.phone : "Not set. Forms that require a phone will wait for you; add it to the profile below."}</dd>
      </dl>
      <ProfileEditor initial={profile} />
    </div>
  );
}
