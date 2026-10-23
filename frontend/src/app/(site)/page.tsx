import Link from 'next/link';
import { getBanners, getCategories, getProducts, getSettings } from '@/lib/api';
import HeroSlider from '@/components/HeroSlider';
import ProductCard from '@/components/ProductCard';
import ContactForm from '@/components/ContactForm';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

function Section({ title, href, items }: { title: string; href: string; items: Product[] }) {
  if (items.length === 0) return null;
  return (
    <section className="section wrap">
      <div className="sec-head">
        <h2>{title}</h2>
        <Link href={href}>Xem tất cả</Link>
      </div>
      <div className="pgrid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
    </section>
  );
}

const perks = [
  { t: 'Tư vấn cấu hình', d: 'Chọn CPU, mainboard, RAM, nguồn tương thích với nhau.' },
  { t: 'Kiểm tra trước khi giao', d: 'Kiểm tra sản phẩm và phụ kiện đi kèm trước khi gửi.' },
  { t: 'Giao hàng toàn quốc', d: 'Đóng gói chống sốc cho card đồ họa và màn hình.' },
  { t: 'Hỗ trợ sau mua', d: 'Giải đáp kỹ thuật và bảo hành qua hotline, email.' }
];

export default async function Home() {
  const [settings, categories, banners, all, sale, hot, fresh] = await Promise.all([
    getSettings(), getCategories(), getBanners(),
    getProducts(), getProducts({ onSale: true, take: 8 }),
    getProducts({ badge: 'Bán chạy', take: 8 }), getProducts({ badge: 'Mới', take: 8 })
  ]);
  const brands = Array.from(new Set(all.items.map((p) => p.brand).filter(Boolean))).sort();

  return (
    <>
      <div className="wrap home-top">
        <aside className="cat-side" aria-label="Danh mục sản phẩm">
          <h2>Danh mục</h2>
          <ul>
            {categories.map((c) => (
              <li key={c.id}><Link href={`/san-pham?danh-muc=${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </aside>
        <HeroSlider banners={banners} />
      </div>

      <div className="wrap perks">
        {perks.map((p) => <div key={p.t}><strong>{p.t}</strong><span>{p.d}</span></div>)}
      </div>

      {all.failed && (
        <div className="wrap"><p className="notice" role="alert">Không tải được danh sách sản phẩm từ máy chủ. Vui lòng thử tải lại trang sau ít phút.</p></div>
      )}

      <Section title="Đang giảm giá" href="/san-pham?khuyen-mai=1" items={sale.items} />
      <Section title="Bán chạy" href="/san-pham" items={hot.items} />
      <Section title="Hàng mới" href="/san-pham" items={fresh.items} />

      {brands.length > 0 && (
        <section className="section wrap">
          <div className="sec-head"><h2>Thương hiệu</h2></div>
          <ul className="brands">
            {brands.map((b) => <li key={b}><Link href={`/san-pham?q=${encodeURIComponent(b)}`}>{b}</Link></li>)}
          </ul>
        </section>
      )}

      <section className="section wrap" id="tu-van">
        <div className="cta">
          <div>
            <h2>Cần tư vấn cấu hình?</h2>
            <p>{settings.contact_intro}</p>
            {settings.hotline && <p className="cta-hot">Hotline: <strong>{settings.hotline}</strong></p>}
          </div>
          <ContactForm compact />
        </div>
      </section>
    </>
  );
}
