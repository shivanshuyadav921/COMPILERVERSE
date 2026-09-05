"use client";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import TokenTable from "@/components/TokenTable";
import ASTView from "@/components/ASTView";
import SymbolTableView from "@/components/SymbolTableView";
import IRView from "@/components/IRView";
import CFGView from "@/components/CFGView";
import AssemblyView from "@/components/AssemblyView";
import X86View from "@/components/X86View";
import WasmView from "@/components/WasmView";
import BenchmarkLabView from "@/components/BenchmarkLabView";
import SideBySideCompareView from "@/components/SideBySideCompareView";
import EducationalModeView from "@/components/EducationalModeView";
import ResearchDashboardView from "@/components/ResearchDashboardView";
import CollaborationPanel from "@/components/CollaborationPanel";
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
import { encodeSessionToUrlParam, decodeSessionFromUrlParam } from "@/lib/compiler/share";

const CodeEditor = dynamic(() => import("@/components/CodeEditor"), { ssr: false });

const DEFAULT_FILES: FileItem[] = DEMO_PROGRAMS.map((demo, idx) => ({
  id: `file-${idx + 1}`,
  name: `${demo.name.replace(/[^a-zA-Z0-9]/g, "")}.${demo.language === "c" ? "c" : "nova"}`,
  content: demo.code,
}));

type TabKey =
  | "explorer" | "timeline" | "debugger" | "tokens" | "parsetable" | "ast" | "scopetree"
  | "symbols" | "ir" | "replay" | "cfg" | "canvas" | "dataflow" | "ssa" | "dominators"
  | "regalloc" | "callgraph" | "memory" | "x86" | "wasm" | "asm" | "benchmark"
  | "compare" | "learn" | "research" | "collab" | "metrics" | "workspace" | "mentor";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "explorer", label: "Compiler Explorer", icon: "⚡" },
  { key: "learn", label: "Learn Mode (Tutorial)", icon: "🎓" },
  { key: "benchmark", label: "Benchmark Lab", icon: "📊" },
  { key: "compare", label: "Side-by-Side Diff", icon: "⚖️" },
  { key: "x86", label: "x86-64 Target", icon: "💻" },
  { key: "wasm", label: "WebAssembly (WASM)", icon: "🌐" },
  { key: "research", label: "AI Hallucination", icon: "🧪" },
  { key: "timeline", label: "Live Timeline", icon: "⏱️" },
  { key: "debugger", label: "Phase Debugger", icon: "🐛" },
  { key: "tokens", label: "Lexer", icon: "🔤" },
  { key: "parsetable", label: "Parse Table", icon: "📋" },
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
  { key: "collab", label: "Live Collab", icon: "👥" },
  { key: "metrics", label: "Metrics", icon: "📈" },
  { key: "workspace", label: "Workspace", icon: "📁" },
  { key: "mentor", label: "AI Mentor", icon: "🧠" },
];

export default function Home() {
  const [viewMode, setViewMode] = useState<"landing" | "ide">("landing");
  const [language, setLanguage] = useState<"nova" | "c">("nova");
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

  // Toast notification state (replaces all alert() calls)
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // Request ID counter — only accept results from the latest compile request (stale-result protection)
  const compileRequestIdRef = useRef(0);

  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0];
  }, [files, activeFileId]);

  const runCompile = useCallback(async (src: string, lang: "nova" | "c", passes: Record<string, boolean>) => {
    const requestId = ++compileRequestIdRef.current;
    setCompiling(true);
    try {
      const res = await fetch("/api/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: src, language: lang, enabledPasses: passes }),
      });
      const data = await res.json();
      // Only apply result if this is still the latest pending request
      if (requestId === compileRequestIdRef.current) {
        setResult(data);
      }
    } catch {
      // Network errors are silently ignored; the last good result stays visible
    } finally {
      if (requestId === compileRequestIdRef.current) {
        setCompiling(false);
      }
    }
  }, []);

  useEffect(() => {
    if (activeFile?.content) {
      const isC = activeFile.name.endsWith(".c");
      const currentLang = isC ? "c" : language;
      if (isC && language !== "c") setLanguage("c");
      runCompile(activeFile.content, currentLang, enabled);
    }
  // activeFile.name intentionally included so switching to a .c file auto-detects language
  }, [activeFile?.content, activeFile?.name, language, enabled, runCompile]);

  const handleEditorChange = (newCode: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: newCode } : f))
    );
    if (autoCompile) {
      runCompile(newCode, language, enabled);
    }
  };

  const handleShareSession = () => {
    const sessionUrlParam = encodeSessionToUrlParam({
      id: "share",
      source: activeFile.content,
      language,
      optLevel,
      target: "x86",
      timestamp: new Date().toISOString(),
    });
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/?session=${sessionUrlParam}`;
      navigator.clipboard?.writeText(fullUrl).catch(() => {
        // Fallback if clipboard isn't available
        prompt("Copy this shareable URL:", fullUrl);
      });
      showToast("Share URL copied to clipboard! Anyone opening this link will see your exact compilation.", "success");
    }
  };

  // Restore session from ?session= URL parameter (share link reconstruction)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get("session");
    if (!sessionParam) return;

    try {
      const decoded = decodeSessionFromUrlParam(sessionParam);
      if (!decoded?.source) return;

      const lang = decoded.language || "nova";
      const sharedFile: FileItem = {
        id: "file-shared",
        name: `shared.${lang === "c" ? "c" : "nova"}`,
        content: decoded.source,
      };

      setLanguage(lang);
      setFiles(prev => [sharedFile, ...prev.filter(f => f.id !== "file-shared")]);
      setActiveFileId("file-shared");
      setViewMode("ide");

      // Clean up URL param without full reload
      const url = new URL(window.location.href);
      url.searchParams.delete("session");
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Silently ignore malformed session params
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        runCompile(activeFile.content, language, enabled);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        showToast("Workspace saved.", "info");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeFile.content, language, enabled, runCompile, showToast]);

  // Panel Resizer Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const containerWidth = window.innerWidth;
      const newPercent = Math.max(20, Math.min(80, (e.clientX / containerWidth) * 100));
      setEditorWidthPercent(newPercent);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const errors = useMemo(() => {
    if (!result) return [];
    const errList = [];
    if (result.lexErrors) errList.push(...result.lexErrors);
    if (result.parseErrors) errList.push(...result.parseErrors);
    if (result.semanticErrors) errList.push(...result.semanticErrors);
    return errList;
  }, [result]);

  if (viewMode === "landing") {
    return (
      <LandingPage
        onLaunchIDE={() => setViewMode("ide")}
        onSelectDemo={(code, demoLang) => {
          if (demoLang) setLanguage(demoLang);
          setFiles((prev) => [{ id: "file-demo", name: `demo.${demoLang === "c" ? "c" : "nova"}`, content: code }, ...prev]);
          setActiveFileId("file-demo");
          setViewMode("ide");
        }}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-text-primary overflow-hidden font-sans select-none">
      {/* Top Navbar Toolbar */}
      <header className="h-11 border-b border-border bg-surface flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode("landing")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-6 h-6 rounded bg-sage flex items-center justify-center font-bold text-white text-xs shadow-sm">
              C
            </div>
            <span className="font-extrabold text-sm tracking-tight text-text-primary hidden sm:inline-block">
              CompilerGPT Universe
            </span>
          </button>

          <button
            onClick={() => setShowSidebar((prev) => !prev)}
            className="px-2 py-1 bg-surface-elevated border border-border rounded text-[11px] text-text-secondary hover:text-text-primary"
            title="Toggle File Explorer"
          >
            📁 Files
          </button>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-surface-elevated px-2 py-0.5 rounded border border-border">
            <span className="text-[10px] text-text-secondary font-semibold">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-sage focus:outline-none cursor-pointer"
            >
              <option value="nova" className="bg-surface text-text-primary">Nova Language</option>
              <option value="c" className="bg-surface text-text-primary">C-Subset Language</option>
            </select>
          </div>

          <button
            onClick={() => runCompile(activeFile.content, language, enabled)}
            disabled={compiling}
            className="px-3 py-1 bg-sage text-white font-bold rounded text-xs hover:bg-sage/80 transition-all flex items-center gap-1.5 shadow-sm"
          >
            {compiling ? "Compiling..." : "▶ Compile"}
          </button>

          <button
            onClick={handleShareSession}
            className="px-2.5 py-1 bg-surface-elevated border border-border hover:border-sage text-text-primary font-semibold rounded text-xs transition-all flex items-center gap-1"
            title="Create Shareable URL"
          >
            🔗 Share
          </button>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCmdOpen(true)}
            className="px-2 py-1 bg-surface-elevated border border-border text-[11px] text-text-secondary hover:text-text-primary rounded hidden md:flex items-center gap-1"
          >
            <span>Search</span>
            <kbd className="bg-surface px-1 py-0.5 rounded text-[9px] border border-border">Ctrl+K</kbd>
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="px-2 py-1 bg-surface-elevated border border-border text-[11px] text-text-secondary hover:text-text-primary rounded"
            title="IDE Settings"
          >
            ⚙️ Settings
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer Sidebar */}
        {showSidebar && (
          <div className="w-56 border-r border-border bg-surface flex flex-col shrink-0">
            <FileExplorerSidebar
              files={files}
              activeFileId={activeFileId}
              onSelectFile={(id) => setActiveFileId(id)}
              onCreateFile={(name, content) => {
                const newFile = { id: `file-${Date.now()}`, name, content: content || `// ${name}\n` };
                setFiles((prev) => [...prev, newFile]);
                setActiveFileId(newFile.id);
              }}
              onDeleteFile={(id) => {
                if (files.length <= 1) return;
                setFiles((prev) => prev.filter((f) => f.id !== id));
                if (activeFileId === id) setActiveFileId(files[0].id);
              }}
              onRenameFile={(id, newName) => {
                setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, name: newName } : f)));
              }}
              onImportFiles={(imported) => {
                const newItems = imported.map((imp, idx) => ({
                  id: `file-imported-${Date.now()}-${idx}`,
                  name: imp.name,
                  content: imp.content,
                }));
                setFiles((prev) => [...newItems, ...prev]);
                if (newItems.length > 0) setActiveFileId(newItems[0].id);
              }}
              onExportProject={() => {
                const zipJson = JSON.stringify(files, null, 2);
                const blob = new Blob([zipJson], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "compilergpt-workspace.json";
                a.click();
              }}
            />
          </div>
        )}


        {/* Code Editor Panel */}
        <div style={{ width: `${editorWidthPercent}%` }} className="flex flex-col border-r border-border overflow-hidden">
          {/* File Tabs Bar */}
          <div className="h-8 bg-surface-elevated border-b border-border flex items-center px-2 gap-1 overflow-x-auto">
            {files.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFileId(f.id)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  f.id === activeFileId
                    ? "bg-surface text-sage border-t-2 border-sage font-bold"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {f.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden bg-background">
            <CodeEditor
              value={activeFile.content}
              onChange={handleEditorChange}
              errors={errors}
              fontSize={fontSize}
              tabSize={tabSize}
              theme={theme}
              language={language}
            />
          </div>

          {/* Bottom Terminal Console */}
          <div className="border-t border-border bg-surface shrink-0">
            <BottomTerminalConsole
              result={result}
              compiling={compiling}
              onRunCompile={() => runCompile(activeFile.content, language, enabled)}
              onExportJSON={() => {
                if (!result) return;
                const rec = createSessionRecord(result);
                exportSessionJSON(rec);
              }}
              onExportHTML={() => {
                if (!result) return;
                exportHTMLReport(result);
              }}
            />
          </div>

        </div>

        {/* Resizer Splitter Bar */}
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 bg-border hover:bg-sage cursor-col-resize shrink-0 transition-colors z-10"
          title="Drag to resize panels"
        />

        {/* Visualization & Compiler Laboratory Panels */}
        <div className="flex-1 flex flex-col overflow-hidden bg-surface">
          {/* Visualizer Tab Bar */}
          <div className="h-9 border-b border-border bg-surface flex items-center px-2 gap-1 overflow-x-auto shrink-0">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`tab-btn flex items-center gap-1.5 ${
                  tab === t.key ? "tab-btn-active" : "tab-btn-inactive"
                }`}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="flex-1 overflow-auto bg-background">
            {result ? (
              <>
                {tab === "explorer" && <CompilerExplorerView optLevels={result.optLevels} />}
                {tab === "learn" && <EducationalModeView result={result} />}
                {tab === "benchmark" && <BenchmarkLabView />}
                {tab === "compare" && <SideBySideCompareView currentSource={activeFile.content} />}
                {tab === "x86" && <X86View x86={result.x86} execution={result.x86Execution} />}
                {tab === "wasm" && <WasmView wasm={result.wasm} />}
                {tab === "research" && <ResearchDashboardView result={result} />}
                {tab === "timeline" && <LiveTimelineView timeline={result.timeline} />}
                {tab === "debugger" && <CompilerDebuggerView result={result} />}
                {tab === "tokens" && <TokenTable tokens={result.tokens} errors={result.lexErrors} />}
                {tab === "parsetable" && <ParseTableView parseTrace={result.parseTrace} />}
                {tab === "ast" && <ASTView ast={result.ast} errors={result.parseErrors} />}
                {tab === "scopetree" && <ScopeTreeView scopeTree={result.scopeTree} />}
                {tab === "symbols" && <SymbolTableView symbols={result.symbolTable} errors={result.semanticErrors} />}

                {tab === "ir" && (
                  <div className="h-full grid grid-cols-2 gap-2 p-2">
                    <IRView ir={result.ir} irOptimized={result.irOptimized} logs={result.optimizationLogs} />

                    <OptimizationLab
                      enabled={enabled}
                      onToggle={(key) => setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))}
                      logs={result.optimizationLogs}
                    />
                  </div>
                )}
                {tab === "replay" && <OptimizationReplayView logs={result.optimizationLogs} />}
                {tab === "cfg" && <CFGView cfg={result.cfgAfter} onSelectNode={setSelectedNode} />}
                {tab === "canvas" && (
                  <GraphEngineView
                    ast={result.ast}
                    cfg={result.cfgAfter}
                    callGraph={result.callGraph}
                    dominators={result.dominators}
                    regAlloc={result.regAlloc}
                  />
                )}
                {tab === "dataflow" && <DataFlowView dataflow={result.dataflow} />}
                {tab === "ssa" && <SSAView ssa={result.ssa} />}
                {tab === "dominators" && <DominatorView dominators={result.dominators} />}
                {tab === "regalloc" && <RegisterAllocView regAlloc={result.regAlloc} />}
                {tab === "callgraph" && <CallGraphView callGraph={result.callGraph} />}
                {tab === "memory" && <MemoryLayoutView memoryLayout={result.memoryLayout} />}
                {tab === "asm" && <AssemblyView assembly={result.assembly} />}
                {tab === "collab" && (
                  <div className="p-4">
                    <CollaborationPanel
                      source={activeFile.content}
                      onSourceChange={handleEditorChange}
                    />
                  </div>
                )}
                {tab === "metrics" && <MetricsDashboardView metrics={result.metrics} />}
                {tab === "workspace" && (
                  <MultiFileWorkspaceView
                    workspace={{
                      files: files.map((f) => ({ name: f.name, content: f.content })),
                      entryPoint: activeFile.name,
                    }}
                  />
                )}
                {tab === "mentor" && (
                  <MentorChat
                    artifacts={{
                      source: activeFile.content,
                      language,
                      tokens: result.tokens,
                      ast: result.ast,
                      symbolTable: result.symbolTable,
                      semanticErrors: result.semanticErrors,
                      ir: result.ir,
                      optimizedIR: result.irOptimized,
                      optimizationLogs: result.optimizationLogs,
                      cfg: result.cfgAfter,
                      ssa: result.ssa,
                      regAlloc: result.regAlloc,
                      dominators: result.dominators,
                      metrics: result.metrics,
                      x86: result.x86,
                    }}
                  />
                )}
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary flex-col gap-3">
                <div className="text-4xl opacity-30">⚡</div>
                <div className="font-medium">
                  {compiling ? "Compiling..." : "Write code and compile to explore the compiler pipeline."}
                </div>
                <div className="text-[11px]">
                  {!compiling && "Use Ctrl+Enter to compile manually, or enable Auto-Compile in Settings."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fontSize={fontSize}
        setFontSize={setFontSize}
        tabSize={tabSize}
        setTabSize={setTabSize}
        autoCompile={autoCompile}
        setAutoCompile={setAutoCompile}
        optLevel={optLevel}
        setOptLevel={setOptLevel}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onSelectTab={(k) => setTab(k as TabKey)}
        onSelectPreset={(code) => handleEditorChange(code)}
      />

      {/* Toast Notification Overlay */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-lg shadow-xl border text-sm font-medium flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === "success"
              ? "bg-sage/20 border-sage/50 text-sage"
              : toast.type === "error"
              ? "bg-terracotta/20 border-terracotta/50 text-terracotta"
              : "bg-surface-elevated border-border text-text-primary"
          }`}
          role="status"
          aria-live="polite"
        >
          <span>{toast.type === "success" ? "✓" : toast.type === "error" ? "✗" : "ℹ"}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
