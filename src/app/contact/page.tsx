import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Josh Whitehead — design partnerships, product work, and the occasional good idea.",
};

// Easily swapped — this is the on-domain address.
const CONTACT_EMAIL = "josh@josh.design";

export default function ContactPage() {
  return (
    <div className="bg-paper text-graphite">
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-20 sm:px-8">
        <p className="eyebrow">Contact</p>
        <h1 className="mt-4 font-display text-5xl tracking-tight text-balance sm:text-6xl">
          Send a signal.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-pretty text-graphite-dim">
          Design partnerships, product work, or you just want to compare notes on
          building things — I read everything.
        </p>

        {/* No-JS fallback: the plain address always works. */}
        <p className="mt-6 font-mono text-sm">
          <span className="text-graphite-muted">Or email directly: </span>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="border-b border-gold pb-0.5 text-graphite hover:text-gold-dim"
          >
            {CONTACT_EMAIL}
          </a>
        </p>

        <ContactForm email={CONTACT_EMAIL} />
      </div>
    </div>
  );
}
