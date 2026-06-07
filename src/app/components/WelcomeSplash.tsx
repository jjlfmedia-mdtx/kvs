// src/app/components/WelcomeSplash.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Shield, Cpu, Zap, ArrowRight } from 'lucide-react';
import { triggerScreenEdgeGlow } from './ScreenEdgeGlow';

export default function WelcomeSplash() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Only show if they haven't seen the v3.0 welcome yet
    const hasSeen = localStorage.getItem('kvs_seen_v3_welcome');
    if (!hasSeen) {
      // Delay slightly for dramatic entry
      const timer = setTimeout(() => {
        setIsOpen(true);
        triggerScreenEdgeGlow('entry');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('kvs_seen_v3_welcome', 'true');
  };

  const features = [
    {
      icon: <Cpu className="w-5 h-5 text-[#00E5FF]" />,
      title: "Criptografía Avanzada AES-256",
      desc: "Marcas de agua inyectadas en DCT y LSB encriptadas magnéticamente en los píxeles."
    },
    {
      icon: <Shield className="w-5 h-5 text-[#9D4EDD]" />,
      title: "Estándar C2PA / Adobe v3.0",
      desc: "Metadatos integrados nativamente y verificables en cualquier plataforma compatible."
    },
    {
      icon: <Zap className="w-5 h-5 text-emerald-400" />,
      title: "Vercel Serverless Ready",
      desc: "Renderizado de certificados PNG en tiempo real en la nube sin dependencias nativas."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-lg bg-[#070E1F]/90 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl p-8 backdrop-blur-3xl"
          >
            {/* iOS style background ambient glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#00E5FF]/10 rounded-full blur-[64px] pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#9D4EDD]/10 rounded-full blur-[64px] pointer-events-none" />

            {/* Glowing top line */}
            <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#00E5FF] to-[#9D4EDD]" />

            {/* Content */}
            <div className="text-center mt-4 mb-6">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex p-3 rounded-2xl bg-white/5 border border-white/10 text-[#00E5FF] mb-4"
              >
                <Sparkles className="w-8 h-8 animate-pulse" />
              </motion.div>
              
              <h2 className="text-xs font-bold tracking-widest text-[#00E5FF] uppercase font-mono">Lanzamiento Oficial</h2>
              <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">
                Kyllerium Engine <span className="text-gradient">v3.0</span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed max-w-sm mx-auto">
                Una actualización mayor en seguridad visual y verificación criptográfica silenciosa.
              </p>
            </div>

            {/* Features list */}
            <div className="space-y-4 my-6">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">{f.icon}</div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{f.title}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClose}
              className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#00E5FF] to-[#9D4EDD] text-black font-extrabold text-sm rounded-2xl shadow-[0_0_24px_rgba(0,229,255,0.25)] hover:shadow-[0_0_36px_rgba(0,229,255,0.4)] transition-all cursor-pointer mt-4"
            >
              Comenzar a Proteger <ArrowRight className="w-4 h-4 text-black" />
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
