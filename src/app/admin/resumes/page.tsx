import Link from "next/link";
import { listResumes } from "@/lib/admin/resume/store";
import { NewResume } from "@/components/admin/new-resume";

export const dynamic = "force-dynamic";

export default function Resumes() {
  const all = listResumes();
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="serif text-[2rem] leading-tight">Résumés.</h1>
          <p className="mt-1 max-w-2xl text-sm text-fg-2">
            Two personas, one profile. Build one, then type what to change. Every version is kept; exports are text-layer PDF, .docx, and plain text, one column, contact in the body.
          </p>
        </div>
        <NewResume />
      </div>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {all.length === 0 && <li className="py-6 text-sm text-fg-3">No résumés yet. Build one above.</li>}
        {all.map((r) => (
          <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
            <div className="min-w-0">
              <Link href={`/admin/resumes/${r.id}`} className="text-[15px] text-fg hover:underline">
                {r.label}
              </Link>
              <p className="text-xs text-fg-3">
                {r.persona === "ai-builder" ? "AI builder" : "Designer who builds"} · {new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                {r.instruction ? ` · ${r.instruction.slice(0, 80)}` : ""}
                {r.keywords ? ` · ${r.keywords.covered.length}/${r.keywords.covered.length + r.keywords.missing.length} keywords` : ""}
              </p>
            </div>
            <div className="flex gap-2 text-[13px]">
              <a href={`/api/admin/resume/${r.id}/export?format=pdf`} className="rounded-full border border-line px-3 py-1 text-fg-2 hover:text-fg">PDF</a>
              <a href={`/api/admin/resume/${r.id}/export?format=docx`} className="rounded-full border border-line px-3 py-1 text-fg-2 hover:text-fg">DOCX</a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
