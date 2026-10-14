import type { Metadata } from "next";
import { Container, PageHeader } from "@/components/ui";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Josh Whitehead — design partnerships, product work, and the occasional good idea.",
};

const CONTACT_EMAIL = "josh@josh.design";

export default function ContactPage() {
  return (
    <Container>
      <div className="max-w-2xl pb-28">
        <PageHeader label="Contact" title="Get in touch." dek="Design partnerships, product work, or you just want to compare notes on building things. I read everything." />
        <p className="text-fg-2">
          Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-fg underline decoration-fg-3 underline-offset-4 transition-colors hover:decoration-fg">
            {CONTACT_EMAIL}
          </a>
          , or use the form.
        </p>
        <ContactForm email={CONTACT_EMAIL} />
      </div>
    </Container>
  );
}
