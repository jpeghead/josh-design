/**
 * Native-scroll conductor. Document scroll is the one source of truth; it
 * becomes a fractional chapter value (e.g. 1.35). `exact` updates on every
 * scroll/layout event and is used for anything that must be reproducible:
 * navigation, DOM ownership, interaction gating. `smooth` is damped per
 * frame by the render loop and is used for the camera and visuals only.
 *
 * The same scroll position must recreate the same state forward, backward,
 * after a jump, and after reload.
 */

import { useEffect, useRef } from "react";
import { clamp, damp } from "./surfaces";

export type ConductorState = {
  exact: number;
  smooth: number;
  index: number;
  next: number;
  local: number; // local progress within [index, next] using smooth
  direction: number;
  anchors: number[];
};

export function useScrollConductor(sectionIds: string[], reduce: boolean, damping = 5.2) {
  const state = useRef<ConductorState>({
    exact: 0,
    smooth: 0,
    index: 0,
    next: Math.min(1, sectionIds.length - 1),
    local: 0,
    direction: 1,
    anchors: [],
  });
  const prevY = useRef(0);
  const widthAtMeasure = useRef(0);

  useEffect(() => {
    const els = sectionIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const s = state.current;

    const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

    const measure = () => {
      const max = maxScroll();
      widthAtMeasure.current = window.innerWidth;
      const a = els.map((el, i) => {
        if (i === 0) return 0;
        const v = el.offsetTop + el.offsetHeight * 0.5 - window.innerHeight * 0.5;
        return clamp(v, 0, max);
      });
      for (let i = 1; i < a.length; i++) a[i] = Math.max(a[i], a[i - 1] + 1);
      s.anchors = a;
    };

    const progressAt = (y: number) => {
      const a = s.anchors;
      y = clamp(y, 0, maxScroll());
      if (y <= a[0]) return 0;
      for (let i = 0; i < a.length - 1; i++) {
        if (y <= a[i + 1]) {
          const span = Math.max(1, a[i + 1] - a[i]);
          return i + clamp((y - a[i]) / span, 0, 1);
        }
      }
      return a.length - 1;
    };

    const read = () => {
      const y = window.scrollY || 0;
      const d = y - prevY.current;
      if (Math.abs(d) > 0.25) s.direction = d > 0 ? 1 : -1;
      prevY.current = y;
      s.exact = progressAt(y);
      if (reduce) s.smooth = s.exact;
    };

    const onResize = () => {
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      if (coarse && window.innerWidth === widthAtMeasure.current) return; // URL-bar noise
      measure();
      read();
    };

    measure();
    prevY.current = window.scrollY || 0;
    s.exact = progressAt(prevY.current);
    s.smooth = s.exact;

    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("orientationchange", onResize, { passive: true });
    window.addEventListener("pageshow", onResize);
    window.addEventListener("hashchange", onResize);
    const ro = new ResizeObserver(() => {
      measure();
      read();
    });
    els.forEach((el) => ro.observe(el));
    // fonts settle late and move anchors
    document.fonts?.ready.then(() => {
      measure();
      read();
    });

    return () => {
      window.removeEventListener("scroll", read);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.removeEventListener("pageshow", onResize);
      window.removeEventListener("hashchange", onResize);
      ro.disconnect();
    };
  }, [sectionIds, reduce]);

  /** advance the damped value — call once per rendered frame */
  const step = (dt: number) => {
    const s = state.current;
    s.smooth = reduce ? s.exact : damp(s.smooth, s.exact, damping, dt);
    if (Math.abs(s.smooth - s.exact) < 0.0001) s.smooth = s.exact;
    const last = sectionIds.length - 1;
    const idx = clamp(Math.floor(s.smooth), 0, last);
    s.index = idx;
    s.next = Math.min(last, idx + 1);
    s.local = s.next === idx ? 0 : clamp(s.smooth - idx, 0, 1);
    return s;
  };

  return { state, step };
}
