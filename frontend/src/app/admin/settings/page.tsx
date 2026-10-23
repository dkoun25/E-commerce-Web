'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/adminApi';
import ImageField from '@/components/admin/ImageField';
import type { Settings } from '@/lib/types';

const FIELDS: { key: string; label: string; long?: boolean }[] = [
  { key: 'hero_eyebrow', label: 'Trang chủ: dòng nhỏ phía trên tiêu đề' },
  { key: 'hero_title', label: 'Trang chủ: tiêu đề dòng 1' },
  { key: 'hero_highlight', label: 'Trang chủ: tiêu đề dòng 2 (màu nhấn)' },
  { key: 'hero_lead', label: 'Trang chủ: đoạn giới thiệu', long: true },
  { key: 'hero_tag1', label: 'Trang chủ: nhãn nổi 1' },
  { key: 'hero_tag2', label: 'Trang chủ: nhãn nổi 2' },
  { key: 'hero_tag3', label: 'Trang chủ: nhãn nổi 3' },
  { key: 'about_text', label: 'Mục Về chúng tôi (trang chủ)', long: true },
  { key: 'site_name', label: 'Tên website / cửa hàng' },
  { key: 'tagline', label: 'Khẩu hiệu' },
  { key: 'announcement', label: 'Thông báo trên cùng' },
  { key: 'hotline', label: 'Hotline' },
  { key: 'email', label: 'Email liên hệ' },
  { key: 'address', label: 'Địa chỉ' },
  { key: 'working_hours', label: 'Giờ làm việc' },
  { key: 'facebook_url', label: 'Liên kết Facebook (https://...)' },
  { key: 'zalo_url', label: 'Liên kết Zalo (https://...)' },
  { key: 'youtube_url', label: 'Liên kết YouTube (https://...)' },
  { key: 'footer_about', label: 'Giới thiệu ngắn ở chân trang', long: true },
  { key: 'contact_intro', label: 'Lời dẫn ở form liên hệ', long: true },
  { key: 'copyright', label: 'Dòng bản quyền' }
];

export default function AdminSettings() {
  const [v, setV] = useState<Settings | null>(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => { api<Settings>('/api/admin/settings').then(setV).catch((e) => setErr(e.message)); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!v) return;
    setBusy(true); setMsg(''); setErr('');
    try { await api('/api/admin/settings', { method: 'PUT', body: v }); setMsg('Đã lưu.'); } catch (e2) { setErr(e2 instanceof Error ? e2.message : 'Lưu thất bại'); } finally { setBusy(false); }
  }

  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg('');
    try {
      await api('/api/admin/password', { method: 'POST', body: { current: pw.current, new: pw.next } });
      setPw({ current: '', next: '' });
      setPwMsg('Đã đổi mật khẩu.');
    } catch (e2) { setPwMsg(e2 instanceof Error ? e2.message : 'Đổi mật khẩu thất bại'); }
  }

  return (
    <>
      <h1>Cài đặt website</h1>
      {err && <p className="adm-err">{err}</p>}
      {v && (
        <form className="adm-form" onSubmit={save}>
          <ImageField label="Ảnh hero trang chủ (để trống sẽ dùng hình chip mặc định)" value={v.hero_image ?? ''} onChange={(x) => setV({ ...v, hero_image: x })} />
          {FIELDS.map((f) => (
            <label key={f.key} className="adm-field"><span className="adm-label">{f.label}</span>
              {f.long ? <textarea rows={3} maxLength={2000} value={v[f.key] ?? ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
                : <input maxLength={2000} value={v[f.key] ?? ''} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
            </label>
          ))}
          <div className="adm-row"><button className="adm-btn primary" disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu cài đặt'}</button>{msg && <span className="adm-ok">{msg}</span>}</div>
        </form>
      )}
      <form className="adm-form adm-panel" onSubmit={changePw}>
        <h2>Đổi mật khẩu quản trị</h2>
        <label className="adm-field"><span className="adm-label">Mật khẩu hiện tại</span><input type="password" required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></label>
        <label className="adm-field"><span className="adm-label">Mật khẩu mới (tối thiểu 8 ký tự)</span><input type="password" required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></label>
        <div className="adm-row"><button className="adm-btn primary">Đổi mật khẩu</button>{pwMsg && <span className="adm-ok">{pwMsg}</span>}</div>
      </form>
    </>
  );
}
