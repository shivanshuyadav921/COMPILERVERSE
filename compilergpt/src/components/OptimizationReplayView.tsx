"use client";
import { useState } from "react";

export default function OptimizationReplayView({ logs }: { logs: any[] }) {
  const [selectedPassIdx, setSelectedPassIdx] = useState(0);

  if (!logs || logs.length === 0) return <div className="text-gray-500 text-sm p-4">No optimization logs available for replay.</div>;

  const currentLog = logs[selectedPassIdx] || logs[0];

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden">
      <div className="flex justify-between items-center bg-panel p-2.5 border border-border rounded-lg text-xs">
        <span className="font-bold text-accent">Optimization Replay Engine</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedPassIdx(i => Math.max(0, i - 1))}
            className="px-3 py-1 bg-panel2 rounded text-gray-300 border border-border hover:bg-panel2/80"
          >
            Prev Pass ◄
          </button>
          <span className="mono text-gray-400 self-center">Pass {selectedPassIdx + 1} / {logs.length}</span>
          <button
            onClick={() => setSelectedPassIdx(i => Math.min(logs.length - 1, i + 1))}
            className="px-3 py-1 bg-panel2 rounded text-gray-300 border border-border hover:bg-panel2/80"
          >
            Next Pass ►
          </button>
        </div>
      </div>

      <div className="flex-1 card p-4 flex flex-col space-y-3 overflow-hidden">
        <div className="border-b border-border pb-2 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-accent2">{currentLog.pass}</h3>
            <div className="text-xs text-gray-400">Transformations applied: {currentLog.changes?.length || 0}</div>
          </div>
          <select
            value={selectedPassIdx}
            onChange={e => setSelectedPassIdx(Number(e.target.value))}
            className="bg-panel2 border border-border text-gray-200 rounded px-2 py-1 text-xs outline-none"
          >
            {logs.map((l: any, i: number) => (
              <option key={i} value={i}>{i + 1}. {l.pass} ({l.changes?.length || 0} changes)</option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2 overflow-auto">
          {currentLog.changes && currentLog.changes.length > 0 ? (
            currentLog.changes.map((c: string, i: number) => (
              <div key={i} className="p-3 bg-panel2 border border-border rounded-lg text-xs mono space-y-1">
                <div className="text-gray-500 font-bold text-[10px] uppercase">Transformation #{i + 1}</div>
                <div className="text-accent2 font-bold">{c}</div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 italic p-4 text-center">No transformations were triggered by this pass. The IR was invariant under this pass.</div>
          )}
        </div>
      </div>
    </div>
  );
}
