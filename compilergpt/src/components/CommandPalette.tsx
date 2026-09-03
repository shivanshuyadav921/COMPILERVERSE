"use client";
import { useState, useEffect } from "react";

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectTab,
  onExportJSON,
  onExportReport,
  onSelectPreset,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabKey: any) => void;
  onExportJSON?: () => void;
  onExportReport?: () => void;
  onSelectPreset?: (code: any) => void;
}) {

  const [search, setSearch] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose(); else setSearch("");
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { label: "Switch to Compiler Explorer", action: () => { onSelectTab("explorer"); onClose(); } },
    { label: "Switch to Live Timeline", action: () => { onSelectTab("timeline"); onClose(); } },
    { label: "Switch to Interactive Graph Canvas", action: () => { onSelectTab("canvas"); onClose(); } },
    { label: "Switch to Optimization Replay", action: () => { onSelectTab("replay"); onClose(); } },
    { label: "Switch to Parse Table", action: () => { onSelectTab("parsetable"); onClose(); } },
    { label: "Switch to Scope Tree", action: () => { onSelectTab("scopetree"); onClose(); } },
    { label: "Switch to Data Flow", action: () => { onSelectTab("dataflow"); onClose(); } },
    { label: "Switch to SSA Form", action: () => { onSelectTab("ssa"); onClose(); } },
    { label: "Switch to Dominator Tree", action: () => { onSelectTab("dominators"); onClose(); } },
    { label: "Switch to Register Allocation", action: () => { onSelectTab("regalloc"); onClose(); } },
    { label: "Switch to Call Graph", action: () => { onSelectTab("callgraph"); onClose(); } },
    { label: "Switch to Stack Layout", action: () => { onSelectTab("memory"); onClose(); } },
    { label: "Switch to Metrics Dashboard", action: () => { onSelectTab("metrics"); onClose(); } },
    { label: "Switch to Multi-File Workspace", action: () => { onSelectTab("workspace"); onClose(); } },
    { label: "Export Session JSON Transcript", action: () => { onExportJSON?.(); onClose(); } },
    { label: "Export Technical HTML/PDF Report", action: () => { onExportReport?.(); onClose(); } },
  ];


  const filtered = commands.filter(c => c.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-4">
      <div className="w-full max-w-lg card p-3 space-y-3 bg-panel border border-border shadow-2xl">
        <div className="flex justify-between items-center border-b border-border pb-2">
          <span className="font-bold text-accent text-xs mono">Command Palette (Ctrl+K)</span>
          <span className="text-xs text-gray-500 cursor-pointer hover:text-white" onClick={onClose}>ESC</span>
        </div>

        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type a command or view name..."
          className="w-full bg-panel2 border border-border rounded px-3 py-2 text-xs text-gray-100 outline-none focus:border-accent"
        />

        <div className="max-h-60 overflow-auto space-y-1">
          {filtered.length > 0 ? (
            filtered.map((c, i) => (
              <div
                key={i}
                onClick={c.action}
                className="p-2 rounded text-xs mono text-gray-200 hover:bg-accent/20 hover:text-accent cursor-pointer border border-transparent hover:border-accent/30 flex justify-between"
              >
                <span>{c.label}</span>
                <span className="text-gray-600 text-[10px]">↵ Select</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 p-3 italic">No matching commands found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
