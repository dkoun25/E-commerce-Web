'use client';

import { useState } from 'react';
import { api } from '@/lib/adminApi';
import { useLoad } from '@/lib/useLoad';
import type { Category } from '@/lib/types';

export default function AdminCategories() {
  const { data, error, reload } = useLoad(() => api<Category[]>('/api/admin/categories'));
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState<{ id: number; name: string; tag: string; hue: number; sortOrder: number } | null>(null);
  const [name, setName] = useState('');

  const run = async (fn: () => Promise<unknown>) => {
    setMsg('');
    try { await fn(); await reload(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Thao tác thất bại'); }
  };

  return (
    <>
      <h1>Danh mục</h1>
      {(error || msg) && <p className="adm-err">{error || msg}</p>}
      <form className="adm-row" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; void run(async () => { await api('/api/admin/categories', { method: 'POST', body: { name, tag: name, hue: 255, sortOrder: (data?.length ?? 0) } }); setName(''); }); }}>
        <input className="adm-search" placeholder="Tên danh mục mới" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} aria-label="Tên danh mục mới" />
        <button className="adm-btn primary">Thêm</button>
      </form>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Tên</th><th>Nhãn ngắn</th><th>Màu (0-360)</th><th>Slug</th><th>Thứ tự</th><th>Sản phẩm</th><th /></tr></thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id}>
                {editing?.id === c.id ? (
                  <>
                    <td><input value={editing.name} maxLength={80} onChange={(e) => setEditing({ ...editing, name: e.target.value })} aria-label="Tên" /></td>
                    <td><input value={editing.tag} maxLength={30} onChange={(e) => setEditing({ ...editing, tag: e.target.value })} aria-label="Nhãn ngắn" /></td>
                    <td><input type="number" min={0} max={360} value={editing.hue} onChange={(e) => setEditing({ ...editing, hue: Number(e.target.value) })} aria-label="Màu" /></td>
                    <td>{c.slug}</td>
                    <td><input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) })} aria-label="Thứ tự" /></td>
                    <td>{c.productCount}</td>
                    <td className="adm-actions">
                      <button className="adm-btn primary" onClick={() => run(async () => { await api(`/api/admin/categories/${c.id}`, { method: 'PUT', body: { name: editing.name, tag: editing.tag, hue: editing.hue, sortOrder: editing.sortOrder } }); setEditing(null); })}>Lưu</button>
                      <button className="adm-btn" onClick={() => setEditing(null)}>Hủy</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td><strong>{c.name}</strong></td><td>{c.tag}</td><td><span className="adm-swatch" style={{ background: `hsl(${c.hue} 70% 35%)` }} /> {c.hue}</td><td>{c.slug}</td><td>{c.sortOrder}</td><td>{c.productCount}</td>
                    <td className="adm-actions">
                      <button className="adm-btn" onClick={() => setEditing({ id: c.id, name: c.name, tag: c.tag, hue: c.hue, sortOrder: c.sortOrder })}>Sửa</button>
                      <button className="adm-btn danger" onClick={() => { if (confirm(`Xóa danh mục "${c.name}"?`)) void run(() => api(`/api/admin/categories/${c.id}`, { method: 'DELETE' })); }}>Xóa</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
