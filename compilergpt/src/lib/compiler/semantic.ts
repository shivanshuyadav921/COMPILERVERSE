// semantic.ts — Real semantic analysis: scope resolution, symbol table, type checking.

import * as A from "./ast";

export interface SymbolEntry {
  name: string;
  type: A.Type;
  scopeId: number;
  scopeName: string;
  declLine: number;
  offset: number;
  usageCount: number;
  isFunction: boolean;
  params?: string[];
}

export interface SemanticError {
  message: string;
  line: number;
  col: number;
  kind: "undeclared" | "duplicate" | "type-mismatch" | "invalid-call" | "scope";
}

interface Scope {
  id: number;
  name: string;
  parent: Scope | null;
  vars: Map<string, SymbolEntry>;
}

export interface SemanticResult {
  symbolTable: SymbolEntry[];
  errors: SemanticError[];
  nodeTypes: Record<string, A.Type>; // AST node id -> inferred type
}

let scopeCounter = 0;
let offsetCounter = 0;

export function analyze(program: A.Program): SemanticResult {
  scopeCounter = 0;
  offsetCounter = 0;
  const errors: SemanticError[] = [];
  const allSymbols: SymbolEntry[] = [];
  const nodeTypes: Record<string, A.Type> = {};
  const functions = new Map<string, { params: string[] }>();

  const globalScope: Scope = { id: scopeCounter++, name: "global", parent: null, vars: new Map() };

  function declare(scope: Scope, name: string, type: A.Type, line: number, col: number, isFunction = false, params?: string[]) {
    if (scope.vars.has(name)) {
      errors.push({ message: `Duplicate declaration of '${name}' in scope '${scope.name}'`, line, col, kind: "duplicate" });
      return scope.vars.get(name)!;
    }
    const entry: SymbolEntry = {
      name, type, scopeId: scope.id, scopeName: scope.name, declLine: line,
      offset: offsetCounter++, usageCount: 0, isFunction, params,
    };
    scope.vars.set(name, entry);
    allSymbols.push(entry);
    return entry;
  }

  function resolve(scope: Scope, name: string): SymbolEntry | null {
    let s: Scope | null = scope;
    while (s) {
      const e = s.vars.get(name);
      if (e) return e;
      s = s.parent;
    }
    return null;
  }

  function inferBinaryType(op: string, lt: A.Type, rt: A.Type): A.Type {
    if (["==", "!=", "<", ">", "<=", ">=", "&&", "||"].includes(op)) return "bool";
    if (lt === "float" || rt === "float") return "float";
    if (lt === "string" && op === "+") return "string";
    return "int";
  }

  function checkExpr(e: A.Expr, scope: Scope): A.Type {
    let t: A.Type = "unknown";
    switch (e.kind) {
      case "NumberLit": t = "int"; break;
      case "FloatLit": t = "float"; break;
      case "StringLit": t = "string"; break;
      case "BoolLit": t = "bool"; break;
      case "ArrayLit": e.elements.forEach(el => checkExpr(el, scope)); t = "array"; break;
      case "Ident": {
        const sym = resolve(scope, e.name);
        if (!sym) {
          errors.push({ message: `Undeclared variable '${e.name}'`, line: e.pos.line, col: e.pos.col, kind: "undeclared" });
          t = "unknown";
        } else {
          sym.usageCount++;
          t = sym.type;
        }
        break;
      }
      case "Assign": {
        const sym = resolve(scope, e.name);
        const vt = checkExpr(e.value, scope);
        if (!sym) {
          errors.push({ message: `Assignment to undeclared variable '${e.name}'`, line: e.pos.line, col: e.pos.col, kind: "undeclared" });
        } else {
          sym.usageCount++;
          if (sym.type === "unknown") sym.type = vt;
          else if (sym.type !== vt && vt !== "unknown") {
            errors.push({ message: `Type mismatch: cannot assign '${vt}' to '${e.name}' of type '${sym.type}'`, line: e.pos.line, col: e.pos.col, kind: "type-mismatch" });
          }
        }
        t = vt;
        break;
      }
      case "Binary": {
        const lt = checkExpr(e.left, scope);
        const rt = checkExpr(e.right, scope);
        if (["+", "-", "*", "/", "%"].includes(e.op)) {
          if (lt !== "unknown" && rt !== "unknown" && lt !== rt && !(lt === "float" && rt === "int") && !(lt === "int" && rt === "float") && !(e.op === "+" && lt === "string")) {
            errors.push({ message: `Type mismatch in '${e.op}': '${lt}' vs '${rt}'`, line: e.pos.line, col: e.pos.col, kind: "type-mismatch" });
          }
        }
        t = inferBinaryType(e.op, lt, rt);
        break;
      }
      case "Unary": {
        const ot = checkExpr(e.operand, scope);
        t = e.op === "!" ? "bool" : ot;
        break;
      }
      case "Call": {
        const fn = functions.get(e.callee);
        e.args.forEach(a => checkExpr(a, scope));
        if (!fn && !["print", "len"].includes(e.callee)) {
          errors.push({ message: `Call to undeclared function '${e.callee}'`, line: e.pos.line, col: e.pos.col, kind: "invalid-call" });
        } else if (fn && fn.params.length !== e.args.length) {
          errors.push({ message: `Function '${e.callee}' expects ${fn.params.length} arguments, got ${e.args.length}`, line: e.pos.line, col: e.pos.col, kind: "invalid-call" });
        }
        t = "unknown";
        break;
      }
      case "Index": {
        checkExpr(e.array, scope);
        checkExpr(e.index, scope);
        t = "unknown";
        break;
      }
    }
    nodeTypes[e.id] = t;
    return t;
  }

  function checkStmt(s: A.Stmt, scope: Scope) {
    switch (s.kind) {
      case "LetStmt": {
        const t = s.init ? checkExpr(s.init, scope) : "unknown";
        declare(scope, s.name, t, s.pos.line, s.pos.col);
        break;
      }
      case "FnDecl": {
        functions.set(s.name, { params: s.params });
        declare(globalScope === scope ? scope : scope, s.name, "unknown", s.pos.line, s.pos.col, true, s.params);
        const fnScope: Scope = { id: scopeCounter++, name: `fn:${s.name}`, parent: scope, vars: new Map() };
        s.params.forEach(p => declare(fnScope, p, "unknown", s.pos.line, s.pos.col));
        s.body.body.forEach(st => checkStmt(st, fnScope));
        break;
      }
      case "ReturnStmt": if (s.value) checkExpr(s.value, scope); break;
      case "IfStmt": {
        checkExpr(s.cond, scope);
        const thenScope: Scope = { id: scopeCounter++, name: "if-then", parent: scope, vars: new Map() };
        s.then.body.forEach(st => checkStmt(st, thenScope));
        if (s.elseBranch) {
          if (s.elseBranch.kind === "IfStmt") checkStmt(s.elseBranch, scope);
          else {
            const elseScope: Scope = { id: scopeCounter++, name: "if-else", parent: scope, vars: new Map() };
            s.elseBranch.body.forEach(st => checkStmt(st, elseScope));
          }
        }
        break;
      }
      case "WhileStmt": {
        checkExpr(s.cond, scope);
        const loopScope: Scope = { id: scopeCounter++, name: "while-body", parent: scope, vars: new Map() };
        s.body.body.forEach(st => checkStmt(st, loopScope));
        break;
      }
      case "ForStmt": {
        const loopScope: Scope = { id: scopeCounter++, name: "for-body", parent: scope, vars: new Map() };
        if (s.init) checkStmt(s.init, loopScope);
        if (s.cond) checkExpr(s.cond, loopScope);
        if (s.update) checkStmt(s.update, loopScope);
        s.body.body.forEach(st => checkStmt(st, loopScope));
        break;
      }
      case "ExprStmt": checkExpr(s.expr, scope); break;
      case "Block": {
        const blockScope: Scope = { id: scopeCounter++, name: "block", parent: scope, vars: new Map() };
        s.body.forEach(st => checkStmt(st, blockScope));
        break;
      }
    }
  }

  program.body.forEach(s => checkStmt(s, globalScope));

  return { symbolTable: allSymbols, errors, nodeTypes };
}
