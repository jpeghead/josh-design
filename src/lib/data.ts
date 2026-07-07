/**
 * The archive — real career data, locked to the master timeline.
 *
 * Ground rules baked into this file:
 *  - No vanity stats. Numbers are stated as before/after, framed as *my*
 *    contribution, never as company outcomes I'm borrowing credit for.
 *  - Client names are never presented as employers. Agency/studio work is
 *    labeled as such.
 *  - Nothing is fabricated. Where a specific can't be stated in one honest
 *    sentence, it isn't stated.
 */

export type ProjectTier = "case-study" | "bench";
export type ProjectStatus = "Live" | "Acquired" | "Archived" | "In flight";

export type Project = {
  slug: string;
  title: string;
  tier: ProjectTier;
  /** Framing-safe context line, e.g. "Spin (Ford Mobility)". Never implies employment where it wasn't. */
  context: string;
  role: string;
  timeline: string;
  scope: string[];
  status: ProjectStatus;
  /** One-line summary. */
  summary: string;
  /** The situation I walked into. */
  brief: string;
  /** What I did — my contribution, in plain bullets. */
  contribution: string[];
  /** Honest outcomes. Before/after where there's a real number. */
  outcome: string[];
  tools?: string[];
  featured?: boolean;
  /** Bench projects link internally rather than to a full case study. */
  internalLink?: string;
};

export const projects: Project[] = [
  {
    slug: "spin",
    title: "Spin",
    tier: "case-study",
    context: "Spin (Ford Mobility)",
    role: "Senior Product Designer → Head of Design",
    timeline: "May 2019 – Nov 2022",
    scope: ["Product", "Brand", "Design system", "Partnerships"],
    status: "Acquired",
    summary:
      "First product designer at the micromobility company. Built the design function from zero and led it through partnerships with Apple and Google, then an acquisition.",
    brief:
      "Spin was scaling shared scooters across cities faster than its design could keep up — no design system, no design team, and a product and brand that didn't match the operation running underneath them.",
    contribution: [
      "Joined as the first product designer and built the design org from the ground up, growing into Head of Design.",
      "Partnered directly with Apple to ship an App Clips experience, featured at WWDC 2020 alongside the iOS 14 launch.",
      "Designed the Google Maps integration that let riders find, rent, and reserve a vehicle straight from the map.",
      "Stood up the first shared design system and scaled the rider app and brand across markets.",
    ],
    outcome: [
      "Went from solo designer to Head of Design leading the team.",
      "Shipped the Apple and Google partnerships that put Spin in front of millions of new riders.",
      "Spin was acquired and merged into Bird.",
    ],
    tools: ["Figma", "ProtoPie"],
    featured: true,
  },
  {
    slug: "hush",
    title: "Hush",
    tier: "case-study",
    context: "Hush (backed by Kleiner Perkins)",
    role: "Senior Product Designer → Head of Design",
    timeline: "Mar 2017 – Jun 2019",
    scope: ["Product", "Brand", "Web", "0→1"],
    status: "Acquired",
    summary:
      "First product designer at a social-commerce startup. Owned the app, brand, and site, and rebuilt the product as it scaled past a million users.",
    brief:
      "Hush was a small, invite-only social-commerce app — beautiful, but underperforming. I came in as the first product designer to own the whole surface: app, brand, and site.",
    contribution: [
      "Redesigned the core app. The App Store rating went from about 3.5★ across ~200 reviews to 4.8★ across 50,000+.",
      "Designed and shipped the first Android app, opening a new revenue stream that grew to roughly 30% of revenue.",
      "Owned brand and the marketing site alongside the product as the team scaled.",
    ],
    outcome: [
      "Grew from first designer to Head of Design.",
      "The product scaled past 1M+ users.",
      "Hush was acquired.",
    ],
    tools: ["Figma", "Sketch"],
    featured: true,
  },
  {
    slug: "vgv",
    title: "Very Good Ventures",
    tier: "case-study",
    context: "Very Good Ventures — client engagement",
    role: "Principal Product Designer",
    timeline: "Nov 2022 – Dec 2023",
    scope: ["Design system", "Brand", "Product"],
    status: "Live",
    summary:
      "Principal designer at the leading Flutter studio. Designed a Flutter design system adopted across VGV and Google teams, and a generative-AI game shown at Google I/O 2023.",
    brief:
      "VGV is the market leader for Flutter design and development. As Principal Product Designer I worked across their most visible engagements, including work with Google. (For scale, the surrounding engagement sat inside roughly $1M in contracts and a $3.4M raise — context, not a number I'm claiming.)",
    contribution: [
      "Designed the Flutter design system adopted across VGV and Google teams.",
      "Designed a generative-AI card game demoed at Google I/O 2023.",
    ],
    outcome: [
      "The design system shipped and was adopted across teams.",
      "The I/O 2023 work reached the conference's global audience.",
    ],
    tools: ["Figma", "Flutter"],
    featured: true,
  },
  {
    slug: "saucey",
    title: "Saucey",
    tier: "bench",
    context: "Saucey",
    role: "Lead Product Designer",
    timeline: "Oct 2015 – Feb 2017",
    scope: ["iOS", "Marketplace", "On-demand"],
    status: "Live",
    summary:
      "Lead product designer on the on-demand alcohol delivery app, before the category had a name.",
    brief:
      "A three-sided, regulated marketplace that had to feel effortless while doing real coordination underneath.",
    contribution: [
      "Led design on the consumer iOS app, reducing the order flow to something you could do one-handed.",
      "Shaped the store, tip, and ID-check flows around defaults instead of configuration.",
    ],
    outcome: [
      "Recognized by Apple as App of the Day and an Editor's Choice.",
    ],
    tools: ["Sketch"],
  },
  {
    slug: "nationbuilder",
    title: "NationBuilder",
    tier: "bench",
    context: "NationBuilder",
    role: "Senior Designer",
    timeline: "Nov 2014 – Sep 2015",
    scope: ["SaaS", "Civic"],
    status: "Live",
    summary:
      "Senior designer on software for the people running campaigns, movements, and offices.",
    brief:
      "One product for a campaign manager and a first-week volunteer, with no time for either of them to learn it.",
    contribution: [
      "Rebuilt core dashboards around what people actually do in the final stretch of a campaign.",
      "Designed for the worst day, not the average day.",
    ],
    outcome: [
      "Used across tens of thousands of campaigns and organizations.",
      "Recommendation on file from co-founder Jesse Haff.",
    ],
  },
  {
    slug: "differential",
    title: "Differential",
    tier: "bench",
    context: "Differential (studio)",
    role: "Designer & Front-End Developer",
    timeline: "Nov 2013 – Oct 2014",
    scope: ["Web", "Front-end"],
    status: "Archived",
    summary:
      "First design job out of the Marine Corps. Designed and built websites and apps for startups — and learned to code on the job.",
    brief: "New industry, new skill, new city, no playbook.",
    contribution: [
      "Designed in the morning, built the front-end in the afternoon, learned the rest at night.",
      "Took every project I could get my hands on.",
    ],
    outcome: ["Built the muscle that made everything after it possible."],
  },
  {
    slug: "boneyard",
    title: "Boneyard Collective",
    tier: "bench",
    context: "Boneyard Collective — Founder",
    role: "Founder & Design Lead",
    timeline: "Jan 2024 – Present",
    scope: ["Studio", "Product", "Brand"],
    status: "In flight",
    summary:
      "My studio. Client work by day, our own products in between — where the case studies stop and the making continues.",
    brief:
      "The thesis: shipping our own products gives us scars, and the scars make the client work better.",
    contribution: [
      "Founded the studio and lead its design.",
      "Build and ship a slate of our own products — see Products.",
    ],
    outcome: ["Live and building."],
    internalLink: "/products",
  },
];

export type CareerFrame = {
  span: string;
  org: string;
  role: string;
  location: string;
  note?: string;
};

/** Locked to the master timeline. Never improvise these. */
export const career: CareerFrame[] = [
  {
    span: "2008 – 2013",
    org: "U.S. Marine Corps",
    role: "Combat Photographer",
    location: "Camp Pendleton · deployed",
    note: "Five years behind a camera in places that didn't ask for one. Where it clicked.",
  },
  {
    span: "2013 – 2014",
    org: "Differential",
    role: "Designer & Front-End Developer",
    location: "Indianapolis, IN",
    note: "First design job. Learned how to ship — and how to code.",
  },
  {
    span: "2014 – 2015",
    org: "NationBuilder",
    role: "Senior Designer",
    location: "Los Angeles, CA",
    note: "Software for the people running campaigns.",
  },
  {
    span: "2015 – 2017",
    org: "Saucey",
    role: "Lead Product Designer",
    location: "Los Angeles, CA",
    note: "On-demand, before the category had a category.",
  },
  {
    span: "2017 – 2019",
    org: "Hush",
    role: "Senior Product Designer → Head of Design",
    location: "Los Angeles, CA",
    note: "Social commerce. First designer in. Left as Head of Design.",
  },
  {
    span: "2019 – 2022",
    org: "Spin (Ford Mobility)",
    role: "Senior Product Designer → Head of Design",
    location: "San Francisco, CA",
    note: "First product designer. Built the org. Apple and Google partnerships.",
  },
  {
    span: "2022 – 2023",
    org: "Very Good Ventures",
    role: "Principal Product Designer",
    location: "Remote · Los Angeles, CA",
    note: "Flutter design system across VGV and Google. Contract work with Antares/Auto-Tune and Glow through 2024.",
  },
  {
    span: "2024 – Present",
    org: "Boneyard Collective",
    role: "Founder & Design Lead",
    location: "Los Angeles, CA",
    note: "My studio. Building for clients and for ourselves.",
  },
];

/**
 * Selected client work — reached through studios and agencies (Differential,
 * Very Good Ventures, Boneyard) and direct product roles. These are engagements,
 * not employers. Never present a name in a way that implies employment.
 */
export const clientRollFraming =
  "Selected client work — through studios and agencies including Differential, Very Good Ventures, and Boneyard.";

export const clientRoll = [
  "Apple",
  "Google",
  "Ford",
  "Coca-Cola",
  "Lime",
  "Bird",
  "Webflow",
  "Kleiner Perkins",
  "Saucey",
  "Spin",
  "Hush",
  "NationBuilder",
  "Differential",
  "Very Good Ventures",
  "Boneyard",
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
