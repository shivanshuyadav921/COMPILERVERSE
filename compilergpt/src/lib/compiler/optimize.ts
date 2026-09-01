// optimize.ts — Real optimization passes operating on three-address-code IR.
// Each pass actually transforms the instruction list; results are diffable.

import { IRInstr } from "./ir";

export interface OptimizationLog {
  pass: string;
  changes: string[];
}

const ARITH_OPS: Record<string, (a: number, b: number) => number> = {
  add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b,
  div: (a, b) => (b === 0 ? NaN : a / b), mod: (a, b) => (b === 0 ? NaN : a % b),
};
const CMP_OPS: Record<string, (a: number, b: number) => boolean> = {
  eq: (a, b) => a === b, neq: (a, b) => a !== b, lt: (a, b) => a < b,
  gt: (a, b) => a > b, lte: (a, b) => a <= b, gte: (a, b) => a >= b,
};

function isNumeric(s: string | undefined): boolean {
  return s !== undefined && /^-?\d+(\.\d+)?$/.test(s);
}

export function constantFolding(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  const out = code.map(instr => {
    if ((instr.op in ARITH_OPS || instr.op in CMP_OPS) && isNumeric(instr.arg1) && isNumeric(instr.arg2)) {
      const a = parseFloat(instr.arg1!), b = parseFloat(instr.arg2!);
      let val: string;
      if (instr.op in ARITH_OPS) val = String(ARITH_OPS[instr.op](a, b));
      else val = CMP_OPS[instr.op](a, b) ? "true" : "false";
      changes.push(`${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2}  →  ${instr.result} = ${val}`);
      return { ...instr, op: "assign", arg1: val, arg2: undefined };
    }
    return instr;
  });
  return { code: out, log: { pass: "Constant Folding", changes } };
}

export function constantPropagation(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  const constVal = new Map<string, string>();
  const out = code.map(instr => {
    // Labels are jump targets reachable from multiple control-flow paths (including
    // loop back-edges). We can't soundly assume a constant's value still holds at a
    // merge point, so conservatively forget everything we "knew" before it.
    if (instr.op === "label") constVal.clear();
    const ni = { ...instr };
    if (ni.arg1 && constVal.has(ni.arg1) && ni.op !== "assign") {
      changes.push(`arg '${ni.arg1}' → '${constVal.get(ni.arg1)}' in instruction ${ni.result ?? ni.label ?? ni.id}`);
      ni.arg1 = constVal.get(ni.arg1);
    } else if (ni.arg1 && constVal.has(ni.arg1) && ni.op === "assign") {
      ni.arg1 = constVal.get(ni.arg1);
    }
    if (ni.arg2 && constVal.has(ni.arg2)) {
      changes.push(`arg '${ni.arg2}' → '${constVal.get(ni.arg2)}' in instruction ${ni.result ?? ni.label ?? ni.id}`);
      ni.arg2 = constVal.get(ni.arg2);
    }
    if (ni.op === "assign" && ni.result && isNumeric(ni.arg1)) {
      constVal.set(ni.result, ni.arg1!);
    } else if (ni.result) {
      constVal.delete(ni.result); // result no longer a known constant
    }
    return ni;
  });
  return { code: out, log: { pass: "Constant Propagation", changes } };
}

export function deadCodeElimination(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  // Determine which temps/vars are ever used as arg1/arg2/condition
  const used = new Set<string>();
  code.forEach(instr => {
    if (instr.arg1 && !isNumeric(instr.arg1) && instr.op !== "assign") used.add(instr.arg1);
    if (instr.arg1 && instr.op === "if_false") used.add(instr.arg1);
    if (instr.arg1) used.add(instr.arg1);
    if (instr.arg2) used.add(instr.arg2);
  });
  const out = code.filter(instr => {
    const isPureDef = (instr.op === "assign" || instr.op in ARITH_OPS || instr.op in CMP_OPS || instr.op === "not" || instr.op === "neg")
      && instr.result && instr.result.startsWith("t") && !used.has(instr.result);
    if (isPureDef) {
      changes.push(`Removed unused temporary: ${instr.result} = ... (line ${instr.sourceLine})`);
      return false;
    }
    return true;
  });
  return { code: out, log: { pass: "Dead Code Elimination", changes } };
}

export function commonSubexpressionElimination(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  const seen = new Map<string, string>(); // "op:arg1:arg2" -> result temp
  const replace = new Map<string, string>();
  const out: IRInstr[] = [];
  for (const instr of code) {
    if (instr.op === "label") { seen.clear(); }
    const ni = { ...instr };
    if (ni.arg1 && replace.has(ni.arg1)) ni.arg1 = replace.get(ni.arg1);
    if (ni.arg2 && replace.has(ni.arg2)) ni.arg2 = replace.get(ni.arg2);
    if ((ni.op in ARITH_OPS || ni.op in CMP_OPS) && ni.result) {
      const key = `${ni.op}:${ni.arg1}:${ni.arg2}`;
      if (seen.has(key)) {
        const canonical = seen.get(key)!;
        changes.push(`${ni.result} = ${ni.arg1} ${ni.op} ${ni.arg2}  is redundant with ${canonical} → replaced with assign`);
        replace.set(ni.result, canonical);
        out.push({ ...ni, op: "assign", arg1: canonical, arg2: undefined });
        continue;
      }
      seen.set(key, ni.result);
    }
    // Invalidate cache entries depending on a mutated variable
    if (ni.op === "assign" && ni.result && !ni.result.startsWith("t")) {
      for (const key of Array.from(seen.keys())) {
        if (key.includes(`:${ni.result}:`) || key.endsWith(`:${ni.result}`)) seen.delete(key);
      }
    }
    out.push(ni);
  }
  return { code: out, log: { pass: "Common Subexpression Elimination", changes } };
}

export function copyPropagation(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  const copyOf = new Map<string, string>();
  const out = code.map(instr => {
    if (instr.op === "label") copyOf.clear();
    const ni = { ...instr };
    if (ni.arg1 && copyOf.has(ni.arg1)) { changes.push(`${ni.arg1} → ${copyOf.get(ni.arg1)}`); ni.arg1 = copyOf.get(ni.arg1); }
    if (ni.arg2 && copyOf.has(ni.arg2)) { changes.push(`${ni.arg2} → ${copyOf.get(ni.arg2)}`); ni.arg2 = copyOf.get(ni.arg2); }
    if (ni.op === "assign" && ni.result && ni.arg1 && !isNumeric(ni.arg1)) {
      copyOf.set(ni.result, ni.arg1);
    } else if (ni.result) {
      copyOf.delete(ni.result);
    }
    return ni;
  });
  return { code: out, log: { pass: "Copy Propagation", changes } };
}

export function strengthReduction(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  const out = code.map(instr => {
    if (instr.op === "mul" && (instr.arg2 === "2" || instr.arg1 === "2")) {
      const operand = instr.arg2 === "2" ? instr.arg1 : instr.arg2;
      changes.push(`${instr.result} = ${instr.arg1} * ${instr.arg2}  →  ${instr.result} = ${operand} + ${operand} (shift/add form)`);
      return { ...instr, op: "add", arg1: operand, arg2: operand };
    }
    if (instr.op === "mul" && isNumeric(instr.arg2) && Math.log2(Number(instr.arg2)) % 1 === 0 && Number(instr.arg2) > 0) {
      const shift = Math.log2(Number(instr.arg2));
      changes.push(`${instr.result} = ${instr.arg1} * ${instr.arg2}  →  ${instr.result} = ${instr.arg1} << ${shift}`);
      return { ...instr, op: "shl", arg2: String(shift) };
    }
    return instr;
  });
  return { code: out, log: { pass: "Strength Reduction", changes } };
}

export function peepholeOptimization(code: IRInstr[]): { code: IRInstr[]; log: OptimizationLog } {
  const changes: string[] = [];
  const out: IRInstr[] = [];
  for (let i = 0; i < code.length; i++) {
    const cur = code[i];
    const next = code[i + 1];
    // Remove goto immediately followed by its own target label
    if (cur.op === "goto" && next && next.op === "label" && next.label === cur.label) {
      changes.push(`Removed redundant goto ${cur.label} (falls through anyway)`);
      continue;
    }
    // Remove self-assignment x = x
    if (cur.op === "assign" && cur.arg1 === cur.result) {
      changes.push(`Removed no-op self-assignment ${cur.result} = ${cur.arg1}`);
      continue;
    }
    out.push(cur);
  }
  return { code: out, log: { pass: "Peephole Optimization", changes } };
}

export type OptPassName =
  | "constantFolding" | "constantPropagation" | "deadCodeElimination"
  | "commonSubexpressionElimination" | "copyPropagation" | "strengthReduction" | "peepholeOptimization";

export const ALL_PASSES: { key: OptPassName; label: string; fn: (c: IRInstr[]) => { code: IRInstr[]; log: OptimizationLog } }[] = [
  { key: "constantFolding", label: "Constant Folding", fn: constantFolding },
  { key: "constantPropagation", label: "Constant Propagation", fn: constantPropagation },
  { key: "copyPropagation", label: "Copy Propagation", fn: copyPropagation },
  { key: "commonSubexpressionElimination", label: "Common Subexpr. Elimination", fn: commonSubexpressionElimination },
  { key: "strengthReduction", label: "Strength Reduction", fn: strengthReduction },
  { key: "deadCodeElimination", label: "Dead Code Elimination", fn: deadCodeElimination },
  { key: "peepholeOptimization", label: "Peephole Optimization", fn: peepholeOptimization },
];

export function runOptimizationPipeline(code: IRInstr[], enabled: Record<string, boolean>): { code: IRInstr[]; logs: OptimizationLog[] } {
  let cur = code;
  const logs: OptimizationLog[] = [];
  // Run twice through enabled passes so later passes (e.g. DCE) can benefit from earlier ones (e.g. propagation)
  for (let round = 0; round < 2; round++) {
    for (const pass of ALL_PASSES) {
      if (enabled[pass.key] === false) continue;
      const { code: newCode, log } = pass.fn(cur);
      cur = newCode;
      if (round === 0 || log.changes.length > 0) logs.push(log);
    }
  }
  return { code: cur, logs };
}
