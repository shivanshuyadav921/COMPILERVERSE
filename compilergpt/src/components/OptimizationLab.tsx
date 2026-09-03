"use client";

const PASSES = [
  { key: "constantFolding", label: "Constant Folding", description: "Evaluate constant expressions at compile time" },
  { key: "constantPropagation", label: "Constant Propagation", description: "Replace variable uses with known constant values" },
  { key: "copyPropagation", label: "Copy Propagation", description: "Replace copy-assigned variables with original source" },
  { key: "commonSubexpressionElimination", label: "Common Subexpr. Elimination", description: "Reuse already-computed expression results" },
  { key: "strengthReduction", label: "Strength Reduction", description: "Replace expensive ops with cheaper equivalents (mul→shl)" },
  { key: "deadCodeElimination", label: "Dead Code Elimination", description: "Remove instructions whose results are never used" },
  { key: "peepholeOptimization", label: "Peephole Optimization", description: "Remove redundant goto/label and self-assignments" },
];

export default function OptimizationLab({
  enabled,
  setEnabled,
  onToggle,
  logs,
}: {
  enabled: Record<string, boolean>;
  setEnabled?: (e: Record<string, boolean>) => void;
  onToggle?: (key: string) => void;
  logs?: any[];
}) {
  const handleToggle = (key: string, checked: boolean) => {
    if (onToggle) onToggle(key);
    else if (setEnabled) setEnabled({ ...enabled, [key]: checked });
  };

  const activeCount = PASSES.filter(p => enabled[p.key] !== false).length;

  return (
    <div className="p-3 space-y-2 font-sans">
      <div className="flex justify-between items-center mb-2">
        <div className="text-xs uppercase tracking-wide text-text-secondary font-semibold">Optimization Passes</div>
        <div className="text-[11px] text-sage font-semibold">{activeCount}/{PASSES.length} active</div>
      </div>
      {PASSES.map(p => {
        const isActive = enabled[p.key] !== false;
        const passLog = logs?.find(l => l.pass?.toLowerCase().replace(/[^a-z]/g, "") === p.key.toLowerCase());
        const changeCount = passLog?.changes?.length || 0;

        return (
          <label key={p.key} className="flex items-start gap-2 text-xs cursor-pointer p-2 rounded hover:bg-surface-elevated transition-colors group">
            <div
              onClick={() => handleToggle(p.key, !isActive)}
              className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isActive ? "bg-sage border-sage" : "border-border bg-surface-elevated"
              }`}
            >
              {isActive && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={isActive ? "text-text-primary font-medium" : "text-text-secondary"}>{p.label}</span>
                {changeCount > 0 && (
                  <span className="text-[10px] text-ochre font-semibold bg-ochre/10 px-1.5 py-0.5 rounded">
                    {changeCount} changes
                  </span>
                )}
              </div>
              <div className="text-[10px] text-text-secondary mt-0.5">{p.description}</div>
            </div>
          </label>
        );
      })}

      <div className="pt-2 border-t border-border">
        <div className="flex justify-between text-[11px] text-text-secondary">
          <button
            onClick={() => PASSES.forEach(p => (onToggle ? onToggle(p.key) : setEnabled && setEnabled({ ...enabled, [p.key]: true })))}
            className="hover:text-sage transition-colors"
          >
            Enable All
          </button>
          <button
            onClick={() => {
              if (setEnabled) {
                setEnabled(Object.fromEntries(PASSES.map(p => [p.key, false])));
              } else if (onToggle) {
                PASSES.filter(p => enabled[p.key] !== false).forEach(p => onToggle(p.key));
              }
            }}
            className="hover:text-terracotta transition-colors"
          >
            Disable All
          </button>
        </div>
      </div>
    </div>
  );
}
