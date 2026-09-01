# Contributing to CompilerGPT Universe

Thank you for your interest in contributing to **CompilerGPT Universe**!

## Development Guidelines

1. **Environment Setup**:
   ```bash
   npm install
   npm run dev
   ```
2. **Coding Standards**:
   - Write clean, strictly-typed TypeScript.
   - Maintain full compiler correctness; do not invent or fake compiler outputs.
   - Run `npm run build` before submitting pull requests.

3. **Submitting Pull Requests**:
   - Open a PR describing your feature or bug fix.
   - Ensure all unit tests in `src/lib/compiler/__tests__/compiler.test.ts` pass.
