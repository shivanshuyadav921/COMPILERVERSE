"use client";

export default function MetricsDashboardView({ metrics }: { metrics: any }) {
  if (!metrics) return <div className="text-gray-500 text-sm p-4">No metrics available.</div>;

  const cards = [
    { title: "Compile Time", value: `${metrics.compileTimeMs} ms`, color: "text-accent2" },
    { title: "Tokens", value: metrics.tokenCount, color: "text-gray-100" },
    { title: "AST Nodes", value: metrics.astNodeCount, color: "text-accent" },
    { title: "Declared Symbols", value: metrics.symbolCount, color: "text-gray-200" },
    { title: "Basic Blocks", value: metrics.basicBlockCount, color: "text-accent2" },
    { title: "CFG Edges", value: metrics.edgeCount, color: "text-gray-300" },
    { title: "Unoptimized IR", value: `${metrics.unoptimizedIRCount} instrs`, color: "text-warn" },
    { title: "Optimized IR", value: `${metrics.optimizedIRCount} instrs`, color: "text-accent2" },
    { title: "Optimizations Applied", value: metrics.optimizationsApplied, color: "text-accent" },
    { title: "SSA Phi Nodes", value: metrics.phiNodeCount, color: "text-warn" },
    { title: "Physical Regs Used", value: `${metrics.allocatedRegistersCount} / 8`, color: "text-accent2" },
    { title: "Stack Memory Spills", value: metrics.spillsCount, color: "text-err" },
    { title: "Assembly Lines", value: metrics.assemblyLineCount, color: "text-gray-200" },
    { title: "Memory Footprint", value: `~${metrics.estimatedMemoryKB} KB`, color: "text-gray-400" },
  ];

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="text-xs text-gray-400">
        Real-time compiler pipeline performance stats, artifact counts, and optimization transformation metrics.
      </div>

      <div className="grid grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="card p-3 space-y-1 bg-panel hover:bg-panel2 transition-all">
            <div className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">{c.title}</div>
            <div className={`text-xl font-bold mono ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
