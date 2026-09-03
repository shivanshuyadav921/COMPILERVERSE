"use client";
import { useState } from "react";

interface DiagnosticsProps {
  result: any;
  compiling: boolean;
  onRunCompile: () => void;
  onExportJSON?: () => void;
  onExportHTML?: () => void;
}

export default function BottomTerminalConsole({
  result,
  compiling,
  onRunCompile,
  onExportJSON,
  onExportHTML,
}: DiagnosticsProps) {

  const [activeSubTab, setActiveSubTab] = useState<"diagnostics" | "console" | "timeline" | "rawJson">("diagnostics");
  const [collapsed, setCollapsed] = useState(false);

  const lexErrors = result?.lexErrors || [];
  const parseErrors = result?.parseErrors || [];
  const semanticErrors = result?.semanticErrors || [];
  const totalErrors = lexErrors.length + parseErrors.length + semanticErrors.length;

  if (collapsed) {
    return (
      <div className="h-7 border-t border-border bg-panel flex items-center px-4 justify-between text-xs cursor-pointer hover:bg-panel2" onClick={() => setCollapsed(false)}>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-400">Terminal & Compiler Output</span>
          {totalErrors > 0 ? (
            <span className="text-err text-[11px] font-medium">● {totalErrors} Error(s)</span>
          ) : (
            <span className="text-accent2 text-[11px] font-medium">● Build Ready</span>
          )}
        </div>
        <span className="text-gray-500 text-[11px]">▲ Expand</span>
      </div>
    );
  }

  return (
    <div className="h-44 border-t border-border bg-panel flex flex-col font-mono text-xs overflow-hidden">
      {/* Console Header */}
      <div className="h-8 border-b border-border bg-panel2 flex items-center px-3 justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab("diagnostics")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "diagnostics" ? "bg-panel text-accent font-bold border border-border" : "text-gray-400 hover:text-gray-200"}`}
          >
            Diagnostics ({totalErrors})
          </button>
          <button
            onClick={() => setActiveSubTab("console")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "console" ? "bg-panel text-accent font-bold border border-border" : "text-gray-400 hover:text-gray-200"}`}
          >
            Build Log
          </button>
          <button
            onClick={() => setActiveSubTab("timeline")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "timeline" ? "bg-panel text-accent font-bold border border-border" : "text-gray-400 hover:text-gray-200"}`}
          >
            Phase Summary
          </button>
          <button
            onClick={() => setActiveSubTab("rawJson")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "rawJson" ? "bg-panel text-accent font-bold border border-border" : "text-gray-400 hover:text-gray-200"}`}
          >
            Raw Result JSON
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <button
            onClick={onRunCompile}
            disabled={compiling}
            className="px-2 py-0.5 rounded bg-accent/20 border border-accent/40 text-accent font-bold hover:bg-accent/40 transition-colors"
          >
            {compiling ? "Compiling..." : "▶ Recompile"}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-gray-400 hover:text-white px-1"
          >
            ▼ Hide
          </button>
        </div>
      </div>

      {/* Console Content */}
      <div className="flex-1 p-3 overflow-auto text-[11px] leading-relaxed select-text">
        {activeSubTab === "diagnostics" && (
          <div className="space-y-1">
            {totalErrors === 0 ? (
              <div className="text-accent2">✔ Compilation completed with zero errors or warnings.</div>
            ) : (
              <>
                {lexErrors.map((err: any, idx: number) => (
                  <div key={`lex-${idx}`} className="text-err font-medium flex gap-2">
                    <span className="text-gray-500">[Lexer Error Line {err.line ?? 1}:{err.col ?? 1}]</span>
                    <span>{err.message}</span>
                  </div>
                ))}
                {parseErrors.map((err: any, idx: number) => (
                  <div key={`parse-${idx}`} className="text-err font-medium flex gap-2">
                    <span className="text-gray-500">[Parser Error Line {err.line ?? 1}:{err.col ?? 1}]</span>
                    <span>{err.message}</span>
                  </div>
                ))}
                {semanticErrors.map((err: any, idx: number) => (
                  <div key={`sem-${idx}`} className="text-err font-medium flex gap-2">
                    <span className="text-gray-500">[Semantic Error Line {err.line ?? 1}:{err.col ?? 1}]</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeSubTab === "console" && (
          <div className="space-y-1 text-gray-300">
            <div>[CompilerGPT Nova Backend v1.0.0]</div>
            <div>[Pipeline] Initializing Lexer, Parser, AST, Scope & Semantic Analysis...</div>
            {result?.tokens && <div>[Lexer] Emitted {result.tokens.length} tokens.</div>}
            {result?.ast && <div>[Parser] AST root node created with {result.ast.body?.length || 0} top-level statements.</div>}
            {result?.ir && <div>[IR Generator] Emitted {result.ir.length} Three-Address Code instructions.</div>}
            {result?.optimizationLogs && (
              <div>[Optimizer] Ran {result.optimizationLogs.length} optimization passes.</div>
            )}
            {result?.regAlloc && (
              <div>[RegAlloc] Allocated physical registers ($K=8$), max used: {result.regAlloc.maxRegistersUsed}, spills: {result.regAlloc.spills?.length || 0}.</div>
            )}
            {result?.assembly && <div>[Asm CodeGen] Emitted {result.assembly.length} x86_64 assembly instructions.</div>}
            <div>[Status] Execution finished in {result?.metrics?.compilationTimeMs?.toFixed(2) || "0.00"} ms.</div>
          </div>
        )}

        {activeSubTab === "timeline" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-300">
            <div className="bg-panel2 p-2 rounded border border-border">
              <div className="text-gray-500 font-semibold">Tokens</div>
              <div className="text-accent font-bold">{result?.tokens?.length || 0}</div>
            </div>
            <div className="bg-panel2 p-2 rounded border border-border">
              <div className="text-gray-500 font-semibold">Basic Blocks</div>
              <div className="text-accent2 font-bold">{result?.cfgAfter?.blocks?.length || 0}</div>
            </div>
            <div className="bg-panel2 p-2 rounded border border-border">
              <div className="text-gray-500 font-semibold">SSA Variables</div>
              <div className="text-warn font-bold">{result?.ssa?.versionedVars?.length || 0}</div>
            </div>
            <div className="bg-panel2 p-2 rounded border border-border">
              <div className="text-gray-500 font-semibold">Assembly Lines</div>
              <div className="text-accent font-bold">{result?.assembly?.length || 0}</div>
            </div>
          </div>
        )}

        {activeSubTab === "rawJson" && (
          <pre className="text-gray-400 text-[10px] whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
