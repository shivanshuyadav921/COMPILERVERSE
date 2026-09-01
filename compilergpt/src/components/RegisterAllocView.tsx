"use client";

export default function RegisterAllocView({ regAlloc }: { regAlloc: any }) {
  if (!regAlloc) return <div className="text-gray-500 text-sm p-4">No register allocation data available.</div>;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="flex justify-between items-center bg-panel p-3 border border-border rounded-lg text-xs">
        <div>
          <span className="font-bold text-accent">Chaitin-Briggs Graph Coloring Register Allocator</span>
          <div className="text-gray-400 text-[11px] mt-0.5">Colors variables using K=8 physical registers (`R0`–`R7`) with stack spill fallback.</div>
        </div>
        <div className="flex gap-4 mono">
          <div><span className="text-gray-500">Variables:</span> <span className="text-gray-200 font-bold">{regAlloc.nodes.length}</span></div>
          <div><span className="text-gray-500">Interference Edges:</span> <span className="text-gray-200 font-bold">{regAlloc.edges.length}</span></div>
          <div><span className="text-gray-500">Registers Used:</span> <span className="text-accent2 font-bold">{regAlloc.maxRegistersUsed} / 8</span></div>
          <div><span className="text-gray-500">Spills:</span> <span className="text-err font-bold">{regAlloc.spills.length}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Allocated Registers Table */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-accent2 border-b border-border pb-1">Register & Memory Assignments</div>
          <table className="w-full text-xs mono">
            <thead className="text-gray-500 text-left">
              <tr>
                <th className="p-1.5">Variable / Temporary</th>
                <th className="p-1.5">Interference Degree</th>
                <th className="p-1.5">Allocated Register / Stack Offset</th>
                <th className="p-1.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {regAlloc.nodes.map((node: any) => (
                <tr key={node.id} className="border-t border-border/50 hover:bg-panel2/50">
                  <td className="p-1.5 font-bold text-gray-200">{node.id}</td>
                  <td className="p-1.5 text-gray-400">{node.degree}</td>
                  <td className={`p-1.5 font-bold ${node.isSpilled ? "text-err" : "text-accent2"}`}>{node.color}</td>
                  <td className="p-1.5">
                    {node.isSpilled ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-err/20 text-err font-semibold">SPILLED</span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-accent2/20 text-accent2 font-semibold">REGISTERED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Live Intervals */}
        <div className="card p-3 space-y-2">
          <div className="text-xs font-bold uppercase text-accent border-b border-border pb-1">Liveness Intervals</div>
          <div className="space-y-2 max-h-[350px] overflow-auto">
            {regAlloc.livenessIntervals.map((interval: any) => (
              <div key={interval.varName} className="mono text-xs space-y-1">
                <div className="flex justify-between text-gray-300">
                  <span>{interval.varName}</span>
                  <span className="text-gray-500 text-[10px]">Instr #{interval.start} – #{interval.end}</span>
                </div>
                <div className="h-2 bg-panel2 rounded overflow-hidden flex items-center">
                  <div
                    className="h-full bg-accent rounded"
                    style={{
                      marginLeft: `${Math.min(100, interval.start * 8)}%`,
                      width: `${Math.max(5, (interval.end - interval.start + 1) * 8)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
