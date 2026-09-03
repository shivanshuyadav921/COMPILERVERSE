// share.ts — Shareable session state serializer & URL codec.

export interface SharedSessionData {
  id: string;
  source: string;
  language: "nova" | "c";
  optLevel: string;
  target: "x86" | "wasm";
  timestamp: string;
  settings?: any;
}

// In-memory serverless cache for session IDs
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
    source,
    language,
    optLevel,
    target,
    timestamp: new Date().toISOString(),
    settings,
  };

  sessionStore.set(id, session);
  return session;
}

export function getSharedSession(id: string): SharedSessionData | null {
  return sessionStore.get(id) || null;
}

export function encodeSessionToUrlParam(session: SharedSessionData): string {
  try {
    const json = JSON.stringify({
      s: session.source,
      l: session.language,
      o: session.optLevel,
      t: session.target,
    });
    // Base64 encode for browser URL safety
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
    let jsonStr = "";
    if (typeof window !== "undefined") {
      jsonStr = decodeURIComponent(atob(param));
    } else {
      jsonStr = decodeURIComponent(Buffer.from(param, "base64").toString("utf-8"));
    }
    const parsed = JSON.parse(jsonStr);
    return {
      source: parsed.s,
      language: parsed.l || "nova",
      optLevel: parsed.o || "O2",
      target: parsed.t || "x86",
    };
  } catch {
    return null;
  }
}
