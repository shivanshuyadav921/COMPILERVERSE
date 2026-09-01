// optimizationLevels.ts — Preset Compiler Explorer Optimization Levels (-O0, -O1, -O2, -O3).

import { IRInstr } from "./ir";
import { runOptimizationPipeline, OptimizationLog } from "./optimize";

export type OptLevel = "O0" | "O1" | "O2" | "O3";

export interface OptLevelResult {
  level: OptLevel;
  label: string;
  code: IRInstr[];
  irLines: string[];
  logs: OptimizationLog[];
  instructionCount: number;
}

export function compileWithOptLevel(rawIR: IRInstr[], level: OptLevel): OptLevelResult {
  let enabled: Record<string, boolean> = {};

  switch (level) {
    case "O0":
      enabled = {
        constantFolding: false,
        constantPropagation: false,
        copyPropagation: false,
        commonSubexpressionElimination: false,
        strengthReduction: false,
        deadCodeElimination: false,
        peepholeOptimization: false,
      };
      break;

    case "O1":
      enabled = {
        constantFolding: true,
        constantPropagation: true,
        copyPropagation: true,
        commonSubexpressionElimination: false,
        strengthReduction: false,
        deadCodeElimination: false,
        peepholeOptimization: false,
      };
      break;

    case "O2":
      enabled = {
        constantFolding: true,
        constantPropagation: true,
        copyPropagation: true,
        commonSubexpressionElimination: true,
        strengthReduction: true,
        deadCodeElimination: false,
        peepholeOptimization: false,
      };
      break;

    case "O3":
      enabled = {
        constantFolding: true,
        constantPropagation: true,
        copyPropagation: true,
        commonSubexpressionElimination: true,
        strengthReduction: true,
        deadCodeElimination: true,
        peepholeOptimization: true,
      };
      break;
  }

  const { code, logs } = runOptimizationPipeline(rawIR, enabled);
  const irLines = code.map(i => {
    if (i.op === "label") return `${i.label}:`;
    if (i.op === "goto") return `  goto ${i.label}`;
    if (i.op === "if_false") return `  if_false ${i.arg1} goto ${i.label}`;
    if (i.op === "assign") return `  ${i.result} = ${i.arg1}`;
    if (i.op === "return") return `  return ${i.arg1 ?? ""}`;
    if (i.result) return `  ${i.result} = ${i.arg1} ${i.op} ${i.arg2 ?? ""}`;
    return `  ${i.op}`;
  });

  const labels = {
    O0: "-O0 (No Optimization)",
    O1: "-O1 (Basic Folding & Prop)",
    O2: "-O2 (CSE & Strength Red)",
    O3: "-O3 (Full DCE & Peephole)",
  };

  return {
    level,
    label: labels[level],
    code,
    irLines,
    logs,
    instructionCount: code.length,
  };
}

export function compareAllOptLevels(rawIR: IRInstr[]): Record<OptLevel, OptLevelResult> {
  return {
    O0: compileWithOptLevel(rawIR, "O0"),
    O1: compileWithOptLevel(rawIR, "O1"),
    O2: compileWithOptLevel(rawIR, "O2"),
    O3: compileWithOptLevel(rawIR, "O3"),
  };
}
