"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import TokenTable from "@/components/TokenTable";
import ASTView from "@/components/ASTView";
import SymbolTableView from "@/components/SymbolTableView";
import IRView from "@/components/IRView";
import CFGView from "@/components/CFGView";
import AssemblyView from "@/components/AssemblyView";
import OptimizationLab from "@/components/OptimizationLab";
import MentorChat from "@/components/MentorChat";
import DataFlowView from "@/components/DataFlowView";
import SSAView from "@/components/SSAView";
import DominatorView from "@/components/DominatorView";
import RegisterAllocView from "@/components/RegisterAllocView";
import CallGraphView from "@/components/CallGraphView";
import MemoryLayoutView from "@/components/MemoryLayoutView";
import CompilerExplorerView from "@/components/CompilerExplorerView";
import LiveTimelineView from "@/components/LiveTimelineView";
import ScopeTreeView from "@/components/ScopeTreeView";
import MetricsDashboardView from "@/components/MetricsDashboardView";
import MultiFileWorkspaceView from "@/components/MultiFileWorkspaceView";
import ParseTableView from "@/components/ParseTableView";
import GraphEngineView from "@/components/GraphEngineView";
import OptimizationReplayView from "@/components/OptimizationReplayView";
import CompilerDebuggerView from "@/components/CompilerDebuggerView";
import CommandPalette from "@/components/CommandPalette";
import LandingPage, { DEMO_PROGRAMS } from "@/components/LandingPage";
import FileExplorerSidebar, { FileItem } from "@/components/FileExplorerSidebar";
import SettingsModal from "@/components/SettingsModal";
import BottomTerminalConsole from "@/components/BottomTerminalConsole";
import { createSessionRecord, exportSessionJSON, exportHTMLReport } from "@/lib/compiler/session";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });

const DEFAULT_FILES: FileItem[] = DEMO_PROGRAMS.map((demo, idx) => ({
  id: `file-${idx + 1}`,
  name: `${demo.name.replace(/\s+/g, "")}.nova`,
  content: demo.code,
}));

type TabKey =
  | "explorer" | "timeline" | "debugger" | "tokens" | "parsetable" | "ast" | "scopetree"
  | "symbols" | "ir" | "replay" | "cfg" | "canvas" | "dataflow" | "ssa" | "dominators"
  | "regalloc" | "callgraph" | "memory" | "asm" | "metrics" | "workspace" | "mentor";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "explorer", label: "Compiler Explorer", icon: "⚡" },
  { key: "timeline", label: "Live Timeline", icon: "⏱️" },
  { key: "debugger", label: "Phase Debugger", icon: "🐛" },
  { key: "tokens", label: "Lexer", icon: "🔤" },
  { key: "parsetable", label: "Parse Table", icon: "📊" },
  { key: "ast", label: "AST", icon: "🌳" },
  { key: "scopetree", label: "Scope Tree", icon: "🔍" },
  { key: "symbols", label: "Symbol Table", icon: "🏷️" },
  { key: "ir", label: "IR & Optimizer", icon: "⚙️" },
  { key: "replay", label: "Opt Replay", icon: "🔄" },
  { key: "cfg", label: "CFG", icon: "🔀" },
  { key: "canvas", label: "Interactive Canvas", icon: "🕸️" },
  { key: "dataflow", label: "Data Flow", icon: "🌊" },
  { key: "ssa", label: "SSA Form", icon: "Φ" },
  { key: "dominators", label: "Dominator Tree", icon: "🌲" },
  { key: "regalloc", label: "Reg Allocation", icon: "🎨" },
  { key: "callgraph", label: "Call Graph", icon: "📞" },
  { key: "memory", label: "Stack Layout", icon: "📦" },
  { key: "asm", label: "Assembly", icon: "💻" },
  { key: "metrics", label: "Metrics", icon: "📈" },
  { key: "workspace", label: "Workspace", icon: "📁" },
  { key: "mentor", label: "AI Mentor", icon: "🧠" },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<"landing" | "ide">("landing");
  const [files, setFiles] = useState<FileItem[]>(DEFAULT_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(DEFAULT_FILES[0].id);
  const [result, setResult] = useState<any>(null);
  const [tab, setTab] = useState<TabKey>("explorer");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  // Settings state
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(13);
  const [tabSize, setTabSize] = useState(2);
  const [autoCompile, setAutoCompile] = useState(true);
  const [optLevel, setOptLevel] = useState("O2");

  // Panel Resizing State
  const [editorWidthPercent, setEditorWidthPercent] = useState(38);
  const isDraggingRef = useRef(false);

  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    constantFolding: true, constantPropagation: true, copyPropagation: true,
    commonSubexpressionElimination: true, strengthReduction: true,
    deadCodeElimination: true, peepholeOptimization: true,
  });

  const [compiling, setCompiling] = useState(false);

  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0];
  }, [files, activeFileId]);

  const runCompile = useCallback(async (src: string, passes: Record<string, boolean>) => {
    setCompiling(true);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: src, enabledPasses: passes }),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      // ignore network errors
    } finally {
      setCompiling(false);
    }
  }, []);

  // Debounced auto compilation
  useEffect(() => {
    if (!autoCompile) return;
    const t = setTimeout(() => runCompile(activeFile.content, enabled), 500);
    return () => clearTimeout(t);
  }, [activeFile.content, enabled, autoCompile, runCompile]);

  const allErrors = useMemo(() => {
    if (!result) return [];
    return [
      ...(result.lexErrors || []),
      ...(result.parseErrors || []),
      ...(result.semanticErrors || []),
    ];
  }, [result]);

  const handleMouseDownSplitter = () => {
    isDraggingRef.current = true;
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const totalWidth = window.innerWidth;
      const sidebarOffset = showSidebar ? 224 : 0;
      const availableWidth = totalWidth - sidebarOffset;
      const currentX = e.clientX - sidebarOffset;
      const newPercent = Math.max(20, Math.min(70, (currentX / availableWidth) * 100));
      setEditorWidthPercent(newPercent);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [showSidebar]);

  useEffect(() => {
    const handleGlobalHotkeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCompile(activeFile.content, enabled);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (result) exportSessionJSON(createSessionRecord(result));
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      } else if ((e.ctrlKey || e.metaKey) && !isNaN(Number(e.key)) && Number(e.key) >= 1 && Number(e.key) <= 9) {
        e.preventDefault();
        const tabIdx = Number(e.key) - 1;
        if (TABS[tabIdx]) setTab(TABS[tabIdx].key);
      }
    };
    window.addEventListener("keydown", handleGlobalHotkeys);
    return () => window.removeEventListener("keydown", handleGlobalHotkeys);
  }, [activeFile.content, enabled, result, runCompile]);

  const handleUpdateActiveContent = (newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newContent } : f))
    );
  };

  const handleCreateFile = (name: string, content?: string) => {
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      name,
      content: content || "// New Nova source file\n",
    };
    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  const handleRenameFile = (id: string, newName: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    );
  };

  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) return;
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      setActiveFileId(remaining[0].id);
    }
  };

  const handleImportFiles = (imported: { name: string; content: string }[]) => {
    const newFiles = imported.map((imp, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      name: imp.name,
      content: imp.content,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    if (newFiles.length > 0) setActiveFileId(newFiles[0].id);
  };

  const handleExportProject = () => {
    const jsonStr = JSON.stringify(files, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nova_compiler_workspace.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (viewMode === "landing") {
    return (
      <LandingPage
        onLaunchIDE={() => setViewMode("ide")}
        onSelectDemo={(code) => {
          handleUpdateActiveContent(code);
          setViewMode("ide");
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-bg text-gray-100 overflow-hidden font-sans select-none">
      {/* IDE Header Toolbar */}
      <header className="h-11 border-b border-border bg-panel flex items-center px-3 gap-3 flex-shrink-0 text-xs z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 rounded bg-panel2 border border-border text-gray-400 hover:text-white transition-colors"
            title="Toggle File Explorer"
          >
            📁
          </button>
          <span className="font-extrabold text-accent tracking-wide text-sm bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent2">
            CompilerGPT
          </span>
          <span className="text-[10px] text-gray-400 bg-panel2 px-1.5 py-0.5 rounded border border-border">
            v1.0
          </span>
          <button
            onClick={() => setViewMode("landing")}
            className="text-xs px-2 py-0.5 rounded bg-panel2 border border-border text-gray-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>🏠</span> Landing
          </button>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 border-l border-border pl-3 mono">
          <span className="text-gray-500">workspace</span>
          <span>/</span>
          <span className="text-accent2 font-bold">{activeFile.name}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => runCompile(activeFile.content, enabled)}
            disabled={compiling}
            className="text-xs px-3 py-1 rounded-md bg-accent text-white font-bold hover:bg-accent/80 transition-all flex items-center gap-1.5 shadow-md shadow-accent/20"
          >
            <span>▶</span>
            <span>{compiling ? "Compiling..." : "Compile (Ctrl+Enter)"}</span>
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="text-xs px-2.5 py-1 rounded bg-panel2 border border-border text-gray-300 hover:text-white"
          >
            ⌘K Palette
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xs px-2.5 py-1 rounded bg-panel2 border border-border text-gray-300 hover:text-white"
          >
            ⚙️ Settings
          </button>

          <button
            onClick={() => result && exportSessionJSON(createSessionRecord(result))}
            className="hidden lg:inline-block text-xs px-2.5 py-1 rounded bg-panel2 border border-border text-gray-300 hover:text-white"
          >
            Export Session
          </button>

          <button
            onClick={() => result && exportHTMLReport(result)}
            className="hidden lg:inline-block text-xs px-2.5 py-1 rounded bg-panel2 border border-border text-gray-300 hover:text-white"
          >
            HTML Report
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar File Explorer */}
        {showSidebar && (
          <FileExplorerSidebar
            files={files}
            activeFileId={activeFileId}
            onSelectFile={setActiveFileId}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onImportFiles={handleImportFiles}
            onExportProject={handleExportProject}
          />
        )}

        {/* Code Editor Pane */}
        <div
          style={{ width: `${editorWidthPercent}%` }}
          className="flex flex-col border-r border-border min-w-[280px] max-w-[75%]"
        >
          {/* File Tab */}
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-gray-400 border-b border-border bg-panel flex justify-between items-center">
            <span className="mono font-bold text-accent2">Editing {activeFile.name}</span>
            <span className="text-[10px] text-gray-500">Nova Language</span>
          </div>

          <div className="flex-1">
            <CodeEditor
              value={activeFile.content}
              onChange={handleUpdateActiveContent}
              errors={allErrors}
              fontSize={fontSize}
              tabSize={tabSize}
              theme={theme}
            />
          </div>

          {/* Optimization Controls */}
          <div className="border-t border-border">
            <OptimizationLab enabled={enabled} setEnabled={setEnabled} />
          </div>
        </div>

        {/* Resizable Draggable Splitter */}
        <div
          onMouseDown={handleMouseDownSplitter}
          className="w-1 bg-border hover:bg-accent cursor-col-resize z-10 transition-colors flex items-center justify-center"
          title="Drag to resize panels"
        />

        {/* Visualizations & Pipeline Pane */}
        <div className="flex-1 flex flex-col overflow-hidden bg-bg">
          {/* Tab Header Bar */}
          <div className="flex gap-1 px-3 py-2 border-b border-border bg-panel overflow-x-auto select-none">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`tab-btn flex items-center gap-1.5 ${
                  tab === t.key ? "tab-btn-active font-bold" : "tab-btn-inactive"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Visualization Content Area */}
          <div className="flex-1 overflow-hidden relative">
            {tab === "explorer" && <CompilerExplorerView optLevels={result?.optLevels} />}
            {tab === "timeline" && <LiveTimelineView timeline={result?.timeline} />}
            {tab === "debugger" && <CompilerDebuggerView result={result} />}
            {tab === "tokens" && <TokenTable tokens={result?.tokens} errors={result?.lexErrors} />}
            {tab === "parsetable" && <ParseTableView parseTrace={result?.parseTrace} />}
            {tab === "ast" && (
              <div className="h-full grid grid-cols-3">
                <div className="col-span-2 overflow-hidden border-r border-border h-full">
                  <ASTView ast={result?.ast} onSelect={setSelectedNode} selectedId={selectedNode?.id ?? null} />
                </div>
                <div className="p-3 text-xs overflow-auto">
                  <div className="text-gray-500 uppercase tracking-wide text-[11px] mb-2 font-bold">Node Detail Inspector</div>
                  {selectedNode ? (
                    <pre className="mono text-[11px] text-gray-300 whitespace-pre-wrap bg-panel2 p-3 rounded border border-border">
                      {JSON.stringify(selectedNode, null, 2)}
                    </pre>
                  ) : (
                    <div className="text-gray-500 italic">Click any AST node in the tree to inspect detailed attributes and type info.</div>
                  )}
                </div>
              </div>
            )}
            {tab === "scopetree" && <ScopeTreeView scopeTree={result?.scopeTree} />}
            {tab === "symbols" && <SymbolTableView symbols={result?.symbolTable} errors={[...(result?.parseErrors || []), ...(result?.semanticErrors || [])]} />}
            {tab === "ir" && <IRView ir={result?.ir} irOptimized={result?.irOptimized} logs={result?.optimizationLogs} />}
            {tab === "replay" && <OptimizationReplayView logs={result?.optimizationLogs} />}
            {tab === "cfg" && <CFGView cfgBefore={result?.cfgBefore} cfgAfter={result?.cfgAfter} />}
            {tab === "canvas" && <GraphEngineView result={result} />}
            {tab === "dataflow" && <DataFlowView dataflow={result?.dataflow} />}

            {tab === "ssa" && <SSAView ssa={result?.ssa} irOptimized={result?.irOptimized} />}
            {tab === "dominators" && <DominatorView dominators={result?.dominators} />}
            {tab === "regalloc" && <RegisterAllocView regAlloc={result?.regAlloc} />}
            {tab === "callgraph" && <CallGraphView callGraph={result?.callGraph} />}
            {tab === "memory" && <MemoryLayoutView memoryLayout={result?.memoryLayout} />}
            {tab === "asm" && <AssemblyView assembly={result?.assembly} />}
            {tab === "metrics" && <MetricsDashboardView metrics={result?.metrics} />}
            {tab === "workspace" && <MultiFileWorkspaceView onWorkspaceCompiled={setResult} />}
            {tab === "mentor" && <MentorChat artifacts={result} />}
          </div>

          {/* Bottom Terminal Console */}
          <BottomTerminalConsole
            result={result}
            compiling={compiling}
            onRunCompile={() => runCompile(activeFile.content, enabled)}
          />
        </div>
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-border bg-panel px-3 flex items-center justify-between text-[11px] text-gray-400 flex-shrink-0 mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent2 inline-block" />
            <span>Ready</span>
          </span>
          <span>File: {activeFile.name}</span>
          <span>Theme: {theme}</span>
          <span>Opt Level: {optLevel}</span>
        </div>
        <div className="flex items-center gap-4">
          {compiling ? (
            <span className="text-accent pulse-glow font-bold">Compiling...</span>
          ) : allErrors.length > 0 ? (
            <span className="text-err font-bold">● {allErrors.length} Error(s)</span>
          ) : (
            <span className="text-accent2">● 0 Errors</span>
          )}
          <span>Compile Time: {result?.metrics?.compilationTimeMs?.toFixed(2) || "0.00"} ms</span>
        </div>
      </footer>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelectTab={setTab}
        onExportJSON={() => result && exportSessionJSON(createSessionRecord(result))}
        onExportReport={() => result && exportHTMLReport(result)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        tabSize={tabSize}
        setTabSize={setTabSize}
        autoCompile={autoCompile}
        setAutoCompile={setAutoCompile}
        optLevel={optLevel}
        setOptLevel={setOptLevel}
      />
    </div>
  );
}
