import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VendrSurf",
  description: "AI-powered hardware procurement",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
