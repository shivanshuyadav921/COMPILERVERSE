"use client";
import { useState } from "react";

export default function DataFlowView({ dataflow }: { dataflow: any }) {
  const [activeTab, setActiveTab] = useState<"rd" | "lv" | "ae" | "du">("rd");

  if (!dataflow) return <div className="text-gray-500 text-sm p-4">No dataflow analysis available.</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 p-2 border-b border-border bg-panel">
        <button onClick={() => setActiveTab("rd")} className={`tab-btn ${activeTab === "rd" ? "tab-btn-active" : "tab-btn-inactive"}`}>Reaching Definitions</button>
        <button onClick={() => setActiveTab("lv")} className={`tab-btn ${activeTab === "lv" ? "tab-btn-active" : "tab-btn-inactive"}`}>Live Variables</button>
        <button onClick={() => setActiveTab("ae")} className={`tab-btn ${activeTab === "ae" ? "tab-btn-active" : "tab-btn-inactive"}`}>Available Expressions</button>
        <button onClick={() => setActiveTab("du")} className={`tab-btn ${activeTab === "du" ? "tab-btn-active" : "tab-btn-inactive"}`}>Def-Use / Use-Def Chains</button>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {activeTab === "rd" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400">Reaching Definitions (IN[B] = ∪ OUT[P], OUT[B] = GEN[B] ∪ (IN[B] \ KILL[B]))</div>
            <table className="w-full text-xs mono border border-border rounded-lg">
              <thead className="bg-panel2 text-gray-400">
                <tr>
                  <th className="p-2 text-left">Basic Block</th>
                  <th className="p-2 text-left">GEN</th>
                  <th className="p-2 text-left">KILL</th>
                  <th className="p-2 text-left">IN</th>
                  <th className="p-2 text-left">OUT</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(dataflow.reachingDefs.in).map(bId => (
                  <tr key={bId} className="border-t border-border hover:bg-panel2/50">
                    <td className="p-2 font-bold text-accent2">{bId}</td>
                    <td className="p-2 text-gray-300">{dataflow.reachingDefs.gen[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-gray-500">{dataflow.reachingDefs.kill[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-warn">{dataflow.reachingDefs.in[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-accent">{dataflow.reachingDefs.out[bId]?.join(", ") || "∅"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "lv" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400">Live Variable Analysis (OUT[B] = ∪ IN[S], IN[B] = USE[B] ∪ (OUT[B] \ DEF[B]))</div>
            <table className="w-full text-xs mono border border-border rounded-lg">
              <thead className="bg-panel2 text-gray-400">
                <tr>
                  <th className="p-2 text-left">Basic Block</th>
                  <th className="p-2 text-left">USE</th>
                  <th className="p-2 text-left">DEF</th>
                  <th className="p-2 text-left">IN (Live Entry)</th>
                  <th className="p-2 text-left">OUT (Live Exit)</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(dataflow.liveVariables.in).map(bId => (
                  <tr key={bId} className="border-t border-border hover:bg-panel2/50">
                    <td className="p-2 font-bold text-accent2">{bId}</td>
                    <td className="p-2 text-gray-300">{dataflow.liveVariables.use[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-gray-500">{dataflow.liveVariables.def[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-accent">{dataflow.liveVariables.in[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-warn">{dataflow.liveVariables.out[bId]?.join(", ") || "∅"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "ae" && (
          <div className="space-y-3">
            <div className="text-xs text-gray-400">Available Expressions (IN[B] = ∩ OUT[P], OUT[B] = GEN[B] ∪ (IN[B] \ KILL[B]))</div>
            <table className="w-full text-xs mono border border-border rounded-lg">
              <thead className="bg-panel2 text-gray-400">
                <tr>
                  <th className="p-2 text-left">Basic Block</th>
                  <th className="p-2 text-left">GEN</th>
                  <th className="p-2 text-left">KILL</th>
                  <th className="p-2 text-left">IN</th>
                  <th className="p-2 text-left">OUT</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(dataflow.availableExprs.in).map(bId => (
                  <tr key={bId} className="border-t border-border hover:bg-panel2/50">
                    <td className="p-2 font-bold text-accent2">{bId}</td>
                    <td className="p-2 text-gray-300">{dataflow.availableExprs.gen[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-gray-500">{dataflow.availableExprs.kill[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-warn">{dataflow.availableExprs.in[bId]?.join(", ") || "∅"}</td>
                    <td className="p-2 text-accent">{dataflow.availableExprs.out[bId]?.join(", ") || "∅"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "du" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Def-Use Chains (DU)</div>
              <div className="space-y-2">
                {dataflow.defUseChains.map((du: any, i: number) => (
                  <div key={i} className="card p-2 text-xs mono">
                    <span className="text-accent font-bold">Def #{du.defInstrId}</span> ({du.varName} in {du.blockId}) →
                    <div className="mt-1 pl-3 text-gray-300">
                      {du.uses.length > 0 ? du.uses.map((u: any) => `Use #${u.instrId} [${u.blockId}]`).join(", ") : <span className="text-gray-600">no active uses</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Use-Def Chains (UD)</div>
              <div className="space-y-2">
                {dataflow.useDefChains.map((ud: any, i: number) => (
                  <div key={i} className="card p-2 text-xs mono">
                    <span className="text-warn font-bold">Use #{ud.useInstrId}</span> ({ud.varName} in {ud.blockId}) ←
                    <div className="mt-1 pl-3 text-gray-300">
                      {ud.defs.length > 0 ? ud.defs.map((d: any) => `Def #${d.instrId} [${d.blockId}]`).join(", ") : <span className="text-gray-600">external / undef</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
