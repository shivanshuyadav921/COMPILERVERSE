// metrics.ts — Real-time Compiler Performance & Artifact Metrics Engine.

export interface CompilerMetrics {
  tokenCount: number;
  astNodeCount: number;
  symbolCount: number;
  basicBlockCount: number;
  edgeCount: number;
  unoptimizedIRCount: number;
  optimizedIRCount: number;
  optimizationsApplied: number;
  phiNodeCount: number;
  allocatedRegistersCount: number;
  spillsCount: number;
  assemblyLineCount: number;
  compileTimeMs: number;
  estimatedMemoryKB: number;
}

export function computeMetrics(result: any, startTimeMs: number): CompilerMetrics {
  const endTimeMs = performance.now ? performance.now() : Date.now();
  const compileTimeMs = Math.max(0.1, Math.round((endTimeMs - startTimeMs) * 100) / 100);

  let astNodeCount = 0;
  function countNodes(node: any) {
    if (!node) return;
    astNodeCount++;
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (Array.isArray(v)) v.forEach(item => countNodes(item));
      else if (v && typeof v === "object" && v.kind) countNodes(v);
    }
  }
  countNodes(result.ast);

  const appliedOpts = (result.optimizationLogs || []).reduce((acc: number, l: any) => acc + (l.changes?.length || 0), 0);

  const estimatedMemoryKB = Math.round(
    (JSON.stringify(result).length * 2) / 1024
  );

  return {
    tokenCount: (result.tokens || []).filter((t: any) => t.type !== "EOF").length,
    astNodeCount,
    symbolCount: result.symbolTable?.length || 0,
    basicBlockCount: result.cfgAfter?.blocks?.length || 0,
    edgeCount: result.cfgAfter?.edges?.length || 0,
    unoptimizedIRCount: result.irRaw?.length || 0,
    optimizedIRCount: result.irOptimizedRaw?.length || 0,
    optimizationsApplied: appliedOpts,
    phiNodeCount: result.ssa?.phiNodes?.length || 0,
    allocatedRegistersCount: result.regAlloc?.maxRegistersUsed || 0,
    spillsCount: result.regAlloc?.spills?.length || 0,
    assemblyLineCount: result.assembly?.length || 0,
    compileTimeMs,
    estimatedMemoryKB,
  };
}
