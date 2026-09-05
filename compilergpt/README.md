# CompilerGPT Universe — Research-Grade Compiler Intelligence Platform

An industrial-grade, AI-native compiler intelligence and visualization platform for the **Nova** programming language (with full C-subset support).

CompilerGPT Universe integrates features inspired by **JetBrains IDE**, **Compiler Explorer (godbolt.org)**, **LLVM Explorer**, **Chrome DevTools**, and **GitHub Copilot**. Every compiler stage represents real computation — zero hardcoding or faked output.

---

## 🚀 Key Features

* **Compiler Explorer Mode**: Side-by-side optimization level comparison (`-O0`, `-O1`, `-O2`, `-O3`) with instruction count deltas.
* **Live Animated Compiler Timeline**: Interactive scrubbable time-travel debugger with Play, Pause, Rewind, Step Next/Back, and Speed controls.
* **Dataflow Analysis Engine**: Reaching Definitions, Live Variable Analysis, Available Expressions, Def-Use ($DU$) & Use-Def ($UD$) chains.
* **SSA & Dominator Tree**: Dominance Frontiers ($DF$), Immediate Dominators ($idom$), $\phi$-nodes ($\Phi(x_1, x_2)$), and SSA variable versioning ($x_0, x_1$).
* **Chaitin-Briggs Register Allocation**: Liveness intervals, Interference Graph ($V, E$), $K=8$ physical register allocation (`R0`–`R7`), and stack spill offsets (`[rbp-N]`).
* **Visual Scope Tree**: Collapsible lexical scope hierarchy (`Global` → `fn` → `if` → `while`) with symbol offsets and usage counts.
* **Interactive Graph Engine**: Pan, zoom, node selection, edge highlighting, and SVG export for Call Graphs and CFGs.
* **Phase Line Debugger**: Step line-by-line through source code while inspecting Lexer tokens, AST nodes, TAC IR, and target Assembly.
* **AI Compiler Investigator**: Grounded AI mentor referencing exact object IDs (`B0`, `t1_0`, `[rbp-8]`, `d#12`). Uses Claude API with automatic rule-based fallback.
* **Multi-Language Frontend**: Write **Nova** or **C-subset** code — both lower to the same Common IR and go through the full pipeline.
* **Metrics Dashboard**: Real-time performance cards for compile time, tokens, AST nodes, basic blocks, SSA vars, Phi nodes, register counts, and memory footprint.
* **Session Recording & Export**: Export session transcripts to JSON and technical reports to HTML.
* **Shareable Sessions**: One-click URL encoding of current compilation state for sharing and reproduction.
* **Light/Dark Theme**: Full semantic color system with warm dark (default) and warm ivory light themes.
* **Extensible Plugin System**: Plugin API for custom optimization and analysis passes.

---

## 🛠 Project Structure

```
src/
  app/
    page.tsx                      # Main IDE & multi-tab visualizer shell
    api/compile/route.ts          # Core compiler pipeline endpoint
    api/mentor/route.ts           # Grounded AI Investigator endpoint
    api/share/route.ts            # Session sharing endpoint
    api/test/route.ts             # Compiler test suite runner endpoint
  components/                     # 37 components: Compiler Explorer, Timeline, Graph Canvas,
                                  # Scope Tree, Debugger, SSA, RegAlloc, Dataflow, Metrics,
                                  # Workspace, Palette, Settings, Terminal Console, Landing Page
  lib/compiler/
    lexer.ts                      # Hand-written scanner (Nova)
    parser.ts                     # Recursive descent + Pratt parser
    c_subset_lexer.ts             # C-subset lexer frontend
    c_subset_parser.ts            # C-subset parser lowering to common AST
    semantic.ts                   # Scope resolution & symbol table
    ast.ts                        # AST node type definitions
    ir.ts                         # Three-Address Code generator
    optimize.ts                   # 7 optimization passes (real IR transforms)
    cfg.ts                        # Basic block CFG builder
    dataflow.ts                   # Iterative dataflow analyzer (RD, LV, AE, DU/UD chains)
    dominator.ts                  # Dominator Tree & DF computer
    ssa.ts                        # SSA transformer & Phi-node placer
    regalloc.ts                   # Chaitin-Briggs graph coloring allocator
    callgraph.ts                  # Interprocedural Call Graph builder
    memorylayout.ts               # Stack frame offset calculator
    scope.ts                      # Lexical Scope Tree builder
    snapshot.ts                   # Time-travel timeline snapshot engine
    optimizationLevels.ts         # Preset -O0..-O3 optimization levels
    workspace.ts                  # Multi-file workspace compiler
    metrics.ts                    # Real-time metrics engine
    plugins.ts                    # Extensible Plugin API system
    session.ts                    # Session recorder & HTML/PDF exporter
    share.ts                      # Shareable session URL codec
    asm.ts                        # Target pseudo-assembly generator
    x86_gen.ts                    # Real x86-64 Intel syntax assembly backend
    x86_emulator.ts               # In-memory x86-64 CPU emulator
    wasm.ts                       # WebAssembly WAT generator & binary encoder
    hallucinationBenchmark.ts     # AI grounding benchmark evaluation engine
    parsetable.ts                 # Parse trace generator
    pipeline.ts                   # End-to-end compiler orchestrator
    __tests__/compiler.test.ts    # Unit & regression test suite (20 tests)
scripts/
  test-runner.js                  # Node.js test runner CLI
```

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

### Production Build

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run typecheck
```

Runs `tsc --noEmit` for full TypeScript validation across all 37 components and 31 compiler modules.

### Running Tests

```bash
npm run test
```

This runs all 20 compiler tests **standalone** via `tsx` — no dev server required. Tests directly exercise the compiler modules: lexer, parser, semantic analysis, IR generation, optimization (7 passes), CFG, dataflow, SSA, dominator tree, register allocation, C-subset compilation, x86-64 backend, WASM WAT generation, AI benchmark, and session codec.

During development, you can also hit the `/api/test` endpoint directly (disabled in production by default; set `ENABLE_TEST_ENDPOINT=true` to enable):

```
GET http://localhost:3000/api/test
```


---

## ⚙️ AI Mentor Setup (Optional)

The AI Compiler Investigator works in two modes:

1. **Claude API mode** (recommended): Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_key_here
   ```
   The mentor will use Claude to reason over your actual compiler artifacts.

2. **Rule-based fallback** (default): If no API key is configured, the mentor automatically answers SSA, register allocation, dominator, and optimization questions using pure artifact inspection logic. Always grounded — never hallucinates.

---

## 📄 Documentation

* [Architecture Specification](architecture.md)
* [Viva Questions & Technical Guide](viva_questions.md)
* [Technical Report](technical_report.md)
* [Academic Review](academic_review.md)
* [IEEE Paper](ieee_paper.md)
