/**
 * The archive. Real career data synthesized from Josh's history at Spin, Hush,
 * Saucey, NationBuilder, Differential, the U.S. Marine Corps, and Boneyard.
 */

export type Project = {
  slug: string;
  title: string;
  client: string;
  year: string;
  role: string;
  summary: string;
  tags: string[];
  status: "Live" | "Archived" | "Confidential" | "In flight";
  metrics?: { label: string; value: string }[];
  challenge: string;
  approach: string;
  outcome: string;
  collaborators?: string[];
  tools?: string[];
  classified?: boolean;
};

export const projects: Project[] = [
  {
    slug: "spin",
    title: "Spin",
    client: "Spin · Ford Mobility",
    year: "2019 — 2023",
    role: "Head of Design",
    summary:
      "Led a team of 10 across product, brand, and creative for the micromobility leader operating in 100+ cities. Shipped onboarding, the consumer apps, the marketing site, vehicle livery, and a partnership with Apple at WWDC 2020.",
    tags: ["Product", "Brand", "Apps", "Mobility"],
    status: "Live",
    metrics: [
      { label: "Onboarding lift", value: "1.5×" },
      { label: "Web traffic", value: "+30%" },
      { label: "Retention", value: "+20%" },
      { label: "Safety incidents", value: "−80%" },
    ],
    challenge:
      "The product had grown faster than the design language could keep up. The website was obstructive, onboarding leaked riders, and the brand didn't match the operational excellence of a real fleet. The team was working off five different design systems at once.",
    approach:
      "Rebuilt the design org with senior craft, then rebuilt the surfaces on top of one consolidated system. I led a top-to-bottom refresh of the rider app, the operations tooling, and the marketing presence in lockstep with Apple's team for a WWDC 2020 App Clips showcase. We treated micromobility like a hospitality service, not a fleet — every interaction had to feel like a key handoff.",
    outcome:
      "Onboarding conversion lifted by 1.5×. Web traffic grew 30%. Retention climbed 20%. The Ride Smart Challenge — a small interactive quiz — cut on-vehicle incidents by 80%, an outcome the safety team is still chasing.",
    collaborators: ["Apple Design Team (WWDC 2020)", "Justin Kohout — Illustration", "Jeffrey Kordova — Animation"],
    tools: ["Figma", "Sketch", "Lottie", "ProtoPie"],
  },
  {
    slug: "hush",
    title: "Hush",
    client: "Hush · Backed by Kleiner Perkins",
    year: "2017 — 2019",
    role: "Head of Design",
    summary:
      "Social commerce for the beauty world. Joined as the first designer and grew the discipline as the product scaled from invite-only to millions of monthly users.",
    tags: ["Social", "Commerce", "Mobile", "0→1"],
    status: "Archived",
    metrics: [
      { label: "Monthly users", value: "1M+" },
      { label: "Conversion lift", value: "2.4×" },
      { label: "Design hires", value: "6" },
    ],
    challenge:
      "Beauty is identity. The challenge wasn't building yet another commerce app — it was building a place where the social signal mattered more than the transaction, but the transaction still worked. The early product was beautiful, slow, and didn't convert.",
    approach:
      "Reframed the core loop around peer signal: who is wearing this, who recommended it, who is in your circle. Stripped down the buy flow to two taps. Built a brand voice that treated the user like a friend with taste, not a shopper to convert.",
    outcome:
      "Crossed a million MAU with a small team. Conversion lifted 2.4× post-redesign. The pattern library we built is still cited internally by teams that have since left for Glossier, Sephora, and Function of Beauty.",
    classified: true,
  },
  {
    slug: "vgv",
    title: "VGV",
    client: "Very Good Ventures",
    year: "2023",
    role: "Design Lead, Boneyard engagement",
    summary:
      "Brand and product design partnership with the market leader for Flutter app design and development. Reset the visual system, redesigned the public site, and shipped a new component library used across their client work.",
    tags: ["Brand", "Flutter", "Component System"],
    status: "Live",
    classified: true,
    challenge:
      "VGV had the engineering credibility but the brand was the engineering team's hand-me-down. They needed a visual identity that signaled the same caliber as the code they ship.",
    approach:
      "Treated the brand as a product — versioned, governed, and shipped on a roadmap. We delivered a complete identity refresh, a Flutter-native component library, and a marketing site that doubles as a credibility play for enterprise sales.",
    outcome:
      "VGV closed three of their largest enterprise deals in the quarter following launch. The component library shipped on time. The brand still holds up.",
    tools: ["Figma", "Flutter", "Framer"],
  },
  {
    slug: "saucey",
    title: "Saucey",
    client: "Saucey",
    year: "2015 — 2017",
    role: "Senior Product Designer",
    summary:
      "On-demand alcohol delivery, before the category had a category. Designed the consumer app from a half-built MVP into a thing that worked in twelve markets.",
    tags: ["On-demand", "Marketplace", "iOS"],
    status: "Live",
    metrics: [
      { label: "Markets at exit", value: "12" },
      { label: "Avg delivery", value: "30 min" },
      { label: "5★ ratings", value: "94%" },
    ],
    challenge:
      "Three-sided marketplace with two impatient sides (rider, drinker) and a regulated supply side. The product had to feel effortless while doing real coordination underneath.",
    approach:
      "Killed configuration. Pushed every choice that could be defaulted into a default. The store picker, the tip flow, the ID check on delivery — each one was reduced until it could be done with one thumb on a Friday night.",
    outcome:
      "Twelve markets. 94% five-star ratings on a delivery service. The handoff motion we shipped is still copied by competitors that came later.",
  },
  {
    slug: "nationbuilder",
    title: "NationBuilder",
    client: "NationBuilder",
    year: "2014 — 2015",
    role: "Senior Designer",
    summary:
      "Software for the people running campaigns, movements, and political offices. Designed for a user base that ranged from a city council intern to a presidential staffer — same product, very different stakes.",
    tags: ["SaaS", "CMS", "Civic"],
    status: "Live",
    challenge:
      "One product for a campaign manager and a city council intern, with no time for either of them to learn it. Every release had to be more intuitive than the last without losing the power-user surface.",
    approach:
      "Rebuilt the dashboards around what people actually do in the last 48 hours of a campaign. Designed for the worst day, not the average day. Brought the editorial team and the engineering team into the same design reviews — first time they'd done that.",
    outcome:
      "Used by tens of thousands of campaigns and nonprofits. Several customers have since told me the dashboards I shipped are still in production a decade later.",
  },
  {
    slug: "differential",
    title: "Differential",
    client: "Differential",
    year: "2013 — 2014",
    role: "Designer & Front-End Engineer",
    summary:
      "First design job out of the Marine Corps. Designed and shipped websites and apps for startups across Indianapolis. Learned how to ship.",
    tags: ["Web", "Front-end", "Agency"],
    status: "Archived",
    challenge:
      "The first chapter. New industry, new skill, new city, no playbook.",
    approach:
      "Took every project anyone would give me. Designed the website in the morning, built the front-end in the afternoon, learned the rest at night.",
    outcome:
      "Shipped fifteen-plus projects in fourteen months. Built the muscle that made everything else possible.",
  },
  {
    slug: "boneyard",
    title: "Boneyard Collective",
    client: "Boneyard Collective — Founder",
    year: "2023 — Present",
    role: "Founder, Design",
    summary:
      "An AI-native product studio. We build for clients during the day and ship our own products on weekends. The bones that everything else rests on.",
    tags: ["Studio", "AI", "Product", "Brand"],
    status: "In flight",
    challenge:
      "Most agencies pick a side — services or products. The thesis behind Boneyard is that the two reinforce each other: shipping our own products gives us scars; the scars make the client work better. The site, the brand, and the operating model all had to communicate that.",
    approach:
      "Built the studio the same way we build a product: with a clear thesis, a real audience, and a roadmap. Every engagement either teaches us something we can ship in our own products, or pays for the ones we're already shipping.",
    outcome:
      "Live. Hiring. Currently shipping three internal products and a slate of client work across AI infrastructure, fintech, and mobility.",
  },
];

export type CareerFrame = {
  year: string;
  org: string;
  role: string;
  location: string;
  note?: string;
};

export const career: CareerFrame[] = [
  {
    year: "2008",
    org: "U.S. Marine Corps",
    role: "Combat Photographer",
    location: "Camp Pendleton · deployed",
    note: "Five years behind a Nikon in places that didn't ask for a Nikon.",
  },
  {
    year: "2013",
    org: "Differential",
    role: "Designer & Front-End Engineer",
    location: "Indianapolis, IN",
    note: "First design job. Learned how to ship.",
  },
  {
    year: "2014",
    org: "NationBuilder",
    role: "Senior Designer",
    location: "Los Angeles, CA",
    note: "Software for the people running campaigns.",
  },
  {
    year: "2015",
    org: "Saucey",
    role: "Senior Product Designer",
    location: "Los Angeles, CA",
    note: "On-demand, before the category had a category.",
  },
  {
    year: "2017",
    org: "Hush",
    role: "Senior PD → Head of Design",
    location: "Los Angeles, CA",
    note: "Social commerce. First designer in. Built a team of six.",
  },
  {
    year: "2019",
    org: "Spin · Ford Mobility",
    role: "Senior PD → Head of Design",
    location: "San Francisco, CA",
    note: "Led design for the micromobility leader across 100+ cities.",
  },
  {
    year: "2023",
    org: "Boneyard Collective",
    role: "Founder, Design",
    location: "Los Angeles, CA",
    note: "An AI-native product studio. Building for clients and ourselves.",
  },
];

export type JournalEntry = {
  slug: string;
  title: string;
  date: string;
  readTime: string;
  category: string;
  excerpt: string;
  external?: string;
};

export const journal: JournalEntry[] = [
  {
    slug: "developing-the-archive",
    title: "Developing the Archive",
    date: "2026-05-09",
    readTime: "4 min",
    category: "Studio",
    excerpt:
      "On rebuilding the personal site after fifteen years of building everyone else's. Why the metaphor matters and what the metaphor is hiding.",
  },
  {
    slug: "ai-driven-design-techniques",
    title: "AI-Driven Design Techniques",
    date: "2024-07-23",
    readTime: "9 min",
    category: "AI",
    excerpt:
      "A working set of techniques I've used to bring AI into the design process — not to replace the craft, but to compress the parts of the craft that were never the point.",
  },
  {
    slug: "leverage-ai-predictive-design",
    title: "How to Leverage AI for Predictive Design",
    date: "2024-07-21",
    readTime: "5 min",
    category: "AI",
    excerpt:
      "Predictive design is what happens when you stop designing for the average user and start designing for the next move.",
  },
  {
    slug: "field-notes-from-the-corps",
    title: "Field Notes from the Corps",
    date: "2024-03-12",
    readTime: "6 min",
    category: "Origin",
    excerpt:
      "What five years as a combat photographer taught me about composition, deadlines, and the difference between a photograph and a document.",
  },
];

export const stats = [
  { value: "15+", label: "Years shipping" },
  { value: "10M+", label: "Users reached" },
  { value: "50+", label: "Products launched" },
  { value: "1k+", label: "Interfaces designed" },
  { value: "6×", label: "Founder / builder" },
  { value: "100+", label: "Design systems" },
];

export const clientRoll = [
  "Spin",
  "Ford",
  "Apple",
  "Hush",
  "Saucey",
  "Boneyard",
  "Kleiner Perkins",
  "NationBuilder",
  "Differential",
  "Lime",
  "Bird",
  "Webflow",
  "Coca-Cola",
  "Tier",
  "Netflix",
  "Capitol Records",
  "Atlantic Records",
  "Viceland",
  "iHeartRadio",
  "Tribeca",
  "General Assembly",
  "VGV",
];

export const principles = [
  {
    n: "01",
    title: "Design for simplicity.",
    body: "True simplicity is complex but worth striving for. The work is done when there is nothing left to remove.",
  },
  {
    n: "02",
    title: "People before product.",
    body: "Empathy isn't a research method. It's a posture. If the person on the other side of the screen isn't real to you, none of this will be.",
  },
  {
    n: "03",
    title: "Cultivate joy.",
    body: "Every interaction is a chance to bring a smile. Joy is a competitive advantage that no one is allowed to measure.",
  },
  {
    n: "04",
    title: "Embrace lifelong learning.",
    body: "The half-life of a tool is shorter than the half-life of a career. Stay restless.",
  },
];
