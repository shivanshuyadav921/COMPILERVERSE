// plugins.ts — Extensible Compiler Plugin System Architecture for Nova.

import { IRInstr } from "./ir";
import { OptimizationLog } from "./optimize";

export interface CompilerPluginPass {
  id: string;
  name: string;
  description: string;
  transform: (code: IRInstr[]) => { code: IRInstr[]; log: OptimizationLog };
}

export interface CompilerPluginAnalysis {
  id: string;
  name: string;
  analyze: (code: IRInstr[]) => Record<string, any>;
}

class CompilerPluginRegistry {
  private passes: Map<string, CompilerPluginPass> = new Map();
  private analyses: Map<string, CompilerPluginAnalysis> = new Map();

  registerPass(pass: CompilerPluginPass) {
    this.passes.set(pass.id, pass);
  }

  registerAnalysis(analysis: CompilerPluginAnalysis) {
    this.analyses.set(analysis.id, analysis);
  }

  getPasses(): CompilerPluginPass[] {
    return Array.from(this.passes.values());
  }

  getAnalyses(): CompilerPluginAnalysis[] {
    return Array.from(this.analyses.values());
  }

  runPluginPasses(code: IRInstr[]): { code: IRInstr[]; logs: OptimizationLog[] } {
    let cur = code;
    const logs: OptimizationLog[] = [];
    this.passes.forEach(p => {
      const res = p.transform(cur);
      cur = res.code;
      logs.push(res.log);
    });
    return { code: cur, logs };
  }
}

export const pluginRegistry = new CompilerPluginRegistry();

// Default Example Plugin: Redundant Negation Elimination (-(-x) => x)
pluginRegistry.registerPass({
  id: "negationElimination",
  name: "Redundant Negation Elimination",
  description: "Eliminates double negation operations: neg(neg(x)) -> x",
  transform: (code) => {
    const changes: string[] = [];
    const out: IRInstr[] = [];
    for (let i = 0; i < code.length; i++) {
      const cur = code[i];
      const next = code[i + 1];
      if (cur.op === "neg" && next && next.op === "neg" && next.arg1 === cur.result) {
        changes.push(`Double negation ${next.result} = neg(neg(${cur.arg1})) simplified to assign ${next.result} = ${cur.arg1}`);
        out.push({ ...next, op: "assign", arg1: cur.arg1, arg2: undefined });
        i++;
        continue;
      }
      out.push(cur);
    }
    return { code: out, log: { pass: "Redundant Negation Elimination (Plugin)", changes } };
  },
});
