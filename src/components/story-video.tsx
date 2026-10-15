"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * The life in one clip: school photo → teenager → Marine → now. The poster
 * is a real <img>, discoverable by the preload scanner and fetched at high
 * priority, so it is the page's largest paint. The <video> element does not
 * exist until the visitor has done something (scrolled, moved, touched, or
 * typed) or four seconds have passed since load, and the frame is in view;
 * then it mounts, loads, plays muted, and fades in over the poster. Under
 * reduced motion only the poster renders.
 */
export function StoryVideo({ src, poster, className = "" }: { src: string; poster: string; className?: string }) {
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [mount, setMount] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Decide when the clip may exist: first input or four seconds after load, and the frame in view.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || reduce || mount) return;
    let ready = false;
    let visible = false;
    let timer: number | undefined;
    const check = () => {
      if (ready && visible) setMount(true);
    };
    const go = () => {
      ready = true;
      check();
      events.forEach((n) => window.removeEventListener(n, go));
    };
    const events = ["scroll", "pointermove", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((n) => window.addEventListener(n, go, { passive: true, once: true }));
    const arm = () => {
      timer = window.setTimeout(go, 4000);
    };
    if (document.readyState === "complete") arm();
    else window.addEventListener("load", arm, { once: true });
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        check();
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("load", arm);
      events.forEach((n) => window.removeEventListener(n, go));
    };
  }, [reduce, mount]);

  // Once mounted: play while visible, pause when hidden or scrolled away.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const play = () => v.play().catch(() => {});
    play();
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? play() : v.pause()), { threshold: 0.25 });
    io.observe(v);
    const onPlaying = () => setPlaying(true);
    v.addEventListener("playing", onPlaying);
    const onVis = () => (document.hidden ? v.pause() : play());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      v.removeEventListener("playing", onPlaying);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [mount]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={poster}
        alt="A stack of photographs: Josh today at sunset in front, a Marine in dress blues, a teenager, and a small boy in a school photo behind"
        fetchPriority="high"
        decoding="async"
        className={className}
      />
      {mount && (
        <video
          ref={videoRef}
          className={`${className} transition-opacity duration-700 ${playing ? "opacity-100" : "opacity-0"}`}
          src={src}
          muted
          loop
          playsInline
          preload="auto"
          aria-label="The same stack of photographs, animated"
        />
      )}
    </>
  );
}
