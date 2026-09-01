"use client";
import { useState, useEffect } from "react";

export default function LiveTimelineView({ timeline }: { timeline: any[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1200);

  useEffect(() => {
    if (!isPlaying || !timeline || timeline.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => {
        if (prev >= timeline.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, speedMs);
    return () => clearInterval(interval);
  }, [isPlaying, timeline, speedMs]);

  if (!timeline || timeline.length === 0) return <div className="text-gray-500 text-sm p-4">No compilation timeline available.</div>;

  const frame = timeline[currentIdx] || timeline[0];

  return (
    <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
      {/* Timeline Scrubber & Control Bar */}
      <div className="card p-3 space-y-3 bg-panel">
        <div className="flex justify-between items-center text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 rounded bg-accent text-white font-bold hover:bg-accent/80 transition-all"
            >
              {isPlaying ? "Pause ❚❚" : "Play ▶"}
            </button>
            <button
              onClick={() => { setIsPlaying(false); setCurrentIdx(0); }}
              className="px-3 py-1.5 rounded bg-panel2 text-gray-300 border border-border hover:bg-panel2/80"
            >
              Rewind ↺
            </button>
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              className="px-2.5 py-1.5 rounded bg-panel2 text-gray-300 border border-border hover:bg-panel2/80"
            >
              Step Back ◄
            </button>
            <button
              onClick={() => setCurrentIdx(prev => Math.min(timeline.length - 1, prev + 1))}
              className="px-2.5 py-1.5 rounded bg-panel2 text-gray-300 border border-border hover:bg-panel2/80"
            >
              Step Next ►
            </button>
          </div>

          <div className="flex items-center gap-3 text-gray-400">
            <span>Frame: <strong className="text-accent2">{currentIdx + 1} / {timeline.length}</strong></span>
            <span>Speed:</span>
            <select
              value={speedMs}
              onChange={e => setSpeedMs(Number(e.target.value))}
              className="bg-panel2 border border-border text-gray-200 rounded px-2 py-1 text-xs outline-none"
            >
              <option value={2000}>0.5x (Slow)</option>
              <option value={1200}>1.0x (Normal)</option>
              <option value={600}>2.0x (Fast)</option>
            </select>
          </div>
        </div>

        {/* Scrubber Range Input */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={timeline.length - 1}
            value={currentIdx}
            onChange={e => { setIsPlaying(false); setCurrentIdx(Number(e.target.value)); }}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mono">
            {timeline.map((f, i) => (
              <span key={i} className={i === currentIdx ? "text-accent font-bold" : ""}>
                {f.stage}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Stage Snapshot Display */}
      <div className="flex-1 card p-4 flex flex-col space-y-3 overflow-hidden">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <div>
            <span className="text-xs uppercase tracking-wide text-accent font-bold">{frame.stage}</span>
            <h3 className="text-sm font-bold text-gray-100">{frame.title}</h3>
          </div>
          <span className="text-xs text-gray-400 font-mono">{frame.description}</span>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Active IR / Artifact State */}
          <div className="flex flex-col border border-border rounded-lg p-3 bg-panel2 overflow-hidden">
            <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Stage State Snapshot</div>
            <pre className="flex-1 mono text-xs text-gray-200 overflow-auto whitespace-pre-wrap leading-relaxed">
              {frame.irState && frame.irState.length > 0 ? frame.irState.join("\n") : "(No IR state at this stage)"}
            </pre>
          </div>

          {/* Transformation Delta / Logs */}
          <div className="flex flex-col border border-border rounded-lg p-3 bg-panel2 overflow-hidden space-y-2">
            <div className="text-xs uppercase tracking-wide text-gray-500">Transformation Delta & Details</div>
            {frame.changesDelta && frame.changesDelta.length > 0 ? (
              <div className="space-y-1 overflow-auto flex-1">
                {frame.changesDelta.map((c: string, idx: number) => (
                  <div key={idx} className="mono text-xs text-accent2 bg-panel p-2 rounded border border-border">
                    {c}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">No transformation delta emitted for this stage.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
