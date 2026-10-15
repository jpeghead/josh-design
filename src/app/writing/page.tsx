import type { Metadata } from "next";
import { Container, PageHeader, Label, List, Row } from "@/components/ui";
import { books, portedEssays } from "@/content/writing";

export const metadata: Metadata = {
  title: "Writing",
  description: "Two books and a handful of essays. Mastery is Dead, The Harmony Protocol, and notes worth keeping.",
};

export default function WritingPage() {
  return (
    <Container>
      <PageHeader label="Writing" serif title="Books, and the notes worth keeping." />

      <section className="pb-16" aria-labelledby="h-books">
        <Label>
          <span id="h-books">Books</span>
        </Label>
        <List>
          {books.map((b) => (
            <Row
              key={b.slug}
              href={b.site ?? b.link?.href}
              external={!!(b.site ?? b.link?.href)}
              title={b.subtitle ? `${b.title}: ${b.subtitle}` : b.title}
              meta={[b.kind, b.status, b.year].filter(Boolean).join(" · ")}
              body={b.blurb}
            />
          ))}
        </List>
      </section>

      <section className="pb-28" aria-labelledby="h-essays">
        <Label>
          <span id="h-essays">Essays</span>
        </Label>
        {portedEssays.length === 0 ? (
          <p className="mt-4 text-fg-2">More soon.</p>
        ) : (
          <List>
            {portedEssays.map((e) => (
              <Row
                key={e.slug}
                href={`/writing/${e.slug}`}
                title={e.title}
                meta={e.date ? new Date(e.date).getFullYear() : undefined}
                body={e.description}
              />
            ))}
          </List>
        )}
      </section>
    </Container>
  );
}
