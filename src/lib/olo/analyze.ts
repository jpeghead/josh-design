/**
 * OLO analysis: the shape of how someone thinks, from their own questions.
 * Pure functions over the parsed conversations. Runs locally.
 */
import type { Conversation } from "./parse";

const STOP = new Set(
  `a about above after again against all am an and any are as at be because been before being below between both but by can could did do does doing don't down during each few for from further had has have having he her here hers herself him himself his how i if in into is it it's its itself just let's me more most my myself no nor not of off on once only or other ought our ours ourselves out over own same she should so some such than that that's the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours yourself yourselves im ive dont cant wont thats like get got make want need know think also really something things thing one two way use using used lot much many well okay ok yes yeah please thanks thank hi hello hey sure right now still even going go say said see look give take come put back new good great best better may might must shall us u ur re ve ll d s t m
`.split(/\s+/)
);

export type Stats = {
  conversations: number;
  userMessages: number;
  modelMessages: number;
  userWords: number;
  modelWords: number;
  firstDay: number;
  lastDay: number;
  activeDays: number;
  byHour: number[]; // 24, user messages
  byWeekday: number[]; // 7, Sunday first
  byMonth: { key: string; n: number }[];
  longest: { title: string; messages: number; words: number } | null;
  medianLength: number;
  topTerms: { term: string; n: number }[];
  topBigrams: { term: string; n: number }[];
  openers: { opener: string; n: number }[];
  nightShare: number;
  weekendShare: number;
  questionShare: number;
  avgUserWords: number;
  busiestMonth: { key: string; n: number } | null;
  streak: number;
};

const words = (s: string) => s.toLowerCase().replace(/[`*_>#]/g, " ").match(/[a-z][a-z'-]{1,}/g) ?? [];

export function analyze(convs: Conversation[]): Stats {
  const byHour = new Array(24).fill(0);
  const byWeekday = new Array(7).fill(0);
  const months = new Map<string, number>();
  const days = new Set<string>();
  const terms = new Map<string, number>();
  const bigrams = new Map<string, number>();
  const openers = new Map<string, number>();
  let userMessages = 0, modelMessages = 0, userWords = 0, modelWords = 0, night = 0, weekend = 0, questions = 0;
  let first = Infinity, last = -Infinity;
  const lengths: number[] = [];
  let longest: Stats["longest"] = null;

  for (const c of convs) {
    lengths.push(c.messages.length);
    const cw = c.messages.reduce((a, m) => a + words(m.text).length, 0);
    if (!longest || c.messages.length > longest.messages) longest = { title: c.title, messages: c.messages.length, words: cw };
    for (const m of c.messages) {
      const w = words(m.text);
      if (m.role === "assistant") {
        modelMessages++;
        modelWords += w.length;
        continue;
      }
      userMessages++;
      userWords += w.length;
      if (m.t) {
        const d = new Date(m.t);
        first = Math.min(first, m.t);
        last = Math.max(last, m.t);
        byHour[d.getHours()]++;
        byWeekday[d.getDay()]++;
        const h = d.getHours();
        if (h >= 22 || h < 4) night++;
        if (d.getDay() === 0 || d.getDay() === 6) weekend++;
        const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months.set(mk, (months.get(mk) ?? 0) + 1);
        days.add(`${mk}-${String(d.getDate()).padStart(2, "0")}`);
      }
      if (/\?\s*$/.test(m.text.trim()) || /^(how|why|what|when|where|who|which|can|could|should|would|is|are|does|do|did)\b/i.test(m.text.trim())) questions++;
      const op = m.text.trim().toLowerCase().match(/^(how do i|how can i|how do you|how does|how to|why does|why is|why do|what is|what's|what are|what does|can you|could you|should i|is there|is it|do you|help me|write|explain|make|give me|i need|i want|i'm|i am)\b/);
      if (op) openers.set(op[1], (openers.get(op[1]) ?? 0) + 1);
      const kept = w.filter((x) => !STOP.has(x) && x.length > 2);
      for (const x of kept) terms.set(x, (terms.get(x) ?? 0) + 1);
      for (let i = 0; i < kept.length - 1; i++) {
        const b = `${kept[i]} ${kept[i + 1]}`;
        bigrams.set(b, (bigrams.get(b) ?? 0) + 1);
      }
    }
  }
  const top = (m: Map<string, number>, n: number, min = 2) =>
    [...m.entries()].filter(([, v]) => v >= min).sort((a, b) => b[1] - a[1]).slice(0, n).map(([term, v]) => ({ term, n: v }));
  const byMonth = [...months.entries()].sort().map(([key, n]) => ({ key, n }));
  const sortedDays = [...days].sort();
  let streak = 0, cur = 0, prev: number | null = null;
  for (const d of sortedDays) {
    const t = Date.parse(d);
    cur = prev !== null && t - prev === 86400000 ? cur + 1 : 1;
    streak = Math.max(streak, cur);
    prev = t;
  }
  lengths.sort((a, b) => a - b);
  return {
    conversations: convs.length,
    userMessages,
    modelMessages,
    userWords,
    modelWords,
    firstDay: isFinite(first) ? first : 0,
    lastDay: isFinite(last) ? last : 0,
    activeDays: days.size,
    byHour,
    byWeekday,
    byMonth,
    longest,
    medianLength: lengths.length ? lengths[Math.floor(lengths.length / 2)] : 0,
    topTerms: top(terms, 30),
    topBigrams: top(bigrams, 12),
    openers: [...openers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([opener, n]) => ({ opener, n })),
    nightShare: userMessages ? night / userMessages : 0,
    weekendShare: userMessages ? weekend / userMessages : 0,
    questionShare: userMessages ? questions / userMessages : 0,
    avgUserWords: userMessages ? userWords / userMessages : 0,
    busiestMonth: byMonth.length ? byMonth.reduce((a, b) => (b.n > a.n ? b : a)) : null,
    streak,
  };
}

/** The portrait, in sentences, from the numbers. No model involved. */
export function portrait(s: Stats): string[] {
  const out: string[] = [];
  const fmt = (n: number) => n.toLocaleString("en-US");
  const span = s.firstDay && s.lastDay ? Math.max(1, Math.round((s.lastDay - s.firstDay) / 86400000)) : 0;
  const monthName = (k: string) => new Date(k + "-15").toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const ratio = s.modelWords / Math.max(1, s.userWords);
  const share =
    ratio >= 1.5
      ? `For every word you wrote, about ${ratio.toFixed(ratio >= 10 ? 0 : 1)} came back.`
      : ratio > 0.67
        ? "You and the model wrote about the same amount."
        : "You wrote more than came back; you brief at length.";
  out.push(`${fmt(s.conversations)} conversations, ${fmt(s.userMessages)} messages from you, ${fmt(s.userWords)} of your own words${span ? ` across ${fmt(span)} days` : ""}. ${share}`);
  const peakHour = s.byHour.indexOf(Math.max(...s.byHour));
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const peakDay = s.byWeekday.indexOf(Math.max(...s.byWeekday));
  const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
  if (s.userMessages) {
    out.push(
      `Your peak hour is ${hourLabel(peakHour)} and your peak day is ${dayNames[peakDay]}. ${Math.round(s.nightShare * 100)}% of your messages are sent between 10pm and 4am; ${Math.round(s.weekendShare * 100)}% land on a weekend.`
    );
  }
  if (s.busiestMonth) out.push(`${monthName(s.busiestMonth.key)} was your busiest month, with ${fmt(s.busiestMonth.n)} messages. Your longest run was ${s.streak} day${s.streak === 1 ? "" : "s"} in a row.`);
  if (s.topTerms.length) out.push(`The words you keep coming back to: ${s.topTerms.slice(0, 8).map((t) => t.term).join(", ")}.`);
  if (s.openers.length) out.push(`You open with "${s.openers[0].opener}" more than anything else. ${Math.round(s.questionShare * 100)}% of what you send is a question.`);
  if (s.longest) out.push(`Your longest conversation, "${s.longest.title}", ran ${fmt(s.longest.messages)} messages. Your typical one is ${s.medianLength}.`);
  out.push(`Average message from you: ${Math.round(s.avgUserWords)} words. ${s.avgUserWords > 40 ? "You brief, you don't bark." : s.avgUserWords > 15 ? "Short, specific, then you let it work." : "You think in fragments and let the model fill them in."}`);
  return out;
}

/** Deterministic sample data so anyone can see what a portrait looks like. */
export function sampleConversations(): Conversation[] {
  let seed = 42;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const topics = [
    ["how do i", "structure a design system for a flutter app without it turning into a style guide nobody reads"],
    ["why does", "my next.js build pass locally and fail on vercel with a missing file"],
    ["what is", "the difference between grounding a model and fine-tuning it, in plain terms"],
    ["can you", "rewrite this product brief so it says what we're not doing"],
    ["help me", "name a typeface inspired by a sci-fi film without sounding like a parody"],
    ["should i", "ship the beta with the bug or hold a week"],
    ["explain", "how a vertex shader can morph one point cloud into another without tearing"],
    ["give me", "three ways a permission prompt could show scope instead of a yes/no"],
    ["i want", "a portrait of how i think from my own chat history, nothing uploaded"],
    ["how can i", "tell a hiring manager what i actually did without borrowing the company's numbers"],
  ];
  const start = Date.UTC(2025, 0, 6);
  const convs: Conversation[] = [];
  for (let i = 0; i < 140; i++) {
    const day = Math.floor(r() * 280);
    const hour = r() < 0.3 ? 22 + Math.floor(r() * 5) : 8 + Math.floor(r() * 13);
    const t0 = start + day * 86400000 + (hour % 24) * 3600000;
    const [op, rest] = topics[Math.floor(r() * topics.length)];
    const n = 2 + Math.floor(r() * r() * 14) * 2;
    const messages = [];
    for (let k = 0; k < n; k++) {
      const user = k % 2 === 0;
      messages.push({
        role: user ? ("user" as const) : ("assistant" as const),
        text: user ? `${op} ${rest}${k ? " — and what about the edge case" : ""}?` : `Here is a way to think about it. ${"Detail ".repeat(20 + Math.floor(r() * 60))}`,
        t: t0 + k * 240000,
      });
    }
    convs.push({ title: rest.split(" ").slice(0, 5).join(" "), created: t0, messages });
  }
  return convs;
}
