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
      <div className="h-7 border-t border-border bg-surface flex items-center px-4 justify-between text-xs cursor-pointer hover:bg-surface-elevated" onClick={() => setCollapsed(false)}>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-text-secondary">Terminal &amp; Compiler Output</span>
          {totalErrors > 0 ? (
            <span className="text-terracotta text-[11px] font-medium">● {totalErrors} Error(s)</span>
          ) : (
            <span className="text-muted-teal text-[11px] font-medium">● Build Ready</span>
          )}
        </div>
        <span className="text-text-secondary text-[11px]">▲ Expand</span>
      </div>
    );
  }

  return (
    <div className="h-44 border-t border-border bg-surface flex flex-col font-mono text-xs overflow-hidden">
      {/* Console Header */}
      <div className="h-8 border-b border-border bg-surface-elevated flex items-center px-3 justify-between flex-shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveSubTab("diagnostics")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "diagnostics" ? "bg-surface text-sage font-bold border border-border" : "text-text-secondary hover:text-text-primary"}`}
          >
            Diagnostics ({totalErrors})
          </button>
          <button
            onClick={() => setActiveSubTab("console")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "console" ? "bg-surface text-sage font-bold border border-border" : "text-text-secondary hover:text-text-primary"}`}
          >
            Build Log
          </button>
          <button
            onClick={() => setActiveSubTab("timeline")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "timeline" ? "bg-surface text-sage font-bold border border-border" : "text-text-secondary hover:text-text-primary"}`}
          >
            Phase Summary
          </button>
          <button
            onClick={() => setActiveSubTab("rawJson")}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${activeSubTab === "rawJson" ? "bg-surface text-sage font-bold border border-border" : "text-text-secondary hover:text-text-primary"}`}
          >
            Raw Result JSON
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          {onExportJSON && (
            <button
              onClick={onExportJSON}
              className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
              title="Export session as JSON"
            >
              ⬇ JSON
            </button>
          )}
          {onExportHTML && (
            <button
              onClick={onExportHTML}
              className="px-2 py-0.5 rounded bg-surface-elevated border border-border text-text-secondary hover:text-text-primary transition-colors"
              title="Export technical report as HTML"
            >
              ⬇ HTML
            </button>
          )}
          <button
            onClick={onRunCompile}
            disabled={compiling}
            className="px-2 py-0.5 rounded bg-sage/20 border border-sage/40 text-sage font-bold hover:bg-sage/40 transition-colors disabled:opacity-50"
          >
            {compiling ? "Compiling..." : "▶ Recompile"}
          </button>
          <button
            onClick={() => setCollapsed(true)}
            className="text-text-secondary hover:text-text-primary px-1"
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
              <div className="text-muted-teal">✔ Compilation completed with zero errors or warnings.</div>
            ) : (
              <>
                {lexErrors.map((err: any, idx: number) => (
                  <div key={`lex-${idx}`} className="text-terracotta font-medium flex gap-2">
                    <span className="text-text-secondary">[Lexer Error Line {err.line ?? 1}:{err.col ?? 1}]</span>
                    <span>{err.message}</span>
                  </div>
                ))}
                {parseErrors.map((err: any, idx: number) => (
                  <div key={`parse-${idx}`} className="text-terracotta font-medium flex gap-2">
                    <span className="text-text-secondary">[Parser Error Line {err.line ?? 1}:{err.col ?? 1}]</span>
                    <span>{err.message}</span>
                  </div>
                ))}
                {semanticErrors.map((err: any, idx: number) => (
                  <div key={`sem-${idx}`} className="text-ochre font-medium flex gap-2">
                    <span className="text-text-secondary">[Semantic Error Line {err.line ?? 1}:{err.col ?? 1}]</span>
                    <span>{err.message}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {activeSubTab === "console" && (
          <div className="space-y-1 text-text-secondary">
            <div>[CompilerGPT Nova Backend v1.0.0]</div>
            <div>[Pipeline] Initializing Lexer, Parser, AST, Scope &amp; Semantic Analysis...</div>
            {result?.tokens && <div>[Lexer] Emitted {result.tokens.length} tokens.</div>}
            {result?.ast && <div>[Parser] AST root node created with {result.ast.body?.length || 0} top-level statements.</div>}
            {result?.ir && <div>[IR Generator] Emitted {result.ir.length} Three-Address Code instructions.</div>}
            {result?.optimizationLogs && (
              <div>[Optimizer] Ran {result.optimizationLogs.length} optimization passes.</div>
            )}
            {result?.regAlloc && (
              <div>[RegAlloc] Allocated physical registers (K=8), max used: {result.regAlloc.maxRegistersUsed}, spills: {result.regAlloc.spills?.length || 0}.</div>
            )}
            {result?.assembly && <div>[Asm CodeGen] Emitted {result.assembly.length} pseudo-assembly instructions.</div>}
            {result?.x86 && <div>[x86-64] Emitted {result.x86.lines.length} Intel-syntax x86-64 instructions.</div>}
            {result?.wasm && <div>[WASM] Generated WebAssembly module ({result.wasm.wasmBinary.length} bytes binary, {result.wasm.wat.split("\n").length} WAT lines).</div>}
            <div>[Status] Execution finished in {result?.metrics?.compileTimeMs?.toFixed(2) || "0.00"} ms.</div>
          </div>
        )}

        {activeSubTab === "timeline" && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-text-secondary">
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">Tokens</div>
              <div className="text-sage font-bold">{result?.tokens?.length || 0}</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">Basic Blocks</div>
              <div className="text-muted-teal font-bold">{result?.cfgAfter?.blocks?.length || 0}</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">SSA Variables</div>
              <div className="text-ochre font-bold">{Object.keys(result?.ssa?.versionMap || {}).length}</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">Compile Time</div>
              <div className="text-sage font-bold">{result?.metrics?.compileTimeMs?.toFixed(2) || "—"} ms</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">Assembly Lines</div>
              <div className="text-sage font-bold">{result?.assembly?.length || 0}</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">Phi Nodes</div>
              <div className="text-ochre font-bold">{result?.ssa?.phiNodes?.length || 0}</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">Reg Spills</div>
              <div className="text-terracotta font-bold">{result?.regAlloc?.spills?.length || 0}</div>
            </div>
            <div className="bg-surface-elevated p-2 rounded border border-border">
              <div className="text-text-secondary font-semibold">IR Reduction</div>
              <div className="text-sage font-bold">
                {result?.irRaw?.length && result?.irOptimizedRaw?.length
                  ? `${result.irRaw.length} → ${result.irOptimizedRaw.length}`
                  : "—"}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "rawJson" && (
          <pre className="text-text-secondary text-[10px] whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
