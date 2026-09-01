# Compiler Engineering Viva & Technical Q&A Guide

## Core Compiler Questions

### Q1: What is Three-Address Code (TAC) and why is it useful?
**Answer**: Three-Address Code is an intermediate representation (IR) where each instruction has at most one operator and at most three operands. It linearizes complex nested AST expressions into simple sequence instructions using temporary variables (`t0 = a + b`, `t1 = t0 * c`), simplifying code generation and optimization passes.

### Q2: What is Static Single Assignment (SSA) form?
**Answer**: SSA is a property of intermediate representations where every variable is assigned/defined exactly once. At control-flow merge points (e.g. after an `if`/`else` or at a loop header), $\phi$-nodes ($\Phi$) are inserted to select the appropriate variable version based on the predecessor basic block from which control arrived.

### Q3: How are $\phi$-nodes placed efficiently in SSA construction?
**Answer**: $\phi$-nodes are placed using **Iterated Dominance Frontiers (IDF)**. If a basic block $B$ defines variable $v$, a $\phi$-node for $v$ must be placed at every block in the dominance frontier $DF(B)$, and iteratively in $DF(y)$ for newly inserted $\phi$-nodes.

### Q4: Explain the difference between Reaching Definitions and Live Variable Analysis.
**Answer**: 
- **Reaching Definitions** is a forward dataflow analysis determining which variable definitions may reach a given program point without being redefined. It uses set union meet operators over predecessor blocks.
- **Live Variable Analysis** is a backward dataflow analysis determining whether a variable's current value will be used along any execution path before being overwritten. It uses set union meet operators over successor blocks.

### Q5: How does Chaitin-Briggs Graph Coloring Register Allocation work?
**Answer**:
1. Build an Interference Graph where nodes are variables/temporaries, and edges connect variables that are live simultaneously.
2. Simplify: Repeatedly remove nodes with degree $< K$ (where $K$ is the number of physical registers) and push them onto a stack.
3. Spill: If all remaining nodes have degree $\ge K$, pick a candidate to spill to memory stack offset.
4. Color: Pop nodes off stack and assign available physical registers that do not conflict with neighbors.

### Q6: Why must Constant Propagation clear its known constant map at loop back-edge labels?
**Answer**: Labels are jump targets reachable from multiple control-flow paths (including loop back-edges where variable values change across iterations). Without clearing known constant states at merge points (or computing dataflow join lattices), constant propagation would unsoundly propagate pre-loop constants into loop bodies.

### Q7: What is a Dominance Frontier ($DF$)?
**Answer**: The Dominance Frontier of a basic block $X$ is the set of all basic blocks $Y$ such that $X$ dominates a predecessor of $Y$, but $X$ does not strictly dominate $Y$ itself.
