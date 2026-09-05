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
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [peers, setPeers] = useState<Peer[]>([]);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const selfId = useRef<string>(`peer-${Math.random().toString(36).slice(2, 7)}`);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;

    const currentSelfId = selfId.current;
    const channel = new BroadcastChannel(`compiler_collab_${roomId}`);
    channelRef.current = channel;
    setIsConnected(true);

    // Announce presence to other tabs
    channel.postMessage({ type: "PEER_JOIN", peerId: currentSelfId });

    channel.onmessage = (event) => {
      const { type, peerId, source, cursorLine } = event.data || {};
      if (type === "CODE_SYNC" && source !== undefined) {
        onSourceChange(source);
      } else if (type === "PEER_JOIN" && peerId) {
        setPeers((prev) => {
          if (prev.some((p) => p.id === peerId)) return prev;
          const color = PEER_COLORS[prev.length % PEER_COLORS.length];
          return [...prev, { id: peerId, name: `Tab ${peerId.slice(-5)}`, color, cursorLine: 1 }];
        });
        // Reply so the joiner knows about us
        channel.postMessage({ type: "PEER_JOIN", peerId: currentSelfId });
      } else if (type === "PEER_LEAVE" && peerId) {
        setPeers((prev) => prev.filter((p) => p.id !== peerId));
      } else if (type === "CURSOR_UPDATE" && peerId && cursorLine !== undefined) {
        setPeers((prev) => prev.map((p) => p.id === peerId ? { ...p, cursorLine } : p));
      }
    };

    return () => {
      channel.postMessage({ type: "PEER_LEAVE", peerId: currentSelfId });
      channel.close();
      setIsConnected(false);
      setPeers([]);
    };
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
          <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-sage animate-pulse" : "bg-gray-500"}`} />
          <span className="font-bold text-text-primary">Tab Sync Session</span>
        </div>
        <span className="text-[11px] text-sage font-bold bg-sage/10 px-2 py-0.5 rounded border border-sage/40">
          {isConnected ? "Connected (Same-Origin Tabs)" : "Connecting…"}
        </span>
      </div>

      <p className="text-[11px] text-text-secondary leading-relaxed">
        Open this app in another tab in the same browser to sync code changes in real-time via BroadcastChannel.
      </p>

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
          Active Tabs ({peers.length + 1})
        </span>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-surface-elevated border border-sage rounded-full text-[11px]">
            <span className="w-2 h-2 rounded-full bg-sage" />
            <span className="font-bold text-text-primary">This Tab</span>
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
          {peers.length === 0 && (
            <span className="text-[11px] text-text-secondary opacity-60 italic">No other tabs connected</span>
          )}
        </div>
      </div>
    </div>
  );
}

