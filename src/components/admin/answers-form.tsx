"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile } from "@/lib/admin/resume/profile";

type A = Profile["answers"];
const yesNo = (v: boolean | string | undefined) => (typeof v === "boolean" ? (v ? "Yes" : "No") : (v ?? ""));

/**
 * The questions every application form asks, as a form, so nothing waits
 * on a value buried in JSON. Each field says which questions it answers.
 */
export function AnswersForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [location, setLocation] = useState(profile.location);
  const [a, setA] = useState<A>(profile.answers);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof A>(k: K, v: A[K]) => setA((x) => ({ ...x, [k]: v }));
  const save = async () => {
    setBusy(true);
    const r = await fetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, location, answers: a }) });
    setBusy(false);
    setMsg(r.ok ? "Saved. Every run from now on uses these." : `Save failed (${r.status}).`);
    router.refresh();
  };
  const missing = [!phone && "phone", !a.startDate && "start date", !a.willingToRelocate && "relocation", !a.workplace && "remote or office", !a.salary && "salary"].filter(Boolean) as string[];

  const field = "mt-1 w-full rounded-lg border border-line bg-transparent px-3 py-2 text-[14px] text-fg placeholder:text-fg-3 focus:border-fg focus:outline-none";
  const Seg = ({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) => (
    <div role="radiogroup" className="mt-1 flex flex-wrap gap-1">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(value === o ? "" : o)} className={`rounded-full border px-3 py-1 text-[13px] ${value === o ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:text-fg"}`}>
          {o}
        </button>
      ))}
    </div>
  );
  const Label = ({ children, asks }: { children: React.ReactNode; asks: string }) => (
    <span className="block">
      <span className="text-sm text-fg">{children}</span>
      <span className="block text-xs text-fg-3">{asks}</span>
    </span>
  );

  return (
    <section className="mt-8 rounded-xl border border-line bg-fill/40 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-base text-fg">What the forms ask</h2>
        {missing.length > 0 ? <p className="text-xs text-amber-200">Still blank: {missing.join(", ")}. Runs stop and wait on these.</p> : <p className="text-xs text-emerald-300">Everything a form asks for is here.</p>}
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label>
          <Label asks="Phone number, mobile. Required on nearly every form.">Phone</Label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" inputMode="tel" className={field} />
        </label>
        <label>
          <Label asks="Location, city, where are you based. Also the city on the résumé.">Where you live</Label>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Cincinnati, OH · remote-friendly" className={field} />
        </label>
        <div>
          <Label asks="Are you willing to relocate?">Relocation</Label>
          <Seg value={a.willingToRelocate ?? ""} options={["Yes", "No", "For the right role"]} onChange={(v) => set("willingToRelocate", v)} />
        </div>
        <div>
          <Label asks="Are you open to hybrid or in-office work? Remote preference.">Remote or office</Label>
          <Seg value={a.workplace ?? ""} options={["Remote", "Hybrid", "In office", "Any"]} onChange={(v) => set("workplace", v)} />
        </div>
        <label>
          <Label asks="Which cities would you work in or move to? Office location questions.">Cities</Label>
          <input value={a.locations ?? ""} onChange={(e) => set("locations", e.target.value)} placeholder="Los Angeles, San Francisco, New York, Cincinnati" className={field} />
        </label>
        <label>
          <Label asks="When can you start? Notice period, earliest start date.">Start date</Label>
          <input value={a.startDate ?? ""} onChange={(e) => set("startDate", e.target.value)} placeholder="Two weeks from an offer" className={field} />
        </label>
        <label>
          <Label asks="Salary expectations, desired compensation. Left blank, the run stops for you.">Salary</Label>
          <input value={a.salary ?? ""} onChange={(e) => set("salary", e.target.value)} placeholder="$220,000 base, open to the range posted" className={field} />
        </label>
        <label>
          <Label asks="Pronouns. Blank leaves it empty.">Pronouns</Label>
          <input value={a.pronouns ?? ""} onChange={(e) => set("pronouns", e.target.value)} placeholder="He/him" className={field} />
        </label>
        <div>
          <Label asks="Are you authorized to work in the US?">Work authorization</Label>
          <Seg value={yesNo(a.workAuthorizedUS)} options={["Yes", "No"]} onChange={(v) => set("workAuthorizedUS", v === "Yes")} />
        </div>
        <div>
          <Label asks="Will you now or in the future require sponsorship?">Needs sponsorship</Label>
          <Seg value={yesNo(a.needsSponsorship)} options={["Yes", "No"]} onChange={(v) => set("needsSponsorship", v === "Yes")} />
        </div>
        <label>
          <Label asks="How did you hear about us? Used when the form's list has no closer match.">How you heard</Label>
          <input value={a.howHeard} onChange={(e) => set("howHeard", e.target.value)} className={field} />
        </label>
        <label className="sm:col-span-2">
          <Label asks="How Claude writes the cover letter and the free-text answers.">Cover letter stance</Label>
          <textarea value={a.coverLetterStance} onChange={(e) => set("coverLetterStance", e.target.value)} rows={2} className={field} />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">{busy ? "Saving…" : "Save answers"}</button>
        {msg && <p className="text-xs text-fg-2">{msg}</p>}
      </div>
    </section>
  );
}
