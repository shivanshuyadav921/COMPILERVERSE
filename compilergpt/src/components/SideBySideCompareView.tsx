"use client";
import { useState, useMemo } from "react";
import { compile } from "@/lib/compiler/pipeline";

export default function SideBySideCompareView({ currentSource }: { currentSource: string }) {
  const [sourceA, setSourceA] = useState(
    currentSource || `let x = 10 + 20;\nlet y = x * 2;\nprint(y);`
  );
  const [sourceB, setSourceB] = useState(
    `int main() {\n  int x = 10 + 20;\n  int y = x * 2;\n  printf(y);\n  return 0;\n}`
  );
  const [langA, setLangA] = useState<"nova" | "c">("nova");
  const [langB, setLangB] = useState<"nova" | "c">("c");
  const [activeTab, setActiveTab] = useState<"ir" | "cfg" | "ssa" | "regalloc" | "x86" | "wasm">("ir");

  const resA = useMemo(() => compile(sourceA, { language: langA }), [sourceA, langA]);
  const resB = useMemo(() => compile(sourceB, { language: langB }), [sourceB, langB]);

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden font-sans">
      {/* Top Header & Tab Controls */}
      <div className="flex justify-between items-center bg-surface p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-muted-teal">Side-by-Side Multi-Language Comparison</span>
          <span className="text-[11px] text-text-secondary">
            Cross-language comparison lowering Nova & C-subset to Unified Common IR.
          </span>
        </div>
        <div className="flex gap-1.5 bg-surface-elevated p-1 rounded border border-border">
          {(["ir", "cfg", "ssa", "regalloc", "x86", "wasm"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 rounded text-xs font-semibold uppercase ${
                activeTab === tab
                  ? "bg-muted-teal text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Dual Pane */}
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
        {/* Version A Column */}
        <div className="card p-3 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-text-primary">Version A</span>
              <select
                value={langA}
                onChange={(e) => setLangA(e.target.value as any)}
                className="bg-surface-elevated border border-border text-[11px] rounded px-2 py-0.5 text-text-primary"
              >
                <option value="nova">Nova Language</option>
                <option value="c">C-Subset</option>
              </select>
            </div>
            <span className="text-[11px] text-text-secondary mono">
              IR: {resA.irOptimizedRaw.length} | x86: {resA.x86.lines.length}
            </span>
          </div>

          <textarea
            value={sourceA}
            onChange={(e) => setSourceA(e.target.value)}
            className="h-32 p-2 bg-surface-elevated rounded border border-border mono text-xs text-text-primary resize-none mb-2 focus:outline-none focus:border-muted-teal"
          />

          {/* Artifact Preview */}
          <div className="flex-1 overflow-auto bg-surface-elevated p-2 rounded border border-border mono text-xs">
            {activeTab === "ir" && (
              <pre className="text-text-primary leading-relaxed">{resA.irOptimized.join("\n")}</pre>
            )}
            {activeTab === "cfg" && (
              <div className="space-y-2">
                {resA.cfgAfter.blocks.map((b) => (
                  <div key={b.id} className="p-2 bg-surface border border-border rounded">
                    <span className="text-muted-teal font-bold block">{b.id}</span>
                    <pre className="text-[11px] text-text-secondary">{b.instructions.map((i) => i.op).join(", ")}</pre>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "ssa" && (
              <pre className="text-text-primary leading-relaxed">
                {resA.ssa.phiNodes.length > 0
                  ? resA.ssa.phiNodes.map((p) => `${p.ssaVar} = Φ(...) in ${p.blockId}`).join("\n")
                  : "No Φ-nodes required."}
              </pre>
            )}
            {activeTab === "regalloc" && (
              <div className="space-y-1">
                <div className="text-sage font-bold">Physical Registers Used: {resA.regAlloc.maxRegistersUsed}/8</div>
                {Object.entries(resA.regAlloc.allocatedRegisters).map(([k, v]) => (
                  <div key={k} className="text-[11px] text-text-secondary">{k} → {v}</div>
                ))}
              </div>
            )}
            {activeTab === "x86" && (
              <pre className="text-olive leading-relaxed">{resA.x86.textFormat}</pre>
            )}
            {activeTab === "wasm" && (
              <pre className="text-text-primary leading-relaxed">{resA.wasm.wat}</pre>
            )}
          </div>
        </div>

        {/* Version B Column */}
        <div className="card p-3 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-text-primary">Version B</span>
              <select
                value={langB}
                onChange={(e) => setLangB(e.target.value as any)}
                className="bg-surface-elevated border border-border text-[11px] rounded px-2 py-0.5 text-text-primary"
              >
                <option value="c">C-Subset</option>
                <option value="nova">Nova Language</option>
              </select>
            </div>
            <span className="text-[11px] text-text-secondary mono">
              IR: {resB.irOptimizedRaw.length} | x86: {resB.x86.lines.length}
            </span>
          </div>

          <textarea
            value={sourceB}
            onChange={(e) => setSourceB(e.target.value)}
            className="h-32 p-2 bg-surface-elevated rounded border border-border mono text-xs text-text-primary resize-none mb-2 focus:outline-none focus:border-muted-teal"
          />

          {/* Artifact Preview */}
          <div className="flex-1 overflow-auto bg-surface-elevated p-2 rounded border border-border mono text-xs">
            {activeTab === "ir" && (
              <pre className="text-text-primary leading-relaxed">{resB.irOptimized.join("\n")}</pre>
            )}
            {activeTab === "cfg" && (
              <div className="space-y-2">
                {resB.cfgAfter.blocks.map((b) => (
                  <div key={b.id} className="p-2 bg-surface border border-border rounded">
                    <span className="text-muted-teal font-bold block">{b.id}</span>
                    <pre className="text-[11px] text-text-secondary">{b.instructions.map((i) => i.op).join(", ")}</pre>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "ssa" && (
              <pre className="text-text-primary leading-relaxed">
                {resB.ssa.phiNodes.length > 0
                  ? resB.ssa.phiNodes.map((p) => `${p.ssaVar} = Φ(...) in ${p.blockId}`).join("\n")
                  : "No Φ-nodes required."}
              </pre>
            )}
            {activeTab === "regalloc" && (
              <div className="space-y-1">
                <div className="text-sage font-bold">Physical Registers Used: {resB.regAlloc.maxRegistersUsed}/8</div>
                {Object.entries(resB.regAlloc.allocatedRegisters).map(([k, v]) => (
                  <div key={k} className="text-[11px] text-text-secondary">{k} → {v}</div>
                ))}
              </div>
            )}
            {activeTab === "x86" && (
              <pre className="text-olive leading-relaxed">{resB.x86.textFormat}</pre>
            )}
            {activeTab === "wasm" && (
              <pre className="text-text-primary leading-relaxed">{resB.wasm.wat}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
