import { useState } from "react";
import axiosClient from "../../api/axiosClient";
import { getProductImageUrl, handleProductImageError } from "../../utils/productImage";

const VIP_THRESHOLD = 40_000_000;
const LOYALTY_POINT_RATE = 1_000;

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatPoints(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} điểm`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

function VipProgressCard({ profile, completedOrdersCount, totalCompletedAmount, orders, activeOrdersCount }) {
  const isVipMember = totalCompletedAmount >= VIP_THRESHOLD;
  const vipRemainingAmount = Math.max(VIP_THRESHOLD - totalCompletedAmount, 0);
  const vipProgressPercent = Math.min(100, Math.round((totalCompletedAmount / VIP_THRESHOLD) * 100));
  const loyaltyPoints = Math.floor(totalCompletedAmount / LOYALTY_POINT_RATE);

  const membershipBenefits = [
    {
      key: "timeline",
      title: "Theo dõi đơn theo timeline",
      description: "Biết ngay đơn đang ở bước xác nhận, vận chuyển hay hoàn tất.",
      unlocked: true,
    },
    {
      key: "points",
      title: "Tích điểm theo chi tiêu",
      description: `Hiện bạn đã tích lũy ${formatPoints(loyaltyPoints)} từ các đơn hoàn tất.`,
      unlocked: completedOrdersCount > 0,
    },
    {
      key: "priority-support",
      title: "Ưu tiên hỗ trợ cho VIP",
      description: isVipMember
        ? "Bạn đã mở khóa hỗ trợ ưu tiên và tư vấn nhanh hơn khi cần."
        : `Mở khóa khi đạt mốc ${formatCurrency(VIP_THRESHOLD)} tổng chi tiêu.`,
      unlocked: isVipMember,
    },
    {
      key: "member-offers",
      title: "Ưu đãi riêng cho thành viên VIP",
      description: isVipMember
        ? "Tài khoản đã sẵn sàng nhận các đợt ưu đãi riêng cho khách VIP."
        : `Còn ${formatCurrency(vipRemainingAmount)} để lên hạng VIP.`,
      unlocked: isVipMember,
    },
  ];

  return (
    <div className="card p-lg account-profile-summary">
      <h3>Tổng quan nhanh</h3>
      <div className="account-profile-summary-group">
        <p><strong>Họ tên:</strong> {profile?.fullName || "--"}</p>
        <p><strong>Email:</strong> {profile?.email || "--"}</p>
        <p><strong>Số điện thoại:</strong> {profile?.phoneNumber || "--"}</p>
        <p><strong>Địa chỉ:</strong> {profile?.address || "--"}</p>
      </div>
      <hr />
      <div className="account-profile-summary-group">
        <p><strong>Tổng đơn hàng:</strong> {orders.length}</p>
        <p><strong>Đơn đã hoàn tất:</strong> {completedOrdersCount}</p>
        <p><strong>Tổng chi tiêu:</strong> {formatCurrency(totalCompletedAmount)}</p>
        <p><strong>Đơn đang xử lý:</strong> {activeOrdersCount}</p>
      </div>

      <div className="account-profile-vip-card">
        <div className="account-profile-vip-top">
          <div>
            <strong>Thành viên VIP</strong>
            <p>
              {isVipMember
                ? "Bạn đã đạt mốc 40.000.000 đ và đang ở hạng VIP."
                : "Tích lũy đủ 40.000.000 đ từ các đơn hoàn tất để nâng hạng VIP."}
            </p>
          </div>
          <span className={`account-profile-vip-badge ${isVipMember ? "is-vip" : ""}`}>
            {isVipMember ? "VIP" : "Thường"}
          </span>
        </div>
        <div className="account-profile-vip-progress" aria-hidden="true">
          <span style={{ width: `${vipProgressPercent}%` }} />
        </div>
        <div className="account-profile-vip-meta">
          <span>Mốc VIP: {formatCurrency(VIP_THRESHOLD)}</span>
          <span>
            {isVipMember
              ? "Bạn đã mở khóa toàn bộ quyền lợi VIP."
              : `Cần thêm ${formatCurrency(vipRemainingAmount)} để đạt VIP.`}
          </span>
        </div>
      </div>

      <div className="account-profile-member-metrics">
        <article className="account-profile-member-metric">
          <span>Hạng hiện tại</span>
          <strong>{isVipMember ? "VIP" : "Khách hàng"}</strong>
        </article>
        <article className="account-profile-member-metric">
          <span>Điểm tích lũy</span>
          <strong>{formatPoints(loyaltyPoints)}</strong>
        </article>
        <article className="account-profile-member-metric">
          <span>Mốc kế tiếp</span>
          <strong>{isVipMember ? "Đã đạt" : formatCurrency(vipRemainingAmount)}</strong>
        </article>
      </div>

      <div className="account-profile-benefit-list">
        {membershipBenefits.map((benefit) => (
          <article
            key={benefit.key}
            className={`account-profile-benefit-card ${benefit.unlocked ? "is-unlocked" : ""}`}
          >
            <span className="account-profile-benefit-icon" aria-hidden="true">
              {benefit.unlocked ? "✓" : "•"}
            </span>
            <div className="account-profile-benefit-copy">
              <strong>{benefit.title}</strong>
              <p>{benefit.description}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default function AccountTab({ profile, orders, onProfileUpdate }) {
  const [accountForm, setAccountForm] = useState({
    fullName: profile?.fullName || "",
    email: profile?.email || "",
    phoneNumber: profile?.phoneNumber || "",
    address: profile?.address || "",
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");

  const completedOrdersCount = orders.filter((o) => o.status === "COMPLETED").length;
  const totalCompletedAmount = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter((o) => ["PENDING", "CONFIRMED", "SHIPPING"].includes(o.status)).length;

  const handleAccountInputChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateAccount = async (event) => {
    event.preventDefault();
    setAccountSaving(true);
    setAccountMessage("");
    setAccountError("");

    try {
      const payload = {
        fullName: accountForm.fullName,
        email: accountForm.email,
        phoneNumber: accountForm.phoneNumber || null,
        address: accountForm.address || null,
      };
      const response = await axiosClient.put("/users/me", payload);
      onProfileUpdate(response.data);
      setAccountMessage("Đã cập nhật thông tin tài khoản.");
    } catch (error) {
      setAccountError(error.response?.data?.message || "Cập nhật thông tin thất bại.");
    } finally {
      setAccountSaving(false);
    }
  };

  return (
    <div className="account-profile-content-stack">
      <section className="account-profile-section">
        <h2 className="account-profile-section-title">Thông tin tài khoản</h2>
        <div className="account-profile-list card">
          <div className="account-profile-list-item is-static">
            <div className="account-profile-list-text">
              <strong>Email</strong>
              <span>{profile?.email || "--"}</span>
            </div>
          </div>
          <div className="account-profile-list-item is-static">
            <div className="account-profile-list-text">
              <strong>Số điện thoại</strong>
              <span>{profile?.phoneNumber || "--"}</span>
            </div>
          </div>
          <div className="account-profile-list-item is-static">
            <div className="account-profile-list-text">
              <strong>Địa chỉ</strong>
              <span>{profile?.address || "--"}</span>
            </div>
          </div>
          <div className="account-profile-list-item is-static">
            <div className="account-profile-list-text">
              <strong>Ngày tham gia</strong>
              <span>{formatDate(profile?.createdAt)}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-grid account-profile-grid">
        <VipProgressCard
          profile={profile}
          completedOrdersCount={completedOrdersCount}
          totalCompletedAmount={totalCompletedAmount}
          orders={orders}
          activeOrdersCount={activeOrdersCount}
        />

        <div className="card p-lg account-profile-form-card">
          <h3>Cập nhật thông tin tài khoản</h3>
          <form className="form-grid" onSubmit={handleUpdateAccount}>
            <input
              className="input"
              name="fullName"
              placeholder="Họ và tên"
              value={accountForm.fullName}
              onChange={handleAccountInputChange}
            />
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email"
              value={accountForm.email}
              onChange={handleAccountInputChange}
            />
            <input
              className="input grid-span-2"
              name="phoneNumber"
              placeholder="Số điện thoại"
              value={accountForm.phoneNumber}
              onChange={handleAccountInputChange}
            />
            <textarea
              className="input grid-span-2 textarea"
              name="address"
              rows="4"
              placeholder="Địa chỉ chi tiết"
              value={accountForm.address}
              onChange={handleAccountInputChange}
            />
            {accountMessage ? <div className="success-box grid-span-2">{accountMessage}</div> : null}
            {accountError ? <div className="error-box grid-span-2">{accountError}</div> : null}
            <div className="button-row grid-span-2">
              <button className="btn btn-primary" type="submit" disabled={accountSaving}>
                {accountSaving ? "Đang lưu..." : "Lưu thông tin"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
