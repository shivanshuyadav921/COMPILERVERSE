import { NextResponse } from "next/server";
import { runCompilerTestSuite } from "@/lib/compiler/__tests__/compiler.test";

export const runtime = "nodejs";

// This endpoint is for development and CI verification.
// In production it is disabled unless ENABLE_TEST_ENDPOINT=true is explicitly set.
export async function GET() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ENABLE_TEST_ENDPOINT !== "true"
  ) {
    return NextResponse.json(
      { error: "Test endpoint is disabled in production. Set ENABLE_TEST_ENDPOINT=true to enable." },
      { status: 403 }
    );
  }

  try {
    const suiteResult = runCompilerTestSuite();
    return NextResponse.json(suiteResult);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Test suite execution failed" }, { status: 500 });
  }
}
