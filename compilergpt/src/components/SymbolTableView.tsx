"use client";
export default function SymbolTableView({ symbols, errors = [] }: { symbols: any[]; errors?: any[] }) {

  return (
    <div className="overflow-auto h-full">
      {errors && errors.length > 0 && (
        <div className="p-2 bg-err/10 border-b border-err/30 space-y-1">
          {errors.map((e: any, i: number) => (
            <div key={i} className="text-err text-xs mono">
              [{e.kind}] line {e.line}:{e.col} — {e.message}
            </div>
          ))}
        </div>
      )}
      {(!symbols || symbols.length === 0) ? (
        <div className="text-gray-500 text-sm p-4">No symbols declared yet.</div>
      ) : (
        <table className="w-full text-xs mono">
          <thead className="sticky top-0 bg-panel2 text-gray-400">
            <tr>
              <th className="text-left p-2 font-medium">Identifier</th>
              <th className="text-left p-2 font-medium">Type</th>
              <th className="text-left p-2 font-medium">Scope</th>
              <th className="text-left p-2 font-medium">Decl Line</th>
              <th className="text-left p-2 font-medium">Offset</th>
              <th className="text-left p-2 font-medium">Uses</th>
            </tr>
          </thead>
          <tbody>
            {symbols.map((s: any, i: number) => (
              <tr key={i} className="border-b border-border/50 hover:bg-panel2">
                <td className="p-2 text-gray-100">{s.isFunction ? "ƒ " : ""}{s.name}</td>
                <td className="p-2 text-accent2">{s.type}</td>
                <td className="p-2 text-gray-500">{s.scopeName}</td>
                <td className="p-2 text-gray-500">{s.declLine}</td>
                <td className="p-2 text-gray-500">{s.offset}</td>
                <td className="p-2 text-gray-500">{s.usageCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
