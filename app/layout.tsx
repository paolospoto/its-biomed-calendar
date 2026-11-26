import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ITS Biomed Calendar",
  description: "Calendar for ITS students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
