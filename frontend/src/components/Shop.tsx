'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { API, imgSrc } from '@/lib/api';
import { money } from '@/lib/format';
import SafeImg from './SafeImg';

export type CartLine = { id: number; slug: string; name: string; price: number; imageUrl: string | null; qty: number };
type Snapshot = Omit<CartLine, 'qty'>;
type Toast = { id: number; text: string; type: 'ok' | 'err' };

type Ctx = {
  lines: CartLine[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (p: Snapshot, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
  toast: (text: string, type?: 'ok' | 'err') => void;
};

const ShopCtx = createContext<Ctx | null>(null);
const KEY = 'aura-tech-cart-v2';
const MAX = 99;

export const useShop = () => {
  const c = useContext(ShopCtx);
  if (!c) throw new Error('useShop must be used inside ShopProvider');
  return c;
};

function readStorage(): CartLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((l) => l && Number.isInteger(l.id) && typeof l.name === 'string' && typeof l.price === 'number' && Number.isInteger(l.qty) && l.qty > 0)
      .map((l) => ({ id: l.id, slug: String(l.slug ?? ''), name: l.name, price: l.price, imageUrl: typeof l.imageUrl === 'string' ? l.imageUrl : null, qty: Math.min(l.qty, MAX) }));
  } catch {
    return [];
  }
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    setLines(readStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage unavailable */ }
  }, [lines, ready]);

  const toast = useCallback((text: string, type: 'ok' | 'err' = 'ok') => {
    const id = ++seq.current;
    setToasts((t) => [...t.slice(-2), { id, text, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const add = useCallback((p: Snapshot, qty = 1) => {
    setLines((cur) => {
      const found = cur.find((l) => l.id === p.id);
      if (found) return cur.map((l) => (l.id === p.id ? { ...l, ...p, qty: Math.min(l.qty + qty, MAX) } : l));
      return [...cur, { ...p, qty: Math.min(qty, MAX) }];
    });
    toast(`Đã thêm "${p.name}" vào giỏ hàng.`);
  }, [toast]);

  const setQty = useCallback((id: number, qty: number) => {
    setLines((cur) => (qty < 1 ? cur.filter((l) => l.id !== id) : cur.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, MAX) } : l))));
  }, []);
  const remove = useCallback((id: number) => setLines((cur) => cur.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<Ctx>(() => ({
    lines, open, setOpen, add, setQty, remove, clear, toast,
    count: lines.reduce((s, l) => s + l.qty, 0),
    total: lines.reduce((s, l) => s + l.qty * l.price, 0)
  }), [lines, open, add, setQty, remove, clear, toast]);

  return (
    <ShopCtx.Provider value={value}>
      {children}
      <CartDrawer />
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={'toast ' + t.type}>{t.text}</div>)}
      </div>
    </ShopCtx.Provider>
  );
}

function CartDrawer() {
  const { lines, total, open, setOpen, setQty, remove, clear, toast } = useShop();
  const [step, setStep] = useState<'cart' | 'form' | 'done'>('cart');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      setTimeout(() => closeRef.current?.focus(), 30);
    } else {
      document.body.style.overflow = '';
      setStep((s) => (s === 'done' ? 'cart' : s));
      lastFocus.current?.focus?.();
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy || lines.length === 0) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') ?? '').trim();
    const phone = String(f.get('phone') ?? '').trim();
    const address = String(f.get('address') ?? '').trim();
    const note = String(f.get('note') ?? '').trim();
    const hp = String(f.get('website') ?? '');
    const body = [
      'YÊU CẦU ĐẶT HÀNG',
      ...lines.map((l) => `- ${l.name} x ${l.qty} = ${money(l.price * l.qty)}`),
      `Tạm tính: ${money(total)}`,
      address && `Địa chỉ nhận hàng: ${address}`,
      note && `Ghi chú: ${note}`
    ].filter(Boolean).join('\n').slice(0, 3000);
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(API + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, subject: 'Yêu cầu đặt hàng', message: body, website: hp })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErr(res.status === 429 ? 'Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút.' : j?.message ?? 'Không gửi được yêu cầu, vui lòng thử lại.');
        return;
      }
      clear();
      setStep('done');
    } catch {
      setErr('Không kết nối được máy chủ, vui lòng thử lại.');
      toast('Không kết nối được máy chủ.', 'err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className={'overlay' + (open ? ' open' : '')} onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className={'drawer' + (open ? ' open' : '')} role="dialog" aria-modal="true" aria-label="Giỏ hàng" aria-hidden={!open}>
        <header className="drawer-head">
          <h2>{step === 'form' ? 'Thông tin đặt hàng' : 'Giỏ hàng'}</h2>
          <button ref={closeRef} className="icon-btn" onClick={() => setOpen(false)} aria-label="Đóng giỏ hàng">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>

        {step === 'done' && (
          <div className="drawer-empty">
            <h3>Đã gửi yêu cầu đặt hàng</h3>
            <p>Nhân viên sẽ liên hệ qua số điện thoại bạn cung cấp để xác nhận đơn và hình thức giao hàng, thanh toán.</p>
            <button className="btn" onClick={() => { setOpen(false); setStep('cart'); }}>Tiếp tục mua sắm</button>
          </div>
        )}

        {step !== 'done' && lines.length === 0 && (
          <div className="drawer-empty">
            <p>Giỏ hàng đang trống.</p>
            <button className="btn" onClick={() => setOpen(false)}>Tiếp tục mua sắm</button>
          </div>
        )}

        {step === 'cart' && lines.length > 0 && (
          <>
            <ul className="cart-list">
              {lines.map((l) => (
                <li key={l.id} className="cart-item">
                  <SafeImg src={imgSrc(l.imageUrl)} alt={l.name} />
                  <div>
                    <Link href={'/san-pham/' + l.slug} onClick={() => setOpen(false)}>{l.name}</Link>
                    <p className="unit">{money(l.price)}</p>
                    <div className="qty">
                      <button onClick={() => setQty(l.id, l.qty - 1)} aria-label="Giảm số lượng">−</button>
                      <span aria-live="polite">{l.qty}</span>
                      <button onClick={() => setQty(l.id, l.qty + 1)} aria-label="Tăng số lượng">+</button>
                    </div>
                  </div>
                  <button className="icon-btn" onClick={() => remove(l.id)} aria-label={`Xóa ${l.name} khỏi giỏ`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </li>
              ))}
            </ul>
            <footer className="drawer-foot">
              <div className="total"><span>Tạm tính</span><strong>{money(total)}</strong></div>
              <button className="btn primary block" onClick={() => setStep('form')}>Đặt hàng</button>
            </footer>
          </>
        )}

        {step === 'form' && lines.length > 0 && (
          <form className="drawer-form" onSubmit={submit}>
            <p className="muted">Gửi yêu cầu để nhân viên liên hệ xác nhận đơn. Chưa thanh toán online ở bước này.</p>
            <label>Họ và tên *<input name="name" required maxLength={100} autoComplete="name" /></label>
            <label>Số điện thoại *<input name="phone" required inputMode="tel" pattern="[0-9+\s().\-]{8,20}" title="Nhập số điện thoại hợp lệ" autoComplete="tel" /></label>
            <label>Địa chỉ nhận hàng<input name="address" maxLength={200} autoComplete="street-address" /></label>
            <label>Ghi chú<textarea name="note" rows={3} maxLength={500} /></label>
            <input name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            {err && <p className="form-err" role="alert">{err}</p>}
            <div className="total"><span>Tạm tính</span><strong>{money(total)}</strong></div>
            <button className="btn primary block" disabled={busy}>{busy ? 'Đang gửi...' : 'Gửi yêu cầu đặt hàng'}</button>
            <button type="button" className="btn block" onClick={() => setStep('cart')}>Quay lại giỏ hàng</button>
          </form>
        )}
      </aside>
    </>
  );
}
