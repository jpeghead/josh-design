import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";
import { socials } from "@/content/about";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Josh Whitehead — design partnerships, product work, and the occasional good idea.",
};

const CONTACT_EMAIL = "josh@josh.design";

export default function ContactPage() {
  return (
    <Container>
      <div className="grid gap-12 pb-28 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
        <div>
          <PageHeader label="Contact" serif title="Tell me what you're making." dek="Design partnerships, product work, or you just want to compare notes on building things. I read everything, and I answer." />
          <p className="text-fg-2">
            Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-fg underline decoration-fg-3 underline-offset-4 transition-colors hover:decoration-fg">
              {CONTACT_EMAIL}
            </a>
            , or use the form.
          </p>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-3">
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.href} target="_blank" rel="me noreferrer" className="transition-colors hover:text-fg">
                  {s.label} <span aria-hidden>↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:pt-40">
          <ContactForm email={CONTACT_EMAIL} />
        </div>
      </div>
    </Container>
  );
}
