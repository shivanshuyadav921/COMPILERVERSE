"use client";

export const DEMO_PROGRAMS = [
  {
    name: "Factorial Recursion",
    description: "Demonstrates recursive function calls, stack frames, and call graph edges.",
    code: `// Factorial Recursion
fn factorial(n) {
  if (n <= 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

let res = factorial(5);
print("Factorial of 5 is", res);
`,
  },
  {
    name: "Fibonacci Sequence",
    description: "Deep recursion showcasing interprocedural call tree and stack frames.",
    code: `// Fibonacci Sequence
fn fib(n) {
  if (n <= 1) { return n; }
  return fib(n - 1) + fib(n - 2);
}

let ans = fib(7);
print("Fibonacci of 7 is", ans);
`,
  },
  {
    name: "Nested Loops & Dataflow",
    description: "Constructs basic block CFG, Reaching Definitions, and Live Variables.",
    code: `// Nested Loops
let i = 0;
let total = 0;

while (i < 4) {
  let j = 0;
  while (j < 3) {
    total = total + i * j;
    j = j + 1;
  }
  i = i + 1;
}

print("Total matrix sum:", total);
`,
  },
  {
    name: "Array Allocation & Indexing",
    description: "Array lowering to dynamic allocation, index stores, and loads.",
    code: `// Array Operations
let numbers = [10, 20, 30, 40];
let first = numbers[0];
let second = numbers[1];
let sum = first + second;
print("Sum of elements:", sum);
`,
  },
  {
    name: "Optimization & Dead Code",
    description: "Tests Constant Folding, Strength Reduction, and Dead Code Elimination.",
    code: `// Optimization Benchmark
let base = 2;
let exponent = 3 + 5;
let result = base * exponent;
let unused = 100 * 50;

let shifted = base * 8; // Strength reduction -> shift
print("Result:", result, "Shifted:", shifted);
`,
  },
];

const PIPELINE_STAGES = [
  { step: "01", name: "Lexical Analysis", desc: "Tokens & Lexemes" },
  { step: "02", name: "Syntactic Parsing", desc: "AST Generation" },
  { step: "03", name: "Semantic Checking", desc: "Scope & Symbol Table" },
  { step: "04", name: "IR Generation", desc: "3-Address Code" },
  { step: "05", name: "Optimizations", desc: "Constant Folding & DCE" },
  { step: "06", name: "SSA Conversion", desc: "Dominance & Phi-Nodes" },
  { step: "07", name: "Reg Allocation", desc: "Graph Coloring K=8" },
  { step: "08", name: "CodeGen", desc: "x86_64 Assembly" },
];

export default function LandingPage({
  onLaunchIDE,
  onSelectDemo,
}: {
  onLaunchIDE: () => void;
  onSelectDemo: (code: string) => void;
}) {
  return (
    <div className="min-h-screen bg-bg text-gray-100 flex flex-col font-sans overflow-auto select-none">
      {/* Navbar Header */}
      <header className="border-b border-border bg-panel/90 backdrop-blur sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent via-accent2 to-warn flex items-center justify-center font-black text-white shadow-lg shadow-accent/20">
            C
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-accent2">
              CompilerGPT Universe
            </span>
            <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-accent/20 text-accent font-semibold border border-accent/30">
              v1.0 Production
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="#architecture"
            className="text-xs text-gray-400 hover:text-white transition-colors hidden md:inline-block"
          >
            Architecture
          </a>
          <a
            href="#pipeline"
            className="text-xs text-gray-400 hover:text-white transition-colors hidden md:inline-block"
          >
            Pipeline
          </a>
          <a
            href="#samples"
            className="text-xs text-gray-400 hover:text-white transition-colors hidden md:inline-block"
          >
            Demos
          </a>
          <button
            onClick={onLaunchIDE}
            className="px-4 py-2 rounded-lg bg-accent text-white font-bold text-xs hover:bg-accent/80 transition-all shadow-lg shadow-accent/25"
          >
            Launch Compiler IDE ⚡
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-semibold">
          <span>✨ Production-Grade Compiler IDE for Nova</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent2 to-warn leading-tight">
          Interactive Compiler Intelligence & Visualization Platform
        </h1>
        <p className="text-gray-400 text-sm md:text-base max-w-3xl mx-auto leading-relaxed">
          Combines the live assembly explorer of <strong>Compiler Explorer</strong>, the intermediate optimization pipeline of <strong>LLVM</strong>, the visual graphs of <strong>Graphviz</strong>, and <strong>Grounded AI Investigation</strong> into one unified web platform.
        </p>

        <div className="flex flex-wrap justify-center gap-4 pt-4">
          <button
            onClick={onLaunchIDE}
            className="px-8 py-3.5 rounded-xl bg-accent text-white font-extrabold text-sm hover:bg-accent/80 transition-all shadow-xl shadow-accent/30 scale-105 hover:scale-108"
          >
            Launch Live IDE Shell 🚀
          </button>
          <a
            href="#pipeline"
            className="px-6 py-3.5 rounded-xl bg-panel2 border border-border text-gray-300 font-bold text-sm hover:bg-panel transition-all"
          >
            Explore Pipeline Stages ↓
          </a>
        </div>
      </section>

      {/* Animated Pipeline Stage Flow Diagram */}
      <section id="pipeline" className="px-6 py-12 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-100">End-to-End Compiler Pipeline</h2>
          <p className="text-xs text-gray-400">Click any phase in the IDE to view real intermediate IR & data structures.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {PIPELINE_STAGES.map((s, idx) => (
            <div
              key={idx}
              className="bg-panel border border-border hover:border-accent/50 p-3 rounded-xl space-y-1.5 transition-all text-center group cursor-pointer"
              onClick={onLaunchIDE}
            >
              <div className="text-[10px] font-bold text-accent group-hover:text-accent2 transition-colors">
                {s.step}
              </div>
              <div className="text-xs font-bold text-gray-200">{s.name}</div>
              <div className="text-[10px] text-gray-500">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="px-6 py-16 max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-gray-100">Research-Grade Compiler Features</h2>
          <p className="text-xs text-gray-400">Every single visualization is driven by actual compiler output. Zero mocked data.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 space-y-3 hover:border-accent/50 transition-all">
            <div className="text-accent font-extrabold text-sm flex items-center gap-2">
              <span>⚡</span> Multi-Pass Compiler Explorer
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Side-by-side optimization level comparisons (-O0, -O1, -O2, -O3) with live assembly diffing and instruction reduction counters.
            </p>
          </div>

          <div className="card p-6 space-y-3 hover:border-accent2/50 transition-all">
            <div className="text-accent2 font-extrabold text-sm flex items-center gap-2">
              <span>🔄</span> SSA & Dominance Frontier
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Computes Immediate Dominators ($idom$), Dominance Frontiers ($DF$), places iterated $\Phi$-nodes, and tracks SSA versioning.
            </p>
          </div>

          <div className="card p-6 space-y-3 hover:border-warn/50 transition-all">
            <div className="text-warn font-extrabold text-sm flex items-center gap-2">
              <span>🎨</span> Graph Coloring RegAlloc
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Chaitin-Briggs register allocation algorithm with liveness intervals, Interference Graph matrix ($K=8$), and stack spill slots.
            </p>
          </div>

          <div className="card p-6 space-y-3 hover:border-accent/50 transition-all">
            <div className="text-accent font-extrabold text-sm flex items-center gap-2">
              <span>⏱️</span> Interactive Time-Travel Debugger
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Step-by-stage compilation snapshot recorder with Play, Pause, Step Next/Back, and line-by-line IR state inspection.
            </p>
          </div>

          <div className="card p-6 space-y-3 hover:border-accent2/50 transition-all">
            <div className="text-accent2 font-extrabold text-sm flex items-center gap-2">
              <span>🕸️</span> Interactive SVG Graph Engine
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Pan, zoom, search, node selection, edge highlighting, SVG export, and PNG export for CFGs, Call Graphs, and Dominator Trees.
            </p>
          </div>

          <div className="card p-6 space-y-3 hover:border-warn/50 transition-all">
            <div className="text-warn font-extrabold text-sm flex items-center gap-2">
              <span>🧠</span> Grounded AI Compiler Investigator
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Queries exact compiler object IDs (basic blocks 'B0', SSA vars 't0_1', spill slots '[rbp-8]') without hallucination.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack & Architecture Section */}
      <section id="architecture" className="px-6 py-12 max-w-6xl mx-auto space-y-8 bg-panel/30 rounded-2xl border border-border">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-100">Architecture & Technology Stack</h2>
          <p className="text-xs text-gray-400">Built for high performance, modularity, and zero runtime dependencies on external compilers.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-panel rounded-xl border border-border">
            <div className="font-extrabold text-accent text-sm">Next.js 14 & React 18</div>
            <div className="text-[10px] text-gray-400 mt-1">App Router & Server APIs</div>
          </div>
          <div className="p-4 bg-panel rounded-xl border border-border">
            <div className="font-extrabold text-accent2 text-sm">TypeScript 5</div>
            <div className="text-[10px] text-gray-400 mt-1">Strict Type Definitions</div>
          </div>
          <div className="p-4 bg-panel rounded-xl border border-border">
            <div className="font-extrabold text-warn text-sm">Monaco Editor</div>
            <div className="text-[10px] text-gray-400 mt-1">Nova Syntax Highlighting</div>
          </div>
          <div className="p-4 bg-panel rounded-xl border border-border">
            <div className="font-extrabold text-accent text-sm">Tailwind CSS</div>
            <div className="text-[10px] text-gray-400 mt-1">Modern UI Design System</div>
          </div>
        </div>
      </section>

      {/* Built-in Demo Presets */}
      <section id="samples" className="px-6 py-16 max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-100">Built-in Demonstration Programs</h2>
          <p className="text-xs text-gray-400">Select any sample program to load it directly into the Compiler IDE.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_PROGRAMS.map((demo, idx) => (
            <div
              key={idx}
              onClick={() => {
                onSelectDemo(demo.code);
                onLaunchIDE();
              }}
              className="card p-5 hover:border-accent/60 cursor-pointer transition-all space-y-2 group shadow-md"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-accent group-hover:text-accent2 transition-colors">
                  {demo.name}
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded bg-panel2 border border-border text-gray-300 group-hover:bg-accent group-hover:text-white transition-all font-semibold">
                  Load Demo →
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{demo.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* GitHub & CTA Footer */}
      <footer className="border-t border-border mt-auto py-12 text-center text-xs text-gray-500 space-y-4 bg-panel">
        <div className="flex justify-center gap-6 text-gray-400">
          <button onClick={onLaunchIDE} className="hover:text-accent font-semibold">
            Compiler IDE
          </button>
          <a href="#architecture" className="hover:text-accent">
            Architecture
          </a>
          <a href="#pipeline" className="hover:text-accent">
            Pipeline
          </a>
          <a href="#samples" className="hover:text-accent">
            Samples
          </a>
        </div>
        <p>CompilerGPT Universe — Advanced AI-Native Compiler Engineering & Visualization System.</p>
      </footer>
    </div>
  );
}
