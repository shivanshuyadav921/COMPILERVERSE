// ir.ts — Three-address-code IR generator, real codegen walking the AST.

import * as A from "./ast";

export interface IRInstr {
  id: number;
  op: string;            // e.g. "add","sub","mul","div","mod","assign","goto","if_false","label","return","param","call","lt","gt","eq",...
  arg1?: string;
  arg2?: string;
  result?: string;
  label?: string;
  sourceLine: number;
}

let tempCounter = 0;
let labelCounter = 0;
function newTemp() { return `t${tempCounter++}`; }
function newLabel() { return `L${labelCounter++}`; }

export function generateIR(program: A.Program): IRInstr[] {
  tempCounter = 0;
  labelCounter = 0;
  const code: IRInstr[] = [];
  let iid = 0;
  function emit(op: string, a1: string | undefined, a2: string | undefined, res: string | undefined, line: number, label?: string) {
    code.push({ id: iid++, op, arg1: a1, arg2: a2, result: res, label, sourceLine: line });
  }

  const opMap: Record<string, string> = {
    "+": "add", "-": "sub", "*": "mul", "/": "div", "%": "mod",
    "==": "eq", "!=": "neq", "<": "lt", ">": "gt", "<=": "lte", ">=": "gte",
    "&&": "and", "||": "or",
  };

  function genExpr(e: A.Expr): string {
    switch (e.kind) {
      case "NumberLit": return String(e.value);
      case "FloatLit": return String(e.value);
      case "BoolLit": return e.value ? "true" : "false";
      case "StringLit": return JSON.stringify(e.value);
      case "Ident": return e.name;
      case "ArrayLit": {
        const t = newTemp();
        emit("new_array", String(e.elements.length), undefined, t, e.pos.line);
        e.elements.forEach((el, idx) => {
          const v = genExpr(el);
          emit("store_index", v, String(idx), t, e.pos.line);
        });
        return t;
      }
      case "Assign": {
        const v = genExpr(e.value);
        emit("assign", v, undefined, e.name, e.pos.line);
        return e.name;
      }
      case "Binary": {
        const l = genExpr(e.left);
        const r = genExpr(e.right);
        const t = newTemp();
        emit(opMap[e.op] || e.op, l, r, t, e.pos.line);
        return t;
      }
      case "Unary": {
        const v = genExpr(e.operand);
        const t = newTemp();
        emit(e.op === "!" ? "not" : "neg", v, undefined, t, e.pos.line);
        return t;
      }
      case "Call": {
        e.args.forEach(a => {
          const v = genExpr(a);
          emit("param", v, undefined, undefined, e.pos.line);
        });
        const t = newTemp();
        emit("call", e.callee, String(e.args.length), t, e.pos.line);
        return t;
      }
      case "Index": {
        const arr = genExpr(e.array);
        const idx = genExpr(e.index);
        const t = newTemp();
        emit("load_index", arr, idx, t, e.pos.line);
        return t;
      }
    }
  }

  function genStmt(s: A.Stmt) {
    switch (s.kind) {
      case "LetStmt": {
        const v = s.init ? genExpr(s.init) : "0";
        emit("assign", v, undefined, s.name, s.pos.line);
        break;
      }
      case "ExprStmt": genExpr(s.expr); break;
      case "ReturnStmt": {
        const v = s.value ? genExpr(s.value) : undefined;
        emit("return", v, undefined, undefined, s.pos.line);
        break;
      }
      case "FnDecl": {
        const startLabel = `fn_${s.name}`;
        emit("label", undefined, undefined, undefined, s.pos.line, startLabel);
        s.params.forEach(p => emit("recv_param", undefined, undefined, p, s.pos.line));
        s.body.body.forEach(genStmt);
        emit("end_fn", undefined, undefined, undefined, s.pos.line);
        break;
      }
      case "IfStmt": {
        const c = genExpr(s.cond);
        const elseLabel = newLabel();
        const endLabel = newLabel();
        emit("if_false", c, undefined, undefined, s.pos.line, elseLabel);
        s.then.body.forEach(genStmt);
        emit("goto", undefined, undefined, undefined, s.pos.line, endLabel);
        emit("label", undefined, undefined, undefined, s.pos.line, elseLabel);
        if (s.elseBranch) {
          if (s.elseBranch.kind === "IfStmt") genStmt(s.elseBranch);
          else s.elseBranch.body.forEach(genStmt);
        }
        emit("label", undefined, undefined, undefined, s.pos.line, endLabel);
        break;
      }
      case "WhileStmt": {
        const startLabel = newLabel();
        const endLabel = newLabel();
        emit("label", undefined, undefined, undefined, s.pos.line, startLabel);
        const c = genExpr(s.cond);
        emit("if_false", c, undefined, undefined, s.pos.line, endLabel);
        s.body.body.forEach(genStmt);
        emit("goto", undefined, undefined, undefined, s.pos.line, startLabel);
        emit("label", undefined, undefined, undefined, s.pos.line, endLabel);
        break;
      }
      case "ForStmt": {
        if (s.init) genStmt(s.init);
        const startLabel = newLabel();
        const endLabel = newLabel();
        emit("label", undefined, undefined, undefined, s.pos.line, startLabel);
        if (s.cond) {
          const c = genExpr(s.cond);
          emit("if_false", c, undefined, undefined, s.pos.line, endLabel);
        }
        s.body.body.forEach(genStmt);
        if (s.update) genStmt(s.update);
        emit("goto", undefined, undefined, undefined, s.pos.line, startLabel);
        emit("label", undefined, undefined, undefined, s.pos.line, endLabel);
        break;
      }
      case "Block": s.body.forEach(genStmt); break;
    }
  }

  program.body.forEach(genStmt);
  return code;
}

export function irToString(instr: IRInstr): string {
  if (instr.op === "label") return `${instr.label}:`;
  if (instr.op === "goto") return `  goto ${instr.label}`;
  if (instr.op === "if_false") return `  if_false ${instr.arg1} goto ${instr.label}`;
  if (instr.op === "assign") return `  ${instr.result} = ${instr.arg1}`;
  if (instr.op === "return") return `  return ${instr.arg1 ?? ""}`;
  if (instr.op === "param") return `  param ${instr.arg1}`;
  if (instr.op === "call") return `  ${instr.result} = call ${instr.arg1}, ${instr.arg2}`;
  if (instr.op === "recv_param") return `  recv_param ${instr.result}`;
  if (instr.op === "end_fn") return `end_fn`;
  if (instr.op === "new_array") return `  ${instr.result} = new_array[${instr.arg1}]`;
  if (instr.op === "store_index") return `  ${instr.result}[${instr.arg2}] = ${instr.arg1}`;
  if (instr.op === "load_index") return `  ${instr.result} = ${instr.arg1}[${instr.arg2}]`;
  if (instr.op === "not" || instr.op === "neg") return `  ${instr.result} = ${instr.op} ${instr.arg1}`;
  return `  ${instr.result} = ${instr.arg1} ${instr.op} ${instr.arg2}`;
}
