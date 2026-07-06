/**
 * Web Audio UI sounds. No audio files — every effect is synthesized on
 * demand so the bundle stays small and the timing is exact. All sounds
 * are short, quiet, mono-flavored to match Darkroom OS.
 */

let ctx: AudioContext | null = null;
let enabled = false;
let volume = 0.18;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext ||
        // @ts-expect-error legacy webkit
        window.webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

export function setSoundVolume(v: number) {
  volume = Math.max(0, Math.min(1, v));
}

function envelope(
  c: AudioContext,
  attack: number,
  release: number,
  peak: number
) {
  const gain = c.createGain();
  const now = c.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak * volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + attack + release);
  return gain;
}

function osc(c: AudioContext, freq: number, type: OscillatorType = "sine") {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, c.currentTime);
  return o;
}

export type SoundName =
  | "open"
  | "close"
  | "minimize"
  | "unminimize"
  | "notification"
  | "click"
  | "snap"
  | "boot"
  | "lock"
  | "unlock";

export function playSound(name: SoundName) {
  if (!enabled) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});

  const now = c.currentTime;

  switch (name) {
    case "open": {
      // Soft upward chirp: 320Hz → 540Hz sine, 18ms attack, 110ms release
      const o = osc(c, 320, "sine");
      const g = envelope(c, 0.018, 0.11, 0.6);
      o.frequency.exponentialRampToValueAtTime(540, now + 0.12);
      o.connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.14);
      break;
    }
    case "close": {
      // Downward sigh: 480Hz → 220Hz, slightly longer release
      const o = osc(c, 480, "sine");
      const g = envelope(c, 0.014, 0.16, 0.5);
      o.frequency.exponentialRampToValueAtTime(220, now + 0.16);
      o.connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.18);
      break;
    }
    case "minimize": {
      // Drop: 600 → 180, faster
      const o = osc(c, 600, "triangle");
      const g = envelope(c, 0.008, 0.12, 0.45);
      o.frequency.exponentialRampToValueAtTime(180, now + 0.13);
      o.connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.15);
      break;
    }
    case "unminimize": {
      const o = osc(c, 220, "triangle");
      const g = envelope(c, 0.01, 0.1, 0.5);
      o.frequency.exponentialRampToValueAtTime(620, now + 0.1);
      o.connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.12);
      break;
    }
    case "notification": {
      // Two-note sodium chime: 880Hz → 1175Hz (A → D)
      const a = osc(c, 880, "sine");
      const ga = envelope(c, 0.005, 0.18, 0.5);
      a.connect(ga).connect(c.destination);
      a.start(now);
      a.stop(now + 0.2);

      const b = osc(c, 1175, "sine");
      const gb = envelope(c, 0.01, 0.22, 0.5);
      b.connect(gb).connect(c.destination);
      b.start(now + 0.06);
      b.stop(now + 0.3);
      break;
    }
    case "click": {
      // Brief tick — band-limited noise burst
      const buf = c.createBuffer(1, c.sampleRate * 0.03, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
      }
      const src = c.createBufferSource();
      src.buffer = buf;
      const g = envelope(c, 0.001, 0.025, 0.35);
      // Low-pass to take edge off
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2400;
      src.connect(filter).connect(g).connect(c.destination);
      src.start(now);
      break;
    }
    case "snap": {
      // Crisp double-click low-pass
      const o = osc(c, 700, "square");
      const g = envelope(c, 0.003, 0.04, 0.18);
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1800;
      o.connect(filter).connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.05);
      break;
    }
    case "boot": {
      // Long warm hum upward
      const o = osc(c, 110, "sawtooth");
      const g = envelope(c, 0.2, 0.6, 0.22);
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(180, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.8);
      o.connect(filter).connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.85);
      break;
    }
    case "lock": {
      const o = osc(c, 540, "sine");
      const g = envelope(c, 0.01, 0.18, 0.4);
      o.frequency.exponentialRampToValueAtTime(180, now + 0.18);
      o.connect(g).connect(c.destination);
      o.start(now);
      o.stop(now + 0.2);
      break;
    }
    case "unlock": {
      // Two-note ascending
      const a = osc(c, 440, "sine");
      const ga = envelope(c, 0.01, 0.18, 0.45);
      a.connect(ga).connect(c.destination);
      a.start(now);
      a.stop(now + 0.2);

      const b = osc(c, 660, "sine");
      const gb = envelope(c, 0.01, 0.22, 0.45);
      b.connect(gb).connect(c.destination);
      b.start(now + 0.08);
      b.stop(now + 0.32);
      break;
    }
  }
}
