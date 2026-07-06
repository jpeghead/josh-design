"use client";

import { useEffect, useRef } from "react";
import { useWindowManager, type AppKey } from "@/lib/window-store";

/**
 * A tiny client component used on each "page" route. On mount it asks the
 * WindowManager to open the corresponding window. The route itself
 * renders nothing visible — the OS shell handles all visual rendering.
 */
export function WindowOpener({ app, param }: { app: AppKey; param?: string }) {
  const { open } = useWindowManager();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    open({ app, param });
  }, [app, param, open]);

  return null;
}
