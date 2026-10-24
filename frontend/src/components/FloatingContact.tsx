import { safeHref, telHref } from '@/lib/format';
import type { Settings } from '@/lib/types';

export default function FloatingContact({ settings }: { settings: Settings }) {
  const { zalo_url, facebook_url, hotline } = settings;
  if (!zalo_url && !facebook_url && !hotline) return null;

  return (
    <div className="float-contact" aria-label="Liên hệ nhanh">
      {zalo_url && (
        <a className="fc-zalo" href={safeHref(zalo_url)} target="_blank" rel="noopener noreferrer" aria-label="Chat Zalo" title="Chat Zalo">Zalo</a>
      )}
      {facebook_url && (
        <a className="fc-fb" href={safeHref(facebook_url)} target="_blank" rel="noopener noreferrer" aria-label="Nhắn tin Facebook" title="Facebook">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8V6.5c0-.7.3-1 1-1h2.5V2H14.8C11.9 2 10 3.8 10 6.6V8H7.5v3.5H10V22h4V11.5h2.9L17.5 8H14z" /></svg>
        </a>
      )}
      {hotline && (
        <a className="fc-tel" href={telHref(hotline)} aria-label={`Gọi ${hotline}`} title={`Gọi ${hotline}`}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
        </a>
      )}
    </div>
  );
}
