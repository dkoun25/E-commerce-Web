'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken } from '@/lib/adminApi';

export default function Login() {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr('');
    try {
      const r = await api<{ token: string; expiresAt: string }>('/api/auth/login', {
        method: 'POST', body: { username: String(f.get('username')), password: String(f.get('password')) }
      });
      setToken(r.token, r.expiresAt);
      router.replace('/admin');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Đăng nhập thất bại');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="adm-login" onSubmit={submit}>
      <h1>Đăng nhập quản trị</h1>
      <label className="adm-field"><span className="adm-label">Tên đăng nhập</span><input name="username" required autoComplete="username" /></label>
      <label className="adm-field"><span className="adm-label">Mật khẩu</span><input name="password" type="password" required autoComplete="current-password" /></label>
      {err && <p className="adm-err" role="alert">{err}</p>}
      <button className="adm-btn primary" disabled={busy}>{busy ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
    </form>
  );
}
