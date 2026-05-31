// src/app/verify/[id]/page.tsx
"use client";
import React, { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, Loader2, FileText, Info, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function InfoRow({ label, value, mono = false, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
      <p className="text-[10px] text-[var(--accent-cyan)] font-mono tracking-widest mb-1">{label}</p>
      <p className={`text-sm break-all ${mono ? 'font-mono' : 'font-semibold'}`} style={color ? { color } : {}}>{value}</p>
    </div>
  );
}

export default function VerifyIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [status, setStatus] = useState<'loading' | 'result' | 'error'>('loading');
  const [progressMsg, setProgressMsg] = useState('Buscando registro en la base de datos...');
  const [result, setResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadingSteps = [
    'Buscando registro en la base de datos...',
    'Validando capas de marcas de agua DCT...',
    'Extrayendo esteganografía LSB...',
    'Verificando firmas criptográficas C2PA...',
    'Generando informe de autenticidad...'
  ];

  useEffect(() => {
    let active = true;
    
    // Cycle progress messages for UI aesthetics
    loadingSteps.forEach((step, index) => {
      setTimeout(() => {
        if (active && status === 'loading') {
          setProgressMsg(step);
        }
      }, index * 600);
    });

    const fetchVerification = async () => {
      try {
        const res = await fetch(`/api/verify/${id}`);
        let data: any;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          throw new Error(text || `Error del servidor (${res.status})`);
        }

        if (res.ok) {
          if (active) {
            setResult(data);
            // Artificial delay to make animations smooth and satisfying
            setTimeout(() => {
              if (active) setStatus('result');
            }, 3000);
          }
        } else {
          throw new Error(data.error || 'No se pudo encontrar el asset');
        }
      } catch (err: any) {
        if (active) {
          setErrorMsg(err.message || 'Error al conectar con la base de datos');
          setStatus('error');
        }
      }
    };

    fetchVerification();

    return () => {
      active = false;
    };
  }, [id]);

  const overallColor = result?.overall === 'VERIFIED' ? '#10B981' : result?.overall === 'MODIFIED' ? '#F59E0B' : '#EF4444';
  const OverallIcon = result?.overall === 'VERIFIED' ? ShieldCheck : result?.overall === 'MODIFIED' ? ShieldAlert : ShieldX;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-cyan)]/4 rounded-full blur-[130px] pointer-events-none" />

      <div className="absolute top-5 left-5 z-20">
        <Link href="/" className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition">
          <ArrowLeft size={14} /> VOLVER AL INICIO
        </Link>
      </div>

      <AnimatePresence mode="wait">
        {/* ─── LOADING ─── */}
        {status === 'loading' && (
          <motion.div key="loading" className="w-full max-w-md text-center py-24 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-56 h-56 mx-auto mb-10 rounded-2xl overflow-hidden border border-[var(--accent-cyan)]/30 shadow-cyan-glow flex items-center justify-center bg-black/40">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-black/60 backdrop-blur flex items-center justify-center border border-[var(--accent-cyan)]/30">
                  <ShieldCheck size={32} className="text-[var(--accent-cyan)] animate-pulse" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-3 tracking-widest">VERIFICANDO KVS REGISTRY</h2>
            <div className="flex items-center justify-center gap-2 text-[var(--accent-cyan)] font-mono text-xs">
              <Loader2 size={14} className="animate-spin" /> {progressMsg}
            </div>
          </motion.div>
        )}

        {/* ─── ERROR ─── */}
        {status === 'error' && (
          <motion.div key="error" className="w-full max-w-md text-center py-24 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-6 shadow-red-glow">
              <ShieldX size={36} className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold mb-2 tracking-widest">CONSULTA NO VÁLIDA</h2>
            <p className="text-red-400 font-mono text-sm mb-6">{errorMsg}</p>
            <Link href="/verify" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition text-xs font-mono">
              VERIFICAR OTRA IMAGEN
            </Link>
          </motion.div>
        )}

        {/* ─── RESULT ─── */}
        {status === 'result' && result && (
          <motion.div key="result" className="w-full max-w-5xl relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="glass-card rounded-3xl overflow-hidden shadow-2xl">
              {/* Status banner */}
              <div className="p-6 flex items-center gap-4 border-b border-[var(--glass-border)]" style={{ background: `color-mix(in srgb, ${overallColor} 12%, transparent)`, borderBottomColor: `color-mix(in srgb, ${overallColor} 30%, transparent)` }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg shrink-0" style={{ background: `color-mix(in srgb, ${overallColor} 15%, transparent)`, borderColor: overallColor, color: overallColor }}>
                  <OverallIcon size={28} />
                </div>
                <div className="flex-grow">
                  <h2 className="text-2xl font-bold tracking-widest" style={{ color: overallColor }}>
                    {result.overall === 'VERIFIED' ? 'VERIFICADO' : result.overall === 'MODIFIED' ? 'MODIFICADO' : 'NO AUTÉNTICO'}
                  </h2>
                  <p className="text-sm font-mono opacity-70">CONFIANZA: {result.confidence}% · {result.overall === 'VERIFIED' ? 'Registro auténtico y activo' : 'Registro modificado o revocado'}</p>
                </div>
                {result.db_record && (
                  <a href={`/api/certificate/${result.db_record.kvs_id}`} target="_blank" className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition text-xs font-bold">
                    <FileText size={14} /> Certificado Oficial
                  </a>
                )}
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Visual Metadata Info */}
                <div className="lg:col-span-5 flex flex-col gap-4">
                  {result.db_record ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-cyan)]/30 shadow-cyan-glow col-span-1 sm:col-span-2">
                          <p className="text-[9px] text-[var(--accent-cyan)] font-mono tracking-widest mb-1.5">KVS REGISTRY ID</p>
                          <p className="font-mono text-lg font-bold text-white tracking-wider">{result.db_record.kvs_id}</p>
                        </div>
                        <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-purple)]/30 col-span-1 sm:col-span-2" style={{ boxShadow: '0 0 20px rgba(157,78,221,0.1)' }}>
                          <p className="text-[9px] text-[var(--accent-purple)] font-mono tracking-widest mb-1.5">KVS UNIQUE FINGERPRINT</p>
                          <p className="font-mono text-xs font-bold break-all" style={{ color: 'var(--accent-purple)' }}>{result.db_record.kvs_fingerprint}</p>
                        </div>
                        <InfoRow label="PROPIETARIO REGISTRADO" value={result.db_record.owner_name || 'Sin asignar'} />
                        <InfoRow label="FECHA DE REGISTRO" value={new Date(result.db_record.upload_date).toLocaleString('es-MX')} />
                        <InfoRow
                          label="ESTADO DEL REGISTRO"
                          value={result.db_record.revoked ? '⛔ REVOCADO / INACTIVO' : '✓ AUTÉNTICO Y ACTIVO'}
                          color={result.db_record.revoked ? '#EF4444' : '#10B981'}
                        />
                        <InfoRow label="FORMATO ORIGINAL" value={JSON.parse(result.db_record.metadata_json || '{}').type || 'JPEG'} />
                      </div>

                      {/* Watermark layers */}
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-[var(--accent-cyan)] font-mono tracking-widest mb-3">CAPAS DE PROTECCIÓN KVS APLICADAS EN EL REGISTRO</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: 'DCT', found: !!result.dct_watermark?.found },
                            { label: 'LSB', found: !!result.lsb_watermark?.found },
                            { label: 'EXIF', found: !!result.xmp_metadata?.found },
                            { label: 'pHash', found: !!result.phash_match?.found },
                          ].map(l => (
                            <span key={l.label} className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold border ${l.found ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#10B981]' : 'bg-white/5 border-white/10 text-white/30'}`}>
                              {l.found ? '✓' : '○'} {l.label}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* C2PA */}
                      <div className={`rounded-2xl p-4 border flex items-start gap-3 relative overflow-hidden ${result.c2pa_manifest?.found ? 'bg-[#10B981]/5 border-[#10B981]/30' : 'bg-[#F59E0B]/5 border-[#F59E0B]/30'}`}>
                        <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: result.c2pa_manifest?.found ? '#10B981' : '#F59E0B' }} />
                        <Info size={16} className="mt-0.5 shrink-0 pl-1" style={{ color: result.c2pa_manifest?.found ? '#10B981' : '#F59E0B' }} />
                        <div className="pl-1">
                          <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: result.c2pa_manifest?.found ? '#10B981' : '#F59E0B' }}>C2PA CONTENT CREDENTIALS BINDING</p>
                          {result.c2pa_manifest?.found ? (
                            <>
                              <p className="text-xs font-bold text-white mb-1">✓ Firma criptográfica COSE inyectada en contenedor original</p>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">Emisor: <span className="text-[var(--accent-cyan)]">{result.c2pa_manifest.issuer}</span></p>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">Manifiesto: <span className="text-[var(--accent-cyan)]">{result.c2pa_manifest.title}</span></p>
                            </>
                          ) : (
                            <p className="text-xs font-bold text-[var(--text-secondary)] mb-1">⚠ No se encontró firma C2PA activa</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-black/40 rounded-2xl p-10 border border-white/5 text-center">
                      <ShieldX size={40} className="mx-auto mb-4 opacity-40" />
                      <p className="text-lg font-semibold mb-2">Sin registro KVS</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition underline underline-offset-4 decoration-white/10">
                [ REGRESAR AL REGISTRADOR ]
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
