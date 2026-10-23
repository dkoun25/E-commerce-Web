'use client';

import { useState } from 'react';
import { api } from '@/lib/adminApi';
import { useLoad } from '@/lib/useLoad';
import ImageField from '@/components/admin/ImageField';
import type { Banner } from '@/lib/types';

type Form = { id: number | null; title: string; subtitle: string; imageUrl: string; linkUrl: string; linkText: string; sortOrder: string; isActive: boolean };
const blank: Form = { id: null, title: '', subtitle: '', imageUrl: '', linkUrl: '', linkText: '', sortOrder: '0', isActive: true };

export default function AdminBanners() {
  const { data, error, reload } = useLoad(() => api<Banner[]>('/api/admin/banners'));
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const edit = (b: Banner) => setF({ id: b.id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl ?? '', linkUrl: b.linkUrl ?? '', linkText: b.linkText ?? '', sortOrder: String(b.sortOrder), isActive: b.isActive });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    setBusy(true); setMsg('');
    const body = { title: f.title, subtitle: f.subtitle, imageUrl: f.imageUrl.trim() || null, linkUrl: f.linkUrl.trim() || null, linkText: f.linkText.trim() || null, sortOrder: Number(f.sortOrder) || 0, isActive: f.isActive };
    try {
      if (f.id === null) await api('/api/admin/banners', { method: 'POST', body });
      else await api(`/api/admin/banners/${f.id}`, { method: 'PUT', body });
      setF(null);
      await reload();
    } catch (e2) { setMsg(e2 instanceof Error ? e2.message : 'Lưu thất bại'); } finally { setBusy(false); }
  }

  async function del(b: Banner) {
    if (!confirm(`Xóa banner "${b.title}"?`)) return;
    try { await api(`/api/admin/banners/${b.id}`, { method: 'DELETE' }); await reload(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Xóa thất bại'); }
  }

  return (
    <>
      <div className="adm-row between"><h1>Banner trang chủ</h1>{!f && <button className="adm-btn primary" onClick={() => setF(blank)}>Thêm banner</button>}</div>
      <p className="adm-muted">Banner không có ảnh sẽ hiển thị nền màu xanh với tiêu đề và mô tả. Ảnh nên có tỷ lệ ngang khoảng 3:1, ví dụ 1400x460.</p>
      {(error || msg) && <p className="adm-err">{error || msg}</p>}
      {f && (
        <form className="adm-form adm-panel" onSubmit={save}>
          <h2>{f.id === null ? 'Thêm banner' : 'Sửa banner'}</h2>
          <label className="adm-field"><span className="adm-label">Tiêu đề *</span><input required maxLength={160} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label className="adm-field"><span className="adm-label">Mô tả ngắn</span><input maxLength={300} value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} /></label>
          <ImageField label="Ảnh banner" value={f.imageUrl} onChange={(v) => setF({ ...f, imageUrl: v })} />
          <div className="adm-grid2">
            <label className="adm-field"><span className="adm-label">Liên kết (/san-pham hoặc https://...)</span><input value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} /></label>
            <label className="adm-field"><span className="adm-label">Chữ trên nút</span><input maxLength={40} value={f.linkText} onChange={(e) => setF({ ...f, linkText: e.target.value })} /></label>
            <label className="adm-field"><span className="adm-label">Thứ tự</span><input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></label>
            <label className="adm-check"><input type="checkbox" checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} /> Đang bật</label>
          </div>
          <div className="adm-row"><button className="adm-btn primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</button><button type="button" className="adm-btn" onClick={() => setF(null)}>Hủy</button></div>
        </form>
      )}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Tiêu đề</th><th>Ảnh</th><th>Liên kết</th><th>Thứ tự</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {(data ?? []).map((b) => (
              <tr key={b.id}>
                <td><strong>{b.title}</strong><br /><small className="adm-muted">{b.subtitle}</small></td>
                <td>{b.imageUrl ? 'Có' : 'Nền màu'}</td><td>{b.linkUrl}</td><td>{b.sortOrder}</td>
                <td><span className={'adm-pill ' + (b.isActive ? 'on' : '')}>{b.isActive ? 'Bật' : 'Tắt'}</span></td>
                <td className="adm-actions"><button className="adm-btn" onClick={() => edit(b)}>Sửa</button><button className="adm-btn danger" onClick={() => del(b)}>Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
