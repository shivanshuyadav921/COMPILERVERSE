"use client";
import { useState } from "react";
import { X86Program } from "@/lib/compiler/x86_gen";
import { X86ExecutionResult, X86ExecutionStep } from "@/lib/compiler/x86_emulator";

export default function X86View({
  x86,
  execution,
}: {
  x86?: X86Program;
  execution?: X86ExecutionResult;
}) {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  if (!x86 || !execution) {
    return <div className="p-4 text-xs text-text-secondary">No x86-64 assembly data available.</div>;
  }

  const steps = execution.steps || [];
  const currentStep: X86ExecutionStep | undefined = steps[currentStepIdx] || steps[0];
  const activeRegs = currentStep?.registers || execution.finalRegisters;

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden font-sans">
      {/* Control Header */}
      <div className="flex justify-between items-center bg-surface p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-olive">x86-64 Target Backend (Intel Syntax)</span>
          <span className="text-[11px] text-text-secondary bg-surface-elevated px-2 py-0.5 rounded border border-border">
            Total Instructions Executed: {execution.totalInstructionsExecuted}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStepIdx((i) => Math.max(0, i - 1))}
            disabled={currentStepIdx === 0}
            className="px-2.5 py-1 bg-surface-elevated border border-border rounded text-text-primary disabled:opacity-40 hover:bg-surface"
          >
            ◄ Step Prev
          </button>
          <span className="mono text-text-secondary text-[11px]">
            Step {currentStepIdx + 1} / {steps.length}
          </span>
          <button
            onClick={() => setCurrentStepIdx((i) => Math.min(steps.length - 1, i + 1))}
            disabled={currentStepIdx >= steps.length - 1}
            className="px-2.5 py-1 bg-olive text-white font-bold rounded hover:bg-olive/80 disabled:opacity-40"
          >
            Step Next ►
          </button>
          <button
            onClick={() => setCurrentStepIdx(steps.length - 1)}
            className="px-2 py-1 bg-surface-elevated border border-border text-text-secondary rounded hover:text-text-primary text-[11px]"
          >
            Run to End
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
        {/* Assembly Code Listing */}
        <div className="card p-3 flex flex-col overflow-hidden">
          <div className="text-[11px] uppercase tracking-wide text-text-secondary font-semibold mb-2">
            Generated x86-64 Intel Assembly
          </div>
          <div className="flex-1 overflow-auto mono text-xs leading-relaxed space-y-0.5">
            {x86.lines.map((line, idx) => {
              const isCurrentExec = currentStep && currentStep.instruction.trim() === line.text.trim();
              return (
                <div
                  key={idx}
                  className={`p-1 rounded flex justify-between ${
                    isCurrentExec
                      ? "bg-olive/20 border border-olive/50 text-olive font-bold"
                      : "text-text-primary hover:bg-surface-elevated"
                  }`}
                >
                  <span>{line.text}</span>
                  <span className="text-text-secondary text-[10px] pl-2">{line.explanation}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CPU Register State & Stack Inspector */}
        <div className="flex flex-col space-y-3 overflow-hidden">
          {/* Register Cards */}
          <div className="card p-3 flex flex-col overflow-auto">
            <div className="text-[11px] uppercase tracking-wide text-olive font-semibold mb-2">
              64-bit CPU Registers (Step {currentStep?.step || 1})
            </div>
            <div className="grid grid-cols-4 gap-2 mono text-xs">
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">RAX (ret)</span>
                <span className="text-olive font-bold">{activeRegs.rax ?? 0}</span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">RBX</span>
                <span className="text-text-primary font-bold">{activeRegs.rbx ?? 0}</span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">RCX</span>
                <span className="text-text-primary font-bold">{activeRegs.rcx ?? 0}</span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">RDX</span>
                <span className="text-text-primary font-bold">{activeRegs.rdx ?? 0}</span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">RSI</span>
                <span className="text-text-primary font-bold">{activeRegs.rsi ?? 0}</span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">RDI</span>
                <span className="text-text-primary font-bold">{activeRegs.rdi ?? 0}</span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">ZF (Zero)</span>
                <span className={`font-bold ${activeRegs.zf ? "text-sage" : "text-text-secondary"}`}>
                  {activeRegs.zf ? "1" : "0"}
                </span>
              </div>
              <div className="p-1.5 bg-surface-elevated border border-border rounded">
                <span className="text-text-secondary text-[10px] block">SF (Sign)</span>
                <span className={`font-bold ${activeRegs.sf ? "text-terracotta" : "text-text-secondary"}`}>
                  {activeRegs.sf ? "1" : "0"}
                </span>
              </div>
            </div>
          </div>

          {/* Emulation Standard Output */}
          <div className="card p-3 flex flex-col flex-1 overflow-auto">
            <div className="text-[11px] uppercase tracking-wide text-text-secondary font-semibold mb-2">
              Execution Trace & Output
            </div>
            <div className="mono text-xs space-y-1">
              <div className="p-2 bg-surface-elevated rounded border border-border flex justify-between">
                <span className="text-text-secondary">Process Exit Code:</span>
                <span className="text-sage font-bold">{execution.exitCode}</span>
              </div>
              <div className="p-2 bg-surface-elevated rounded border border-border space-y-1">
                <span className="text-text-secondary text-[10px] uppercase block">Console stdout:</span>
                {execution.stdout.length > 0 ? (
                  execution.stdout.map((line, idx) => (
                    <div key={idx} className="text-sage font-semibold">{line}</div>
                  ))
                ) : (
                  <span className="text-text-secondary italic text-[11px]">No print output emitted.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
