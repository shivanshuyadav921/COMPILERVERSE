"use client";
import { useState } from "react";
import { executeWasmInBrowser, WasmExecutionResult } from "@/lib/compiler/wasm";

export default function WasmView({ wasm }: { wasm?: { wat: string; wasmBinary: Uint8Array; isValid: boolean } }) {
  const [running, setRunning] = useState(false);
  const [execResult, setExecResult] = useState<WasmExecutionResult | null>(null);

  if (!wasm) return <div className="p-4 text-xs text-text-secondary">No WebAssembly module generated.</div>;

  const handleRunWasm = async () => {
    setRunning(true);
    const res = await executeWasmInBrowser(wasm.wat);
    setExecResult(res);
    setRunning(false);
  };

  const wasmByteSize = wasm.wasmBinary?.length || 0;

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden font-sans">
      {/* Header bar */}
      <div className="flex justify-between items-center bg-surface p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-olive">WebAssembly (WASM) Backend</span>
          <span className="text-[11px] text-text-secondary bg-surface-elevated px-2 py-0.5 rounded border border-border">
            Size: {wasmByteSize} bytes · Binary v1
          </span>
        </div>
        <button
          onClick={handleRunWasm}
          disabled={running}
          className="px-3 py-1 bg-olive text-white font-bold rounded hover:bg-olive/80 transition-all flex items-center gap-1.5 shadow-sm"
        >
          {running ? "Instantiating WASM..." : "▶ Execute in Browser Sandbox"}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
        {/* WAT Code View */}
        <div className="card p-3 flex flex-col overflow-hidden">
          <div className="text-[11px] uppercase tracking-wide text-text-secondary font-semibold mb-2">
            WebAssembly Text Format (.wat)
          </div>
          <pre className="flex-1 mono text-xs text-text-primary overflow-auto p-2 bg-surface-elevated rounded border border-border leading-relaxed whitespace-pre">
            {wasm.wat}
          </pre>
        </div>

        {/* Execution & Module Inspector */}
        <div className="flex flex-col space-y-3 overflow-hidden">
          {/* Execution Result Box */}
          <div className="card p-3 flex flex-col overflow-auto">
            <div className="text-[11px] uppercase tracking-wide text-olive font-semibold mb-2">
              Browser WASM Execution Output
            </div>
            {execResult ? (
              <div className="space-y-2 text-xs mono">
                <div className="p-2 bg-surface-elevated border border-border rounded flex justify-between">
                  <span className="text-text-secondary">Execution Return:</span>
                  <span className="text-sage font-bold">{execResult.exitCode}</span>
                </div>
                <div className="p-2 bg-surface-elevated border border-border rounded flex justify-between">
                  <span className="text-text-secondary">Latency:</span>
                  <span className="text-text-primary font-bold">{execResult.executionTimeMs} ms</span>
                </div>
                <div className="p-2 bg-surface-elevated border border-border rounded space-y-1">
                  <span className="text-text-secondary block text-[10px] uppercase">Standard Output:</span>
                  {execResult.stdout.length > 0 ? (
                    execResult.stdout.map((line, idx) => (
                      <div key={idx} className="text-sage font-semibold">stdout: {line}</div>
                    ))
                  ) : (
                    <span className="text-text-secondary italic text-[11px]">No stdout emitted.</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs text-text-secondary italic p-4 text-center">
                Click &quot;Execute in Browser Sandbox&quot; to instantiate the WASM module using the native WebAssembly engine.
              </div>
            )}
          </div>

          {/* WASM Binary Hex View */}
          <div className="card p-3 flex flex-col flex-1 overflow-hidden">
            <div className="text-[11px] uppercase tracking-wide text-text-secondary font-semibold mb-2">
              WASM Binary Header (.wasm)
            </div>
            <div className="flex-1 overflow-auto mono text-[11px] text-text-secondary bg-surface-elevated p-2 rounded border border-border">
              {Array.from(wasm.wasmBinary || [])
                .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
                .join(" ")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
