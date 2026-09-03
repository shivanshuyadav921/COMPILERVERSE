"use client";
import { useState } from "react";
import { DEFAULT_WORKSPACE_FILES, VirtualFile, compileWorkspace } from "@/lib/compiler/workspace";

export default function MultiFileWorkspaceView({
  onWorkspaceCompiled,
  workspace,
}: {
  onWorkspaceCompiled?: (res: any) => void;
  workspace?: { files: { name: string; content: string }[]; entryPoint?: string };
}) {
  const [files, setFiles] = useState<VirtualFile[]>(DEFAULT_WORKSPACE_FILES);
  const [activeFileName, setActiveFileName] = useState("Main.nova");


  const activeFile = files.find(f => f.name === activeFileName) || files[0];

  function updateContent(newContent: string) {
    setFiles(files.map(f => f.name === activeFileName ? { ...f, content: newContent } : f));
  }

  function handleCompile() {
    const res = compileWorkspace(files);
    onWorkspaceCompiled?.(res.compileResult);
  }


  return (
    <div className="h-full flex flex-col p-4 space-y-3">
      <div className="flex justify-between items-center bg-panel p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-accent">Multi-File Project Workspace</span>
          <span className="text-gray-500">({files.length} files)</span>
        </div>
        <button
          onClick={handleCompile}
          className="px-3 py-1.5 rounded bg-accent text-white font-bold hover:bg-accent/80 transition-all text-xs"
        >
          Build Multi-File Project ⚡
        </button>
      </div>

      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* File Tree */}
        <div className="w-48 card p-2 space-y-1 text-xs mono">
          <div className="text-[10px] uppercase text-gray-500 font-semibold p-1">Project Explorer</div>
          {files.map(f => (
            <div
              key={f.name}
              onClick={() => setActiveFileName(f.name)}
              className={`p-1.5 rounded cursor-pointer ${f.name === activeFileName ? "bg-accent/20 text-accent font-bold" : "text-gray-300 hover:bg-panel2"}`}
            >
              📄 {f.name}
            </div>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 card p-3 flex flex-col space-y-2">
          <div className="text-xs font-bold text-accent2 mono border-b border-border pb-1">Editing {activeFileName}</div>
          <textarea
            value={activeFile.content}
            onChange={e => updateContent(e.target.value)}
            className="flex-1 bg-panel2 text-gray-100 mono text-xs p-3 rounded border border-border outline-none focus:border-accent resize-none leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
}
