"use client";
import { useState } from "react";
import InteractiveGraphCanvas, { GraphNode, GraphEdge } from "./InteractiveGraphCanvas";

export default function GraphEngineView({ result }: { result: any }) {
  const [graphType, setGraphType] = useState<"ast" | "cfg" | "callgraph" | "dominators" | "interference">("cfg");

  if (!result) return <div className="text-gray-500 text-sm p-4">No graph engine data available.</div>;

  let nodes: GraphNode[] = [];
  let edges: GraphEdge[] = [];
  let title = "Graph Engine";

  if (graphType === "ast") {
    title = "Abstract Syntax Tree (AST) Graph";
    nodes = (result.ast?.body || []).map((stmt: any, idx: number) => ({
      id: stmt.id || `ast_stmt_${idx}`,
      label: stmt.type,
      sublabel: `Line ${stmt.line || 1}`,
      color: "#7c5cff",
    }));
    edges = (result.ast?.body || []).slice(0, -1).map((stmt: any, idx: number) => ({
      from: stmt.id || `ast_stmt_${idx}`,
      to: result.ast?.body[idx + 1]?.id || `ast_stmt_${idx + 1}`,
      label: "next_stmt",
      color: "#7c5cff",
    }));
  } else if (graphType === "cfg") {
    title = "Control Flow Graph (CFG)";
    nodes = (result.cfgAfter?.blocks || []).map((b: any) => ({
      id: b.id,
      label: `${b.label} (${b.id})`,
      sublabel: `${b.instrs.length} instrs`,
      color: "#38e1c6",
    }));
    edges = (result.cfgAfter?.edges || []).map((e: any) => ({
      from: e.from,
      to: e.to,
      label: e.kind,
      color: e.kind === "branch" ? "#ffb454" : e.kind === "jump" ? "#ff5c7c" : "#38e1c6",
    }));
  } else if (graphType === "callgraph") {
    title = "Interprocedural Call Graph";
    nodes = (result.callGraph?.nodes || []).map((n: any) => ({
      id: n.id,
      label: `ƒ ${n.name}`,
      sublabel: `${n.callerCount} callers · ${n.calleeCount} callees`,
      color: n.isRecursive ? "#ff5c7c" : "#7c5cff",
    }));
    edges = (result.callGraph?.edges || []).map((e: any) => ({
      from: e.from,
      to: e.to,
      label: `${e.callCount}x call`,
      color: "#ffb454",
    }));
  } else if (graphType === "dominators") {
    title = "Dominator Tree Graph";
    nodes = (result.cfgAfter?.blocks || []).map((b: any) => ({
      id: b.id,
      label: `Block ${b.id}`,
      sublabel: `idom: ${result.dominators?.idom[b.id] || "ENTRY"}`,
      color: "#7c5cff",
    }));
    edges = Object.entries(result.dominators?.idom || {})
      .filter(([_, parent]) => parent !== null)
      .map(([bId, parent]: [string, any]) => ({
        from: parent,
        to: bId,
        label: "dominates",
        color: "#38e1c6",
      }));
  } else if (graphType === "interference") {
    title = "Register Interference Graph";
    nodes = (result.regAlloc?.nodes || []).map((n: any) => ({
      id: n.id,
      label: n.id,
      sublabel: n.isSpilled ? `SPILL (${n.color})` : `Reg: ${n.color}`,
      color: n.isSpilled ? "#ff5c7c" : "#38e1c6",
    }));
    edges = (result.regAlloc?.edges || []).map((e: any) => ({
      from: e.from,
      to: e.to,
      label: "interferes",
      color: "#ff5c7c",
    }));
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 p-2 border-b border-border bg-panel text-xs">
        <button onClick={() => setGraphType("ast")} className={`tab-btn ${graphType === "ast" ? "tab-btn-active" : "tab-btn-inactive"}`}>AST Graph</button>
        <button onClick={() => setGraphType("cfg")} className={`tab-btn ${graphType === "cfg" ? "tab-btn-active" : "tab-btn-inactive"}`}>CFG Graph</button>
        <button onClick={() => setGraphType("callgraph")} className={`tab-btn ${graphType === "callgraph" ? "tab-btn-active" : "tab-btn-inactive"}`}>Call Graph</button>
        <button onClick={() => setGraphType("dominators")} className={`tab-btn ${graphType === "dominators" ? "tab-btn-active" : "tab-btn-inactive"}`}>Dominator Tree</button>
        <button onClick={() => setGraphType("interference")} className={`tab-btn ${graphType === "interference" ? "tab-btn-active" : "tab-btn-inactive"}`}>Interference Graph</button>
      </div>

      <div className="flex-1 overflow-hidden">
        <InteractiveGraphCanvas title={title} nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}

