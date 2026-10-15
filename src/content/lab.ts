/**
 * The Lab — things built to see if they could be built. Every entry is
 * real and runs in this repo; "built with" names the actual tools.
 */
export type LabEntry = {
  slug: string;
  title: string;
  kind: "Playable" | "Interactive" | "Live model" | "Live beta" | "Prototype" | "This site";
  blurb: string;
  built: string;
  when: string;
  href: string;
  image?: string;
  aspect?: string;
  desktopOnly?: boolean;
  live?: boolean;
};

export const lab: LabEntry[] = [
  {
    slug: "portrait",
    title: "Portrait",
    kind: "Live beta",
    blurb:
      "Spotify Wrapped for your chat history. Drop in the export you can already download from ChatGPT or Claude and get a portrait of how you think: when you write, what you keep asking, how you open. Runs entirely in the browser; nothing is uploaded.",
    built: "TypeScript · parsers for ChatGPT and Claude exports · local analysis · no server",
    when: "October 2026",
    href: "/lab/portrait",
    image: "/img/lab/portrait.jpg",
    aspect: "16 / 10",
    live: true,
  },
  {
    slug: "local",
    title: "A model in your browser",
    kind: "Live model",
    blurb:
      "A language model running on your GPU through WebGPU. No server, no key, nothing leaves your machine. Weights stream once and cache; it's grounded on this site's text, trimmed for a small context window.",
    built: "WebLLM · WebGPU · Qwen 2.5 0.5B / Llama 3.2 1B · streaming",
    when: "October 2026",
    href: "/lab/local",
    image: "/img/lab/local.jpg",
    aspect: "16 / 10",
    live: true,
  },
  {
    slug: "particles",
    title: "A life in particles",
    kind: "Interactive",
    blurb:
      "Four photographs of my life sampled into 65,536 GPU particles that morph from the school photo to the Marine to the shipped product to the city built with an agent. Two custom shaders, one draw call, pointer physics.",
    built: "Three.js · GLSL · React Three Fiber · no library effects",
    when: "October 2026",
    href: "/lab/particles",
    image: "/img/lab/particles.jpg",
    aspect: "16 / 10",
  },
  {
    slug: "city",
    title: "Whitehead City",
    kind: "Playable",
    blurb:
      "A GTA-style open world of my life, playable in the browser. Start at my desk, stand up, walk out of the house, drive the city, shoot the rifle range, play ten missions from 1993 to now. Built in sixteen days as an experiment in what one person and an agent can ship.",
    built: "Claude Code · Next.js · React Three Fiber · Rapier physics · procedural textures and synthesized audio, no asset downloads",
    when: "July 2026",
    href: "/lab/city",
    image: "/img/lab/city.jpg",
    aspect: "16 / 10",
    desktopOnly: true,
  },
  {
    slug: "agents",
    title: "Agent UI patterns",
    kind: "Interactive",
    blurb:
      "Four working prototypes for the hard parts of agent interfaces: progress you can trust, permissions with real scope, failure that recovers, and answers that say how sure they are. Simulated model, real interface.",
    built: "React · simulated model · keyboard-first",
    when: "October 2026",
    href: "/lab/agents",
    image: "/img/lab/agents.jpg",
    aspect: "16 / 10",
  },
  {
    slug: "ask",
    title: "Ask my portfolio",
    kind: "Live model",
    blurb:
      "A live Claude, grounded in the real text of this site, that answers questions about my work. Streams, cites what it used, and says when it doesn't know.",
    built: "Claude · Anthropic SDK · Next.js route handler · streaming",
    when: "October 2026",
    href: "/lab/ask",
    image: "/img/lab/ask.jpg",
    aspect: "16 / 10",
    live: true,
  },
  {
    slug: "studio",
    title: "The studio",
    kind: "Prototype",
    blurb:
      "One persistent 3D room conducted by native scroll: my desk at night, then the camera swings to the wall where the Corps still hangs as daylight comes through the window. A vertical slice of a scroll-driven portfolio.",
    built: "Claude Code · React Three Fiber · CC0 PBR materials · procedural surfaces",
    when: "October 2026",
    href: "/lab/studio",
    image: "/img/lab/studio.jpg",
    aspect: "16 / 10",
    desktopOnly: true,
  },
  {
    slug: "line",
    title: "The line",
    kind: "Prototype",
    blurb:
      "One unbroken drawing, from a kid's crayon to a world you're inside of, ending as a signature. Scroll scrubs the pen.",
    built: "Claude Code · Canvas 2D · scroll-scrubbed path",
    when: "July 2026",
    href: "/lab/line",
    image: "/img/lab/line.jpg",
    aspect: "16 / 10",
  },
  {
    slug: "room",
    title: "The room",
    kind: "Playable",
    blurb:
      "A life as one side-scrolling house. Walk the silhouette, trigger a memory, and the room redresses around you as the year rolls over. Kid, teen, Marine, adult.",
    built: "Claude Code · Canvas 2D · hand-drawn room states",
    when: "July 2026",
    href: "/lab/room",
    image: "/img/lab/room.jpg",
    aspect: "16 / 10",
  },
  {
    slug: "site",
    title: "This site",
    kind: "This site",
    blurb:
      "Designed and built in the open with an agent in the loop: Next.js, one serif, real photographs, CSS reveals that work without JavaScript, every image sized by a script. The repo holds every experiment above.",
    built: "Claude Code · Codex · Next.js 15 · Tailwind 4 · motion",
    when: "Ongoing",
    href: "/lab/site",
  },
];

/** Flip to true once github.com/jpeghead/josh-design is public. */
export const REPO = { url: "https://github.com/jpeghead/josh-design", isPublic: true };
