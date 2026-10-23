import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap page">
      <div className="empty">
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn mở không tồn tại hoặc đã được di chuyển.</p>
        <Link className="btn primary" href="/">Về trang chủ</Link>
      </div>
    </div>
  );
}
