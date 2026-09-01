"use client";

export default function ParseTableView({ parseTrace }: { parseTrace: any[] }) {
  if (!parseTrace || parseTrace.length === 0) return <div className="text-gray-500 text-sm p-4">No parse table trace available.</div>;

  return (
    <div className="h-full flex flex-col p-4 overflow-auto space-y-4">
      <div className="text-xs text-gray-400">
        Parser Shift-Reduce State Transitions and Symbol Stack Trace.
      </div>

      <div className="card p-3 overflow-auto">
        <table className="w-full text-xs mono">
          <thead className="bg-panel2 text-gray-400 text-left">
            <tr>
              <th className="p-2">#</th>
              <th className="p-2">Action</th>
              <th className="p-2">Input Token</th>
              <th className="p-2">Symbol Stack</th>
              <th className="p-2">Production / Operation</th>
              <th className="p-2">Line</th>
            </tr>
          </thead>
          <tbody>
            {parseTrace.map((st: any) => (
              <tr key={st.step} className="border-t border-border/50 hover:bg-panel2/50">
                <td className="p-2 text-gray-600">{st.step}</td>
                <td className="p-2 font-bold">
                  {st.action === "SHIFT" && <span className="text-accent2">SHIFT</span>}
                  {st.action === "REDUCE" && <span className="text-warn">REDUCE</span>}
                  {st.action === "ACCEPT" && <span className="text-accent">ACCEPT</span>}
                </td>
                <td className="p-2 text-gray-200">{st.inputToken}</td>
                <td className="p-2 text-gray-400">{st.symbolStack.join(" ")}</td>
                <td className="p-2 text-gray-300">{st.productionRule}</td>
                <td className="p-2 text-gray-500">L{st.line}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
