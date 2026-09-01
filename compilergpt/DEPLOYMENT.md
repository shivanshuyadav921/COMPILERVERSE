# Deployment & Setup Guide

## Local Installation

### Prerequisites
- Node.js 18.x or 20.x
- npm 9.x or later

### Steps
1. **Clone Repository & Install Dependencies**:
   ```bash
   git clone https://github.com/compilergpt/compilergpt-universe.git
   cd compilergpt-universe
   npm install
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   ANTHROPIC_API_KEY=your_optional_api_key_here
   ```
   *(Note: If `ANTHROPIC_API_KEY` is omitted, the AI Investigator automatically falls back to grounded rule-based explanations derived directly from compiler artifacts).*

3. **Development Server**:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

4. **Production Build & Verification**:
   ```bash
   npm run build
   npm start
   ```

---

## Vercel Deployment

1. Connect your GitHub repository to Vercel.
2. Framework Preset: **Next.js**.
3. Build Command: `npm run build`.
4. Output Directory: `.next`.
5. Environment Variables: Optionally set `ANTHROPIC_API_KEY`.
6. Click **Deploy**.
