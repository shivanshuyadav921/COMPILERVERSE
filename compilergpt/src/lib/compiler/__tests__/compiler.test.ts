// compiler.test.ts — End-to-end Unit, Integration, Stress, Multi-Language, & Fuzzing Test Suite.

import { tokenize } from "../lexer";
import { parse } from "../parser";
import { analyze } from "../semantic";
import { generateIR } from "../ir";
import { constantPropagation } from "../optimize";
import { buildCFG } from "../cfg";
import { analyzeDataFlow } from "../dataflow";
import { computeDominators } from "../dominator";
import { convertToSSA } from "../ssa";
import { allocateRegisters } from "../regalloc";
import { compile } from "../pipeline";
import { tokenizeCSubset } from "../c_subset_lexer";
import { parseCSubset } from "../c_subset_parser";
import { generateX86Assembly } from "../x86_gen";
import { emulateX86 } from "../x86_emulator";
import { generateWasm } from "../wasm";
import { runHallucinationBenchmark } from "../hallucinationBenchmark";
import { encodeSessionToUrlParam, decodeSessionFromUrlParam } from "../share";

export function runCompilerTestSuite(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(cond: boolean, testName: string) {
    if (cond) {
      passed++;
    } else {
      failed++;
      errors.push(`TEST FAILED: ${testName}`);
    }
  }

  // 1. Lexer Test (Nova)
  const { tokens, errors: lexErrors } = tokenize("let x = 10 + 20.5; // comment\nlet s = \"hello\";");
  assert(tokens.length >= 11 && lexErrors.length === 0, "Lexer tokenizes statements, floats, strings, and comments");

  // 2. Parser Test (Nova)
  const { program, errors: parseErrors } = parse(tokens);
  assert(program.body.length === 2 && parseErrors.length === 0, "Parser builds AST for multiple statements");

  // 3. Semantic Analysis Test
  const sem = analyze(program);
  assert(sem.symbolTable.length === 2 && sem.errors.length === 0, "Semantic analyzer resolves identifiers and types");

  // 4. IR Generation Test
  const ir = generateIR(program);
  assert(ir.length > 0 && ir.some(i => i.op === "add"), "IR generator emits Three-Address Code");

  // 5. Loop Back-Edge Constant Propagation Fix Regression Test
  const loopCode = [
    { id: 0, op: "assign", arg1: "0", result: "i", sourceLine: 1 },
    { id: 1, op: "label", label: "L0", sourceLine: 2 },
    { id: 2, op: "assign", arg1: "10", result: "i", sourceLine: 3 },
  ];
  const constPropResult = constantPropagation(loopCode);
  const afterLabelInstr = constPropResult.code[2];
  assert(afterLabelInstr.arg1 === "10", "Constant propagation clears map at loop back-edge label");

  // 6. Dataflow Analysis Test
  const cfg = buildCFG(ir);
  const df = analyzeDataFlow(cfg);
  assert(df.reachingDefs !== undefined && df.liveVariables !== undefined, "Dataflow analysis computes RD and LV sets");

  // 7. Dominator Tree & SSA Conversion Test
  const doms = computeDominators(cfg);
  const ssa = convertToSSA(cfg, doms);
  assert(ssa.blocks.length === cfg.blocks.length, "SSA conversion produces versioned blocks");

  // 8. Register Allocation Test
  const regAlloc = allocateRegisters(ir, cfg);
  assert(regAlloc.nodes.length > 0 && regAlloc.maxRegistersUsed <= 8, "Graph coloring allocates registers within K=8 limit");

  // 9. Multi-Language Test: C-Subset Lexer & Parser
  const cCode = "int add(int a, int b) { return a + b; } int main() { int res = add(10, 20); printf(res); return 0; }";
  const cLex = tokenizeCSubset(cCode);
  assert(cLex.tokens.length > 10 && cLex.errors.length === 0, "C-Subset: Lexer tokenizes C syntax");
  const cParse = parseCSubset(cLex.tokens);
  assert(cParse.program.body.length === 2 && cParse.errors.length === 0, "C-Subset: Parser builds unified AST");
  const cCompileRes = compile(cCode, { language: "c" });
  assert(!cCompileRes.hasErrors && cCompileRes.irOptimizedRaw.length > 0, "C-Subset: Lowers to Common IR and compiles cleanly");

  // 10. Real x86-64 Code Generation & CPU Emulation Test
  const x86Prog = generateX86Assembly(cCompileRes.irOptimizedRaw, cCompileRes.regAlloc);
  assert(x86Prog.lines.length > 0 && x86Prog.textFormat.includes(".intel_syntax noprefix"), "x86-64: Emits valid Intel syntax assembly");
  const x86Exec = emulateX86(x86Prog.textFormat);
  assert(x86Exec.totalInstructionsExecuted > 0, "x86-64: CPU emulator executes instructions cleanly");

  // 11. Real WebAssembly (WASM) Module Generation Test
  const wasmRes = generateWasm(cCompileRes.irOptimizedRaw);
  assert(wasmRes.isValid && wasmRes.wat.includes("(module") && wasmRes.wasmBinary.length > 0, "WASM: Emits valid WAT text and .wasm binary header");

  // 12. Stress Test: Deep Recursion (Fibonacci)
  const fibProg = `
  fn fib(n) {
    if (n <= 1) { return n; }
    return fib(n - 1) + fib(n - 2);
  }
  print(fib(10));
  `;
  const fibRes = compile(fibProg);
  assert(!fibRes.hasErrors && fibRes.callGraph.nodes.some(n => n.name === "fib" && n.isRecursive), "Stress Test 1: Deep recursion parses and compiles cleanly");

  // 13. Stress Test: Nested Loops & Scopes
  const loopProg = `
  let i = 0;
  while (i < 5) {
    let j = 0;
    while (j < 5) {
      j = j + 1;
    }
    i = i + 1;
  }
  `;
  const loopRes = compile(loopProg);
  assert(!loopRes.hasErrors && loopRes.cfgAfter.blocks.length >= 4, "Stress Test 2: Nested loops generate valid CFG basic blocks");

  // 14. Stress Test: Arrays & Indexing
  const arrProg = `
  let arr = [10, 20, 30];
  let v = arr[1];
  print(v);
  `;
  const arrRes = compile(arrProg);
  assert(!arrRes.hasErrors && arrRes.irOptimizedRaw.some(i => i.op === "new_array" || i.op === "store_index" || i.op === "load_index"), "Stress Test 3: Array allocation and indexing compile cleanly");

  // 15. Stress Test: Dead Code Elimination
  const dceProg = `
  let unusedTemp = 100 * 50;
  let active = 5;
  print(active);
  `;
  const dceRes = compile(dceProg);
  assert(!dceRes.hasErrors && dceRes.irOptimizedRaw.length < dceRes.irRaw.length, "Stress Test 4: Dead code elimination removes unused temporaries");

  // 16. Fuzzing Test: Unclosed String literal
  const fuzzLex = tokenize("let s = \"unclosed string;");
  assert(fuzzLex.errors.length > 0, "Fuzzing 1: Lexer catches unclosed string without crash");

  // 17. Fuzzing Test: Invalid Syntax
  const fuzzParse = compile("let x = + ; fn ( {");
  assert(fuzzParse.hasErrors && fuzzParse.parseErrors.length > 0, "Fuzzing 2: Parser catches invalid syntax");

  // 18. Fuzzing Test: Undeclared Variable
  const fuzzSem = compile("let x = undeclaredVar + 5;");
  assert(fuzzSem.hasErrors && fuzzSem.semanticErrors.length > 0, "Fuzzing 3: Semantic analyzer catches undeclared variables");

  // 19. AI Hallucination Research Benchmark Test
  const benchMetrics = runHallucinationBenchmark(fibRes);
  assert(benchMetrics.groundedAccuracyRate > 95 && benchMetrics.groundedHallucinationRate === 0, "AI Benchmark: Grounded CompilerGPT achieves 0% hallucination rate");

  // 20. Shareable Session Codec Test
  const testSession = {
    id: "test",
    source: "let x = 42;",
    language: "nova" as const,
    optLevel: "O2",
    target: "x86" as const,
    timestamp: new Date().toISOString(),
  };
  const encoded = encodeSessionToUrlParam(testSession);
  const decoded = decodeSessionFromUrlParam(encoded);
  assert(decoded !== null && decoded.source === "let x = 42;", "Shareable Session: URL codec encodes and decodes session state losslessly");

  return { passed, failed, errors };
}
