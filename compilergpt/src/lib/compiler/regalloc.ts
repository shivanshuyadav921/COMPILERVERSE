// regalloc.ts — Chaitin-Briggs Graph-Coloring Register Allocator for Nova Compiler.
// Calculates liveness intervals, constructs an Interference Graph, colors nodes with K physical registers, and manages memory spills.

import { IRInstr } from "./ir";
import { CFG } from "./cfg";
import { analyzeDataFlow } from "./dataflow";

export interface InterferenceNode {
  id: string;
  degree: number;
  isSpilled: boolean;
  color: string | null; // e.g. "R0", "R1", ...
  spillOffset?: number;
}

export interface InterferenceEdge {
  from: string;
  to: string;
}

export interface LiveInterval {
  varName: string;
  start: number; // Instruction ID start
  end: number;   // Instruction ID end
}

export interface RegisterAllocationResult {
  nodes: InterferenceNode[];
  edges: InterferenceEdge[];
  livenessIntervals: LiveInterval[];
  allocatedRegisters: Record<string, string>; // varName -> "R0" .. "R7" or "SPILL[offset]"
  spills: { varName: string; offset: number }[];
  maxRegistersUsed: number;
}

const PHYSICAL_REGISTERS = ["R0", "R1", "R2", "R3", "R4", "R5", "R6", "R7"];

export function allocateRegisters(code: IRInstr[], cfg: CFG): RegisterAllocationResult {
  const dataflow = analyzeDataFlow(cfg);

  // 1. Identify all variables and temporaries
  const varsSet = new Set<string>();
  code.forEach(instr => {
    if (instr.result && instr.op !== "goto" && instr.op !== "if_false" && instr.op !== "label" && instr.op !== "return") {
      varsSet.add(instr.result);
    }
    if (instr.arg1 && !/^-?\d+(\.\d+)?$|^(true|false)$/.test(instr.arg1) && instr.op !== "label" && instr.op !== "goto") {
      varsSet.add(instr.arg1);
    }
    if (instr.arg2 && !/^-?\d+(\.\d+)?$|^(true|false)$/.test(instr.arg2)) {
      varsSet.add(instr.arg2);
    }
  });

  const vars = Array.from(varsSet).sort();

  // 2. Compute Live Ranges / Intervals
  const intervalsMap: Record<string, { start: number; end: number }> = {};
  vars.forEach(v => {
    intervalsMap[v] = { start: Infinity, end: -Infinity };
  });

  code.forEach((instr, idx) => {
    const defined = instr.result;
    const used1 = instr.arg1;
    const used2 = instr.arg2;

    [defined, used1, used2].forEach(v => {
      if (v && intervalsMap[v]) {
        intervalsMap[v].start = Math.min(intervalsMap[v].start, idx);
        intervalsMap[v].end = Math.max(intervalsMap[v].end, idx);
      }
    });
  });

  const livenessIntervals: LiveInterval[] = vars.map(v => ({
    varName: v,
    start: intervalsMap[v].start === Infinity ? 0 : intervalsMap[v].start,
    end: intervalsMap[v].end === -Infinity ? 0 : intervalsMap[v].end,
  }));

  // 3. Build Interference Graph
  // Two variables interfere if their liveness intervals overlap or if they are live simultaneously at any basic block IN/OUT set
  const adjacency: Record<string, Set<string>> = {};
  vars.forEach(v => { adjacency[v] = new Set(); });

  for (let i = 0; i < vars.length; i++) {
    for (let j = i + 1; j < vars.length; j++) {
      const v1 = vars[i], v2 = vars[j];
      const i1 = intervalsMap[v1], i2 = intervalsMap[v2];

      const intervalOverlap = (i1.start <= i2.end && i2.start <= i1.end);
      let dataflowOverlap = false;

      cfg.blocks.forEach(b => {
        const liveIn = dataflow.liveVariables.in[b.id] || [];
        const liveOut = dataflow.liveVariables.out[b.id] || [];
        if ((liveIn.includes(v1) && liveIn.includes(v2)) || (liveOut.includes(v1) && liveOut.includes(v2))) {
          dataflowOverlap = true;
        }
      });

      if (intervalOverlap || dataflowOverlap) {
        adjacency[v1].add(v2);
        adjacency[v2].add(v1);
      }
    }
  }

  const edges: InterferenceEdge[] = [];
  vars.forEach(v1 => {
    adjacency[v1].forEach(v2 => {
      if (v1 < v2) edges.push({ from: v1, to: v2 });
    });
  });

  // 4. Chaitin-Briggs Graph Coloring
  const K = PHYSICAL_REGISTERS.length; // 8 registers
  const activeDegrees: Record<string, number> = {};
  vars.forEach(v => { activeDegrees[v] = adjacency[v].size; });

  const stack: string[] = [];
  const spilledVars = new Set<string>();
  const removedFromGraph = new Set<string>();

  while (removedFromGraph.size < vars.length) {
    // Find unremoved node with degree < K
    const candidate = vars.find(v => !removedFromGraph.has(v) && activeDegrees[v] < K);
    if (candidate) {
      stack.push(candidate);
      removedFromGraph.add(candidate);
      adjacency[candidate].forEach(neighbor => {
        if (!removedFromGraph.has(neighbor)) {
          activeDegrees[neighbor]--;
        }
      });
    } else {
      // Spill candidate: pick node with maximum degree
      const spillCandidate = vars
        .filter(v => !removedFromGraph.has(v))
        .sort((a, b) => activeDegrees[b] - activeDegrees[a])[0];

      if (spillCandidate) {
        spilledVars.add(spillCandidate);
        stack.push(spillCandidate);
        removedFromGraph.add(spillCandidate);
        adjacency[spillCandidate].forEach(neighbor => {
          if (!removedFromGraph.has(neighbor)) {
            activeDegrees[neighbor]--;
          }
        });
      }
    }
  }

  // Assign Colors / Registers
  const assignedColor: Record<string, string> = {};
  const spills: { varName: string; offset: number }[] = [];
  let spillOffsetCounter = 4;

  while (stack.length > 0) {
    const v = stack.pop()!;
    if (spilledVars.has(v)) {
      assignedColor[v] = `[rbp-${spillOffsetCounter}]`;
      spills.push({ varName: v, offset: spillOffsetCounter });
      spillOffsetCounter += 4;
    } else {
      const neighborColors = new Set<string>();
      adjacency[v].forEach(n => {
        if (assignedColor[n] && !assignedColor[n].startsWith("[")) {
          neighborColors.add(assignedColor[n]);
        }
      });
      const availReg = PHYSICAL_REGISTERS.find(r => !neighborColors.has(r)) || PHYSICAL_REGISTERS[0];
      assignedColor[v] = availReg;
    }
  }

  const nodes: InterferenceNode[] = vars.map(v => ({
    id: v,
    degree: adjacency[v].size,
    isSpilled: spilledVars.has(v),
    color: assignedColor[v] || null,
    spillOffset: spills.find(s => s.varName === v)?.offset,
  }));

  const uniqueRegs = new Set(Object.values(assignedColor).filter(c => !c.startsWith("[")));

  return {
    nodes,
    edges,
    livenessIntervals,
    allocatedRegisters: assignedColor,
    spills,
    maxRegistersUsed: uniqueRegs.size,
  };
}
