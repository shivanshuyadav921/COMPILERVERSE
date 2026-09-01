// callgraph.ts — Call Graph Generator for Nova Compiler.

import { Program, FnDecl, Call } from "./ast";

export interface CallGraphNode {
  id: string;
  name: string;
  params: string[];
  isRecursive: boolean;
  callerCount: number;
  calleeCount: number;
}

export interface CallGraphEdge {
  from: string;
  to: string;
  line: number;
  callCount: number;
}

export interface CallGraphResult {
  nodes: CallGraphNode[];
  edges: CallGraphEdge[];
}

export function buildCallGraph(program: Program): CallGraphResult {
  const functions = new Map<string, FnDecl>();
  const calls: { caller: string; callee: string; line: number }[] = [];

  // 1. Register main scope as implicit entry
  functions.set("main", {
    id: "main",
    kind: "FnDecl",
    name: "main",
    params: [],
    pos: { line: 1, col: 1 },
    body: { id: "main_body", kind: "Block", pos: { line: 1, col: 1 }, body: [] },
  });

  // Collect functions
  program.body.forEach(stmt => {
    if (stmt.kind === "FnDecl") {
      functions.set(stmt.name, stmt);
    }
  });

  // Traverse AST to find function calls inside each caller
  function findCalls(node: any, currentCaller: string) {
    if (!node) return;
    if (node.kind === "Call") {
      calls.push({ caller: currentCaller, callee: node.callee, line: node.pos?.line || 1 });
    }

    // Traverse children
    for (const key of Object.keys(node)) {
      const val = node[key];
      if (Array.isArray(val)) {
        val.forEach(item => {
          if (item && typeof item === "object" && item.kind) findCalls(item, currentCaller);
        });
      } else if (val && typeof val === "object" && val.kind) {
        findCalls(val, currentCaller);
      }
    }
  }

  // Walk program body
  program.body.forEach(stmt => {
    if (stmt.kind === "FnDecl") {
      findCalls(stmt.body, stmt.name);
    } else {
      findCalls(stmt, "main");
    }
  });

  const callerCounts: Record<string, number> = {};
  const calleeCounts: Record<string, number> = {};
  const isRecursiveMap: Record<string, boolean> = {};

  functions.forEach((_, fnName) => {
    callerCounts[fnName] = 0;
    calleeCounts[fnName] = 0;
    isRecursiveMap[fnName] = false;
  });

  const edgeMap = new Map<string, CallGraphEdge>();

  calls.forEach(c => {
    if (!functions.has(c.callee) && !["print", "len"].includes(c.callee)) return;

    if (!functions.has(c.callee)) {
      functions.set(c.callee, {
        id: c.callee,
        kind: "FnDecl",
        name: c.callee,
        params: [],
        pos: { line: c.line, col: 1 },
        body: { id: `${c.callee}_body`, kind: "Block", pos: { line: c.line, col: 1 }, body: [] },
      });
      callerCounts[c.callee] = 0;
      calleeCounts[c.callee] = 0;
      isRecursiveMap[c.callee] = false;
    }

    if (c.caller === c.callee) {
      isRecursiveMap[c.caller] = true;
    }

    callerCounts[c.callee] = (callerCounts[c.callee] || 0) + 1;
    calleeCounts[c.caller] = (calleeCounts[c.caller] || 0) + 1;

    const key = `${c.caller}->${c.callee}`;
    if (edgeMap.has(key)) {
      edgeMap.get(key)!.callCount++;
    } else {
      edgeMap.set(key, { from: c.caller, to: c.callee, line: c.line, callCount: 1 });
    }
  });

  const nodes: CallGraphNode[] = Array.from(functions.values()).map(fn => ({
    id: fn.name,
    name: fn.name,
    params: fn.params || [],
    isRecursive: isRecursiveMap[fn.name] || false,
    callerCount: callerCounts[fn.name] || 0,
    calleeCount: calleeCounts[fn.name] || 0,
  }));

  return {
    nodes,
    edges: Array.from(edgeMap.values()),
  };
}
