import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useCoupon } from "../contexts/CouponContext";
import CouponInput from "../components/CouponInput";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

const MOMO_MAX_AMOUNT_VND = 50000000;
const HCMC_DELIVERY_CITY = "Thành phố Hồ Chí Minh";
const HCMC_DISTRICTS = [
  "Quận 1",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Quận Bình Tân",
  "Quận Bình Thạnh",
  "Quận Gò Vấp",
  "Quận Phú Nhuận",
  "Quận Tân Bình",
  "Quận Tân Phú",
  "Thành phố Thủ Đức",
  "Huyện Bình Chánh",
  "Huyện Cần Giờ",
  "Huyện Củ Chi",
  "Huyện Hóc Môn",
  "Huyện Nhà Bè",
];
const VIETNAM_PHONE_PATTERN = /^0\d{9}$/;

function normalizeCustomerName(value) {
  const sanitized = value
    .replace(/[^A-Za-zÀ-ỹ\s]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^\s+/, "")
    .slice(0, 60);

  return sanitized
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

function normalizeSingleLine(value, maxLength = 120) {
  return value.replace(/\s+/g, " ").replace(/^\s+/, "").slice(0, maxLength);
}

function extractPhoneDigits(value) {
  return value.replace(/\D/g, "");
}

function extractApiErrorMessage(data) {
  if (typeof data === "string") {
    const raw = data.trim();
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.message) return parsed.message;
    } catch (_) {
      // ignore parse error
    }

    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      try {
        const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
        if (parsed?.message) return parsed.message;
      } catch (_) {
        // ignore parse error
      }
    }

    const messageMatch = raw.match(/"message"\s*:\s*"([^"]+)"/);
    if (messageMatch?.[1]) {
      return messageMatch[1];
    }
    return raw;
  }

  if (data && typeof data === "object") {
    return data.message || data.error || data.detail || "";
  }

  return "";
}

export default function CartPage() {
  const { items, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const { calculateDiscount, appliedCoupon, recordUsage } = useCoupon();
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
    city: HCMC_DELIVERY_CITY,
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
      setPaymentStatus({ type: "success", message: "Thanh toán thành công. Hệ thống đang xác nhận đơn hàng của bạn." });
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
    let nextValue = value;

    if (name === "name") {
      nextValue = normalizeCustomerName(value);
    } else if (name === "phone") {
      nextValue = formatPhoneNumber(value);
    } else if (name === "address") {
      nextValue = normalizeSingleLine(value);
    } else if (name === "note") {
      nextValue = value.slice(0, 250);
    }

    setCustomer((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleCustomerBlur = (event) => {
    const { name, value } = event.target;

    if (name === "address") {
      setCustomer((prev) => ({ ...prev, address: value.trim() }));
    }

    if (name === "note") {
      setCustomer((prev) => ({ ...prev, note: value.trim() }));
    }
  };

  const totalAmount = Math.round(Number(total || 0));
  const couponDiscount = calculateDiscount(totalAmount);
  const finalAmount = Math.max(0, totalAmount - couponDiscount);
  const phoneDigits = extractPhoneDigits(customer.phone);
  const isNameValid = customer.name.trim().length >= 2;
  const isPhoneValid = VIETNAM_PHONE_PATTERN.test(phoneDigits);
  const isHomeDeliveryComplete =
    deliveryMethod !== "home" ||
    (customer.address.trim() && customer.ward.trim() && customer.city.trim());
  const isCustomerValid =
    isNameValid &&
    isPhoneValid &&
    isHomeDeliveryComplete;

  const handleConfirmPayment = async () => {
    if (!isNameValid) {
      setPaymentError("Vui lòng nhập họ tên hợp lệ, tối thiểu 2 ký tự.");
      return;
    }
    if (!isPhoneValid) {
      setPaymentError("Số điện thoại phải gồm 10 số và bắt đầu bằng số 0.");
      return;
    }
    if (deliveryMethod === "home" && !customer.ward.trim()) {
      setPaymentError("Vui lòng chọn quận/huyện nhận hàng tại TP.HCM.");
      return;
    }
    if (deliveryMethod === "home" && !customer.address.trim()) {
      setPaymentError("Vui lòng nhập số nhà và tên đường để giao tận nơi.");
      return;
    }
    if (totalAmount > MOMO_MAX_AMOUNT_VND) {
      setPaymentError(
        `MoMo chỉ hỗ trợ tối đa ${MOMO_MAX_AMOUNT_VND.toLocaleString("vi-VN")} đ mỗi giao dịch.`
      );
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
        customerEmail: user?.email || "",
      };

      const res = await axiosClient.post("/payments/momo/create", payload);
      if (res.data?.payUrl) {
        window.location.href = res.data.payUrl;
      } else {
        setMomoError("Không lấy được đường dẫn thanh toán MoMo.");
      }
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 401) {
        setMomoError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login", { state: { from: "/cart" } });
        return;
      }

      let backendMessage = extractApiErrorMessage(data);

      if (!backendMessage && !err?.response) {
        backendMessage = "Không kết nối được máy chủ thanh toán. Vui lòng kiểm tra backend.";
      }

      setMomoError(backendMessage || "Không tạo được thanh toán MoMo.");
    } finally {
      setMomoLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="storefront-section-panel storefront-empty">
        <h2>Giỏ hàng đang trống</h2>
        <p>Hãy thêm sản phẩm vào giỏ để tiếp tục mua sắm.</p>
        <Link to="/">Quay lại mua sắm</Link>
      </section>
    );
  }

  return (
    <div className="storefront-stack">
      <section className="storefront-section-panel">
        <div className="storefront-heading-row">
          <div>
            <h1 className="storefront-panel-title">Giỏ hàng</h1>
          </div>
          <span className="storefront-count-badge">{items.length} sản phẩm</span>
        </div>

        <div className="cart-page">
          <div className="cart-list">
            {items.map((item) => (
              <article key={item.id} className="cart-item card">
                <div className="cart-image">
                  <img
                    src={getProductImageUrl(item)}
                    alt={item.name}
                    onError={(event) => handleProductImageError(event, item)}
                  />
                </div>

                <div className="cart-info">
                  <p className="favorite-category">{item.category}</p>
                  <h3>{item.name}</h3>
                  <div className="cart-price">
                    <strong>{Number(item.price || 0).toLocaleString("vi-VN")} đ</strong>
                    {item.originalPrice ? (
                      <span className="product-old-price">
                        {Number(item.originalPrice).toLocaleString("vi-VN")} đ
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="cart-qty">
                  <button className="qty-btn" type="button" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button className="qty-btn" type="button" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                </div>

                <div className="cart-total">
                  <strong>{Number((item.price || 0) * item.quantity).toLocaleString("vi-VN")} đ</strong>
                  <button className="link-danger" type="button" onClick={() => removeFromCart(item.id)}>
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary card">
            <h3>Tóm tắt đơn hàng</h3>
            <p className="summary-row">
              <span>Tạm tính</span>
              <strong>{Number(total).toLocaleString("vi-VN")} đ</strong>
            </p>
            {couponDiscount > 0 ? (
              <p className="summary-row coupon-discount-row">
                <span>Giảm giá ({appliedCoupon?.code})</span>
                <strong>-{couponDiscount.toLocaleString("vi-VN")} đ</strong>
              </p>
            ) : null}
            {couponDiscount > 0 ? (
              <p className="summary-row">
                <span>Tổng thanh toán</span>
                <strong>{finalAmount.toLocaleString("vi-VN")} đ</strong>
              </p>
            ) : null}
            <CouponInput orderAmount={totalAmount} />
            {!user ? <p className="muted">Đăng nhập để tiếp tục thanh toán.</p> : null}
            <button className="btn btn-primary btn-block" type="button" onClick={handleCheckout}>
              {user ? "Tiến hành đặt hàng" : "Đăng nhập để thanh toán"}
            </button>
            <button className="btn btn-secondary btn-block" type="button" onClick={clearCart}>
              Xóa giỏ hàng
            </button>
          </aside>
        </div>
      </section>

      {showCheckout ? (
        <section className="storefront-section-panel checkout-section" ref={checkoutRef}>
          <div className="storefront-heading-row">
            <div>
              <h2 className="storefront-panel-title">Thông tin đặt hàng</h2>
            </div>
            <span className="storefront-count-badge">{totalAmount.toLocaleString("vi-VN")} đ</span>
          </div>

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
                      <img
                        src={getProductImageUrl(item)}
                        alt={item.name}
                        onError={(event) => handleProductImageError(event, item)}
                      />
                      <div className="checkout-item-info">
                        <p className="checkout-item-title">{item.name}</p>
                        <p className="muted">{item.category}</p>
                      </div>
                      <div className="checkout-item-meta">
                        <span>x{item.quantity}</span>
                        <strong>{Number(item.price || 0).toLocaleString("vi-VN")} đ</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="summary-row checkout-total">
                  <span>Tạm tính ({items.length} sản phẩm)</span>
                  <strong>{Number(total).toLocaleString("vi-VN")} đ</strong>
                </div>
              </div>

              <div className="checkout-card">
                <h3>Thông tin khách hàng</h3>
                <div className="checkout-radio">
                  <label>
                    <input type="radio" name="gender" value="Anh" checked={customer.gender === "Anh"} onChange={handleCustomerChange} />
                    Anh
                  </label>
                  <label>
                    <input type="radio" name="gender" value="Chị" checked={customer.gender === "Chị"} onChange={handleCustomerChange} />
                    Chị
                  </label>
                </div>
                <div className="checkout-fields">
                  <input
                    name="name"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    onBlur={handleCustomerBlur}
                    autoComplete="name"
                  />
                  <input
                    name="phone"
                    placeholder="0901 234 567"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={12}
                  />
                </div>
              </div>

              <div className="checkout-card">
                <h3>Chọn hình thức nhận hàng</h3>
                <div className="checkout-radio">
                  <label>
                    <input type="radio" name="delivery" value="home" checked={deliveryMethod === "home"} onChange={() => setDeliveryMethod("home")} />
                    Giao tận nơi
                  </label>
                  <label>
                    <input type="radio" name="delivery" value="store" checked={deliveryMethod === "store"} onChange={() => setDeliveryMethod("store")} />
                    Nhận tại cửa hàng
                  </label>
                </div>
                <div className="checkout-fields">
                  <select name="city" value={customer.city} onChange={handleCustomerChange} disabled>
                    <option>{HCMC_DELIVERY_CITY}</option>
                  </select>
                  <select name="ward" value={customer.ward} onChange={handleCustomerChange}>
                    <option value="">Chọn Quận / Huyện / TP Thủ Đức</option>
                    {HCMC_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                  <input
                    name="address"
                    placeholder="Số nhà, tên đường"
                    value={customer.address}
                    onChange={handleCustomerChange}
                    onBlur={handleCustomerBlur}
                    className="field-full"
                    autoComplete="street-address"
                  />
                </div>
                <textarea
                  name="note"
                  placeholder="Nhập ghi chú (nếu có)"
                  value={customer.note}
                  onChange={handleCustomerChange}
                  onBlur={handleCustomerBlur}
                />
                <div className="checkout-options">
                  <label><input type="checkbox" /> Gọi người khác nhận hàng</label>
                  <label><input type="checkbox" /> Hướng dẫn sử dụng và giải đáp thắc mắc sản phẩm</label>
                  <label><input type="checkbox" /> Xuất hóa đơn công ty</label>
                </div>
              </div>
            </div>

            <div className="checkout-right">
              <div className="checkout-card">
                <h3>Thanh toán MoMo</h3>
                <p className="muted">
                  Nhấn nút bên dưới để chuyển sang MoMo. Sau khi thanh toán xong, hệ thống sẽ đưa bạn trở về lại trang web.
                </p>
                <p className="muted">
                  Tổng thanh toán: <strong>{totalAmount.toLocaleString("vi-VN")} đ</strong>
                </p>
                {paymentError ? <div className="error-box">{paymentError}</div> : null}
                {momoError ? <div className="error-box">{momoError}</div> : null}
                <button className="btn btn-primary btn-block" type="button" onClick={handleConfirmPayment} disabled={momoLoading}>
                  {momoLoading ? "Đang chuyển tới MoMo..." : "Thanh toán bằng MoMo"}
                </button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
