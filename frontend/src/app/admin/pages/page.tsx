'use client';

import { useState } from 'react';
import { api } from '@/lib/adminApi';
import { useLoad } from '@/lib/useLoad';
import type { ContentPage } from '@/lib/types';

type Form = { id: number | null; title: string; slug: string; body: string; showInFooter: boolean; sortOrder: string };
const blank: Form = { id: null, title: '', slug: '', body: '', showInFooter: true, sortOrder: '0' };

export default function AdminPages() {
  const { data, error, reload } = useLoad(() => api<ContentPage[]>('/api/admin/pages'));
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f) return;
    setBusy(true); setMsg('');
    try {
      if (f.id === null) await api('/api/admin/pages', { method: 'POST', body: { title: f.title, slug: f.slug || null, body: f.body, showInFooter: f.showInFooter, sortOrder: Number(f.sortOrder) || 0 } });
      else await api(`/api/admin/pages/${f.id}`, { method: 'PUT', body: { title: f.title, body: f.body, showInFooter: f.showInFooter, sortOrder: Number(f.sortOrder) || 0 } });
      setF(null);
      await reload();
    } catch (e2) { setMsg(e2 instanceof Error ? e2.message : 'Lưu thất bại'); } finally { setBusy(false); }
  }

  async function del(p: ContentPage) {
    if (!confirm(`Xóa trang "${p.title}"?`)) return;
    try { await api(`/api/admin/pages/${p.id}`, { method: 'DELETE' }); await reload(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Xóa thất bại'); }
  }

  return (
    <>
      <div className="adm-row between"><h1>Trang nội dung</h1>{!f && <button className="adm-btn primary" onClick={() => setF(blank)}>Thêm trang</button>}</div>
      <p className="adm-muted">Dùng cho giới thiệu, chính sách, hướng dẫn mua hàng. Tách đoạn bằng một dòng trống. Trang bật &quot;hiện ở chân trang&quot; sẽ có liên kết ở footer.</p>
      {(error || msg) && <p className="adm-err">{error || msg}</p>}
      {f && (
        <form className="adm-form adm-panel" onSubmit={save}>
          <h2>{f.id === null ? 'Thêm trang' : 'Sửa trang'}</h2>
          <label className="adm-field"><span className="adm-label">Tiêu đề *</span><input required maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          {f.id === null && <label className="adm-field"><span className="adm-label">Đường dẫn (slug, để trống để tự tạo)</span><input pattern="[a-z0-9]+(-[a-z0-9]+)*" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} /></label>}
          <label className="adm-field"><span className="adm-label">Nội dung</span><textarea rows={12} maxLength={20000} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></label>
          <div className="adm-grid2">
            <label className="adm-field"><span className="adm-label">Thứ tự</span><input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></label>
            <label className="adm-check"><input type="checkbox" checked={f.showInFooter} onChange={(e) => setF({ ...f, showInFooter: e.target.checked })} /> Hiện ở chân trang</label>
          </div>
          <div className="adm-row"><button className="adm-btn primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</button><button type="button" className="adm-btn" onClick={() => setF(null)}>Hủy</button></div>
        </form>
      )}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Tiêu đề</th><th>Đường dẫn</th><th>Footer</th><th /></tr></thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id}>
                <td><strong>{p.title}</strong></td><td>/trang/{p.slug}</td><td>{p.showInFooter ? 'Có' : 'Không'}</td>
                <td className="adm-actions">
                  <button className="adm-btn" onClick={() => setF({ id: p.id, title: p.title, slug: p.slug, body: p.body, showInFooter: p.showInFooter, sortOrder: String(p.sortOrder) })}>Sửa</button>
                  <button className="adm-btn danger" onClick={() => del(p)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
