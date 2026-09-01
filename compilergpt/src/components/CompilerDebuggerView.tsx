"use client";
import { useState } from "react";

export default function CompilerDebuggerView({ result }: { result: any }) {
  const [currentLine, setCurrentLine] = useState(1);

  if (!result) return <div className="text-gray-500 text-sm p-4">No compilation data available for debugging.</div>;

  const lines = (result.source || "").split("\n");
  const activeTokens = (result.tokens || []).filter((t: any) => t.line === currentLine);
  const activeIR = (result.irOptimizedRaw || []).filter((i: any) => i.sourceLine === currentLine);
  const activeAsm = (result.assembly || []).filter((a: any) => a.sourceLine === currentLine);

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden">
      {/* Control Bar */}
      <div className="flex justify-between items-center bg-panel p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-accent">Compiler Line Debugger</span>
          <span className="text-gray-500">Line {currentLine} of {lines.length}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentLine(l => Math.max(1, l - 1))}
            className="px-3 py-1 bg-panel2 rounded text-gray-300 border border-border hover:bg-panel2/80"
          >
            Step Prev Line ◄
          </button>
          <button
            onClick={() => setCurrentLine(l => Math.min(lines.length, l + 1))}
            className="px-3 py-1 bg-accent text-white font-bold rounded hover:bg-accent/80"
          >
            Step Next Line ►
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
        {/* Source Code View with active line highlight */}
        <div className="flex flex-col border border-border rounded-lg bg-panel p-3 overflow-hidden">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Source Code</div>
          <div className="flex-1 overflow-auto mono text-xs leading-relaxed space-y-0.5">
            {lines.map((lineText: string, idx: number) => {
              const lineNum = idx + 1;
              const isActive = lineNum === currentLine;
              return (
                <div
                  key={idx}
                  onClick={() => setCurrentLine(lineNum)}
                  className={`px-2 py-0.5 rounded cursor-pointer flex justify-between ${isActive ? "bg-accent/20 border border-accent/40 text-accent font-bold" : "text-gray-300 hover:bg-panel2"}`}
                >
                  <span>{lineText || " "}</span>
                  <span className="text-gray-600 text-[10px]">L{lineNum}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Phase Debugger Inspection Pane */}
        <div className="flex flex-col space-y-3 overflow-hidden">
          {/* Active Tokens */}
          <div className="card p-3 space-y-1 overflow-auto flex-1">
            <div className="text-xs uppercase tracking-wide text-accent2 font-semibold">1. Lexer Tokens (Line {currentLine})</div>
            <div className="mono text-xs flex flex-wrap gap-1.5 pt-1">
              {activeTokens.length > 0 ? activeTokens.map((t: any, i: number) => (
                <span key={i} className="px-2 py-1 bg-panel2 border border-border rounded text-accent2">
                  {t.type}("{t.lexeme}")
                </span>
              )) : <span className="text-gray-600 italic">No tokens emitted for line {currentLine}</span>}
            </div>
          </div>

          {/* Active Three-Address IR */}
          <div className="card p-3 space-y-1 overflow-auto flex-1">
            <div className="text-xs uppercase tracking-wide text-accent font-semibold">2. TAC IR Instructions (Line {currentLine})</div>
            <div className="mono text-xs space-y-1 pt-1">
              {activeIR.length > 0 ? activeIR.map((i: any, idx: number) => (
                <div key={idx} className="p-1.5 bg-panel2 rounded border border-border text-gray-200">
                  {i.result ? `${i.result} = ` : ""}{i.arg1 ?? ""} {i.op} {i.arg2 ?? ""}
                </div>
              )) : <span className="text-gray-600 italic">No IR instructions emitted for line {currentLine}</span>}
            </div>
          </div>

          {/* Active Target Assembly */}
          <div className="card p-3 space-y-1 overflow-auto flex-1">
            <div className="text-xs uppercase tracking-wide text-warn font-semibold">3. Assembly Instructions (Line {currentLine})</div>
            <div className="mono text-xs space-y-1 pt-1">
              {activeAsm.length > 0 ? activeAsm.map((a: any, idx: number) => (
                <div key={idx} className="p-1.5 bg-panel2 rounded border border-border text-warn font-bold">
                  {a.text} <span className="text-gray-500 font-normal text-[10px] block">{a.explanation}</span>
                </div>
              )) : <span className="text-gray-600 italic">No assembly instructions for line {currentLine}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
