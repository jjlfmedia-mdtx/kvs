import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Kyllerium Visual Signature",
  description: "Authenticity Beyond Visibility. Advanced invisible watermarking and digital provenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col`}>
        <nav className="border-b border-[var(--glass-border)] bg-[var(--bg-secondary)] py-4 px-6 md:px-12 flex justify-between items-center glass-card shadow-cyan-glow z-50 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--accent-cyan)]/20 flex items-center justify-center border border-[var(--accent-cyan)] shadow-cyan-glow">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div className="font-bold text-xl tracking-wider text-white">
              KVS
            </div>
          </div>
          <div className="hidden md:flex space-x-8 text-sm text-[var(--text-secondary)] font-medium">
            <Link href="/" className="hover:text-[var(--accent-cyan)] transition">Authenticate</Link>
            <Link href="/verify" className="hover:text-[var(--accent-cyan)] transition">Verify</Link>
            <Link href="/admin" className="hover:text-[var(--accent-cyan)] transition">Command Center</Link>
          </div>
          <div className="hidden md:block">
            <Link href="/" className="px-5 py-2.5 bg-[var(--accent-cyan)] text-black font-mono text-sm font-bold rounded shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)] transition">
              Protect Image
            </Link>
          </div>
          {/* Mobile hamburger placeholder */}
          <div className="md:hidden">
            <button className="text-[var(--accent-cyan)] p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </nav>
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <footer className="py-8 text-center text-xs text-[var(--text-secondary)] border-t border-[var(--glass-border)] bg-[var(--bg-secondary)]/50 backdrop-blur-md">
          <p className="mb-2">POWERED BY C2PA & KYLLERIUM CORPORATION</p>
          <p className="font-mono opacity-50">© {new Date().getFullYear()} All rights reserved. SECURE CONNECTION.</p>
        </footer>
      </body>
    </html>
  );
}
