"use client";
export default function TokenTable({ tokens, errors }: { tokens: any[]; errors: any[] }) {
  if (!tokens || tokens.length === 0) return <div className="text-gray-500 text-sm p-4">No tokens yet — compile some code.</div>;
  return (
    <div className="overflow-auto h-full">
      {errors && errors.length > 0 && (
        <div className="p-2 bg-err/10 border-b border-err/30">
          {errors.map((e: any, i: number) => (
            <div key={i} className="text-err text-xs mono">Lexical error, line {e.line}:{e.col} — {e.message}</div>
          ))}
        </div>
      )}
      <table className="w-full text-xs mono">
        <thead className="sticky top-0 bg-panel2 text-gray-400">
          <tr>
            <th className="text-left p-2 font-medium">#</th>
            <th className="text-left p-2 font-medium">Type</th>
            <th className="text-left p-2 font-medium">Lexeme</th>
            <th className="text-left p-2 font-medium">Line</th>
            <th className="text-left p-2 font-medium">Col</th>
          </tr>
        </thead>
        <tbody>
          {tokens.filter(t => t.type !== "EOF").map((t, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-panel2">
              <td className="p-2 text-gray-600">{i}</td>
              <td className="p-2 text-accent2">{t.type}</td>
              <td className="p-2 text-gray-200">{t.lexeme || "—"}</td>
              <td className="p-2 text-gray-500">{t.line}</td>
              <td className="p-2 text-gray-500">{t.col}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
