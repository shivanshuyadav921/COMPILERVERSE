"use client";

export default function MemoryLayoutView({ memoryLayout }: { memoryLayout: any }) {
  if (!memoryLayout) return <div className="text-gray-500 text-sm p-4">No memory layout data available.</div>;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="text-xs text-gray-400">
        Execution Stack Frame Layouts, Relative Base Pointer (`RBP`) Offsets, Return Addresses, Parameters, Local Variables, and Spills.
      </div>

      <div className="space-y-6">
        {memoryLayout.frames.map((frame: any) => (
          <div key={frame.functionName} className="card p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="font-bold text-accent text-sm mono">Stack Frame: ƒ {frame.functionName}</span>
              <span className="text-xs text-gray-500 mono">Frame Size: {frame.frameSizeBytes} bytes</span>
            </div>

            <div className="space-y-1.5 max-w-2xl mx-auto">
              <div className="text-[10px] uppercase text-gray-500 text-center tracking-wider font-semibold">High Addresses (Caller Frame)</div>

              {frame.slots.map((slot: any, i: number) => {
                let bgColor = "bg-panel2";
                let textColor = "text-gray-300";
                if (slot.kind === "return_address") { bgColor = "bg-accent/20 border-accent/40"; textColor = "text-accent font-bold"; }
                else if (slot.kind === "saved_frame_pointer") { bgColor = "bg-accent2/20 border-accent2/40"; textColor = "text-accent2 font-bold"; }
                else if (slot.kind === "parameter") { bgColor = "bg-warn/20 border-warn/40"; textColor = "text-warn font-bold"; }
                else if (slot.kind === "spill_slot") { bgColor = "bg-err/20 border-err/40"; textColor = "text-err font-bold"; }

                return (
                  <div key={i} className={`p-2.5 rounded border ${bgColor} flex justify-between items-center text-xs mono transition-all hover:scale-[1.01]`}>
                    <div className="flex items-center gap-3">
                      <span className="w-16 font-bold text-gray-500 text-[11px]">
                        {slot.offset >= 0 ? `[rbp+${slot.offset}]` : `[rbp${slot.offset}]`}
                      </span>
                      <span className={textColor}>{slot.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-gray-400 text-[11px]">
                      <span>{slot.type}</span>
                      <span>{slot.sizeBytes} bytes</span>
                      {slot.registerOrSpill && (
                        <span className="px-1.5 py-0.5 rounded bg-panel border border-border text-gray-300 text-[10px]">
                          {slot.registerOrSpill}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="text-[10px] uppercase text-gray-500 text-center tracking-wider font-semibold">Low Addresses (Callee Frame Growth ↓)</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
