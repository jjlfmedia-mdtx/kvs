"use client";
// src/app/components/NavBar.tsx
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Menu, X } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Trigger screen glow on first visit
  useEffect(() => {
    setMounted(true);
    const seen = sessionStorage.getItem("kvs-glow-seen");
    if (!seen) {
      setShowGlow(true);
      sessionStorage.setItem("kvs-glow-seen", "1");
      setTimeout(() => setShowGlow(false), 3600);
    }
  }, []);

  const links = [
    { href: "/", label: "Authenticate" },
    { href: "/verify", label: "Verify" },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── Screen-Edge Glow Ring (first visit) ── */}
      {mounted && showGlow && <div className="screen-glow-ring" aria-hidden />}

      <nav className="sticky top-0 z-50 border-b border-[var(--glass-border)] glass-card py-3.5 px-6 md:px-12 flex justify-between items-center shadow-cyan-glow"
        style={{ borderRadius: 0 }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-[14px] bg-[var(--accent-cyan)]/15 flex items-center justify-center border border-[var(--accent-cyan)]/40 shadow-cyan-glow group-hover:shadow-cyan-glow-intense transition-all duration-300">
            <ShieldCheck size={18} className="text-[var(--accent-cyan)]" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-[0.2em] text-white">KVS</span>
            <span className="hidden md:inline text-[10px] font-mono text-[var(--accent-cyan)]/60 ml-2 tracking-widest">v3.0</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`relative py-1 transition-all duration-200 ${
                isActive(href)
                  ? "text-[var(--accent-cyan)]"
                  : "text-[var(--text-secondary)] hover:text-white"
              }`}
            >
              {label}
              {isActive(href) && (
                <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[var(--accent-cyan)] rounded-full shadow-cyan-glow" />
              )}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link
            href="/"
            className="px-5 py-2.5 bg-[var(--accent-cyan)] text-black font-mono text-sm font-bold rounded-[14px] shadow-[0_0_20px_rgba(0,229,255,0.35)] hover:shadow-cyan-glow-intense hover:scale-105 transition-all duration-200"
          >
            Protect Image
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-[var(--accent-cyan)] p-2 rounded-xl border border-[var(--glass-border)] bg-white/5 hover:bg-white/10 transition"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* ── Mobile Menu ── */}
      {mobileOpen && (
        <div className="md:hidden glass-card border-b border-[var(--glass-border)] px-6 py-4 flex flex-col gap-4"
          style={{ borderRadius: 0 }}>
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`py-2 font-medium transition ${
                isActive(href) ? "text-[var(--accent-cyan)]" : "text-[var(--text-secondary)]"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="mt-2 text-center py-3 bg-[var(--accent-cyan)] text-black font-mono font-bold rounded-[14px] text-sm"
          >
            Protect Image
          </Link>
        </div>
      )}
    </>
  );
}
