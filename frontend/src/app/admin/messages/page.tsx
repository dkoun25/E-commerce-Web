'use client';

import { useState } from 'react';
import { api } from '@/lib/adminApi';
import { useLoad } from '@/lib/useLoad';
import type { Message } from '@/lib/types';

export default function AdminMessages() {
  const { data, error, reload } = useLoad(() => api<Message[]>('/api/admin/messages'));
  const [msg, setMsg] = useState('');

  const run = async (fn: () => Promise<unknown>) => { setMsg(''); try { await fn(); await reload(); } catch (e) { setMsg(e instanceof Error ? e.message : 'Thao tác thất bại'); } };

  return (
    <>
      <h1>Tin nhắn liên hệ</h1>
      {(error || msg) && <p className="adm-err">{error || msg}</p>}
      <div className="adm-msgs">
        {(data ?? []).map((m) => (
          <article key={m.id} className={'adm-msg' + (m.isRead ? '' : ' unread')}>
            <header>
              <strong>{m.name}</strong>
              <span className="adm-muted">{new Date(m.createdAt + (m.createdAt.endsWith('Z') ? '' : 'Z')).toLocaleString('vi-VN')}</span>
            </header>
            <p className="adm-muted">{[m.phone, m.email].filter(Boolean).join(' | ')}{m.subject ? ` | ${m.subject}` : ''}</p>
            <p className="adm-msg-body">{m.message}</p>
            <div className="adm-row">
              <button className="adm-btn" onClick={() => run(() => api(`/api/admin/messages/${m.id}/read?read=${!m.isRead}`, { method: 'PATCH' }))}>{m.isRead ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}</button>
              <button className="adm-btn danger" onClick={() => { if (confirm('Xóa tin nhắn này?')) void run(() => api(`/api/admin/messages/${m.id}`, { method: 'DELETE' })); }}>Xóa</button>
            </div>
          </article>
        ))}
        {data && data.length === 0 && <p className="adm-muted">Chưa có tin nhắn.</p>}
      </div>
    </>
  );
}
