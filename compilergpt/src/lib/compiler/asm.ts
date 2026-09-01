// asm.ts — Educational register-machine assembly generator from three-address code.
// Generates real instructions traceable back to IR/source lines (no fake output).

import { IRInstr } from "./ir";

export interface AsmLine { text: string; sourceLine: number; irIndex: number; explanation: string; }

const OP_MNEMONIC: Record<string, string> = {
  add: "ADD", sub: "SUB", mul: "MUL", div: "DIV", mod: "MOD",
  eq: "CMPEQ", neq: "CMPNE", lt: "CMPLT", gt: "CMPGT", lte: "CMPLE", gte: "CMPGE",
  and: "AND", or: "OR", not: "NOT", neg: "NEG", shl: "SHL",
};

let regCounter = 0;
const regOf = new Map<string, string>();
function reg(name: string): string {
  if (!regOf.has(name)) regOf.set(name, `R${regCounter++ % 8}`);
  return regOf.get(name)!;
}

export function generateAssembly(code: IRInstr[]): AsmLine[] {
  regCounter = 0;
  regOf.clear();
  const out: AsmLine[] = [];

  for (const instr of code) {
    switch (instr.op) {
      case "label":
        out.push({ text: `${instr.label}:`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Jump target label for control flow." });
        break;
      case "assign":
        if (/^-?\d+(\.\d+)?$/.test(instr.arg1 || "")) {
          out.push({ text: `  MOV ${reg(instr.result!)}, #${instr.arg1}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Load immediate constant ${instr.arg1} into register ${reg(instr.result!)}.` });
        } else {
          out.push({ text: `  MOV ${reg(instr.result!)}, ${reg(instr.arg1!)}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Copy value from ${reg(instr.arg1!)} to ${reg(instr.result!)}.` });
        }
        break;
      case "goto":
        out.push({ text: `  JMP ${instr.label}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Unconditional jump to ${instr.label}.` });
        break;
      case "if_false":
        out.push({ text: `  CMP ${reg(instr.arg1!)}, #0`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Compare condition register against false (0)." });
        out.push({ text: `  JE ${instr.label}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Jump to ${instr.label} if condition was false.` });
        break;
      case "return":
        out.push({ text: instr.arg1 ? `  MOV RET, ${reg(instr.arg1)}` : `  ; return void`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Move return value into RET register." });
        out.push({ text: `  RET`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Return control to caller." });
        break;
      case "param":
        out.push({ text: `  PUSH ${reg(instr.arg1!)}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Push argument onto call stack." });
        break;
      case "call":
        out.push({ text: `  CALL ${instr.arg1}, ${instr.arg2}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Call function '${instr.arg1}' with ${instr.arg2} arguments.` });
        if (instr.result) out.push({ text: `  MOV ${reg(instr.result)}, RET`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Capture return value from RET register." });
        break;
      case "recv_param":
        out.push({ text: `  POP ${reg(instr.result!)}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Pop caller-supplied argument into a local register." });
        break;
      case "end_fn":
        out.push({ text: `  ; end function`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "End of function body." });
        break;
      case "new_array":
        out.push({ text: `  ALLOC ${reg(instr.result!)}, #${instr.arg1}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Allocate array of size ${instr.arg1}.` });
        break;
      case "store_index":
        out.push({ text: `  STOREIDX ${reg(instr.result!)}[${instr.arg2}], ${isNumericTok(instr.arg1) ? "#" + instr.arg1 : reg(instr.arg1!)}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Store value at array index." });
        break;
      case "load_index":
        out.push({ text: `  LOADIDX ${reg(instr.result!)}, ${reg(instr.arg1!)}[${isNumericTok(instr.arg2) ? "#" + instr.arg2 : reg(instr.arg2!)}]`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: "Load value from array index." });
        break;
      default: {
        const mnem = OP_MNEMONIC[instr.op] || instr.op.toUpperCase();
        if (instr.arg2 !== undefined) {
          const a1 = isNumericTok(instr.arg1) ? "#" + instr.arg1 : reg(instr.arg1!);
          const a2 = isNumericTok(instr.arg2) ? "#" + instr.arg2 : reg(instr.arg2!);
          out.push({ text: `  ${mnem} ${reg(instr.result!)}, ${a1}, ${a2}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Compute ${instr.arg1} ${instr.op} ${instr.arg2}, store in ${reg(instr.result!)}. Register allocated because this value is live across multiple instructions.` });
        } else {
          const a1 = isNumericTok(instr.arg1) ? "#" + instr.arg1 : reg(instr.arg1!);
          out.push({ text: `  ${mnem} ${reg(instr.result!)}, ${a1}`, sourceLine: instr.sourceLine, irIndex: instr.id, explanation: `Compute ${instr.op} ${instr.arg1}, store in ${reg(instr.result!)}.` });
        }
      }
    }
  }
  return out;
}

function isNumericTok(s?: string): boolean {
  return s !== undefined && /^-?\d+(\.\d+)?$/.test(s);
}
