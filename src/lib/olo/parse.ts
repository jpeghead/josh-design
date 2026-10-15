/**
 * OLO parsers. Reads the exports people already have — ChatGPT's and
 * Claude's conversations.json — into one shape. Runs in the browser; nothing
 * is sent anywhere.
 */

export type Msg = { role: "user" | "assistant"; text: string; t: number };
export type Conversation = { title: string; created: number; messages: Msg[] };

type ChatGPTNode = {
  message?: {
    author?: { role?: string };
    content?: { content_type?: string; parts?: unknown[]; text?: string };
    create_time?: number | null;
  } | null;
  parent?: string | null;
  children?: string[];
};
type ChatGPTConv = { title?: string; create_time?: number; mapping?: Record<string, ChatGPTNode> };
type ClaudeMsg = { text?: string; sender?: string; created_at?: string; content?: { type?: string; text?: string }[] };
type ClaudeConv = { name?: string; created_at?: string; chat_messages?: ClaudeMsg[] };

function partsToText(parts?: unknown[]): string {
  if (!parts) return "";
  return parts
    .map((p) => (typeof p === "string" ? p : p && typeof p === "object" && "text" in p ? String((p as { text: unknown }).text ?? "") : ""))
    .join("\n")
    .trim();
}

function fromChatGPT(convs: ChatGPTConv[]): Conversation[] {
  return convs.map((c) => {
    const nodes = c.mapping ?? {};
    const msgs: Msg[] = [];
    for (const n of Object.values(nodes)) {
      const m = n.message;
      if (!m || !m.author?.role) continue;
      const role = m.author.role === "user" ? "user" : m.author.role === "assistant" ? "assistant" : null;
      if (!role) continue;
      if (m.content?.content_type && !["text", "multimodal_text"].includes(m.content.content_type)) continue;
      const text = partsToText(m.content?.parts) || (m.content?.text ?? "");
      if (!text) continue;
      msgs.push({ role, text, t: m.create_time ? m.create_time * 1000 : (c.create_time ?? 0) * 1000 });
    }
    msgs.sort((a, b) => a.t - b.t);
    const createdMs = c.create_time ? c.create_time * 1000 : msgs[0]?.t ?? 0;
    return { title: c.title || "Untitled", created: createdMs, messages: msgs };
  });
}

function fromClaude(convs: ClaudeConv[]): Conversation[] {
  return convs.map((c) => {
    const msgs: Msg[] = (c.chat_messages ?? [])
      .map((m) => {
        const role = m.sender === "human" ? "user" : m.sender === "assistant" ? "assistant" : null;
        const text = (m.text && m.text.trim()) || (m.content ?? []).filter((x) => x.type === "text").map((x) => x.text ?? "").join("\n").trim();
        if (!role || !text) return null;
        return { role, text, t: m.created_at ? Date.parse(m.created_at) : 0 } as Msg;
      })
      .filter((x): x is Msg => !!x)
      .sort((a, b) => a.t - b.t);
    return { title: c.name || "Untitled", created: c.created_at ? Date.parse(c.created_at) : msgs[0]?.t ?? 0, messages: msgs };
  });
}

export type Source = "chatgpt" | "claude";

/** Detect the format and parse. Throws a readable error if neither matches. */
export function parseExport(json: unknown): { source: Source; conversations: Conversation[] } {
  if (!Array.isArray(json) || json.length === 0) throw new Error("That file isn't a list of conversations.");
  const first = json[0] as Record<string, unknown>;
  if (first && typeof first === "object" && "mapping" in first) {
    return { source: "chatgpt", conversations: fromChatGPT(json as ChatGPTConv[]).filter((c) => c.messages.length) };
  }
  if (first && typeof first === "object" && ("chat_messages" in first || "uuid" in first)) {
    return { source: "claude", conversations: fromClaude(json as ClaudeConv[]).filter((c) => c.messages.length) };
  }
  throw new Error("Couldn't recognize this export. OLO reads ChatGPT's and Claude's conversations.json.");
}
