import { resume } from "@/content/resume";
import { socials } from "@/content/about";
import { lab } from "@/content/lab";

/** Structured data for crawlers: who this is, what the site is, what's on it. */
export function JsonLd() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: resume.name,
    jobTitle: resume.title,
    description: resume.summary,
    email: `mailto:${resume.email}`,
    url: resume.site,
    image: `${resume.site}/img/particles/kid.jpg`,
    address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressRegion: "CA", addressCountry: "US" },
    sameAs: socials.map((s) => s.href),
    knowsAbout: Object.values(resume.skills).flat(),
    alumniOf: { "@type": "Organization", name: "United States Marine Corps" },
    worksFor: { "@type": "Organization", name: "Boneyard Collective" },
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Josh Whitehead",
    url: resume.site,
    description: resume.summary,
    author: { "@type": "Person", name: resume.name },
  };
  const works = lab
    .filter((l) => l.slug !== "site")
    .map((l) => ({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: l.title,
      description: l.blurb,
      url: `${resume.site}${l.href}`,
      applicationCategory: "DesignApplication",
      operatingSystem: "Web",
      author: { "@type": "Person", name: resume.name },
    }));
  return (
    <>
      {[person, site, ...works].map((o, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o) }} />
      ))}
    </>
  );
}
