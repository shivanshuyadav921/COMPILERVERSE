"use client";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: string;
  setTheme: (t: string) => void;
  fontSize: number;
  setFontSize: (s: number) => void;
  tabSize: number;
  setTabSize: (s: number) => void;
  autoCompile: boolean;
  setAutoCompile: (b: boolean) => void;
  optLevel: string;
  setOptLevel: (lvl: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  tabSize,
  setTabSize,
  autoCompile,
  setAutoCompile,
  optLevel,
  setOptLevel,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-panel border border-border rounded-xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-150">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h2 className="text-sm font-bold text-accent tracking-wide uppercase">Compiler IDE Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold leading-none px-2"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Theme */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Editor Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-panel2 border border-border text-gray-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
            >
              <option value="vs-dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Font Size (px)</span>
            <input
              type="number"
              min={10}
              max={24}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-panel2 border border-border text-gray-200 rounded px-2.5 py-1 w-20 text-xs text-right outline-none focus:border-accent"
            />
          </div>

          {/* Tab Size */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Tab Size (spaces)</span>
            <select
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
              className="bg-panel2 border border-border text-gray-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>

          {/* Optimization Level Preset */}
          <div className="flex justify-between items-center">
            <span className="text-gray-300 font-medium">Compiler Opt Level</span>
            <select
              value={optLevel}
              onChange={(e) => setOptLevel(e.target.value)}
              className="bg-panel2 border border-border text-gray-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
            >
              <option value="O0">-O0 (No Optimizations)</option>
              <option value="O1">-O1 (Basic Folding)</option>
              <option value="O2">-O2 (Standard Opt Pipeline)</option>
              <option value="O3">-O3 (Aggressive DCE & CSE)</option>
            </select>
          </div>

          {/* Auto Compile Toggle */}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div>
              <div className="text-gray-300 font-medium">Auto-Compile on Typing</div>
              <div className="text-[10px] text-gray-500">Debounces compilation by 500ms</div>
            </div>
            <input
              type="checkbox"
              checked={autoCompile}
              onChange={(e) => setAutoCompile(e.target.checked)}
              className="w-4 h-4 accent-accent cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-accent text-white font-semibold text-xs hover:bg-accent/80 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
