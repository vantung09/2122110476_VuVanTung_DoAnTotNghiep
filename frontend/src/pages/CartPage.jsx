import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

export default function CartPage() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutRef = useRef(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState("home");
  const [paymentError, setPaymentError] = useState("");
  const [momoLoading, setMomoLoading] = useState(false);
  const [momoError, setMomoError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [customer, setCustomer] = useState({
    gender: "Anh",
    name: "",
    phone: "",
    city: "Thành phố Hồ Chí Minh",
    ward: "",
    address: "",
    note: "",
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const resultCode = params.get("resultCode");
    if (!resultCode) return;
    const message = params.get("message") || "";
    if (resultCode === "0") {
      setPaymentStatus({ type: "success", message: "Thanh toán thành công. Hệ thống đang xác nhận." });
    } else {
      setPaymentStatus({
        type: "error",
        message: `Thanh toán thất bại (${message || resultCode}). Vui lòng thử lại.`,
      });
    }
    setShowCheckout(true);
    navigate("/cart", { replace: true });
  }, [location.search, navigate]);

  const handleCheckout = () => {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    setShowCheckout(true);
    setTimeout(() => {
      checkoutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const totalAmount = Math.round(Number(total || 0));
  const isCustomerValid =
    customer.name.trim() &&
    customer.phone.trim() &&
    (deliveryMethod !== "home" ||
      (customer.address.trim() && customer.ward.trim() && customer.city.trim()));

  const handleConfirmPayment = async () => {
    if (!isCustomerValid) {
      setPaymentError("Vui lòng nhập đủ thông tin khách hàng và địa chỉ nhận hàng.");
      return;
    }
    setPaymentError("");
    setMomoError("");
    setMomoLoading(true);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        orderInfo: `Thanh toan don hang ${new Date().toLocaleString()}`,
      };
      const res = await axiosClient.post("/payments/momo/create", payload);
      if (res.data?.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        setMomoError("Không lấy được đường dẫn thanh toán MoMo.");
      }
    } catch (err) {
      setMomoError(err.response?.data?.message || "Không tạo được thanh toán MoMo.");
    } finally {
      setMomoLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="card p-lg">
        Giỏ hàng đang trống. <Link to="/">Quay lại mua sắm</Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-list">
        {items.map((item) => (
          <div key={item.id} className="cart-item card">
            <div className="cart-image">
              <img src={item.imageUrl} alt={item.name} />
            </div>
            <div className="cart-info">
              <h3>{item.name}</h3>
              <p className="muted">{item.category}</p>
              <div className="cart-price">
                <strong>{Number(item.price || 0).toLocaleString()} đ</strong>
                {item.originalPrice ? (
                  <span className="product-old-price">
                    {Number(item.originalPrice).toLocaleString()} đ
                  </span>
                ) : null}
              </div>
            </div>
            <div className="cart-qty">
              <button
                className="qty-btn"
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                className="qty-btn"
                type="button"
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
              >
                +
              </button>
            </div>
            <div className="cart-total">
              <span>{Number((item.price || 0) * item.quantity).toLocaleString()} đ</span>
              <button className="link-danger" type="button" onClick={() => removeFromCart(item.id)}>
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary card">
        <h3>Tổng cộng</h3>
        <p className="summary-row">
          <span>Tạm tính</span>
          <strong>{Number(total).toLocaleString()} đ</strong>
        </p>
        {!user && (
          <p className="muted">Vui lòng đăng nhập hoặc đăng ký để thanh toán.</p>
        )}
        <button className="btn btn-primary btn-block" type="button" onClick={handleCheckout}>
          {user ? "Tiến hành đặt hàng" : "Đăng nhập để thanh toán"}
        </button>
        <button className="btn btn-secondary btn-block" type="button" onClick={clearCart}>
          Xóa giỏ hàng
        </button>
      </div>

      {showCheckout && (
        <section className="checkout-section" ref={checkoutRef}>
          <div className="checkout-grid">
            <div className="checkout-left">
              {paymentStatus ? (
                <div className={paymentStatus.type === "success" ? "success-box" : "error-box"}>
                  {paymentStatus.message}
                </div>
              ) : null}

              <div className="checkout-card">
                <h3>Thông tin đơn hàng</h3>
                <div className="checkout-items">
                  {items.map((item) => (
                    <div key={item.id} className="checkout-item">
                      <img src={item.imageUrl} alt={item.name} />
                      <div className="checkout-item-info">
                        <p className="checkout-item-title">{item.name}</p>
                        <p className="muted">{item.category}</p>
                      </div>
                      <div className="checkout-item-meta">
                        <span>x{item.quantity}</span>
                        <strong>{Number(item.price || 0).toLocaleString()} đ</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="summary-row checkout-total">
                  <span>Tạm tính ({items.length} sản phẩm)</span>
                  <strong>{Number(total).toLocaleString()} đ</strong>
                </div>
              </div>

              <div className="checkout-card">
                <h3>Thông tin khách hàng</h3>
                <div className="checkout-radio">
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="Anh"
                      checked={customer.gender === "Anh"}
                      onChange={handleCustomerChange}
                    />
                    Anh
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="Chị"
                      checked={customer.gender === "Chị"}
                      onChange={handleCustomerChange}
                    />
                    Chị
                  </label>
                </div>
                <div className="checkout-fields">
                  <input
                    name="name"
                    placeholder="Họ và tên"
                    value={customer.name}
                    onChange={handleCustomerChange}
                  />
                  <input
                    name="phone"
                    placeholder="Số điện thoại"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                  />
                </div>
              </div>

              <div className="checkout-card">
                <h3>Chọn hình thức nhận hàng</h3>
                <div className="checkout-radio">
                  <label>
                    <input
                      type="radio"
                      name="delivery"
                      value="home"
                      checked={deliveryMethod === "home"}
                      onChange={() => setDeliveryMethod("home")}
                    />
                    Giao tận nơi
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="delivery"
                      value="store"
                      checked={deliveryMethod === "store"}
                      onChange={() => setDeliveryMethod("store")}
                    />
                    Nhận tại cửa hàng
                  </label>
                </div>
                <div className="checkout-fields">
                  <select name="city" value={customer.city} onChange={handleCustomerChange}>
                    <option>Thành phố Hồ Chí Minh</option>
                    <option>Hà Nội</option>
                    <option>Đà Nẵng</option>
                  </select>
                  <input
                    name="ward"
                    placeholder="Chọn Phường / Xã"
                    value={customer.ward}
                    onChange={handleCustomerChange}
                  />
                  <input
                    name="address"
                    placeholder="Số nhà, tên đường"
                    value={customer.address}
                    onChange={handleCustomerChange}
                    className="field-full"
                  />
                </div>
                <textarea
                  name="note"
                  placeholder="Nhập ghi chú (nếu có)"
                  value={customer.note}
                  onChange={handleCustomerChange}
                />
                <div className="checkout-options">
                  <label>
                    <input type="checkbox" /> Gọi người khác nhận hàng
                  </label>
                  <label>
                    <input type="checkbox" /> Hướng dẫn sử dụng, giải đáp thắc mắc sản phẩm
                  </label>
                  <label>
                    <input type="checkbox" /> Xuất hóa đơn công ty
                  </label>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <div className="checkout-card">
                <h3>Thanh toán MoMo</h3>
                <p className="muted">
                  Nhấn nút bên dưới để chuyển hướng tới trang thanh toán MoMo. Sau khi thanh toán xong,
                  hệ thống sẽ tự xác nhận và đưa bạn về lại web.
                </p>
                <p className="muted">
                  Tổng thanh toán: <strong>{totalAmount.toLocaleString()} đ</strong>
                </p>
                {paymentError ? <div className="error-box">{paymentError}</div> : null}
                {momoError ? <div className="error-box">{momoError}</div> : null}
                <button
                  className="btn btn-primary btn-block"
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={momoLoading}
                >
                  {momoLoading ? "Đang chuyển tới MoMo..." : "Thanh toán bằng MoMo"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
