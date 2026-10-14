/**
 * Hand-authored essays and build logs. Facts here come from the repo's own
 * git history; dates are real. (The Framer-era essays live in
 * writing.generated.ts.)
 */
import type { Essay } from "./writing.generated";

export const authoredEssays: Essay[] = [
  {
    slug: "sixteen-days-in-whitehead-city",
    title: "Sixteen days in Whitehead City",
    date: "2026-10-14T12:00:00.000Z",
    badge: "Build log",
    description:
      "What happened when I pointed an agent at my own portfolio and asked for a game: eight directions, thirty-six commits, one playable city, and the reasons I shelved it.",
    image: "/img/lab/city.jpg",
    html: `
<p><strong>The question was simple.</strong> If one person and a coding agent can ship a product in a week, what happens when the product is your own life story, and you refuse to settle for a scroll-down page?</p>
<p>Between July 6 and July 22, 2026, I tried to find out. This is the log, reconstructed from the git history, with the parts that didn't work left in.</p>
<h3>Day one: an archive</h3>
<p>I started where portfolios start: a typed content layer. Career dates in one file with ground rules at the top (no vanity stats, clients never presented as employers, nothing fabricated), the old Framer site's images pulled into the repo, and a first pass at a cinematic canvas walk through the eras of my life.</p>
<p>It was fine. It was also the thing every designer's site already is.</p>
<h3>Days two and three: five directions in forty-eight hours</h3>
<p>This is where working with an agent gets strange. The cost of trying a whole direction dropped to about a day, so I tried five.</p>
<ul>
<li><p><strong>The Darkroom.</strong> The archive as a batch of prints you develop yourself. Beautiful idea, too slow to read.</p></li>
<li><p><strong>The Mediums.</strong> The story told as six mediums, one per chapter: crayon, charcoal, film, pixels, code, products.</p></li>
<li><p><strong>The Line.</strong> One unbroken drawing, from a kid's crayon to a world you're inside of, ending as a signature. Scroll scrubs the pen. This one I still like; it's in the Lab.</p></li>
<li><p><strong>The Room.</strong> A life as one side-scrolling house. Walk the silhouette, trigger a memory, the room redresses around you and you age. Then the Room became a game you could play.</p></li>
<li><p><strong>Whitehead City.</strong> On day three I wrote the commit message in capitals: a GTA-style open-world game of the life.</p></li>
</ul>
<h3>Days four through sixteen: the city</h3>
<p>The city won because it was the most alive. It started as a top-down toy with traffic and pedestrians, then became first person: you sit at my desk reading this site on the monitor, press escape, stand up, and walk out of the office, through the house, out the front door, into the city.</p>
<p>From there the log reads like a small studio's sprint board: real physics with Rapier, HDRI lighting and shadows, a rebuilt house with real architecture and colliders, CC0 furniture with PBR surfaces, true real-world scale, a Quake-style movement feel at 74 degrees of view, synthesized sound effects with no audio files, a load gate, an FPS overlay. Then a Half-Life-era re-skin: a style bible, a retro texture engine that posterizes and dithers every surface so imported models and procedural buildings share one material language. A weapon pass with a viewmodel, hitscan, and a rifle range. Drag-look when a browser denies pointer lock. A crash recorder that writes to local storage and shows a banner. A drivable car, wayfinding, a radar, saves. Ten story missions, 1993 to now, with credits.</p>
<p>Thirty-six commits. Every one build-green. The whole loop played end to end.</p>
<h3>What I learned about building with an agent</h3>
<p><strong>The agent doesn't get tired, so you have to be the taste.</strong> It will cheerfully build a tenth mission at the same quality as the first. Deciding that the first one isn't good enough yet is the job.</p>
<p><strong>Verification is the whole game.</strong> The useful commits all start with a screenshot. The bad days were the ones where a green type-check stood in for looking at the screen. A crash that ate a session turned out to be a React re-render running sixty times a second because game state was living in the wrong place.</p>
<p><strong>Constraints are free and they compound.</strong> Original or CC0 only. Three units to a meter. Doorways cut wider than real because real reads cramped in first person. One file is the single source of truth for every wall and opening. Each rule removed a category of future bug.</p>
<p><strong>Cheap directions change how you decide.</strong> When a direction costs a day, you stop arguing about it and build it. Five of the eight directions were killed by looking at them, not by debating them.</p>
<h3>Why it's on the back burner</h3>
<p>In October I audited it honestly. The city would never reach the bar of a shipped game without an art team, and the "retro" look had become a way of excusing low fidelity. A portfolio that asks you to install nothing but still needs a desktop, a keyboard, a mouse, and twenty-six megabytes of assets is asking a lot of a hiring manager on a phone.</p>
<p>So the site you're reading is the quiet version: the photographs, the work, the story, built with the same tools and the same loop. The city is still in the repo and still playable in the Lab. I'm glad it exists. It taught me more about shipping with AI in sixteen days than the year of reading about it before.</p>
`,
  },
];
