// scope.ts — Lexical Scope Tree Builder for Nova Compiler.

import { SymbolEntry } from "./semantic";

export interface ScopeNode {
  id: number;
  name: string;
  parentId: number | null;
  symbols: SymbolEntry[];
  children: ScopeNode[];
}

export function buildScopeTree(symbols: SymbolEntry[]): ScopeNode {
  const scopeMap = new Map<number, ScopeNode>();

  // 1. Collect unique scopes from symbol table entries
  symbols.forEach(s => {
    if (!scopeMap.has(s.scopeId)) {
      scopeMap.set(s.scopeId, {
        id: s.scopeId,
        name: s.scopeName,
        parentId: null,
        symbols: [],
        children: [],
      });
    }
    scopeMap.get(s.scopeId)!.symbols.push(s);
  });

  // Ensure global scope (ID 0) exists
  if (!scopeMap.has(0)) {
    scopeMap.set(0, {
      id: 0,
      name: "global",
      parentId: null,
      symbols: [],
      children: [],
    });
  }

  // Determine parent relationships from scope names
  const allScopes = Array.from(scopeMap.values()).sort((a, b) => a.id - b.id);
  allScopes.forEach(sc => {
    if (sc.id === 0) return;
    // Find parent scope by searching backwards for nearest scope with lower ID
    const parent = allScopes.slice(0, sc.id).reverse().find(p => p.id < sc.id) || scopeMap.get(0)!;
    sc.parentId = parent.id;
  });

  // Build tree hierarchy
  const root = scopeMap.get(0)!;
  allScopes.forEach(sc => {
    if (sc.id !== 0 && sc.parentId !== null) {
      const parent = scopeMap.get(sc.parentId);
      if (parent && !parent.children.some(c => c.id === sc.id)) {
        parent.children.push(sc);
      }
    }
  });

  return root;
}
