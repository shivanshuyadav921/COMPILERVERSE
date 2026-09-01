// pipeline.ts — Orchestrates the real compiler pipeline end to end.

import { tokenize } from "./lexer";
import { parse } from "./parser";
import { analyze } from "./semantic";
import { generateIR, irToString } from "./ir";
import { runOptimizationPipeline, ALL_PASSES } from "./optimize";
import { buildCFG } from "./cfg";
import { generateAssembly } from "./asm";
import { analyzeDataFlow } from "./dataflow";
import { computeDominators } from "./dominator";
import { convertToSSA } from "./ssa";
import { allocateRegisters } from "./regalloc";
import { buildCallGraph } from "./callgraph";
import { computeMemoryLayout } from "./memorylayout";
import { buildScopeTree } from "./scope";
import { generateSnapshotTimeline } from "./snapshot";
import { compareAllOptLevels } from "./optimizationLevels";
import { computeMetrics } from "./metrics";
import { pluginRegistry } from "./plugins";
import { generateParseTrace } from "./parsetable";

export function compile(source: string, enabledPasses?: Record<string, boolean>) {
  const startTimeMs = performance.now ? performance.now() : Date.now();

  const { tokens, errors: lexErrors } = tokenize(source);
  const { program, errors: parseErrors } = parse(tokens);
  const parseTrace = generateParseTrace(tokens);
  const semantic = analyze(program);

  const rawIR = generateIR(program);
  const enabled = enabledPasses || Object.fromEntries(ALL_PASSES.map(p => [p.key, true]));
  
  // Run standard optimization pipeline + plugin passes
  const { code: standardOptIR, logs: standardLogs } = runOptimizationPipeline(rawIR, enabled);
  const { code: optimizedIR, logs: pluginLogs } = pluginRegistry.runPluginPasses(standardOptIR);
  const logs = [...standardLogs, ...pluginLogs];

  const cfgBefore = buildCFG(rawIR);
  const cfgAfter = buildCFG(optimizedIR);

  // Phase 2 & Advanced Analyses
  const scopeTree = buildScopeTree(semantic.symbolTable);
  const dataflow = analyzeDataFlow(cfgAfter);
  const dominators = computeDominators(cfgAfter);
  const ssa = convertToSSA(cfgAfter, dominators);
  const regAlloc = allocateRegisters(optimizedIR, cfgAfter);
  const callGraph = buildCallGraph(program);
  const memoryLayout = computeMemoryLayout(semantic.symbolTable, regAlloc);
  const asm = generateAssembly(optimizedIR);

  // Time-Travel Snapshot Timeline & Opt Explorer Comparison
  const timeline = generateSnapshotTimeline(
    source, tokens, lexErrors, program, parseErrors, semantic.symbolTable,
    semantic.errors, rawIR, optimizedIR, logs, cfgBefore, cfgAfter, ssa, regAlloc, asm
  );

  const optLevels = compareAllOptLevels(rawIR);

  const result = {
    source,
    tokens,
    lexErrors,
    ast: program,
    parseErrors,
    parseTrace,
    symbolTable: semantic.symbolTable,
    scopeTree,
    semanticErrors: semantic.errors,
    ir: rawIR.map(irToString),
    irOptimized: optimizedIR.map(irToString),
    irRaw: rawIR,
    irOptimizedRaw: optimizedIR,
    optimizationLogs: logs,
    cfgBefore,
    cfgAfter,
    dataflow,
    dominators,
    ssa,
    regAlloc,
    callGraph,
    memoryLayout,
    assembly: asm,
    timeline,
    optLevels,
    hasErrors: lexErrors.length > 0 || parseErrors.length > 0 || semantic.errors.length > 0,
  };

  const metrics = computeMetrics(result, startTimeMs);
  return { ...result, metrics };
}

export type CompileResult = ReturnType<typeof compile>;



