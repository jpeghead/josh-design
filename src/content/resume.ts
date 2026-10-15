/**
 * The résumé, in the words job posts use. Every line maps to a fact in
 * src/lib/data.ts, src/content/about.ts, or a build on this site.
 */
export const resume = {
  name: "Josh Whitehead",
  title: "Product Designer & AI Builder",
  location: "Los Angeles, CA · remote-friendly",
  email: "josh@josh.design",
  site: "https://josh.design",
  summary:
    "Product designer with 15 years shipping consumer and B2B software, twice the first designer who became Head of Design (both companies acquired), and now an AI builder: I design and ship AI products end to end with coding agents in the loop. Comfortable in Figma and in the code editor. Former U.S. Marine Corps combat photographer.",
  targets: ["AI Product Designer", "Design Engineer", "Founding Designer", "AI Product Builder", "Head of Design"],
  skills: {
    "AI & models": [
      "LLM product design",
      "Prompt and context engineering",
      "Grounding / RAG-style retrieval",
      "Streaming UI for model output",
      "On-device inference (WebGPU, WebLLM)",
      "Agent interaction design (progress, permissions, failure, confidence)",
      "Agentic development with Claude Code and Codex",
      "Anthropic SDK",
    ],
    "Product design": ["0→1 product design", "Design systems", "Brand", "Mobile (iOS, Android, Flutter)", "Web", "Design leadership", "Partnerships (Apple, Google)"],
    Engineering: ["TypeScript", "React", "Next.js", "Tailwind", "Three.js / React Three Fiber", "GLSL shaders", "Flutter"],
    Tools: ["Figma", "Framer", "ProtoPie", "Sketch", "Claude Code", "Codex", "Vercel", "GitHub"],
  },
};
