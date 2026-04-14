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
      const history = [...messages, userTurn].slice(-MAX_HISTORY);
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
          setMessages(history);
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
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
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
                disabled={streaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about Synerix..."
                aria-label="Message the Synerix assistant"
                className="max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-mk-line-dark bg-mk-navy px-3.5 py-2.5 text-sm text-white placeholder:text-mk-mist/50 focus:outline-none focus:ring-1 focus:ring-mk-cyan disabled:opacity-60"
              />
              <button
                type="button"
                aria-label="Send message"
                onClick={() => void send(input)}
                disabled={streaming || !input.trim()}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mk-cyan text-mk-ink transition-colors hover:bg-mk-cyan-bright disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
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
        {children}
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
