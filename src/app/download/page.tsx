// src/app/download/page.tsx
"use client";

import React from 'react';
import { Download, ShieldCheck, Smartphone, Cpu, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DownloadPage() {
  return (
    <main className="min-h-screen py-16 px-4 md:px-12 flex flex-col items-center justify-center relative overflow-hidden bg-[#03050a]">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--accent-cyan)]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-[var(--accent-purple)]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl text-center z-10">
        {/* Brand/Version */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/25 mb-8">
          <Smartphone size={14} className="text-[var(--accent-cyan)]" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent-cyan)]">VerSecured Mobile App</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          Protección KVS en tu Bolsillo
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto">
          Descarga la aplicación oficial para Android y asegura tus fotografías directamente desde tu cámara o galería sin duplicar archivos.
        </p>

        {/* Main Download Card */}
        <div className="glass-card border border-[var(--glass-border)] rounded-[24px] p-8 md:p-12 mb-12 shadow-[0_0_50px_rgba(0,229,255,0.05)] text-left flex flex-col md:flex-row items-center gap-8 relative">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-3">Versión de Producción v3.0</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Compatible con dispositivos Android 5.0 o superior. Incluye conexión automática a la API de VerSecured y descargas directas en formato certificado.
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                <CheckCircle size={16} className="text-[var(--accent-cyan)] flex-shrink-0" />
                <span>Integración limpia con cámara y galería local</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                <CheckCircle size={16} className="text-[var(--accent-cyan)] flex-shrink-0" />
                <span>Borrado automático de la foto original sin procesar</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-[var(--text-primary)]">
                <CheckCircle size={16} className="text-[var(--accent-cyan)] flex-shrink-0" />
                <span>Descarga automática de certificados PDF y PNG</span>
              </li>
            </ul>

            {/* Download Button */}
            <a 
              href="/kvs-app.apk" 
              download="kvs-app-v3.0.apk"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[var(--accent-cyan)] text-black font-mono font-bold rounded-[16px] shadow-[0_0_30px_rgba(0,229,255,0.3)] hover:shadow-cyan-glow-intense hover:scale-[1.03] transition-all duration-200"
            >
              <Download size={18} />
              Descargar APK (v3.0)
            </a>
          </div>

          {/* Phone Mockup Icon Area */}
          <div className="w-40 h-56 rounded-[28px] border-4 border-[#1E2D4A] bg-[#080d1a] relative overflow-hidden flex items-center justify-center flex-shrink-0 shadow-[0_0_30px_rgba(0,229,255,0.07)]">
            <div className="absolute top-2 w-16 h-3.5 bg-[#1E2D4A] rounded-full" />
            <div className="flex flex-col items-center gap-2">
              <ShieldCheck size={48} className="text-[var(--accent-cyan)] animate-pulse" />
              <span className="font-mono text-[10px] tracking-wider text-[var(--accent-cyan)]">SECURED</span>
            </div>
            <div className="absolute bottom-2 w-1/2 h-1 bg-[#1E2D4A] rounded-full" />
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-[var(--text-secondary)] font-mono">
          Desarrollado bajo tecnología Kyllerium Visual Signature Engine v3.0
        </div>
      </div>
    </main>
  );
}
