/**
 * Synthesized ambience — the city you can hear but not see.
 * Brown-noise traffic bed + occasional bird chirps, low-passed harder
 * indoors so stepping outside opens the sound up. No audio files.
 */
let ctx: AudioContext | null = null;
let filter: BiquadFilterNode | null = null;
let started = false;

export function startAmbience() {
  if (started || typeof window === "undefined") return;
  try {
    started = true;
    ctx = new AudioContext();
    const master = ctx.createGain();
    master.gain.value = 0.14;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520; // indoors by default
    filter.connect(master);
    master.connect(ctx.destination);

    // traffic: looping brown noise
    const len = ctx.sampleRate * 4;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const trafficGain = ctx.createGain();
    trafficGain.gain.value = 0.5;
    src.connect(trafficGain).connect(filter);
    src.start();

    // birds: sparse chirps
    const chirp = () => {
      if (!ctx || !filter) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f0 = 2400 + Math.random() * 1400;
      o.frequency.setValueAtTime(f0, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.5, ctx.currentTime + 0.09);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.9, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      o.connect(g).connect(filter);
      o.start();
      o.stop(ctx.currentTime + 0.25);
      setTimeout(chirp, 2600 + Math.random() * 6000);
    };
    setTimeout(chirp, 1500);
  } catch {
    /* audio is a garnish — never break the game for it */
  }
}

export function setAmbienceInside(inside: boolean) {
  if (!filter || !ctx) return;
  filter.frequency.linearRampToValueAtTime(inside ? 520 : 5200, ctx.currentTime + 0.6);
}

/* ------------------------------------------------------------- SFX ----
 * All synthesized — original retro-FPS-spirit foley, no audio files.
 * The context comes from startAmbience(), so SFX are silent until the
 * first user gesture (which is when they could be heard anyway).
 */

let noiseBuf: AudioBuffer | null = null;
function noise(): AudioBuffer | null {
  if (!ctx) return null;
  if (!noiseBuf) {
    const len = ctx.sampleRate * 0.5;
    noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBuf;
}

/** short filtered noise burst — the workhorse behind steps and thuds */
function burst(freq: number, q: number, gain: number, dur: number, type: BiquadFilterType = "bandpass") {
  if (!ctx) return;
  const buf = noise();
  if (!buf) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  const t = ctx.currentTime;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t, Math.random() * 0.3);
  src.stop(t + dur + 0.02);
}

/** alternating hard-soled footstep; `hard` = interior floor vs pavement */
let stepFlip = false;
export function sfxFootstep(hard: boolean) {
  if (!ctx) return;
  stepFlip = !stepFlip;
  const base = hard ? 520 : 340;
  const vary = 0.85 + Math.random() * 0.3;
  burst(base * vary * (stepFlip ? 1.06 : 0.94), 1.2, 0.16, 0.085);
  burst(120 * vary, 0.8, 0.1, 0.06, "lowpass");
}

export function sfxJump() {
  if (!ctx) return;
  burst(240, 0.9, 0.12, 0.09, "lowpass");
}

/** landing thud — intensity 0..1 scales with fall speed */
export function sfxLand(intensity: number) {
  if (!ctx) return;
  const k = Math.min(Math.max(intensity, 0.2), 1);
  burst(95, 0.7, 0.3 * k, 0.13, "lowpass");
  burst(420, 1.1, 0.12 * k, 0.07);
}
