import type { Metadata } from 'next';
import Link from 'next/link';
import { getCategories, getProducts } from '@/lib/api';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Sản phẩm' };

type SP = { [k: string]: string | string[] | undefined };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const SORTS = [
  { v: '', label: 'Mặc định' },
  { v: 'price_asc', label: 'Giá tăng dần' },
  { v: 'price_desc', label: 'Giá giảm dần' },
  { v: 'name', label: 'Tên A-Z' }
];

export default async function Products({ searchParams }: { searchParams: SP }) {
  const cat = one(searchParams['danh-muc']);
  const q = one(searchParams.q).slice(0, 80);
  const sort = SORTS.some((s) => s.v === one(searchParams.sx)) ? one(searchParams.sx) : '';
  const sale = one(searchParams['khuyen-mai']) === '1';

  const [categories, res] = await Promise.all([
    getCategories(),
    getProducts({ category: cat, q, sort, onSale: sale })
  ]);
  const current = categories.find((c) => c.slug === cat);

  const href = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = { 'danh-muc': cat, q, sx: sort, 'khuyen-mai': sale ? '1' : '' };
    Object.entries({ ...base, ...over }).forEach(([k, v]) => { if (v) p.set(k, v); });
    const s = p.toString();
    return '/san-pham' + (s ? '?' + s : '');
  };

  const title = q ? `Kết quả cho "${q}"` : sale ? 'Sản phẩm giảm giá' : current ? current.name : 'Tất cả sản phẩm';

  return (
    <div className="wrap page">
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span>Sản phẩm</span></nav>
      <div className="plist">
        <aside className="filters">
          <h2>Danh mục</h2>
          <ul>
            <li><Link href={href({ 'danh-muc': '' })} aria-current={!cat}>Tất cả</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link href={href({ 'danh-muc': c.slug })} aria-current={cat === c.slug}>{c.name}<small>{c.productCount}</small></Link></li>
            ))}
          </ul>
          <h2>Lọc nhanh</h2>
          <ul>
            <li><Link href={href({ 'khuyen-mai': sale ? '' : '1' })} aria-current={sale}>Đang giảm giá</Link></li>
          </ul>
        </aside>
        <section>
          <div className="plist-head">
            <div><h1>{title}</h1><p className="muted">{res.items.length} sản phẩm</p></div>
            <div className="sorts" role="group" aria-label="Sắp xếp">
              {SORTS.map((s) => <Link key={s.v} href={href({ sx: s.v })} aria-current={sort === s.v}>{s.label}</Link>)}
            </div>
          </div>
          {res.failed && <p className="notice" role="alert">Không tải được sản phẩm từ máy chủ. Vui lòng thử lại sau.</p>}
          {!res.failed && res.items.length === 0 && (
            <div className="empty">
              <h3>Không tìm thấy sản phẩm phù hợp</h3>
              <p>Hãy thử từ khóa khác hoặc xem toàn bộ sản phẩm.</p>
              <Link className="btn primary" href="/san-pham">Xem tất cả</Link>
            </div>
          )}
          <div className="pgrid">{res.items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      </div>
    </div>
  );
}
