import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; bad?: string }> }) {
  const { next, bad } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <p className="text-sm text-fg-2">Admin</p>
      <h1 className="serif mt-2 text-[2.25rem] leading-tight">The cockpit.</h1>
      <form method="post" action="/api/admin/login" className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next ?? "/admin"} />
        <label className="block text-sm text-fg-2">
          Secret
          <input name="secret" type="password" autoFocus required className="mt-1.5 w-full rounded-lg border border-line bg-transparent px-3.5 py-2.5 text-[17px] text-fg focus:border-fg focus:outline-none" />
        </label>
        {bad && <p className="text-sm text-red-300">That isn&rsquo;t it.</p>}
        <button type="submit" className="rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg">Enter</button>
        <p className="text-xs text-fg-3">The secret is ADMIN_SECRET in .env.local on this machine.</p>
      </form>
    </main>
  );
}
