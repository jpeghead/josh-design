import Link from "next/link";
import { listApplications } from "@/lib/admin/apply/store";

export const dynamic = "force-dynamic";

export default function Applications() {
  const all = listApplications();
  return (
    <div>
      <h1 className="serif text-[2rem] leading-tight">Applications.</h1>
      <p className="mt-1 text-sm text-fg-2">Every run the agent has made, with its fields, log, and screenshot.</p>
      <ul className="mt-8 divide-y divide-line border-y border-line">
        {all.length === 0 && <li className="py-6 text-sm text-fg-3">Nothing yet. Press Apply on a posting.</li>}
        {all.map((a) => (
          <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
            <div>
              <Link href={`/admin/applications/${a.id}`} className="text-[15px] text-fg hover:underline">
                {a.title} · {a.company}
              </Link>
              <p className="text-xs text-fg-3">
                {new Date(a.startedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {a.fields.filter((f) => f.status === "filled").length} filled · {a.fields.filter((f) => f.status === "review").length} for you
              </p>
            </div>
            <span className={`text-xs uppercase tracking-[0.14em] ${a.status === "submitted" ? "text-emerald-300" : a.status === "failed" ? "text-red-300" : "text-fg-2"}`}>{a.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
