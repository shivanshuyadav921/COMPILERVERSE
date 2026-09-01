"use client";

export default function CallGraphView({ callGraph }: { callGraph: any }) {
  if (!callGraph || callGraph.nodes.length === 0) return <div className="text-gray-500 text-sm p-4">No call graph available.</div>;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="text-xs text-gray-400">
        Interprocedural Call Graph showing callers, callees, call frequencies, and recursive loops.
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Function Nodes */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-accent2 border-b border-border pb-1">Functions ({callGraph.nodes.length})</div>
          <div className="space-y-2">
            {callGraph.nodes.map((fn: any) => (
              <div key={fn.id} className="p-2.5 bg-panel2 rounded-lg mono text-xs flex justify-between items-center border border-border">
                <div>
                  <span className="font-bold text-accent">ƒ {fn.name}</span>({fn.params.join(", ")})
                  <div className="text-[10px] text-gray-500 mt-0.5">Callers: {fn.callerCount} · Callees: {fn.calleeCount}</div>
                </div>
                {fn.isRecursive && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-warn/20 text-warn font-bold border border-warn/40">RECURSIVE</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Call Edges */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-accent border-b border-border pb-1">Call Sites & Edges ({callGraph.edges.length})</div>
          <table className="w-full text-xs mono">
            <thead className="text-gray-500 text-left">
              <tr>
                <th className="p-1.5">Caller</th>
                <th className="p-1.5">Callee</th>
                <th className="p-1.5">Source Line</th>
                <th className="p-1.5">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {callGraph.edges.map((e: any, i: number) => (
                <tr key={i} className="border-t border-border/50 hover:bg-panel2/50">
                  <td className="p-1.5 font-bold text-gray-200">{e.from}</td>
                  <td className="p-1.5 text-accent2 font-bold">{e.to}</td>
                  <td className="p-1.5 text-gray-500">L{e.line}</td>
                  <td className="p-1.5 text-warn">{e.callCount}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
