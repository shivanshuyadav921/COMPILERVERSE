#!/usr/bin/env node
// scripts/test-runner.js — Standalone compiler test runner.
// Runs all compiler tests directly via ts-node/tsx without requiring the dev server.
// Usage: npm run test

// We use Node's module registration to handle TypeScript imports.
// This requires tsx or ts-node to be available, so we bootstrap via the
// tsconfig path aliases ourselves with a minimal require hook.

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const projectRoot = path.resolve(__dirname, "..");

// Check if tsx is available (faster, no config needed)
function hasTsx() {
  try {
    execSync("npx tsx --version", { stdio: "pipe", cwd: projectRoot });
    return true;
  } catch {
    return false;
  }
}

// Run the test suite inline using the compiled JS in .next/server if available,
// otherwise transpile on-the-fly with tsx.
async function main() {
  console.log("CompilerGPT Universe — Compiler Test Suite");
  console.log("===========================================");
  console.log("Running standalone (no dev server required)\n");

  // Write a tiny runner shim that ts-node/tsx can execute
  const shimPath = path.join(projectRoot, "scripts", "_test_shim.mjs");

  // We can't easily import TS from Node without a transpiler, so we use tsx.
  // tsx is a zero-config TypeScript runner that works with path aliases if
  // tsconfig.json is present.
  const shimCode = `
import { runCompilerTestSuite } from "../src/lib/compiler/__tests__/compiler.test.ts";

const result = runCompilerTestSuite();
const { passed, failed, errors } = result;
const total = passed + failed;

console.log(\`Results: \${passed}/\${total} tests passed\`);

if (errors && errors.length > 0) {
  console.log("\\nFailed tests:");
  errors.forEach((e) => console.log("  ✗", e));
}

if (failed === 0) {
  console.log("\\n✅ All tests passed!");
  process.exit(0);
} else {
  console.log(\`\\n❌ \${failed} test(s) failed.\`);
  process.exit(1);
}
`;

  fs.writeFileSync(shimPath, shimCode, "utf-8");

  try {
    execSync(
      `npx tsx --tsconfig tsconfig.test.json ${shimPath}`,
      {
        cwd: projectRoot,
        stdio: "inherit",
        env: {
          ...process.env,
        },
      }
    );
  } finally {
    // Clean up shim file
    if (fs.existsSync(shimPath)) fs.unlinkSync(shimPath);
  }

}

main().catch((err) => {
  console.error("\nTest runner error:", err.message);
  process.exit(1);
});
