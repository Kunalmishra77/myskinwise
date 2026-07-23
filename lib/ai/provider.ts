export type ChatTurn = { role: "user" | "assistant"; content: string };

export type CompletionResult =
  | { ok: true; text: string }
  | { ok: false; reason: "not-configured" | "timeout" | "failed" };

/**
 * The seam between the assistant's orchestration and whichever LLM answers.
 * A future voice agent reuses everything above this interface — grounding,
 * safety, context — and only swaps what sits below it.
 */
export interface AiProvider {
  isConfigured(): boolean;
  complete(system: string, messages: ChatTurn[]): Promise<CompletionResult>;
}

class UnconfiguredProvider implements AiProvider {
  isConfigured() {
    return false;
  }
  async complete(): Promise<CompletionResult> {
    return { ok: false, reason: "not-configured" };
  }
}

/**
 * Anthropic Messages API via fetch — no SDK dependency.
 *
 * Anthropic is the recommended provider for this use because its usage
 * policy requires exactly the architecture Skinwise already has (a licensed
 * human reviews advice before it is finalised), where Gemini's terms forbid
 * clinical-adjacent use outright (platform architecture spec §7.3).
 *
 * Haiku is the model tier: a grounded product-Q&A assistant does not need a
 * frontier model, and Haiku keeps per-message cost negligible.
 *
 * The key is read from the environment and never leaves the server — this
 * module must only ever be imported by a server route.
 */
class AnthropicProvider implements AiProvider {
  private readonly model = "claude-haiku-4-5-20251001";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return true;
  }

  async complete(system: string, messages: ChatTurn[]): Promise<CompletionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 700,
          system,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok) return { ok: false, reason: "failed" };
      const data = (await res.json()) as { content?: { type: string; text?: string }[] };
      const text = (data.content ?? [])
        .filter((b) => b.type === "text" && b.text)
        .map((b) => b.text)
        .join("")
        .trim();
      if (!text) return { ok: false, reason: "failed" };
      return { ok: true, text };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return { ok: false, reason: "timeout" };
      return { ok: false, reason: "failed" };
    } finally {
      clearTimeout(timeout);
    }
  }
}

let instance: AiProvider | null = null;

export function getAiProvider(): AiProvider {
  if (instance) return instance;
  const key = process.env.ANTHROPIC_API_KEY;
  instance = key ? new AnthropicProvider(key) : new UnconfiguredProvider();
  return instance;
}

/** Test seam. */
export function __setAiProvider(next: AiProvider | null) {
  instance = next;
}
