"use client";

/**
 * Agent UI patterns — four prototypes for the parts of agent interfaces
 * that decide whether people trust them. The model is simulated (scripted
 * timelines); the interface is real: keyboard-reachable, reduced-motion
 * aware, every state visible, nothing hidden behind hover.
 */

import { useCallback, useEffect, useRef, useState } from "react";


/* ---------------------------------------------------------------- script */

function useScript<T>(steps: { at: number; state: T }[], initial: T) {
  const [state, setState] = useState<T>(initial);
  const [running, setRunning] = useState(false);
  const timers = useRef<number[]>([]);
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
  }, []);
  const run = useCallback(() => {
    stop();
    setState(initial);
    setRunning(true);
    if (reduce) {
      setState(steps[steps.length - 1].state);
      setRunning(false);
      return;
    }
    steps.forEach((s, i) => {
      timers.current.push(
        window.setTimeout(() => {
          setState(s.state);
          if (i === steps.length - 1) setRunning(false);
        }, s.at)
      );
    });
  }, [steps, initial, reduce, stop]);
  const reset = useCallback(() => {
    stop();
    setState(initial);
  }, [stop, initial]);
  useEffect(() => stop, [stop]);
  return { state, running, run, reset, setState };
}

/* ------------------------------------------------------------ primitives */

function Card({ n, title, thesis, children, foot }: { n: string; title: string; thesis: string; children: React.ReactNode; foot?: React.ReactNode }) {
  return (
    <section className="grid gap-8 border-t border-line py-14 lg:grid-cols-12" aria-labelledby={`p-${n}`}>
      <div className="lg:col-span-4">
        <p className="text-sm tabular-nums text-fg-3">{n}</p>
        <h2 id={`p-${n}`} className="tight mt-2 text-[1.75rem] font-semibold leading-tight">
          {title}
        </h2>
        <p className="mt-3 text-fg-2 text-pretty">{thesis}</p>
        {foot && <div className="mt-5 text-sm text-fg-3">{foot}</div>}
      </div>
      <div className="lg:col-span-8">
        <div className="rounded-xl border border-line bg-fill/60 p-5 sm:p-6">{children}</div>
      </div>
    </section>
  );
}

function Btn({ children, onClick, tone = "primary", disabled, autoFocus }: { children: React.ReactNode; onClick: () => void; tone?: "primary" | "ghost" | "danger"; disabled?: boolean; autoFocus?: boolean }) {
  const cls =
    tone === "primary"
      ? "bg-fg text-bg hover:opacity-85"
      : tone === "danger"
        ? "border border-red-400/40 text-red-300 hover:bg-red-400/10"
        : "border border-line text-fg hover:bg-fill";
  return (
    <button type="button" onClick={onClick} disabled={disabled} autoFocus={autoFocus} className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

function Dot({ s }: { s: "wait" | "run" | "done" | "fail" }) {
  const c = s === "done" ? "bg-emerald-400" : s === "fail" ? "bg-red-400" : s === "run" ? "bg-fg animate-pulse" : "bg-fg-3/50";
  return <span aria-hidden className={`mt-[7px] inline-block h-2 w-2 shrink-0 rounded-full ${c}`} />;
}

/* --------------------------------------------------------- 01 progress */

type Step = { label: string; tool?: string; s: "wait" | "run" | "done" | "fail"; detail?: string; ms?: number };
const PROGRESS_FINAL: Step[] = [
  { label: "Read the failing test", tool: "read tests/checkout.test.ts", s: "done", ms: 420, detail: "1 failing: applies coupon after tax" },
  { label: "Trace the discount path", tool: "grep applyCoupon src/", s: "done", ms: 610, detail: "3 call sites · src/cart/total.ts owns the order" },
  { label: "Edit total.ts", tool: "edit src/cart/total.ts", s: "done", ms: 900, detail: "+6 −2 · coupon now applies before tax" },
  { label: "Run the suite", tool: "npm test", s: "done", ms: 2300, detail: "48 passed" },
];
const progressSteps = [
  { at: 0, state: PROGRESS_FINAL.map((x, i) => ({ ...x, s: i === 0 ? "run" : "wait" })) as Step[] },
  { at: 500, state: PROGRESS_FINAL.map((x, i) => ({ ...x, s: i === 0 ? "done" : i === 1 ? "run" : "wait" })) as Step[] },
  { at: 1150, state: PROGRESS_FINAL.map((x, i) => ({ ...x, s: i < 2 ? "done" : i === 2 ? "run" : "wait" })) as Step[] },
  { at: 2100, state: PROGRESS_FINAL.map((x, i) => ({ ...x, s: i < 3 ? "done" : "run" })) as Step[] },
  { at: 4400, state: PROGRESS_FINAL },
];

function Progress() {
  const initial = PROGRESS_FINAL.map((x) => ({ ...x, s: "wait" as const }));
  const { state, running, run, reset } = useScript(progressSteps, initial);
  const [open, setOpen] = useState<number | null>(null);
  const done = state.every((s) => s.s === "done");
  const started = state.some((s) => s.s !== "wait");
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-medium">Fix the coupon bug</span>
          <span className="text-fg-3"> · {done ? "done in 4.2s" : running ? "working…" : "idle"}</span>
        </p>
        <div className="flex gap-2">
          {running ? (
            <Btn tone="ghost" onClick={reset}>
              Stop
            </Btn>
          ) : (
            <Btn onClick={run}>{started ? "Run again" : "Run"}</Btn>
          )}
        </div>
      </div>
      <ol className="mt-5 space-y-1" aria-live="polite">
        {state.map((st, i) => (
          <li key={i} className="rounded-lg transition-colors" style={{ background: st.s === "run" ? "var(--fill)" : "transparent" }}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              disabled={st.s === "wait"}
              className="flex w-full items-start gap-3 px-3 py-2 text-left disabled:cursor-default"
            >
              <Dot s={st.s} />
              <span className="flex-1">
                <span className={`block text-[15px] ${st.s === "wait" ? "text-fg-3" : ""}`}>{st.label}</span>
                {st.tool && st.s !== "wait" && <code className="mt-0.5 block font-mono text-xs text-fg-3">{st.tool}</code>}
              </span>
              {st.s === "done" && <span className="text-xs tabular-nums text-fg-3">{(st.ms! / 1000).toFixed(1)}s</span>}
            </button>
            {open === i && st.detail && <p className="px-3 pb-3 pl-8 text-sm text-fg-2">{st.detail}</p>}
          </li>
        ))}
      </ol>
      {done && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line px-4 py-3 text-sm">
          <span>
            Changed <span className="font-medium">1 file</span> · <span className="text-emerald-300">+6</span> <span className="text-red-300">−2</span> · 48 tests pass
          </span>
          <span className="flex gap-2">
            <Btn tone="ghost" onClick={() => {}}>
              Review diff
            </Btn>
            <Btn onClick={() => {}}>Keep</Btn>
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- 02 permission */

function Permission() {
  const [choice, setChoice] = useState<null | "once" | "session" | "deny">(null);
  const [showDiff, setShowDiff] = useState(false);
  return (
    <div>
      <div className="rounded-lg border border-amber-300/30 bg-amber-300/5 p-4">
        <p className="text-sm">
          <span className="font-medium">Claude wants to run a command</span>
          <span className="text-fg-3"> · to clear a stale build before the test run</span>
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-black/40 px-3 py-2 font-mono text-[13px] text-fg">rm -rf build/ .next/cache</pre>
        <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-fg-3">Touches</dt>
          <dd>
            2 directories, 1,204 files, 38 MB.{" "}
            <button type="button" className="underline decoration-fg-3 underline-offset-4 hover:decoration-fg" onClick={() => setShowDiff((s) => !s)} aria-expanded={showDiff}>
              {showDiff ? "Hide" : "Show"} list
            </button>
          </dd>
          <dt className="text-fg-3">Reversible</dt>
          <dd>Yes. Both are regenerated by the next build.</dd>
          <dt className="text-fg-3">Outside the repo</dt>
          <dd>No.</dd>
        </dl>
        {showDiff && (
          <ul className="mt-3 max-h-28 overflow-auto rounded-md bg-black/30 px-3 py-2 font-mono text-xs text-fg-2">
            {["build/", "build/static/", "build/static/chunks/ …", ".next/cache/", ".next/cache/webpack/ …"].map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
        {choice === null && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn onClick={() => setChoice("once")}>
              Allow once
            </Btn>
            <Btn tone="ghost" onClick={() => setChoice("session")}>
              Allow <code className="font-mono">rm -rf build/</code> this session
            </Btn>
            <Btn tone="danger" onClick={() => setChoice("deny")}>
              Deny
            </Btn>
          </div>
        )}
      </div>
      {choice && (
        <div className="mt-3 flex items-start justify-between gap-4 rounded-lg border border-line px-4 py-3 text-sm" role="status">
          <span>
            {choice === "deny" && (
              <>
                <span className="font-medium">Denied.</span> Claude will run the tests against the stale build and tell you if that mattered.
              </>
            )}
            {choice === "once" && (
              <>
                <span className="font-medium">Allowed once.</span> Ran in 0.3s. The next destructive command will ask again.
              </>
            )}
            {choice === "session" && (
              <>
                <span className="font-medium">Allowed for this session.</span> Exactly this command, nothing broader. Rule shown in the session header; one click to revoke.
              </>
            )}
          </span>
          <Btn tone="ghost" onClick={() => setChoice(null)}>
            Reset
          </Btn>
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------- 03 failure */

type FailState = { phase: "idle" | "running" | "failed" | "fixing" | "fixed"; pick?: "a" | "b" };
const failSteps = [
  { at: 0, state: { phase: "running" } as FailState },
  { at: 1400, state: { phase: "failed" } as FailState },
];

function Failure() {
  const { state, run, reset, setState } = useScript(failSteps, { phase: "idle" } as FailState);
  const pick = (p: "a" | "b") => {
    setState({ phase: "fixing", pick: p });
    window.setTimeout(() => setState({ phase: "fixed", pick: p }), 1200);
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-medium">Deploy preview</span>
          <span className="text-fg-3">
            {" "}
            · {state.phase === "idle" ? "idle" : state.phase === "running" ? "building…" : state.phase === "failed" ? "failed" : state.phase === "fixing" ? "retrying…" : "deployed"}
          </span>
        </p>
        {state.phase === "idle" ? <Btn onClick={run}>Run</Btn> : <Btn tone="ghost" onClick={reset}>Reset</Btn>}
      </div>
      {state.phase === "running" && (
        <ul className="mt-5 space-y-2 text-[15px]">
          <li className="flex gap-3"><Dot s="done" />Install dependencies</li>
          <li className="flex gap-3"><Dot s="run" />Build</li>
        </ul>
      )}
      {state.phase === "failed" && (
        <div className="mt-5 rounded-lg border border-red-400/30 bg-red-400/5 p-4">
          <p className="text-sm font-medium text-red-200">Build failed at step 2 of 3</p>
          <pre className="mt-2 overflow-x-auto rounded-md bg-black/40 px-3 py-2 font-mono text-[12.5px] text-fg-2">
            {`Type error: Property 'coupon' does not exist on type 'Cart'.\n  src/cart/total.ts:14:21`}
          </pre>
          <p className="mt-3 text-sm text-fg-2">
            <span className="text-fg">What happened:</span> the edit added <code className="font-mono">cart.coupon</code> but the <code className="font-mono">Cart</code> type wasn&rsquo;t updated. Nothing was deployed.
          </p>
          <p className="mt-4 text-sm">Two ways forward:</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => pick("a")} className="rounded-lg border border-line p-3 text-left text-sm transition hover:bg-fill focus-visible:bg-fill">
              <span className="block font-medium">Add <code className="font-mono">coupon?: Coupon</code> to Cart</span>
              <span className="mt-1 block text-fg-3">Smallest change. Keeps the fix.</span>
            </button>
            <button type="button" onClick={() => pick("b")} className="rounded-lg border border-line p-3 text-left text-sm transition hover:bg-fill focus-visible:bg-fill">
              <span className="block font-medium">Revert the edit</span>
              <span className="mt-1 block text-fg-3">Back to green. The coupon bug stays.</span>
            </button>
          </div>
        </div>
      )}
      {(state.phase === "fixing" || state.phase === "fixed") && (
        <ul className="mt-5 space-y-2 text-[15px]" aria-live="polite">
          <li className="flex gap-3"><Dot s="done" />{state.pick === "a" ? "Added coupon?: Coupon to Cart" : "Reverted src/cart/total.ts"}</li>
          <li className="flex gap-3"><Dot s={state.phase === "fixed" ? "done" : "run"} />Build</li>
          <li className="flex gap-3"><Dot s={state.phase === "fixed" ? "done" : "wait"} />Deploy preview{state.phase === "fixed" && <span className="text-fg-3"> · preview-7f3a.vercel.app</span>}</li>
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------ 04 uncertainty */

function Confidence() {
  const [mode, setMode] = useState<"hedge" | "honest">("honest");
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-fg-2">
          Q: <span className="text-fg">When was the Spin App Clip featured by Apple?</span>
        </p>
        <div role="tablist" aria-label="Answer style" className="flex rounded-full border border-line p-0.5 text-xs">
          {(["honest", "hedge"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1 transition ${mode === m ? "bg-fg text-bg" : "text-fg-2"}`}>
              {m === "honest" ? "Graded" : "Hedged"}
            </button>
          ))}
        </div>
      </div>
      {mode === "hedge" ? (
        <p className="mt-5 text-[15px] leading-relaxed text-fg-2">
          I believe it may have been around 2020, possibly during WWDC, though I can&rsquo;t be completely certain and you may want to verify this information from official sources.
        </p>
      ) : (
        <div className="mt-5 space-y-3 text-[15px] leading-relaxed">
          <p>
            <mark className="rounded bg-emerald-400/15 px-1 text-fg">WWDC 2020, alongside the iOS 14 launch.</mark>{" "}
            <span className="text-xs text-fg-3">from the Spin case study on this site</span>
          </p>
          <p>
            <mark className="rounded bg-amber-300/15 px-1 text-fg">It was one of the launch App Clips demonstrated in the keynote.</mark>{" "}
            <span className="text-xs text-fg-3">inferred — not stated on this site</span>{" "}
            <button type="button" className="text-xs underline decoration-fg-3 underline-offset-4 hover:decoration-fg">
              check
            </button>
          </p>
          <p className="text-fg-2">
            I don&rsquo;t know the exact date in June. <span className="text-xs text-fg-3">no source</span>
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs text-fg-3">
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-400/60 align-middle" />sourced</span>
            <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-300/60 align-middle" />inferred</span>
            <span>plain text = unknown, said plainly</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------- 05 ask first */

type AskPhase = "idle" | "working" | "asking" | "resuming" | "done" | "paused";
type AskState = { phase: AskPhase; steps: Step[]; choice?: string; note?: string };
const ASK_BEFORE: Step[] = [
  { label: "Read the pricing page", tool: "read src/pages/pricing.tsx", s: "done", ms: 380, detail: "212 lines · 3 call-to-action buttons" },
  { label: "Find the design-system button", tool: "grep -r \"Button\" src/ds", s: "done", ms: 540, detail: "two exports match: Button (41 uses) and LegacyButton (9 uses)" },
];
const ASK_AFTER = (choice: string): Step[] => [
  ...ASK_BEFORE,
  { label: `Swap the three buttons to ${choice}`, tool: "edit src/pages/pricing.tsx", s: "done", ms: 760, detail: "+9 −9 · props mapped, no visual regressions in snapshot" },
  { label: "Run the page tests", tool: "npm test pricing", s: "done", ms: 1900, detail: "12 passed" },
];
const askStart = [
  { at: 0, state: { phase: "working", steps: ASK_BEFORE.map((x, i) => ({ ...x, s: i === 0 ? "run" : "wait" })) } as AskState },
  { at: 450, state: { phase: "working", steps: ASK_BEFORE.map((x, i) => ({ ...x, s: i === 0 ? "done" : "run" })) } as AskState },
  { at: 1100, state: { phase: "asking", steps: ASK_BEFORE } as AskState },
];

function AskFirst() {
  const initial: AskState = { phase: "idle", steps: ASK_BEFORE.map((x) => ({ ...x, s: "wait" as const })) };
  const { state, running, run, reset, setState } = useScript(askStart, initial);
  const [note, setNote] = useState("");
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const answer = (choice: string) => {
    timers.current.forEach(clearTimeout);
    const after = ASK_AFTER(choice);
    setState({ phase: "resuming", choice, steps: after.map((x, i) => ({ ...x, s: i < 2 ? "done" : i === 2 ? "run" : "wait" })) });
    timers.current.push(window.setTimeout(() => setState({ phase: "resuming", choice, steps: after.map((x, i) => ({ ...x, s: i < 3 ? "done" : "run" })) }), 800));
    timers.current.push(window.setTimeout(() => setState({ phase: "done", choice, steps: after }), 2600));
  };
  const pause = () => setState({ ...state, phase: "paused" });

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-fg-2">
          <span className="text-fg">Move the pricing page onto the design system</span>
          {state.phase === "done" && <span className="text-fg-3"> · done, with one question asked</span>}
          {state.phase === "paused" && <span className="text-fg-3"> · paused where it stopped</span>}
        </p>
        {state.phase === "idle" || state.phase === "done" || state.phase === "paused" ? (
          <Btn onClick={state.phase === "idle" ? run : () => { reset(); setNote(""); run(); }}>{state.phase === "idle" ? "Run" : "Run again"}</Btn>
        ) : (
          <Btn tone="ghost" onClick={() => { reset(); setNote(""); }} disabled={running && state.phase === "working"}>
            Stop
          </Btn>
        )}
      </div>
      <ol className="mt-4 space-y-2">
        {state.steps.map((st) => (
          <li key={st.label} className="flex items-start gap-3">
            <Dot s={st.s} />
            <div className="min-w-0 text-[15px]">
              <span className={st.s === "wait" ? "text-fg-3" : "text-fg"}>{st.label}</span>
              {st.tool && st.s !== "wait" && <span className="ml-2 font-mono text-xs text-fg-3">{st.tool}</span>}
              {st.detail && st.s === "done" && <p className="text-sm text-fg-2">{st.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
      {state.phase === "asking" && (
        <div role="group" aria-labelledby="ask-q" className="mt-5 rounded-lg border border-fg/30 bg-bg p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-fg-3">Needs a decision</p>
          <p id="ask-q" className="mt-1 text-[15px] text-fg">
            Two button components exist. Which one is canonical? The page uses neither yet, so this choice sets the pattern for the rest of the migration.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" autoFocus onClick={() => answer("Button")} className="rounded-lg border border-line p-3 text-left text-sm transition hover:border-fg focus:border-fg focus:outline-none">
              <span className="font-medium text-fg">Button</span> <span className="text-fg-3">· @ds/core · 41 uses</span>
              <span className="mt-1 block text-fg-2">The newer one. Recommended; the other is marked deprecated in its docblock.</span>
            </button>
            <button type="button" onClick={() => answer("LegacyButton")} className="rounded-lg border border-line p-3 text-left text-sm transition hover:border-fg focus:border-fg focus:outline-none">
              <span className="font-medium text-fg">LegacyButton</span> <span className="text-fg-3">· 9 uses</span>
              <span className="mt-1 block text-fg-2">Matches what the checkout page uses today.</span>
            </button>
          </div>
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (note.trim()) answer(note.trim());
            }}
          >
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Something else, in your words…" aria-label="Another answer" className="min-w-0 flex-1 rounded-full border border-line bg-transparent px-3 py-1.5 text-sm placeholder:text-fg-3 focus:border-fg focus:outline-none" />
            <Btn tone="ghost" onClick={() => note.trim() && answer(note.trim())} disabled={!note.trim()}>
              Use this
            </Btn>
          </form>
          <div className="mt-3 flex items-center justify-between text-xs text-fg-3">
            <span>It will not guess. Nothing is edited until you answer.</span>
            <button type="button" onClick={pause} className="underline decoration-fg-3 underline-offset-4 hover:text-fg">
              Not now, pause here
            </button>
          </div>
        </div>
      )}
      {state.phase === "done" && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-sm">
          <span className="text-fg-2">
            Changed 1 file · +9 −9 · 12 tests pass · decision recorded: <span className="text-fg">{state.choice}</span>
          </span>
          <span className="text-fg-3">The question and the answer stay in the log, so the next run won&rsquo;t ask again.</span>
        </div>
      )}
      {state.phase === "paused" && (
        <p className="mt-5 border-t border-line pt-4 text-sm text-fg-2">
          Paused after two read-only steps. Nothing was changed. Resume any time and the same question will be waiting.
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- page */

export function AgentPatterns() {
  return (
    <div>
      <Card
        n="01"
        title="Progress you can trust"
        thesis="An agent that works for ten seconds in silence feels broken. Show each step as it starts, name the tool it used, let the person stop it, and end with a summary they can act on."
        foot="Click a finished step to see what it found. Stop is always one tap away."
      >
        <Progress />
      </Card>
      <Card
        n="02"
        title="Permission with real scope"
        thesis="A permission prompt is a contract. It should say exactly what will be touched, whether it can be undone, and offer an allow that is as narrow as the command, never a blanket yes."
        foot="Default focus lands on the safest sufficient option."
      >
        <Permission />
      </Card>
      <Card
        n="03"
        title="Failure that recovers"
        thesis="Failure is normal. The interface should say what happened in one sentence, what did not happen (nothing deployed), and offer two concrete ways forward instead of a stack trace and a retry button."
      >
        <Failure />
      </Card>
      <Card
        n="04"
        title="Say how sure you are"
        thesis="Hedging every sentence is not honesty. Grade each claim: sourced, inferred, or unknown, with the source one glance away. The reader decides what to trust."
        foot="Toggle to compare the graded answer with the hedged one."
      >
        <Confidence />
      </Card>
      <Card
        n="05"
        title="Ask before guessing"
        thesis="When the task forks, a good agent stops and asks one precise question with the options it already found, a recommendation, and a way to say something else. It never edits on a guess, and it remembers the answer."
        foot="The question carries what the agent learned so far: counts, the deprecation note, what the other page does."
      >
        <AskFirst />
      </Card>
    </div>
  );
}
