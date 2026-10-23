import type { Metadata } from 'next';
import Link from 'next/link';
import { getSettings } from '@/lib/api';
import { telHref } from '@/lib/format';
import ContactForm from '@/components/ContactForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Liên hệ' };

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="wrap page">
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span>Liên hệ</span></nav>
      <h1>Liên hệ với {s.site_name}</h1>
      <p className="muted lead">{s.contact_intro}</p>
      <div className="contact-grid">
        <div className="cinfo">
          <h2>Thông tin cửa hàng</h2>
          <dl>
            {s.address && <><dt>Địa chỉ</dt><dd>{s.address}</dd></>}
            {s.hotline && <><dt>Hotline</dt><dd><a href={telHref(s.hotline)}>{s.hotline}</a></dd></>}
            {s.email && <><dt>Email</dt><dd><a href={'mailto:' + s.email}>{s.email}</a></dd></>}
            {s.working_hours && <><dt>Giờ làm việc</dt><dd>{s.working_hours}</dd></>}
          </dl>
        </div>
        <div className="cbox">
          <h2>Gửi tin nhắn</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
