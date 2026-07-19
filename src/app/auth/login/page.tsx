"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, KeySquare, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');

    const url = isRegister ? '/api/auth/register' : '/api/auth/login';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Algo salió mal');
      }

      if (isRegister) {
        setIsRegister(false);
        setUsername('');
        setPassword('');
        alert('¡Usuario registrado con éxito! Inicia sesión ahora.');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-cyan)]/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 md:p-10 rounded-[28px] w-full max-w-md relative z-10 border border-[var(--glass-border)] shadow-2xl"
      >
        <div className="w-16 h-16 rounded-2xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 flex items-center justify-center mx-auto mb-6 shadow-cyan-glow">
          <Shield size={32} className="text-[var(--accent-cyan)]" />
        </div>
        <p className="text-center text-[10px] font-mono text-[var(--accent-cyan)] tracking-widest mb-2">KYLLERIUM VISUAL SIGNATURE</p>
        <h2 className="text-center text-3xl font-bold mb-8">
          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2">USUARIO</label>
            <input
              type="text"
              placeholder="Tu nombre de usuario"
              required
              className="w-full bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/20"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-2">CONTRASEÑA</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="w-full bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/20"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-red-400 font-mono text-xs text-center bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--accent-cyan)] text-black font-mono font-bold py-4 rounded-xl tracking-widest hover:shadow-cyan-glow-intense transition flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <KeySquare size={16} />
                {isRegister ? 'REGISTRARME' : 'ACCEDER'}
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-[var(--text-secondary)] hover:text-white transition font-medium"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes una cuenta? Regístrate'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
