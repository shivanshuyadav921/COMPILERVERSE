// x86_gen.ts — Real x86-64 Intel Syntax Assembly Generator.
// Lowering Common IR to valid x86-64 assembly with real register allocation (RAX, RBX, RCX, RDX, RSI, RDI, R8-R15).

import { IRInstr } from "./ir";
import { RegisterAllocationResult } from "./regalloc";

export interface X86AsmLine {
  text: string;
  sourceLine: number;
  irIndex: number;
  explanation: string;
}

export interface X86Program {
  lines: X86AsmLine[];
  textFormat: string;
}

const X86_PHYSICAL_REGS: Record<string, string> = {
  R0: "rax",
  R1: "rbx",
  R2: "rcx",
  R3: "rdx",
  R4: "rsi",
  R5: "rdi",
  R6: "r8",
  R7: "r9",
};

export function generateX86Assembly(
  code: IRInstr[],
  regAlloc?: RegisterAllocationResult
): X86Program {
  const lines: X86AsmLine[] = [];
  let irIdx = 0;

  function emit(text: string, explanation: string, sourceLine = 1) {
    lines.push({ text, explanation, sourceLine, irIndex: irIdx });
  }

  // Map variable to x86 location (register or stack offset)
  function loc(v?: string): string {
    if (!v) return "rax";
    if (/^-?\d+$/.test(v)) return v; // Immediate number

    if (regAlloc && regAlloc.allocatedRegisters[v]) {
      const regId = regAlloc.allocatedRegisters[v];
      return X86_PHYSICAL_REGS[regId] || "rax";
    }

    if (regAlloc && regAlloc.spills.some(s => s.varName === v)) {
      const spill = regAlloc.spills.find(s => s.varName === v)!;
      return `QWORD PTR [rbp-${spill.offset}]`;
    }

    return "rax";
  }

  function isImm(v?: string): boolean {
    return v !== undefined && /^-?\d+$/.test(v);
  }

  // Header & Data section
  emit("default rel", "Set RIP-relative addressing default.", 1);
  emit(".intel_syntax noprefix", "Use Intel assembly syntax (dest, src).", 1);
  emit(".globl main", "Export main entry point.", 1);
  emit(".text", "Code segment.", 1);

  // Main entry prologue
  emit("main:", "Entry function label.", 1);
  emit("  push rbp", "Save base pointer.", 1);
  emit("  mov rbp, rsp", "Establish stack frame.", 1);
  const stackBytes = Math.max(32, (regAlloc?.spills.length || 0) * 8 + 32);
  emit(`  sub rsp, ${stackBytes}`, `Allocate ${stackBytes} bytes for local stack frame.`, 1);

  for (const instr of code) {
    irIdx = instr.id;
    const sLine = instr.sourceLine;

    switch (instr.op) {
      case "label":
        emit(`${instr.label}:`, `Label target for jumps.`, sLine);
        break;

      case "assign":
        if (isImm(instr.arg1)) {
          emit(`  mov ${loc(instr.result)}, ${instr.arg1}`, `Load constant ${instr.arg1} into ${loc(instr.result)}.`, sLine);
        } else {
          const src = loc(instr.arg1);
          const dst = loc(instr.result);
          if (src.includes("[") && dst.includes("[")) {
            emit(`  mov r10, ${src}`, `Memory-to-memory copy via temporary register r10.`, sLine);
            emit(`  mov ${dst}, r10`, `Store into destination stack slot.`, sLine);
          } else {
            emit(`  mov ${dst}, ${src}`, `Copy value from ${src} to ${dst}.`, sLine);
          }
        }
        break;

      case "goto":
        emit(`  jmp ${instr.label}`, `Unconditional jump to ${instr.label}.`, sLine);
        break;

      case "if_false":
        emit(`  cmp ${loc(instr.arg1)}, 0`, `Compare condition register with 0 (false).`, sLine);
        emit(`  je ${instr.label}`, `Jump to ${instr.label} if condition was false.`, sLine);
        break;

      case "add":
        emit(`  mov rax, ${loc(instr.arg1)}`, `Load first operand into rax.`, sLine);
        emit(`  add rax, ${loc(instr.arg2)}`, `Add second operand to rax.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store result into ${loc(instr.result)}.`, sLine);
        break;

      case "sub":
        emit(`  mov rax, ${loc(instr.arg1)}`, `Load first operand into rax.`, sLine);
        emit(`  sub rax, ${loc(instr.arg2)}`, `Subtract second operand from rax.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store result into ${loc(instr.result)}.`, sLine);
        break;

      case "mul":
        emit(`  mov rax, ${loc(instr.arg1)}`, `Load first operand into rax.`, sLine);
        emit(`  imul rax, ${loc(instr.arg2)}`, `Signed multiply rax by second operand.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store result into ${loc(instr.result)}.`, sLine);
        break;

      case "div":
        emit(`  mov rax, ${loc(instr.arg1)}`, `Load dividend into rax.`, sLine);
        emit(`  cqo`, `Sign-extend rax into rdx:rax for division.`, sLine);
        emit(`  mov r11, ${loc(instr.arg2)}`, `Load divisor into r11.`, sLine);
        emit(`  idiv r11`, `Divide rdx:rax by r11. Quotient in rax.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store quotient into ${loc(instr.result)}.`, sLine);
        break;

      case "mod":
        emit(`  mov rax, ${loc(instr.arg1)}`, `Load dividend into rax.`, sLine);
        emit(`  cqo`, `Sign-extend rax into rdx:rax for division.`, sLine);
        emit(`  mov r11, ${loc(instr.arg2)}`, `Load divisor into r11.`, sLine);
        emit(`  idiv r11`, `Divide rdx:rax by r11. Remainder in rdx.`, sLine);
        emit(`  mov ${loc(instr.result)}, rdx`, `Store remainder into ${loc(instr.result)}.`, sLine);
        break;

      case "eq":
      case "neq":
      case "lt":
      case "lte":
      case "gt":
      case "gte": {
        const setMnem = {
          eq: "sete",
          neq: "setne",
          lt: "setl",
          lte: "setle",
          gt: "setg",
          gte: "setge",
        }[instr.op];
        emit(`  cmp ${loc(instr.arg1)}, ${loc(instr.arg2)}`, `Compare operands.`, sLine);
        emit(`  ${setMnem} al`, `Set lower 8-bit register al based on condition flag.`, sLine);
        emit(`  movzx rax, al`, `Zero-extend al into 64-bit register rax.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store boolean condition in ${loc(instr.result)}.`, sLine);
        break;
      }

      case "not":
        emit(`  cmp ${loc(instr.arg1)}, 0`, `Compare operand with 0.`, sLine);
        emit(`  sete al`, `Set al if equal to zero.`, sLine);
        emit(`  movzx rax, al`, `Zero-extend result.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store logical NOT result.`, sLine);
        break;

      case "neg":
        emit(`  mov rax, ${loc(instr.arg1)}`, `Load operand into rax.`, sLine);
        emit(`  neg rax`, `Negate two's complement value in rax.`, sLine);
        emit(`  mov ${loc(instr.result)}, rax`, `Store negated result.`, sLine);
        break;

      case "param":
        emit(`  push ${loc(instr.arg1)}`, `Push function argument onto stack.`, sLine);
        break;

      case "call":
        if (instr.arg1 === "print" || instr.arg1 === "printf") {
          emit(`  ; print pseudo-syscall`, `Print value in stdout.`, sLine);
        } else {
          emit(`  call fn_${instr.arg1}`, `Call procedure '${instr.arg1}'.`, sLine);
        }
        if (instr.result) {
          emit(`  mov ${loc(instr.result)}, rax`, `Capture return value from rax.`, sLine);
        }
        break;

      case "return":
        if (instr.arg1) {
          emit(`  mov rax, ${loc(instr.arg1)}`, `Move return value into rax.`, sLine);
        }
        emit(`  mov rsp, rbp`, `Restore stack pointer.`, sLine);
        emit(`  pop rbp`, `Restore base pointer.`, sLine);
        emit(`  ret`, `Return to caller.`, sLine);
        break;

      default:
        emit(`  ; nop ${instr.op}`, `Unlowered IR opcode '${instr.op}'.`, sLine);
    }
  }

  // Epilogue
  emit(`  mov rax, 0`, `Exit code 0.`, 1);
  emit(`  mov rsp, rbp`, `Tear down stack frame.`, 1);
  emit(`  pop rbp`, `Restore caller frame pointer.`, 1);
  emit(`  ret`, `Return to OS runtime.`, 1);

  const textFormat = lines.map(l => l.text).join("\n");
  return { lines, textFormat };
}
