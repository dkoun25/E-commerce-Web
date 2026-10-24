'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, clearToken, getToken } from '@/lib/adminApi';

const NAV = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/products', label: 'Sản phẩm' },
  { href: '/admin/categories', label: 'Danh mục' },
  { href: '/admin/banners', label: 'Banner trang chủ' },
  { href: '/admin/media', label: 'Thư viện ảnh' },
  { href: '/admin/pages', label: 'Trang nội dung' },
  { href: '/admin/settings', label: 'Cài đặt website' },
  { href: '/admin/messages', label: 'Tin nhắn liên hệ' }
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const isLogin = path === '/admin/login';

  useEffect(() => {
    if (isLogin) { setReady(true); return; }
    if (!getToken()) { router.replace('/admin/login'); return; }
    api('/api/auth/me').then(() => setReady(true)).catch(() => { /* api() redirects on 401 */ });
  }, [isLogin, router, path]);

  if (isLogin) return <div className="adm-login-wrap">{children}</div>;
  if (!ready) return <p className="adm-loading">Đang kiểm tra phiên đăng nhập...</p>;

  const active = (h: string) => (h === '/admin' ? path === '/admin' : path.startsWith(h));
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/admin" className="adm-brand">Aura Tech <small>Quản trị</small></Link>
        <nav aria-label="Menu quản trị">
          {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={active(n.href) ? 'page' : undefined}>{n.label}</Link>)}
        </nav>
        <div className="adm-side-foot">
          <a href="/" target="_blank" rel="noopener noreferrer">Xem website</a>
          <button onClick={() => { clearToken(); router.replace('/admin/login'); }}>Đăng xuất</button>
        </div>
      </aside>
      <main className="adm-main">{children}</main>
    </div>
  );
}
