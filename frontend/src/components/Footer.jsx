import { Link } from "react-router-dom";

const FOOTER_COLUMNS = [
  {
    title: "Tổng đài",
    items: [
      { label: "Mua hàng", value: "1900 2121", note: "8:00 - 21:30" },
      { label: "Kỹ thuật", value: "1900 2122", note: "8:00 - 21:00" },
      { label: "Khiếu nại", value: "1900 2123", note: "8:00 - 21:30" },
    ],
  },
  {
    title: "Hệ thống",
    links: [
      { label: "Trang chủ", to: "/" },
      { label: "Giỏ hàng", to: "/cart" },
      { label: "Yêu thích", to: "/favorites" },
      { label: "Đăng nhập", to: "/login" },
    ],
  },
  {
    title: "Hỗ trợ khách hàng",
    links: [
      { label: "Hướng dẫn mua hàng", to: "/" },
      { label: "Chính sách bảo hành", to: "/" },
      { label: "Giao hàng và thanh toán", to: "/cart" },
      { label: "Điều khoản sử dụng", to: "/register" },
    ],
  },
  {
    title: "Về TungZone",
    links: [
      { label: "Giới thiệu cửa hàng", to: "/" },
      { label: "Apple chính hãng", to: "/" },
      { label: "Liên hệ hợp tác", to: "/" },
      { label: "Chính sách riêng tư", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div className="footer-top-row">
          <div className="footer-brand-block">
            <Link to="/" className="footer-wordmark" aria-label="TungZone">
              <span className="footer-wordmark-main">tung</span>
              <span className="footer-wordmark-z">Z</span>
              <span className="footer-wordmark-o">O</span>
              <span className="footer-wordmark-n">N</span>
              <span className="footer-wordmark-e">E</span>
            </Link>
            <p className="footer-brand-copy">
              Hệ thống mua sắm Apple chính hãng với giao hàng toàn quốc và hỗ trợ sau mua rõ ràng.
            </p>
            <div className="footer-brand-meta">
              <span>Apple chính hãng</span>
              <span>Giao hàng toàn quốc</span>
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="footer-col">
              <h4>{column.title}</h4>
              {column.items ? (
                <div className="footer-hotlines">
                  {column.items.map((item) => (
                    <div key={item.label} className="footer-hotline-item">
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                      <small>{item.note}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="footer-links">
                  {column.links.map((item) => (
                    <Link key={item.label} to={item.to}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© 2026 TungZone. Mọi quyền được bảo lưu.</p>
        </div>
      </div>
    </footer>
  );
}
