"use client";

import { useEffect, useRef } from "react";
import { useWindowManager, type AppKey } from "@/lib/window-store";

/**
 * Intercepts clicks on internal anchor tags within the current container
 * and opens them as windows instead of navigating. Used inside window
 * content to keep everything inside the OS shell.
 */
export function useOpenInWindow() {
  const { open } = useWindowManager();
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#") || anchor.getAttribute("target") === "_blank") {
        return;
      }
      const match = appAndParamFromPath(href);
      if (!match) return;
      e.preventDefault();
      openRef.current({ app: match.app, param: match.param });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}

function appAndParamFromPath(path: string): { app: AppKey; param?: string } | null {
  // Strip query/hash
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "/" || !clean) return null;
  if (clean === "/work") return { app: "work" };
  if (clean.startsWith("/work/")) return { app: "project", param: clean.slice("/work/".length) };
  if (clean === "/journal") return { app: "journal" };
  if (clean.startsWith("/journal/")) return { app: "entry", param: clean.slice("/journal/".length) };
  if (clean === "/about") return { app: "about" };
  if (clean === "/contact") return { app: "contact" };
  return null;
}

export { appAndParamFromPath };
