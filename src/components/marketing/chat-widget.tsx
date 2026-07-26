"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

const WELCOME = "Hi! Ask me anything about Synerix or Synerix Studio.";
const MAX_HISTORY = 12;
const MAX_INPUT_CHARS = 1200;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, streaming, open]);

  // Focus the input when the panel opens; abort any stream on unmount.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      setError(null);
      setInput("");
      setStreaming(true);

      const userTurn: ChatMessage = { role: "user", content };
      // Keep the window aligned to a user turn: an odd-length transcript sliced
      // to a fixed size starts on an ASSISTANT turn, which the model rejects —
      // so long (engaged) conversations broke with no error at all. Also drop
      // any empty assistant turn, which used to fail the server's min(1) check
      // and brick the conversation permanently.
      const windowed = [...messages, userTurn]
        .filter((m) => m.content.trim().length > 0)
        .slice(-MAX_HISTORY);
      const firstUser = windowed.findIndex((m) => m.role === "user");
      const history = firstUser > 0 ? windowed.slice(firstUser) : windowed;
      setMessages([...history, { role: "assistant", content: "" }]);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          let message = "Something went wrong. Please try sending that again.";
          try {
            const data = (await res.json()) as { error?: string };
            if (data.error) message = data.error;
          } catch {
            // Non-JSON error body; keep the generic message.
          }
          // Drop the empty assistant placeholder, keep the user turn.
          setMessages(history);
          setError(message);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: last.content + chunk };
            }
            return next;
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          // Keep whatever already streamed — dropping it forces the visitor to
          // retype the question, which on mobile is where streams drop most.
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            return last?.role === "assistant" && last.content.trim().length === 0 ? history : prev;
          });
          setError("Could not reach the assistant. Check your connection and try again.");
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  };

  return (
    <>
      {/* Launcher */}
      {!open && (
        <button
          type="button"
          aria-label="Open the Synerix chat assistant"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-mk-cyan text-mk-ink shadow-lg shadow-mk-ink/30 transition-colors hover:bg-mk-cyan-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-cyan"
        >
          <MessageCircle className="size-6" aria-hidden />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Synerix chat assistant"
          className="fixed inset-x-0 bottom-0 z-50 flex h-[70vh] max-h-[540px] w-full flex-col overflow-hidden rounded-t-2xl border border-mk-line-dark bg-mk-ink text-mk-mist shadow-2xl shadow-mk-ink/40 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:h-[480px] sm:w-[360px] sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mk-line-dark px-4 py-3">
            <div>
              <p className="mk-mono text-[11px] text-mk-cyan">Synerix assistant</p>
              <p className="text-xs text-mk-mist/70">Consulting and Studio questions</p>
            </div>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="flex size-8 items-center justify-center rounded-full text-mk-mist transition-colors hover:bg-mk-navy hover:text-white"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            role="log"
            aria-live="polite"
            aria-busy={streaming}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            <Bubble role="assistant">{WELCOME}</Bubble>
            {messages.map((m, i) =>
              m.role === "assistant" && m.content === "" && streaming ? (
                <TypingDots key={i} />
              ) : (
                <Bubble key={i} role={m.role}>
                  {m.content}
                </Bubble>
              ),
            )}
            {error && (
              <p className="rounded-xl bg-mk-navy px-3 py-2 text-xs text-rose-300">{error}</p>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-mk-line-dark p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={MAX_INPUT_CHARS}
                readOnly={streaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about Synerix..."
                aria-label="Message the Synerix assistant"
                className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-mk-line-dark bg-mk-navy px-3.5 py-2.5 text-sm text-white placeholder:text-mk-mist/50 focus:outline-none focus:ring-1 focus:ring-mk-cyan disabled:opacity-60"
              />
              {streaming ? (
                <button
                  type="button"
                  aria-label="Stop the assistant"
                  onClick={() => abortRef.current?.abort()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-navy text-mk-mist transition-colors hover:text-white"
                >
                  <span className="block size-3 rounded-[2px] bg-current" aria-hidden />
                </button>
              ) : (
                <button
                  type="button"
                  aria-label="Send message"
                  onClick={() => void send(input)}
                  disabled={!input.trim()}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-cyan text-mk-ink transition-colors hover:bg-mk-cyan-bright disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** The model answers in light markdown. Rendering it as a raw text node showed
 * literal ** and # on the marketing homepage, which reads as a broken reply.
 * This handles exactly what the system prompt can produce — bold, bullets and
 * headings — without pulling a markdown library into the marketing bundle. */
function renderRich(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const body = heading?.[1] ?? bullet?.[1] ?? line;
    const parts = body.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      seg.startsWith("**") && seg.endsWith("**") && seg.length > 4 ? (
        <strong key={j}>{seg.slice(2, -2)}</strong>
      ) : (
        <span key={j}>{seg}</span>
      ),
    );
    if (heading) return <p key={i} className="mt-1 font-semibold">{parts}</p>;
    if (bullet) return <p key={i} className="pl-3 -indent-3">{"\u2022 "}{parts}</p>;
    if (!line.trim()) return <span key={i} className="block h-2" />;
    return <p key={i}>{parts}</p>;
  });
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={role === "user" ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          role === "user"
            ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-mk-cyan px-3.5 py-2.5 text-sm leading-relaxed text-mk-ink"
            : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-mk-navy px-3.5 py-2.5 text-sm leading-relaxed text-mk-mist"
        }
      >
        {role === "assistant" && typeof children === "string" ? renderRich(children) : children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-mk-navy px-3.5 py-3">
        <span className="size-1.5 animate-bounce rounded-full bg-mk-cyan [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-mk-cyan [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-mk-cyan [animation-delay:300ms]" />
      </div>
    </div>
  );
}
