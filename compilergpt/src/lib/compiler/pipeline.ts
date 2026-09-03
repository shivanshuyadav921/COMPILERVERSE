// pipeline.ts — Canonical Compiler Pipeline for Nova and C-subset languages.
// Lowers multi-language frontends into Common IR, analyzes, optimizes, and emits x86-64 and WebAssembly.

import { tokenize } from "./lexer";
import { parse } from "./parser";
import { tokenizeCSubset } from "./c_subset_lexer";
import { parseCSubset } from "./c_subset_parser";
import { analyze } from "./semantic";
import { generateIR, irToString } from "./ir";
import { runOptimizationPipeline, ALL_PASSES } from "./optimize";
import { buildCFG } from "./cfg";
import { generateAssembly } from "./asm";
import { generateX86Assembly } from "./x86_gen";
import { emulateX86 } from "./x86_emulator";
import { generateWasm } from "./wasm";
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

export interface CompileOptions {
  language?: "nova" | "c";
  enabledPasses?: Record<string, boolean>;
  target?: "x86" | "wasm";
}

export function compile(
  source: string,
  optionsOrPasses?: Record<string, boolean> | CompileOptions
) {
  const startTimeMs = performance.now ? performance.now() : Date.now();

  let language: "nova" | "c" = "nova";
  let enabledPasses: Record<string, boolean> | undefined = undefined;

  if (optionsOrPasses) {
    if ("language" in optionsOrPasses || "enabledPasses" in optionsOrPasses) {
      const opts = optionsOrPasses as CompileOptions;
      language = opts.language || "nova";
      enabledPasses = opts.enabledPasses;
    } else {
      enabledPasses = optionsOrPasses as Record<string, boolean>;
    }
  }

  // 1. Multi-Language Frontend
  let tokens: any[] = [];
  let lexErrors: Array<{ message: string; line: number; col: number }> = [];
  let program: any = null;
  let parseErrors: Array<{ message: string; line: number; col: number }> = [];

  if (language === "c") {
    const lexRes = tokenizeCSubset(source);
    tokens = lexRes.tokens;
    lexErrors = lexRes.errors;
    const parseRes = parseCSubset(tokens);
    program = parseRes.program;
    parseErrors = parseRes.errors;
  } else {
    const lexRes = tokenize(source);
    tokens = lexRes.tokens;
    lexErrors = lexRes.errors;
    const parseRes = parse(tokens);
    program = parseRes.program;
    parseErrors = parseRes.errors;
  }

  const parseTrace = generateParseTrace(tokens);
  const semantic = analyze(program);

  // 2. Common IR Lowering
  const rawIR = generateIR(program);
  const enabled = enabledPasses || Object.fromEntries(ALL_PASSES.map(p => [p.key, true]));

  // 3. Optimization Pipeline & Plugin Passes
  const { code: standardOptIR, logs: standardLogs } = runOptimizationPipeline(rawIR, enabled);
  const { code: optimizedIR, logs: pluginLogs } = pluginRegistry.runPluginPasses(standardOptIR);
  const logs = [...standardLogs, ...pluginLogs];

  // 4. CFG Construction
  const cfgBefore = buildCFG(rawIR);
  const cfgAfter = buildCFG(optimizedIR);

  // 5. Advanced Analyses: Dataflow, Dominators, SSA, RegAlloc, CallGraph, MemoryLayout
  const scopeTree = buildScopeTree(semantic.symbolTable);
  const dataflow = analyzeDataFlow(cfgAfter);
  const dominators = computeDominators(cfgAfter);
  const ssa = convertToSSA(cfgAfter, dominators);
  const regAlloc = allocateRegisters(optimizedIR, cfgAfter);
  const callGraph = buildCallGraph(program);
  const memoryLayout = computeMemoryLayout(semantic.symbolTable, regAlloc);

  // 6. Target Code Generation
  const asm = generateAssembly(optimizedIR);
  const x86 = generateX86Assembly(optimizedIR, regAlloc);
  const x86Execution = emulateX86(x86.textFormat);
  const wasm = generateWasm(optimizedIR);

  // 7. Time-Travel Timeline & -O0..-O3 Explorer
  const timeline = generateSnapshotTimeline(
    source, tokens, lexErrors, program, parseErrors, semantic.symbolTable,
    semantic.errors, rawIR, optimizedIR, logs, cfgBefore, cfgAfter, ssa, regAlloc, asm
  );
  const optLevels = compareAllOptLevels(rawIR);

  const result = {
    source,
    language,
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
    x86,
    x86Execution,
    wasm,
    timeline,
    optLevels,
    hasErrors: lexErrors.length > 0 || parseErrors.length > 0 || semantic.errors.length > 0,
  };

  const metrics = computeMetrics(result, startTimeMs);
  return { ...result, metrics };
}

export type CompileResult = ReturnType<typeof compile>;
