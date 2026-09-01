"use client";

const PASSES = [
  { key: "constantFolding", label: "Constant Folding" },
  { key: "constantPropagation", label: "Constant Propagation" },
  { key: "copyPropagation", label: "Copy Propagation" },
  { key: "commonSubexpressionElimination", label: "Common Subexpr. Elimination" },
  { key: "strengthReduction", label: "Strength Reduction" },
  { key: "deadCodeElimination", label: "Dead Code Elimination" },
  { key: "peepholeOptimization", label: "Peephole Optimization" },
];

export default function OptimizationLab({ enabled, setEnabled }: { enabled: Record<string, boolean>; setEnabled: (e: Record<string, boolean>) => void }) {
  return (
    <div className="p-3 space-y-2">
      <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Optimization Passes</div>
      {PASSES.map(p => (
        <label key={p.key} className="flex items-center gap-2 text-xs cursor-pointer p-1.5 rounded hover:bg-panel2">
          <input
            type="checkbox"
            checked={enabled[p.key] !== false}
            onChange={(e) => setEnabled({ ...enabled, [p.key]: e.target.checked })}
            className="accent-accent"
          />
          <span className="text-gray-200">{p.label}</span>
        </label>
      ))}
    </div>
  );
}
