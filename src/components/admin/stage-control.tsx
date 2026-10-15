"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Application } from "@/lib/admin/apply/types";

const STAGES: NonNullable<Application["stage"]>[] = ["applied", "replied", "interviewing", "offer", "rejected", "withdrawn"];
const NEXT: Record<string, string> = { applied: "Follow up if no reply", replied: "Reply and propose times", interviewing: "Prepare; send a thank-you after", offer: "Decide", rejected: "", withdrawn: "" };

/**
 * Where an application stands after Submit. Stages move by hand (no board
 * tells us when a recruiter writes back), one click each; the date is set
 * when the click happens and a sensible next action is suggested.
 */
export function StageControl({ app, compact = false }: { app: Application; compact?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const current = app.stage ?? (app.status === "submitted" ? "applied" : undefined);
  const patch = async (body: Record<string, unknown>) => {
    setBusy(true);
    await fetch(`/api/admin/apply/${app.id}/stage`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  };
  const move = (stage: NonNullable<Application["stage"]>) => {
    const inDays = stage === "applied" ? 10 : stage === "replied" ? 2 : stage === "interviewing" ? 3 : null;
    const nextAction = inDays ? { date: new Date(Date.now() + inDays * 86400000).toISOString().slice(0, 10), note: NEXT[stage] } : null;
    void patch(app.status === "submitted" ? { stage, nextAction } : { stage, nextAction, markSubmitted: true });
  };
  return (
    <div className={compact ? "" : "rounded-xl border border-line bg-fill/40 p-4"}>
      {!compact && (
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-sm text-fg">Where it stands</h2>
          <p className="text-xs text-fg-3">Click the stage when something happens. Nothing moves on its own.</p>
        </div>
      )}
      <div role="radiogroup" aria-label="Stage" className={`flex flex-wrap gap-1 ${compact ? "" : "mt-3"}`}>
        {STAGES.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={current === s} disabled={busy} onClick={() => move(s)} className={`rounded-full border px-3 py-1 text-[13px] capitalize ${current === s ? "border-fg bg-fg text-bg" : "border-line text-fg-2 hover:text-fg"} disabled:opacity-50`}>
            {s}
          </button>
        ))}
      </div>
      {app.status !== "submitted" && !compact && <p className="mt-2 text-xs text-fg-3">This run was not submitted from here. Clicking a stage records that you submitted it yourself.</p>}
      {app.status === "submitted" && (
        <div className="mt-3 text-[13px] text-fg-2">
          {app.nextAction?.date ? (
            <p>
              Next: {app.nextAction.note} <span className="text-fg-3">· {app.nextAction.date}</span>{" "}
              <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-fg-3 underline underline-offset-2 hover:text-fg">change</button>
            </p>
          ) : (
            <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-fg-3 underline underline-offset-2 hover:text-fg">set a next action</button>
          )}
          {open && (
            <form
              className="mt-2 flex flex-wrap gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                void patch({ nextAction: fd.get("date") ? { date: String(fd.get("date")), note: String(fd.get("note") || "Follow up") } : null });
                setOpen(false);
              }}
            >
              <input name="date" type="date" defaultValue={app.nextAction?.date ?? ""} className="rounded border border-line bg-transparent px-2 py-1 text-xs text-fg" />
              <input name="note" defaultValue={app.nextAction?.note ?? ""} placeholder="what to do" className="rounded border border-line bg-transparent px-2 py-1 text-xs text-fg placeholder:text-fg-3" />
              <button type="submit" className="rounded-full bg-fg px-3 py-1 text-[11px] font-medium text-bg">Save</button>
            </form>
          )}
          {app.stageAt && (
            <p className="mt-1 text-xs text-fg-3">
              {Object.entries(app.stageAt).map(([k, v]) => `${k} ${new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`).join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
