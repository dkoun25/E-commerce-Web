'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useShop } from './Shop';
import { telHref } from '@/lib/format';
import type { Category, Settings } from '@/lib/types';

const Logo = ({ name }: { name: string }) => (
  <Link href="/" className="logo" aria-label={`${name} - Trang chủ`}>
    <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><rect x="2" y="2" width="28" height="28" rx="6" /><path d="M9 23 16 8l7 15M12 18.5h8" /></svg>
    <span>{name}</span>
  </Link>
);

export default function Header({ settings, categories }: { settings: Settings; categories: Category[] }) {
  const { count, setOpen } = useShop();
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    const onDown = (e: Event) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCatOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [catOpen]);
  const links = [
    { href: '/', label: 'Trang chủ' },
    { href: '/san-pham', label: 'Sản phẩm' },
    { href: '/san-pham?khuyen-mai=1', label: 'Khuyến mãi' },
    { href: '/trang/gioi-thieu', label: 'Giới thiệu' },
    { href: '/lien-he', label: 'Liên hệ' }
  ];

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="wrap topbar-in">
          <span>{settings.announcement}</span>
          <span className="topbar-r">
            {settings.hotline && <a href={telHref(settings.hotline)}>Hotline: {settings.hotline}</a>}
            {settings.email && <a href={'mailto:' + settings.email}>{settings.email}</a>}
          </span>
        </div>
      </div>
      <div className="wrap hdr-main">
        <Logo name={settings.site_name} />
        <form className="search" action="/san-pham" method="get" role="search">
          <label className="sr" htmlFor="hq">Tìm sản phẩm</label>
          <input id="hq" name="q" type="search" placeholder="Tìm CPU, card đồ họa, SSD..." autoComplete="off" maxLength={80} />
          <button aria-label="Tìm kiếm">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          </button>
        </form>
        {settings.hotline && (
          <a className="hdr-hot" href={telHref(settings.hotline)}>
            <span>Tư vấn - đặt hàng</span>
            <strong>{settings.hotline}</strong>
          </a>
        )}
        <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Mở giỏ hàng, ${count} sản phẩm`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.5 11h10L20 7H6.5" /><circle cx="9" cy="20" r="1.4" /><circle cx="17" cy="20" r="1.4" /></svg>
          <span>Giỏ hàng</span>
          <b>{count}</b>
        </button>
      </div>
      <nav className="navbar" aria-label="Điều hướng chính">
        <div className="wrap nav-in">
          <div className="catmenu" ref={catRef}>
            <button type="button" className="catmenu-btn" aria-expanded={catOpen} aria-controls="catlist" onClick={() => setCatOpen((o) => !o)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
              Danh mục sản phẩm
            </button>
            {catOpen && (
              <ul id="catlist">
                {categories.map((c) => (
                  <li key={c.id}><Link href={`/san-pham?danh-muc=${c.slug}`} onClick={() => setCatOpen(false)}><span>{c.name}</span><small>{c.productCount}</small></Link></li>
                ))}
              </ul>
            )}
          </div>
          <ul className="nav-links">
            {links.map((l) => <li key={l.href}><Link href={l.href}>{l.label}</Link></li>)}
          </ul>
        </div>
      </nav>
    </header>
  );
}
