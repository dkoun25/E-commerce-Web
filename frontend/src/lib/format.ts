export const money = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + ' ₫';
export const discount = (price: number, old: number | null) => (old && old > price ? Math.round((1 - price / old) * 100) : 0);
export const telHref = (s: string) => 'tel:' + s.replace(/[^0-9+]/g, '');
export const safeHref = (u: string) => (/^(https?:\/\/|\/(?!\/))/.test(u) ? u : '#');
