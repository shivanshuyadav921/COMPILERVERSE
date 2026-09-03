"use client";
import { useState, useRef, useEffect } from "react";

interface Msg { role: "user" | "assistant"; text: string; source?: string; }

const SUGGESTIONS = [
  "Explain SSA Phi-nodes placement",
  "Which variables were spilled to stack?",
  "Show immediate dominators (idom)",
  "What optimizations modified the IR?",
  "Why did register allocation select these registers?",
  "Explain register allocation K=8 colors",
  "How many basic blocks were created?",
  "What constants were folded?",
];

export default function MentorChat({ artifacts }: { artifacts: any }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "I'm the AI Compiler Mentor. Ask me about tokens, the AST, symbol table, IR, optimizations, SSA phi-nodes, dominators, register allocation, or assembly for your current compilation.\n\nI'm grounded in your actual compiler artifacts — not invented facts.", source: "system" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMsgs(m => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, artifacts }),
      });
      const data = await res.json();
      const sourceLabel = data.source === "ai" ? "AI" : "Rule-based";
      setMsgs(m => [...m, {
        role: "assistant",
        text: data.answer || data.error || "No response from mentor.",
        source: sourceLabel,
      }]);
    } catch {
      setMsgs(m => [...m, {
        role: "assistant",
        text: "The mentor request failed. Please check your connection and try again.",
        source: "error",
      }]);
    } finally {
      setLoading(false);
    }
  }

  const hasArtifacts = artifacts && (
    artifacts.ir?.length > 0 ||
    artifacts.cfg?.blocks?.length > 0 ||
    artifacts.ssa?.phiNodes?.length > 0
  );

  return (
    <div className="flex flex-col h-full bg-background">
      {!hasArtifacts && (
        <div className="m-3 p-3 bg-ochre/10 border border-ochre/30 rounded text-xs text-ochre">
          ⚠ No compilation artifacts yet. Write code and compile first, then ask questions grounded in your actual compiler output.
        </div>
      )}

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed ${m.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 whitespace-pre-wrap font-sans ${
              m.role === "user"
                ? "bg-sage/20 text-text-primary border border-sage/30"
                : "bg-surface-elevated text-text-primary border border-border"
            }`}>
              {m.text}
            </div>
            {m.source && m.role === "assistant" && (
              <div className="text-[10px] text-text-secondary mt-0.5 ml-1">
                via {m.source}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="text-text-secondary text-xs pulse-glow flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-sage animate-pulse" />
            Mentor is analyzing the compiler artifacts…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-2 border-t border-border bg-surface">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => ask(s)}
              disabled={loading}
              className="text-[10px] px-2 py-1 rounded-full bg-surface-elevated text-text-secondary hover:text-sage hover:bg-sage/10 border border-border transition-colors disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input); } }}
            placeholder="Ask about your compilation… (Enter to send)"
            disabled={loading}
            className="flex-1 bg-surface-elevated border border-border rounded-md px-3 py-2 text-xs outline-none focus:border-sage transition-colors text-text-primary placeholder:text-text-secondary disabled:opacity-50"
          />
          <button
            onClick={() => ask(input)}
            disabled={loading || !input.trim()}
            className="px-3 py-2 bg-sage text-white text-xs rounded-md hover:bg-sage/80 transition-colors disabled:opacity-50 font-semibold"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}
