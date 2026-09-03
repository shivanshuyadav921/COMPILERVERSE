import { NextRequest, NextResponse } from "next/server";
import { createShareableSession, getSharedSession } from "@/lib/compiler/share";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, language, optLevel, target, settings } = body;

    if (!source || typeof source !== "string") {
      return NextResponse.json({ error: "source is required" }, { status: 400 });
    }

    const session = createShareableSession(source, language, optLevel, target, settings);
    return NextResponse.json(session);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to create shareable session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parameter is required" }, { status: 400 });
  }

  const session = getSharedSession(id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json(session);
}
