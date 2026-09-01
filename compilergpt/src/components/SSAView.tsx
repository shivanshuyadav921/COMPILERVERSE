"use client";
import { useState } from "react";
import { irToString } from "@/lib/compiler/ir";

export default function SSAView({ ssa, irOptimized }: { ssa: any; irOptimized: string[] }) {
  const [mode, setMode] = useState<"ssa" | "tac">("ssa");

  if (!ssa) return <div className="text-gray-500 text-sm p-4">No SSA data available.</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 p-2 border-b border-border bg-panel">
        <button onClick={() => setMode("ssa")} className={`tab-btn ${mode === "ssa" ? "tab-btn-active" : "tab-btn-inactive"}`}>Static Single Assignment (SSA)</button>
        <button onClick={() => setMode("tac")} className={`tab-btn ${mode === "tac" ? "tab-btn-active" : "tab-btn-inactive"}`}>Three Address Code (TAC)</button>
        <div className="ml-auto text-xs text-gray-500 self-center">
          {ssa.phiNodes.length} Φ-nodes inserted · {Object.keys(ssa.versionMap).length} variables versioned
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {mode === "tac" ? (
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Linear TAC IR</div>
            <pre className="mono text-xs bg-panel2 p-3 rounded-lg leading-relaxed">{irOptimized?.join("\n")}</pre>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-xs text-gray-400">
              SSA guarantees every variable is defined exactly once. Dynamic control-flow merges generate Φ-nodes: v_new = Φ(v_pred1, v_pred2).
            </div>

            <div className="grid grid-cols-2 gap-4">
              {ssa.blocks.map((b: any) => (
                <div key={b.id} className="card p-3 mono text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-border pb-1">
                    <span className="font-bold text-accent2">{b.label} ({b.id})</span>
                    <span className="text-[10px] text-gray-500">succs: {b.successors.join(", ") || "none"}</span>
                  </div>

                  {b.phiNodes.length > 0 && (
                    <div className="space-y-1 bg-accent/10 p-2 rounded border border-accent/20">
                      <div className="text-[10px] uppercase text-accent font-semibold">Φ-Nodes</div>
                      {b.phiNodes.map((phi: any) => (
                        <div key={phi.id} className="text-accent2 font-bold">
                          {phi.ssaVar} = Φ({Object.entries(phi.operands).map(([pred, val]) => `${pred}:${val}`).join(", ")})
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1">
                    {b.instrs.map((instr: any, i: number) => (
                      <div key={i} className="text-gray-200 pl-2">
                        {irToString(instr)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
