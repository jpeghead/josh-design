"use client";

import { Reveal } from "@/components/reveal";

export function ContactContent() {
  return (
    <div className="px-4 py-10 sm:px-8 sm:py-14">
      <div className="grid grid-cols-12 gap-6 border-b border-bone-line pb-8">
        <div className="col-span-12 md:col-span-8">
          <Reveal>
            <p className="overline">// Reach</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-2 font-[var(--font-display)] text-[clamp(2.5rem,9vw,9rem)] leading-[0.88] tracking-tight text-bone">
              <span className="block">Send a</span>
              <span className="block italic text-safelight">signal.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-2xl text-balance text-base leading-relaxed text-bone-dim">
              I read every message. Right now I&rsquo;m taking on a small
              number of design partnerships, advisory roles, and the
              occasional public collaboration. The fastest path is{" "}
              <a
                href="mailto:joshwhitehead.design@gmail.com"
                className="text-bone underline decoration-bone-muted underline-offset-4 hover:decoration-safelight"
              >
                a real email
              </a>
              .
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.25} className="col-span-12 md:col-span-4">
          <div className="border border-bone-line p-4">
            <p className="overline">/ Now</p>
            <p className="mt-2 text-sm leading-relaxed text-bone-dim">
              Open to:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-bone">
              <li>— Design partnerships (4–12 weeks)</li>
              <li>— Advisory &amp; design audits</li>
              <li>— Speaking, panels, podcasts</li>
              <li>— Product roles, selectively</li>
            </ul>
          </div>
        </Reveal>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-px border border-bone-line bg-bone-line py-px md:grid-cols-3">
        <Method
          label="Email"
          value="joshwhitehead.design@gmail.com"
          href="mailto:joshwhitehead.design@gmail.com"
          hint="Best for new work"
        />
        <Method
          label="Studio"
          value="boneyardcollective.com"
          href="https://boneyardcollective.com"
          hint="Where most of my time goes"
        />
        <Method
          label="Elsewhere"
          value="@jpeghead on X"
          href="https://x.com/jpeghead"
          hint="Lower-stakes signal"
        />
      </div>

      <form
        action="mailto:joshwhitehead.design@gmail.com"
        method="POST"
        encType="text/plain"
        className="mt-8 grid grid-cols-12 gap-4 border border-bone-line p-5 sm:p-6"
      >
        <div className="col-span-12 flex items-center justify-between border-b border-bone-line pb-3 font-mono text-[10px] uppercase tracking-widest text-bone-muted">
          <span>// Compose · message</span>
          <span>Reply within 48 hours</span>
        </div>

        <Input name="name" label="Name" required />
        <Input name="email" type="email" label="Email" required />
        <Input name="company" label="Company / context" />
        <Input name="budget" label="Budget or scope (rough)" />

        <div className="col-span-12">
          <label className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
            The brief
          </label>
          <textarea
            name="message"
            rows={5}
            required
            placeholder="What are you trying to build? What's in the way?"
            className="mt-2 w-full border border-bone-line bg-ink px-3 py-2 font-mono text-sm text-bone placeholder:text-bone-muted focus:border-safelight focus:outline-none"
          />
        </div>

        <div className="col-span-12 flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="group inline-flex items-center gap-3 border border-safelight bg-safelight/10 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-bone transition-colors hover:bg-safelight hover:text-ink"
          >
            <span>Send</span>
            <span
              aria-hidden
              className="transition-transform group-hover:translate-x-1"
            >
              ↗
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

function Method({
  label,
  value,
  href,
  hint,
}: {
  label: string;
  value: string;
  href: string;
  hint: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="group bg-ink p-5 hover:bg-ink-100"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {label}
      </p>
      <p className="mt-2 font-[var(--font-display)] text-xl text-bone group-hover:text-safelight">
        {value}
      </p>
      <p className="mt-1 text-sm text-bone-dim">{hint}</p>
    </a>
  );
}

function Input({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="col-span-12 md:col-span-6">
      <label className="font-mono text-[10px] uppercase tracking-widest text-bone-muted">
        {label}
        {required && <span className="text-safelight"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-2 w-full border border-bone-line bg-ink px-3 py-2 font-mono text-sm text-bone placeholder:text-bone-muted focus:border-safelight focus:outline-none"
      />
    </div>
  );
}
