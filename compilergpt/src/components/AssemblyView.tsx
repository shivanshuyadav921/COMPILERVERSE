"use client";
import { useState } from "react";

export default function AssemblyView({ assembly }: { assembly: any[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!assembly || assembly.length === 0) return <div className="text-gray-500 text-sm p-4">No assembly yet — compile some code.</div>;

  return (
    <div className="h-full grid grid-cols-3">
      <div className="col-span-2 overflow-auto border-r border-border">
        <pre className="mono text-xs leading-relaxed p-3">
          {assembly.map((line: any, i: number) => (
            <div
              key={i}
              onClick={() => setSelected(i)}
              className={`px-2 py-0.5 rounded cursor-pointer hover:bg-panel2 ${selected === i ? "bg-accent/20" : ""} ${line.text.endsWith(":") ? "text-accent2" : "text-gray-200"}`}
            >
              {line.text}
              <span className="text-gray-600 float-right text-[10px]">src L{line.sourceLine}</span>
            </div>
          ))}
        </pre>
      </div>
      <div className="p-3 text-xs">
        <div className="text-gray-500 uppercase tracking-wide text-[11px] mb-2">Instruction Explanation</div>
        {selected !== null ? (
          <div className="card p-3">
            <div className="mono text-accent2 mb-2">{assembly[selected].text}</div>
            <div className="text-gray-300 leading-relaxed">{assembly[selected].explanation}</div>
            <div className="text-gray-600 mt-2 text-[10px]">Originates from source line {assembly[selected].sourceLine}, IR instruction #{assembly[selected].irIndex}</div>
          </div>
        ) : (
          <div className="text-gray-500">Click any instruction to see why the compiler generated it.</div>
        )}
      </div>
    </div>
  );
}
