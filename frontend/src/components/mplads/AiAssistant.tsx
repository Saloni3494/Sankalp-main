import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AI_SUGGESTIONS, answerMpladsQuestion } from "@/lib/mplads-data";
import { cn } from "@/lib/utils";

type Msg = {
  from: "user" | "ai";
  text: string;
  rows?: { label: string; value: string }[];
};

const GREETING: Msg = {
  from: "ai",
  text: "Namaste. Ask me about MPLADS projects, fund utilisation, delays or risk. I answer in plain language with the numbers behind it.",
};

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);

  const ask = (q: string) => {
    if (!q.trim()) return;
    const answer = answerMpladsQuestion(q);
    setMessages((m) => [...m, { from: "user", text: q }, { from: "ai", ...answer }]);
    setInput("");
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-panel transition-transform hover:scale-[1.03]"
        >
          <Sparkles className="size-4" />
          Ask MPLADS AI
        </button>
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-[400px] flex-col border-l border-border bg-card shadow-panel transition-transform duration-300",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary">
              <Bot className="size-[18px]" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">MPLADS AI Assistant</p>
              <p className="text-[11px] text-muted-foreground">Answers from monitored scheme data</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close assistant">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.map((m, i) => (
            <div key={i} className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[92%] rounded-xl px-3 py-2 text-sm",
                  m.from === "user"
                    ? "bg-navy text-primary-foreground"
                    : "border border-border bg-secondary text-foreground",
                )}
              >
                <p>{m.text}</p>
                {m.rows && (
                  <div className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                    {m.rows.map((r) => (
                      <div key={r.label} className="flex items-center justify-between gap-3 px-2.5 py-1.5 text-xs">
                        <span className="min-w-0 truncate text-muted-foreground">{r.label}</span>
                        <span className="font-medium">{r.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => ask(s)}
                className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="h-9 bg-secondary"
            />
            <Button type="submit" size="icon" className="size-9 shrink-0" aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
