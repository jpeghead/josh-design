/**
 * The text the live demo is allowed to know: the real content of this site,
 * flattened. Nothing here is written for the model; it is the site.
 */
import { aboutParagraphs, identityLine, socials } from "./about";
import { products } from "./products";
import { books } from "./books";
import { career, projects, principles, clientRoll, clientRollFraming } from "@/lib/data";
import { lab } from "./lab";

export function groundingText(): string {
  const out: string[] = [];
  out.push(`# Josh Whitehead\n${identityLine}\nBased in Los Angeles. Site: josh.design. Email: josh@josh.design.`);
  out.push(`## About\n${aboutParagraphs.join("\n\n")}`);
  out.push(`## Career timeline (locked, factual)\n${career.map((c) => `- ${c.span}: ${c.org} — ${c.role}, ${c.location}.${c.note ? " " + c.note : ""}`).join("\n")}`);
  out.push(
    `## Projects\n${projects
      .map(
        (p) =>
          `### ${p.title} (${p.context}) — ${p.role}, ${p.timeline}, status ${p.status}\nSummary: ${p.summary}\nBrief: ${p.brief}\nContribution:\n${p.contribution.map((c) => "- " + c).join("\n")}\nOutcome:\n${p.outcome.map((o) => "- " + o).join("\n")}${p.tools ? `\nTools: ${p.tools.join(", ")}` : ""}\nURL: /work/${p.slug}`
      )
      .join("\n\n")}`
  );
  out.push(`## Clients\n${clientRollFraming}\n${clientRoll.join(", ")}`);
  out.push(`## Products at Boneyard\n${products.map((p) => `- ${p.name} (${p.status}): ${p.tagline} ${p.blurb} ${p.detail.join(" ")} URL: /products/${p.slug}`).join("\n")}`);
  out.push(`## Books\n${books.map((b) => `- ${b.title}${b.subtitle ? ": " + b.subtitle : ""} (${b.kind}, ${b.status}${b.year ? ", " + b.year : ""}): ${b.blurb}`).join("\n")}`);
  out.push(`## Lab (things built with AI in the loop)\n${lab.map((l) => `- ${l.title} (${l.kind}, ${l.when}): ${l.blurb} Built with: ${l.built}. URL: ${l.href}`).join("\n")}`);
  out.push(`## Principles\n${principles.map((p) => `- ${p.title} ${p.body}`).join("\n")}`);
  out.push(`## Elsewhere\n${socials.map((s) => `- ${s.label}: ${s.href}`).join("\n")}`);
  return out.join("\n\n");
}

/** A compact grounding for small on-device models: one fact per line, dates first. */
export function groundingSummary(): string {
  const out: string[] = [];
  out.push(`Josh Whitehead is a product designer who builds AI products, based in Los Angeles. Email: josh@josh.design.`);
  out.push(`CAREER, in order (years are exact):`);
  career.forEach((c) => out.push(`- ${c.span}: ${c.org}. Role: ${c.role}.`));
  out.push(`PROJECTS (years are exact):`);
  projects.forEach((p) => out.push(`- ${p.title}, ${p.timeline}. Role: ${p.role}. ${p.summary} Outcome: ${p.outcome.join(" ")}`));
  out.push(`PRODUCTS Josh is building at his studio Boneyard (none shipped yet unless marked Released):`);
  products.forEach((p) => out.push(`- ${p.name}: ${p.tagline} Status: ${p.status}.`));
  out.push(`BUILDS made with AI agents:`);
  lab.forEach((l) => out.push(`- ${l.title} (${l.when}): ${l.blurb.split(". ")[0]}.`));
  out.push(`BACKGROUND: ${aboutParagraphs[0]}`);
  return out.join("\n");
}
