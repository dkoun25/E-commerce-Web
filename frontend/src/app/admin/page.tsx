'use client';

import Link from 'next/link';
import { api } from '@/lib/adminApi';
import { useLoad } from '@/lib/useLoad';

type Stats = { products: number; activeProducts: number; productsWithoutImage: number; categories: number; banners: number; media: number; unreadMessages: number };

export default function Dashboard() {
  const { data, error } = useLoad(() => api<Stats>('/api/admin/stats'));
  const cards = data ? [
    { label: 'Sản phẩm', value: `${data.activeProducts}/${data.products}`, note: 'đang hiển thị / tổng', href: '/admin/products' },
    { label: 'Sản phẩm chưa có ảnh', value: data.productsWithoutImage, note: 'cần bổ sung ảnh đúng model', href: '/admin/products' },
    { label: 'Danh mục', value: data.categories, note: '', href: '/admin/categories' },
    { label: 'Banner đang bật', value: data.banners, note: '', href: '/admin/banners' },
    { label: 'Ảnh trong thư viện', value: data.media, note: '', href: '/admin/media' },
    { label: 'Tin nhắn chưa đọc', value: data.unreadMessages, note: 'liên hệ và yêu cầu đặt hàng', href: '/admin/messages' }
  ] : [];
  return (
    <>
      <h1>Tổng quan</h1>
      {error && <p className="adm-err">{error}</p>}
      <div className="adm-cards">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="adm-card">
            <span>{c.label}</span><strong>{c.value}</strong><small>{c.note}</small>
          </Link>
        ))}
      </div>
    </>
  );
}
