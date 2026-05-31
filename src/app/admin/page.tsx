"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeySquare, XOctagon, BarChart2, Image as ImageIcon, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

export default function AdminPage() {
  const [images, setImages] = useState<any[]>([]);
  const [token, setToken] = useState('');
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = () => {
    if (token.length > 5) {
      setAuthed(true);
      fetchImages(token);
    } else {
      setError('Token too short - minimum 6 characters');
    }
  };

  const fetchImages = async (t: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/images', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        setImages(await res.json());
      } else {
        setError('Unauthorized');
        setAuthed(false);
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!authed) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-purple)]/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 rounded-3xl w-full max-w-md text-center relative z-10 shadow-2xl border-[var(--glass-border)]"
        >
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 flex items-center justify-center mx-auto mb-6 shadow-cyan-glow">
            <Shield size={32} className="text-[var(--accent-cyan)]" />
          </div>
          <p className="text-xs font-mono text-[var(--accent-cyan)] tracking-widest mb-2">KVS COMMAND CENTER</p>
          <h2 className="text-2xl font-bold mb-2">Secure Access</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-8">Enter your administrator token to access the command center.</p>
          
          <input 
            type="password" 
            placeholder="Administrator token"
            className="w-full bg-black/60 border border-white/10 rounded-xl p-4 mb-2 font-mono text-sm focus:border-[var(--accent-cyan)] outline-none transition text-white placeholder-white/20 text-center tracking-widest"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && login()}
          />
          <p className="text-[10px] font-mono text-[var(--text-secondary)] mb-6">Private access only</p>
          <button 
            onClick={login} 
            className="w-full bg-[var(--accent-cyan)] text-black font-mono font-bold py-4 rounded-xl tracking-widest hover:shadow-cyan-glow-intense transition"
          >
            INITIALIZE SESSION
          </button>
          {error && (
            <p className="text-red-400 font-mono text-sm mt-4">{error}</p>
          )}
        </motion.div>
      </div>
    );
  }

  const verified = images.filter(i => i.verification_status === 'VERIFIED').length;
  const total = images.length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[var(--accent-cyan)]/5 rounded-full blur-[100px] pointer-events-none"></div>
      
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-xs font-mono text-[var(--accent-cyan)] tracking-widest mb-1">KVS COMMAND CENTER</p>
          <h1 className="text-3xl font-bold">System Registry</h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => fetchImages(token)}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm font-mono"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> REFRESH
          </button>
          <button 
            onClick={() => setAuthed(false)}
            className="flex items-center gap-2 px-5 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition text-sm font-mono"
          >
            LOGOUT
          </button>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10"
      >
        {[
          { label: 'TOTAL ASSETS', value: total, icon: <ImageIcon size={20} />, color: 'var(--accent-cyan)' },
          { label: 'VERIFIED', value: verified, icon: <CheckCircle size={20} />, color: '#10B981' },
          { label: 'UNVERIFIED', value: total - verified, icon: <XOctagon size={20} />, color: '#F59E0B' },
          { label: 'REGISTRY VERSION', value: 'v3.0', icon: <BarChart2 size={20} />, color: 'var(--accent-purple)' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card rounded-2xl p-5 border border-[var(--glass-border)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-mono tracking-widest" style={{ color: stat.color }}>{stat.label}</p>
              <span style={{ color: stat.color }}>{stat.icon}</span>
            </div>
            <p className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass-card rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-2xl"
      >
        <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
          <h2 className="text-lg font-bold">Asset Registry</h2>
          <span className="text-xs font-mono text-[var(--text-secondary)]">{total} RECORDS</span>
        </div>
        
        {loading ? (
          <div className="py-24 text-center">
            <Loader2 size={32} className="animate-spin text-[var(--accent-cyan)] mx-auto mb-4" />
            <p className="font-mono text-sm text-[var(--text-secondary)]">LOADING REGISTRY...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-black/50 text-[var(--text-secondary)] font-mono">
                <tr>
                  <th className="p-5 text-[10px] tracking-widest">KVS-ID</th>
                  <th className="p-5 text-[10px] tracking-widest">OWNER</th>
                  <th className="p-5 text-[10px] tracking-widest">FILENAME</th>
                  <th className="p-5 text-[10px] tracking-widest">DATE</th>
                  <th className="p-5 text-[10px] tracking-widest">STATUS</th>
                  <th className="p-5 text-[10px] tracking-widest text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--glass-border)]">
                {images.map((img, idx) => (
                  <motion.tr 
                    key={img.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: idx * 0.04 }}
                    className="hover:bg-white/5 transition group"
                  >
                    <td className="p-5 font-mono text-xs">
                      <div className="text-[var(--accent-cyan)] font-bold">{img.kvs_id}</div>
                      <div className="text-[9px] text-[var(--accent-purple)] mt-0.5 tracking-wider truncate max-w-[200px]" title={img.kvs_fingerprint}>
                        {img.kvs_fingerprint}
                      </div>
                    </td>
                    <td className="p-5 font-medium">{img.owner_name || <span className="text-[var(--text-secondary)] italic">Unassigned</span>}</td>
                    <td className="p-5 text-[var(--text-secondary)] text-xs truncate max-w-[150px]">{img.filename}</td>
                    <td className="p-5 text-[var(--text-secondary)] text-xs">{new Date(img.upload_date).toLocaleDateString()}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest ${
                        img.revoked ? 'bg-red-500/15 text-red-400 border border-red-500/30' : 
                        img.verification_status === 'VERIFIED' ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30' : 
                        'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30'
                      }`}>
                        {img.revoked ? 'REVOKED' : img.verification_status}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <a 
                          href={`/api/download/${img.kvs_id}`} 
                          className="p-2 bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/30 text-[var(--accent-cyan)] rounded-lg hover:bg-[var(--accent-cyan)]/20 transition" 
                          title="Download Asset"
                        >
                          <KeySquare size={15} />
                        </a>
                        <a 
                          href={`/api/certificate/${img.kvs_id}`} 
                          className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition" 
                          title="Download Certificate"
                        >
                          <CheckCircle size={15} />
                        </a>
                        <button 
                          className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition" 
                          title="Revoke Asset"
                        >
                          <XOctagon size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {images.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="py-24 text-center">
                      <Shield size={40} className="text-[var(--text-secondary)] mx-auto mb-4 opacity-30" />
                      <p className="font-mono text-sm text-[var(--text-secondary)]">NO ASSETS IN REGISTRY</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
