// memorylayout.ts — Stack Frame and Memory Layout Generator for Nova Compiler.

import { SymbolEntry } from "./semantic";
import { RegisterAllocationResult } from "./regalloc";

export interface StackSlot {
  name: string;
  kind: "return_address" | "saved_frame_pointer" | "parameter" | "local_var" | "spill_slot";
  offset: number; // e.g. +16, +8, 0, -8, -16
  sizeBytes: number;
  type: string;
  registerOrSpill?: string;
}

export interface StackFrame {
  functionName: string;
  slots: StackSlot[];
  frameSizeBytes: number;
}

export interface MemoryLayoutResult {
  frames: StackFrame[];
  globalDataSection: { name: string; type: string; offset: number; sizeBytes: number }[];
}

export function computeMemoryLayout(symbols: SymbolEntry[], regAlloc: RegisterAllocationResult): MemoryLayoutResult {
  const globals: { name: string; type: string; offset: number; sizeBytes: number }[] = [];
  const functionsMap = new Map<string, SymbolEntry[]>();

  symbols.forEach(s => {
    if (s.scopeName === "global") {
      globals.push({ name: s.name, type: s.type, offset: s.offset * 8, sizeBytes: 8 });
    } else {
      const fnName = s.scopeName.startsWith("fn:") ? s.scopeName.replace("fn:", "") : s.scopeName;
      if (!functionsMap.has(fnName)) functionsMap.set(fnName, []);
      functionsMap.get(fnName)!.push(s);
    }
  });

  const frames: StackFrame[] = [];

  // Add default main frame if none
  if (!functionsMap.has("main")) {
    functionsMap.set("main", symbols.filter(s => s.scopeName !== "global"));
  }

  functionsMap.forEach((localSyms, fnName) => {
    const slots: StackSlot[] = [];

    // 1. Parameters (Positive Offsets relative to RBP)
    let paramOffset = 16;
    localSyms.filter(s => s.params).forEach(s => {
      s.params?.forEach(p => {
        slots.push({
          name: p,
          kind: "parameter",
          offset: paramOffset,
          sizeBytes: 8,
          type: "int/any",
          registerOrSpill: regAlloc.allocatedRegisters[p] || "stack",
        });
        paramOffset += 8;
      });
    });

    // 2. Return Address
    slots.push({
      name: "Return Address (RIP)",
      kind: "return_address",
      offset: 8,
      sizeBytes: 8,
      type: "pointer",
    });

    // 3. Saved RBP
    slots.push({
      name: "Saved Frame Pointer (RBP)",
      kind: "saved_frame_pointer",
      offset: 0,
      sizeBytes: 8,
      type: "pointer",
    });

    // 4. Local Variables & Spills (Negative Offsets)
    let localOffset = -8;
    localSyms.filter(s => !s.params?.includes(s.name)).forEach(s => {
      slots.push({
        name: s.name,
        kind: "local_var",
        offset: localOffset,
        sizeBytes: 8,
        type: s.type,
        registerOrSpill: regAlloc.allocatedRegisters[s.name] || "R0",
      });
      localOffset -= 8;
    });

    // Spilled variables
    regAlloc.spills.forEach(sp => {
      if (!slots.some(sl => sl.name === sp.varName)) {
        slots.push({
          name: `${sp.varName} (Spill)`,
          kind: "spill_slot",
          offset: -sp.offset,
          sizeBytes: 8,
          type: "spill",
          registerOrSpill: `[rbp-${sp.offset}]`,
        });
      }
    });

    const frameSizeBytes = Math.abs(localOffset) + 8;
    frames.push({
      functionName: fnName,
      slots,
      frameSizeBytes,
    });
  });

  return {
    frames,
    globalDataSection: globals,
  };
}
