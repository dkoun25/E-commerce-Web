import Link from 'next/link';
import type { Product } from '@/lib/types';
import { imgSrc } from '@/lib/api';
import { discount, money } from '@/lib/format';
import SafeImg from './SafeImg';
import AddToCart from './AddToCart';

export default function ProductCard({ p }: { p: Product }) {
  const off = discount(p.price, p.oldPrice);
  return (
    <article className="pcard">
      <Link href={`/san-pham/${p.slug}`} className="pcard-img" aria-label={p.name}>
        <SafeImg src={imgSrc(p.imageUrl)} alt={p.name} />
        {off > 0 && <span className="tag sale">-{off}%</span>}
        {p.badge && <span className="tag">{p.badge}</span>}
      </Link>
      <div className="pcard-body">
        <p className="pcard-brand">{p.brand}</p>
        <h3><Link href={`/san-pham/${p.slug}`}>{p.name}</Link></h3>
        <ul className="pcard-specs">{p.specs.slice(0, 3).map((s) => <li key={s}>{s}</li>)}</ul>
        <p className="price"><strong>{money(p.price)}</strong>{p.oldPrice && p.oldPrice > p.price && <s>{money(p.oldPrice)}</s>}</p>
        <AddToCart product={p} />
      </div>
    </article>
  );
}
