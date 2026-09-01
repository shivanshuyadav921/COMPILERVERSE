import { NextRequest, NextResponse } from "next/server";
import { compile } from "@/lib/compiler/pipeline";

export const runtime = "nodejs";

const MAX_SOURCE_LENGTH = 500000; // 500KB limit

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const source: string = body.source ?? "";
    const enabledPasses: Record<string, boolean> | undefined = body.enabledPasses;

    if (typeof source !== "string") {
      return NextResponse.json({ error: "source must be a string" }, { status: 400 });
    }

    if (source.length > MAX_SOURCE_LENGTH) {
      return NextResponse.json({ error: `source code exceeds maximum length of ${MAX_SOURCE_LENGTH} characters` }, { status: 400 });
    }

    const result = compile(source, enabledPasses);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Compilation failed" }, { status: 500 });
  }
}

