import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompilerGPT Universe",
  description: "An AI-native compiler intelligence platform — write, compile, and understand every phase of the Nova language.",
  keywords: ["compiler", "compiler explorer", "SSA", "IR", "WASM", "x86", "register allocation", "Nova language"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-text-primary antialiased">{children}</body>
    </html>
  );
}
