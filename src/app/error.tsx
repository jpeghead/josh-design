"use client";

import { useEffect } from "react";
import { Container, Arrow } from "@/components/ui";

/** Route-level error boundary, in the site's own voice. Logs the error, offers a retry. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Container>
      <section className="pb-28 pt-40 sm:pt-56">
        <p className="text-sm font-medium text-fg-2">Something broke</p>
        <h1 className="serif mt-3 text-[3rem] leading-[1.02] sm:text-[4.5rem]">That didn&rsquo;t render.</h1>
        <p className="mt-6 max-w-xl text-xl leading-snug text-fg-2">
          The page hit an error on this load. Trying again usually works; if it keeps happening, the build log will show what changed.
          {error.digest && <span className="mt-2 block font-mono text-sm text-fg-3">ref {error.digest}</span>}
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
          <button type="button" onClick={reset} className="rounded-full bg-fg px-5 py-2.5 text-[15px] font-medium text-bg transition-opacity hover:opacity-85">
            Try again
          </button>
          <Arrow href="/" className="text-fg-2">
            Home
          </Arrow>
          <Arrow href="/log" className="text-fg-2">
            Build log
          </Arrow>
        </div>
      </section>
    </Container>
  );
}
