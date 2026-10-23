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
  setBusy(true);
  setErr('');

  try {
    const r = await api<Record<string, unknown>>('/api/auth/login', {
      method: 'POST',
      body: {
        username: String(f.get('username')),
        password: String(f.get('password')),
      },
    });

    // Kiểm tra phản hồi API, không in mật khẩu hoặc token ra Console
    console.log('Login response fields:', Object.keys(r));
    console.log('Has token:', typeof r.token === 'string' && !!r.token);
    console.log('ExpiresAt:', r.expiresAt);

    if (typeof r.token !== 'string' || !r.token) {
      throw new Error('API đăng nhập không trả về token hợp lệ.');
    }

    if (typeof r.expiresAt !== 'string' || !Number.isFinite(Date.parse(r.expiresAt))) {
      throw new Error('Thời hạn token không hợp lệ. Cần kiểm tra phản hồi API.');
    }

    setToken(r.token, r.expiresAt);
    console.log('Token saved:', !!localStorage.getItem('aura-admin-token'));
    console.log('Expiry saved:', localStorage.getItem('aura-admin-exp'));

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
