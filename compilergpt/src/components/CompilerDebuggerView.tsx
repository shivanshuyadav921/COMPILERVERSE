"use client";
import { useState } from "react";

export default function CompilerDebuggerView({ result }: { result: any }) {
  const [currentLine, setCurrentLine] = useState(1);

  if (!result) {
    return (
      <div className="p-4 text-xs text-text-secondary">
        No compilation data available. Write and compile code first, then step through it line by line.
      </div>
    );
  }

  const lines = (result.source || "").split("\n");
  const activeTokens = (result.tokens || []).filter((t: any) => t.line === currentLine);
  const activeIR = (result.irOptimizedRaw || result.irRaw || []).filter((i: any) => i.sourceLine === currentLine);
  const activeAsm = (result.assembly || []).filter((a: any) => a.sourceLine === currentLine);

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden font-sans">
      {/* Control Bar */}
      <div className="flex justify-between items-center bg-surface p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-olive">Compiler Phase Line Debugger</span>
          <span className="text-text-secondary bg-surface-elevated px-2 py-0.5 rounded border border-border">
            Line {currentLine} / {lines.length}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentLine(1)}
            disabled={currentLine <= 1}
            className="px-2 py-1 bg-surface-elevated rounded text-text-secondary border border-border hover:text-text-primary disabled:opacity-40"
            title="Jump to first line"
          >
            ⏮
          </button>
          <button
            onClick={() => setCurrentLine(l => Math.max(1, l - 1))}
            disabled={currentLine <= 1}
            className="px-3 py-1 bg-surface-elevated rounded text-text-secondary border border-border hover:text-text-primary disabled:opacity-40"
          >
            ◄ Prev
          </button>
          <button
            onClick={() => setCurrentLine(l => Math.min(lines.length, l + 1))}
            disabled={currentLine >= lines.length}
            className="px-3 py-1 bg-olive text-white font-bold rounded hover:bg-olive/80 disabled:opacity-40"
          >
            Next ►
          </button>
          <button
            onClick={() => setCurrentLine(lines.length)}
            disabled={currentLine >= lines.length}
            className="px-2 py-1 bg-surface-elevated rounded text-text-secondary border border-border hover:text-text-primary disabled:opacity-40"
            title="Jump to last line"
          >
            ⏭
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden min-h-0">
        {/* Source Code with active line highlight */}
        <div className="flex flex-col border border-border rounded-lg bg-surface p-3 overflow-hidden">
          <div className="text-xs uppercase tracking-wide text-text-secondary mb-2 font-semibold">Source Code</div>
          <div className="flex-1 overflow-auto mono text-xs leading-relaxed space-y-0.5">
            {lines.map((lineText: string, idx: number) => {
              const lineNum = idx + 1;
              const isActive = lineNum === currentLine;
              const hasTokens = (result.tokens || []).some((t: any) => t.line === lineNum);
              return (
                <div
                  key={idx}
                  onClick={() => setCurrentLine(lineNum)}
                  className={`px-2 py-0.5 rounded cursor-pointer flex justify-between gap-2 ${
                    isActive
                      ? "bg-olive/20 border border-olive/40 text-olive font-bold"
                      : "text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <span className="flex-1 truncate">{lineText || "\u00a0"}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {hasTokens && <span className="w-1.5 h-1.5 rounded-full bg-sage" title="Has tokens" />}
                    <span className="text-text-secondary text-[10px]">L{lineNum}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Inspection Pane */}
        <div className="flex flex-col space-y-3 overflow-hidden min-h-0">
          {/* Lexer Tokens for active line */}
          <div className="card p-3 space-y-1 overflow-auto flex-1 min-h-0">
            <div className="text-xs uppercase tracking-wide text-muted-teal font-semibold mb-1">
              1. Lexer Tokens (Line {currentLine})
            </div>
            <div className="mono text-xs flex flex-wrap gap-1.5 pt-1">
              {activeTokens.length > 0 ? activeTokens.map((t: any, i: number) => (
                <span key={i} className="px-2 py-1 bg-surface-elevated border border-border rounded text-muted-teal">
                  {t.type}({JSON.stringify(t.lexeme)})
                </span>
              )) : (
                <span className="text-text-secondary italic">No tokens on line {currentLine}</span>
              )}
            </div>
          </div>

          {/* TAC IR Instructions */}
          <div className="card p-3 space-y-1 overflow-auto flex-1 min-h-0">
            <div className="text-xs uppercase tracking-wide text-sage font-semibold mb-1">
              2. TAC IR Instructions (Line {currentLine})
            </div>
            <div className="mono text-xs space-y-1 pt-1">
              {activeIR.length > 0 ? activeIR.map((instr: any, idx: number) => (
                <div key={idx} className="p-1.5 bg-surface-elevated rounded border border-border text-text-primary">
                  {instr.result ? `${instr.result} = ` : ""}{instr.arg1 ?? ""} {instr.op} {instr.arg2 ?? ""}
                </div>
              )) : (
                <span className="text-text-secondary italic">No IR instructions for line {currentLine}</span>
              )}
            </div>
          </div>

          {/* Assembly Instructions */}
          <div className="card p-3 space-y-1 overflow-auto flex-1 min-h-0">
            <div className="text-xs uppercase tracking-wide text-ochre font-semibold mb-1">
              3. Assembly Output (Line {currentLine})
            </div>
            <div className="mono text-xs space-y-1 pt-1">
              {activeAsm.length > 0 ? activeAsm.map((a: any, idx: number) => (
                <div key={idx} className="p-1.5 bg-surface-elevated rounded border border-border text-ochre font-bold">
                  {a.text}
                  {a.explanation && (
                    <span className="text-text-secondary font-normal text-[10px] block mt-0.5">{a.explanation}</span>
                  )}
                </div>
              )) : (
                <span className="text-text-secondary italic">No assembly for line {currentLine}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
