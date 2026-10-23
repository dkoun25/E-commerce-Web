import Link from 'next/link';
import { telHref, safeHref } from '@/lib/format';
import type { Category, PageLink, Settings } from '@/lib/types';

export default function Footer({ settings, categories, pages }: { settings: Settings; categories: Category[]; pages: PageLink[] }) {
  const social = [
    { label: 'Facebook', url: settings.facebook_url },
    { label: 'Zalo', url: settings.zalo_url },
    { label: 'YouTube', url: settings.youtube_url }
  ].filter((s) => s.url);

  return (
    <footer className="footer">
      <div className="wrap fgrid">
        <div>
          <h3>{settings.site_name}</h3>
          <p>{settings.footer_about}</p>
          {social.length > 0 && (
            <ul className="social">
              {social.map((s) => <li key={s.label}><a href={safeHref(s.url)} target="_blank" rel="noopener noreferrer">{s.label}</a></li>)}
            </ul>
          )}
        </div>
        <div>
          <h3>Chính sách và hỗ trợ</h3>
          <ul>
            {pages.map((p) => <li key={p.slug}><Link href={`/trang/${p.slug}`}>{p.title}</Link></li>)}
            <li><Link href="/lien-he">Liên hệ</Link></li>
          </ul>
        </div>
        <div>
          <h3>Danh mục</h3>
          <ul>
            {categories.map((c) => <li key={c.id}><Link href={`/san-pham?danh-muc=${c.slug}`}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3>Thông tin liên hệ</h3>
          <ul className="contact-list">
            {settings.address && <li><span>Địa chỉ</span>{settings.address}</li>}
            {settings.hotline && <li><span>Hotline</span><a href={telHref(settings.hotline)}>{settings.hotline}</a></li>}
            {settings.email && <li><span>Email</span><a href={'mailto:' + settings.email}>{settings.email}</a></li>}
            {settings.working_hours && <li><span>Giờ làm việc</span>{settings.working_hours}</li>}
          </ul>
        </div>
      </div>
      <div className="copy"><div className="wrap">{settings.copyright}</div></div>
    </footer>
  );
}
