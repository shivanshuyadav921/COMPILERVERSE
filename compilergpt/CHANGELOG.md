# Changelog

All notable changes to **CompilerGPT Universe** will be documented in this file.

## [1.0.0] - 2026-07-17

### Added
- **Compiler Core**: Hand-written Lexer, Recursive-descent Pratt Parser, Semantic Analyzer, Three-Address Code IR, CFG Builder.
- **Advanced Analysis**: Iterative Dataflow Framework ($RD, LV, AE, DU/UD$), Dominator Trees ($idom, DF$), Static Single Assignment (SSA) with $\phi$-nodes, Chaitin-Briggs Graph Coloring Register Allocation ($K=8$), Interprocedural Call Graph, Stack Frame Memory Layout.
- **Compiler Explorer Mode**: Preset optimization levels (`-O0`, `-O1`, `-O2`, `-O3`) with side-by-side instruction count deltas.
- **Interactive Timeline**: Step-by-stage compilation snapshot recorder with Play, Pause, Rewind, and speed controls.
- **Compiler Debugger**: Line-by-line phase debugging.
- **Interactive Graph Canvas**: Zoom, pan, search, SVG/PNG export for Call Graph, CFG, Dominator Tree, and Interference Graphs.
- **AI Compiler Investigator**: Grounded AI mentor referencing exact artifact IDs (`B0`, `t1_0`, `[rbp-8]`).
- **Multi-File Workspace**: Virtual file project manager (`Main.nova`, `Math.nova`, `Utils.nova`).
- **Metrics Dashboard**: Real-time stats for compile time, tokens, AST nodes, basic blocks, SSA vars, Phi nodes, and memory footprint.
- **Extensible Plugin System**: Plugin API for custom passes.
