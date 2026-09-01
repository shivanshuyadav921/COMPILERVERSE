"use client";
export default function IRView({ ir, irOptimized, logs }: { ir: string[]; irOptimized: string[]; logs: any[] }) {
  if (!ir || ir.length === 0) return <div className="text-gray-500 text-sm p-4">No IR yet — compile some code.</div>;
  return (
    <div className="overflow-auto h-full p-3 grid grid-cols-2 gap-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Unoptimized (Three-Address Code)</div>
        <pre className="mono text-xs bg-panel2 rounded-md p-3 leading-relaxed overflow-auto">{ir.join("\n")}</pre>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Optimized</div>
        <pre className="mono text-xs bg-panel2 rounded-md p-3 leading-relaxed overflow-auto">{irOptimized.join("\n")}</pre>
        <div className="text-[11px] text-gray-500 mt-1">{ir.length} → {irOptimized.length} instructions</div>
      </div>
      <div className="col-span-2">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-1.5">Optimization Log</div>
        <div className="space-y-2">
          {logs && logs.length > 0 ? logs.map((l: any, i: number) => (
            <div key={i} className="bg-panel2 rounded-md p-2">
              <div className="text-accent text-xs font-medium mb-1">{l.pass}</div>
              {l.changes.length === 0 ? (
                <div className="text-gray-600 text-[11px] mono">no changes this pass</div>
              ) : (
                <div className="space-y-0.5">
                  {l.changes.map((c: string, j: number) => (
                    <div key={j} className="text-gray-400 text-[11px] mono">{c}</div>
                  ))}
                </div>
              )}
            </div>
          )) : <div className="text-gray-500 text-xs">No optimization passes have run.</div>}
        </div>
      </div>
    </div>
  );
}
