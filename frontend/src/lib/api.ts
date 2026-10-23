import type { Banner, Category, ContentPage, PageLink, Product, Settings } from './types';

export const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5080').replace(/\/$/, '');

export const imgSrc = (u?: string | null): string | null => {
  if (!u) return null;
  return u.startsWith('/') ? API + u : u;
};

export const DEFAULT_SETTINGS: Settings = {
  site_name: 'Aura Tech',
  tagline: 'Linh kiện máy tính chính hãng',
  announcement: '',
  hotline: '',
  email: '',
  address: '',
  working_hours: '',
  facebook_url: '',
  zalo_url: '',
  youtube_url: '',
  footer_about: '',
  contact_intro: 'Gửi thông tin cho chúng tôi, nhân viên sẽ liên hệ lại sớm nhất.',
  copyright: '© Aura Tech',
  hero_eyebrow: 'Aura Tech - linh kiện máy tính',
  hero_title: 'Xung nhịp chuẩn,',
  hero_highlight: 'từng chi tiết.',
  hero_lead: '',
  hero_tag1: '',
  hero_tag2: '',
  hero_tag3: '',
  hero_image: '',
  about_text: ''
};

async function get<T>(path: string): Promise<T> {
  const res = await fetch(API + path, { cache: 'no-store' });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json() as Promise<T>;
}

async function safe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await get<T>(path);
  } catch {
    return fallback;
  }
}

export const getSettings = async (): Promise<Settings> => ({ ...DEFAULT_SETTINGS, ...(await safe<Settings>('/api/settings', {})) });
export const getCategories = () => safe<Category[]>('/api/categories', []);
export const getBanners = () => safe<Banner[]>('/api/banners', []);
export const getPageLinks = () => safe<PageLink[]>('/api/pages', []);

export async function getProducts(params: Record<string, string | number | boolean | undefined> = {}): Promise<{ items: Product[]; failed: boolean }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '' && v !== false) qs.set(k, String(v)); });
  try {
    return { items: await get<Product[]>('/api/products?' + qs.toString()), failed: false };
  } catch {
    return { items: [], failed: true };
  }
}

export async function getProduct(slug: string): Promise<Product | null> {
  try {
    return await get<Product>('/api/products/' + encodeURIComponent(slug));
  } catch {
    return null;
  }
}

export async function getPage(slug: string): Promise<ContentPage | null> {
  try {
    return await get<ContentPage>('/api/pages/' + encodeURIComponent(slug));
  } catch {
    return null;
  }
}
