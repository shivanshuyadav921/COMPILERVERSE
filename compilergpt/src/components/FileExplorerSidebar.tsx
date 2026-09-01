"use client";
import { useState } from "react";
import { DEMO_PROGRAMS } from "./LandingPage";

export interface FileItem {
  id: string;
  name: string;
  content: string;
  folder?: string;
}

interface FileExplorerProps {
  files: FileItem[];
  activeFileId: string;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string, content?: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
  onImportFiles: (imported: { name: string; content: string }[]) => void;
  onExportProject: () => void;
}

export default function FileExplorerSidebar({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onImportFiles,
  onExportProject,
}: FileExplorerProps) {
  const [newFileName, setNewFileName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = () => {
    if (!newFileName.trim()) return;
    const name = newFileName.trim().endsWith(".nova") ? newFileName.trim() : `${newFileName.trim()}.nova`;
    onCreateFile(name, "// Nova Source File\n");
    setNewFileName("");
    setIsCreating(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const readers = droppedFiles.map((file) => {
      return new Promise<{ name: string; content: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (evt) => {
          resolve({ name: file.name, content: (evt.target?.result as string) || "" });
        };
        reader.readAsText(file);
      });
    });

    Promise.all(readers).then((res) => {
      onImportFiles(res);
    });
  };

  return (
    <div
      className="w-56 bg-panel border-r border-border flex flex-col font-sans text-xs select-none"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleFileDrop}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-border flex justify-between items-center bg-panel2">
        <span className="font-bold text-gray-300 uppercase tracking-wider text-[10px]">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(true)}
            title="New File"
            className="p-1 hover:bg-panel rounded text-gray-400 hover:text-accent font-bold"
          >
            +
          </button>
          <button
            onClick={onExportProject}
            title="Export Project"
            className="p-1 hover:bg-panel rounded text-gray-400 hover:text-accent"
          >
            📥
          </button>
        </div>
      </div>

      {/* Preset Demos Quick Loader */}
      <div className="p-2 border-b border-border bg-panel/50">
        <div className="text-[10px] uppercase font-semibold text-gray-500 mb-1">Load Demo Preset:</div>
        <select
          onChange={(e) => {
            const demo = DEMO_PROGRAMS.find((d) => d.name === e.target.value);
            if (demo) onCreateFile(`${demo.name.replace(/\s+/g, "")}.nova`, demo.code);
          }}
          className="w-full bg-panel2 border border-border text-gray-300 text-[11px] rounded px-2 py-1 outline-none"
        >
          <option value="">Select Sample...</option>
          {DEMO_PROGRAMS.map((demo, idx) => (
            <option key={idx} value={demo.name}>
              {demo.name}
            </option>
          ))}
        </select>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        <div className="text-[10px] uppercase font-semibold text-gray-500 px-1 py-1">Project Workspace</div>
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingId === file.id;

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition-colors ${
                isActive ? "bg-accent/20 text-accent font-semibold border border-accent/30" : "text-gray-300 hover:bg-panel2"
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span className="text-accent2 text-xs">📄</span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onRenameFile(file.id, editingName);
                        setEditingId(null);
                      } else if (e.key === "Escape") {
                        setEditingId(null);
                      }
                    }}
                    autoFocus
                    className="bg-panel2 text-white border border-accent px-1 py-0.5 rounded w-full outline-none"
                  />
                ) : (
                  <span className="truncate mono text-[11px]">{file.name}</span>
                )}
              </div>

              {!isEditing && (
                <div className="hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(file.id);
                      setEditingName(file.name);
                    }}
                    className="text-gray-400 hover:text-white px-1"
                    title="Rename"
                  >
                    ✏️
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file.id);
                      }}
                      className="text-gray-400 hover:text-err px-1"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* New File Inline Input */}
        {isCreating && (
          <div className="flex items-center gap-1 px-2 py-1 bg-panel2 rounded border border-accent">
            <span className="text-accent">📄</span>
            <input
              type="text"
              placeholder="filename.nova"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setIsCreating(false);
              }}
              autoFocus
              className="bg-transparent text-white text-[11px] outline-none flex-1 mono"
            />
          </div>
        )}
      </div>

      {/* Drag and Drop Footer Note */}
      <div className="p-2 border-t border-border bg-panel2 text-[10px] text-gray-500 text-center">
        Drag & drop .nova files here to import
      </div>
    </div>
  );
}
