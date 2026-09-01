// dataflow.ts — Dataflow Analysis Framework for Nova IR.
// Includes Reaching Definitions, Live Variables, Available Expressions, Constant Propagation, Def-Use & Use-Def Chains.

import { CFG, BasicBlock } from "./cfg";
import { IRInstr } from "./ir";

export interface ReachingDefResult {
  gen: Record<string, string[]>;    // Block ID -> Array of instr IDs defined
  kill: Record<string, string[]>;   // Block ID -> Array of instr IDs killed
  in: Record<string, string[]>;     // Block ID -> Array of instr IDs reaching IN
  out: Record<string, string[]>;    // Block ID -> Array of instr IDs reaching OUT
}

export interface LiveVariablesResult {
  use: Record<string, string[]>;    // Block ID -> Array of variable names
  def: Record<string, string[]>;    // Block ID -> Array of variable names
  in: Record<string, string[]>;     // Block ID -> Array of live variable names
  out: Record<string, string[]>;    // Block ID -> Array of live variable names
}

export interface AvailableExpressionsResult {
  gen: Record<string, string[]>;    // Block ID -> Array of expr strings "x op y"
  kill: Record<string, string[]>;   // Block ID -> Array of expr strings "x op y"
  in: Record<string, string[]>;     // Block ID -> Array of expr strings
  out: Record<string, string[]>;    // Block ID -> Array of expr strings
}

export interface DefUseChain {
  defInstrId: number;
  varName: string;
  blockId: string;
  uses: { instrId: number; blockId: string }[];
}

export interface UseDefChain {
  useInstrId: number;
  varName: string;
  blockId: string;
  defs: { instrId: number; blockId: string }[];
}

export interface DataFlowAnalysisResult {
  reachingDefs: ReachingDefResult;
  liveVariables: LiveVariablesResult;
  availableExprs: AvailableExpressionsResult;
  defUseChains: DefUseChain[];
  useDefChains: UseDefChain[];
}

function isConstant(val?: string): boolean {
  return val !== undefined && /^-?\d+(\.\d+)?$|^(true|false)$/.test(val);
}

function getOperands(instr: IRInstr): string[] {
  const ops: string[] = [];
  if (instr.arg1 && !isConstant(instr.arg1) && instr.op !== "label" && instr.op !== "goto") {
    ops.push(instr.arg1);
  }
  if (instr.arg2 && !isConstant(instr.arg2)) {
    ops.push(instr.arg2);
  }
  return ops;
}

function getDefinedVar(instr: IRInstr): string | undefined {
  if (instr.result && instr.op !== "goto" && instr.op !== "if_false" && instr.op !== "label" && instr.op !== "return") {
    return instr.result;
  }
  if (instr.op === "recv_param" && instr.result) return instr.result;
  return undefined;
}

function getExprString(instr: IRInstr): string | undefined {
  const arith = ["add", "sub", "mul", "div", "mod", "eq", "neq", "lt", "gt", "lte", "gte", "and", "or", "shl"];
  if (arith.includes(instr.op) && instr.arg1 && instr.arg2) {
    return `${instr.arg1} ${instr.op} ${instr.arg2}`;
  }
  return undefined;
}

export function analyzeDataFlow(cfg: CFG): DataFlowAnalysisResult {
  const preds: Record<string, string[]> = {};
  const succs: Record<string, string[]> = {};

  cfg.blocks.forEach(b => {
    preds[b.id] = [];
    succs[b.id] = [...b.successors];
  });
  cfg.edges.forEach(e => {
    if (!preds[e.to]) preds[e.to] = [];
    if (!preds[e.to].includes(e.from)) preds[e.to].push(e.from);
  });

  // Collect all definitions across program
  const allDefs: { instrId: number; varName: string; blockId: string }[] = [];
  cfg.blocks.forEach(b => {
    b.instrs.forEach(instr => {
      const v = getDefinedVar(instr);
      if (v) allDefs.push({ instrId: instr.id, varName: v, blockId: b.id });
    });
  });

  // 1. Reaching Definitions Analysis (Forward, Union)
  const rdGen: Record<string, string[]> = {};
  const rdKill: Record<string, string[]> = {};
  const rdIn: Record<string, string[]> = {};
  const rdOut: Record<string, string[]> = {};

  cfg.blocks.forEach(b => {
    const genIds: string[] = [];
    const killedVars = new Set<string>();

    // Scan backwards in block to get last definitions
    for (let i = b.instrs.length - 1; i >= 0; i--) {
      const instr = b.instrs[i];
      const v = getDefinedVar(instr);
      if (v && !killedVars.has(v)) {
        genIds.push(`d#${instr.id}:${v}`);
        killedVars.add(v);
      }
    }
    rdGen[b.id] = genIds.reverse();

    // Kill = all defs of variables in killedVars defined outside b
    const killIds: string[] = [];
    allDefs.forEach(d => {
      if (killedVars.has(d.varName) && d.blockId !== b.id) {
        killIds.push(`d#${d.instrId}:${d.varName}`);
      }
    });
    rdKill[b.id] = killIds;
    rdIn[b.id] = [];
    rdOut[b.id] = [...rdGen[b.id]];
  });

  let changed = true;
  let passCount = 0;
  while (changed && passCount++ < 100) {
    changed = false;
    cfg.blocks.forEach(b => {
      const pBlocks = preds[b.id] || [];
      const newInSet = new Set<string>();
      pBlocks.forEach(pId => {
        (rdOut[pId] || []).forEach(d => newInSet.add(d));
      });
      const newIn = Array.from(newInSet).sort();

      const killSet = new Set(rdKill[b.id]);
      const newOutSet = new Set(rdGen[b.id]);
      newIn.forEach(d => {
        if (!killSet.has(d)) newOutSet.add(d);
      });
      const newOut = Array.from(newOutSet).sort();

      if (JSON.stringify(newIn) !== JSON.stringify(rdIn[b.id]) || JSON.stringify(newOut) !== JSON.stringify(rdOut[b.id])) {
        rdIn[b.id] = newIn;
        rdOut[b.id] = newOut;
        changed = true;
      }
    });
  }

  // 2. Live Variable Analysis (Backward, Union)
  const lvUse: Record<string, string[]> = {};
  const lvDef: Record<string, string[]> = {};
  const lvIn: Record<string, string[]> = {};
  const lvOut: Record<string, string[]> = {};

  cfg.blocks.forEach(b => {
    const uses = new Set<string>();
    const defs = new Set<string>();
    b.instrs.forEach(instr => {
      getOperands(instr).forEach(op => {
        if (!defs.has(op)) uses.add(op);
      });
      const d = getDefinedVar(instr);
      if (d) defs.add(d);
    });
    lvUse[b.id] = Array.from(uses).sort();
    lvDef[b.id] = Array.from(defs).sort();
    lvIn[b.id] = [...lvUse[b.id]];
    lvOut[b.id] = [];
  });

  changed = true;
  passCount = 0;
  while (changed && passCount++ < 100) {
    changed = false;
    // Iterate backwards over blocks
    [...cfg.blocks].reverse().forEach(b => {
      const sBlocks = succs[b.id] || [];
      const newOutSet = new Set<string>();
      sBlocks.forEach(sId => {
        (lvIn[sId] || []).forEach(v => newOutSet.add(v));
      });
      const newOut = Array.from(newOutSet).sort();

      const defSet = new Set(lvDef[b.id]);
      const newInSet = new Set(lvUse[b.id]);
      newOut.forEach(v => {
        if (!defSet.has(v)) newInSet.add(v);
      });
      const newIn = Array.from(newInSet).sort();

      if (JSON.stringify(newIn) !== JSON.stringify(lvIn[b.id]) || JSON.stringify(newOut) !== JSON.stringify(lvOut[b.id])) {
        lvIn[b.id] = newIn;
        lvOut[b.id] = newOut;
        changed = true;
      }
    });
  }

  // 3. Available Expressions Analysis (Forward, Intersection)
  const allExprs = new Set<string>();
  cfg.blocks.forEach(b => {
    b.instrs.forEach(instr => {
      const expr = getExprString(instr);
      if (expr) allExprs.add(expr);
    });
  });
  const universeExprs = Array.from(allExprs).sort();

  const aeGen: Record<string, string[]> = {};
  const aeKill: Record<string, string[]> = {};
  const aeIn: Record<string, string[]> = {};
  const aeOut: Record<string, string[]> = {};

  cfg.blocks.forEach(b => {
    const genExprs = new Set<string>();
    b.instrs.forEach(instr => {
      const expr = getExprString(instr);
      if (expr) genExprs.add(expr);

      const d = getDefinedVar(instr);
      if (d) {
        // Kill expressions containing d
        genExprs.forEach(e => {
          const parts = e.split(" ");
          if (parts[0] === d || parts[2] === d) genExprs.delete(e);
        });
      }
    });

    const killedVarsInBlock = new Set<string>();
    b.instrs.forEach(instr => {
      const d = getDefinedVar(instr);
      if (d) killedVarsInBlock.add(d);
    });

    const killedExprs = new Set<string>();
    universeExprs.forEach(expr => {
      const parts = expr.split(" ");
      if (killedVarsInBlock.has(parts[0]) || killedVarsInBlock.has(parts[2])) {
        killedExprs.add(expr);
      }
    });

    aeGen[b.id] = Array.from(genExprs).sort();
    aeKill[b.id] = Array.from(killedExprs).sort();
    aeIn[b.id] = b.id === cfg.blocks[0]?.id ? [] : universeExprs;
    aeOut[b.id] = Array.from(new Set([...aeGen[b.id], ...aeIn[b.id].filter(x => !aeKill[b.id].includes(x))])).sort();
  });

  changed = true;
  passCount = 0;
  while (changed && passCount++ < 100) {
    changed = false;
    cfg.blocks.forEach(b => {
      if (b.id === cfg.blocks[0]?.id) return; // Entry block IN is always empty
      const pBlocks = preds[b.id] || [];
      let newInSet: Set<string>;
      if (pBlocks.length === 0) {
        newInSet = new Set();
      } else {
        newInSet = new Set(aeOut[pBlocks[0]] || []);
        for (let i = 1; i < pBlocks.length; i++) {
          const outP = new Set(aeOut[pBlocks[i]] || []);
          newInSet = new Set([...newInSet].filter(x => outP.has(x)));
        }
      }
      const newIn = Array.from(newInSet).sort();

      const killSet = new Set(aeKill[b.id]);
      const newOutSet = new Set(aeGen[b.id]);
      newIn.forEach(e => {
        if (!killSet.has(e)) newOutSet.add(e);
      });
      const newOut = Array.from(newOutSet).sort();

      if (JSON.stringify(newIn) !== JSON.stringify(aeIn[b.id]) || JSON.stringify(newOut) !== JSON.stringify(aeOut[b.id])) {
        aeIn[b.id] = newIn;
        aeOut[b.id] = newOut;
        changed = true;
      }
    });
  }

  // 4. Def-Use and Use-Def Chains Computation
  const defUseChainsMap = new Map<string, DefUseChain>();
  allDefs.forEach(d => {
    defUseChainsMap.set(`d#${d.instrId}:${d.varName}`, {
      defInstrId: d.instrId,
      varName: d.varName,
      blockId: d.blockId,
      uses: [],
    });
  });

  const useDefChains: UseDefChain[] = [];

  cfg.blocks.forEach(b => {
    const currentDefsInBlock = new Map<string, number>();

    b.instrs.forEach(instr => {
      // For each operand used in instr, find its reaching defs
      const operands = getOperands(instr);
      operands.forEach(op => {
        const reachingDefsForOp: { instrId: number; blockId: string }[] = [];
        if (currentDefsInBlock.has(op)) {
          reachingDefsForOp.push({ instrId: currentDefsInBlock.get(op)!, blockId: b.id });
        } else {
          // Check IN set of block b
          (rdIn[b.id] || []).forEach(dStr => {
            const match = dStr.match(/^d#(\d+):(.+)$/);
            if (match && match[2] === op) {
              const defId = parseInt(match[1], 10);
              const defInfo = allDefs.find(x => x.instrId === defId);
              if (defInfo) {
                reachingDefsForOp.push({ instrId: defId, blockId: defInfo.blockId });
              }
            }
          });
        }

        useDefChains.push({
          useInstrId: instr.id,
          varName: op,
          blockId: b.id,
          defs: reachingDefsForOp,
        });

        reachingDefsForOp.forEach(rd => {
          const key = `d#${rd.instrId}:${op}`;
          const du = defUseChainsMap.get(key);
          if (du && !du.uses.some(u => u.instrId === instr.id)) {
            du.uses.push({ instrId: instr.id, blockId: b.id });
          }
        });
      });

      const d = getDefinedVar(instr);
      if (d) {
        currentDefsInBlock.set(d, instr.id);
      }
    });
  });

  return {
    reachingDefs: { gen: rdGen, kill: rdKill, in: rdIn, out: rdOut },
    liveVariables: { use: lvUse, def: lvDef, in: lvIn, out: lvOut },
    availableExprs: { gen: aeGen, kill: aeKill, in: aeIn, out: aeOut },
    defUseChains: Array.from(defUseChainsMap.values()),
    useDefChains,
  };
}
