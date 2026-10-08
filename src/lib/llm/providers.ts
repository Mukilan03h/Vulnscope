import type { LlmTarget } from "@/lib/types";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Minimal multi-provider chat client. Calls run from the browser directly to
 * the endpoint the user configures, with the user's own key. Nothing is proxied
 * through or stored by VulnScope's servers (there are none).
 */
export async function chat(
  target: LlmTarget,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  if (target.provider === "anthropic") return anthropic(target, messages, signal);
  return openAiCompatible(target, messages, signal);
}

async function openAiCompatible(
  t: LlmTarget,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const base = t.baseUrl.replace(/\/$/, "");
  const url = base.endsWith("/chat/completions") ? base : `${base}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      ...(t.apiKey ? { authorization: `Bearer ${t.apiKey}` } : {}),
    },
    body: JSON.stringify({ model: t.model, messages, temperature: 0, max_tokens: 512 }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function anthropic(
  t: LlmTarget,
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  const base = t.baseUrl.replace(/\/$/, "");
  const url = base.endsWith("/messages") ? base : `${base}/v1/messages`;
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n");
  const rest = messages.filter((m) => m.role !== "system");
  const res = await fetch(url, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      ...(t.apiKey ? { "x-api-key": t.apiKey } : {}),
    },
    body: JSON.stringify({
      model: t.model,
      system: system || undefined,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 512,
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return data?.content?.map((b: { text?: string }) => b.text ?? "").join("") ?? "";
}
