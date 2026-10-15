/**
 * Ten ways to set the same document. Every one is a single column of real
 * text with standard headings, round bullets, dates beside the employer,
 * nothing in tables, headers, or images, so each parses the same; what
 * changes is the typography and the rhythm. They borrow from the site: the
 * serif for story, Geist for interface, mono eyebrows, hairline rules, one
 * ink and, in two of them, one quiet accent.
 */
export type Template = {
  id: string;
  name: string;
  blurb: string;
  /** Dates set flush right on the title line (still after the title in reading order). */
  datesRight?: boolean;
  css: string;
};

const SERIF = '"Instrument Serif", Georgia, serif';
const SANS = '"Geist", -apple-system, "Helvetica Neue", Arial, sans-serif';
const MONO = '"Geist Mono", ui-monospace, "SF Mono", Menlo, monospace';

export const TEMPLATES: Template[] = [
  {
    id: "story",
    name: "Story",
    blurb: "The site's own voice: serif name and titles, Geist body, hairline rules.",
    css: ``,
  },
  {
    id: "eyebrow",
    name: "Eyebrow",
    blurb: "Mono eyebrows like the site's labels, serif name, a heavier top rule.",
    css: `
      h2 { font-family: ${MONO}; font-size: 7.6pt; letter-spacing: 0.05em; color: #666; border-bottom: 0; padding-bottom: 0; margin-top: 12pt; }
      header { border-bottom: 1.2pt solid #141414; }
      h3 { font-size: 13pt; }
      .meta { font-family: ${MONO}; font-size: 8.2pt; color: #555; }`,
  },
  {
    id: "grotesk",
    name: "Grotesk",
    blurb: "All Geist. Big name, medium-weight titles, tighter leading. The most ordinary-looking and the most neutral.",
    css: `
      h1 { font-family: ${SANS}; font-weight: 600; font-size: 24pt; letter-spacing: -0.02em; }
      h3 { font-family: ${SANS}; font-weight: 500; font-size: 11pt; letter-spacing: -0.005em; }
      body { line-height: 1.33; }
      header { border-bottom: 0.5pt solid #d9d9d4; }`,
  },
  {
    id: "editorial",
    name: "Editorial",
    blurb: "Serif throughout, like the site's story pages: the summary as a standfirst, role lines in serif, Geist only for labels.",
    css: `
      body { font-family: ${SERIF}; font-size: 10.6pt; line-height: 1.3; }
      h1 { font-size: 34pt; }
      .headline, .contact, h2, .meta, strong, .skill strong { font-family: ${SANS}; }
      .lead { font-size: 12.5pt; line-height: 1.32; color: #1a1a1a; }
      h3 { font-size: 14pt; }
      h2 { color: #141414; border-bottom-color: #141414; }
      strong { font-weight: 500; font-size: 9.4pt; }
      @page { margin: 0.5in 0.72in 0.55in; }`,
  },
  {
    id: "rules",
    name: "Rules",
    blurb: "A thick rule under the name, a rule above every section, the rest quiet.",
    css: `
      header { border-bottom: 2pt solid #141414; padding-bottom: 8pt; }
      h2 { border-bottom: 0; border-top: 0.7pt solid #141414; padding-top: 4pt; margin-top: 9pt; margin-bottom: 2pt; color: #141414; }
      h3 { font-size: 13pt; }`,
  },
  {
    id: "compact",
    name: "Compact",
    blurb: "Smaller type, tighter spacing; room for one more bullet per role on two pages.",
    css: `
      body { font-size: 8.9pt; line-height: 1.32; }
      h1 { font-size: 26pt; }
      h3 { font-size: 12pt; }
      .lead { font-size: 9.6pt; }
      article { margin-top: 6pt; }
      h2 { margin-top: 9pt; }
      li { margin-bottom: 1pt; }`,
  },
  {
    id: "airy",
    name: "Airy",
    blurb: "Wider margins and more air between lines; the type a touch smaller to pay for it.",
    css: `
      body { font-size: 9pt; line-height: 1.4; }
      article { margin-top: 8pt; }
      h2 { margin-top: 11pt; }
      .lead { font-size: 9.8pt; line-height: 1.48; }
      h1 { font-size: 33pt; }
      li { margin-bottom: 1pt; }
      @page { margin: 0.5in 0.75in 0.55in; }`,
  },
  {
    id: "ledger",
    name: "Ledger",
    blurb: "Dates set flush right on the title line, like a ledger; company below.",
    datesRight: true,
    css: `
      .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12pt; }
      .row .dates { font-family: ${MONO}; font-size: 8.4pt; color: #666; white-space: nowrap; }
      h3 { font-size: 13pt; }`,
  },
  {
    id: "ink",
    name: "Ink",
    blurb: "One warm ink, oxblood, on the name, the role titles, and the rules; everything else stays black.",
    css: `
      h1 { color: #5a1f1a; }
      h3 { color: #5a1f1a; }
      h2 { color: #5a1f1a; border-bottom-color: #d9c3bf; }
      header { border-bottom: 1.2pt solid #5a1f1a; }
      li::marker { color: #b5908a; }
      .meta .co { color: #333; }
      .url { color: #8a5a54; }`,
  },
  {
    id: "monochrome",
    name: "Monochrome",
    blurb: "Everything in one weight and one gray scale; the name small, the headline large.",
    css: `
      h1 { font-family: ${SANS}; font-weight: 500; font-size: 14pt; letter-spacing: 0; text-transform: none; color: #555; }
      .headline { font-family: ${SERIF}; font-size: 22pt; line-height: 1.08; color: #141414; margin-top: 2pt; }
      h3 { font-family: ${SANS}; font-weight: 500; font-size: 10.5pt; }
      strong { font-weight: 500; }
      h2 { color: #999; }`,
  },
];

export const DEFAULT_TEMPLATE = TEMPLATES[0].id;

export function templateById(id?: string): Template {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
