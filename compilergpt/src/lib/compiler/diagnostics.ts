// diagnostics.ts — Unified compiler diagnostic and error recovery data structures.

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  code: string;           // e.g. "E001", "E002", "W001"
  message: string;
  severity: DiagnosticSeverity;
  phase: "lexer" | "parser" | "semantic" | "codegen";
  line: number;
  col: number;
  endLine?: number;
  endCol?: number;
  suggestion?: string;
}

export class DiagnosticBag {
  private diagnostics: Diagnostic[] = [];

  add(diag: Diagnostic) {
    this.diagnostics.push(diag);
  }

  error(code: string, message: string, phase: Diagnostic["phase"], line: number, col: number, suggestion?: string) {
    this.add({ code, message, severity: "error", phase, line, col, suggestion });
  }

  warning(code: string, message: string, phase: Diagnostic["phase"], line: number, col: number, suggestion?: string) {
    this.add({ code, message, severity: "warning", phase, line, col, suggestion });
  }

  info(code: string, message: string, phase: Diagnostic["phase"], line: number, col: number, suggestion?: string) {
    this.add({ code, message, severity: "info", phase, line, col, suggestion });
  }

  hasErrors(): boolean {
    return this.diagnostics.some(d => d.severity === "error");
  }

  getErrors(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === "error");
  }

  getWarnings(): Diagnostic[] {
    return this.diagnostics.filter(d => d.severity === "warning");
  }

  getAll(): Diagnostic[] {
    return [...this.diagnostics];
  }

  clear() {
    this.diagnostics = [];
  }
}
