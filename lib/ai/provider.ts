export type ChatTurn = { role: "user" | "assistant"; content: string };

export type CompletionResult =
  | { ok: true; text: string }
  | { ok: false; reason: "not-configured" | "timeout" | "failed" };

/**
 * The seam between the assistant's orchestration and whichever LLM answers.
 * A future voice agent reuses everything above this interface — grounding,
 * safety, context — and only swaps what sits below it.
 */
export type CompleteOptions = { maxTokens?: number };

export interface AiProvider {
  isConfigured(): boolean;
  complete(system: string, messages: ChatTurn[], opts?: CompleteOptions): Promise<CompletionResult>;
  /**
   * Streams the reply as text deltas, for the voice pipeline (so TTS can start
   * on the first sentence instead of waiting for the whole reply). Optional:
   * providers without it fall back to complete().
   */
  stream?(system: string, messages: ChatTurn[], opts?: CompleteOptions): AsyncGenerator<string, void, unknown>;
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

  async complete(system: string, messages: ChatTurn[], opts?: CompleteOptions): Promise<CompletionResult> {
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
          max_tokens: opts?.maxTokens ?? 700,
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

/**
 * OpenAI Chat Completions via fetch — no SDK dependency, mirroring the
 * Anthropic adapter so the orchestrator, grounding and safety layers see an
 * identical interface and stay untouched.
 *
 * gpt-4.1-mini is the model: a grounded product-Q&A assistant does not need
 * a frontier model, and 4.1-mini is the current cost-efficient tier that is
 * available on the funded account (gpt-5-mini rejects the classic
 * parameters). The exact id is overridable via OPENAI_MODEL for when the
 * account gains access to a newer mini tier, without a code change.
 *
 * The grounded Skinwise system prompt arrives here already assembled and is
 * passed as the system message — the model receives exactly what the
 * orchestrator built, no more. The key is read from the environment and
 * never leaves the server.
 */
class OpenAiProvider implements AiProvider {
  private readonly model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  constructor(private readonly apiKey: string) {}

  isConfigured() {
    return true;
  }

  async complete(system: string, messages: ChatTurn[], opts?: CompleteOptions): Promise<CompletionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: opts?.maxTokens ?? 700,
          messages: [
            { role: "system", content: system },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
        signal: controller.signal,
      });

      if (!res.ok) return { ok: false, reason: "failed" };
      const data = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) return { ok: false, reason: "failed" };
      return { ok: true, text };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return { ok: false, reason: "timeout" };
      return { ok: false, reason: "failed" };
    } finally {
      clearTimeout(timeout);
    }
  }

  async *stream(
    system: string,
    messages: ChatTurn[],
    opts?: CompleteOptions,
  ): AsyncGenerator<string, void, unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          max_tokens: opts?.maxTokens ?? 700,
          stream: true,
          messages: [
            { role: "system", content: system },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`openai stream ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // SSE frames are separated by blank lines; each has a `data:` payload.
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          const line = buffer.slice(0, nl).trim();
          buffer = buffer.slice(nl + 1);
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") return;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch {
            /* ignore keep-alive / partial frames */
          }
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}

let instance: AiProvider | null = null;

/**
 * Provider selection, in priority order: OpenAI (the funded account), then
 * Anthropic, then a graceful unconfigured fallback. Both real adapters are
 * kept — switching provider is an environment change, not a code change.
 */
export function getAiProvider(): AiProvider {
  if (instance) return instance;
  const openai = process.env.OPENAI_API_KEY;
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (openai) instance = new OpenAiProvider(openai);
  else if (anthropic) instance = new AnthropicProvider(anthropic);
  else instance = new UnconfiguredProvider();
  return instance;
}

/** Test seam. */
export function __setAiProvider(next: AiProvider | null) {
  instance = next;
}
