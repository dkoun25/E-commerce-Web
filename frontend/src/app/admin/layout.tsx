import type { Metadata } from 'next';
import AdminShell from '@/components/admin/AdminShell';
// @ts-ignore - CSS imports are handled by Next.js
import './admin.css';

export const metadata: Metadata = { title: 'Quản trị', robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
