"use client";
import { useState } from "react";

function ScopeItem({ node, depth }: { node: any; depth: number }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-1" style={{ marginLeft: depth * 16 }}>
      <div
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-panel2 border border-border/40 text-xs mono"
      >
        <span className="text-gray-500">{node.children.length > 0 ? (open ? "▾" : "▸") : "•"}</span>
        <span className="font-bold text-accent">Scope #{node.id}</span>
        <span className="text-gray-300">({node.name})</span>
        <span className="ml-auto text-gray-500 text-[11px]">{node.symbols.length} symbols</span>
      </div>

      {open && (
        <div className="space-y-1 pl-4 border-l border-border/50">
          {node.symbols.length > 0 && (
            <div className="bg-panel2/50 p-2 rounded text-xs mono space-y-1">
              {node.symbols.map((sym: any) => (
                <div key={sym.name} className="flex justify-between items-center text-[11px]">
                  <span className="text-gray-200 font-bold">{sym.isFunction ? "ƒ " : ""}{sym.name}</span>
                  <span className="text-accent2">{sym.type}</span>
                  <span className="text-gray-500">decl L{sym.declLine}</span>
                  <span className="text-gray-500">offset {sym.offset}</span>
                  <span className="text-warn">{sym.usageCount} uses</span>
                </div>
              ))}
            </div>
          )}

          {node.children.map((c: any) => (
            <ScopeItem key={c.id} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScopeTreeView({ scopeTree }: { scopeTree: any }) {
  if (!scopeTree) return <div className="text-gray-500 text-sm p-4">No scope tree available.</div>;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="text-xs text-gray-400">
        Lexical Scope Hierarchy Tree showing nested scopes (Global → Function → Block → Loop) and identifier declarations.
      </div>

      <div className="card p-4 space-y-2">
        <ScopeItem node={scopeTree} depth={0} />
      </div>
    </div>
  );
}
