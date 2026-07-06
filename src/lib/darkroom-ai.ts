/**
 * Darkroom AI — a simulated agent that turns natural language into OS
 * actions. No model call; pattern-matched intents + curated responses.
 * The streaming behavior is mimicked with per-character tickers so the
 * UI reads as a real LLM at near-zero cost.
 */

import { projects, journal } from "./data";
import type { AppKey } from "./window-store";

export type Intent =
  | { kind: "open"; app: AppKey; param?: string }
  | { kind: "compare"; a: { app: AppKey; param?: string }; b: { app: AppKey; param?: string } }
  | { kind: "read"; slug: string }
  | { kind: "recommend"; audience?: string }
  | { kind: "summarize"; topic?: string }
  | { kind: "workspace"; preset: "recruiter" | "designer" | "founder" | "critic" | "clean" }
  | { kind: "theme"; value: "dark" | "light" | "auto" }
  | { kind: "dock"; position: "bottom" | "left" | "right" | "hidden" }
  | { kind: "hud"; on: boolean }
  | { kind: "sound"; on: boolean }
  | { kind: "wallpaper"; index: number }
  | { kind: "lock" }
  | { kind: "reboot" }
  | { kind: "mission-control" }
  | { kind: "notification-center" }
  | { kind: "develop" }
  | { kind: "list-open" }
  | { kind: "greet" }
  | { kind: "help" }
  | { kind: "unknown"; text: string };

export type PlanStep = {
  /** Visible description of what's happening */
  label: string;
  /** Action to run when this step starts. Side effects on the OS. */
  action?: () => void;
  /** ms to wait before the next step (default 240) */
  hold?: number;
};

export type Plan = {
  intent: Intent;
  /** A short streamed greeting/preamble */
  preamble: string;
  /** Discrete plan steps the user sees executed */
  steps: PlanStep[];
  /** Final streaming text — "summary" the AI returns when done */
  outro?: string;
};

/* ───────────────────────────────────────────────────────────── */
/* Intent parsing                                                */
/* ───────────────────────────────────────────────────────────── */

const PROJECT_ALIASES: Record<string, string> = {
  spin: "spin",
  ford: "spin",
  mobility: "spin",
  hush: "hush",
  beauty: "hush",
  vgv: "vgv",
  "very good ventures": "vgv",
  flutter: "vgv",
  saucey: "saucey",
  nationbuilder: "nationbuilder",
  campaigns: "nationbuilder",
  differential: "differential",
  boneyard: "boneyard",
  studio: "boneyard",
  collective: "boneyard",
};

const APP_ALIASES: Record<string, AppKey> = {
  work: "work",
  journal: "journal",
  about: "about",
  contact: "contact",
  readme: "readme",
  preferences: "prefs",
  prefs: "prefs",
  settings: "prefs",
};

const JOURNAL_ALIASES: Record<string, string> = {
  "developing the archive": "developing-the-archive",
  archive: "developing-the-archive",
  "ai design": "ai-driven-design-techniques",
  "ai-driven design": "ai-driven-design-techniques",
  "ai techniques": "ai-driven-design-techniques",
  predictive: "leverage-ai-predictive-design",
  "predictive design": "leverage-ai-predictive-design",
  corps: "field-notes-from-the-corps",
  marines: "field-notes-from-the-corps",
  field: "field-notes-from-the-corps",
};

function findProject(text: string): string | null {
  const t = text.toLowerCase();
  for (const [key, slug] of Object.entries(PROJECT_ALIASES)) {
    if (t.includes(key)) return slug;
  }
  return null;
}

function findApp(text: string): AppKey | null {
  const t = text.toLowerCase();
  for (const [key, app] of Object.entries(APP_ALIASES)) {
    if (t.includes(key)) return app;
  }
  return null;
}

function findEntry(text: string): string | null {
  const t = text.toLowerCase();
  for (const [key, slug] of Object.entries(JOURNAL_ALIASES)) {
    if (t.includes(key)) return slug;
  }
  return null;
}

export function parseIntent(raw: string): Intent {
  const text = raw.trim().toLowerCase();

  // Theme commands
  if (/make (it|the (?:os|ui|theme)) (lighter|light|cream)/.test(text) || text.includes("light theme") || text === "light mode") {
    return { kind: "theme", value: "light" };
  }
  if (/make (it|the (?:os|ui|theme)) (darker|dark|night)/.test(text) || text.includes("dark theme") || text === "dark mode") {
    return { kind: "theme", value: "dark" };
  }
  if (text.includes("auto theme") || text.includes("auto mode")) {
    return { kind: "theme", value: "auto" };
  }

  // Dock commands
  if (text.includes("hide") && text.includes("dock")) {
    return { kind: "dock", position: "hidden" };
  }
  if (text.includes("dock") && (text.includes("left"))) return { kind: "dock", position: "left" };
  if (text.includes("dock") && (text.includes("right"))) return { kind: "dock", position: "right" };
  if (text.includes("dock") && (text.includes("bottom") || text.includes("show"))) {
    return { kind: "dock", position: "bottom" };
  }

  // HUD / sound toggles
  if ((text.includes("hide") || text.includes("turn off") || text.includes("off")) && text.includes("hud")) {
    return { kind: "hud", on: false };
  }
  if ((text.includes("show") || text.includes("turn on") || text.includes("on")) && text.includes("hud")) {
    return { kind: "hud", on: true };
  }
  if ((text.includes("mute") || text.includes("silence") || (text.includes("off") && text.includes("sound")))) {
    return { kind: "sound", on: false };
  }
  if (text.includes("turn on sound") || text.includes("enable sound") || text.includes("unmute")) {
    return { kind: "sound", on: true };
  }

  // Wallpaper
  const wp = text.match(/wallpaper\s*(0?[1-5])/);
  if (wp) return { kind: "wallpaper", index: parseInt(wp[1]) };
  if (text.includes("change") && text.includes("wallpaper")) {
    return { kind: "wallpaper", index: Math.floor(Math.random() * 5) + 1 };
  }

  // Workspaces
  if (text.includes("recruiter") || text.includes("hiring") || text.includes("portfolio review")) {
    return { kind: "workspace", preset: "recruiter" };
  }
  if (text.includes("designer mode") || (text.includes("for a designer") && text.includes("show"))) {
    return { kind: "workspace", preset: "designer" };
  }
  if (text.includes("founder") || text.includes("investor")) {
    return { kind: "workspace", preset: "founder" };
  }
  if (text.includes("critic") || text.includes("review the writing") || text.includes("journalist")) {
    return { kind: "workspace", preset: "critic" };
  }
  if (text.includes("clean slate") || text.includes("close everything") || text.includes("close all")) {
    return { kind: "workspace", preset: "clean" };
  }

  // System actions
  if (text === "lock" || text.includes("lock now") || text.includes("lock the")) return { kind: "lock" };
  if (text.includes("reboot") || text.includes("restart") || text === "reset boot") return { kind: "reboot" };
  if (text.includes("mission control") || text.includes("show me all the windows") || text.includes("show all windows")) {
    return { kind: "mission-control" };
  }
  if (text.includes("notification") && (text.includes("center") || text.includes("panel"))) {
    return { kind: "notification-center" };
  }
  if (text === "develop" || text.includes("flash") || text.includes("safelight")) {
    return { kind: "develop" };
  }
  if (text.includes("what's open") || text.includes("list windows") || text.includes("what is running")) {
    return { kind: "list-open" };
  }
  if (text === "help" || text === "what can you do" || text === "what can i do" || text === "?") {
    return { kind: "help" };
  }
  if (text === "hi" || text === "hello" || text === "hey" || text === "hey darkroom") {
    return { kind: "greet" };
  }

  // Read journal entries
  if (text.startsWith("read") || text.includes("read me") || text.includes("read the")) {
    const entry = findEntry(text);
    if (entry) return { kind: "read", slug: entry };
    // fall through
  }

  // Compare / side by side
  if (text.includes("compare") || text.includes("side by side") || text.includes("vs") || text.includes(" and ")) {
    // Find two project mentions
    const found: string[] = [];
    for (const [alias, slug] of Object.entries(PROJECT_ALIASES)) {
      if (text.includes(alias) && !found.includes(slug)) found.push(slug);
      if (found.length >= 2) break;
    }
    if (found.length >= 2) {
      return {
        kind: "compare",
        a: { app: "project", param: found[0] },
        b: { app: "project", param: found[1] },
      };
    }
  }

  // Recommend
  if (text.startsWith("recommend") || text.includes("show me the biggest") || text.includes("show me his best") || text.includes("what should i look")) {
    const audienceMatch = text.match(/(?:for|to) (?:a |an )?([a-z ]+?)(?: client| visitor)?$/);
    return { kind: "recommend", audience: audienceMatch?.[1]?.trim() };
  }

  // Summarize
  if (text.startsWith("summarize") || text.startsWith("tldr") || text.startsWith("explain")) {
    return { kind: "summarize", topic: text.replace(/^(summarize|tldr|explain)\s*/, "") };
  }

  // Open (catch-all — looks for project / app name)
  const proj = findProject(text);
  if (proj) return { kind: "open", app: "project", param: proj };
  const app = findApp(text);
  if (app) return { kind: "open", app };

  return { kind: "unknown", text: raw };
}

/* ───────────────────────────────────────────────────────────── */
/* Plan generation                                               */
/* ───────────────────────────────────────────────────────────── */

export type Bridge = {
  open: (req: { app: AppKey; param?: string }) => string;
  snap: (id: string, zone: "left" | "right" | "full") => void;
  close: (id: string) => void;
  closeAll: () => void;
  setTheme: (v: "dark" | "light" | "auto") => void;
  setDock: (pos: "bottom" | "left" | "right" | "hidden") => void;
  setSound: (on: boolean) => void;
  setHud: (on: boolean) => void;
  setWallpaper: (i: number) => void;
  openMissionControl: () => void;
  openNotificationCenter: () => void;
  fireDevelop: () => void;
  lock: () => void;
  reboot: () => void;
  listOpenSlugs: () => string[];
};

function projectMeta(slug: string) {
  const p = projects.find((p) => p.slug === slug);
  return p ? { title: p.title, year: p.year, role: p.role } : null;
}

export function buildPlan(intent: Intent, bridge: Bridge): Plan {
  switch (intent.kind) {
    case "open": {
      if (intent.app === "project" && intent.param) {
        const m = projectMeta(intent.param);
        const title = m?.title ?? intent.param;
        return {
          intent,
          preamble: `Pulling up ${title}.`,
          steps: [
            {
              label: `Opening ~/work/${intent.param}`,
              action: () => bridge.open({ app: "project", param: intent.param }),
            },
          ],
          outro: m
            ? `${title} · ${m.role} · ${m.year}.`
            : "Done.",
        };
      }
      return {
        intent,
        preamble: `Opening ~/${intent.app}.`,
        steps: [
          {
            label: `Opening ~/${intent.app}`,
            action: () => bridge.open({ app: intent.app, param: intent.param }),
          },
        ],
      };
    }

    case "compare": {
      const ma = intent.a.param ? projectMeta(intent.a.param) : null;
      const mb = intent.b.param ? projectMeta(intent.b.param) : null;
      return {
        intent,
        preamble: `Got it — comparing ${ma?.title ?? intent.a.param} and ${
          mb?.title ?? intent.b.param
        }.`,
        steps: [
          {
            label: `Opening ${ma?.title ?? intent.a.param}`,
            action: () => bridge.open(intent.a),
          },
          {
            label: `Snapping left half`,
            action: () => {
              const ids = bridge.listOpenSlugs(); // ignored
              void ids;
              // We snap the most recently opened window — handled at execution site
            },
            hold: 80,
          },
          {
            label: `Opening ${mb?.title ?? intent.b.param}`,
            action: () => bridge.open(intent.b),
          },
          {
            label: `Snapping right half`,
            action: () => {
              // handled at execution site
            },
            hold: 80,
          },
        ],
        outro: `Side by side. Click either window to focus it.`,
      };
    }

    case "read": {
      const e = journal.find((j) => j.slug === intent.slug);
      return {
        intent,
        preamble: e ? `Opening "${e.title}" for you.` : "Opening that entry.",
        steps: [
          {
            label: `Opening ~/journal/${intent.slug}`,
            action: () => bridge.open({ app: "entry", param: intent.slug }),
          },
        ],
        outro: e ? `${e.readTime} · ${e.category}.` : undefined,
      };
    }

    case "recommend": {
      const aud = intent.audience ?? "";
      // Heuristic: pick a project based on audience keyword
      let slug = "spin";
      if (/fintech|finance|crypto/.test(aud)) slug = "vgv";
      else if (/design|brand|studio/.test(aud)) slug = "boneyard";
      else if (/recruiter|hiring|hr/.test(aud)) slug = "spin";
      else if (/founder|investor|vc/.test(aud)) slug = "boneyard";
      else if (/social|community|consumer/.test(aud)) slug = "hush";
      else if (/civic|political|nonprofit/.test(aud)) slug = "nationbuilder";
      const m = projectMeta(slug)!;
      return {
        intent,
        preamble: aud
          ? `For ${aud}, I'd open ${m.title} first.`
          : `Start with ${m.title}.`,
        steps: [
          {
            label: `Opening ${m.title}`,
            action: () => bridge.open({ app: "project", param: slug }),
          },
        ],
        outro: `${m.role} · ${m.year}. Ask me to compare it to another frame if you like.`,
      };
    }

    case "summarize": {
      const focusedTitle = bridge.listOpenSlugs()[0] ?? "the current window";
      return {
        intent,
        preamble: `Summary of ${focusedTitle}:`,
        steps: [],
        outro: summaryFor(focusedTitle),
      };
    }

    case "workspace": {
      const plans: Record<typeof intent.preset, Plan> = {
        recruiter: {
          intent,
          preamble: "Setting up Recruiter mode — opening About, Work, Contact.",
          steps: [
            { label: "Closing existing windows", action: () => bridge.closeAll() },
            { label: "Opening ~/about", action: () => bridge.open({ app: "about" }) },
            { label: "Opening ~/work", action: () => bridge.open({ app: "work" }) },
            { label: "Opening ~/contact", action: () => bridge.open({ app: "contact" }) },
          ],
          outro: "Three windows arranged. Start with About.",
        },
        designer: {
          intent,
          preamble: "Designer mode — pulling up the contact sheet and the journal.",
          steps: [
            { label: "Closing existing windows", action: () => bridge.closeAll() },
            { label: "Opening ~/work", action: () => bridge.open({ app: "work" }) },
            { label: "Opening ~/journal", action: () => bridge.open({ app: "journal" }) },
          ],
          outro: "Switch ~/work to Cover Flow view from the toolbar for the visual browse.",
        },
        founder: {
          intent,
          preamble: "Founder mode — opening Boneyard and Spin side by side.",
          steps: [
            { label: "Closing existing windows", action: () => bridge.closeAll() },
            { label: "Opening Boneyard Collective", action: () => bridge.open({ app: "project", param: "boneyard" }) },
            { label: "Snapping left half", action: () => {} },
            { label: "Opening Spin", action: () => bridge.open({ app: "project", param: "spin" }) },
            { label: "Snapping right half", action: () => {} },
          ],
          outro: "Two highest-leverage frames. The Spin numbers do the talking.",
        },
        critic: {
          intent,
          preamble: "Critic mode — long-form context first.",
          steps: [
            { label: "Closing existing windows", action: () => bridge.closeAll() },
            { label: "Opening ~/about", action: () => bridge.open({ app: "about" }) },
            { label: "Opening ~/journal", action: () => bridge.open({ app: "journal" }) },
          ],
          outro: "Start in About → Storage tab for receipts. Then Journal.",
        },
        clean: {
          intent,
          preamble: "Clean slate.",
          steps: [
            { label: "Closing all windows", action: () => bridge.closeAll() },
          ],
          outro: "Desktop is clear.",
        },
      };
      return plans[intent.preset];
    }

    case "theme":
      return {
        intent,
        preamble: `Switching theme to ${intent.value}.`,
        steps: [{ label: `Theme · ${intent.value}`, action: () => bridge.setTheme(intent.value) }],
      };

    case "dock":
      return {
        intent,
        preamble: `Moving the dock to ${intent.position}.`,
        steps: [{ label: `Dock · ${intent.position}`, action: () => bridge.setDock(intent.position) }],
      };

    case "hud":
      return {
        intent,
        preamble: intent.on ? "Showing the HUD." : "Hiding the HUD.",
        steps: [{ label: `HUD · ${intent.on ? "visible" : "hidden"}`, action: () => bridge.setHud(intent.on) }],
      };

    case "sound":
      return {
        intent,
        preamble: intent.on ? "Turning UI sounds on." : "Muting UI sounds.",
        steps: [{ label: `Sound · ${intent.on ? "on" : "off"}`, action: () => bridge.setSound(intent.on) }],
      };

    case "wallpaper":
      return {
        intent,
        preamble: `Wallpaper · print 0${intent.index}.`,
        steps: [{ label: `Setting wallpaper`, action: () => bridge.setWallpaper(intent.index) }],
      };

    case "lock":
      return {
        intent,
        preamble: "Locking now.",
        steps: [{ label: "Lock screen", action: () => bridge.lock(), hold: 100 }],
      };

    case "reboot":
      return {
        intent,
        preamble: "Rebooting the archive.",
        steps: [{ label: "Restarting", action: () => bridge.reboot(), hold: 100 }],
      };

    case "mission-control":
      return {
        intent,
        preamble: "Opening Mission Control.",
        steps: [{ label: "Mission Control", action: () => bridge.openMissionControl() }],
      };

    case "notification-center":
      return {
        intent,
        preamble: "Sliding in Notification Center.",
        steps: [{ label: "Notification Center", action: () => bridge.openNotificationCenter() }],
      };

    case "develop":
      return {
        intent,
        preamble: "Flashing the safelight.",
        steps: [{ label: "Develop", action: () => bridge.fireDevelop() }],
      };

    case "list-open": {
      const slugs = bridge.listOpenSlugs();
      return {
        intent,
        preamble: `${slugs.length} window${slugs.length === 1 ? "" : "s"} open:`,
        steps: [],
        outro: slugs.length === 0 ? "The desktop is empty." : slugs.map((s) => `· ${s}`).join("\n"),
      };
    }

    case "greet":
      return {
        intent,
        preamble: "Hey. I'm Atelier — the agent that runs this archive.",
        steps: [],
        outro:
          "Try: `recommend a project for a fintech client` · `compare spin and hush` · `read me the latest entry` · `recruiter mode`. Or ask me anything about Josh's work.",
      };

    case "help":
      return {
        intent,
        preamble: "What I can do, in plain English:",
        steps: [],
        outro: [
          "· open spin · open journal · open prefs",
          "· compare spin and hush",
          "· read me the latest entry",
          "· recommend a project for a fintech client",
          "· recruiter mode · designer mode · founder mode · clean slate",
          "· make it lighter · hide the dock · mute · turn off the hud",
          "· lock · reboot · mission control · develop",
        ].join("\n"),
      };

    case "unknown":
      return {
        intent,
        preamble: `I'm not sure how to do that yet.`,
        steps: [],
        outro: "Try `help` for what I can do — or describe what you're looking for and I'll point you at a frame.",
      };
  }
}

/* ── Streaming helpers ──────────────────────────────────────── */

export function streamText(
  text: string,
  onChar: (full: string) => void,
  opts: { msPerChar?: number; onDone?: () => void } = {}
) {
  const ms = opts.msPerChar ?? 18;
  let i = 0;
  let acc = "";
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;
    if (i >= text.length) {
      opts.onDone?.();
      return;
    }
    acc += text[i];
    onChar(acc);
    i += 1;
    setTimeout(tick, ms);
  };
  tick();

  return () => {
    cancelled = true;
  };
}

/* ── Summaries used by `summarize` ──────────────────────────── */

function summaryFor(slug: string): string {
  if (slug.includes("spin"))
    return "Spin · Ford Mobility. Led design for the micromobility leader across 100+ cities. Onboarding 1.5×, retention +20%, safety incidents −80%. WWDC 2020 partnership with Apple.";
  if (slug.includes("hush"))
    return "Hush. First designer in. Grew the discipline as the product crossed a million MAU. Conversion lifted 2.4× post-redesign. Backed by Kleiner Perkins.";
  if (slug.includes("vgv"))
    return "Very Good Ventures. Brand + product partnership with the Flutter-app market leader. Reset the visual system; the component library shipped on time and is still in use.";
  if (slug.includes("boneyard"))
    return "Boneyard Collective. Founder. AI-native product studio — build for clients during the day, ship our own products on weekends. The thesis: shipping our own gives us scars; the scars make the client work better.";
  return "I don't have a summary for that window yet — try opening it directly.";
}
