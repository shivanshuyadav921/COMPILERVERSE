"use client";

export default function DominatorView({ dominators }: { dominators: any }) {
  if (!dominators) return <div className="text-gray-500 text-sm p-4">No dominator data available.</div>;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="text-xs text-gray-400">
        Dominators (Dom(b)), Immediate Dominators (idom(b)), and Dominance Frontiers (DF(b)) for SSA Φ-node placement.
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Immediate Dominators */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-accent2 border-b border-border pb-1">Immediate Dominators (idom)</div>
          <table className="w-full text-xs mono">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="p-1">Block</th>
                <th className="p-1">idom</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dominators.idom).map(([bId, parent]: [string, any]) => (
                <tr key={bId} className="border-t border-border/50">
                  <td className="p-1 font-bold text-gray-200">{bId}</td>
                  <td className="p-1 text-accent">{parent || "ENTRY (Root)"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dominance Frontiers */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-warn border-b border-border pb-1">Dominance Frontiers (DF)</div>
          <table className="w-full text-xs mono">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="p-1">Block</th>
                <th className="p-1">Frontier Nodes</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dominators.frontiers).map(([bId, df]: [string, any]) => (
                <tr key={bId} className="border-t border-border/50">
                  <td className="p-1 font-bold text-gray-200">{bId}</td>
                  <td className="p-1 text-warn">{df.length > 0 ? df.join(", ") : "∅"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Full Dominator Set */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-accent border-b border-border pb-1">Dominator Set (Dom(b))</div>
          <table className="w-full text-xs mono">
            <thead>
              <tr className="text-gray-500 text-left">
                <th className="p-1">Block</th>
                <th className="p-1">Strict & Self Dominators</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(dominators.dominators).map(([bId, doms]: [string, any]) => (
                <tr key={bId} className="border-t border-border/50">
                  <td className="p-1 font-bold text-gray-200">{bId}</td>
                  <td className="p-1 text-gray-400">{doms.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
