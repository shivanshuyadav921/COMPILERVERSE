"use client";
import { useState } from "react";
import { OptLevel } from "@/lib/compiler/optimizationLevels";

export default function CompilerExplorerView({ optLevels }: { optLevels: Record<OptLevel, any> }) {
  const [levelA, setLevelA] = useState<OptLevel>("O0");
  const [levelB, setLevelB] = useState<OptLevel>("O3");

  if (!optLevels) return <div className="text-gray-500 text-sm p-4">No optimization level comparison available.</div>;

  const dataA = optLevels[levelA];
  const dataB = optLevels[levelB];

  return (
    <div className="h-full flex flex-col">
      {/* Explorer Bar */}
      <div className="flex items-center justify-between p-2 border-b border-border bg-panel text-xs">
        <div className="flex items-center gap-4">
          <span className="font-bold text-accent">Compiler Explorer Mode</span>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Pane A:</span>
            <select
              value={levelA}
              onChange={e => setLevelA(e.target.value as OptLevel)}
              className="bg-panel2 border border-border text-gray-200 rounded px-2 py-1 outline-none"
            >
              <option value="O0">-O0 (No Optimization)</option>
              <option value="O1">-O1 (Basic Folding & Prop)</option>
              <option value="O2">-O2 (CSE & Strength Red)</option>
              <option value="O3">-O3 (Full DCE & Peephole)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Pane B:</span>
            <select
              value={levelB}
              onChange={e => setLevelB(e.target.value as OptLevel)}
              className="bg-panel2 border border-border text-gray-200 rounded px-2 py-1 outline-none"
            >
              <option value="O0">-O0 (No Optimization)</option>
              <option value="O1">-O1 (Basic Folding & Prop)</option>
              <option value="O2">-O2 (CSE & Strength Red)</option>
              <option value="O3">-O3 (Full DCE & Peephole)</option>
            </select>
          </div>
        </div>

        <div className="text-gray-400 mono">
          Instruction Delta: <span className="font-bold text-accent2">{dataA.instructionCount}</span> → <span className="font-bold text-accent2">{dataB.instructionCount}</span> ({dataA.instructionCount - dataB.instructionCount} eliminated)
        </div>
      </div>

      {/* Split Comparison View */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-2 overflow-hidden">
        {/* Pane A */}
        <div className="flex flex-col border border-border rounded-lg bg-panel overflow-hidden">
          <div className="p-2 border-b border-border bg-panel2 font-bold text-xs text-accent2 flex justify-between">
            <span>{dataA.label}</span>
            <span>{dataA.instructionCount} instrs</span>
          </div>
          <div className="flex-1 overflow-auto p-3 mono text-xs leading-relaxed space-y-1">
            {dataA.irLines.map((line: string, i: number) => (
              <div key={i} className="px-1 py-0.5 rounded hover:bg-panel2 text-gray-200">
                {line}
              </div>
            ))}
          </div>
        </div>

        {/* Pane B */}
        <div className="flex flex-col border border-border rounded-lg bg-panel overflow-hidden">
          <div className="p-2 border-b border-border bg-panel2 font-bold text-xs text-accent flex justify-between">
            <span>{dataB.label}</span>
            <span>{dataB.instructionCount} instrs</span>
          </div>
          <div className="flex-1 overflow-auto p-3 mono text-xs leading-relaxed space-y-1">
            {dataB.irLines.map((line: string, i: number) => (
              <div key={i} className="px-1 py-0.5 rounded hover:bg-panel2 text-gray-200">
                {line}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
