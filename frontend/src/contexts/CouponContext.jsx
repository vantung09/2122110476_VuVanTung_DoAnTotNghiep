import { createContext, useContext, useMemo, useState } from "react";
import supabase from "../api/supabaseClient";
import { useAuth } from "./AuthContext";

const CouponContext = createContext(null);

export function CouponProvider({ children }) {
  const { user } = useAuth();
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");

  const validateCoupon = async (code, orderAmount = 0) => {
    setCouponError("");
    if (!code.trim()) {
      setCouponError("Vui lòng nhập mã giảm giá.");
      return null;
    }

    const upperCode = code.trim().toUpperCase();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", upperCode)
      .eq("active", true)
      .maybeSingle();

    if (error || !coupon) {
      setCouponError("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
      return null;
    }

    const now = new Date();
    if (new Date(coupon.starts_at) > now) {
      setCouponError("Mã giảm giá chưa bắt đầu.");
      return null;
    }
    if (new Date(coupon.expires_at) < now) {
      setCouponError("Mã giảm giá đã hết hạn.");
      return null;
    }
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      setCouponError("Mã giảm giá đã hết lượt sử dụng.");
      return null;
    }
    if (orderAmount < Number(coupon.min_order_amount || 0)) {
      setCouponError(
        `Đơn hàng tối thiểu ${Number(coupon.min_order_amount).toLocaleString("vi-VN")} đ để áp dụng mã.`
      );
      return null;
    }

    if (user && coupon.max_uses_per_user) {
      const userId = user.userId || user.email;
      const { data: usages } = await supabase
        .from("coupon_usages")
        .select("id")
        .eq("coupon_id", coupon.id)
        .eq("user_id", userId);
      if (usages && usages.length >= coupon.max_uses_per_user) {
        setCouponError("Bạn đã sử dụng mã này tối đa số lần cho phép.");
        return null;
      }
    }

    return coupon;
  };

  const applyCoupon = async (code, orderAmount = 0) => {
    const coupon = await validateCoupon(code, orderAmount);
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponError("");
    } else {
      setAppliedCoupon(null);
    }
    return coupon;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const calculateDiscount = (orderAmount) => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === "percentage") {
      return Math.round(
        (orderAmount * Number(appliedCoupon.discount_value)) / 100
      );
    }
    return Number(appliedCoupon.discount_value);
  };

  const recordUsage = async (orderId) => {
    if (!appliedCoupon || !user) return;
    const userId = user.userId || user.email;
    await supabase.from("coupon_usages").insert({
      coupon_id: appliedCoupon.id,
      user_id: userId,
      order_id: String(orderId || ""),
    });
    await supabase.rpc("increment_coupon_usage", {
      coupon_id: appliedCoupon.id,
    }).catch(() => {
      // fallback: manual increment
      supabase
        .from("coupons")
        .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
        .eq("id", appliedCoupon.id);
    });
  };

  const value = useMemo(
    () => ({
      appliedCoupon,
      couponError,
      applyCoupon,
      removeCoupon,
      calculateDiscount,
      recordUsage,
      validateCoupon,
    }),
    [appliedCoupon, couponError, user]
  );

  return (
    <CouponContext.Provider value={value}>{children}</CouponContext.Provider>
  );
}

export function useCoupon() {
  return useContext(CouponContext);
}
