"use client";
import { useEffect } from "react";

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
  // Apply light/dark theme to the HTML document
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }, [theme]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const labelClass = "text-text-primary font-medium";
  const selectClass = "bg-surface-elevated border border-border text-text-primary rounded px-2.5 py-1 text-xs outline-none focus:border-sage transition-colors";
  const inputClass = "bg-surface-elevated border border-border text-text-primary rounded px-2.5 py-1 text-xs outline-none focus:border-sage transition-colors";

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface border border-border rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-bold text-sage tracking-wide uppercase">IDE Settings</h2>
            <p className="text-[11px] text-text-secondary mt-0.5">Configure editor preferences and compiler behavior</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary text-lg font-bold leading-none px-2 transition-colors"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Theme */}
          <div className="flex justify-between items-center">
            <div>
              <span className={labelClass}>Editor Theme</span>
              <div className="text-[10px] text-text-secondary">Applies to Monaco editor and IDE UI</div>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className={selectClass}
            >
              <option value="vs-dark">Dark (Default)</option>
              <option value="light">Light (Warm Ivory)</option>
              <option value="hc-black">High Contrast</option>
            </select>
          </div>

          {/* Font Size */}
          <div className="flex justify-between items-center">
            <div>
              <span className={labelClass}>Font Size</span>
              <div className="text-[10px] text-text-secondary">10–24px, affects editor monospace font</div>
            </div>
            <input
              type="number"
              min={10}
              max={24}
              value={fontSize}
              onChange={(e) => setFontSize(Math.min(24, Math.max(10, Number(e.target.value))))}
              className={`${inputClass} w-20 text-right`}
            />
          </div>

          {/* Tab Size */}
          <div className="flex justify-between items-center">
            <div>
              <span className={labelClass}>Tab Size</span>
              <div className="text-[10px] text-text-secondary">Indentation width in spaces</div>
            </div>
            <select
              value={tabSize}
              onChange={(e) => setTabSize(Number(e.target.value))}
              className={selectClass}
            >
              <option value={2}>2 spaces</option>
              <option value={4}>4 spaces</option>
            </select>
          </div>

          {/* Optimization Level Preset */}
          <div className="flex justify-between items-center">
            <div>
              <span className={labelClass}>Compiler Opt Level</span>
              <div className="text-[10px] text-text-secondary">Default optimization preset for compile button</div>
            </div>
            <select
              value={optLevel}
              onChange={(e) => setOptLevel(e.target.value)}
              className={selectClass}
            >
              <option value="O0">-O0 (No Optimizations)</option>
              <option value="O1">-O1 (Constant Fold + DCE)</option>
              <option value="O2">-O2 (Full Pipeline)</option>
              <option value="O3">-O3 (Aggressive DCE &amp; CSE)</option>
            </select>
          </div>

          {/* Auto Compile Toggle */}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div>
              <div className={labelClass}>Auto-Compile on Typing</div>
              <div className="text-[10px] text-text-secondary">Automatically recompiles after editing (300ms debounce)</div>
            </div>
            <div
              onClick={() => setAutoCompile(!autoCompile)}
              className={`w-9 h-5 rounded-full cursor-pointer transition-colors relative ${autoCompile ? "bg-sage" : "bg-border"}`}
              role="switch"
              aria-checked={autoCompile}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoCompile ? "translate-x-4" : "translate-x-0"}`} />
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center">
          <span className="text-[10px] text-text-secondary">
            Changes apply immediately to the IDE.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-sage text-white font-semibold text-xs hover:bg-sage/80 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
