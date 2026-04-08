import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Warmerdam Consulting - Dashboard",
  description: "Agency dashboard voor Warmerdam Consulting",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full bg-[#0F172A] text-white">{children}</body>
    </html>
  );
}
