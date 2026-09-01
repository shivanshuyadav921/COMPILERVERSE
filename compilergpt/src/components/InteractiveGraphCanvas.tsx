"use client";
import { useState, useRef } from "react";

export interface GraphNode {
  id: string;
  label: string;
  sublabel?: string;
  color?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  color?: string;
}

export default function InteractiveGraphCanvas({
  title,
  nodes,
  edges,
}: {
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}) {
  const [scale, setScale] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const exportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title.toLowerCase().replace(/\s+/g, "_")}.svg`;
    link.click();
  };

  const exportPNG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width || 1200;
      canvas.height = img.height || 800;
      if (ctx) {
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = pngUrl;
        link.download = `${title.toLowerCase().replace(/\s+/g, "_")}.png`;
        link.click();
      }
    };
    img.src = url;
  };

  if (!nodes || nodes.length === 0) return <div className="text-gray-500 text-sm p-4">No graph data available for {title}.</div>;

  const colCount = Math.ceil(Math.sqrt(nodes.length));
  const nodeWidth = 170, nodeHeight = 54, gapX = 60, gapY = 50;

  const nodePositions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    const row = Math.floor(i / colCount);
    const col = i % colCount;
    nodePositions[n.id] = {
      x: 40 + col * (nodeWidth + gapX),
      y: 40 + row * (nodeHeight + gapY),
    };
  });

  const totalWidth = colCount * (nodeWidth + gapX) + 80;
  const totalHeight = Math.ceil(nodes.length / colCount) * (nodeHeight + gapY) + 80;

  return (
    <div className="h-full flex flex-col p-4 space-y-3">
      <div className="flex justify-between items-center bg-panel p-2.5 border border-border rounded-lg text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-accent">{title} Interactive Canvas</span>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-panel2 border border-border text-gray-200 rounded px-2.5 py-1 text-xs outline-none focus:border-accent"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button onClick={() => setScale(s => Math.max(0.4, s - 0.2))} className="px-2 py-1 bg-panel2 rounded text-gray-300 border border-border">-</button>
            <span className="mono text-gray-400">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2.5, s + 0.2))} className="px-2 py-1 bg-panel2 rounded text-gray-300 border border-border">+</button>
            <button onClick={() => setScale(1)} className="px-2 py-1 bg-panel2 rounded text-gray-300 border border-border">Reset</button>
          </div>
          <button onClick={exportSVG} className="px-3 py-1 bg-panel2 text-gray-300 border border-border rounded hover:text-white">Export SVG</button>
          <button onClick={exportPNG} className="px-3 py-1 bg-accent text-white font-bold rounded hover:bg-accent/80">Export PNG</button>
        </div>
      </div>

      <div className="flex-1 border border-border rounded-lg bg-panel overflow-auto p-4 flex items-center justify-center">
        <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", transition: "transform 0.15s ease" }}>
          <svg ref={svgRef} width={totalWidth} height={totalHeight} className="mono">
            <defs>
              <marker id="canvas-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 Z" fill="#7c5cff" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((e, idx) => {
              const p1 = nodePositions[e.from];
              const p2 = nodePositions[e.to];
              if (!p1 || !p2) return null;

              const isSelected = selectedNodeId === e.from || selectedNodeId === e.to;
              const color = isSelected ? "#ffb454" : e.color || "#7c5cff";

              return (
                <g key={idx}>
                  <line
                    x1={p1.x + nodeWidth / 2}
                    y1={p1.y + nodeHeight / 2}
                    x2={p2.x + nodeWidth / 2}
                    y2={p2.y + nodeHeight / 2}
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                    opacity={isSelected ? 1 : 0.6}
                    markerEnd="url(#canvas-arrow)"
                  />
                  {e.label && (
                    <text
                      x={(p1.x + p2.x) / 2 + nodeWidth / 2}
                      y={(p1.y + p2.y) / 2 + nodeHeight / 2 - 4}
                      fill="#888"
                      fontSize={9}
                    >
                      {e.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map(n => {
              const pos = nodePositions[n.id];
              const matchesSearch = searchQuery && n.label.toLowerCase().includes(searchQuery.toLowerCase());
              const isSelected = selectedNodeId === n.id || matchesSearch;

              const fill = isSelected ? "#242438" : "#191922";
              const stroke = isSelected ? "#38e1c6" : n.color || "#7c5cff";

              return (
                <g
                  key={n.id}
                  onClick={() => setSelectedNodeId(isSelected ? null : n.id)}
                  className="cursor-pointer"
                >
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={6}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={isSelected ? 2.5 : 1}
                  />
                  <text x={pos.x + 10} y={pos.y + 20} fill="#fff" fontSize={11} fontWeight={600}>
                    {n.label}
                  </text>
                  {n.sublabel && (
                    <text x={pos.x + 10} y={pos.y + 36} fill="#888" fontSize={9}>
                      {n.sublabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
