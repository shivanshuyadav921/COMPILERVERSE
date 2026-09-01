// lexer.ts — Real hand-written lexer for the Nova language.
// No hardcoded token streams: every token is derived from the actual source text.

export type TokenType =
  | "NUMBER" | "FLOAT" | "STRING" | "IDENT" | "BOOL"
  | "LET" | "FN" | "RETURN" | "IF" | "ELSE" | "WHILE" | "FOR" | "TRUE" | "FALSE"
  | "PLUS" | "MINUS" | "STAR" | "SLASH" | "PERCENT"
  | "ASSIGN" | "EQ" | "NEQ" | "LT" | "GT" | "LTE" | "GTE"
  | "AND" | "OR" | "NOT"
  | "LPAREN" | "RPAREN" | "LBRACE" | "RBRACE" | "LBRACKET" | "RBRACKET"
  | "COMMA" | "SEMI" | "COLON"
  | "EOF";

export interface Token {
  type: TokenType;
  lexeme: string;
  line: number;
  col: number;
}

export interface LexError {
  message: string;
  line: number;
  col: number;
}

const KEYWORDS: Record<string, TokenType> = {
  let: "LET", fn: "FN", return: "RETURN", if: "IF", else: "ELSE",
  while: "WHILE", for: "FOR", true: "TRUE", false: "FALSE",
};

export function tokenize(source: string): { tokens: Token[]; errors: LexError[] } {
  const tokens: Token[] = [];
  const errors: LexError[] = [];
  let i = 0, line = 1, col = 1;
  const n = source.length;

  function peek(o = 0) { return source[i + o]; }
  function advance() {
    const c = source[i++];
    if (c === "\n") { line++; col = 1; } else { col++; }
    return c;
  }
  function push(type: TokenType, lexeme: string, startLine: number, startCol: number) {
    tokens.push({ type, lexeme, line: startLine, col: startCol });
  }

  while (i < n) {
    const c = peek();
    const startLine = line, startCol = col;

    if (c === " " || c === "\t" || c === "\r" || c === "\n") { advance(); continue; }

    if (c === "/" && peek(1) === "/") {
      while (i < n && peek() !== "\n") advance();
      continue;
    }
    if (c === "/" && peek(1) === "*") {
      advance(); advance();
      while (i < n && !(peek() === "*" && peek(1) === "/")) advance();
      if (i < n) { advance(); advance(); }
      continue;
    }

    if (/[0-9]/.test(c)) {
      let s = "";
      let isFloat = false;
      while (i < n && /[0-9]/.test(peek())) s += advance();
      if (peek() === "." && /[0-9]/.test(peek(1) || "")) {
        isFloat = true;
        s += advance();
        while (i < n && /[0-9]/.test(peek())) s += advance();
      }
      push(isFloat ? "FLOAT" : "NUMBER", s, startLine, startCol);
      continue;
    }

    if (/[a-zA-Z_]/.test(c)) {
      let s = "";
      while (i < n && /[a-zA-Z0-9_]/.test(peek())) s += advance();
      if (s in KEYWORDS) push(KEYWORDS[s], s, startLine, startCol);
      else push("IDENT", s, startLine, startCol);
      continue;
    }

    if (c === '"') {
      advance();
      let s = "";
      let closed = false;
      while (i < n) {
        if (peek() === '"') { advance(); closed = true; break; }
        if (peek() === "\\" && i + 1 < n) { advance(); s += advance(); continue; }
        s += advance();
      }
      if (!closed) errors.push({ message: "Unterminated string literal", line: startLine, col: startCol });
      push("STRING", s, startLine, startCol);
      continue;
    }

    const two = c + (peek(1) || "");
    const twoMap: Record<string, TokenType> = {
      "==": "EQ", "!=": "NEQ", "<=": "LTE", ">=": "GTE", "&&": "AND", "||": "OR",
    };
    if (two in twoMap) {
      advance(); advance();
      push(twoMap[two], two, startLine, startCol);
      continue;
    }

    const oneMap: Record<string, TokenType> = {
      "+": "PLUS", "-": "MINUS", "*": "STAR", "/": "SLASH", "%": "PERCENT",
      "=": "ASSIGN", "<": "LT", ">": "GT", "!": "NOT",
      "(": "LPAREN", ")": "RPAREN", "{": "LBRACE", "}": "RBRACE",
      "[": "LBRACKET", "]": "RBRACKET", ",": "COMMA", ";": "SEMI", ":": "COLON",
    };
    if (c in oneMap) {
      advance();
      push(oneMap[c], c, startLine, startCol);
      continue;
    }

    errors.push({ message: `Unexpected character '${c}'`, line: startLine, col: startCol });
    advance();
  }

  tokens.push({ type: "EOF", lexeme: "", line, col });
  return { tokens, errors };
}
