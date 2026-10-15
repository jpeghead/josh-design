import { portedEssays } from "@/content/writing";

const SITE = "https://josh.design";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** RSS 2.0 for the essays. Full text, newest first, same source as /writing. */
export function GET() {
  const items = [...portedEssays]
    .filter((e) => e.date)
    .sort((a, b) => Date.parse(b.date!) - Date.parse(a.date!));
  const updated = items[0]?.date ? new Date(items[0].date).toUTCString() : new Date().toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Josh Whitehead — Writing</title>
    <link>${SITE}/writing</link>
    <description>Build logs and essays from a designer who builds AI products end to end, with agents in the loop.</description>
    <language>en-us</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <atom:link href="${SITE}/feed.xml" rel="self" type="application/rss+xml" />
${items
  .map(
    (e) => `    <item>
      <title>${esc(e.title)}</title>
      <link>${SITE}/writing/${e.slug}</link>
      <guid isPermaLink="true">${SITE}/writing/${e.slug}</guid>
      <pubDate>${new Date(e.date!).toUTCString()}</pubDate>
      <description>${esc(e.description)}</description>
      <content:encoded><![CDATA[${e.html}]]></content:encoded>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=900, s-maxage=900" } });
}
