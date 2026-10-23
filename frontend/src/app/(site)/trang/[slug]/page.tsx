import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPage } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPage(params.slug);
  return { title: p ? p.title : 'Không tìm thấy trang' };
}

export default async function ContentPage({ params }: { params: { slug: string } }) {
  const p = await getPage(params.slug);
  if (!p) notFound();
  const paragraphs = p.body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
  return (
    <div className="wrap page narrow">
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/">Trang chủ</Link><span>/</span><span>{p.title}</span></nav>
      <article className="prose">
        <h1>{p.title}</h1>
        {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
      </article>
    </div>
  );
}
