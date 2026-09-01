// workspace.ts — Multi-file Workspace and Cross-file Compiler for Nova.

import { Program, Stmt } from "./ast";
import { compile } from "./pipeline";
import { buildCallGraph, CallGraphResult } from "./callgraph";

export interface VirtualFile {
  name: string;
  content: string;
}

export interface WorkspaceResult {
  files: VirtualFile[];
  combinedSource: string;
  combinedAST: Program;
  callGraph: CallGraphResult;
  compileResult: ReturnType<typeof compile>;
}

export const DEFAULT_WORKSPACE_FILES: VirtualFile[] = [
  {
    name: "Main.nova",
    content: `// Main.nova — Entry point
let x = 10;
let y = 20;
let res = addNumbers(x, y);
print("Sum of x and y is", res);
let fact = computeFactorial(5);
print("Factorial is", fact);
`,
  },
  {
    name: "Math.nova",
    content: `// Math.nova — Math library
fn addNumbers(a, b) {
  return a + b;
}

fn computeFactorial(n) {
  if (n <= 1) {
    return 1;
  } else {
    return n * computeFactorial(n - 1);
  }
}
`,
  },
  {
    name: "Utils.nova",
    content: `// Utils.nova — Utility functions
fn clampValue(val, minVal, maxVal) {
  if (val < minVal) { return minVal; }
  if (val > maxVal) { return maxVal; }
  return val;
}
`,
  },
];

export function compileWorkspace(files: VirtualFile[], enabledPasses?: Record<string, boolean>): WorkspaceResult {
  // Combine all files with section markers
  const combinedSource = files.map(f => `// --- File: ${f.name} ---\n${f.content}`).join("\n\n");

  const compileResult = compile(combinedSource, enabledPasses);
  const callGraph = buildCallGraph(compileResult.ast);

  return {
    files,
    combinedSource,
    combinedAST: compileResult.ast,
    callGraph,
    compileResult,
  };
}
