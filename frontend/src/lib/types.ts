export type Category = { id: number; slug: string; name: string; tag: string; hue: number; sortOrder: number; productCount: number };
export type Product = {
  id: number; slug: string; name: string; categoryId: number; categoryName: string; categorySlug: string;
  brand: string; model: string; price: number; oldPrice: number | null; badge: string | null;
  description: string; specs: string[]; imageUrl: string | null; sourceUrl: string | null;
  isActive: boolean; sortOrder: number;
};
export type ProductInput = Omit<Product, 'id' | 'slug' | 'categoryName' | 'categorySlug'>;
export type Banner = {
  id: number; title: string; subtitle: string; imageUrl: string | null; linkUrl: string | null;
  linkText: string | null; sortOrder: number; isActive: boolean;
};
export type PageLink = { slug: string; title: string };
export type ContentPage = { id: number; slug: string; title: string; body: string; showInFooter: boolean; sortOrder: number };
export type Settings = Record<string, string>;
export type Media = { id: number; url: string; originalName: string; size: number; createdAt: string };
export type Message = {
  id: number; name: string; email: string | null; phone: string | null; subject: string | null;
  message: string; isRead: boolean; createdAt: string;
};
