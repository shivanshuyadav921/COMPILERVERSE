# 10-Minute Live Demonstration Script

## Step 1: Landing Page & Preset Selection (0:00 - 1:30)
- **Action**: Open CompilerGPT Universe home page. Point out the Hero section, capability cards, and Demo Presets.
- **Script**: "Welcome to CompilerGPT Universe. We begin on our Landing Page. I'll click the 'Factorial Recursion' demo preset and launch the IDE."

## Step 2: Source Code & Compiler Explorer Mode (1:30 - 3:00)
- **Action**: Select the **Compiler Explorer** tab. Show side-by-side `-O0` vs `-O3` IR and Assembly outputs. Point out instruction count deltas.
- **Script**: "In Compiler Explorer mode, we can compare unoptimized -O0 with optimized -O3 IR and Assembly side-by-side, seeing immediate instruction reductions."

## Step 3: Dataflow Analysis & SSA Phi Placement (3:00 - 5:00)
- **Action**: Click the **SSA Form** and **Dominator Tree** tabs. Show $\Phi$-nodes in basic blocks and immediate dominators ($idom$).
- **Script**: "Under the SSA tab, notice how Iterated Dominance Frontiers calculated $\Phi$-nodes at control-flow merge points."

## Step 4: Register Allocation & Interference Graph (5:00 - 6:30)
- **Action**: Open **Reg Allocation** and **Interactive Canvas**. Switch canvas to **Interference Graph**. Filter nodes and export PNG.
- **Script**: "Here under Register Allocation, Chaitin-Briggs graph coloring assigns physical registers R0–R7 and manages stack spills."

## Step 5: Live Timeline & Line Debugger (6:30 - 8:00)
- **Action**: Open **Phase Debugger**. Step through source lines and watch tokens, AST, TAC IR, and Assembly update in real time.
- **Script**: "Our Phase Debugger allows line-by-line stepping while inspecting emitted tokens, TAC IR, and Assembly."

## Step 6: Grounded AI Compiler Investigator & Export (8:00 - 10:00)
- **Action**: Open **AI Mentor** tab. Type *"Why was variable 'unused' eliminated?"*. Export session transcript to JSON and HTML.
- **Script**: "Finally, our AI Investigator uses exact compiler object IDs to explain dead code elimination without hallucination. We can export our session transcript to JSON or HTML."
