'use client';

import { useRef, useState } from 'react';
import { api } from '@/lib/adminApi';
import { imgSrc } from '@/lib/api';
import type { Media } from '@/lib/types';

export default function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const file = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [lib, setLib] = useState<Media[] | null>(null);
  const [broken, setBroken] = useState(false);

  async function upload(f: File) {
    setBusy(true); setErr('');
    try {
      const fd = new FormData();
      fd.append('file', f);
      const m = await api<Media>('/api/admin/media', { method: 'POST', form: fd });
      setBroken(false);
      onChange(m.url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Tải ảnh thất bại');
    } finally {
      setBusy(false);
      if (file.current) file.current.value = '';
    }
  }

  async function openLib() {
    setErr('');
    try { setLib(await api<Media[]>('/api/admin/media')); } catch (e) { setErr(e instanceof Error ? e.message : 'Không tải được thư viện'); }
  }

  const src = imgSrc(value);
  return (
    <div className="adm-field">
      <span className="adm-label">{label}</span>
      <div className="adm-img">
        <div className="adm-thumb">
          {src && !broken ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : <span>{value ? 'Không tải được ảnh' : 'Chưa có ảnh'}</span>}
        </div>
        <div className="adm-img-ctl">
          <input value={value} onChange={(e) => { setBroken(false); onChange(e.target.value); }} placeholder="https://... hoặc /uploads/..." aria-label={label + ' (URL)'} />
          <div className="adm-row">
            <button type="button" className="adm-btn" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'Đang tải...' : 'Tải ảnh lên'}</button>
            <button type="button" className="adm-btn" onClick={openLib}>Chọn từ thư viện</button>
            {value && <button type="button" className="adm-btn danger" onClick={() => onChange('')}>Bỏ ảnh</button>}
          </div>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }} />
          {err && <p className="adm-err">{err}</p>}
        </div>
      </div>
      {lib && (
        <div className="adm-modal" role="dialog" aria-modal="true" aria-label="Thư viện ảnh" onClick={() => setLib(null)}>
          <div className="adm-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="adm-row between"><h3>Thư viện ảnh</h3><button type="button" className="adm-btn" onClick={() => setLib(null)}>Đóng</button></div>
            {lib.length === 0 && <p className="adm-muted">Chưa có ảnh nào được tải lên.</p>}
            <div className="adm-media-grid">
              {lib.map((m) => (
                <button type="button" key={m.id} className="adm-media-item" onClick={() => { setBroken(false); onChange(m.url); setLib(null); }}>
                  <img src={imgSrc(m.url) ?? ''} alt={m.originalName} />
                  <span>{m.originalName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
