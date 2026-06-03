import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RR Connect Sahayak",
  description: "Quick, simple support — tap and get help in your language.",
};

export const viewport: Viewport = {
  themeColor: "#E11D2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi">
      <body className="antialiased">{children}</body>
    </html>
  );
}
