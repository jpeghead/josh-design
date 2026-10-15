import { test } from "node:test";
import assert from "node:assert/strict";
import { parseExport } from "./parse.ts";
import { analyze, portrait, sampleConversations } from "./analyze.ts";

test("sample data analyzes into a coherent portrait", () => {
  const stats = analyze(sampleConversations());
  assert.ok(stats.conversations > 0);
  assert.equal(stats.byHour.length, 24);
  assert.equal(stats.byWeekday.length, 7);
  assert.ok(stats.userWords > stats.userMessages, "words outnumber messages");
  const lines = portrait(stats);
  assert.ok(lines.length >= 3);
  assert.match(lines[0], /conversations/);
  assert.doesNotMatch(lines.join(" "), /\d+th\b|NaN|undefined/, "no broken ordinals or NaN");
});

test("parses a minimal ChatGPT export", () => {
  const chatgpt = [
    {
      title: "Hello",
      create_time: 1_700_000_000,
      mapping: {
        a: { message: { author: { role: "user" }, create_time: 1_700_000_000, content: { parts: ["help me name a typeface"] } } },
        b: { message: { author: { role: "assistant" }, create_time: 1_700_000_010, content: { parts: ["Sure. A few directions:"] } } },
      },
    },
  ];
  const out = parseExport(chatgpt);
  assert.equal(out.source, "chatgpt");
  assert.equal(out.conversations.length, 1);
  assert.equal(out.conversations[0].messages.filter((m) => m.role === "user").length, 1);
});

test("parses a minimal Claude export", () => {
  const claude = [
    {
      uuid: "1",
      name: "Brief",
      created_at: "2025-03-01T10:00:00Z",
      chat_messages: [
        { sender: "human", text: "rewrite this product brief", created_at: "2025-03-01T10:00:00Z" },
        { sender: "assistant", text: "Here is a tighter version.", created_at: "2025-03-01T10:00:05Z" },
      ],
    },
  ];
  const out = parseExport(claude);
  assert.equal(out.source, "claude");
  assert.equal(out.conversations[0].messages.length, 2);
});
