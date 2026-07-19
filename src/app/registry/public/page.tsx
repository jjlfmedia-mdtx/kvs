"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Search, Calendar, User, FileImage, ShieldAlert, ShieldX } from 'lucide-react';

export default function PublicRegistryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRegistry = async () => {
    try {
      const res = await fetch('/api/registry/public');
      if (res.ok) {
        setImages(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, []);

  const filteredImages = useMemo(() => {
    return images.filter(img => 
      img.kvs_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.kvs_fingerprint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.owner_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  return (
    <div className="min-h-[85vh] p-6 md:p-12 max-w-7xl mx-auto relative z-10">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-cyan)]/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="text-center md:text-left mb-10">
        <p className="text-xs font-mono text-[var(--accent-cyan)] tracking-widest mb-2">KVS PUBLIC ARCHIVE</p>
        <h1 className="text-4xl font-bold tracking-tight mb-4">Registro Público de Firmas</h1>
        <p className="text-[var(--text-secondary)] text-sm max-w-xl">
          Visualiza los metadatos públicos de autenticidad para validar derechos y autoría. Las imágenes físicas y los metadatos confidenciales están protegidos y solo son visibles por sus dueños.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
        <input 
          type="text"
          placeholder="Buscar por KVS-ID, Huella o Propietario..."
          className="w-full bg-black/40 border border-[var(--glass-border)] rounded-2xl py-4 pl-12 pr-4 font-mono text-xs focus:border-[var(--accent-cyan)] outline-none transition text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 size={36} className="animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="font-mono text-xs text-[var(--text-secondary)]">CARGANDO REGISTRO PÚBLICO...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredImages.map((img, idx) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-card rounded-3xl p-6 border border-[var(--glass-border)] relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[var(--accent-cyan)]" />
                    <span className="font-mono text-sm font-bold text-[var(--accent-cyan)]">{img.kvs_id}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-bold border ${
                    img.revoked ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    img.verification_status === 'VERIFIED' ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' :
                    'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                  }`}>
                    {img.revoked ? 'REVOCADO' : img.verification_status}
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest mb-0.5">PROPIETARIO REGISTRADO</span>
                    <div className="flex items-center gap-1.5 text-white font-medium">
                      <User size={13} className="opacity-40" />
                      {img.owner_name}
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-[var(--accent-purple)] block tracking-widest mb-0.5">KVS UNIQUE FINGERPRINT</span>
                    <p className="font-mono text-[10px] break-all text-[var(--accent-purple)] opacity-90">{img.kvs_fingerprint}</p>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest mb-0.5">FECHA Y HORA DEL SISTEMA</span>
                    <div className="flex items-center gap-1.5 text-white font-mono text-[11px]">
                      <Calendar size={13} className="opacity-40" />
                      {new Date(img.upload_date).toLocaleString('es-MX')}
                    </div>
                  </div>

                  {img.is_owner && (
                    <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#10B981] font-bold">✓ Eres el dueño</span>
                      <a href="/registry/private" className="text-[10px] font-mono text-[var(--accent-cyan)] hover:underline">
                        Ver tu foto ↗
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredImages.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-[var(--glass-border)]">
                <ShieldX size={40} className="text-white/20 mx-auto mb-4" />
                <p className="font-mono text-sm text-[var(--text-secondary)]">No se encontraron registros en el archivo público.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
