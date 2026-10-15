/**
 * The verified record: every claim a résumé or an application may make,
 * gathered on 2026-10-15 from LinkedIn (linkedin.com/in/byjoshwhitehead),
 * the 2026 résumé PDF, and the site's own content. Numbers are Josh's own
 * published numbers; nothing here is inferred. Dates come from
 * src/lib/data.ts, which is the locked timeline. Clients are clients, never
 * employers.
 *
 * Keyed by the `context` string in src/lib/data.ts. Each entry replaces the
 * bullets derived from the site for that role; roles not listed keep theirs.
 */
export type RecordBullet = { text: string; tags: string[] };

export const RECORD: Record<string, { role?: string; summary?: string; bullets: RecordBullet[] }> = {
  "Boneyard Collective — Founder": {
    role: "Founder & Design Lead",
    summary:
      "AI-native design and product studio. Client work for startups by day; our own AI products in between, designed and shipped end to end with coding agents in the loop every day.",
    bullets: [
      { text: "Design and ship AI products end to end: OLO (a desktop companion for the Mac), Weaver (a writing room that remembers a channel), StoryMode (game stories as audio), each live at its own site.", tags: ["ai", "shipping", "0-to-1", "engineering"] },
      { text: "Ship daily with coding agents (Claude Code, Codex): a typical day is 20 to 60 commits across 3 to 10 projects, measured from session logs rather than estimated.", tags: ["ai", "engineering", "shipping"] },
      { text: "Incubated OLO, a personal-intelligence product: set the product vision, assembled a founding team from Meta, Calm, and Saucey, and took it from concept through design to investor readiness.", tags: ["ai", "0-to-1", "leadership"] },
      { text: "Run a generative-video pipeline on Veo: measured shipped output (1.43 words of dialogue per second against a natural 2.6), traced the fault to one line of the brief, and rewrote the spec so every second of every shot is allocated.", tags: ["ai", "evals"] },
      { text: "Built josh.design as a working AI-builder portfolio: a language model running in the browser on WebGPU, a hosted Claude grounded in the site's own text, five agent-interface prototypes, and a playable 3D city built with a coding agent in sixteen days.", tags: ["ai", "engineering", "shipping"] },
      { text: "Open-sourced two of the builds (agent-ui-patterns, local-grounded-chat); the portfolio repo runs type-checks, tests, and a build on every push, with a public build log.", tags: ["engineering", "ai"] },
      { text: "Client work: product design, design systems, and AI tooling for Dreaming Spanish; mobile experiences built on AI voice transformation for Antares (Auto-Tune); digital comics pairing generative artwork with human-written stories for Glow; plus Step and Stacked.", tags: ["ai", "mobile", "design-systems", "clients"] },
      { text: "Wrote Mastery is Dead, a 618-page field manual on how AI is compressing twenty-five white-collar careers and what survives; in paperback and on Amazon.", tags: ["ai", "writing"] },
    ],
  },
  "Spin (Ford Mobility)": {
    role: "Senior Product Designer → Head of Design",
    bullets: [
      { text: "Joined as the first designer and became Head of Design; built and led a team of 10 across product design, brand, illustration, copy, and UX research.", tags: ["0-to-1", "leadership"] },
      { text: "Designed the App Clips experience Apple featured at WWDC 2020 as a flagship iOS 14 use case (covered in Wired), working with Apple to refine the scooter rental flow for the launch.", tags: ["partnerships", "shipping", "mobile"] },
      { text: "Led the Google Maps integration that put Spin vehicles on the map (August 2021): vehicle usage up 40%, new signups up 60%.", tags: ["partnerships", "shipping", "outcome"] },
      { text: "Built the foundational design system from zero across iOS, Android, and web, and localized the product and brand across 84 cities in two regions.", tags: ["design-systems", "0-to-1", "mobile", "brand"] },
      { text: "Designed safety features that cut city-official complaints by over 90% and reported accidents by 75%, and features that helped close 10+ city government contracts.", tags: ["outcome", "b2b", "mobile"] },
      { text: "Spin was acquired and merged into Bird.", tags: ["outcome"] },
    ],
  },
  "Hush (backed by Kleiner Perkins)": {
    role: "Senior Product Designer → Director of Design",
    bullets: [
      { text: "First designer at a social-commerce platform; owned product across iOS, Android, and web, then brand and the marketing site, as the product scaled past 1 million users.", tags: ["0-to-1", "leadership", "mobile", "brand"] },
      { text: "Took the apps from 200 App Store reviews at 3.5 stars (and no Google Play presence) to 50,000+ combined reviews at 4.8 stars through a research-led redesign and review prompts placed at the right moments.", tags: ["outcome", "mobile"] },
      { text: "Designed and shipped the company's first Android app, which grew to more than 30% of company revenue.", tags: ["shipping", "mobile", "outcome"] },
      { text: "Built an internal influencer-batching tool that halved deal closure time and handled 100+ influencer contracts.", tags: ["b2b", "engineering", "outcome"] },
      { text: "Promoted to Director of Design: led a team of three, shaped the roadmap with leadership, and pitched investors directly. Hush was acquired.", tags: ["leadership", "outcome"] },
    ],
  },
  "Very Good Ventures — client engagement": {
    role: "Principal Product Designer",
    bullets: [
      { text: "Created the Flutter.dev design system for Google and redesigned the mobile and desktop experiences: Figma components, variables, auto layout, shared documentation.", tags: ["design-systems", "partnerships", "shipping"] },
      { text: "Contributed concepts and gameplay QA to I/O FLIP, the generative-AI card game shown at Google I/O 2023, with Google teams.", tags: ["ai", "partnerships", "shipping"] },
      { text: "Turned client requirements into flows and prototypes, paired with engineering, and mentored designers across engagements from startups to Google.", tags: ["leadership", "engineering"] },
    ],
  },
  Saucey: {
    role: "Lead Product Designer",
    bullets: [
      { text: "Owned all design at an on-demand delivery startup: consumer apps, driver experience, partner tools, internal operations, and marketing.", tags: ["leadership", "mobile", "0-to-1"] },
      { text: "Designed referral features that lifted app referrals by more than 65%, and a driver experience that raised driver referrals 15% and cut turnover 25%.", tags: ["outcome", "mobile"] },
      { text: "Designed internal routing software (99.9% uptime) that cut order-status support tickets by more than 90%.", tags: ["b2b", "engineering", "outcome"] },
      { text: "Recognized by Apple as App of the Day and an Editor's Choice. First worked here with Andrew Zeck, later OLO's co-founder and CTO.", tags: ["partnerships", "outcome"] },
    ],
  },
  NationBuilder: {
    role: "Senior Designer",
    bullets: [
      { text: "Designed UX and UI for a civic-engagement CMS used by tens of thousands of campaigns and organizations, working daily with the founder on product and brand.", tags: ["b2b", "leadership"] },
      { text: "Led a story-driven brand and homepage redesign that repositioned the company ahead of a $6.25M raise led by Andreessen Horowitz; owned the homepage and pricing pages.", tags: ["brand", "outcome", "b2b"] },
      { text: "Built 10+ customizable templates for campaigns, nonprofits, and community organizations, and the look and feel for the CEO's book launch, site, and merchandise.", tags: ["shipping", "brand"] },
    ],
  },
  "Differential (studio)": {
    role: "Designer & Front-End Developer",
    bullets: [
      { text: "First designer at an engineering-first studio; helped take 10+ startups from concept to launch across e-commerce, health, and finance, as the sole design resource and de facto product manager.", tags: ["0-to-1", "engineering", "shipping"] },
      { text: "Arrived unable to code; taught myself HTML, CSS, and Meteor on the job and built the interfaces I designed. Introduced brand guidelines and design-engineering integration to the studio.", tags: ["engineering", "design-systems"] },
      { text: "Hosted the studio's first Cincinnati designer meetup.", tags: ["leadership"] },
    ],
  },
};

/**
 * Skills confirmed by Josh on 2026-10-15 that the site's skill list did not
 * name: user research and usability testing (on the 2026 résumé and at Hush,
 * Spin, and Saucey), JavaScript (the language under the React and TypeScript
 * work since Differential), customer and client collaboration (sole design
 * contact for Differential's clients, Dreaming Spanish and the Boneyard
 * clients, city governments at Spin), and AI/ML platform work (model APIs,
 * on-device inference, generative video pipelines).
 */
export const SKILLS_EXTRA: Record<string, string[]> = {
  "Product design": ["User research and usability testing", "Customer and client collaboration"],
  "AI & models": ["AI/ML platforms (model APIs, inference, on-device, generative video)"],
  Engineering: ["JavaScript"],
};

export const SERVICE_DETAIL = "Combat photographer with a Top Secret clearance; documented operations and VIP and presidential visits over five years of service.";
