"use client";
import { useState } from "react";

interface Msg { role: "user" | "assistant"; text: string; }

const SUGGESTIONS = [
  "Explain SSA Phi-nodes placement",
  "Which variables were spilled to stack?",
  "Show immediate dominators (idom)",
  "What optimizations modified the IR?",
  "Why did semantic analysis fail?",
  "Explain register allocation K=8 colors",
];

export default function MentorChat({ artifacts }: { artifacts: any }) {
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", text: "I'm the AI Compiler Mentor. Ask me about tokens, the AST, symbol table, IR, optimizations, or assembly for your current compilation." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask(question: string) {
    if (!question.trim()) return;
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
      setMsgs(m => [...m, { role: "assistant", text: data.answer || data.error || "No response." }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", text: "The mentor request failed. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`text-xs leading-relaxed ${m.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block max-w-[90%] rounded-lg px-3 py-2 whitespace-pre-wrap ${m.role === "user" ? "bg-accent/20 text-gray-100" : "bg-panel2 text-gray-300"}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-500 text-xs pulse-glow">Mentor is analyzing the artifacts…</div>}
      </div>
      <div className="p-2 border-t border-border">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SUGGESTIONS.map(s => (
            <button key={s} onClick={() => ask(s)} className="text-[10px] px-2 py-1 rounded-full bg-panel2 text-gray-400 hover:text-accent hover:bg-accent/10 border border-border">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") ask(input); }}
            placeholder="Ask about your compilation…"
            className="flex-1 bg-panel2 border border-border rounded-md px-3 py-2 text-xs outline-none focus:border-accent"
          />
          <button onClick={() => ask(input)} className="px-3 py-2 bg-accent text-white text-xs rounded-md hover:bg-accent/80">Ask</button>
        </div>
      </div>
    </div>
  );
}
