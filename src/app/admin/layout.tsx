import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — Admin" }, robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Jobs" },
  { href: "/admin/resumes", label: "Résumés" },
  { href: "/admin/queue", label: "Queue" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/setup", label: "Setup" },
];

/** Private panel chrome: no site header, no footer, no analytics. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin min-h-dvh bg-bg text-fg">
      <header className="border-b border-line">
        <div className="mx-auto flex h-12 w-full max-w-[1400px] items-center justify-between px-5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-[15px] font-semibold tracking-tight">Cockpit</Link>
            <nav className="flex gap-4 text-[13px] text-fg-2">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-fg">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="text-[13px] text-fg-3 hover:text-fg">
            ‹ Site
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1400px] px-5 py-8">{children}</main>
    </div>
  );
}
