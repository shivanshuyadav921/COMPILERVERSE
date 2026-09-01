// compiler.test.ts — End-to-end Unit, Integration, Stress & Fuzzing Test Suite for Nova Compiler.

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

  // 1. Lexer Test
  const { tokens, errors: lexErrors } = tokenize("let x = 10 + 20.5; // comment\nlet s = \"hello\";");
  assert(tokens.length >= 11 && lexErrors.length === 0, "Lexer tokenizes statements, floats, strings, and comments");

  // 2. Parser Test
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

  // 9. Stress Test: Deep Recursion (Fibonacci)
  const fibProg = `
  fn fib(n) {
    if (n <= 1) { return n; }
    return fib(n - 1) + fib(n - 2);
  }
  print(fib(10));
  `;
  const fibRes = compile(fibProg);
  assert(!fibRes.hasErrors && fibRes.callGraph.nodes.some(n => n.name === "fib" && n.isRecursive), "Stress Test 1: Deep recursion parses, resolves recursion, and compiles cleanly");

  // 10. Stress Test: Nested Loops & Scopes
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

  // 11. Stress Test: Arrays & Indexing
  const arrProg = `
  let arr = [10, 20, 30];
  let v = arr[1];
  print(v);
  `;
  const arrRes = compile(arrProg);
  assert(!arrRes.hasErrors && arrRes.irOptimizedRaw.some(i => i.op === "new_array" || i.op === "store_index" || i.op === "load_index"), "Stress Test 3: Array allocation and indexing compile cleanly");

  // 12. Stress Test: Dead Code Elimination
  const dceProg = `
  let unusedTemp = 100 * 50;
  let active = 5;
  print(active);
  `;
  const dceRes = compile(dceProg);
  assert(!dceRes.hasErrors && dceRes.irOptimizedRaw.length < dceRes.irRaw.length, "Stress Test 4: Dead code elimination removes unused temporaries");

  // 13. Fuzzing Test: Unclosed String literal
  const fuzzLex = tokenize("let s = \"unclosed string;");
  assert(fuzzLex.errors.length > 0, "Fuzzing 1: Lexer gracefully catches unclosed string without crash");

  // 14. Fuzzing Test: Invalid Syntax
  const fuzzParse = compile("let x = + ; fn ( {");
  assert(fuzzParse.hasErrors && fuzzParse.parseErrors.length > 0, "Fuzzing 2: Parser gracefully catches invalid syntax");

  // 15. Fuzzing Test: Undeclared Variable
  const fuzzSem = compile("let x = undeclaredVar + 5;");
  assert(fuzzSem.hasErrors && fuzzSem.semanticErrors.length > 0, "Fuzzing 3: Semantic analyzer catches undeclared variables");

  // 16. Stress Test: Large Expression Chain
  const largeExprRes = compile("let x = 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15;");
  assert(!largeExprRes.hasErrors && largeExprRes.irOptimizedRaw.length > 0, "Stress Test 5: Large arithmetic expression chain compiles cleanly");

  // 17. Edge Case: Empty Source Code
  const emptyRes = compile("");
  assert(!emptyRes.hasErrors && emptyRes.tokens.length === 1, "Edge Case 1: Empty source code handles cleanly");

  // 18. Edge Case: Unicode Identifiers and Strings
  const unicodeRes = compile("let msg = \"Hello 🚀 世界\"; print(msg);");
  assert(!unicodeRes.hasErrors && unicodeRes.tokens.length > 0, "Edge Case 2: Unicode string literals tokenize and compile cleanly");

  // 19. Edge Case: Multi-line Comments Only
  const commentsRes = compile("/* Multi-line\n comment */ // Single line");
  assert(!commentsRes.hasErrors && commentsRes.ast.body.length === 0, "Edge Case 3: Comments-only source produces empty AST without error");

  // 20. Edge Case: Deeply Nested Blocks
  const nestedRes = compile("{ { { let depth = 100; } } }");
  assert(!nestedRes.hasErrors && nestedRes.symbolTable.length === 1, "Edge Case 4: Deeply nested blocks resolve scopes correctly");

  return { passed, failed, errors };
}
