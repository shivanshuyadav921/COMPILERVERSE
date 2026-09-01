# CompilerGPT Universe — Research-Grade Compiler Intelligence Platform

An industrial-grade, AI-native compiler intelligence and visualization platform for the **Nova** programming language.

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
* **AI Compiler Investigator**: Grounded AI mentor referencing exact object IDs (`B0`, `t1_0`, `[rbp-8]`, `d#12`).
* **Multi-File Project Workspace**: Virtual file explorer (`Main.nova`, `Math.nova`, `Utils.nova`) with cross-file call graphs.
* **Metrics Dashboard**: Real-time performance cards for compile time, tokens, AST nodes, basic blocks, SSA vars, Phi nodes, register counts, and memory footprint.
* **Session Recording & Export**: Export session transcripts to JSON and technical reports to HTML/PDF.
* **Extensible Plugin System**: Plugin API for custom optimization and analysis passes.

---

## 🛠 Project Structure

```
src/
  app/
    page.tsx                      # Main IDE & multi-tab visualizer shell
    api/compile/route.ts          # Core compiler pipeline endpoint
    api/mentor/route.ts           # Grounded AI Investigator endpoint
  components/                     # Compiler Explorer, Timeline, Graph Canvas, Scope Tree,
                                  # Debugger, SSA, RegAlloc, Dataflow, Metrics, Workspace, Palette
  lib/compiler/
    lexer.ts                      # Hand-written scanner
    parser.ts                     # Recursive descent + Pratt parser
    semantic.ts                   # Scope resolution & symbol table
    ir.ts                         # Three-Address Code generator
    optimize.ts                   # 7 optimization passes
    cfg.ts                        # Basic block CFG builder
    dataflow.ts                   # Iterative dataflow analyzer
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
    asm.ts                        # Target pseudo-assembly generator
    pipeline.ts                   # End-to-end compiler orchestrator
    __tests__/compiler.test.ts    # Unit & regression test suite
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

---

## 📄 Documentation

* [Architecture Specification](architecture.md)
* [Viva Questions & Technical Guide](viva_questions.md)
* [Technical Report](technical_report.md)
