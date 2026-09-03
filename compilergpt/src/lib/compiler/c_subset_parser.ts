// c_subset_parser.ts — Pratt & Recursive Descent Parser for C-subset language.
// Lowers C syntax directly into the Common AST (ast.ts) so the entire backend pipeline is reused!

import { CToken, CTokenType } from "./c_subset_lexer";
import * as A from "./ast";
import { Diagnostic, DiagnosticBag } from "./diagnostics";

export function parseCSubset(tokens: CToken[]): { program: A.Program; diagnostics: Diagnostic[]; errors: Array<{ message: string; line: number; col: number }> } {
  let cur = 0;
  const diagBag = new DiagnosticBag();

  function peek(): CToken {
    return tokens[cur] || { type: "EOF", lexeme: "", line: 1, col: 1 };
  }

  function prev(): CToken {
    return tokens[cur - 1] || { type: "EOF", lexeme: "", line: 1, col: 1 };
  }

  function isAtEnd(): boolean {
    return peek().type === "EOF";
  }

  function check(type: CTokenType): boolean {
    if (isAtEnd()) return false;
    return peek().type === type;
  }

  function advance(): CToken {
    if (!isAtEnd()) cur++;
    return prev();
  }

  function match(...types: CTokenType[]): boolean {
    for (const t of types) {
      if (check(t)) {
        advance();
        return true;
      }
    }
    return false;
  }

  function consume(type: CTokenType, message: string, code = "E101"): CToken {
    if (check(type)) return advance();
    const tok = peek();
    diagBag.error(code, message, "parser", tok.line, tok.col);
    return tok;
  }

  // Error recovery synchronization
  function synchronize() {
    advance();
    while (!isAtEnd()) {
      if (prev().type === "SEMI") return;
      switch (peek().type) {
        case "INT":
        case "FLOAT":
        case "CHAR":
        case "VOID":
        case "IF":
        case "WHILE":
        case "FOR":
        case "RETURN":
        case "PRINTF":
          return;
      }
      advance();
    }
  }

  function parseType(): string {
    if (match("INT")) return "int";
    if (match("FLOAT")) return "float";
    if (match("CHAR")) return "char";
    if (match("VOID")) return "void";
    return "int";
  }

  function isTypeStart(): boolean {
    return check("INT") || check("FLOAT") || check("CHAR") || check("VOID");
  }

  // --- Expressions ---
  function parseExpression(): A.Expr {
    return parseAssignment();
  }

  function parseAssignment(): A.Expr {
    const expr = parseLogicalOr();
    if (match("ASSIGN")) {
      const equals = prev();
      const value = parseAssignment();
      if (expr.kind === "Ident") {
        return {
          id: A.nid(),
          kind: "Assign",
          name: expr.name,
          value,
          pos: { line: equals.line, col: equals.col },
        };
      }
      diagBag.error("E102", "Invalid assignment target in C expression", "parser", equals.line, equals.col);
    }
    return expr;
  }

  function parseLogicalOr(): A.Expr {
    let expr = parseLogicalAnd();
    while (match("OR")) {
      const op = prev().lexeme;
      const right = parseLogicalAnd();
      expr = {
        id: A.nid(),
        kind: "Binary",
        left: expr,
        op,
        right,
        pos: expr.pos,
      };
    }
    return expr;
  }

  function parseLogicalAnd(): A.Expr {
    let expr = parseEquality();
    while (match("AND")) {
      const op = prev().lexeme;
      const right = parseEquality();
      expr = {
        id: A.nid(),
        kind: "Binary",
        left: expr,
        op,
        right,
        pos: expr.pos,
      };
    }
    return expr;
  }

  function parseEquality(): A.Expr {
    let expr = parseRelational();
    while (match("EQ", "NEQ")) {
      const op = prev().lexeme;
      const right = parseRelational();
      expr = {
        id: A.nid(),
        kind: "Binary",
        left: expr,
        op,
        right,
        pos: expr.pos,
      };
    }
    return expr;
  }

  function parseRelational(): A.Expr {
    let expr = parseAdditive();
    while (match("LT", "LTE", "GT", "GTE")) {
      const op = prev().lexeme;
      const right = parseAdditive();
      expr = {
        id: A.nid(),
        kind: "Binary",
        left: expr,
        op,
        right,
        pos: expr.pos,
      };
    }
    return expr;
  }

  function parseAdditive(): A.Expr {
    let expr = parseMultiplicative();
    while (match("PLUS", "MINUS")) {
      const op = prev().lexeme;
      const right = parseMultiplicative();
      expr = {
        id: A.nid(),
        kind: "Binary",
        left: expr,
        op,
        right,
        pos: expr.pos,
      };
    }
    return expr;
  }

  function parseMultiplicative(): A.Expr {
    let expr = parseUnary();
    while (match("STAR", "SLASH", "PERCENT")) {
      const op = prev().lexeme;
      const right = parseUnary();
      expr = {
        id: A.nid(),
        kind: "Binary",
        left: expr,
        op,
        right,
        pos: expr.pos,
      };
    }
    return expr;
  }

  function parseUnary(): A.Expr {
    if (match("NOT", "MINUS")) {
      const op = prev().lexeme;
      const operand = parseUnary();
      return {
        id: A.nid(),
        kind: "Unary",
        op,
        operand,
        pos: { line: prev().line, col: prev().col },
      };
    }
    return parseCallOrIndex();
  }

  function parseCallOrIndex(): A.Expr {
    let expr = parsePrimary();
    while (true) {
      if (match("LPAREN")) {
        const p = prev();
        const args: A.Expr[] = [];
        if (!check("RPAREN")) {
          do {
            args.push(parseExpression());
          } while (match("COMMA"));
        }
        consume("RPAREN", "Expected ')' after function arguments in C call");
        const calleeName = expr.kind === "Ident" ? expr.name : "fn";
        expr = {
          id: A.nid(),
          kind: "Call",
          callee: calleeName,
          args,
          pos: { line: p.line, col: p.col },
        };
      } else if (match("LBRACKET")) {
        const p = prev();
        const index = parseExpression();
        consume("RBRACKET", "Expected ']' after array index");
        expr = {
          id: A.nid(),
          kind: "Index",
          array: expr,
          index,
          pos: { line: p.line, col: p.col },
        };
      } else {
        break;
      }
    }
    return expr;
  }

  function parsePrimary(): A.Expr {
    const tok = peek();
    if (match("INT_LIT")) {
      return { id: A.nid(), kind: "NumberLit", value: tok.value ?? parseInt(tok.lexeme, 10), pos: { line: tok.line, col: tok.col } };
    }
    if (match("FLOAT_LIT")) {
      return { id: A.nid(), kind: "FloatLit", value: tok.value ?? parseFloat(tok.lexeme), pos: { line: tok.line, col: tok.col } };
    }
    if (match("STRING_LIT")) {
      return { id: A.nid(), kind: "StringLit", value: tok.value ?? tok.lexeme, pos: { line: tok.line, col: tok.col } };
    }
    if (match("PRINTF")) {
      return { id: A.nid(), kind: "Ident", name: "print", pos: { line: tok.line, col: tok.col } };
    }
    if (match("IDENT")) {
      return { id: A.nid(), kind: "Ident", name: tok.lexeme, pos: { line: tok.line, col: tok.col } };
    }
    if (match("LPAREN")) {
      const expr = parseExpression();
      consume("RPAREN", "Expected ')' after grouped expression");
      return expr;
    }

    diagBag.error("E103", `Unexpected token '${tok.lexeme}' in C expression`, "parser", tok.line, tok.col);
    advance();
    return { id: A.nid(), kind: "NumberLit", value: 0, pos: { line: tok.line, col: tok.col } };
  }

  // --- Statements ---
  function parseBlock(): A.Block {
    const openBrace = consume("LBRACE", "Expected '{' to begin block in C");
    const body: A.Stmt[] = [];
    while (!check("RBRACE") && !isAtEnd()) {
      try {
        body.push(parseDeclarationOrStatement());
      } catch {
        synchronize();
      }
    }
    consume("RBRACE", "Expected '}' to close block in C");
    return { id: A.nid(), kind: "Block", body, pos: { line: openBrace.line, col: openBrace.col } };
  }

  function parseDeclarationOrStatement(): A.Stmt {
    if (isTypeStart()) {
      const typeStr = parseType();
      const nameTok = consume("IDENT", "Expected variable or function name after type in C declaration");
      const name = nameTok.lexeme;

      // Function declaration: type name(params) { ... }
      if (check("LPAREN")) {
        advance();
        const params: string[] = [];
        const paramTypes: string[] = [];
        if (!check("RPAREN")) {
          do {
            const pType = parseType();
            const pName = consume("IDENT", "Expected parameter name in C function header").lexeme;
            params.push(pName);
            paramTypes.push(pType);
          } while (match("COMMA"));
        }
        consume("RPAREN", "Expected ')' after parameters in C function declaration");
        const body = parseBlock();
        return {
          id: A.nid(),
          kind: "FnDecl",
          name,
          params,
          body,
          pos: { line: nameTok.line, col: nameTok.col },
        };
      }

      // Array declaration: int arr[5] = {1, 2, 3};
      if (match("LBRACKET")) {
        const sizeTok = match("INT_LIT") ? prev() : null;
        consume("RBRACKET", "Expected ']' after array size");
        let init: A.Expr | null = null;
        if (match("ASSIGN")) {
          if (match("LBRACE")) {
            const elements: A.Expr[] = [];
            if (!check("RBRACE")) {
              do {
                elements.push(parseExpression());
              } while (match("COMMA"));
            }
            consume("RBRACE", "Expected '}' after array initializer list");
            init = {
              id: A.nid(),
              kind: "ArrayLit",
              elements,
              pos: { line: nameTok.line, col: nameTok.col },
            };
          } else {
            init = parseExpression();
          }
        }
        consume("SEMI", "Expected ';' after C array declaration");
        return {
          id: A.nid(),
          kind: "LetStmt",
          name,
          init,
          pos: { line: nameTok.line, col: nameTok.col },
        };
      }

      // Variable declaration: int x = 10;
      let init: A.Expr | null = null;
      if (match("ASSIGN")) {
        init = parseExpression();
      }
      consume("SEMI", "Expected ';' after C variable declaration");
      return {
        id: A.nid(),
        kind: "LetStmt",
        name,
        init,
        pos: { line: nameTok.line, col: nameTok.col },
      };
    }

    // Statements
    if (match("IF")) {
      const ifTok = prev();
      consume("LPAREN", "Expected '(' after 'if' in C");
      const cond = parseExpression();
      consume("RPAREN", "Expected ')' after 'if' condition in C");
      const thenBlock = check("LBRACE") ? parseBlock() : { id: A.nid(), kind: "Block" as const, body: [parseDeclarationOrStatement()], pos: { line: ifTok.line, col: ifTok.col } };
      let elseBranch: A.Block | A.IfStmt | null = null;
      if (match("ELSE")) {
        if (check("IF")) {
          advance();
          consume("LPAREN", "Expected '(' after 'if' in C");
          const eCond = parseExpression();
          consume("RPAREN", "Expected ')' after 'if' condition in C");
          const eThen = check("LBRACE") ? parseBlock() : { id: A.nid(), kind: "Block" as const, body: [parseDeclarationOrStatement()], pos: { line: ifTok.line, col: ifTok.col } };
          elseBranch = {
            id: A.nid(),
            kind: "IfStmt",
            cond: eCond,
            then: eThen,
            elseBranch: null,
            pos: { line: ifTok.line, col: ifTok.col },
          };
        } else {
          elseBranch = check("LBRACE") ? parseBlock() : { id: A.nid(), kind: "Block" as const, body: [parseDeclarationOrStatement()], pos: { line: ifTok.line, col: ifTok.col } };
        }
      }
      return {
        id: A.nid(),
        kind: "IfStmt",
        cond,
        then: thenBlock,
        elseBranch,
        pos: { line: ifTok.line, col: ifTok.col },
      };
    }

    if (match("WHILE")) {
      const wTok = prev();
      consume("LPAREN", "Expected '(' after 'while' in C");
      const cond = parseExpression();
      consume("RPAREN", "Expected ')' after 'while' condition in C");
      const body = check("LBRACE") ? parseBlock() : { id: A.nid(), kind: "Block" as const, body: [parseDeclarationOrStatement()], pos: { line: wTok.line, col: wTok.col } };
      return {
        id: A.nid(),
        kind: "WhileStmt",
        cond,
        body,
        pos: { line: wTok.line, col: wTok.col },
      };
    }

    if (match("FOR")) {
      const fTok = prev();
      consume("LPAREN", "Expected '(' after 'for' in C");
      let init: A.Stmt | null = null;
      if (!match("SEMI")) {
        init = parseDeclarationOrStatement();
      }
      let cond: A.Expr | null = null;
      if (!check("SEMI")) {
        cond = parseExpression();
      }
      consume("SEMI", "Expected ';' after for loop condition in C");
      let update: A.Stmt | null = null;
      if (!check("RPAREN")) {
        const uExpr = parseExpression();
        update = { id: A.nid(), kind: "ExprStmt", expr: uExpr, pos: uExpr.pos };
      }
      consume("RPAREN", "Expected ')' after for loop headers in C");
      const body = check("LBRACE") ? parseBlock() : { id: A.nid(), kind: "Block" as const, body: [parseDeclarationOrStatement()], pos: { line: fTok.line, col: fTok.col } };
      return {
        id: A.nid(),
        kind: "ForStmt",
        init,
        cond,
        update,
        body,
        pos: { line: fTok.line, col: fTok.col },
      };
    }

    if (match("RETURN")) {
      const rTok = prev();
      let value: A.Expr | null = null;
      if (!check("SEMI")) {
        value = parseExpression();
      }
      consume("SEMI", "Expected ';' after return statement in C");
      return {
        id: A.nid(),
        kind: "ReturnStmt",
        value,
        pos: { line: rTok.line, col: rTok.col },
      };
    }


    if (check("LBRACE")) {
      return parseBlock();
    }

    // Expression statement
    const expr = parseExpression();
    consume("SEMI", "Expected ';' after C expression statement");
    return {
      id: A.nid(),
      kind: "ExprStmt",
      expr,
      pos: expr.pos,
    };
  }

  const body: A.Stmt[] = [];
  while (!isAtEnd()) {
    try {
      body.push(parseDeclarationOrStatement());
    } catch {
      synchronize();
    }
  }

  const program: A.Program = { id: A.nid(), kind: "Program", body, pos: { line: 1, col: 1 } };
  const rawErrors = diagBag.getErrors().map(d => ({ message: d.message, line: d.line, col: d.col }));
  return { program, diagnostics: diagBag.getAll(), errors: rawErrors };
}
