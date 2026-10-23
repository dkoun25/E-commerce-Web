'use client';

import { useState } from 'react';
import { API } from '@/lib/api';

export default function ContactForm({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'ok'>('idle');
  const [err, setErr] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === 'busy') return;
    const form = e.currentTarget;
    const f = new FormData(form);
    setState('busy');
    setErr('');
    try {
      const res = await fetch(API + '/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(f.get('name') ?? '').trim(),
          phone: String(f.get('phone') ?? '').trim(),
          email: String(f.get('email') ?? '').trim() || null,
          subject: String(f.get('subject') ?? '').trim() || null,
          message: String(f.get('message') ?? '').trim(),
          website: String(f.get('website') ?? '')
        })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErr(res.status === 429 ? 'Bạn gửi quá nhiều lần, vui lòng thử lại sau ít phút.' : j?.message ?? 'Thông tin chưa hợp lệ, vui lòng kiểm tra lại.');
        setState('idle');
        return;
      }
      form.reset();
      setState('ok');
    } catch {
      setErr('Không kết nối được máy chủ, vui lòng thử lại sau.');
      setState('idle');
    }
  }

  if (state === 'ok') {
    return (
      <div className="form-ok" role="status">
        <h3>Đã gửi thông tin</h3>
        <p>Cảm ơn bạn. Nhân viên sẽ liên hệ lại trong thời gian sớm nhất.</p>
        <button className="btn" onClick={() => setState('idle')}>Gửi thêm yêu cầu</button>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={onSubmit}>
      <div className="row2">
        <label>Họ và tên *<input name="name" required maxLength={100} autoComplete="name" /></label>
        <label>Số điện thoại<input name="phone" inputMode="tel" pattern="[0-9+\s().\-]{8,20}" title="Nhập số điện thoại hợp lệ" autoComplete="tel" /></label>
      </div>
      <div className="row2">
        <label>Email<input name="email" type="email" maxLength={120} autoComplete="email" /></label>
        {!compact && <label>Chủ đề<input name="subject" maxLength={120} placeholder="Tư vấn cấu hình, bảo hành..." /></label>}
      </div>
      <label>Nội dung *<textarea name="message" required minLength={5} maxLength={3000} rows={compact ? 4 : 6} /></label>
      <input name="website" className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <p className="hint">Vui lòng nhập số điện thoại hoặc email để chúng tôi liên hệ lại.</p>
      {err && <p className="form-err" role="alert">{err}</p>}
      <button className="btn primary" disabled={state === 'busy'}>{state === 'busy' ? 'Đang gửi...' : 'Gửi thông tin'}</button>
    </form>
  );
}
