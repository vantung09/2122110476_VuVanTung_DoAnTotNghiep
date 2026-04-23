import { useState } from "react";
import { useCoupon } from "../contexts/CouponContext";

export default function CouponInput({ orderAmount }) {
  const { appliedCoupon, couponError, applyCoupon, removeCoupon, calculateDiscount } = useCoupon();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    await applyCoupon(code, orderAmount);
    setLoading(false);
  };

  const discount = calculateDiscount(orderAmount);

  if (appliedCoupon) {
    return (
      <div className="coupon-applied">
        <div className="coupon-applied-info">
          <span className="coupon-badge">{appliedCoupon.code}</span>
          <span>
            {appliedCoupon.discount_type === "percentage"
              ? `Giảm ${appliedCoupon.discount_value}%`
              : `Giảm ${Number(appliedCoupon.discount_value).toLocaleString("vi-VN")} đ`}
          </span>
          {discount > 0 && (
            <strong className="coupon-discount-amount">
              -{discount.toLocaleString("vi-VN")} đ
            </strong>
          )}
        </div>
        <button className="btn btn-secondary btn-sm" type="button" onClick={removeCoupon}>
          Xóa
        </button>
      </div>
    );
  }

  return (
    <div className="coupon-input-section">
      <div className="coupon-input-row">
        <input
          className="input"
          placeholder="Nhập mã giảm giá"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
        />
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? "..." : "Áp dụng"}
        </button>
      </div>
      {couponError ? <p className="coupon-error">{couponError}</p> : null}
    </div>
  );
}
