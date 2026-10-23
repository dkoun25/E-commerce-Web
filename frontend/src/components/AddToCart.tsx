'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useShop } from './Shop';

export default function AddToCart({ product, withQty = false, label = 'Thêm vào giỏ' }: { product: Product; withQty?: boolean; label?: string }) {
  const { add, setOpen } = useShop();
  const [qty, setQty] = useState(1);
  const snap = { id: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.imageUrl };

  return (
    <div className="addcart">
      {withQty && (
        <div className="qty" aria-label="Số lượng">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Giảm số lượng">−</button>
          <span>{qty}</span>
          <button type="button" onClick={() => setQty((q) => Math.min(99, q + 1))} aria-label="Tăng số lượng">+</button>
        </div>
      )}
      <button type="button" className="btn primary" onClick={() => add(snap, qty)}>{label}</button>
      {withQty && (
        <button type="button" className="btn" onClick={() => { add(snap, qty); setOpen(true); }}>Mua ngay</button>
      )}
    </div>
  );
}
