// ast.ts — AST node definitions for Nova.

export interface Pos { line: number; col: number; }

export interface NodeBase { id: string; kind: string; pos: Pos; }

export type Type = "int" | "float" | "bool" | "string" | "array" | "void" | "unknown";

export interface Program extends NodeBase { kind: "Program"; body: Stmt[]; }

export type Stmt =
  | LetStmt | FnDecl | ReturnStmt | IfStmt | WhileStmt | ForStmt
  | ExprStmt | Block;

export interface LetStmt extends NodeBase { kind: "LetStmt"; name: string; init: Expr | null; }
export interface FnDecl extends NodeBase { kind: "FnDecl"; name: string; params: string[]; body: Block; }
export interface ReturnStmt extends NodeBase { kind: "ReturnStmt"; value: Expr | null; }
export interface IfStmt extends NodeBase { kind: "IfStmt"; cond: Expr; then: Block; elseBranch: Block | IfStmt | null; }
export interface WhileStmt extends NodeBase { kind: "WhileStmt"; cond: Expr; body: Block; }
export interface ForStmt extends NodeBase { kind: "ForStmt"; init: Stmt | null; cond: Expr | null; update: Stmt | null; body: Block; }
export interface ExprStmt extends NodeBase { kind: "ExprStmt"; expr: Expr; }
export interface Block extends NodeBase { kind: "Block"; body: Stmt[]; }

export type Expr =
  | NumberLit | FloatLit | StringLit | BoolLit | ArrayLit
  | Ident | Assign | Binary | Unary | Call | Index;

export interface NumberLit extends NodeBase { kind: "NumberLit"; value: number; }
export interface FloatLit extends NodeBase { kind: "FloatLit"; value: number; }
export interface StringLit extends NodeBase { kind: "StringLit"; value: string; }
export interface BoolLit extends NodeBase { kind: "BoolLit"; value: boolean; }
export interface ArrayLit extends NodeBase { kind: "ArrayLit"; elements: Expr[]; }
export interface Ident extends NodeBase { kind: "Ident"; name: string; }
export interface Assign extends NodeBase { kind: "Assign"; name: string; value: Expr; }
export interface Binary extends NodeBase { kind: "Binary"; op: string; left: Expr; right: Expr; }
export interface Unary extends NodeBase { kind: "Unary"; op: string; operand: Expr; }
export interface Call extends NodeBase { kind: "Call"; callee: string; args: Expr[]; }
export interface Index extends NodeBase { kind: "Index"; array: Expr; index: Expr; }

let idCounter = 0;
export function nextId(): string { return "n" + (idCounter++); }
export function resetIdCounter() { idCounter = 0; }
