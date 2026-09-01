"use client";
import { useState } from "react";

function summarize(node: any): string {
  if (!node) return "";
  switch (node.kind) {
    case "Program": return `Program (${node.body.length} stmts)`;
    case "LetStmt": return `let ${node.name}`;
    case "FnDecl": return `fn ${node.name}(${node.params.join(", ")})`;
    case "ReturnStmt": return "return";
    case "IfStmt": return "if";
    case "WhileStmt": return "while";
    case "ForStmt": return "for";
    case "ExprStmt": return "expr";
    case "Block": return `block (${node.body.length})`;
    case "NumberLit": return `${node.value} : int`;
    case "FloatLit": return `${node.value} : float`;
    case "StringLit": return `"${node.value}" : string`;
    case "BoolLit": return `${node.value} : bool`;
    case "ArrayLit": return `array[${node.elements.length}]`;
    case "Ident": return `${node.name}`;
    case "Assign": return `${node.name} =`;
    case "Binary": return `${node.op}`;
    case "Unary": return `${node.op}`;
    case "Call": return `call ${node.callee}()`;
    case "Index": return `index[]`;
    default: return node.kind;
  }
}

function children(node: any): { label: string; node: any }[] {
  if (!node) return [];
  switch (node.kind) {
    case "Program": return node.body.map((s: any, i: number) => ({ label: `[${i}]`, node: s }));
    case "LetStmt": return node.init ? [{ label: "init", node: node.init }] : [];
    case "FnDecl": return [{ label: "body", node: node.body }];
    case "ReturnStmt": return node.value ? [{ label: "value", node: node.value }] : [];
    case "IfStmt": {
      const c = [{ label: "cond", node: node.cond }, { label: "then", node: node.then }];
      if (node.elseBranch) c.push({ label: "else", node: node.elseBranch });
      return c;
    }
    case "WhileStmt": return [{ label: "cond", node: node.cond }, { label: "body", node: node.body }];
    case "ForStmt": {
      const c = [];
      if (node.init) c.push({ label: "init", node: node.init });
      if (node.cond) c.push({ label: "cond", node: node.cond });
      if (node.update) c.push({ label: "update", node: node.update });
      c.push({ label: "body", node: node.body });
      return c;
    }
    case "ExprStmt": return [{ label: "expr", node: node.expr }];
    case "Block": return node.body.map((s: any, i: number) => ({ label: `[${i}]`, node: s }));
    case "ArrayLit": return node.elements.map((e: any, i: number) => ({ label: `[${i}]`, node: e }));
    case "Assign": return [{ label: "value", node: node.value }];
    case "Binary": return [{ label: "left", node: node.left }, { label: "right", node: node.right }];
    case "Unary": return [{ label: "operand", node: node.operand }];
    case "Call": return node.args.map((a: any, i: number) => ({ label: `arg[${i}]`, node: a }));
    case "Index": return [{ label: "array", node: node.array }, { label: "index", node: node.index }];
    default: return [];
  }
}

function TreeNode({ node, label, depth, onSelect, selectedId }: { node: any; label: string; depth: number; onSelect: (n: any) => void; selectedId: string | null }) {
  const [open, setOpen] = useState(depth < 3);
  const kids = children(node);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer hover:bg-panel2 ${isSelected ? "bg-accent/20 border border-accent/40" : ""}`}
        style={{ marginLeft: depth * 14 }}
        onClick={() => { onSelect(node); if (kids.length) setOpen(!open); }}
      >
        {kids.length > 0 && (
          <span className="text-gray-500 text-[10px] w-3">{open ? "▾" : "▸"}</span>
        )}
        {kids.length === 0 && <span className="w-3" />}
        <span className="text-gray-500 text-[11px]">{label}</span>
        <span className="text-accent2 text-xs font-medium">{node.kind}</span>
        <span className="text-gray-400 text-xs">{summarize(node)}</span>
        <span className="text-gray-600 text-[10px] ml-auto pr-2">L{node.pos?.line}</span>
      </div>
      {open && kids.map((c, i) => (
        <TreeNode key={c.node.id + i} node={c.node} label={c.label} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
      ))}
    </div>
  );
}

export default function ASTView({ ast, onSelect, selectedId }: { ast: any; onSelect: (n: any) => void; selectedId: string | null }) {
  if (!ast) return <div className="text-gray-500 text-sm p-4">No AST yet — compile some code.</div>;
  return (
    <div className="mono text-xs overflow-auto h-full p-2">
      <TreeNode node={ast} label="root" depth={0} onSelect={onSelect} selectedId={selectedId} />
    </div>
  );
}
