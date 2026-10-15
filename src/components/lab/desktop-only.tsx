"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px) and (pointer: fine)";

/**
 * Some builds need a keyboard, a mouse, and a GPU with room to spare. On a
 * phone or tablet this shows the poster and says so instead of booting the
 * experience; nothing heavy is fetched.
 */
export function DesktopOnly({ children, title, poster, blurb }: { children: React.ReactNode; title: string; poster: string; blurb: string }) {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setOk(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  if (ok === null) return null;
  if (ok) return <>{children}</>;
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-5 pb-16 pt-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={poster} alt="" className="w-full rounded-xl border border-line" />
        <div>
          <p className="text-sm text-fg-2">{title} · desktop only</p>
          <h1 className="serif mt-2 text-[2rem] leading-tight">This one needs a keyboard and a mouse.</h1>
          <p className="mt-3 text-fg-2 text-pretty">{blurb}</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
          <Link href="/lab" className="underline decoration-fg-3 underline-offset-4 hover:decoration-fg">
            Other builds that run here
          </Link>
          <Link href="/writing/sixteen-days-in-whitehead-city" className="text-fg-2 underline decoration-fg-3 underline-offset-4 hover:text-fg">
            How it was built
          </Link>
        </div>
      </div>
    </div>
  );
}
