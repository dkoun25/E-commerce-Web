import { API } from './api';

const TK = 'aura-admin-token';
const EXP = 'aura-admin-exp';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const t = localStorage.getItem(TK);
    const exp = Number(localStorage.getItem(EXP) ?? 0);
    if (!t || !exp || Date.now() > exp) { clearToken(); return null; }
    return t;
  } catch {
    return null;
  }
};
export const setToken = (t: string, expiresAt: string) => {
  localStorage.setItem(TK, t);
  localStorage.setItem(EXP, String(new Date(expiresAt).getTime()));
};
export const clearToken = () => {
  try { localStorage.removeItem(TK); localStorage.removeItem(EXP); } catch { /* ignore */ }
};

type Init = { method?: string; body?: unknown; form?: FormData };

export async function api<T = unknown>(path: string, init: Init = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  let body: BodyInit | undefined;
  if (init.form) body = init.form;
  else if (init.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(init.body); }

  let res: Response;
  try {
    res = await fetch(API + path, { method: init.method ?? 'GET', headers, body, cache: 'no-store' });
  } catch {
    throw new ApiError(0, 'Không kết nối được máy chủ API.');
  }
  if (res.status === 401 && path !== '/api/auth/login') {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/admin/login';
    throw new ApiError(401, 'Phiên đăng nhập đã hết hạn.');
  }
  if (!res.ok) {
    let msg = `Lỗi ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
      else if (j?.errors) msg = String(Object.values(j.errors as Record<string, string[]>)[0]?.[0] ?? msg);
    } catch { /* not json */ }
    if (res.status === 429) msg = 'Thao tác quá nhanh, vui lòng thử lại sau ít phút.';
    throw new ApiError(res.status, msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
