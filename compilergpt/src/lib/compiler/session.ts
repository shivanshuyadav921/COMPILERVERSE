// session.ts — Session Recording, JSON Export, and PDF/HTML Report Generator for Nova Compiler.

import { CompileResult } from "./pipeline";

export interface SessionRecord {
  id: string;
  timestamp: string;
  source: string;
  compileResult: CompileResult;
}

export function createSessionRecord(result: CompileResult): SessionRecord {
  return {
    id: `session_${Date.now()}`,
    timestamp: new Date().toISOString(),
    source: result.source,
    compileResult: result,
  };
}

export function exportSessionJSON(session: SessionRecord) {
  const jsonStr = JSON.stringify(session, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `compilergpt_session_${Date.now()}.json`;
  link.click();
}

export function exportHTMLReport(result: CompileResult) {
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>CompilerGPT Universe — Technical Report</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0a0a0f; color: #e1e1e6; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #7c5cff; }
    pre { background: #191922; border: 1px solid #242430; padding: 12px; border-radius: 6px; font-family: monospace; }
    .card { background: #12121a; border: 1px solid #242430; padding: 16px; margin-bottom: 16px; border-radius: 8px; }
    .metric { color: #38e1c6; font-weight: bold; }
  </style>
</head>
<body>
  <h1>CompilerGPT Universe — Technical Report</h1>
  <p>Generated on ${new Date().toLocaleString()}</p>
  
  <div class="card">
    <h2>Performance & Metrics</h2>
    <p>Compile Time: <span class="metric">${result.metrics?.compileTimeMs || 0} ms</span></p>
    <p>Tokens: <span class="metric">${result.metrics?.tokenCount || 0}</span></p>
    <p>AST Nodes: <span class="metric">${result.metrics?.astNodeCount || 0}</span></p>
    <p>Optimizations Applied: <span class="metric">${result.metrics?.optimizationsApplied || 0}</span></p>
    <p>Physical Registers Used: <span class="metric">${result.metrics?.allocatedRegistersCount || 0} / 8</span></p>
  </div>

  <div class="card">
    <h2>Source Program</h2>
    <pre>${result.source}</pre>
  </div>

  <div class="card">
    <h2>Optimized IR</h2>
    <pre>${result.irOptimized.join("\n")}</pre>
  </div>

  <div class="card">
    <h2>Generated Assembly</h2>
    <pre>${result.assembly.map(a => a.text).join("\n")}</pre>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `compilergpt_report_${Date.now()}.html`;
  link.click();
}
