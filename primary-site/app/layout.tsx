import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Traditional Wedding",
  description: "Traditional Wedding 30/01/2027 Cindy Migiro &Dorbor Kollie",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
