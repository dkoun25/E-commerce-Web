import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct, getProducts, getSettings, imgSrc } from '@/lib/api';
import { discount, money, telHref } from '@/lib/format';
import SafeImg from '@/components/SafeImg';
import AddToCart from '@/components/AddToCart';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getProduct(params.slug);
  return p ? { title: p.name, description: p.description.slice(0, 160) } : { title: 'Không tìm thấy sản phẩm' };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const p = await getProduct(params.slug);
  if (!p) notFound();
  const [settings, rel] = await Promise.all([getSettings(), getProducts({ category: p.categorySlug, take: 5 })]);
  const related = rel.items.filter((x) => x.id !== p.id).slice(0, 4);
  const off = discount(p.price, p.oldPrice);

  return (
    <div className="wrap page">
      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/">Trang chủ</Link><span>/</span>
        <Link href={`/san-pham?danh-muc=${p.categorySlug}`}>{p.categoryName}</Link><span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="pdetail">
        <div className="pdetail-img"><SafeImg src={imgSrc(p.imageUrl)} alt={p.name} eager /></div>
        <div className="pdetail-info">
          <h1>{p.name}</h1>
          <p className="meta">Thương hiệu: <strong>{p.brand || '-'}</strong> <span>|</span> Model: <strong>{p.model || '-'}</strong></p>
          <div className="pricebox">
            <strong>{money(p.price)}</strong>
            {p.oldPrice && p.oldPrice > p.price && <><s>{money(p.oldPrice)}</s><span className="tag sale">-{off}%</span></>}
          </div>
          {p.specs.length > 0 && <ul className="bullets">{p.specs.map((s) => <li key={s}>{s}</li>)}</ul>}
          <AddToCart product={p} withQty />
          {settings.hotline && <p className="hotline-note">Cần tư vấn thêm? Gọi <a href={telHref(settings.hotline)}>{settings.hotline}</a></p>}
        </div>
      </div>

      <section className="pdesc">
        <h2>Mô tả sản phẩm</h2>
        <p>{p.description || 'Đang cập nhật.'}</p>
        {p.sourceUrl && <p className="muted">Nguồn tham chiếu thông tin: <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer">trang sản phẩm của nhà sản xuất</a></p>}
      </section>

      {related.length > 0 && (
        <section className="section">
          <div className="sec-head"><h2>Sản phẩm cùng danh mục</h2></div>
          <div className="pgrid">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
    </div>
  );
}
