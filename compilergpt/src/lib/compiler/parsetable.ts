// parsetable.ts — Parse Table and Execution Trace Generator for Nova Parser.

import { Token } from "./lexer";

export interface ParseStep {
  step: number;
  symbolStack: string[];
  inputToken: string;
  action: "SHIFT" | "REDUCE" | "ACCEPT";
  productionRule: string;
  line: number;
}

export function generateParseTrace(tokens: Token[]): ParseStep[] {
  const steps: ParseStep[] = [];
  const stack: string[] = ["$"];
  let stepCounter = 1;

  tokens.forEach(tok => {
    if (tok.type === "EOF") return;

    // Shift step
    stack.push(tok.type);
    steps.push({
      step: stepCounter++,
      symbolStack: [...stack],
      inputToken: `${tok.type}("${tok.lexeme}")`,
      action: "SHIFT",
      productionRule: `Shift '${tok.lexeme}' onto parser stack`,
      line: tok.line,
    });

    // Reduce step heuristic for Nova grammar constructs
    if (["SEMI", "RBRACE", "RPAREN"].includes(tok.type)) {
      const reducedSymbol = tok.type === "SEMI" ? "Stmt" : tok.type === "RBRACE" ? "Block" : "Expr";
      stack.pop();
      stack.push(reducedSymbol);
      steps.push({
        step: stepCounter++,
        symbolStack: [...stack],
        inputToken: `${tok.type}("${tok.lexeme}")`,
        action: "REDUCE",
        productionRule: `Reduce stack to ${reducedSymbol}`,
        line: tok.line,
      });
    }
  });

  steps.push({
    step: stepCounter++,
    symbolStack: ["Program"],
    inputToken: "EOF",
    action: "ACCEPT",
    productionRule: "Accept complete Program AST",
    line: tokens[tokens.length - 1]?.line || 1,
  });

  return steps;
}
