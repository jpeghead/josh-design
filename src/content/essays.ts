/**
 * Hand-authored essays and build logs. Facts here come from the repo's own
 * git history; dates are real. (The Framer-era essays live in
 * writing.generated.ts.)
 */
import type { Essay } from "./writing.generated";

export const authoredEssays: Essay[] = [
  {
    slug: "what-the-builds-taught-me-about-models",
    title: "What the builds taught me about models",
    date: "2026-10-15T12:00:00.000Z",
    badge: "Notes",
    description:
      "Six things I now believe about building with language models, each one learned by shipping something on this site and watching it fail first.",
    image: "/img/lab/local.jpg",
    html: `
<p><strong>I don't trust claims about models that didn't cost the person anything.</strong> So here are six, each of which cost me something this week, with the build that taught it.</p>
<h3>1. Grounding is a formatting problem before it's a retrieval problem</h3>
<p>The on-device model on this site answers from a summary of the site's own text. The first version packed every project into one long paragraph. A half-billion-parameter model read it and told a visitor I worked at Spin from 2015 to 2017. I was there from 2019 to 2022. Nothing about the facts was wrong; the shape was. One fact per line, years first, a sentence in the system prompt saying "copy years exactly, never guess a date," and the same model stopped inventing. The retrieval was identical. The formatting did the work.</p>
<h3>2. A small model's mistakes are a feature if you show the comparison</h3>
<p>I almost pulled the on-device demo when it got that date wrong. Instead the page now says a one-billion-parameter model will get things wrong sometimes, and points at the hosted Claude as the comparison. The gap between them is the most honest thing on the page. People who build with models know the gap exists; hiding it would have read as not knowing.</p>
<h3>3. Hedging is not honesty. Grading is.</h3>
<p>The fourth agent pattern puts two answers side by side. One hedges every clause: "I believe it may have been around 2020, possibly during WWDC, though I can't be completely certain." The other grades each claim: this one is sourced, this one is inferred, this one I don't know. The hedged answer sounds careful and tells you nothing. The graded answer tells you exactly what to verify. Every model interface I design from now on grades.</p>
<h3>4. A permission prompt is a contract, and the narrowest yes should be the default</h3>
<p>Agents ask to run things. The usual prompt is a command and two buttons. The pattern I built shows what will be touched, whether it can be undone, whether it leaves the repo, and offers an allow that is exactly as wide as the command, never wider. Deny is a real option with a stated consequence. I learned this from the other side: I am the one approving an agent's commands all day, and the prompts that scare me are the ones that don't say what they'll touch.</p>
<h3>5. Verification is the whole job</h3>
<p>Every good commit in this repo starts with a screenshot. The bad days were the ones where a green type-check stood in for looking at the screen. The city's worst crash was a React re-render running sixty times a second because game state lived in the wrong place; no compiler would have caught it. When I work with an agent, the thing I actually do is verify. The agent proposes and builds; I look, at three screen sizes, with the console open, before anything ships.</p>
<h3>6. Cheap directions change how you decide</h3>
<p>Between July and October this site was eight different sites: an archive, a darkroom, a line drawing, a side-scrolling room, a playable city, a monochrome page, a photo-led portfolio, and the one you're reading. Each cost about a day. When a direction costs a day you stop arguing about it and build it, then kill it by looking at it. Most of them died in an afternoon. The ones that survived are in the Builds. I don't think I could have reasoned my way to this site. I had to build the wrong ones first, fast.</p>
<p>None of this is a framework. It's six scars. The builds are on the site if you want to press on them.</p>
`,
  },
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
