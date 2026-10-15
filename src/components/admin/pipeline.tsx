"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Application } from "@/lib/admin/apply/types";

const STAGES: NonNullable<Application["stage"]>[] = ["applied", "replied", "interviewing", "offer", "rejected", "withdrawn"];

/** The after-submit life of an application: stage, next action, notes. Everything is set by hand. */
export function Pipeline({ apps }: { apps: Application[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  const [drafting, setDrafting] = useState<string | null>(null);
  const followUp = async (id: string) => {
    setDrafting(id);
    const r = await fetch(`/api/admin/apply/${id}/followup`, { method: "POST" });
    const j = await r.json();
    setDraft({ id, text: j.text ?? j.error ?? `Failed (${r.status})` });
    setDrafting(null);
  };
  const remove = async (id: string) => {
    await fetch(`/api/admin/apply/${id}`, { method: "DELETE" });
    router.refresh();
  };
  const patch = async (id: string, body: unknown) => {
    await fetch(`/api/admin/apply/${id}/stage`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    router.refresh();
  };
  const live = apps.filter((a) => a.status !== "submitted");
  const submitted = apps.filter((a) => a.status === "submitted");
  const today = new Date().toISOString().slice(0, 10);
  const due = submitted.filter((a) => a.nextAction?.date && a.nextAction.date <= today && !["rejected", "withdrawn", "offer"].includes(a.stage ?? ""));

  return (
    <div className="mt-8 space-y-10">
      {due.length > 0 && (
        <section className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-4">
          <h2 className="text-sm text-amber-200">Due today or overdue</h2>
          <ul className="mt-2 space-y-1 text-[13px] text-fg-2">
            {due.map((a) => (
              <li key={a.id}>
                <Link href={`/admin/applications/${a.id}`} className="text-fg hover:underline">{a.title} · {a.company}</Link> — {a.nextAction?.note} ({a.nextAction?.date}){" "}
                <button type="button" onClick={() => followUp(a.id)} disabled={drafting === a.id} className="ml-1 rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-3 hover:text-fg disabled:opacity-50">
                  {drafting === a.id ? "drafting…" : "draft follow-up"}
                </button>
                {draft?.id === a.id && (
                  <div className="mt-2 rounded-md border border-line bg-bg p-3">
                    <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-fg-2">{draft.text}</pre>
                    <div className="mt-2 flex gap-3 text-[11px]">
                      <button type="button" onClick={() => navigator.clipboard?.writeText(draft.text)} className="text-fg-3 underline underline-offset-2 hover:text-fg">Copy</button>
                      <button type="button" onClick={() => followUp(a.id)} className="text-fg-3 underline underline-offset-2 hover:text-fg">Again</button>
                      <span className="text-fg-3">Paste into your own mail. Nothing is sent from here.</span>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Submitted · {submitted.length}</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {STAGES.map((st) => (
            <div key={st} className="rounded-lg border border-line bg-fill/40 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-fg-3">{st} · {submitted.filter((a) => (a.stage ?? "applied") === st).length}</p>
              <ul className="mt-2 space-y-2">
                {submitted.filter((a) => (a.stage ?? "applied") === st).map((a) => (
                  <li key={a.id} className="rounded-md border border-line bg-bg p-2 text-[13px]">
                    <Link href={`/admin/applications/${a.id}`} className="text-fg hover:underline">{a.title}</Link>
                    <p className="text-xs text-fg-3">{a.company} · {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</p>
                    {a.nextAction?.date && <p className="mt-1 text-xs text-fg-2">→ {a.nextAction.note} · {a.nextAction.date}</p>}
                    <div className="mt-2 flex flex-wrap gap-1">
                      {STAGES.filter((x) => x !== st).map((x) => (
                        <button key={x} type="button" onClick={() => patch(a.id, { stage: x })} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-3 hover:text-fg">{x}</button>
                      ))}
                      <button type="button" onClick={() => setOpen(open === a.id ? null : a.id)} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-3 hover:text-fg">edit</button>
                      <button type="button" onClick={() => followUp(a.id)} disabled={drafting === a.id} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-3 hover:text-fg disabled:opacity-50">{drafting === a.id ? "drafting…" : "follow-up"}</button>
                    </div>
                    {draft?.id === a.id && !due.some((d) => d.id === a.id) && (
                      <div className="mt-2 rounded-md border border-line bg-fill/40 p-2">
                        <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-fg-2">{draft.text}</pre>
                        <button type="button" onClick={() => navigator.clipboard?.writeText(draft.text)} className="mt-1 text-[11px] text-fg-3 underline underline-offset-2 hover:text-fg">Copy</button>
                      </div>
                    )}
                    {open === a.id && (
                      <form
                        className="mt-2 space-y-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          patch(a.id, { nextAction: fd.get("date") ? { date: String(fd.get("date")), note: String(fd.get("note") || "Follow up") } : null, notes: String(fd.get("notes") ?? "") });
                          setOpen(null);
                        }}
                      >
                        <input name="date" type="date" defaultValue={a.nextAction?.date ?? ""} className="w-full rounded border border-line bg-transparent px-2 py-1 text-xs text-fg" />
                        <input name="note" defaultValue={a.nextAction?.note ?? ""} placeholder="next action" className="w-full rounded border border-line bg-transparent px-2 py-1 text-xs text-fg placeholder:text-fg-3" />
                        <textarea name="notes" defaultValue={a.notes ?? ""} placeholder="notes: who you spoke to, what they said" rows={3} className="w-full rounded border border-line bg-transparent px-2 py-1 text-xs text-fg placeholder:text-fg-3" />
                        <button type="submit" className="rounded-full bg-fg px-3 py-1 text-[11px] font-medium text-bg">Save</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.14em] text-fg-3">Runs not submitted · {live.length}</h2>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {live.length === 0 && <li className="py-3 text-sm text-fg-3">None.</li>}
          {live.map((a) => (
            <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
              <div>
                <Link href={`/admin/applications/${a.id}`} className="text-[15px] text-fg hover:underline">{a.title} · {a.company}</Link>
                <p className="text-xs text-fg-3">
                  {new Date(a.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {a.fields.filter((f) => f.status === "filled").length} filled · {a.fields.filter((f) => f.status === "review").length} for you
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-[0.14em] text-fg-2">{a.status}</span>
                <button type="button" onClick={() => patch(a.id, { markSubmitted: true })} className="rounded-full border border-line px-3 py-1 text-[11px] text-fg-3 hover:text-fg" title="If you submitted this one yourself in the browser">
                  I submitted it myself
                </button>
                <button type="button" onClick={() => remove(a.id)} className="rounded-full px-2 py-1 text-[11px] text-fg-3 hover:text-fg" aria-label="Delete this run">
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
