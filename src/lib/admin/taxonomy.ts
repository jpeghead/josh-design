/**
 * What the hunt is for, as rules a scanner can apply. Titles decide the
 * tier; the description decides how much AI is in the work; location and
 * seniority nudge the score. Everything here is deliberately legible so
 * Josh can tune it.
 */
const CORE = [
  /product design/i,
  // AI-centric design and building roles, the point of the hunt
  /\bai\b.*(product )?(designer|design lead|design engineer|prototyp|experience designer|interaction)/i,
  /(agent|agentic|copilot|assistant|conversation(al)?|llm|ml|intelligence) (experience|product|interaction|ux)? ?design/i,
  /design(er)?,? (for )?(ai|agents?|agentic|ml|llm|intelligence|copilot)/i,
  /(agent|ai|copilot) experience/i,
  /forward deployed (product )?designer/i,
  /design technologist|prototyper|prototyping (engineer|lead)/i,
  /founding (product )?(designer|design lead)/i,
  /(product|design) (engineer|builder).*\b(ai|agents?|llm|ml)\b/i,
  /\b(ai|agents?|llm)\b.*(product|design) (engineer|builder)/i,
  /\bdesign(er)?\b.*\b(ai|agents?|llm|ml|copilot|assistant)\b/i,
  /\b(ai|agents?|llm)\b.*\bdesign(er)?\b/i,
  /design engineer/i,
  /founding designer/i,
  /(head|director|lead|principal|staff|senior) (of )?(product )?design/i,
  /ux (engineer|designer)/i,
  /interaction designer/i,
  /creative technologist/i,
  /prototyp/i,
  /design(er)?, (growth|platform|developer|systems|core|consumer|enterprise|safety|agents?)/i,
];
const STRETCH = [
  /founding (product )?engineer/i,
  /ai (product )?(manager|lead|generalist|builder|specialist)/i,
  /developer (advocate|relations|experience)|devrel|developer education/i,
  /prompt (engineer|designer)/i,
  /(solutions|implementation|deployment) (designer|engineer|strategist)/i,
  /full[- ]stack (product )?engineer.*\b(ai|agents?|llm)\b/i,
  /\b(ai|agents?|llm)\b.*full[- ]stack/i,
  /forward deployed/i,
  /applied ai (engineer|architect)/i,
  /product engineer/i,
  /agent engineer/i,
  /developer experience/i,
  /\bdx\b/i,
  /solutions (engineer|architect).*\bai\b/i,
  /ai (product )?engineer/i,
  /member of technical staff.*(product|design|frontend|front-end)/i,
];
const EXCLUDE = [
  /chip|rtl|physical design|verification|mechanical|electrical|data center|hardware|silicon|asic|fpga/i,
  /policy design|instructional design|learning design|game designer|level designer|sound design|fashion|interior|architect(ural)? design/i,
  /\b(intern|internship|apprentice|new grad|university)\b/i,
  /recruit|sourcer|sales (development|executive)|account executive|customer success/i,
];

export function tier(title: string): "core" | "stretch" | "other" {
  if (EXCLUDE.some((r) => r.test(title))) return "other";
  if (CORE.some((r) => r.test(title))) return "core";
  if (STRETCH.some((r) => r.test(title))) return "stretch";
  return "other";
}

const AI_WORDS = [/\bllm\b/i, /\bagents?\b/i, /\bclaude\b/i, /\bgpt\b/i, /\bopenai\b/i, /\banthropic\b/i, /\bmodel(s)?\b/i, /\bprompt/i, /\bgenerative\b/i, /\bcopilot\b/i, /\bai[- ]native\b/i, /\bmachine learning\b/i, /\binference\b/i, /\bevals?\b/i];
const BUILD_WORDS = [/\breact\b/i, /\btypescript\b/i, /\bnext\.?js\b/i, /\bprototype/i, /\bship/i, /\bcode\b/i, /\bfigma\b/i, /\bdesign system/i, /\b0 ?(to|→) ?1\b/i, /\bfounding\b/i, /\bend[- ]to[- ]end\b/i];
const SENIOR = /\b(senior|staff|principal|lead|head|director)\b/i;
/** Admin surfaces where AI is rarely the job; the posting has to say otherwise. */
const ADMIN_SURFACE = /\b(it|hris|hr|payroll|benefits|billing|invoic|ads|advertis|internal tools|compliance|finance|accounting|procurement|lifecycle|crm|marketing)\b/i;
const JUNIOR = /\b(junior|associate|entry|intern)\b/i;

const NON_US = /\b(portugal|lisbon|london|uk|united kingdom|england|germany|berlin|munich|paris|france|canada|toronto|vancouver|montreal|india|bangalore|bengaluru|mumbai|singapore|australia|sydney|melbourne|japan|tokyo|netherlands|amsterdam|spain|barcelona|madrid|poland|warsaw|ireland|dublin|brazil|s[aã]o paulo|mexico|israel|tel aviv|emea|europe|apac|latam|korea|seoul|china|shanghai|beijing|taiwan|sweden|stockholm|switzerland|z[uü]rich|italy|milan|argentina|colombia|philippines|vietnam|nigeria|kenya|south africa|dubai|uae)\b/i;
const US = /\b(united states|usa?|us-|san francisco|new york|los angeles|seattle|austin|denver|chicago|boston|portland|miami|atlanta|washington|bay area|nyc|sf|ca|ny|wa|tx|co|ma|americas?|north america|anywhere)\b/i;

/** True when Josh could actually take the job from Los Angeles: a US location, or remote without a non-US restriction. */
export function usOrRemote(location: string, remoteFlag: boolean): boolean {
  const us = US.test(location);
  const nonUs = NON_US.test(location);
  if (us && !nonUs) return true;
  if (nonUs && !us) return false;
  if (remoteFlag || /remote/i.test(location)) return true;
  return us;
}

export type RuleScore = { score: number; why: string; persona: "designer-who-builds" | "ai-builder"; ai: number };

/** How much AI is in the work: 0 = none mentioned, 3+ = AI is the job. */
export function aiSignal(title: string, description: string): number {
  return AI_WORDS.filter((r) => r.test(description) || r.test(title)).length + (/\b(ai|agents?|agentic|llm|copilot|ml)\b/i.test(title) ? 2 : 0);
}

/** 0–100 from the rules alone. Claude, when present, refines the top of the list. */
export function ruleScore(title: string, description: string, location: string, remote: boolean): RuleScore {
  const t = tier(title);
  let s = t === "core" ? 55 : t === "stretch" ? 35 : 5;
  const why: string[] = [t === "core" ? "core title" : t === "stretch" ? "stretch title" : "off-target title"];
  const ai = aiSignal(title, description);
  const build = BUILD_WORDS.filter((r) => r.test(description)).length;
  s += Math.min(20, ai * 4);
  s += Math.min(12, build * 2);
  if (ai >= 3) why.push("AI is the work, not a feature");
  if (build >= 3) why.push("wants someone who ships");
  if (SENIOR.test(title)) {
    s += 6;
    why.push("senior band");
  }
  if (JUNIOR.test(title)) {
    s -= 25;
    why.push("junior band");
  }
  if (ADMIN_SURFACE.test(title) && !/\b(ai|agents?|agentic|llm|copilot)\b/i.test(title)) {
    s -= 14;
    why.push("admin surface, AI not in the title");
  }
  // rules alone top out below Claude's range, so an unscored posting never outranks a scored one
  s = Math.min(s, 72);
  if (!usOrRemote(location, remote)) {
    s -= 25;
    why.push("outside the US and not remote");
  }
  const persona: RuleScore["persona"] = t === "stretch" || (ai >= 4 && build >= 3) ? "ai-builder" : "designer-who-builds";
  return { score: Math.max(0, Math.min(100, Math.round(s))), why: why.join(" · "), persona, ai };
}
