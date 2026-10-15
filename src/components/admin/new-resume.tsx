"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewResume() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const make = async (persona: "designer-who-builds" | "ai-builder") => {
    setBusy(persona);
    const r = await fetch("/api/admin/resume", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ persona }) });
    const j = await r.json();
    setBusy(null);
    router.push(`/admin/resumes/${j.id}`);
  };
  return (
    <div className="flex gap-2">
      <button type="button" disabled={!!busy} onClick={() => make("designer-who-builds")} className="rounded-full border border-line px-4 py-1.5 text-[13px] text-fg hover:bg-fill disabled:opacity-50">
        New: Designer who builds
      </button>
      <button type="button" disabled={!!busy} onClick={() => make("ai-builder")} className="rounded-full bg-fg px-4 py-1.5 text-[13px] font-medium text-bg disabled:opacity-50">
        New: AI builder
      </button>
    </div>
  );
}
