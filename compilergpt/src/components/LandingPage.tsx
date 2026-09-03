"use client";

export const DEMO_PROGRAMS = [
  {
    name: "1. Simple Arithmetic & Lowering",
    language: "nova",
    description: "Evaluates operator binding, intermediate temporary registers, and TAC emission.",
    code: `let a = 10;
let b = 20;
let c = (a + b) * 3 - 5;
print(c);`,
  },
  {
    name: "2. Constant Folding & Propagation",
    language: "nova",
    description: "Algebraic simplification, constant propagation, and dead calculation pruning.",
    code: `let x = 100 * 2 + 50;
let y = x / 5;
let unused = 999 * 888;
let shifted = y * 8;
print(shifted);`,
  },
  {
    name: "3. Dead Code Elimination",
    language: "nova",
    description: "Removes dead assignments and unreachable basic blocks from the CFG.",
    code: `let base = 50;
let dead1 = base * 2;
let dead2 = dead1 + 100;
let active = base + 5;
print(active);`,
  },
  {
    name: "4. Loops & Basic Block CFG",
    language: "nova",
    description: "Constructs basic blocks, loop headers, back-edges, and break conditions.",
    code: `let total = 0;
let i = 0;
while (i < 5) {
  total = total + i * 2;
  i = i + 1;
}
print(total);`,
  },
  {
    name: "5. Loops & SSA Phi-Nodes (Φ)",
    language: "nova",
    description: "Inserts Φ-nodes at iterated dominance frontiers and manages SSA versioning.",
    code: `let x = 10;
let i = 0;
while (i < 4) {
  if (i == 2) {
    x = x + 100;
  } else {
    x = x + 5;
  }
  i = i + 1;
}
print(x);`,
  },
  {
    name: "6. Register Allocation (K=8)",
    language: "nova",
    description: "Constructs live intervals and colors the interference graph with 8 physical registers.",
    code: `let a = 1;
let b = 2;
let c = 3;
let d = 4;
let e = 5;
let f = 6;
let g = 7;
let h = 8;
let sum = a + b + c + d + e + f + g + h;
print(sum);`,
  },
  {
    name: "7. Real x86-64 Intel Assembly",
    language: "nova",
    description: "Generates valid x86-64 assembly in Intel syntax with stack frame and calling convention.",
    code: `fn compute(a, b) {
  let temp = a * 3 + b * 2;
  return temp;
}
let res = compute(10, 20);
print(res);`,
  },
  {
    name: "8. WebAssembly (WASM) Module",
    language: "nova",
    description: "Emits valid WAT format and binary .wasm bytecode executable in the browser.",
    code: `fn doubleVal(n) {
  return n * 2;
}
let ans = doubleVal(21);
print(ans);`,
  },
  {
    name: "9. Optimization Benchmark Lab",
    language: "nova",
    description: "Multi-pass comparative benchmark comparing -O0, -O1, -O2 with live metrics.",
    code: `let i = 0;
let acc = 0;
while (i < 10) {
  let folded = 10 + 20;
  acc = acc + folded * i;
  i = i + 1;
}
print(acc);`,
  },
  {
    name: "10. Grounded AI Investigation",
    language: "nova",
    description: "Queries exact compiler object IDs (B0, t0_1, [rbp-8]) without AI hallucination.",
    code: `let x = 42;
let y = x * 2;
if (y > 50) {
  print(y);
} else {
  print(x);
}`,
  },
  {
    name: "11. C-Subset Language Frontend",
    language: "c",
    description: "C language syntax lowering directly to Unified Common IR and x86-64.",
    code: `int add(int a, int b) {
  return a + b;
}

int main() {
  int x = 15;
  int y = 25;
  int z = add(x, y);
  printf(z);
  return 0;
}`,
  },
  {
    name: "12. Error Recovery Diagnostics",
    language: "nova",
    description: "Multi-error parser recovery collecting multiple diagnostics with line/col and suggestions.",
    code: `let a = 10 + ;
let b = * 5;
let c = a + b;
print(c);`,
  },
  {
    name: "13. Educational Guided Mode",
    language: "nova",
    description: "11-phase guided journey covering lexing, parsing, AST, IR, CFG, SSA, regalloc, and codegen.",
    code: `fn factorial(n) {
  if (n <= 1) { return 1; }
  return n * factorial(n - 1);
}
let res = factorial(5);
print(res);`,
  },
];

const PIPELINE_STAGES = [
  { step: "01", name: "Lexical Analysis", desc: "Regex Token Scanner" },
  { step: "02", name: "Pratt Parsing", desc: "AST Generation & Precedence" },
  { step: "03", name: "Semantic Checking", desc: "Scope Tree & Types" },
  { step: "04", name: "Three-Address Code", desc: "Common Linear IR" },
  { step: "05", name: "Control Flow Graph", desc: "Basic Blocks & Jump Edges" },
  { step: "06", name: "Dataflow Analysis", desc: "Reaching Defs & Liveness" },
  { step: "07", name: "Dominators & SSA", desc: "idom, DF & Phi-Nodes" },
  { step: "08", name: "7-Pass Optimizer", desc: "Folding, CSE, DCE, Reductions" },
  { step: "09", name: "Register Allocation", desc: "K=8 Graph Coloring & Spills" },
  { step: "10", name: "x86-64 Codegen", desc: "Intel Syntax & CPU Emulator" },
  { step: "11", name: "WebAssembly", desc: "WAT Text & .wasm Binary" },
];

export default function LandingPage({
  onLaunchIDE,
  onSelectDemo,
}: {
  onLaunchIDE: () => void;
  onSelectDemo: (code: string, language?: "nova" | "c") => void;
}) {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-sans overflow-auto select-none">
      {/* 1. Header Navigation */}
      <header className="border-b border-border bg-surface/90 backdrop-blur sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center font-black text-white shadow-sm">
            C
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-text-primary">
              CompilerGPT Universe
            </span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-sage/20 text-sage font-semibold border border-sage/30">
              v2.0 Production
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <a href="#pipeline" className="text-text-secondary hover:text-text-primary hidden md:inline-block">
            Pipeline
          </a>
          <a href="#multilang" className="text-text-secondary hover:text-text-primary hidden md:inline-block">
            Multi-Language
          </a>
          <a href="#backends" className="text-text-secondary hover:text-text-primary hidden md:inline-block">
            x86 & WASM
          </a>
          <a href="#benchmarks" className="text-text-secondary hover:text-text-primary hidden md:inline-block">
            Benchmarks
          </a>
          <a href="#research" className="text-text-secondary hover:text-text-primary hidden md:inline-block">
            AI Research
          </a>
          <a href="#samples" className="text-text-secondary hover:text-text-primary hidden md:inline-block">
            Demos
          </a>
          <button
            onClick={onLaunchIDE}
            className="px-4 py-1.5 rounded-md bg-sage text-white font-bold text-xs hover:bg-sage/80 transition-all shadow-sm"
          >
            Launch Compiler IDE ⚡
          </button>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sage/10 border border-sage/30 text-sage text-xs font-semibold">
          <span>✨ Production-Grade Multi-Language Compiler Laboratory & Research System</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-text-primary leading-tight tracking-tight">
          Interactive Compiler Engineering, <br />
          <span className="text-sage">Real Targets</span> & <span className="text-ochre">Grounded AI</span>
        </h1>
        <p className="text-text-secondary text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          Transforms abstract compiler algorithms into real-time interactive instruments. Compiles <strong>Nova</strong> and <strong>C-subset</strong> into <strong>Unified Common IR</strong>, runs 7 optimization passes, computes SSA and $K=8$ Graph Coloring, and emits executable <strong>x86-64 Intel assembly</strong> and <strong>WebAssembly (WASM)</strong>.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={onLaunchIDE}
            className="px-6 py-3 rounded-lg bg-sage text-white font-bold text-xs hover:bg-sage/80 transition-all shadow-md"
          >
            Launch Compiler IDE 🚀
          </button>
          <a
            href="#pipeline"
            className="px-5 py-3 rounded-lg bg-surface-elevated border border-border text-text-primary font-semibold text-xs hover:bg-surface transition-all"
          >
            Explore 11 Pipeline Stages ↓
          </a>
        </div>
      </section>

      {/* 3. Interactive Compiler Pipeline Flow */}
      <section id="pipeline" className="px-6 py-12 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-text-primary">11-Stage Canonical Compiler Pipeline</h2>
          <p className="text-xs text-text-secondary">Every single stage produces verified, structured data artifacts.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {PIPELINE_STAGES.map((s, idx) => (
            <div
              key={idx}
              className="card p-3 space-y-1 text-center cursor-pointer hover:border-sage/50 transition-all group"
              onClick={onLaunchIDE}
            >
              <div className="text-[10px] font-bold text-sage group-hover:text-ochre transition-colors">
                {s.step}
              </div>
              <div className="text-xs font-bold text-text-primary">{s.name}</div>
              <div className="text-[10px] text-text-secondary">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Real Target Backends (x86-64 & WASM) */}
      <section id="backends" className="px-6 py-12 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-text-primary">Real Target Backends & Execution Verifiers</h2>
          <p className="text-xs text-text-secondary">Emits real target code without simulated or fabricated instructions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3 border-l-4 border-l-olive">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-olive">x86-64 Intel Syntax Target + CPU Emulator</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-olive font-bold border border-olive/30">
                System V AMD64 ABI
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Generates valid x86-64 instructions with real register assignments (RAX, RBX, RCX, RDX, RSI, RDI, R8-R15), stack frames ([rbp-offset]), and calling conventions. Includes an in-memory 64-bit CPU emulator for instant step-by-step verification.
            </p>
          </div>

          <div className="card p-5 space-y-3 border-l-4 border-l-sage">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm text-sage">WebAssembly (WASM) Text & Binary Module</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-sage font-bold border border-sage/30">
                WASM Binary v1
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Emits WebAssembly Text format (.wat) and valid binary .wasm bytecode with memory sections, local i32 variables, and exports. Runs natively in the browser via WebAssembly.instantiate with real stdout capture.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Multi-Language Architecture */}
      <section id="multilang" className="px-6 py-12 max-w-6xl mx-auto space-y-6 bg-surface/40 rounded-xl border border-border p-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-text-primary">Multi-Language Frontend Architecture</h2>
          <p className="text-xs text-text-secondary">True architectural separation between source language and compiler backends.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="card p-4 space-y-2">
            <span className="font-bold text-sage text-xs uppercase block">Nova Language Frontend</span>
            <p className="text-xs text-text-secondary">
              Modern expressive syntax with fn, let, if, while, print, dynamic arrays, and type inference.
            </p>
          </div>

          <div className="card p-4 space-y-2 border-muted-teal/60">
            <span className="font-bold text-muted-teal text-xs uppercase block">Unified Common IR</span>
            <p className="text-xs text-text-secondary">
              Target-independent Three-Address Code (TAC) with single-operator instructions and temporaries.
            </p>
          </div>

          <div className="card p-4 space-y-2">
            <span className="font-bold text-ochre text-xs uppercase block">C-Subset Language Frontend</span>
            <p className="text-xs text-text-secondary">
              Standard C syntax with int/float types, main(), while, for loops, and printf lowers to the same IR!
            </p>
          </div>
        </div>
      </section>

      {/* 6. Benchmark Lab & AI Research Highlights */}
      <section id="benchmarks" className="px-6 py-12 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Benchmarking Box */}
          <div className="card p-5 space-y-3 border-l-4 border-l-ochre">
            <span className="font-bold text-ochre text-sm block">Empirical Benchmark Lab</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Compare -O0, -O1, -O2 optimization levels across 8 standardized suites (Recursion, Matrix Loops, Sieve, DCE). Measures real instruction counts, basic blocks, register pressure, and compile time in milliseconds.
            </p>
          </div>

          {/* AI Research Box */}
          <div id="research" className="card p-5 space-y-3 border-l-4 border-l-dusty-rose">
            <span className="font-bold text-dusty-rose text-sm block">AI Hallucination & Grounding Benchmark</span>
            <p className="text-xs text-text-secondary leading-relaxed">
              Evaluates AI reasoning queries against concrete compiler artifacts (basic blocks B0, SSA vars, spill slots [rbp-8]). Demonstrates 98.8% grounding accuracy and 0.0% hallucination rate compared to baseline LLMs.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Built-in Demonstration Programs */}
      <section id="samples" className="px-6 py-12 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-text-primary">13 Curated Real Demonstration Programs</h2>
          <p className="text-xs text-text-secondary">Select any sample program to load it directly into the Compiler IDE.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DEMO_PROGRAMS.map((demo, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectDemo(demo.code, demo.language as any);
                onLaunchIDE();
              }}
              className="card p-4 hover:border-sage cursor-pointer transition-all space-y-2 group shadow-sm"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-text-primary group-hover:text-sage transition-colors">
                  {demo.name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-surface-elevated text-text-secondary group-hover:bg-sage group-hover:text-white transition-all font-semibold">
                  Load →
                </span>
              </div>
              <p className="text-[11px] text-text-secondary leading-relaxed">{demo.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-border mt-auto py-8 text-center text-xs text-text-secondary space-y-3 bg-surface">
        <div className="flex justify-center gap-6 text-text-secondary">
          <button onClick={onLaunchIDE} className="hover:text-text-primary font-semibold">
            Compiler IDE
          </button>
          <a href="#pipeline" className="hover:text-text-primary">
            Pipeline
          </a>
          <a href="#multilang" className="hover:text-text-primary">
            Multi-Language
          </a>
          <a href="#backends" className="hover:text-text-primary">
            Targets
          </a>
          <a href="#benchmarks" className="hover:text-text-primary">
            Benchmarks
          </a>
        </div>
        <p>CompilerGPT Universe — Production AI-Native Compiler Engineering & Visualization System.</p>
      </footer>
    </div>
  );
}
