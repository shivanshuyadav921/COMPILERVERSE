# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Controls
- Source code input length bounds check (`MAX_SOURCE_LENGTH = 500,000`).
- Mentor question input length bounds check (`MAX_QUESTION_LENGTH = 2000`) and prompt injection sanitization.
- No dynamic `eval()` or unsanitized shell execution.

## Reporting a Vulnerability
Please report security issues responsibly by contacting the repository maintainers.
