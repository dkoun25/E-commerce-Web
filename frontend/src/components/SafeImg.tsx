'use client';

import { useEffect, useState } from 'react';

export default function SafeImg({ src, alt, eager = false }: { src: string | null; alt: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div className="noimg" role="img" aria-label={`Chưa có ảnh của ${alt}`}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><rect x="14" y="14" width="20" height="20" rx="3" /><path d="M20 8v6M28 8v6M20 34v6M28 34v6M8 20h6M8 28h6M34 20h6M34 28h6" /></svg>
        <span>Chưa có ảnh</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
