'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { imgSrc } from '@/lib/api';
import { safeHref } from '@/lib/format';
import type { Banner } from '@/lib/types';

export default function HeroSlider({ banners }: { banners: Banner[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;

  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, paused]);

  if (n === 0) return null;

  return (
    <section className="hero" aria-roledescription="carousel" aria-label="Banner nổi bật"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      {banners.map((b, k) => {
        const src = imgSrc(b.imageUrl);
        return (
          <div key={b.id} className={'slide' + (k === i ? ' on' : '') + (src ? ' has-img' : '')} aria-hidden={k !== i} role="group" aria-label={`${k + 1} / ${n}`}>
            {src && <img src={src} alt="" loading={k === 0 ? 'eager' : 'lazy'} referrerPolicy="no-referrer" />}
            <div className="slide-txt">
              <h2>{b.title}</h2>
              {b.subtitle && <p>{b.subtitle}</p>}
              {b.linkUrl && <Link href={safeHref(b.linkUrl)} className="btn primary" tabIndex={k === i ? 0 : -1}>{b.linkText || 'Xem thêm'}</Link>}
            </div>
          </div>
        );
      })}
      {n > 1 && (
        <div className="dots">
          {banners.map((b, k) => (
            <button key={b.id} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Banner ${k + 1}`} aria-current={k === i} />
          ))}
        </div>
      )}
    </section>
  );
}
