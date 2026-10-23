import { getCategories, getPageLinks, getSettings } from '@/lib/api';
import { ShopProvider } from '@/components/Shop';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, pages] = await Promise.all([getSettings(), getCategories(), getPageLinks()]);
  return (
    <ShopProvider>
      <a className="skip" href="#main">Bỏ qua điều hướng</a>
      <Header settings={settings} categories={categories} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} pages={pages} />
    </ShopProvider>
  );
}
