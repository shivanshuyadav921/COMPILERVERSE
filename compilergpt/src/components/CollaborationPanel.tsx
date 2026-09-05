"use client";
import { useState, useEffect, useRef } from "react";

interface Peer {
  id: string;
  name: string;
  color: string;
  cursorLine: number;
}

const PEER_COLORS = ["#7c9d8b", "#c86d51", "#c99a4e", "#5e8c8a", "#b57882", "#7b8a56"];

export default function CollaborationPanel({
  source,
  onSourceChange,
}: {
  source: string;
  onSourceChange: (s: string) => void;
}) {
  const [roomId, setRoomId] = useState<string>("compiler-universe-collab");
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [peers, setPeers] = useState<Peer[]>([
    { id: "peer-1", name: "Compiler Researcher (Alice)", color: PEER_COLORS[0], cursorLine: 3 },
    { id: "peer-2", name: "LLVM Engineer (Bob)", color: PEER_COLORS[2], cursorLine: 8 },
  ]);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(`compiler_collab_${roomId}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        if (event.data?.type === "CODE_SYNC" && event.data.source !== undefined) {
          onSourceChange(event.data.source);
        }
      };

      return () => {
        channel.close();
      };
    }
  }, [roomId, onSourceChange]);

  const handleBroadcastCode = (newCode: string) => {
    onSourceChange(newCode);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: "CODE_SYNC", source: newCode });
    }
  };

  return (
    <div className="card p-3 flex flex-col space-y-3 text-xs font-sans">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sage animate-pulse" />
          <span className="font-bold text-text-primary">Live Collaboration Session</span>
        </div>
        <span className="text-[11px] text-sage font-bold bg-sage/10 px-2 py-0.5 rounded border border-sage/40">
          {isConnected ? "Connected (Local Broadcast)" : "Disconnected"}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="flex-1 px-2.5 py-1 bg-surface-elevated border border-border rounded text-text-primary mono text-xs focus:outline-none focus:border-sage"
          placeholder="Room Session ID"
        />
        <button
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href).then(() => {
              setCopyStatus("Copied!");
              setTimeout(() => setCopyStatus(""), 2000);
            }).catch(() => {
              prompt("Copy this link:", window.location.href);
            });
          }}
          className="px-3 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-text-primary font-semibold"
        >
          {copyStatus || "Copy Link"}
        </button>
      </div>

      {/* Peer Avatars */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-text-secondary uppercase font-bold tracking-wide">
          Active Collaborators ({peers.length + 1})
        </span>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated border border-sage rounded-full text-[11px]">
            <span className="w-2 h-2 rounded-full bg-sage" />
            <span className="font-bold text-text-primary">You (Host)</span>
          </div>
          {peers.map((peer) => (
            <div
              key={peer.id}
              className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated border border-border rounded-full text-[11px]"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: peer.color }} />
              <span className="text-text-secondary">{peer.name}</span>
              <span className="text-[10px] text-text-secondary opacity-70">L{peer.cursorLine}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
