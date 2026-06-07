// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/NavBar";
import ScreenEdgeGlow from "./components/ScreenEdgeGlow";
import WelcomeSplash from "./components/WelcomeSplash";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Kyllerium Visual Signature | Autenticidad Más Allá de lo Visible",
  description:
    "KVS Engine v3.0 – Protección criptográfica invisible de imágenes digitales. C2PA, DCT, LSB y EXIF firmado. Kyllerium Corporation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ScreenEdgeGlow />
        <WelcomeSplash />
        <NavBar />
        <main className="flex-grow flex flex-col">{children}</main>
        <footer className="py-8 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]/70 backdrop-blur-md">
          <p className="mb-1 tracking-widest text-[10px]">
            POWERED BY C2PA &amp; KYLLERIUM CORPORATION · KVSE v3.0
          </p>
          <p className="font-mono opacity-40 text-[10px]">
            © {new Date().getFullYear()} All rights reserved. SECURE CONNECTION ACTIVE.
          </p>
        </footer>
      </body>
    </html>
  );
}
