"use client";
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Loader2, Search, Calendar, FileText, Download, KeySquare, Image as ImageIcon } from 'lucide-react';

export default function PrivateRegistryPage() {
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPrivateRegistry = async () => {
    try {
      const res = await fetch('/api/registry/private');
      if (res.status === 401) {
        // Redirige a login si no tiene sesión iniciada
        router.push('/auth/login');
        return;
      }
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
    fetchPrivateRegistry();
  }, []);

  const filteredImages = useMemo(() => {
    return images.filter(img => 
      img.kvs_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      img.owner_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [images, searchQuery]);

  return (
    <div className="min-h-[85vh] p-6 md:p-12 max-w-7xl mx-auto relative z-10">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-purple)]/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header */}
      <div className="text-center md:text-left mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-xs font-mono text-[var(--accent-cyan)] tracking-widest mb-2">KVS PRIVATE VAULT</p>
          <h1 className="text-4xl font-bold tracking-tight mb-2">Mis Imágenes Protegidas</h1>
          <p className="text-[var(--text-secondary)] text-sm max-w-xl">
            Bóveda privada con el historial completo de tus firmas generadas e imágenes asociadas.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
        <input 
          type="text"
          placeholder="Buscar tus imágenes por ID, nombre o propietario..."
          className="w-full bg-black/40 border border-[var(--glass-border)] rounded-2xl py-4 pl-12 pr-4 font-mono text-xs focus:border-[var(--accent-cyan)] outline-none transition text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 size={36} className="animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
          <p className="font-mono text-xs text-[var(--text-secondary)]">ABRIENDO BÓVEDA PRIVADA...</p>
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
                className="glass-card rounded-3xl p-6 border border-[var(--glass-border)] relative overflow-hidden flex flex-col justify-between"
              >
                <div>
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

                  {/* Thumbnail Preview */}
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-inner mb-4 h-40">
                    <img 
                      src={img.filepath.startsWith('http') ? img.filepath : `/api/download/${img.kvs_id}`} 
                      alt="Thumbnail" 
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest">NOMBRE DE ARCHIVO</span>
                      <p className="font-semibold text-white truncate">{img.filename}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] block tracking-widest">FECHA DE REGISTRO</span>
                      <p className="font-mono text-[11px] text-white/90">
                        {new Date(img.upload_date).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                  <a 
                    href={`/api/download/${img.kvs_id}`}
                    className="flex-1 py-2.5 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] rounded-xl hover:bg-[var(--accent-cyan)]/20 transition text-center font-mono text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <Download size={11} /> IMAGEN
                  </a>
                  <a 
                    href={`/api/certificate/${img.kvs_id}`}
                    target="_blank"
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition text-center font-mono text-[10px] font-bold flex items-center justify-center gap-1"
                  >
                    <FileText size={11} /> CERTIFICADO
                  </a>
                </div>
              </motion.div>
            ))}

            {filteredImages.length === 0 && (
              <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-[var(--glass-border)]">
                <ImageIcon size={40} className="text-white/20 mx-auto mb-4" />
                <p className="font-mono text-sm text-[var(--text-secondary)]">No tienes imágenes registradas en tu bóveda privada.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
