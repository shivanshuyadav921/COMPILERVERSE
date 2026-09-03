// c_subset_lexer.ts — Scanner for C-subset language.

export type CTokenType =
  // Keywords
  | "INT" | "FLOAT" | "CHAR" | "VOID" | "IF" | "ELSE" | "WHILE" | "FOR" | "RETURN" | "PRINTF"
  // Literals & Identifiers
  | "IDENT" | "INT_LIT" | "FLOAT_LIT" | "STRING_LIT" | "CHAR_LIT"
  // Operators & Delimiters
  | "PLUS" | "MINUS" | "STAR" | "SLASH" | "PERCENT"
  | "ASSIGN" | "EQ" | "NEQ" | "LT" | "LTE" | "GT" | "GTE"
  | "AND" | "OR" | "NOT"
  | "LPAREN" | "RPAREN" | "LBRACE" | "RBRACE" | "LBRACKET" | "RBRACKET"
  | "SEMI" | "COMMA"
  // Special
  | "EOF" | "ERROR";

export interface CToken {
  type: CTokenType;
  lexeme: string;
  value?: any;
  line: number;
  col: number;
}

export function tokenizeCSubset(source: string): { tokens: CToken[]; errors: Array<{ message: string; line: number; col: number }> } {
  const tokens: CToken[] = [];
  const errors: Array<{ message: string; line: number; col: number }> = [];
  let pos = 0;
  let line = 1;
  let col = 1;

  const keywords: Record<string, CTokenType> = {
    int: "INT",
    float: "FLOAT",
    char: "CHAR",
    void: "VOID",
    if: "IF",
    else: "ELSE",
    while: "WHILE",
    for: "FOR",
    return: "RETURN",
    printf: "PRINTF",
    print: "PRINTF",
  };

  while (pos < source.length) {
    const ch = source[pos];

    // Whitespace & newlines
    if (ch === " " || ch === "\t" || ch === "\r") {
      pos++;
      col++;
      continue;
    }
    if (ch === "\n") {
      pos++;
      line++;
      col = 1;
      continue;
    }

    // Line comments //
    if (ch === "/" && source[pos + 1] === "/") {
      pos += 2;
      col += 2;
      while (pos < source.length && source[pos] !== "\n") {
        pos++;
        col++;
      }
      continue;
    }

    // Block comments /* */
    if (ch === "/" && source[pos + 1] === "*") {
      pos += 2;
      col += 2;
      while (pos < source.length && !(source[pos] === "*" && source[pos + 1] === "/")) {
        if (source[pos] === "\n") { line++; col = 1; } else { col++; }
        pos++;
      }
      if (pos < source.length) { pos += 2; col += 2; }
      continue;
    }

    // String literals
    if (ch === '"') {
      const startCol = col;
      pos++;
      col++;
      let str = "";
      while (pos < source.length && source[pos] !== '"') {
        if (source[pos] === "\n") { line++; col = 1; }
        if (source[pos] === "\\" && pos + 1 < source.length) {
          str += source[pos + 1];
          pos += 2;
          col += 2;
        } else {
          str += source[pos];
          pos++;
          col++;
        }
      }
      if (pos >= source.length) {
        errors.push({ message: "Unclosed string literal in C source", line, col: startCol });
      } else {
        pos++;
        col++;
      }
      tokens.push({ type: "STRING_LIT", lexeme: str, value: str, line, col: startCol });
      continue;
    }

    // Number literals (int and float)
    if (/[0-9]/.test(ch)) {
      const startCol = col;
      let numStr = "";
      let isFloat = false;
      while (pos < source.length && /[0-9]/.test(source[pos])) {
        numStr += source[pos];
        pos++;
        col++;
      }
      if (pos < source.length && source[pos] === "." && /[0-9]/.test(source[pos + 1] || "")) {
        isFloat = true;
        numStr += ".";
        pos++;
        col++;
        while (pos < source.length && /[0-9]/.test(source[pos])) {
          numStr += source[pos];
          pos++;
          col++;
        }
      }
      tokens.push({
        type: isFloat ? "FLOAT_LIT" : "INT_LIT",
        lexeme: numStr,
        value: isFloat ? parseFloat(numStr) : parseInt(numStr, 10),
        line,
        col: startCol,
      });
      continue;
    }

    // Identifiers & Keywords
    if (/[a-zA-Z_]/.test(ch)) {
      const startCol = col;
      let ident = "";
      while (pos < source.length && /[a-zA-Z0-9_]/.test(source[pos])) {
        ident += source[pos];
        pos++;
        col++;
      }
      const type = keywords[ident] || "IDENT";
      tokens.push({ type, lexeme: ident, line, col: startCol });
      continue;
    }

    // Two-character operators
    const next = source[pos + 1] || "";
    const startCol = col;
    if (ch === "=" && next === "=") { tokens.push({ type: "EQ", lexeme: "==", line, col: startCol }); pos += 2; col += 2; continue; }
    if (ch === "!" && next === "=") { tokens.push({ type: "NEQ", lexeme: "!=", line, col: startCol }); pos += 2; col += 2; continue; }
    if (ch === "<" && next === "=") { tokens.push({ type: "LTE", lexeme: "<=", line, col: startCol }); pos += 2; col += 2; continue; }
    if (ch === ">" && next === "=") { tokens.push({ type: "GTE", lexeme: ">=", line, col: startCol }); pos += 2; col += 2; continue; }
    if (ch === "&" && next === "&") { tokens.push({ type: "AND", lexeme: "&&", line, col: startCol }); pos += 2; col += 2; continue; }
    if (ch === "|" && next === "|") { tokens.push({ type: "OR", lexeme: "||", line, col: startCol }); pos += 2; col += 2; continue; }

    // Single-character tokens
    const singleMap: Record<string, CTokenType> = {
      "+": "PLUS", "-": "MINUS", "*": "STAR", "/": "SLASH", "%": "PERCENT",
      "=": "ASSIGN", "<": "LT", ">": "GT", "!": "NOT",
      "(": "LPAREN", ")": "RPAREN", "{": "LBRACE", "}": "RBRACE",
      "[": "LBRACKET", "]": "RBRACKET", ";": "SEMI", ",": "COMMA",
    };

    if (singleMap[ch]) {
      tokens.push({ type: singleMap[ch], lexeme: ch, line, col: startCol });
      pos++;
      col++;
      continue;
    }

    // Unrecognized character
    errors.push({ message: `Unexpected character '${ch}' in C source`, line, col: startCol });
    pos++;
    col++;
  }

  tokens.push({ type: "EOF", lexeme: "", line, col });
  return { tokens, errors };
}
