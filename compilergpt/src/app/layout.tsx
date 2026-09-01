import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CompilerGPT Universe",
  description: "An AI-native compiler intelligence platform — write, compile, and understand every phase of the Nova language.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-bg text-gray-100 antialiased">{children}</body>
    </html>
  );
}
