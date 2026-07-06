"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWindowManager } from "./window-store";
import { useSettings } from "./settings-store";
import {
  buildPlan,
  parseIntent,
  streamText,
  type Bridge,
  type Plan,
} from "./darkroom-ai";
import { playSound } from "./ui-sound";

export type AiState = "idle" | "thinking" | "executing" | "responding";

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** When the message is mid-stream; true means more chars will arrive */
  streaming?: boolean;
  /** Plan steps as they execute, populated only on assistant messages */
  steps?: { label: string; done: boolean }[];
  ts: number;
};

type Ctx = {
  state: AiState;
  messages: AiMessage[];
  submit: (text: string) => Promise<void>;
  clear: () => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
  togglePanel: () => void;
};

const AiCtx = createContext<Ctx | null>(null);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const wm = useWindowManager();
  const { set, setDock, settings } = useSettings();
  void settings;
  const [state, setState] = useState<AiState>("idle");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  // Refs to the latest WM so the bridge always sees fresh state
  const wmRef = useRef(wm);
  wmRef.current = wm;

  const bridge = useMemo<Bridge>(
    () => ({
      open: (req) => wmRef.current.open(req),
      snap: (id, zone) => wmRef.current.snap(id, zone),
      close: (id) => wmRef.current.close(id),
      closeAll: () => wmRef.current.closeAll(),
      setTheme: (v) => set("theme", v),
      setDock: (pos) => setDock("position", pos),
      setSound: (on) => set("sound", on),
      setHud: (on) => set("hud", on),
      setWallpaper: (i) => set("wallpaper", Math.max(1, Math.min(5, i))),
      openMissionControl: () => wmRef.current.setMissionControl(true),
      openNotificationCenter: () => wmRef.current.setNotificationCenter(true),
      fireDevelop: () => {
        "develop".split("").forEach((k, i) =>
          setTimeout(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: k })), i * 25)
        );
      },
      lock: () => window.dispatchEvent(new CustomEvent("darkroom:lock-now")),
      reboot: () => {
        sessionStorage.removeItem("darkroom-booted");
        sessionStorage.removeItem("darkroom-notice");
        location.reload();
      },
      listOpenSlugs: () =>
        wmRef.current.windows
          .filter((w) => !w.minimized)
          .sort((a, b) => b.zIndex - a.zIndex)
          .map((w) => w.slug),
    }),
    [set, setDock]
  );

  const submit = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      const userMsg: AiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text,
        ts: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);

      const intent = parseIntent(text);
      const plan: Plan = buildPlan(intent, bridge);

      // Open assistant message with empty body — we'll stream into it
      const assistantId = crypto.randomUUID();
      setMessages((m) => [
        ...m,
        {
          id: assistantId,
          role: "assistant",
          text: "",
          streaming: true,
          steps: plan.steps.map((s) => ({ label: s.label, done: false })),
          ts: Date.now(),
        },
      ]);

      setState("thinking");
      playSound("click");

      // Tiny "thinking" pause before first character
      await wait(220);

      // Stream the preamble
      await new Promise<void>((resolve) => {
        streamText(
          plan.preamble,
          (full) => {
            setMessages((m) =>
              m.map((x) =>
                x.id === assistantId ? { ...x, text: full } : x
              )
            );
          },
          { msPerChar: 16, onDone: resolve }
        );
      });

      // Execute plan steps with visible progression
      if (plan.steps.length) {
        setState("executing");
        for (let i = 0; i < plan.steps.length; i++) {
          const step = plan.steps[i];
          step.action?.();
          // Mark step done
          setMessages((m) =>
            m.map((x) =>
              x.id === assistantId
                ? {
                    ...x,
                    steps: x.steps?.map((s, j) =>
                      j === i ? { ...s, done: true } : s
                    ),
                  }
                : x
            )
          );
          // Side-effect post-step: snap-after-open for "compare" plans
          if (plan.intent.kind === "compare" && (i === 0 || i === 2)) {
            // Just-opened window is now the focused one — snap it
            await wait(60);
            const id = wmRef.current.focused;
            if (id) {
              wmRef.current.snap(id, i === 0 ? "left" : "right");
            }
          }
          if (plan.intent.kind === "workspace" && plan.intent.preset === "founder") {
            if (i === 1 || i === 3) {
              await wait(60);
              const id = wmRef.current.focused;
              if (id) wmRef.current.snap(id, i === 1 ? "left" : "right");
            }
          }
          await wait(step.hold ?? 240);
        }
      }

      // Stream outro
      if (plan.outro) {
        setState("responding");
        await wait(120);
        await new Promise<void>((resolve) => {
          streamText(
            "\n" + plan.outro,
            (full) => {
              setMessages((m) =>
                m.map((x) =>
                  x.id === assistantId
                    ? { ...x, text: plan.preamble + full }
                    : x
                )
              );
            },
            { msPerChar: 14, onDone: resolve }
          );
        });
      }

      // Mark stream complete
      setMessages((m) =>
        m.map((x) => (x.id === assistantId ? { ...x, streaming: false } : x))
      );
      setState("idle");
    },
    [bridge]
  );

  // First-visit greeting once per session
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("darkroom-ai-greeted") === "true") return;
    sessionStorage.setItem("darkroom-ai-greeted", "true");
    // Light delay so boot animation completes
    const id = setTimeout(() => {
      submit("hey");
    }, 3200);
    return () => clearTimeout(id);
  }, [submit]);

  const clear = useCallback(() => setMessages([]), []);
  const togglePanel = useCallback(() => setPanelOpen((v) => !v), []);

  const value = useMemo<Ctx>(
    () => ({ state, messages, submit, clear, panelOpen, setPanelOpen, togglePanel }),
    [state, messages, submit, clear, panelOpen, togglePanel]
  );

  return <AiCtx.Provider value={value}>{children}</AiCtx.Provider>;
}

export function useAi(): Ctx {
  const c = useContext(AiCtx);
  if (!c) throw new Error("useAi must be used inside <AiProvider>");
  return c;
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
