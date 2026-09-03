"use client";
import { useState } from "react";
import { CompileResult } from "@/lib/compiler/pipeline";

interface EducationalStep {
  id: number;
  name: string;
  stage: string;
  description: string;
  concept: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const STEPS: EducationalStep[] = [
  {
    id: 1,
    name: "1. Lexical Analysis (Scanner)",
    stage: "Tokens",
    description: "Converts stream of source characters into atomic lexical tokens.",
    concept: "The lexer uses regular expression matchers to strip whitespace/comments and classify character sequences into tokens like IDENT, INT_LIT, PLUS, and KEYWORD.",
    quiz: {
      question: "What is the primary output of lexical analysis?",
      options: ["Three-Address Code", "A flat array of typed Token structures", "Abstract Syntax Tree", "x86 Assembly"],
      correctIndex: 1,
      explanation: "The lexer produces a stream of tokens, discarding source whitespace and comments.",
    },
  },
  {
    id: 2,
    name: "2. Syntax Analysis & Parsing",
    stage: "Parse Trace",
    description: "Constructs hierarchical structure based on formal grammar rules.",
    concept: "We use a Pratt top-down operator precedence parser for expressions combined with recursive descent for declarations and control flow.",
    quiz: {
      question: "What disambiguates expression binding in a Pratt parser?",
      options: ["Random choices", "Binding power / precedence numbers", "Lexer token length", "Symbol table offsets"],
      correctIndex: 1,
      explanation: "Pratt parsing assigns numerical left and right binding power values to operators to handle precedence and associativity.",
    },
  },
  {
    id: 3,
    name: "3. Abstract Syntax Tree (AST)",
    stage: "AST",
    description: "Hierarchical recursive tree representation of the program semantics.",
    concept: "The AST abstracts away concrete syntactic punctuation (semicolons, braces, parentheses) and retains pure logical program nodes (FnDecl, IfStmt, Binary).",
    quiz: {
      question: "How does the AST differ from a concrete parse tree?",
      options: ["It includes bytecode", "It omits non-semantic syntax like commas and braces", "It is stored in registers", "It contains machine code"],
      correctIndex: 1,
      explanation: "ASTs represent pure semantic syntax trees without concrete punctuation tokens.",
    },
  },
  {
    id: 4,
    name: "4. Semantic Analysis & Symbol Tables",
    stage: "Symbols",
    description: "Type validation, scope resolution, and variable binding verification.",
    concept: "Scopes form a lexical tree where inner scopes inherit symbol visibility from parents. The analyzer verifies type consistency and undeclared identifiers.",
    quiz: {
      question: "When is a variable looked up in the parent scope?",
      options: ["Never", "When it is not found in the current inner lexical scope", "Only in global scope", "After register allocation"],
      correctIndex: 1,
      explanation: "Lexical scope lookup walks upward through the scope parent chain until found or root is reached.",
    },
  },
  {
    id: 5,
    name: "5. Three-Address Code (Common IR)",
    stage: "IR",
    description: "Linearization of AST into low-level intermediate representation.",
    concept: "Each instruction has at most one operator and at most three operands (e.g., t0 = a + b). This simplifies optimization algorithms and target lowers.",
    quiz: {
      question: "Why is Three-Address Code (TAC) widely used in optimizing compilers?",
      options: ["It runs faster than C", "Its simple uniform structure enables straightforward dataflow analysis and optimization passes", "It directly controls CPU transistors", "It eliminates memory"],
      correctIndex: 1,
      explanation: "TAC provides a target-independent, linearized representation that makes optimization passes easy to write.",
    },
  },
  {
    id: 6,
    name: "6. Control Flow Graph (CFG)",
    stage: "CFG",
    description: "Partitioning instructions into maximal basic blocks connected by directed jump edges.",
    concept: "A Basic Block has a single entry (first instruction) and single exit (last instruction). Edges represent conditional and unconditional branches.",
    quiz: {
      question: "What defines the boundary of a Basic Block?",
      options: ["Arbitrary 10 lines of code", "A sequence of instructions with entry at top and exit at bottom without internal branches", "Each variable declaration", "Function return types"],
      correctIndex: 1,
      explanation: "Basic blocks guarantee straight-line execution without branching in or out midway.",
    },
  },
  {
    id: 7,
    name: "7. Iterative Dataflow Analysis",
    stage: "Dataflow",
    description: "Fixpoint iteration over CFG to compute Reaching Definitions and Live Variables.",
    concept: "Equations IN[B] = ∪ OUT[P] and OUT[B] = GEN[B] ∪ (IN[B] - KILL[B]) are evaluated iteratively until the sets stabilize at a greatest fixpoint.",
    quiz: {
      question: "In Live Variable analysis, in which direction does information flow?",
      options: ["Forward from entry to exit", "Backward from exit to entry", "Randomly", "Only within a single block"],
      correctIndex: 1,
      explanation: "Liveness is a backward dataflow analysis because variable usage determines prior liveness.",
    },
  },
  {
    id: 8,
    name: "8. Dominator Trees & Dominance Frontiers",
    stage: "Dominators",
    description: "Identifies mandatory dominance paths and branch merge convergence frontiers.",
    concept: "Node D dominates N if every path from CFG Entry to N must pass through D. The Dominance Frontier DF(X) determines where SSA phi-nodes are mandatory.",
    quiz: {
      question: "Where must SSA Phi-nodes (Φ) be placed in a CFG?",
      options: ["At the first line of main()", "At the Iterated Dominance Frontier (IDF) of variable definitions", "In every basic block", "At the return instruction"],
      correctIndex: 1,
      explanation: "The Cytron algorithm places Φ-nodes at the iterated dominance frontier of all definition sites.",
    },
  },
  {
    id: 9,
    name: "9. Static Single Assignment (SSA)",
    stage: "SSA",
    description: "Guarantees every variable is assigned a value exactly once.",
    concept: "Variables are assigned version subscripts (e.g. x_0, x_1). When multiple versions converge at control-flow join points, a Φ-node selects the active version.",
    quiz: {
      question: "What is the primary benefit of SSA form?",
      options: ["Code becomes longer", "Explicit definition-use chains make optimizations like Constant Propagation and DCE trivial", "It removes all loops", "It forces using 64-bit integers"],
      correctIndex: 1,
      explanation: "SSA uniquely links every variable use to its exact definition, drastically simplifying dataflow analysis.",
    },
  },
  {
    id: 10,
    name: "10. Register Allocation (Graph Coloring)",
    stage: "RegAlloc",
    description: "Maps unbounded virtual temporaries to finite physical CPU registers (K=8).",
    concept: "Variables with overlapping live intervals form edges in an Interference Graph. Chaitin-Briggs graph coloring assigns colors with K physical registers or spills to stack.",
    quiz: {
      question: "When must a variable be spilled to a stack slot [rbp-offset]?",
      options: ["When its interference graph degree exceeds K and cannot be simplified", "Always for all integers", "Only inside while loops", "Never"],
      correctIndex: 0,
      explanation: "When graph coloring cannot find a K-coloring, variables are spilled to memory stack slots.",
    },
  },
  {
    id: 11,
    name: "11. Code Generation (x86-64 & WASM)",
    stage: "Assembly",
    description: "Emits target machine code or portable WebAssembly bytecode.",
    concept: "The compiler emits standard x86-64 Intel assembly with prologue/epilogue and stack frames, or WebAssembly text format (WAT) and executable .wasm binary.",
    quiz: {
      question: "What register holds the integer return value in System V x86-64 calling convention?",
      options: ["RSP", "RAX", "RBP", "R15"],
      correctIndex: 1,
      explanation: "In standard x86-64 calling conventions, RAX holds integer return values.",
    },
  },
];

export default function EducationalModeView({ result }: { result: CompileResult }) {
  const [currentStepId, setCurrentStepId] = useState<number>(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number>(0);

  const step = STEPS.find((s) => s.id === currentStepId) || STEPS[0];
  const isAnswered = selectedAnswers[step.id] !== undefined;
  const isCorrect = isAnswered && selectedAnswers[step.id] === step.quiz.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedAnswers((prev) => ({ ...prev, [step.id]: idx }));
    if (idx === step.quiz.correctIndex) {
      setQuizScore((s) => s + 1);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-3 overflow-hidden font-sans">
      {/* Header */}
      <div className="flex justify-between items-center bg-surface p-3 border border-border rounded-lg text-xs">
        <div>
          <span className="font-bold text-sage text-sm">Educational Mode (Interactive Compiler Lab)</span>
          <p className="text-[11px] text-text-secondary">
            Step-by-step interactive journey through all 11 phases of compiler engineering with real-time artifact inspection.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-surface-elevated border border-border rounded text-xs font-bold text-sage">
            Quiz Mastery: {quizScore} / {STEPS.length}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentStepId((id) => Math.max(1, id - 1))}
              disabled={currentStepId === 1}
              className="px-2.5 py-1 bg-surface-elevated border border-border rounded text-text-primary disabled:opacity-40"
            >
              ◄ Prev Step
            </button>
            <button
              onClick={() => setCurrentStepId((id) => Math.min(STEPS.length, id + 1))}
              disabled={currentStepId === STEPS.length}
              className="px-2.5 py-1 bg-sage text-white font-bold rounded hover:bg-sage/80 disabled:opacity-40"
            >
              Next Step ►
            </button>
          </div>
        </div>
      </div>

      {/* Stepper Navigation Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {STEPS.map((s) => {
          const answered = selectedAnswers[s.id] !== undefined;
          const active = s.id === currentStepId;
          return (
            <button
              key={s.id}
              onClick={() => setCurrentStepId(s.id)}
              className={`px-2.5 py-1 rounded text-xs whitespace-nowrap transition-all flex items-center gap-1.5 ${
                active
                  ? "bg-sage text-white font-bold shadow-sm"
                  : answered
                  ? "bg-surface-elevated text-sage border border-sage/40"
                  : "bg-surface text-text-secondary hover:text-text-primary border border-border"
              }`}
            >
              <span>{s.id}. {s.stage}</span>
              {answered && <span>✓</span>}
            </button>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
        {/* Concept & Quiz Column */}
        <div className="card p-4 flex flex-col space-y-4 overflow-auto">
          <div>
            <span className="text-[11px] uppercase font-bold text-sage tracking-wide">Phase {step.id} of {STEPS.length}</span>
            <h2 className="text-base font-bold text-text-primary mt-0.5">{step.name}</h2>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">{step.description}</p>
          </div>

          <div className="p-3 bg-surface-elevated border border-border rounded-lg space-y-1.5">
            <h3 className="text-xs font-bold text-text-primary">Underlying Compiler Theory</h3>
            <p className="text-xs text-text-secondary leading-relaxed">{step.concept}</p>
          </div>

          {/* Interactive Quiz Box */}
          <div className="p-3 bg-surface border border-border rounded-lg space-y-2.5">
            <span className="text-[11px] font-bold text-ochre uppercase tracking-wide">
              Interactive Concept Check
            </span>
            <p className="text-xs font-semibold text-text-primary">{step.quiz.question}</p>

            <div className="space-y-1.5">
              {step.quiz.options.map((opt, idx) => {
                let btnStyle = "bg-surface-elevated text-text-secondary border-border hover:bg-surface hover:text-text-primary";
                if (isAnswered) {
                  if (idx === step.quiz.correctIndex) {
                    btnStyle = "bg-sage/20 border-sage text-sage font-bold";
                  } else if (selectedAnswers[step.id] === idx) {
                    btnStyle = "bg-terracotta/20 border-terracotta text-terracotta font-bold";
                  } else {
                    btnStyle = "bg-surface-elevated text-text-secondary opacity-50 border-border";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(idx)}
                    disabled={isAnswered}
                    className={`w-full text-left p-2 rounded text-xs border transition-all ${btnStyle}`}
                  >
                    {String.fromCharCode(65 + idx)}. {opt}
                  </button>
                );
              })}
            </div>

            {isAnswered && (
              <div
                className={`p-2.5 rounded border text-xs leading-relaxed ${
                  isCorrect
                    ? "bg-sage/10 border-sage/40 text-sage"
                    : "bg-terracotta/10 border-terracotta/40 text-terracotta"
                }`}
              >
                <span className="font-bold block mb-1">
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </span>
                <span className="text-text-primary">{step.quiz.explanation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Real Live Artifact Inspection Column */}
        <div className="card p-3 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] uppercase font-bold text-text-secondary">
              Live Compiled Artifact: {step.stage}
            </span>
            <span className="text-[11px] text-sage font-semibold">100% Real Compiler Data</span>
          </div>

          <div className="flex-1 overflow-auto bg-surface-elevated p-3 rounded border border-border mono text-xs leading-relaxed">
            {step.id === 1 && (
              <div className="space-y-1">
                {result.tokens.slice(0, 30).map((t: any, i: number) => (
                  <div key={i} className="flex justify-between text-text-secondary">
                    <span className="text-text-primary font-bold">{t.type}</span>
                    <span className="text-sage">&quot;{t.lexeme}&quot;</span>
                    <span className="text-[10px] text-text-secondary">L{t.line}:C{t.col}</span>
                  </div>
                ))}
              </div>
            )}
            {step.id === 2 && (
              <pre className="text-text-primary whitespace-pre-wrap">
                {result.parseTrace ? JSON.stringify(result.parseTrace.slice(0, 15), null, 2) : "Parse trace loaded."}
              </pre>
            )}
            {step.id === 3 && (
              <pre className="text-text-primary whitespace-pre-wrap">
                {JSON.stringify(result.ast, null, 2)}
              </pre>
            )}
            {step.id === 4 && (
              <div className="space-y-1">
                {result.symbolTable.map((s: any, idx: number) => (
                  <div key={idx} className="p-1.5 bg-surface border border-border rounded flex justify-between">
                    <span className="text-text-primary font-bold">{s.name}</span>
                    <span className="text-sage">{s.type}</span>
                    <span className="text-text-secondary text-[10px]">Scope {s.scopeId}</span>
                  </div>
                ))}
              </div>
            )}
            {step.id === 5 && (
              <pre className="text-muted-teal">{result.ir.join("\n")}</pre>
            )}
            {step.id === 6 && (
              <div className="space-y-2">
                {result.cfgAfter.blocks.map((b: any) => (
                  <div key={b.id} className="p-2 bg-surface border border-border rounded">
                    <span className="text-muted-teal font-bold block">{b.id} (preds: {b.predecessors?.join(",") || "none"})</span>
                    <pre className="text-[11px] text-text-secondary">{b.instructions.map((i: any) => i.op).join(", ")}</pre>
                  </div>
                ))}
              </div>
            )}
            {step.id === 7 && (
              <div className="space-y-2">
                {result.dataflow.liveVariables.iterations.slice(0, 3).map((it: any, idx: number) => (
                  <div key={idx} className="p-2 bg-surface border border-border rounded text-[11px]">
                    <span className="text-sage font-bold block">Iteration {it.iteration}</span>
                    {Object.entries(it.in).map(([b, s]: any) => (
                      <div key={b} className="text-text-secondary">IN[{b}] = &#123;{s.join(", ")}&#125;</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            {step.id === 8 && (
              <div className="space-y-1">
                {Object.entries(result.dominators.idom).map(([b, parent]: any) => (
                  <div key={b} className="p-1 bg-surface border border-border rounded flex justify-between">
                    <span className="text-text-primary font-bold">{b}</span>
                    <span className="text-sage">idom: {parent || "ENTRY"}</span>
                  </div>
                ))}
              </div>
            )}
            {step.id === 9 && (
              <div className="space-y-1">
                {result.ssa.phiNodes.length > 0 ? (
                  result.ssa.phiNodes.map((p: any, idx: number) => (
                    <div key={idx} className="p-1 bg-surface border border-border rounded text-text-primary">
                      {p.ssaVar} = Φ({Object.entries(p.operands || {}).map(([b, v]) => `${b}:${v}`).join(", ")}) in {p.blockId}
                    </div>
                  ))
                ) : (
                  <span className="text-text-secondary italic">No Φ-nodes required for this program.</span>
                )}
              </div>
            )}
            {step.id === 10 && (
              <div className="space-y-1">
                <div className="text-sage font-bold mb-1">Max Physical Registers: {result.regAlloc.maxRegistersUsed} / 8</div>
                {Object.entries(result.regAlloc.allocatedRegisters).map(([v, r]: any) => (
                  <div key={v} className="p-1 bg-surface border border-border rounded flex justify-between">
                    <span className="text-text-primary">{v}</span>
                    <span className="text-olive font-bold">→ {r}</span>
                  </div>
                ))}
              </div>
            )}
            {step.id === 11 && (
              <div className="space-y-2">
                <div className="text-olive font-bold">x86-64 Intel Output:</div>
                <pre className="text-text-primary text-[11px] leading-relaxed">{result.x86?.textFormat || "x86 generated."}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
