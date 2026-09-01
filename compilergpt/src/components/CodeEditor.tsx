"use client";
import { useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  errors?: Array<{ message: string; line?: number; col?: number }>;
  fontSize?: number;
  tabSize?: number;
  theme?: string;
}

export default function CodeEditor({
  value,
  onChange,
  errors = [],
  fontSize = 13,
  tabSize = 2,
  theme = "vs-dark",
}: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);

  const handleBeforeMount = (monaco: Monaco) => {
    monacoRef.current = monaco;

    // Register Nova language if not already registered
    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === "nova")) {
      monaco.languages.register({ id: "nova" });


      monaco.languages.setMonarchTokensProvider("nova", {
        keywords: ["fn", "let", "if", "else", "while", "for", "return", "print", "true", "false", "struct", "import"],
        typeKeywords: ["int", "float", "string", "bool", "void", "array"],
        operators: ["=", "+", "-", "*", "/", "%", "==", "!=", "<", ">", "<=", ">=", "&&", "||", "!"],
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        tokenizer: {
          root: [
            [/[a-zA-Z_]\w*/, {
              cases: {
                "@keywords": "keyword",
                "@typeKeywords": "type",
                "@default": "identifier",
              },
            }],
            [/\/\/.*/, "comment"],
            [/\/\*/, "comment", "@comment"],
            [/\d+\.\d+/, "number.float"],
            [/\d+/, "number"],
            [/"[^"]*"/, "string"],
            [/@symbols/, "delimiter"],
          ],
          comment: [
            [/[^\/*]+/, "comment"],
            [/\*\//, "comment", "@pop"],
            [/[\/*]/, "comment"],
          ],
        },
      });

      monaco.languages.registerCompletionItemProvider("nova", {
        provideCompletionItems: (model: any, position: any) => {
          const suggestions = [

            {
              label: "fn",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "fn ${1:name}(${2:params}) {\n\t$0\n}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Function declaration",
            },
            {
              label: "let",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "let ${1:name} = ${2:value};",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Variable declaration",
            },
            {
              label: "if",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "if (${1:condition}) {\n\t$0\n}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "If conditional statement",
            },
            {
              label: "while",
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: "while (${1:condition}) {\n\t$0\n}",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "While loop statement",
            },
            {
              label: "print",
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: "print(${1:message});",
              insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              documentation: "Print output to standard output",
            },
          ];
          return { suggestions };
        },
      });
    }
  };

  const handleOnMount = (editor: any, monaco: Monaco) => {
    editorRef.current = editor;
  };

  // Update error squiggles in Monaco when compiler errors change
  useEffect(() => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const markers = errors.map((err) => ({
      startLineNumber: err.line ?? 1,
      startColumn: err.col ?? 1,
      endLineNumber: err.line ?? 1,
      endColumn: (err.col ?? 1) + 10,
      message: err.message,
      severity: monacoRef.current!.MarkerSeverity.Error,
    }));

    monacoRef.current.editor.setModelMarkers(model, "compiler", markers);
  }, [errors]);

  return (
    <Editor
      height="100%"
      language="nova"
      theme={theme}
      value={value}
      onChange={(v) => onChange(v || "")}
      beforeMount={handleBeforeMount}
      onMount={handleOnMount}
      options={{
        fontSize,
        tabSize,
        fontFamily: "JetBrains Mono, Fira Code, monospace",
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12 },
        lineNumbers: "on",
        renderLineHighlight: "all",
        bracketPairColorization: { enabled: true },
        folding: true,
      }}
    />
  );
}

