'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/adminApi';
import { imgSrc } from '@/lib/api';
import { money } from '@/lib/format';
import { useLoad } from '@/lib/useLoad';
import type { Product } from '@/lib/types';

export default function AdminProducts() {
  const { data, error, reload } = useLoad(() => api<Product[]>('/api/admin/products'));
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');

  async function del(p: Product) {
    if (!confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try { await api(`/api/admin/products/${p.id}`, { method: 'DELETE' }); await reload(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Xóa thất bại'); }
  }

  const rows = (data ?? []).filter((p) => !q || `${p.name} ${p.brand} ${p.model}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="adm-row between">
        <h1>Sản phẩm</h1>
        <Link href="/admin/products/new" className="adm-btn primary">Thêm sản phẩm</Link>
      </div>
      <input className="adm-search" placeholder="Tìm theo tên, hãng, model..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Tìm sản phẩm" />
      {(error || msg) && <p className="adm-err">{error || msg}</p>}
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead><tr><th>Ảnh</th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td><div className="adm-mini">{p.imageUrl ? <img src={imgSrc(p.imageUrl) ?? ''} alt="" referrerPolicy="no-referrer" /> : <span>-</span>}</div></td>
                <td><Link href={`/admin/products/${p.id}`}><strong>{p.name}</strong></Link><br /><small className="adm-muted">{p.brand} {p.model}</small></td>
                <td>{p.categoryName}</td>
                <td>{money(p.price)}{p.oldPrice ? <><br /><s className="adm-muted">{money(p.oldPrice)}</s></> : null}</td>
                <td><span className={'adm-pill ' + (p.isActive ? 'on' : '')}>{p.isActive ? 'Hiển thị' : 'Ẩn'}</span></td>
                <td className="adm-actions">
                  <Link href={`/admin/products/${p.id}`} className="adm-btn">Sửa</Link>
                  <button className="adm-btn danger" onClick={() => del(p)}>Xóa</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="adm-muted">Không có sản phẩm.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
