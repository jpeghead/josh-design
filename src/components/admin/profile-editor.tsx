"use client";

import { useState } from "react";
import type { Profile } from "@/lib/admin/resume/profile";

/** The profile as JSON: the bank every résumé and every application draws from. */
export function ProfileEditor({ initial }: { initial: Profile }) {
  const [json, setJson] = useState(JSON.stringify(initial, null, 2));
  const [msg, setMsg] = useState<string | null>(null);
  const save = async () => {
    try {
      const p = JSON.parse(json);
      const r = await fetch("/api/admin/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
      setMsg(r.ok ? "Saved. New résumés will use it; existing versions keep their text." : `Save failed (${r.status})`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const reseed = async () => {
    const r = await fetch("/api/admin/profile", { method: "POST" });
    const p = await r.json();
    setJson(JSON.stringify(p, null, 2));
    setMsg("Reseeded from the site's content. Your edits are gone; save to keep this.");
  };
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm text-fg">Profile</h2>
        <div className="flex gap-3 text-xs">
          <button type="button" onClick={reseed} className="text-fg-3 underline decoration-fg-3 underline-offset-2 hover:text-fg">Reseed from site</button>
          <button type="button" onClick={save} className="rounded-full bg-fg px-3 py-1 font-medium text-bg">Save</button>
        </div>
      </div>
      <p className="mt-1 text-xs text-fg-3">Every bullet here is the only thing a résumé may say. Add a phone, pronouns, a salary expectation, or new bullets with tags; keep it true.</p>
      <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={28} spellCheck={false} className="mt-3 w-full rounded-lg border border-line bg-transparent px-3 py-2 font-mono text-[11px] text-fg focus:border-fg focus:outline-none" />
      {msg && <p className="mt-2 text-xs text-fg-2">{msg}</p>}
    </section>
  );
}
