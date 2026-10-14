"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reveal-on-view, done so the server-rendered page is complete without
 * JavaScript. The markup is visible by default; an inline script adds
 * `html.js` before first paint, CSS then hides `.reveal` until this
 * component sees it enter the viewport and adds `.in` (once). A CSS
 * fallback animation forces everything visible after a few seconds in case
 * the bundle never arrives. Reduced motion renders the final state.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "figure" | "header";
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    // @ts-expect-error — the tag is one of a few block elements
    <Tag ref={ref} className={`reveal ${className}`} style={delay ? { transitionDelay: `${delay}s` } : undefined}>
      {children}
    </Tag>
  );
}

/**
 * Word-by-word headline reveal with the same contract: whole text in the
 * DOM, each word staggered by CSS once `.go` lands. The accessible name is
 * the unsplit text.
 */
export function Words({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("go");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -5% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const parts = text.split(" ");
  return (
    <span ref={ref} className={`words ${className}`} aria-label={text} role="text">
      {parts.map((w, i) => (
        <span key={i} aria-hidden className="inline-block overflow-hidden align-bottom">
          <span className="w inline-block" style={{ transitionDelay: `${delay + i * 0.06}s` }}>
            {w}
            {i < parts.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Slow drift for a media layer: a few percent, tied to scroll, never more.
 *  The box is reserved by `aspect`; the child fills it. */
export function Drift({ children, amount = 6, aspect, className = "" }: { children: ReactNode; amount?: number; aspect: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${amount}%`, `${amount}%`]);
  return (
    <div ref={ref} className={`frame ${className}`} style={{ aspectRatio: aspect }}>
      <motion.div style={reduce ? undefined : { y }} className="absolute -inset-y-[8%] inset-x-0">
        {children}
      </motion.div>
    </div>
  );
}
