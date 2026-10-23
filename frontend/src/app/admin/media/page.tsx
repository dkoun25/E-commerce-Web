'use client';

import { useRef, useState } from 'react';
import { api, ApiError } from '@/lib/adminApi';
import { imgSrc } from '@/lib/api';
import { useLoad } from '@/lib/useLoad';
import type { Media } from '@/lib/types';

export default function AdminMedia() {
  const { data, error, reload } = useLoad(() => api<Media[]>('/api/admin/media'));
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg('');
    for (const file of Array.from(files)) {
      try {
        const fd = new FormData();
        fd.append('file', file);
        await api('/api/admin/media', { method: 'POST', form: fd });
      } catch (e) { setMsg(`${file.name}: ${e instanceof Error ? e.message : 'tải lên thất bại'}`); }
    }
    if (input.current) input.current.value = '';
    setBusy(false);
    await reload();
  }

  async function del(m: Media) {
    if (!confirm(`Xóa ảnh "${m.originalName}"?`)) return;
    try {
      await api(`/api/admin/media/${m.id}`, { method: 'DELETE' });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        if (!confirm(`${e.message}\nVẫn xóa? Các nơi đang dùng sẽ hiện ảnh dự phòng.`)) return;
        try { await api(`/api/admin/media/${m.id}?force=true`, { method: 'DELETE' }); } catch (e2) { setMsg(e2 instanceof Error ? e2.message : 'Xóa thất bại'); return; }
      } else { setMsg(e instanceof Error ? e.message : 'Xóa thất bại'); return; }
    }
    await reload();
  }

  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); setMsg('Đã sao chép đường dẫn ảnh.'); } catch { setMsg(url); }
  };

  return (
    <>
      <div className="adm-row between">
        <h1>Thư viện ảnh</h1>
        <button className="adm-btn primary" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Đang tải lên...' : 'Tải ảnh lên'}</button>
      </div>
      <p className="adm-muted">Hỗ trợ JPG, PNG, WEBP, GIF, tối đa 5MB mỗi ảnh. Hãy chỉ tải ảnh đúng model sản phẩm và bạn có quyền sử dụng.</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={(e) => void upload(e.target.files)} />
      {(error || msg) && <p className="adm-err">{error || msg}</p>}
      <div className="adm-media-grid big">
        {(data ?? []).map((m) => (
          <div key={m.id} className="adm-media-item">
            <img src={imgSrc(m.url) ?? ''} alt={m.originalName} loading="lazy" />
            <span title={m.originalName}>{m.originalName}</span>
            <small className="adm-muted">{(m.size / 1024).toFixed(0)} KB</small>
            <div className="adm-row"><button className="adm-btn" onClick={() => copy(m.url)}>Sao chép URL</button><button className="adm-btn danger" onClick={() => del(m)}>Xóa</button></div>
          </div>
        ))}
        {data && data.length === 0 && <p className="adm-muted">Chưa có ảnh nào.</p>}
      </div>
    </>
  );
}
