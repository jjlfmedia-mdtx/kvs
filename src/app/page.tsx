// src/app/page.tsx
"use client";
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, ShieldCheck, Download, FileText, Loader2, Sparkles, X, Info, Shield, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { triggerScreenEdgeGlow } from './components/ScreenEdgeGlow';

type LayerBadgeProps = { label: string; active: boolean; color: string };
function LayerBadge({ label, active, color }: LayerBadgeProps) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border transition-all ${
      active
        ? `bg-${color}/15 border-${color}/40 text-${color}`
        : 'bg-white/5 border-white/10 text-white/30'
    }`}
    style={active ? { background: `color-mix(in srgb, ${color} 15%, transparent)`, borderColor: `color-mix(in srgb, ${color} 40%, transparent)`, color } : {}}>
      {active ? '✓' : '○'} {label}
    </div>
  );
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<any>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customData, setCustomData] = useState({ name: '', organization: '', role: '', expirationDate: '', usageDescription: '' });
  const [customSaved, setCustomSaved] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // Stats and activity logs
  const [stats, setStats] = useState<any>({
    totalAssets: 0,
    verificationsCount: 0,
    certificatesCount: 0,
    systemHealth: '99.98%',
    activities: []
  });

  const matrixRows = useMemo(() => {
    const chars = '0123456789ABCDEF{}[]()<>+-/*=KVS';
    const makeRow = () =>
      Array.from({ length: 52 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return Array.from({ length: 16 }, (_, i) => ({ id: i, text: makeRow() }));
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/platform/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 20000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const err = fileRejections[0].errors[0];
      setStatus('error');
      if (err.code === 'file-too-large') {
        setProgressMsg('La imagen supera el límite máximo de 4.5MB permitido en servidores en la nube.');
      } else {
        setProgressMsg(err.message || 'Error al cargar el archivo.');
      }
      setFile(null);
      setPreview(null);
      return;
    }
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setStatus('idle');
      setResult(null);
      setCustomSaved(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: 4.5 * 1024 * 1024,
    multiple: false
  });

  const steps = [
    'Computing SHA-256 fingerprint...',
    'Embedding DCT spread-spectrum watermark...',
    'Injecting LSB steganography...',
    'Writing EXIF/XMP metadata...',
    'Signing C2PA manifest (WASM Engine v3.0)...',
    'Finalizing & saving to registry...'
  ];

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgressMsg(steps[0]);
    const formData = new FormData();
    formData.append('file', file);

    steps.forEach((s, i) => {
      if (i > 0) setTimeout(() => setProgressMsg(s), i * 800);
    });

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Error del servidor (${res.status})`);
      }

      if (res.ok) {
        setResult(data);
        setStatus('success');
        triggerScreenEdgeGlow('protect');
        fetchStats(); // Update database counts dynamically
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (err: any) {
      setStatus('error');
      setProgressMsg(err.message);
    }
  };

  const downloadImage = () => {
    if (!result?.kvs_id) return;
    window.location.href = `/api/download/${result.kvs_id}`;
  };

  const enhanceWithAI = async () => {
    setEnhancing(true);
    try {
      const res = await fetch('/api/ai-certificate-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field: 'description', draft: customData.role, context: result })
      });
      if (!res.ok) {
        throw new Error('AI Enhancement failed');
      }
      const data = await res.json();
      if (data.enhanced) setCustomData(prev => ({ ...prev, role: data.enhanced }));
    } catch (err) {
      console.error(err);
    } finally {
      setEnhancing(false);
    }
  };

  const saveCustomCertificate = async () => {
    if (!result?.kvs_id) return;
    setSavingCustom(true);
    try {
      const res = await fetch(`/api/certificate/${result.kvs_id}/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customData)
      });
      if (res.ok) {
        setCustomSaved(true);
        setShowCustomForm(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCustom(false);
    }
  };

  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleDownloadChoice = (choice: 'official' | 'custom' | 'combined' | 'both' | 'png-official' | 'png-custom' | 'png-both') => {
    if (!result?.kvs_id) return;
    const id = result.kvs_id;
    if (choice === 'official') {
      triggerDownload(`/api/certificate/${id}`, `KVS-Official-${id}.pdf`);
    } else if (choice === 'custom') {
      triggerDownload(`/api/certificate/${id}/custom`, `KVS-Custom-${id}.pdf`);
    } else if (choice === 'combined') {
      triggerDownload(`/api/certificate/${id}/combined`, `KVS-Combined-${id}.pdf`);
    } else if (choice === 'both') {
      triggerDownload(`/api/certificate/${id}`, `KVS-Official-${id}.pdf`);
      setTimeout(() => triggerDownload(`/api/certificate/${id}/custom`, `KVS-Custom-${id}.pdf`), 400);
    } else if (choice === 'png-official') {
      triggerDownload(`/api/certificate/${id}/png?type=official`, `KVS-Official-${id}.png`);
    } else if (choice === 'png-custom') {
      triggerDownload(`/api/certificate/${id}/png?type=custom`, `KVS-Custom-${id}.png`);
    } else if (choice === 'png-both') {
      triggerDownload(`/api/certificate/${id}/png?type=official`, `KVS-Official-${id}.png`);
      setTimeout(() => triggerDownload(`/api/certificate/${id}/png?type=custom`, `KVS-Custom-${id}.png`), 400);
    }
  };

  const layers = result?.layers || {};
  const c2pa = result?.c2pa_manifest;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[var(--accent-cyan)]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-purple)]/5 rounded-full blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ─── IDLE / ERROR ─── */}
        {(status === 'idle' || status === 'error') && (
          <motion.div key="upload" className="w-full max-w-3xl relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] text-xs font-mono mb-6 tracking-widest shadow-cyan-glow">
                <ShieldCheck size={14} /> KVS ENGINE V3.0 PROVENANCE
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-5 tracking-tight">
                Authenticity Beyond<br />
                <span className="text-gradient font-extrabold">Visibility.</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-base max-w-xl mx-auto leading-relaxed">
                Protege la autoría intelectual de tus imágenes. KVS Engine v3.0 inyecta marcas de agua DCT, esteganografía LSB y firma criptográfica C2PA de forma invisible e indestructible.
              </p>
            </div>

            <div
              {...getRootProps()}
              className={`rounded-[28px] p-12 text-center cursor-pointer transition-all duration-500 border-2 border-dashed backdrop-blur-xl ${
                isDragActive
                  ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5 shadow-cyan-glow-intense'
                  : 'border-[var(--glass-border)] hover:border-[var(--accent-cyan)]/50 hover:shadow-cyan-glow'
              }`}
              style={{ background: 'rgba(10,17,40,0.55)' }}
            >
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative w-full max-h-72 rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                  <img src={preview} alt="Preview" className="w-full h-full object-contain bg-black/40 max-h-72" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="flex flex-col items-center py-10">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-cyan)]/20 to-[var(--accent-purple)]/20 border border-[var(--accent-cyan)]/30 flex items-center justify-center mb-5 shadow-cyan-glow">
                    <UploadCloud size={38} className="text-[var(--accent-cyan)]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Arrastra tu imagen aquí</h3>
                  <p className="text-[var(--text-secondary)] mb-5 text-sm">o haz clic para seleccionar desde tu dispositivo</p>
                  <div className="flex gap-3 flex-wrap justify-center">
                    {['JPEG', 'PNG', 'WEBP'].map(f => (
                      <span key={f} className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-mono text-[var(--text-secondary)]">{f}</span>
                    ))}
                    <span className="px-3 py-1 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-xs font-mono text-[var(--accent-cyan)]">MAX 4.5MB</span>
                  </div>
                </div>
              )}
            </div>

            {preview && (
              <div className="mt-6 flex justify-center">
                <button onClick={handleUpload} className="bg-[var(--accent-cyan)] text-black font-mono font-bold py-4 px-14 rounded-[18px] hover:shadow-cyan-glow-intense hover:scale-105 active:scale-95 transition-all duration-200 tracking-widest text-base">
                  PROTEGER IMAGEN
                </button>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-center font-mono text-sm">{progressMsg}</div>
            )}
          </motion.div>
        )}

        {/* ─── UPLOADING ─── */}
        {status === 'uploading' && (
          <motion.div key="loading" className="w-full max-w-3xl text-center py-24 relative z-10 overflow-hidden rounded-3xl border border-[var(--glass-border)] glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 pointer-events-none opacity-35">
              <div className="matrix-grid">
                {matrixRows.map((row) => (
                  <p key={row.id} className="matrix-line" style={{ animationDelay: `${row.id * 0.12}s` }}>
                    {row.text}
                  </p>
                ))}
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/50 to-black/80" />
            </div>
            <div className="relative w-28 h-28 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-[var(--accent-cyan)] animate-spin" />
              <div className="absolute inset-3 rounded-full border-r-2 border-b-2 border-[var(--accent-purple)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
              <ShieldCheck size={36} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--accent-cyan)]" />
            </div>
            <h2 className="text-xl font-bold mb-3 tracking-widest">PROCESANDO ASSET</h2>
            <p className="text-[var(--accent-cyan)] font-mono text-sm animate-pulse">{progressMsg}</p>
          </motion.div>
        )}

        {/* ─── SUCCESS ─── */}
        {status === 'success' && result && (
          <motion.div key="success" className="w-full max-w-5xl relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Header banner */}
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl mb-5">
              <div className="bg-gradient-to-r from-[var(--accent-cyan)]/20 to-transparent p-5 border-b border-[var(--glass-border)] flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-cyan)]/20 flex items-center justify-center border border-[var(--accent-cyan)] shadow-cyan-glow shrink-0">
                  <CheckCircle size={22} className="text-[var(--accent-cyan)]" />
                </div>
                <div className="flex-grow min-w-0">
                  <h2 className="text-lg font-bold tracking-widest text-[var(--accent-cyan)] mb-1">ASSET PROTEGIDO ✓</h2>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-[var(--text-secondary)] tracking-widest">KVS-ID</span>
                      <span className="font-mono text-sm text-white tracking-wide">{result.kvs_id}</span>
                    </div>
                    <div className="w-px bg-white/10 self-stretch hidden sm:block"/>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-[var(--accent-purple)] tracking-widest">KVS FINGERPRINT</span>
                      <span className="font-mono text-sm text-[var(--accent-purple)] tracking-wide">{result.kvs_fingerprint}</span>
                    </div>
                  </div>
                </div>
                <button onClick={downloadImage} className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-cyan)] text-black font-mono font-bold rounded-2xl text-sm hover:shadow-cyan-glow transition">
                  <Download size={16}/> DESCARGAR
                </button>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Image preview */}
                <div className="lg:col-span-2">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/50 shadow-lg group">
                    <img src={preview!} alt="Protected asset" className="w-full h-auto object-contain max-h-64" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={downloadImage} className="bg-[var(--accent-cyan)] text-black p-3 rounded-full hover:scale-110 transition-transform">
                        <Download size={20} />
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded-lg text-[10px] font-mono text-white/60">{result.format}</div>
                  </div>
                </div>

                {/* KVS ID + Fingerprint block */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-cyan)]/30 shadow-cyan-glow col-span-1 sm:col-span-2">
                      <p className="text-[9px] text-[var(--accent-cyan)] font-mono tracking-widest mb-2">KVS REGISTRY ID</p>
                      <p className="font-mono text-xl font-bold text-white tracking-wider">{result.kvs_id}</p>
                    </div>
                    <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-purple)]/30 col-span-1 sm:col-span-2" style={{ boxShadow: '0 0 20px rgba(157,78,221,0.1)' }}>
                      <p className="text-[9px] text-[var(--accent-purple)] font-mono tracking-widest mb-2">KVS UNIQUE FINGERPRINT</p>
                      <p className="font-mono text-base font-bold break-all" style={{ color: 'var(--accent-purple)' }}>{result.kvs_fingerprint}</p>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 font-mono">SHA-256 del contenido + KVS-ID + timestamp → Engine v3.0 Secure Hash</p>
                    </div>
                  </div>

                  {/* Layer badges */}
                  <div>
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest mb-3">CAPAS DE PROTECCIÓN APLICADAS</p>
                    <div className="flex flex-wrap gap-2">
                      <LayerBadge label="DCT" active={!!layers.dct} color="#00E5FF" />
                      <LayerBadge label="LSB" active={!!layers.lsb} color="#00E5FF" />
                      <LayerBadge label="EXIF" active={!!layers.exif} color="#A78BFA" />
                      <LayerBadge label="C2PA" active={!!layers.c2pa} color={layers.c2pa ? '#10B981' : '#F59E0B'} />
                      <LayerBadge label="pHash" active={!!result.phash} color="#F59E0B" />
                    </div>
                  </div>

                  {/* SHA-256 */}
                  <div className="bg-black/50 rounded-2xl p-4 border border-[var(--accent-cyan)]/20">
                    <p className="text-[10px] text-[var(--accent-cyan)] font-mono tracking-widest mb-1.5">SHA-256 FINGERPRINT</p>
                    <p className="font-mono text-xs break-all text-white leading-relaxed">{result.hash}</p>
                  </div>

                  {/* C2PA status */}
                  <div className={`rounded-2xl p-4 border ${layers.c2pa ? 'bg-[#10B981]/5 border-[#10B981]/30' : 'bg-[#F59E0B]/5 border-[#F59E0B]/30'}`}>
                    <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: layers.c2pa ? '#10B981' : '#F59E0B' }}>
                      C2PA / CONTENT CREDENTIALS
                    </p>
                    <p className="text-sm font-semibold" style={{ color: layers.c2pa ? '#10B981' : '#F59E0B' }}>
                      {layers.c2pa ? '✓ Manifiesto COSE firmado e inyectado' : '⚠ Firma C2PA no inyectada (descarga imagen para verificar)'}
                    </p>
                    {c2pa && <p className="text-[10px] font-mono text-[var(--text-secondary)] mt-1.5">Emisor: {c2pa.issuer || 'Kyllerium'} · Algoritmo: {c2pa.algorithm || 'COSE/SHA-256'}</p>}
                    {layers.c2pa && (
                      <a href="https://verify.contentauthenticity.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-[10px] font-mono text-[#10B981] hover:underline">
                        <Info size={10}/> Verificar en verify.contentauthenticity.org ↗
                      </a>
                    )}
                  </div>

                  {/* Verification link */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                    <p className="text-[10px] text-[var(--text-secondary)] font-mono tracking-widest mb-1.5">ENLACE DE VERIFICACIÓN DIRECTA</p>
                    <p className="font-mono text-xs text-[var(--accent-purple)] break-all">https://kyllerium.com/verify/{result.kvs_id}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-1">Verificación directa disponible haciendo clic en el enlace o ingresando el ID en <span className="text-white/60">/verify</span></p>
                  </div>
                </div>
              </div>

              {/* Certificate section */}
              <div className="border-t border-[var(--glass-border)] p-6">
                {!showCustomForm ? (
                  <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <div className="flex-grow">
                      <p className="font-semibold text-sm mb-0.5">Certificados de Autenticidad</p>
                      <p className="text-xs text-[var(--text-secondary)]">Descarga el certificado oficial o agrega tus datos personales para uno personalizado.</p>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <button onClick={() => setShowDownloadModal(true)} className="flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition text-sm font-bold">
                        <FileText size={16} /> Descargar PDFs
                      </button>
                      <button onClick={() => setShowCustomForm(true)} className="flex items-center gap-2 px-5 py-3 bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/40 text-[var(--accent-purple)] rounded-2xl hover:bg-[var(--accent-purple)]/25 transition text-sm font-bold">
                        <Sparkles size={16} /> Certificado Personalizado
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[var(--accent-cyan)] to-[var(--accent-purple)] rounded-full" />
                    <div className="pl-5">
                      <h3 className="font-bold text-base mb-4 flex items-center gap-2">
                        <Sparkles size={16} className="text-[var(--accent-purple)]" /> Datos del Certificado Personalizado
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <input className="bg-black/60 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/30 col-span-1 sm:col-span-2" placeholder="Nombre completo / Propietario *" value={customData.name} onChange={e => setCustomData(p => ({ ...p, name: e.target.value }))} />
                        <input className="bg-black/60 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/30" placeholder="Organización (opcional)" value={customData.organization} onChange={e => setCustomData(p => ({ ...p, organization: e.target.value }))} />
                        <div className="flex gap-2">
                          <input className="flex-grow bg-black/60 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-purple)] outline-none transition text-white placeholder-white/30" placeholder="Rol / Descripción" value={customData.role} onChange={e => setCustomData(p => ({ ...p, role: e.target.value }))} />
                          <button onClick={enhanceWithAI} disabled={enhancing} title="Mejorar con IA" className="bg-[var(--accent-purple)]/20 border border-[var(--accent-purple)]/40 text-[var(--accent-purple)] px-3 rounded-2xl hover:bg-[var(--accent-purple)]/40 transition shrink-0">
                            {enhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                          </button>
                        </div>
                        <input className="bg-black/60 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/30" placeholder="Fecha de Vencimiento (ej. 31/12/2030 o Sin Vencimiento)" value={customData.expirationDate} onChange={e => setCustomData(p => ({ ...p, expirationDate: e.target.value }))} />
                        <input className="bg-black/60 border border-white/10 rounded-2xl p-3 text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/30 col-span-1 sm:col-span-2" placeholder="Descripción de Uso Autorizado (ej. Uso editorial exclusivo y prensa)" value={customData.usageDescription} onChange={e => setCustomData(p => ({ ...p, usageDescription: e.target.value }))} />
                      </div>

                      {customSaved && (
                        <div className="mb-4 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-2xl text-[#10B981] text-sm font-mono flex items-center gap-2">
                          <CheckCircle size={16} /> Certificado personalizado guardado en base de datos.
                        </div>
                      )}

                      <div className="flex flex-wrap gap-3">
                        <button onClick={saveCustomCertificate} disabled={savingCustom || !customData.name} className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-cyan)] text-black font-mono font-bold rounded-2xl hover:shadow-cyan-glow transition disabled:opacity-50 text-sm">
                          <span className="flex items-center gap-2">
                            {savingCustom ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                            <span>{savingCustom ? 'IMPLEMENTANDO...' : 'GUARDAR CERTIFICADO'}</span>
                          </span>
                        </button>
                        <button onClick={() => setShowDownloadModal(true)} disabled={!customSaved} className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition disabled:opacity-40 text-sm font-bold">
                          <FileText size={16} /> Descargar PDFs
                        </button>
                        <button onClick={() => setShowCustomForm(false)} className="flex items-center gap-2 px-5 py-3 bg-transparent border border-white/10 rounded-2xl hover:bg-white/5 transition text-sm">
                          <X size={16} /> Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <button onClick={() => { setFile(null); setPreview(null); setStatus('idle'); setResult(null); setCustomSaved(false); setShowCustomForm(false); setCustomData({ name: '', organization: '', role: '', expirationDate: '', usageDescription: '' }); }} className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition underline-offset-4 underline decoration-white/10">
                [ PROTEGER OTRO ASSET ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── DOWNLOAD SELECTOR MODAL ─── */}
      <AnimatePresence>
        {showDownloadModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card max-w-md w-full rounded-3xl p-6 border border-white/10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowDownloadModal(false)} className="text-[var(--text-secondary)] hover:text-white transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 flex items-center justify-center mx-auto mb-4 text-[var(--accent-cyan)]">
                  <FileText size={24} />
                </div>
                <h3 className="text-xl font-bold">Opciones de Descarga</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Selecciona el formato para exportar tus registros de seguridad KVS.</p>
              </div>

              <div className="flex flex-col gap-2.5">
                {/* PDF Section */}
                <p className="text-[9px] font-mono tracking-widest text-[var(--text-secondary)] mb-1">FORMATO PDF</p>

                <button
                  onClick={() => { handleDownloadChoice('official'); setShowDownloadModal(false); }}
                  className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-[18px] hover:bg-[var(--accent-cyan)]/10 hover:border-[var(--accent-cyan)]/30 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-[var(--accent-cyan)] transition">Certificado Oficial (PDF)</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Certificado del sistema con firma criptográfica KVS.</p>
                  </div>
                  <Download size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-cyan)] transition" />
                </button>

                <button
                  onClick={() => { handleDownloadChoice('custom'); setShowDownloadModal(false); }}
                  disabled={!customSaved}
                  className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-[18px] hover:bg-[var(--accent-purple)]/10 hover:border-[var(--accent-purple)]/30 disabled:opacity-35 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-[var(--accent-purple)] transition">Certificado Personalizado (PDF)</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">PDF con tus datos de propietario y uso autorizados.</p>
                  </div>
                  <Download size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--accent-purple)] transition" />
                </button>

                <button
                  onClick={() => { handleDownloadChoice('combined'); setShowDownloadModal(false); }}
                  className="w-full text-left p-4 bg-gradient-to-r from-[var(--accent-cyan)]/5 to-[var(--accent-purple)]/5 border border-white/10 rounded-[18px] hover:from-[var(--accent-cyan)]/10 hover:to-[var(--accent-purple)]/10 hover:border-[var(--accent-cyan)]/40 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold">PDF Combinado (2 páginas)</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Un solo documento con ambos certificados oficial y personalizado.</p>
                  </div>
                  <Download size={16} className="text-[var(--accent-cyan)]" />
                </button>

                <button
                  onClick={() => { handleDownloadChoice('both'); setShowDownloadModal(false); }}
                  disabled={!customSaved}
                  className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-[18px] hover:bg-white/10 disabled:opacity-35 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold">Ambos PDFs (separados)</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Descarga simultánea de los dos certificados PDF individuales.</p>
                  </div>
                  <Download size={16} className="text-[var(--text-secondary)]" />
                </button>

                {/* PNG Section */}
                <p className="text-[9px] font-mono tracking-widest text-[var(--text-secondary)] mt-2 mb-1">FORMATO IMAGEN (PNG)</p>

                <button
                  onClick={() => { handleDownloadChoice('png-official'); setShowDownloadModal(false); }}
                  className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-[18px] hover:bg-emerald-500/10 hover:border-emerald-500/30 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-emerald-400 transition">Imagen PNG – Oficial</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Certificado oficial exportado como imagen PNG de alta resolución.</p>
                  </div>
                  <Download size={16} className="text-[var(--text-secondary)] group-hover:text-emerald-400 transition" />
                </button>

                <button
                  onClick={() => { handleDownloadChoice('png-custom'); setShowDownloadModal(false); }}
                  disabled={!customSaved}
                  className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-[18px] hover:bg-emerald-500/10 hover:border-emerald-500/30 disabled:opacity-35 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold group-hover:text-emerald-400 transition">Imagen PNG – Personalizado</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Certificado personalizado exportado como PNG de alta resolución.</p>
                  </div>
                  <Download size={16} className="text-[var(--text-secondary)] group-hover:text-emerald-400 transition" />
                </button>

                <button
                  onClick={() => { handleDownloadChoice('png-both'); setShowDownloadModal(false); }}
                  disabled={!customSaved}
                  className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-[18px] hover:bg-white/10 disabled:opacity-35 transition flex justify-between items-center group"
                >
                  <div>
                    <p className="text-sm font-bold">Ambas imágenes PNG</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Descarga simultánea de los dos certificados como PNG.</p>
                  </div>
                  <Download size={16} className="text-[var(--text-secondary)]" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── TRUST & COMMAND CENTER PANEL ─── */}
      <div className="w-full max-w-5xl mt-16 relative z-10">
        <div className="glass-card rounded-3xl p-6 md:p-8 border border-[var(--glass-border)] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Shield size={250} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 absolute shrink-0" />
                <h2 className="text-lg font-bold tracking-widest text-white ml-3">TRUST & COMMAND CENTER</h2>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">Monitoreo de seguridad y telemetría de Kyllerium Visual Signature Engine v3.0.</p>
            </div>
            <button 
              onClick={fetchStats}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-[10px] font-mono"
            >
              <RefreshCw size={12} /> REFRESH LIVE DATA
            </button>
          </div>

          {/* Telemetry Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'IMÁGENES REGISTRADAS', value: stats.totalAssets, color: 'var(--accent-cyan)' },
              { label: 'AUTENTICITY CHECKS', value: stats.verificationsCount, color: '#10B981' },
              { label: 'CERTIFICADOS EMITIDOS', value: stats.certificatesCount, color: 'var(--accent-purple)' },
              { label: 'SALUD DEL SISTEMA', value: stats.systemHealth, color: '#00E5FF' },
            ].map(s => (
              <div key={s.label} className="bg-black/40 border border-white/5 rounded-2xl p-4">
                <p className="text-[9px] font-mono tracking-wider mb-1" style={{ color: s.color }}>{s.label}</p>
                <p className="text-2xl font-bold tracking-tight text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Platform Activity logs */}
          <div className="bg-black/60 border border-white/5 rounded-2xl p-4">
            <p className="text-[9px] text-[var(--text-secondary)] font-mono tracking-widest mb-3">BITÁCORA DE ACTIVIDAD EN TIEMPO REAL</p>
            <div className="flex flex-col gap-2">
              {stats.activities && stats.activities.map((act: any) => (
                <div key={act.id} className="flex justify-between items-center text-[10px] font-mono p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                      act.type === 'SIGN' ? 'bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30' :
                      act.type === 'CHECK' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    }`}>{act.type}</span>
                    <span className="text-white font-bold">{act.event}</span>
                    <span className="text-[var(--text-secondary)] hidden md:inline">— {act.desc}</span>
                  </div>
                  <span className="text-[var(--text-secondary)] font-mono text-[9px]">{new Date(act.ts).toLocaleTimeString('es-MX')}</span>
                </div>
              ))}
              {(!stats.activities || stats.activities.length === 0) && (
                <p className="text-xs font-mono text-[var(--text-secondary)] italic text-center py-4">Estableciendo conexión con el centro de telemetría...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
