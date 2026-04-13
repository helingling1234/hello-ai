import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MutSearch — Mutation Gene Search",
  description: "Search genetic mutations and explore their impact on disease using TransVar, PubMed, and ClinVar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
