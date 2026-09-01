// parser.ts — Real recursive-descent (with Pratt expression parsing) parser.
// Produces an actual AST from the token stream; no hardcoded trees.

import { Token, TokenType } from "./lexer";
import * as A from "./ast";

export interface ParseError { message: string; line: number; col: number; }

const PREC: Record<string, number> = {
  OR: 1, AND: 2,
  EQ: 3, NEQ: 3,
  LT: 4, GT: 4, LTE: 4, GTE: 4,
  PLUS: 5, MINUS: 5,
  STAR: 6, SLASH: 6, PERCENT: 6,
};

export class Parser {
  private pos = 0;
  errors: ParseError[] = [];

  constructor(private tokens: Token[]) { A.resetIdCounter(); }

  private peek(o = 0): Token { return this.tokens[Math.min(this.pos + o, this.tokens.length - 1)]; }
  private at(t: TokenType): boolean { return this.peek().type === t; }
  private advance(): Token { const t = this.tokens[this.pos]; if (this.pos < this.tokens.length - 1) this.pos++; return t; }
  private expect(t: TokenType, msg?: string): Token {
    if (this.at(t)) return this.advance();
    const tok = this.peek();
    this.errors.push({ message: msg || `Expected ${t} but found '${tok.lexeme || tok.type}'`, line: tok.line, col: tok.col });
    return tok;
  }
  private pos_(tok: Token): A.Pos { return { line: tok.line, col: tok.col }; }

  parseProgram(): A.Program {
    const startTok = this.peek();
    const body: A.Stmt[] = [];
    while (!this.at("EOF")) {
      const before = this.pos;
      const stmt = this.parseStmt();
      if (stmt) body.push(stmt);
      if (this.pos === before) this.advance(); // safety: force progress on unrecoverable error
    }
    return { id: A.nextId(), kind: "Program", pos: this.pos_(startTok), body };
  }

  private parseStmt(): A.Stmt | null {
    const t = this.peek();
    switch (t.type) {
      case "LET": return this.parseLet();
      case "FN": return this.parseFn();
      case "RETURN": return this.parseReturn();
      case "IF": return this.parseIf();
      case "WHILE": return this.parseWhile();
      case "FOR": return this.parseFor();
      case "LBRACE": return this.parseBlock();
      default: return this.parseExprStmt();
    }
  }

  private parseLet(): A.LetStmt {
    const tok = this.expect("LET");
    const name = this.expect("IDENT").lexeme;
    let init: A.Expr | null = null;
    if (this.at("ASSIGN")) { this.advance(); init = this.parseExpr(); }
    this.expect("SEMI");
    return { id: A.nextId(), kind: "LetStmt", pos: this.pos_(tok), name, init };
  }

  private parseFn(): A.FnDecl {
    const tok = this.expect("FN");
    const name = this.expect("IDENT").lexeme;
    this.expect("LPAREN");
    const params: string[] = [];
    if (!this.at("RPAREN")) {
      params.push(this.expect("IDENT").lexeme);
      while (this.at("COMMA")) { this.advance(); params.push(this.expect("IDENT").lexeme); }
    }
    this.expect("RPAREN");
    const body = this.parseBlock();
    return { id: A.nextId(), kind: "FnDecl", pos: this.pos_(tok), name, params, body };
  }

  private parseReturn(): A.ReturnStmt {
    const tok = this.expect("RETURN");
    let value: A.Expr | null = null;
    if (!this.at("SEMI")) value = this.parseExpr();
    this.expect("SEMI");
    return { id: A.nextId(), kind: "ReturnStmt", pos: this.pos_(tok), value };
  }

  private parseIf(): A.IfStmt {
    const tok = this.expect("IF");
    this.expect("LPAREN");
    const cond = this.parseExpr();
    this.expect("RPAREN");
    const then = this.parseBlock();
    let elseBranch: A.Block | A.IfStmt | null = null;
    if (this.at("ELSE")) {
      this.advance();
      elseBranch = this.at("IF") ? this.parseIf() : this.parseBlock();
    }
    return { id: A.nextId(), kind: "IfStmt", pos: this.pos_(tok), cond, then, elseBranch };
  }

  private parseWhile(): A.WhileStmt {
    const tok = this.expect("WHILE");
    this.expect("LPAREN");
    const cond = this.parseExpr();
    this.expect("RPAREN");
    const body = this.parseBlock();
    return { id: A.nextId(), kind: "WhileStmt", pos: this.pos_(tok), cond, body };
  }

  private parseFor(): A.ForStmt {
    const tok = this.expect("FOR");
    this.expect("LPAREN");
    const init = this.at("SEMI") ? null : (this.at("LET") ? this.parseLet() : this.parseExprStmt());
    if (init === null) this.expect("SEMI");
    const cond = this.at("SEMI") ? null : this.parseExpr();
    this.expect("SEMI");
    const update = this.at("RPAREN") ? null : this.parseExprNoSemi();
    this.expect("RPAREN");
    const body = this.parseBlock();
    return { id: A.nextId(), kind: "ForStmt", pos: this.pos_(tok), init, cond, update, body };
  }

  private parseExprNoSemi(): A.ExprStmt {
    const tok = this.peek();
    const expr = this.parseExpr();
    return { id: A.nextId(), kind: "ExprStmt", pos: this.pos_(tok), expr };
  }

  private parseBlock(): A.Block {
    const tok = this.expect("LBRACE");
    const body: A.Stmt[] = [];
    while (!this.at("RBRACE") && !this.at("EOF")) {
      const before = this.pos;
      const stmt = this.parseStmt();
      if (stmt) body.push(stmt);
      if (this.pos === before) this.advance();
    }
    this.expect("RBRACE");
    return { id: A.nextId(), kind: "Block", pos: this.pos_(tok), body };
  }

  private parseExprStmt(): A.ExprStmt {
    const tok = this.peek();
    const expr = this.parseExpr();
    this.expect("SEMI");
    return { id: A.nextId(), kind: "ExprStmt", pos: this.pos_(tok), expr };
  }

  private parseExpr(): A.Expr {
    // Assignment has lowest precedence, right-associative
    if (this.at("IDENT") && this.peek(1).type === "ASSIGN") {
      const tok = this.advance();
      this.advance(); // '='
      const value = this.parseExpr();
      return { id: A.nextId(), kind: "Assign", pos: this.pos_(tok), name: tok.lexeme, value };
    }
    return this.parseBinary(0);
  }

  private parseBinary(minPrec: number): A.Expr {
    let left = this.parseUnary();
    for (;;) {
      const t = this.peek();
      const prec = PREC[t.type];
      if (prec === undefined || prec < minPrec) break;
      const opTok = this.advance();
      const right = this.parseBinary(prec + 1);
      left = { id: A.nextId(), kind: "Binary", pos: this.pos_(opTok), op: opTok.lexeme, left, right };
    }
    return left;
  }

  private parseUnary(): A.Expr {
    if (this.at("MINUS") || this.at("NOT")) {
      const tok = this.advance();
      const operand = this.parseUnary();
      return { id: A.nextId(), kind: "Unary", pos: this.pos_(tok), op: tok.lexeme, operand };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): A.Expr {
    let expr = this.parsePrimary();
    for (;;) {
      if (this.at("LBRACKET")) {
        const tok = this.advance();
        const index = this.parseExpr();
        this.expect("RBRACKET");
        expr = { id: A.nextId(), kind: "Index", pos: this.pos_(tok), array: expr, index };
      } else break;
    }
    return expr;
  }

  private parsePrimary(): A.Expr {
    const tok = this.peek();
    switch (tok.type) {
      case "NUMBER": this.advance(); return { id: A.nextId(), kind: "NumberLit", pos: this.pos_(tok), value: parseInt(tok.lexeme, 10) };
      case "FLOAT": this.advance(); return { id: A.nextId(), kind: "FloatLit", pos: this.pos_(tok), value: parseFloat(tok.lexeme) };
      case "STRING": this.advance(); return { id: A.nextId(), kind: "StringLit", pos: this.pos_(tok), value: tok.lexeme };
      case "TRUE": this.advance(); return { id: A.nextId(), kind: "BoolLit", pos: this.pos_(tok), value: true };
      case "FALSE": this.advance(); return { id: A.nextId(), kind: "BoolLit", pos: this.pos_(tok), value: false };
      case "LBRACKET": {
        this.advance();
        const elements: A.Expr[] = [];
        if (!this.at("RBRACKET")) {
          elements.push(this.parseExpr());
          while (this.at("COMMA")) { this.advance(); elements.push(this.parseExpr()); }
        }
        this.expect("RBRACKET");
        return { id: A.nextId(), kind: "ArrayLit", pos: this.pos_(tok), elements };
      }
      case "LPAREN": {
        this.advance();
        const e = this.parseExpr();
        this.expect("RPAREN");
        return e;
      }
      case "IDENT": {
        this.advance();
        if (this.at("LPAREN")) {
          this.advance();
          const args: A.Expr[] = [];
          if (!this.at("RPAREN")) {
            args.push(this.parseExpr());
            while (this.at("COMMA")) { this.advance(); args.push(this.parseExpr()); }
          }
          this.expect("RPAREN");
          return { id: A.nextId(), kind: "Call", pos: this.pos_(tok), callee: tok.lexeme, args };
        }
        return { id: A.nextId(), kind: "Ident", pos: this.pos_(tok), name: tok.lexeme };
      }
      default:
        this.errors.push({ message: `Unexpected token '${tok.lexeme || tok.type}'`, line: tok.line, col: tok.col });
        this.advance();
        return { id: A.nextId(), kind: "NumberLit", pos: this.pos_(tok), value: 0 };
    }
  }
}

export function parse(tokens: Token[]): { program: A.Program; errors: ParseError[] } {
  const p = new Parser(tokens);
  const program = p.parseProgram();
  return { program, errors: p.errors };
}
