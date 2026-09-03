// x86_emulator.ts — In-memory x86-64 CPU Emulator & Execution Verifier.
// Simulates 64-bit registers, condition flags, stack frame memory, control flow, and syscalls.

export interface X86RegisterState {
  rax: number;
  rbx: number;
  rcx: number;
  rdx: number;
  rsi: number;
  rdi: number;
  r8: number;
  r9: number;
  r10: number;
  r11: number;
  rbp: number;
  rsp: number;
  zf: boolean; // Zero Flag
  sf: boolean; // Sign Flag
}

export interface X86ExecutionStep {
  step: number;
  instruction: string;
  registers: Partial<X86RegisterState>;
  output?: string;
}

export interface X86ExecutionResult {
  steps: X86ExecutionStep[];
  stdout: string[];
  finalRegisters: X86RegisterState;
  totalInstructionsExecuted: number;
  exitCode: number;
  error?: string;
}

export function emulateX86(assemblyText: string, maxSteps = 10000): X86ExecutionResult {
  const lines = assemblyText
    .split("\n")
    .map(l => l.trim())
    .filter(l => l && !l.startsWith(";") && !l.startsWith(".") && !l.startsWith("default"));

  // Extract labels and index
  const labelMap = new Map<string, number>();
  const code: string[] = [];

  for (const line of lines) {
    if (line.endsWith(":")) {
      const lbl = line.slice(0, -1).trim();
      labelMap.set(lbl, code.length);
    } else {
      code.push(line);
    }
  }

  const regs: X86RegisterState = {
    rax: 0, rbx: 0, rcx: 0, rdx: 0, rsi: 0, rdi: 0,
    r8: 0, r9: 0, r10: 0, r11: 0,
    rbp: 0x7fffffffe000,
    rsp: 0x7fffffffe000,
    zf: false,
    sf: false,
  };

  const stackMemory = new Map<number, number>();
  const callStack: number[] = [];
  const stdout: string[] = [];
  const steps: X86ExecutionStep[] = [];

  let pc = labelMap.get("main") ?? 0;
  let stepCount = 0;

  function parseOperand(op: string): number {
    op = op.trim();
    if (/^-?\d+$/.test(op)) return parseInt(op, 10);
    if (op.startsWith("QWORD PTR [rbp-")) {
      const offset = parseInt(op.replace("QWORD PTR [rbp-", "").replace("]", ""), 10);
      const addr = regs.rbp - offset;
      return stackMemory.get(addr) ?? 0;
    }
    if (op === "al") return regs.rax & 0xff;
    const rName = op.toLowerCase() as keyof X86RegisterState;
    if (rName in regs && typeof regs[rName] === "number") {
      return regs[rName] as number;
    }
    return 0;
  }

  function setOperand(op: string, val: number) {
    op = op.trim();
    if (op.startsWith("QWORD PTR [rbp-")) {
      const offset = parseInt(op.replace("QWORD PTR [rbp-", "").replace("]", ""), 10);
      const addr = regs.rbp - offset;
      stackMemory.set(addr, val);
      return;
    }
    if (op === "al") {
      regs.rax = (regs.rax & ~0xff) | (val & 0xff);
      return;
    }
    const rName = op.toLowerCase() as keyof X86RegisterState;
    if (rName in regs && typeof regs[rName] === "number") {
      (regs as any)[rName] = val;
    }
  }

  while (pc < code.length && stepCount < maxSteps) {
    const rawInstr = code[pc];
    stepCount++;

    // Parse opcode and args
    const firstSpace = rawInstr.indexOf(" ");
    let opcode = rawInstr.toLowerCase();
    let argsStr = "";
    if (firstSpace !== -1) {
      opcode = rawInstr.slice(0, firstSpace).toLowerCase();
      argsStr = rawInstr.slice(firstSpace + 1).trim();
    }
    const args = argsStr ? argsStr.split(",").map(a => a.trim()) : [];

    let stepOutput: string | undefined = undefined;

    switch (opcode) {
      case "mov":
      case "movzx":
        if (args.length === 2) {
          setOperand(args[0], parseOperand(args[1]));
        }
        pc++;
        break;

      case "add":
        if (args.length === 2) {
          const res = parseOperand(args[0]) + parseOperand(args[1]);
          setOperand(args[0], res);
          regs.zf = res === 0;
          regs.sf = res < 0;
        }
        pc++;
        break;

      case "sub":
        if (args.length === 2) {
          const res = parseOperand(args[0]) - parseOperand(args[1]);
          setOperand(args[0], res);
          regs.zf = res === 0;
          regs.sf = res < 0;
        }
        pc++;
        break;

      case "imul":
        if (args.length === 2) {
          const res = parseOperand(args[0]) * parseOperand(args[1]);
          setOperand(args[0], res);
          regs.zf = res === 0;
          regs.sf = res < 0;
        }
        pc++;
        break;

      case "idiv":
        if (args.length === 1) {
          const divisor = parseOperand(args[0]);
          if (divisor !== 0) {
            const quotient = Math.floor(regs.rax / divisor);
            const remainder = regs.rax % divisor;
            regs.rax = quotient;
            regs.rdx = remainder;
          }
        }
        pc++;
        break;

      case "neg":
        if (args.length === 1) {
          const res = -parseOperand(args[0]);
          setOperand(args[0], res);
        }
        pc++;
        break;

      case "cmp":
        if (args.length === 2) {
          const diff = parseOperand(args[0]) - parseOperand(args[1]);
          regs.zf = diff === 0;
          regs.sf = diff < 0;
        }
        pc++;
        break;

      case "sete":
        setOperand(args[0], regs.zf ? 1 : 0);
        pc++;
        break;

      case "setne":
        setOperand(args[0], !regs.zf ? 1 : 0);
        pc++;
        break;

      case "setl":
        setOperand(args[0], regs.sf ? 1 : 0);
        pc++;
        break;

      case "setle":
        setOperand(args[0], (regs.sf || regs.zf) ? 1 : 0);
        pc++;
        break;

      case "setg":
        setOperand(args[0], (!regs.sf && !regs.zf) ? 1 : 0);
        pc++;
        break;

      case "setge":
        setOperand(args[0], !regs.sf ? 1 : 0);
        pc++;
        break;

      case "jmp":
        if (labelMap.has(args[0])) {
          pc = labelMap.get(args[0])!;
        } else {
          pc++;
        }
        break;

      case "je":
      case "jz":
        if (regs.zf && labelMap.has(args[0])) {
          pc = labelMap.get(args[0])!;
        } else {
          pc++;
        }
        break;

      case "jne":
      case "jnz":
        if (!regs.zf && labelMap.has(args[0])) {
          pc = labelMap.get(args[0])!;
        } else {
          pc++;
        }
        break;

      case "push":
        regs.rsp -= 8;
        stackMemory.set(regs.rsp, parseOperand(args[0]));
        pc++;
        break;

      case "pop":
        setOperand(args[0], stackMemory.get(regs.rsp) ?? 0);
        regs.rsp += 8;
        pc++;
        break;

      case "call":
        if (args[0] === "print" || args[0] === "printf") {
          const val = regs.rax;
          stdout.push(String(val));
          stepOutput = `stdout: ${val}`;
          pc++;
        } else if (labelMap.has(args[0])) {
          callStack.push(pc + 1);
          pc = labelMap.get(args[0])!;
        } else {
          pc++;
        }
        break;

      case "ret":
        if (callStack.length > 0) {
          pc = callStack.pop()!;
        } else {
          // Terminate main
          pc = code.length;
        }
        break;

      default:
        pc++;
    }

    steps.push({
      step: stepCount,
      instruction: rawInstr,
      registers: {
        rax: regs.rax,
        rbx: regs.rbx,
        rcx: regs.rcx,
        rdx: regs.rdx,
        zf: regs.zf,
        sf: regs.sf,
      },
      output: stepOutput,
    });
  }

  return {
    steps: steps.slice(0, 500),
    stdout,
    finalRegisters: { ...regs },
    totalInstructionsExecuted: stepCount,
    exitCode: regs.rax,
    error: stepCount >= maxSteps ? "Execution step limit reached (potential infinite loop)" : undefined,
  };
}
