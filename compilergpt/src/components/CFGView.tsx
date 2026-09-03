"use client";
import { useMemo, useState } from "react";

export default function CFGView({
  cfgBefore,
  cfgAfter,
  cfg,
  onSelectNode,
}: {
  cfgBefore?: any;
  cfgAfter?: any;
  cfg?: any;
  onSelectNode?: (n: any) => void;
}) {
  const [mode, setMode] = useState<"before" | "after">("after");
  const activeCfg = cfg || (mode === "before" ? cfgBefore : cfgAfter) || cfgAfter || cfgBefore;


  const layout = useMemo(() => {
    if (!activeCfg || !activeCfg.blocks || activeCfg.blocks.length === 0) return null;
    const colWidth = 260, rowHeight = 26, blockPad = 14, gapY = 50;
    const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
    let y = 20;
    activeCfg.blocks.forEach((b: any) => {
      const instrs = b.instructions || b.instrs || [];
      const h = Math.max(30, instrs.length * rowHeight + blockPad);
      positions[b.id] = { x: 40, y, w: colWidth, h };
      y += h + gapY;
    });
    return { positions, totalHeight: y, colWidth };
  }, [activeCfg]);

  if (!activeCfg || !activeCfg.blocks || activeCfg.blocks.length === 0 || !layout) {
    return <div className="text-gray-500 text-sm p-4">No CFG yet — compile some code.</div>;
  }

  const edges = activeCfg.edges || [];
  const blocks = activeCfg.blocks || [];


  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 p-2 border-b border-border">
        <button onClick={() => setMode("before")} className={`tab-btn ${mode === "before" ? "tab-btn-active" : "tab-btn-inactive"}`}>Before Optimization</button>
        <button onClick={() => setMode("after")} className={`tab-btn ${mode === "after" ? "tab-btn-active" : "tab-btn-inactive"}`}>After Optimization</button>
        <div className="ml-auto text-xs text-gray-500 self-center">{blocks.length} basic blocks · {edges.length} edges</div>
      </div>
      <div className="overflow-auto flex-1 p-3">
        <svg width={layout.colWidth + 80} height={layout.totalHeight} className="mono">
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#7c5cff" />
            </marker>
          </defs>
          {edges.map((e: any, i: number) => {
            const from = layout.positions[e.from], to = layout.positions[e.to];
            if (!from || !to) return null;
            const x1 = from.x + from.w, y1 = from.y + from.h / 2;
            const x2 = to.x + to.w, y2 = to.y + to.h / 2;
            const isBack = to.y < from.y;
            const midX = isBack ? Math.max(x1, x2) + 40 : (x1 + x2) / 2 + 20;
            const color = e.kind === "branch" ? "#ffb454" : e.kind === "jump" ? "#ff5c7c" : "#38e1c6";
            const path = isBack
              ? `M${from.x},${y1} C${from.x - 40},${y1} ${to.x - 40},${y2} ${to.x},${y2}`
              : `M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`;
            return <path key={i} d={path} stroke={color} strokeWidth={1.5} fill="none" markerEnd="url(#arrow)" opacity={0.85} />;
          })}
          {blocks.map((b: any) => {
            const pos = layout.positions[b.id];
            if (!pos) return null;
            const instrs = b.instructions || b.instrs || [];
            return (
              <g key={b.id} onClick={() => onSelectNode?.(b)} className="cursor-pointer">
                <rect x={pos.x} y={pos.y} width={pos.w} height={pos.h} rx={6} fill="#191922" stroke="#7c5cff" strokeOpacity={0.5} />
                <text x={pos.x + 10} y={pos.y + 16} fill="#38e1c6" fontSize={11} fontWeight={600}>{b.label || b.id}</text>
                {instrs.map((instr: any, idx: number) => (
                  <text key={idx} x={pos.x + 10} y={pos.y + 32 + idx * 22} fill="#c9c9d6" fontSize={10}>
                    {instrLine(instr)}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex gap-4 p-2 border-t border-border text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-accent2 inline-block" /> fallthrough</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-warn inline-block" /> branch</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-err inline-block" /> jump</span>
      </div>
    </div>
  );
}

function instrLine(instr: any): string {
  if (instr.op === "label") return `${instr.label}:`;
  if (instr.op === "goto") return `goto ${instr.label}`;
  if (instr.op === "if_false") return `if_false ${instr.arg1} → ${instr.label}`;
  if (instr.op === "assign") return `${instr.result} = ${instr.arg1}`;
  if (instr.op === "return") return `return ${instr.arg1 ?? ""}`;
  if (instr.result) return `${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2 ?? ""}`;
  return instr.op;
}
