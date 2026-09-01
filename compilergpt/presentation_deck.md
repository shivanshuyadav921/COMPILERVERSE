# PowerPoint Presentation Deck & Speaker Notes

## Slide 1: Title Slide
- **Title**: CompilerGPT Universe — Research-Grade Compiler Intelligence Platform
- **Sub-Title**: Real-Time Compilation, SSA, Graph Coloring, Time-Travel Debugging, and Grounded AI Analysis
- **Presenter**: Final Year Capstone Project Team
- **Speaker Notes**: "Good morning respected committee and examiners. Today we present CompilerGPT Universe, an AI-native compiler intelligence platform for the Nova language."

---

## Slide 2: Motivation & Background
- **Problem**: Compiler education and debugging are hindered by static, text-heavy tools.
- **Goal**: Build an IDE combining Compiler Explorer, LLVM Explorer, Chrome DevTools, and Grounded AI into one unified web platform.
- **Speaker Notes**: "While Compiler Explorer shows assembly, students and engineers cannot interactively scrub through SSA conversion or inspect interference graph coloring."

---

## Slide 3: System Architecture Overview
- Single canonical pipeline: Lexer → Parser → AST → Semantics → TAC IR → CFG → Dataflow → SSA → RegAlloc → Call Graph → Memory Layout → Assembly → Snapshots.
- **Speaker Notes**: "Notice how every stage feeds structured data into both the UI visualizers and the AI investigator."

---

## Slide 4: Real Dataflow Analysis & Fixpoint Solvers
- Reaching Definitions, Live Variables, Available Expressions, Def-Use ($DU$) & Use-Def ($UD$) chains.
- **Speaker Notes**: "We implement real iterative fixpoint equations for dataflow analysis rather than mocked static outputs."

---

## Slide 5: SSA & Dominance Frontiers
- Immediate Dominators ($idom$), Dominance Frontiers ($DF$), Iterated DF $\Phi$-node placement ($\Phi(x_1, x_2)$), and SSA variable versioning ($x_0, x_1$).
- **Speaker Notes**: "Here you see how $\Phi$-nodes are automatically placed at control-flow merge points in basic blocks."

---

## Slide 6: Chaitin-Briggs Graph Coloring Register Allocation
- Liveness interval calculation, Interference Graph building, $K=8$ physical registers (`R0`–`R7`), and memory stack spills (`[rbp-N]`).
- **Speaker Notes**: "When variable degree exceeds K=8 physical registers, the allocator automatically computes stack spill offsets."

---

## Slide 7: Live Animated Compiler Timeline & Debugger
- Time-travel snapshot recorder supporting Play, Pause, Rewind, Step Next/Back, and line-by-line phase debugging.
- **Speaker Notes**: "Users can scrub through compilation snapshots step-by-step or debug line-by-line."

---

## Slide 8: Interactive Graph Engine & Export Capabilities
- Zoom, pan, search, node selection, edge highlighting, SVG export, and PNG export for AST, CFG, Dominator Tree, Call Graph, and Interference Graph.
- **Speaker Notes**: "All graphs support vector SVG and raster PNG exports for research publications."

---

## Slide 9: Grounded AI Compiler Investigator
- Context-grounded mentor passing exact compiler IDs (`B0`, `t1_0`, `[rbp-8]`) to guarantee zero AI hallucination.
- **Speaker Notes**: "By providing exact compiler object IDs to the LLM context, we eliminate ungrounded claims."

---

## Slide 10: Multi-File Project Workspace & Plugins
- Multi-file virtual project manager (`Main.nova`, `Math.nova`, `Utils.nova`) and dynamic `CompilerPluginRegistry`.
- **Speaker Notes**: "Developers can register custom optimization passes using our extensible plugin API."

---

## Slide 11: Experimental Results & Performance
- Compile Time: $< 1.5 \text{ ms}$ average.
- Production Build: $100\%$ successful static page generation ($7/7$ routes).
- Unit Test Coverage: $16/16$ integration & stress test suites passing.
- **Speaker Notes**: "Our production build compiles cleanly with zero TypeScript errors and zero ESLint warnings."

---

## Slide 12: Conclusion & Future Scope
- Summary of achievements and future research directions (Wasm backend, System V AMD64 calling conventions).
- **Speaker Notes**: "Thank you for your time. We are now open for viva questions."
