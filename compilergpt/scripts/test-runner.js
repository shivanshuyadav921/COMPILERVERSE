// Test runner: invokes the compiler test suite via the Next.js API test endpoint.
// Usage: npm run test
// Requires `next start` or `next dev` running on localhost:3000.
//
// Alternatively, the test suite can be run directly via the /api/test endpoint
// during development or CI.

const http = require("http");

const PORT = process.env.TEST_PORT || 3000;

function runTests() {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "localhost", port: PORT, path: "/api/test", method: "GET" },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch {
            reject(new Error("Failed to parse test response: " + data));
          }
        });
      }
    );
    req.on("error", (err) => {
      reject(new Error(`Cannot connect to server at localhost:${PORT}. Run 'npm run dev' first. Error: ${err.message}`));
    });
    req.end();
  });
}

async function main() {
  console.log("CompilerGPT Universe — Compiler Test Suite");
  console.log("===========================================");
  console.log(`Connecting to localhost:${PORT}/api/test...\n`);

  try {
    const result = await runTests();

    if (result.error) {
      console.error("Test suite error:", result.error);
      process.exit(1);
    }

    const { passed, failed, errors } = result;
    const total = passed + failed;

    console.log(`Results: ${passed}/${total} tests passed`);
    if (errors && errors.length > 0) {
      console.log("\nFailed tests:");
      errors.forEach((e) => console.log("  ✗", e));
    }

    if (failed === 0) {
      console.log("\n✅ All tests passed!");
      process.exit(0);
    } else {
      console.log(`\n❌ ${failed} test(s) failed.`);
      process.exit(1);
    }
  } catch (err) {
    console.error("\n" + err.message);
    console.log("\nNote: The compiler test suite runs via the /api/test endpoint.");
    console.log("Start the development server first: npm run dev");
    process.exit(1);
  }
}

main();
