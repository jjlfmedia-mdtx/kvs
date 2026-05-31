"use client";
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, ShieldAlert, ShieldX, Loader2, FileText, Info } from 'lucide-react';
import { triggerScreenEdgeGlow } from '../components/ScreenEdgeGlow';

function InfoRow({ label, value, mono = false, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
      <p className="text-[10px] text-[var(--accent-cyan)] font-mono tracking-widest mb-1">{label}</p>
      <p className={`text-sm break-all ${mono ? 'font-mono' : 'font-semibold'}`} style={color ? { color } : {}}>{value}</p>
    </div>
  );
}

export default function VerifyPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'result'>('idle');
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    if (fileRejections.length > 0) {
      const err = fileRejections[0].errors[0];
      alert(err.code === 'file-too-large' ? 'La imagen supera el límite máximo de 4.5MB permitido en servidores en la nube.' : err.message || 'Error al cargar el archivo.');
      return;
    }
    const selected = acceptedFiles[0];
    if (selected) {
      setPreview(URL.createObjectURL(selected));
      handleVerify(selected);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxSize: 4.5 * 1024 * 1024,
    multiple: false
  });

  const verifySteps = ['Leyendo capas de watermark DCT...', 'Extrayendo esteganografía LSB...', 'Validando metadatos EXIF/XMP...', 'Comparando pHash en base de datos...', 'Verificando hash SHA-256...'];

  const handleVerify = async (fileToVerify: File) => {
    setStatus('verifying');
    triggerScreenEdgeGlow('verify');
    setProgressMsg(verifySteps[0]);
    verifySteps.forEach((s, i) => { if (i > 0) setTimeout(() => setProgressMsg(s), i * 700); });

    const formData = new FormData();
    formData.append('file', fileToVerify);
    try {
      const res = await fetch('/api/verify', { method: 'POST', body: formData });
      let data: any;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || `Error del servidor (${res.status})`);
      }
      setResult(data);
      setStatus('result');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error durante la verificación.');
      setStatus('idle');
    }
  };

  const overallColor = result?.overall === 'VERIFIED' ? '#10B981' : result?.overall === 'MODIFIED' ? '#F59E0B' : '#EF4444';
  const OverallIcon = result?.overall === 'VERIFIED' ? ShieldCheck : result?.overall === 'MODIFIED' ? ShieldAlert : ShieldX;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--accent-cyan)]/4 rounded-full blur-[130px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* ─── IDLE ─── */}
        {status === 'idle' && (
          <motion.div key="idle" className="w-full max-w-3xl relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                Verificar <span className="text-gradient">Autenticidad</span>
              </h1>
              <p className="text-[var(--text-secondary)] max-w-lg mx-auto text-sm leading-relaxed">
                Sube cualquier imagen para analizar sus capas de protección KVS. El sistema extrae automáticamente los watermarks, metadatos y credenciales C2PA embebidas.
              </p>
            </div>

            {/* How it works */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {[
                { step: '01', label: 'Sube la imagen', desc: 'Arrastra o selecciona la imagen a verificar' },
                { step: '02', label: 'Análisis automático', desc: 'KVS extrae DCT, LSB y metadatos' },
                { step: '03', label: 'Búsqueda pHash', desc: 'Comparamos huella visual en el registro' },
                { step: '04', label: 'Resultado', desc: 'VERIFICADO, MODIFICADO o NO AUTÉNTICO' },
              ].map(item => (
                <div key={item.step} className="glass-card rounded-2xl p-4 border border-[var(--glass-border)] text-center">
                  <p className="text-[var(--accent-cyan)] font-mono text-xs mb-2">{item.step}</p>
                  <p className="font-semibold text-sm mb-1">{item.label}</p>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div
              {...getRootProps()}
              className={`glass-card rounded-3xl p-14 text-center cursor-pointer transition-all duration-500 border-2 border-dashed ${
                isDragActive ? 'border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5 shadow-cyan-glow-intense' : 'border-[var(--glass-border)] hover:border-[var(--accent-cyan)]/50 hover:shadow-cyan-glow'
              }`}
            >
              <input {...getInputProps()} />
              <div className="w-20 h-20 rounded-full bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 flex items-center justify-center mx-auto mb-5 shadow-cyan-glow">
                <Search size={36} className="text-[var(--accent-cyan)]" />
              </div>
              <p className="text-lg font-semibold mb-2">Selecciona o arrastra una imagen</p>
              <p className="text-[var(--text-secondary)] font-mono text-xs">JPEG · PNG · WEBP</p>
            </div>
          </motion.div>
        )}

        {/* ─── VERIFYING ─── */}
        {status === 'verifying' && (
          <motion.div key="verifying" className="w-full max-w-md text-center py-24 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="relative w-56 h-56 mx-auto mb-10 rounded-2xl overflow-hidden border border-[var(--accent-cyan)]/30 shadow-cyan-glow">
              <img src={preview!} className="w-full h-full object-cover opacity-25" alt="Scanning" />
              <motion.div
                className="absolute inset-0 border-b-[3px] border-[var(--accent-cyan)] bg-gradient-to-t from-[var(--accent-cyan)]/40 to-transparent"
                animate={{ y: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-black/60 backdrop-blur flex items-center justify-center border border-[var(--accent-cyan)]/30">
                  <ShieldCheck size={32} className="text-[var(--accent-cyan)]" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-3 tracking-widest">ANALIZANDO CAPAS</h2>
            <div className="flex items-center justify-center gap-2 text-[var(--accent-cyan)] font-mono text-xs">
              <Loader2 size={14} className="animate-spin" /> {progressMsg}
            </div>
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
                  <p className="text-sm font-mono opacity-70">CONFIANZA: {result.confidence}% · {result.overall === 'VERIFIED' ? 'Imagen auténtica del registro KVS' : result.overall === 'MODIFIED' ? 'La imagen fue alterada después de protegerse' : 'No se encontraron credenciales KVS'}</p>
                </div>
                {result.db_record && (
                  <a href={`/api/certificate/${result.db_record.kvs_id}`} target="_blank" className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 rounded-2xl hover:bg-white/20 transition text-xs font-bold">
                    <FileText size={14} /> Certificado
                  </a>
                )}
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Image */}
                <div className="lg:col-span-2">
                  <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/50 relative">
                    <img src={preview!} className="w-full h-auto object-cover max-h-64" alt="Verified" />
                  </div>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-4">
                  {result.db_record ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-cyan)]/30 shadow-cyan-glow col-span-1 sm:col-span-2">
                          <p className="text-[9px] text-[var(--accent-cyan)] font-mono tracking-widest mb-1.5">KVS REGISTRY ID</p>
                          <p className="font-mono text-lg font-bold text-white tracking-wider">{result.db_record.kvs_id}</p>
                        </div>
                        <div className="bg-black/60 rounded-2xl p-4 border border-[var(--accent-purple)]/30 col-span-1 sm:col-span-2" style={{ boxShadow: '0 0 20px rgba(157,78,221,0.1)' }}>
                          <p className="text-[9px] text-[var(--accent-purple)] font-mono tracking-widest mb-1.5">KVS UNIQUE FINGERPRINT</p>
                          <p className="font-mono text-xs font-bold break-all" style={{ color: 'var(--accent-purple)' }}>{result.db_record.kvs_fingerprint || 'KVS-FINGERPRINT-NOT-GENERATED'}</p>
                        </div>
                        <InfoRow label="PROPIETARIO" value={result.db_record.owner_name || 'Sin asignar'} />
                        <InfoRow label="FECHA DE REGISTRO" value={new Date(result.db_record.upload_date).toLocaleString('es-MX')} />
                        <InfoRow
                          label="ESTADO DEL REGISTRO"
                          value={result.db_record.revoked ? '⛔ REVOCADO' : '✓ ACTIVO'}
                          color={result.db_record.revoked ? '#EF4444' : '#10B981'}
                        />
                        <InfoRow label="FORMATO EN REGISTRO" value={JSON.parse(result.db_record.metadata_json || '{}').type || 'Desconocido'} />
                      </div>

                      {/* Watermark layers */}
                      <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                        <p className="text-[10px] text-[var(--accent-cyan)] font-mono tracking-widest mb-3">CAPAS DE WATERMARK DETECTADAS</p>
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

                      {/* Hash integrity */}
                      <div className={`rounded-2xl p-4 border relative overflow-hidden ${result.hash_match ? 'bg-[#10B981]/5 border-[#10B981]/30' : 'bg-[#EF4444]/5 border-[#EF4444]/30'}`}>
                        <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: result.hash_match ? '#10B981' : '#EF4444' }} />
                        <p className="text-[10px] font-mono tracking-widest mb-1.5 pl-3" style={{ color: result.hash_match ? '#10B981' : '#EF4444' }}>SHA-256 INTEGRIDAD</p>
                        <p className="font-mono text-xs break-all pl-3" style={{ color: result.hash_match ? '#10B981' : '#EF4444' }}>
                          {result.hash_match ? `✓ Hash coincide — imagen íntegra` : '✗ HASH NO COINCIDE — imagen fue modificada'}
                        </p>
                      </div>

                      {/* C2PA */}
                      {/* C2PA / Content Credentials */}
                      <div className={`rounded-2xl p-4 border flex items-start gap-3 relative overflow-hidden ${result.c2pa_manifest?.found ? 'bg-[#10B981]/5 border-[#10B981]/30' : 'bg-[#F59E0B]/5 border-[#F59E0B]/30'}`}>
                        <div className="absolute top-0 left-0 w-1 h-full rounded-full" style={{ background: result.c2pa_manifest?.found ? '#10B981' : '#F59E0B' }} />
                        <Info size={16} className="mt-0.5 shrink-0 pl-1" style={{ color: result.c2pa_manifest?.found ? '#10B981' : '#F59E0B' }} />
                        <div className="pl-1">
                          <p className="text-[10px] font-mono tracking-widest mb-1.5" style={{ color: result.c2pa_manifest?.found ? '#10B981' : '#F59E0B' }}>C2PA CONTENT CREDENTIALS</p>
                          {result.c2pa_manifest?.found ? (
                            <>
                              <p className="text-xs font-bold text-white mb-1">✓ Firma criptográfica COSE válida y activa</p>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">Emisor: <span className="text-[var(--accent-cyan)]">{result.c2pa_manifest.issuer}</span></p>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">Fecha: <span className="text-[var(--accent-cyan)]">{new Date(result.c2pa_manifest.time).toLocaleString('es-MX')}</span></p>
                              <p className="text-[11px] text-[var(--text-secondary)] font-mono">Manifiesto: <span className="text-[var(--accent-cyan)]">{result.c2pa_manifest.title}</span></p>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-bold text-[var(--text-secondary)] mb-1">⚠ No se encontró firma C2PA local en la imagen</p>
                              <p className="text-[11px] text-[var(--text-secondary)]">Esta versión de archivo no contiene el manifiesto COSE embebido. Asegúrate de verificar el archivo original firmado.</p>
                            </>
                          )}
                          <div className="mt-2.5">
                            <a href="https://verify.contentauthenticity.org" target="_blank" rel="noopener noreferrer" className="text-[10px] font-mono text-[var(--accent-cyan)] hover:underline flex items-center gap-1">
                              Verificación cruzada oficial (Adobe CAI) ↗
                            </a>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="bg-black/40 rounded-2xl p-10 border border-white/5 text-center">
                      <ShieldX size={40} className="mx-auto mb-4 opacity-40" />
                      <p className="text-lg font-semibold mb-2">Sin credenciales KVS</p>
                      <p className="text-sm text-[var(--text-secondary)]">Esta imagen no está registrada en el sistema Kyllerium o sus capas de identificación fueron eliminadas.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button onClick={() => { setStatus('idle'); setPreview(null); setResult(null); }} className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition underline underline-offset-4 decoration-white/10">
                [ VERIFICAR OTRA IMAGEN ]
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
