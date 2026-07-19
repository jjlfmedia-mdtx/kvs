import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck, Menu, X, LogIn, LogOut, FileImage, ShieldAlert } from "lucide-react";

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ username: string } | null>(null);

  const checkUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    checkUser();
    // Escuchar el evento de cambio de sesión o de subida para actualizar sesión
    window.addEventListener("focus", checkUser);
    return () => window.removeEventListener("focus", checkUser);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const baseLinks = [
    { href: "/", label: "Authenticate" },
    { href: "/verify", label: "Verify" },
    { href: "/registry/public", label: "Public Registry" },
  ];

  const authLinks = user
    ? [{ href: "/registry/private", label: "My Protected Images" }]
    : [];

  const links = [...baseLinks, ...authLinks];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ── Screen-Edge Glow Ring (first visit) ── */}
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

        {/* Auth CTA & Profile info */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-[var(--text-secondary)]">
                Logged: <span className="text-[var(--accent-cyan)] font-bold">@{user.username}</span>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs rounded-xl hover:bg-red-500/20 transition cursor-pointer"
              >
                <LogOut size={12} /> Exit
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-white font-mono text-xs rounded-xl hover:bg-white/10 transition"
            >
              <LogIn size={12} /> Sign In
            </Link>
          )}
          <Link
            href="/"
            className="px-5 py-2 bg-[var(--accent-cyan)] text-black font-mono text-xs font-bold rounded-[12px] shadow-[0_0_20px_rgba(0,229,255,0.25)] hover:shadow-cyan-glow-intense hover:scale-105 transition-all duration-200"
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
          
          <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
            {user ? (
              <div className="flex flex-col gap-2">
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  Logged: <span className="text-[var(--accent-cyan)]">@{user.username}</span>
                </span>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-xs rounded-xl hover:bg-red-500/20 transition w-full"
                >
                  <LogOut size={12} /> Exit
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-white/5 border border-white/10 text-white font-mono text-xs rounded-xl w-full"
              >
                <LogIn size={12} /> Sign In
              </Link>
            )}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="text-center py-2.5 bg-[var(--accent-cyan)] text-black font-mono font-bold rounded-[12px] text-xs"
            >
              Protect Image
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
