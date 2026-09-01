// ssa.ts — Static Single Assignment (SSA) Form Generator for Nova IR.
// Inserts Phi nodes via Iterated Dominance Frontiers and performs SSA variable renaming.

import { BasicBlock, CFG } from "./cfg";
import { IRInstr } from "./ir";
import { DominatorTreeResult } from "./dominator";

export interface PhiNode {
  id: number;
  targetVar: string;              // original variable name, e.g. "result"
  ssaVar: string;                 // versioned SSA variable name, e.g. "result_2"
  operands: Record<string, string>; // predBlockId -> ssaVarName, e.g. { B0: "result_0", B2: "result_1" }
  blockId: string;
}

export interface SSABasicBlock extends Omit<BasicBlock, "instrs"> {
  phiNodes: PhiNode[];
  instrs: IRInstr[];
}

export interface SSAResult {
  blocks: SSABasicBlock[];
  phiNodes: PhiNode[];
  versionMap: Record<string, number>; // Original var -> Max version count
}

export function convertToSSA(cfg: CFG, domResult: DominatorTreeResult): SSAResult {
  if (cfg.blocks.length === 0) {
    return { blocks: [], phiNodes: [], versionMap: {} };
  }

  const allVars = new Set<string>();
  const defBlocks: Record<string, Set<string>> = {};

  cfg.blocks.forEach(b => {
    b.instrs.forEach(instr => {
      if (instr.result && !instr.result.startsWith("t") && instr.op !== "goto" && instr.op !== "if_false" && instr.op !== "label" && instr.op !== "return") {
        allVars.add(instr.result);
        if (!defBlocks[instr.result]) defBlocks[instr.result] = new Set();
        defBlocks[instr.result].add(b.id);
      }
      if (instr.op === "recv_param" && instr.result) {
        allVars.add(instr.result);
        if (!defBlocks[instr.result]) defBlocks[instr.result] = new Set();
        defBlocks[instr.result].add(b.id);
      }
    });
  });

  const phiNodesByBlock: Record<string, PhiNode[]> = {};
  cfg.blocks.forEach(b => { phiNodesByBlock[b.id] = []; });

  let phiIdCounter = 1000;
  const allPhiNodes: PhiNode[] = [];

  // 1. Insert Phi-nodes at Iterated Dominance Frontiers (IDF)
  allVars.forEach(v => {
    const worklist = Array.from(defBlocks[v] || []);
    const insertedBlocks = new Set<string>();

    while (worklist.length > 0) {
      const bId = worklist.shift()!;
      const df = domResult.frontiers[bId] || [];
      df.forEach(yId => {
        if (!insertedBlocks.has(yId)) {
          insertedBlocks.add(yId);
          const phi: PhiNode = {
            id: phiIdCounter++,
            targetVar: v,
            ssaVar: v,
            operands: {},
            blockId: yId,
          };
          phiNodesByBlock[yId].push(phi);
          allPhiNodes.push(phi);
          if (!defBlocks[v]?.has(yId)) {
            worklist.push(yId);
          }
        }
      });
    }
  });

  // 2. Variable Renaming Pass
  const versionStacks: Record<string, string[]> = {};
  const versionCounters: Record<string, number> = {};
  allVars.forEach(v => {
    versionStacks[v] = [`${v}_0`];
    versionCounters[v] = 0;
  });

  function newVersion(v: string): string {
    versionCounters[v] = (versionCounters[v] || 0) + 1;
    const s = `${v}_${versionCounters[v]}`;
    versionStacks[v].push(s);
    return s;
  }

  function currentVersion(v: string): string {
    const stack = versionStacks[v];
    if (stack && stack.length > 0) return stack[stack.length - 1];
    return `${v}_0`;
  }

  const ssaInstrsByBlock: Record<string, IRInstr[]> = {};
  cfg.blocks.forEach(b => { ssaInstrsByBlock[b.id] = []; });

  const predsMap: Record<string, string[]> = {};
  cfg.edges.forEach(e => {
    if (!predsMap[e.to]) predsMap[e.to] = [];
    if (!predsMap[e.to].includes(e.from)) predsMap[e.to].push(e.from);
  });

  function rename(bId: string) {
    const pushedCount: Record<string, number> = {};
    allVars.forEach(v => { pushedCount[v] = 0; });

    // Rename Phi-node targets in bId
    phiNodesByBlock[bId].forEach(phi => {
      phi.ssaVar = newVersion(phi.targetVar);
      pushedCount[phi.targetVar]++;
    });

    // Rename instructions in bId
    const originalBlock = cfg.blocks.find(b => b.id === bId)!;
    originalBlock.instrs.forEach(instr => {
      const newInstr: IRInstr = { ...instr };

      if (newInstr.arg1 && allVars.has(newInstr.arg1)) {
        newInstr.arg1 = currentVersion(newInstr.arg1);
      }
      if (newInstr.arg2 && allVars.has(newInstr.arg2)) {
        newInstr.arg2 = currentVersion(newInstr.arg2);
      }

      if (newInstr.result && allVars.has(newInstr.result)) {
        newInstr.result = newVersion(newInstr.result);
        pushedCount[newInstr.result]++;
      }

      ssaInstrsByBlock[bId].push(newInstr);
    });

    // Fill Phi-node operands in successors
    const succs = originalBlock.successors;
    succs.forEach(succId => {
      phiNodesByBlock[succId].forEach(phi => {
        phi.operands[bId] = currentVersion(phi.targetVar);
      });
    });

    // Recurse into children in Dominator Tree
    const domChildren = domResult.tree[bId] || [];
    domChildren.forEach(childId => rename(childId));

    // Pop versions pushed in this block
    allVars.forEach(v => {
      for (let i = 0; i < pushedCount[v]; i++) {
        versionStacks[v].pop();
      }
    });
  }

  rename(cfg.blocks[0].id);

  const ssaBlocks: SSABasicBlock[] = cfg.blocks.map(b => ({
    id: b.id,
    label: b.label,
    successors: b.successors,
    phiNodes: phiNodesByBlock[b.id] || [],
    instrs: ssaInstrsByBlock[b.id] || [],
  }));

  return {
    blocks: ssaBlocks,
    phiNodes: allPhiNodes,
    versionMap: versionCounters,
  };
}

export function convertOutOfSSA(ssaResult: SSAResult): IRInstr[] {
  const outInstrs: IRInstr[] = [];
  let iid = 0;

  ssaResult.blocks.forEach(b => {
    // 1. Emit label if present
    const labelInstr = b.instrs.find(i => i.op === "label");
    if (labelInstr) outInstrs.push({ ...labelInstr, id: iid++ });
    else outInstrs.push({ id: iid++, op: "label", label: b.label, sourceLine: 1 });

    // 2. Lower Phi nodes to assignments
    b.phiNodes.forEach(phi => {
      // Pick first operand or default assignment
      const opKeys = Object.keys(phi.operands);
      const val = opKeys.length > 0 ? phi.operands[opKeys[0]] : phi.targetVar;
      outInstrs.push({
        id: iid++,
        op: "assign",
        arg1: val,
        result: phi.targetVar,
        sourceLine: 1,
      });
    });

    // 3. Emit remaining instructions stripping SSA suffix
    b.instrs.filter(i => i.op !== "label").forEach(instr => {
      const copy = { ...instr, id: iid++ };
      if (copy.arg1 && copy.arg1.includes("_")) copy.arg1 = copy.arg1.split("_")[0];
      if (copy.arg2 && copy.arg2.includes("_")) copy.arg2 = copy.arg2.split("_")[0];
      if (copy.result && copy.result.includes("_")) copy.result = copy.result.split("_")[0];
      outInstrs.push(copy);
    });
  });

  return outInstrs;
}
