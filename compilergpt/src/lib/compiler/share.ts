// share.ts — Shareable session state serializer & URL codec.
//
// ARCHITECTURE:
// The primary sharing mechanism is URL-based (encodeSessionToUrlParam / decodeSessionFromUrlParam).
// This encodes session state as a base64 URL parameter — fully Vercel-compatible with zero persistence.
//
// The in-memory sessionStore and /api/share endpoint provide an alternative ID-based sharing
// mechanism. NOTE: The in-memory Map is NOT persistent across serverless cold starts. It is only
// valid within a single server instance lifetime. For production persistent sharing, integrate
// a managed KV store (e.g., Vercel KV, Redis, or Upstash).

const MAX_SOURCE_LENGTH = 50_000; // 50KB limit for URL-encoded sessions
const ALLOWED_LANGUAGES = new Set(["nova", "c"]);
const ALLOWED_OPT_LEVELS = new Set(["O0", "O1", "O2", "O3"]);
const ALLOWED_TARGETS = new Set(["x86", "wasm"]);

export interface SharedSessionData {
  id: string;
  source: string;
  language: "nova" | "c";
  optLevel: string;
  target: "x86" | "wasm";
  timestamp: string;
  settings?: any;
}

// In-memory store — NOT persistent across serverless cold starts.
// Use only for single-instance development or ephemeral short-lived links.
const sessionStore = new Map<string, SharedSessionData>();

export function createShareableSession(
  source: string,
  language: "nova" | "c" = "nova",
  optLevel = "O2",
  target: "x86" | "wasm" = "x86",
  settings?: any
): SharedSessionData {
  const id = `share_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
  const session: SharedSessionData = {
    id,
    source: source.slice(0, MAX_SOURCE_LENGTH),
    language: ALLOWED_LANGUAGES.has(language) ? language : "nova",
    optLevel: ALLOWED_OPT_LEVELS.has(optLevel) ? optLevel : "O2",
    target: ALLOWED_TARGETS.has(target) ? target : "x86",
    timestamp: new Date().toISOString(),
    settings,
  };

  sessionStore.set(id, session);
  // Limit store size to prevent unbounded memory growth per instance
  if (sessionStore.size > 500) {
    const oldest = sessionStore.keys().next().value;
    if (oldest) sessionStore.delete(oldest);
  }
  return session;
}

export function getSharedSession(id: string): SharedSessionData | null {
  if (!id || typeof id !== "string" || !/^share_[a-z0-9_]+$/.test(id)) return null;
  return sessionStore.get(id) || null;
}

export function encodeSessionToUrlParam(session: SharedSessionData): string {
  try {
    const source = session.source.slice(0, MAX_SOURCE_LENGTH);
    const json = JSON.stringify({
      s: source,
      l: session.language,
      o: session.optLevel,
      t: session.target,
    });
    // Base64 encode for URL safety
    if (typeof window !== "undefined") {
      return btoa(encodeURIComponent(json));
    }
    return Buffer.from(encodeURIComponent(json)).toString("base64");
  } catch {
    return "";
  }
}

export function decodeSessionFromUrlParam(param: string): Partial<SharedSessionData> | null {
  try {
    // Input validation: reject if too long (prevent memory/CPU DoS)
    if (!param || typeof param !== "string" || param.length > 200_000) return null;

    let jsonStr = "";
    if (typeof window !== "undefined") {
      jsonStr = decodeURIComponent(atob(param));
    } else {
      jsonStr = decodeURIComponent(Buffer.from(param, "base64").toString("utf-8"));
    }

    // Reject excessively large decoded payloads
    if (jsonStr.length > MAX_SOURCE_LENGTH * 4) return null;

    const parsed = JSON.parse(jsonStr);

    // Validate and sanitize all fields — never trust URL input
    const source = typeof parsed.s === "string" ? parsed.s.slice(0, MAX_SOURCE_LENGTH) : "";
    const language = ALLOWED_LANGUAGES.has(parsed.l) ? parsed.l as "nova" | "c" : "nova";
    const optLevel = ALLOWED_OPT_LEVELS.has(parsed.o) ? parsed.o as string : "O2";
    const target = ALLOWED_TARGETS.has(parsed.t) ? parsed.t as "x86" | "wasm" : "x86";

    if (!source) return null;

    return { source, language, optLevel, target };
  } catch {
    return null;
  }
}
