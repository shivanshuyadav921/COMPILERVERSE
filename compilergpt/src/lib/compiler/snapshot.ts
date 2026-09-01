// snapshot.ts — Time-Travel Compiler Snapshot & Animation Engine for Nova.

import { Token, LexError } from "./lexer";
import { Program } from "./ast";
import { SymbolEntry, SemanticError } from "./semantic";
import { IRInstr, irToString } from "./ir";
import { BasicBlock, CFG } from "./cfg";
import { OptimizationLog } from "./optimize";
import { SSAResult } from "./ssa";
import { RegisterAllocationResult } from "./regalloc";
import { AsmLine } from "./asm";

export type StageName =
  | "Source Input"
  | "Lexical Analysis"
  | "Syntax Parsing"
  | "Semantic Analysis"
  | "IR Generation"
  | "SSA Conversion"
  | "Optimization Pass"
  | "Register Allocation"
  | "Assembly Emission";

export interface SnapshotFrame {
  index: number;
  stage: StageName;
  title: string;
  description: string;
  irState: string[];
  activePassName?: string;
  changesDelta?: string[];
  artifacts: {
    tokens?: Token[];
    ast?: Program;
    symbolTable?: SymbolEntry[];
    ir?: string[];
    cfg?: CFG;
    ssa?: SSAResult;
    regAlloc?: RegisterAllocationResult;
    assembly?: AsmLine[];
  };
}

export function generateSnapshotTimeline(
  source: string,
  tokens: Token[],
  lexErrors: LexError[],
  ast: Program,
  parseErrors: any[],
  symbolTable: SymbolEntry[],
  semanticErrors: SemanticError[],
  rawIR: IRInstr[],
  optimizedIR: IRInstr[],
  logs: OptimizationLog[],
  cfgBefore: CFG,
  cfgAfter: CFG,
  ssa: SSAResult,
  regAlloc: RegisterAllocationResult,
  assembly: AsmLine[]
): SnapshotFrame[] {
  const frames: SnapshotFrame[] = [];
  let frameIdx = 0;

  // Frame 0: Source Input
  frames.push({
    index: frameIdx++,
    stage: "Source Input",
    title: "Source Code Ingestion",
    description: "Ingested Nova source program into editor workspace.",
    irState: [],
    artifacts: {},
  });

  // Frame 1: Lexical Analysis
  frames.push({
    index: frameIdx++,
    stage: "Lexical Analysis",
    title: "Tokenization",
    description: `Scanner emitted ${tokens.filter(t => t.type !== "EOF").length} tokens with line/col tracking. (${lexErrors.length} lex errors)`,
    irState: [],
    artifacts: { tokens },
  });

  // Frame 2: Syntax Parsing
  frames.push({
    index: frameIdx++,
    stage: "Syntax Parsing",
    title: "Abstract Syntax Tree (AST) Construction",
    description: `Recursive descent & Pratt parser constructed AST with ${ast.body.length} top-level statements.`,
    irState: [],
    artifacts: { tokens, ast },
  });

  // Frame 3: Semantic Analysis
  frames.push({
    index: frameIdx++,
    stage: "Semantic Analysis",
    title: "Scope Resolution & Type Checking",
    description: `Built symbol table with ${symbolTable.length} identifiers across lexical scopes. (${semanticErrors.length} errors)`,
    irState: [],
    artifacts: { tokens, ast, symbolTable },
  });

  // Frame 4: IR Generation
  const rawIRLines = rawIR.map(irToString);
  frames.push({
    index: frameIdx++,
    stage: "IR Generation",
    title: "Three-Address Code (TAC) Emission",
    description: `Lowered AST into ${rawIR.length} Three-Address Code instructions with explicit temporaries.`,
    irState: rawIRLines,
    artifacts: { tokens, ast, symbolTable, ir: rawIRLines, cfg: cfgBefore },
  });

  // Frame 5: SSA Conversion
  frames.push({
    index: frameIdx++,
    stage: "SSA Conversion",
    title: "Static Single Assignment Transformation",
    description: `Placed ${ssa.phiNodes.length} Phi-nodes at Iterated Dominance Frontiers and versioned variable definitions.`,
    irState: rawIRLines,
    artifacts: { tokens, ast, symbolTable, ir: rawIRLines, cfg: cfgBefore, ssa },
  });

  // Frames 6..N: Optimization Passes
  let currentIR = [...rawIR];
  logs.forEach((log) => {
    const irLines = currentIR.map(irToString);
    frames.push({
      index: frameIdx++,
      stage: "Optimization Pass",
      title: `Pass: ${log.pass}`,
      description: log.changes.length > 0 ? `Applied ${log.changes.length} optimization transformations.` : `No instructions modified in this pass.`,
      activePassName: log.pass,
      changesDelta: log.changes,
      irState: irLines,
      artifacts: { tokens, ast, symbolTable, ir: irLines, cfg: cfgAfter },
    });
  });

  // Frame N+1: Register Allocation
  const optIRLines = optimizedIR.map(irToString);
  frames.push({
    index: frameIdx++,
    stage: "Register Allocation",
    title: "Chaitin-Briggs Graph Coloring Register Allocation",
    description: `Allocated ${regAlloc.maxRegistersUsed} physical registers (R0-R7) and managed ${regAlloc.spills.length} memory stack spills.`,
    irState: optIRLines,
    artifacts: { tokens, ast, symbolTable, ir: optIRLines, cfg: cfgAfter, regAlloc },
  });

  // Frame N+2: Assembly Emission
  frames.push({
    index: frameIdx++,
    stage: "Assembly Emission",
    title: "Assembly Code Emission",
    description: `Generated ${assembly.length} assembly instructions traceable to source lines and IR temporaries.`,
    irState: optIRLines,
    artifacts: { tokens, ast, symbolTable, ir: optIRLines, cfg: cfgAfter, regAlloc, assembly },
  });

  return frames;
}
