"use client";

import { useState } from "react";

/**
 * Progressive enhancement: with JS on, this composes a rich mailto. With JS off,
 * the page still shows the plain email link (see the contact page), so the form
 * is never the only way through.
 */
export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Signal from ${name || "the site"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${from ? ` (${from})` : ""}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const field =
    "w-full border border-black/15 bg-paper px-3 py-2.5 text-graphite placeholder:text-graphite-muted focus:border-gold focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="eyebrow">Name</span>
          <input
            className={`${field} mt-1.5`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="eyebrow">Your email</span>
          <input
            type="email"
            className={`${field} mt-1.5`}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            required
            autoComplete="email"
          />
        </label>
      </div>
      <label className="block">
        <span className="eyebrow">Message</span>
        <textarea
          className={`${field} mt-1.5 min-h-32 resize-y`}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </label>
      <button
        type="submit"
        className="border border-graphite bg-graphite px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-paper transition-colors hover:bg-gold hover:border-gold hover:text-ink"
      >
        Send the signal →
      </button>
    </form>
  );
}
