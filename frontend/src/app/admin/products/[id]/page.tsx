'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/adminApi';
import ImageField from '@/components/admin/ImageField';
import type { Category, Product } from '@/lib/types';

type Form = {
  name: string; categoryId: number; brand: string; model: string; price: string; oldPrice: string; badge: string;
  description: string; specs: string; imageUrl: string; sourceUrl: string; isActive: boolean; sortOrder: string;
};
const empty: Form = { name: '', categoryId: 0, brand: '', model: '', price: '', oldPrice: '', badge: '', description: '', specs: '', imageUrl: '', sourceUrl: '', isActive: true, sortOrder: '0' };

export default function ProductForm({ params }: { params: { id: string } }) {
  const router = useRouter();
  const isNew = params.id === 'new';
  const [f, setF] = useState<Form>(empty);
  const [cats, setCats] = useState<Category[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(isNew);

  useEffect(() => {
    (async () => {
      try {
        const c = await api<Category[]>('/api/admin/categories');
        setCats(c);
        if (isNew) { setF((x) => ({ ...x, categoryId: c[0]?.id ?? 0 })); return; }
        const p = await api<Product>(`/api/admin/products/${params.id}`);
        setF({
          name: p.name, categoryId: p.categoryId, brand: p.brand, model: p.model, price: String(p.price),
          oldPrice: p.oldPrice ? String(p.oldPrice) : '', badge: p.badge ?? '', description: p.description,
          specs: p.specs.join('\n'), imageUrl: p.imageUrl ?? '', sourceUrl: p.sourceUrl ?? '', isActive: p.isActive, sortOrder: String(p.sortOrder)
        });
        setLoaded(true);
      } catch (e) { setErr(e instanceof Error ? e.message : 'Không tải được dữ liệu'); }
    })();
  }, [isNew, params.id]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr('');
    const body = {
      name: f.name, categoryId: f.categoryId, brand: f.brand, model: f.model,
      price: Number(f.price) || 0, oldPrice: f.oldPrice ? Number(f.oldPrice) : null,
      badge: f.badge || null, description: f.description,
      specs: f.specs.split('\n').map((s) => s.trim()).filter(Boolean),
      imageUrl: f.imageUrl.trim() || null, sourceUrl: f.sourceUrl.trim() || null,
      isActive: f.isActive, sortOrder: Number(f.sortOrder) || 0
    };
    try {
      if (isNew) await api('/api/admin/products', { method: 'POST', body });
      else await api(`/api/admin/products/${params.id}`, { method: 'PUT', body });
      router.push('/admin/products');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Lưu thất bại');
      setBusy(false);
    }
  }

  if (!loaded && !err) return <p className="adm-loading">Đang tải...</p>;
  return (
    <form className="adm-form" onSubmit={submit}>
      <div className="adm-row between">
        <h1>{isNew ? 'Thêm sản phẩm' : 'Sửa sản phẩm'}</h1>
        <Link href="/admin/products" className="adm-btn">Quay lại</Link>
      </div>
      <label className="adm-field"><span className="adm-label">Tên sản phẩm *</span><input required maxLength={200} value={f.name} onChange={(e) => set('name', e.target.value)} /></label>
      <div className="adm-grid2">
        <label className="adm-field"><span className="adm-label">Danh mục *</span>
          <select required value={f.categoryId} onChange={(e) => set('categoryId', Number(e.target.value))}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="adm-field"><span className="adm-label">Nhãn</span>
          <select value={f.badge} onChange={(e) => set('badge', e.target.value)}>
            <option value="">Không</option><option>Bán chạy</option><option>Mới</option>
          </select>
        </label>
        <label className="adm-field"><span className="adm-label">Hãng sản xuất</span><input maxLength={80} value={f.brand} onChange={(e) => set('brand', e.target.value)} /></label>
        <label className="adm-field"><span className="adm-label">Model chính xác</span><input maxLength={200} value={f.model} onChange={(e) => set('model', e.target.value)} /></label>
        <label className="adm-field"><span className="adm-label">Giá bán (VND) *</span><input required type="number" min={0} value={f.price} onChange={(e) => set('price', e.target.value)} /></label>
        <label className="adm-field"><span className="adm-label">Giá cũ (VND, để trống nếu không giảm)</span><input type="number" min={0} value={f.oldPrice} onChange={(e) => set('oldPrice', e.target.value)} /></label>
        <label className="adm-field"><span className="adm-label">Thứ tự hiển thị</span><input type="number" value={f.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></label>
        <label className="adm-check"><input type="checkbox" checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Hiển thị trên website</label>
      </div>
      <ImageField label="Ảnh sản phẩm (phải đúng model)" value={f.imageUrl} onChange={(v) => set('imageUrl', v)} />
      <label className="adm-field"><span className="adm-label">Trang tham chiếu của nhà sản xuất (để đối chiếu model)</span><input type="url" placeholder="https://..." value={f.sourceUrl} onChange={(e) => set('sourceUrl', e.target.value)} /></label>
      <label className="adm-field"><span className="adm-label">Thông số (mỗi dòng một mục)</span><textarea rows={5} value={f.specs} onChange={(e) => set('specs', e.target.value)} /></label>
      <label className="adm-field"><span className="adm-label">Mô tả</span><textarea rows={5} maxLength={5000} value={f.description} onChange={(e) => set('description', e.target.value)} /></label>
      {err && <p className="adm-err" role="alert">{err}</p>}
      <div className="adm-row"><button className="adm-btn primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu'}</button></div>
    </form>
  );
}
