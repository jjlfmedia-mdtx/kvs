// src/app/components/ui/DownloadModal.tsx
'use client';
import React, { useState } from 'react';
import styles from './ui.module.css';

interface DownloadModalProps {
  imageId: string;
  onClose: () => void;
}

const DownloadModal: React.FC<DownloadModalProps> = ({ imageId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const handleDownload = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/certificate/${imageId}/${type}`);
      if (!res.ok) throw new Error('Network response was not ok');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = res.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || `${imageId}.${type}`;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Download failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Download Options</h2>
        <ul className={styles.list}>
          <li><button disabled={loading} onClick={() => handleDownload('pdf')}>Separate PDF</button></li>
          <li><button disabled={loading} onClick={() => handleDownload('combined')}>Combined PDF</button></li>
          <li><button disabled={loading} onClick={() => handleDownload('png')}>PNG Images</button></li>
          <li><button disabled={loading} onClick={() => handleDownload('zip')}>ZIP Bundle (PDF + PNG)</button></li>
        </ul>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DownloadModal;
