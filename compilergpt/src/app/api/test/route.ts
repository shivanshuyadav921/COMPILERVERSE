import { NextResponse } from "next/server";
import { runCompilerTestSuite } from "@/lib/compiler/__tests__/compiler.test";

export const runtime = "nodejs";

export async function GET() {
  try {
    const suiteResult = runCompilerTestSuite();
    return NextResponse.json(suiteResult);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Test suite execution failed" }, { status: 500 });
  }
}
