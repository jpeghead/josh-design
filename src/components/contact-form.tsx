"use client";

import { useState } from "react";

/**
 * Progressive enhancement: with JS on, this composes a mailto. With JS off the
 * plain address above the form always works.
 */
export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Hello from ${name || "the site"}`);
    const body = encodeURIComponent(`${message}\n\n— ${name}${from ? ` (${from})` : ""}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const field =
    "mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-[17px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm text-fg-2">
          Name
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </label>
        <label className="block text-sm text-fg-2">
          Email
          <input type="email" className={field} value={from} onChange={(e) => setFrom(e.target.value)} required autoComplete="email" />
        </label>
      </div>
      <label className="block text-sm text-fg-2">
        Message
        <textarea className={`${field} min-h-36 resize-y`} value={message} onChange={(e) => setMessage(e.target.value)} required />
      </label>
      <button
        type="submit"
        className="rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-80"
      >
        Send
      </button>
    </form>
  );
}
