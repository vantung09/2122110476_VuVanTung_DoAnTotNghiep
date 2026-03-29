export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <p className="brand-mark">tungZONE</p>
          <p className="muted">
            Cửa hàng điện thoại chính hãng với trải nghiệm mua sắm tối giản, hỗ trợ kỹ thuật trọn đời.
          </p>
        </div>

        <div className="footer-col">
          <h4>Danh mục</h4>
          <a href="#">iPhone</a>
          <a href="#">Samsung</a>
          <a href="#">Xiaomi</a>
          <a href="#">Phụ kiện</a>
        </div>

        <div className="footer-col">
          <h4>Hỗ trợ</h4>
          <a href="#">Tra cứu đơn hàng</a>
          <a href="#">Trung tâm bảo hành</a>
          <a href="#">Chính sách đổi trả</a>
          <a href="#">Liên hệ</a>
        </div>

        <div className="footer-col">
          <h4>Liên hệ nhanh</h4>
          <p>Hotline: 1900 1234</p>
          <p>Email: support@phonelab.vn</p>
          <p>Giờ mở cửa: 8:00 - 22:00</p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 tungZONE. All rights reserved.</span>
      </div>
    </footer>
  );
}
