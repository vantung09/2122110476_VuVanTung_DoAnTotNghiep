import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import { getProductImageUrl, handleProductImageError } from "../utils/productImage";

const PROFILE_TABS = [
  {
    key: "account",
    label: "Tổng quan",
    navHint: "Thông tin cá nhân",
    title: "Tổng quan",
    description: "Quản lý hồ sơ cá nhân, thông tin liên hệ và quyền lợi thành viên của bạn.",
  },
  {
    key: "password",
    label: "Bảo mật",
    navHint: "Mật khẩu đăng nhập",
    title: "Bảo mật",
    description: "Đổi mật khẩu để bảo vệ tài khoản và giữ an toàn cho dữ liệu cá nhân.",
  },
  {
    key: "orders",
    label: "Đơn hàng",
    navHint: "Chi tiết giao dịch",
    title: "Chi tiết đơn hàng",
    description: "Theo dõi trạng thái từng đơn và xem sản phẩm trong mỗi lần mua.",
  },
  {
    key: "purchased",
    label: "Sản phẩm đã mua",
    navHint: "Lịch sử sản phẩm",
    title: "Sản phẩm đã mua",
    description: "Danh sách tổng hợp từ các đơn đã hoàn tất của bạn.",
  },
];

const VALID_TABS = new Set(PROFILE_TABS.map((tab) => tab.key));
const VIP_THRESHOLD = 40_000_000;

const statusLabelMap = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} đ`;
}

function formatDate(value) {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
}

export default function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, updateUser } = useAuth();

  const activeTab = useMemo(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    return VALID_TABS.has(tab) ? tab : "account";
  }, [location.search]);

  const activeTabConfig = useMemo(
    () => PROFILE_TABS.find((tab) => tab.key === activeTab) || PROFILE_TABS[0],
    [activeTab]
  );

  const [profile, setProfile] = useState(null);
  const [accountForm, setAccountForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [orders, setOrders] = useState([]);
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [loadingOrderId, setLoadingOrderId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [accountSaving, setAccountSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [purchasedLoading, setPurchasedLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const syncProfileState = (data) => {
    setProfile(data);
    setAccountForm({
      fullName: data.fullName || "",
      email: data.email || "",
      phoneNumber: data.phoneNumber || "",
      address: data.address || "",
    });
    updateUser({
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      userId: data.id,
    });
  };

  const fetchProfile = async () => {
    const response = await axiosClient.get("/users/me");
    syncProfileState(response.data);
  };

  const fetchOrders = async () => {
    const response = await axiosClient.get("/orders/my");
    setOrders(response.data || []);
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        await Promise.all([fetchProfile(), fetchOrders()]);
        if (!mounted) return;
        setPageError("");
      } catch (error) {
        if (!mounted) return;
        setPageError(error.response?.data?.message || "Không tải được dữ liệu tài khoản.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "purchased") return;

    const completedOrders = orders.filter((order) => order.status === "COMPLETED");
    const missingOrderIds = completedOrders
      .map((order) => order.id)
      .filter((orderId) => !orderDetailsMap[orderId]);

    if (!missingOrderIds.length) return;

    let mounted = true;

    const loadCompletedOrderDetails = async () => {
      try {
        setPurchasedLoading(true);
        const responses = await Promise.all(
          missingOrderIds.map(async (orderId) => {
            const response = await axiosClient.get(`/orders/my/${orderId}`);
            return { orderId, detail: response.data };
          })
        );

        if (!mounted) return;

        setOrderDetailsMap((prev) => {
          const next = { ...prev };
          responses.forEach(({ orderId, detail }) => {
            next[orderId] = detail;
          });
          return next;
        });
      } catch (error) {
        if (!mounted) return;
        setPageError(error.response?.data?.message || "Không tải được danh sách sản phẩm đã mua.");
      } finally {
        if (mounted) {
          setPurchasedLoading(false);
        }
      }
    };

    loadCompletedOrderDetails();

    return () => {
      mounted = false;
    };
  }, [activeTab, orders, orderDetailsMap]);

  const completedOrdersCount = useMemo(
    () => orders.filter((order) => order.status === "COMPLETED").length,
    [orders]
  );

  const totalCompletedAmount = useMemo(
    () =>
      orders
        .filter((order) => order.status === "COMPLETED")
        .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0),
    [orders]
  );

  const purchasedItems = useMemo(() => {
    const itemMap = new Map();

    orders
      .filter((order) => order.status === "COMPLETED")
      .forEach((order) => {
        const detail = orderDetailsMap[order.id];
        if (!detail?.items?.length) return;

        detail.items.forEach((item, index) => {
          const key = `${item.productName || "Sản phẩm"}-${Number(item.price || 0)}`;

          if (!itemMap.has(key)) {
            itemMap.set(key, {
              id: `${order.id}-${index}`,
              productName: item.productName || "Sản phẩm",
              imageUrl: item.imageUrl || "",
              unitPrice: Number(item.price || 0),
              totalQuantity: Number(item.quantity || 0),
              totalSpent: Number(item.price || 0) * Number(item.quantity || 0),
              lastPurchasedAt: order.createdAt,
            });
            return;
          }

          const current = itemMap.get(key);
          current.totalQuantity += Number(item.quantity || 0);
          current.totalSpent += Number(item.price || 0) * Number(item.quantity || 0);

          if (new Date(order.createdAt).getTime() > new Date(current.lastPurchasedAt).getTime()) {
            current.lastPurchasedAt = order.createdAt;
          }
        });
      });

    return Array.from(itemMap.values()).sort(
      (a, b) => new Date(b.lastPurchasedAt).getTime() - new Date(a.lastPurchasedAt).getTime()
    );
  }, [orders, orderDetailsMap]);

  const isVipMember = totalCompletedAmount >= VIP_THRESHOLD;
  const vipRemainingAmount = Math.max(VIP_THRESHOLD - totalCompletedAmount, 0);
  const vipProgressPercent = Math.min(100, Math.round((totalCompletedAmount / VIP_THRESHOLD) * 100));

  const goToTab = (tab) => navigate(`/profile?tab=${tab}`);

  const handleAccountInputChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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
        phoneNumber: accountForm.phoneNumber,
        address: accountForm.address,
      };

      const response = await axiosClient.put("/users/me", payload);
      syncProfileState(response.data);
      setAccountMessage("Đã cập nhật thông tin tài khoản.");
    } catch (error) {
      setAccountError(error.response?.data?.message || "Cập nhật thông tin thất bại.");
    } finally {
      setAccountSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");

    try {
      if (!passwordForm.currentPassword.trim()) {
        setPasswordError("Vui lòng nhập mật khẩu cũ.");
        return;
      }

      if (!passwordForm.newPassword.trim()) {
        setPasswordError("Vui lòng nhập mật khẩu mới.");
        return;
      }

      if (passwordForm.newPassword.length < 6) {
        setPasswordError("Mật khẩu mới phải có ít nhất 6 ký tự.");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setPasswordError("Mật khẩu xác nhận không khớp.");
        return;
      }

      const payload = {
        fullName: profile?.fullName || accountForm.fullName,
        email: profile?.email || accountForm.email,
        phoneNumber: profile?.phoneNumber ?? accountForm.phoneNumber,
        address: profile?.address ?? accountForm.address,
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
      };

      const response = await axiosClient.put("/users/me", payload);
      syncProfileState(response.data);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordMessage("Đổi mật khẩu thành công.");
    } catch (error) {
      setPasswordError(error.response?.data?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleToggleOrderDetail = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);

    if (orderDetailsMap[orderId]) {
      return;
    }

    try {
      setLoadingOrderId(orderId);
      const response = await axiosClient.get(`/orders/my/${orderId}`);
      setOrderDetailsMap((prev) => ({
        ...prev,
        [orderId]: response.data,
      }));
    } catch (error) {
      setPageError(error.response?.data?.message || "Không tải được chi tiết đơn hàng.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return <section className="storefront-section-panel">Đang tải dữ liệu tài khoản...</section>;
  }

  return (
    <div className="account-profile-layout">
      <aside className="account-profile-sidebar card p-lg">
        <button className="account-profile-back" type="button" onClick={() => navigate("/")}>
          <span aria-hidden="true">←</span>
          Quay lại TungZone
        </button>

        <nav className="account-profile-nav" aria-label="Menu hồ sơ">
          {PROFILE_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`account-profile-nav-btn ${activeTab === tab.key ? "active" : ""}`}
              type="button"
              onClick={() => goToTab(tab.key)}
            >
              <span className="account-profile-nav-title">{tab.label}</span>
              <span className="account-profile-nav-sub">{tab.navHint}</span>
            </button>
          ))}
        </nav>
      </aside>

      <section className="account-profile-main">
        <header className="account-profile-header">
          <h1>{activeTabConfig.title}</h1>
          <p>{activeTabConfig.description}</p>
        </header>

        {pageError ? <div className="error-box">{pageError}</div> : null}

        {activeTab === "account" ? (
          <div className="account-profile-content-stack">
            <section className="account-profile-section">
              <h2 className="account-profile-section-title">Thông tin tài khoản</h2>
              <div className="account-profile-list card">
                <button className="account-profile-list-item" type="button" onClick={() => goToTab("password")}>
                  <div className="account-profile-list-text">
                    <strong>Mật khẩu</strong>
                    <span>Thay đổi mật khẩu đăng nhập</span>
                  </div>
                  <span className="account-profile-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>

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

            <section className="account-profile-section">
              <h2 className="account-profile-section-title">Truy cập và giao dịch</h2>
              <div className="account-profile-list card">
                <button className="account-profile-list-item" type="button" onClick={() => goToTab("orders")}>
                  <div className="account-profile-list-text">
                    <strong>Chi tiết đơn hàng</strong>
                    <span>Theo dõi trạng thái từng đơn đã đặt</span>
                  </div>
                  <span className="account-profile-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>

                <button className="account-profile-list-item" type="button" onClick={() => goToTab("purchased")}>
                  <div className="account-profile-list-text">
                    <strong>Sản phẩm đã mua</strong>
                    <span>Danh sách tổng hợp từ đơn đã hoàn tất</span>
                  </div>
                  <span className="account-profile-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>

                <button className="account-profile-list-item is-danger" type="button" onClick={handleLogout}>
                  <div className="account-profile-list-text">
                    <strong>Đăng xuất</strong>
                    <span>Thoát khỏi phiên đăng nhập hiện tại</span>
                  </div>
                  <span className="account-profile-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              </div>
            </section>

            <div className="profile-grid account-profile-grid">
              <div className="card p-lg account-profile-summary">
                <h3>Tổng quan nhanh</h3>
                <div className="account-profile-summary-group">
                  <p>
                    <strong>Họ tên:</strong> {profile?.fullName || "--"}
                  </p>
                  <p>
                    <strong>Email:</strong> {profile?.email || "--"}
                  </p>
                  <p>
                    <strong>Số điện thoại:</strong> {profile?.phoneNumber || "--"}
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong> {profile?.address || "--"}
                  </p>
                </div>

                <hr />

                <div className="account-profile-summary-group">
                  <p>
                    <strong>Tổng đơn hàng:</strong> {orders.length}
                  </p>
                  <p>
                    <strong>Đơn đã hoàn tất:</strong> {completedOrdersCount}
                  </p>
                  <p>
                    <strong>Tổng chi tiêu:</strong> {formatCurrency(totalCompletedAmount)}
                  </p>
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
              </div>

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
        ) : null}

        {activeTab === "password" ? (
          <div className="account-profile-content-stack">
            <section className="account-profile-section">
              <h2 className="account-profile-section-title">Thông tin bảo mật</h2>
              <div className="account-profile-list card">
                <div className="account-profile-list-item is-static">
                  <div className="account-profile-list-text">
                    <strong>Email đăng nhập</strong>
                    <span>{profile?.email || "--"}</span>
                  </div>
                </div>

                <button className="account-profile-list-item" type="button" onClick={() => goToTab("account")}>
                  <div className="account-profile-list-text">
                    <strong>Thông tin tài khoản</strong>
                    <span>Quay lại trang cập nhật hồ sơ và liên hệ</span>
                  </div>
                  <span className="account-profile-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              </div>
            </section>

            <div className="card p-lg account-profile-form-card">
              <h3>Đổi mật khẩu</h3>
              <form className="form-grid" onSubmit={handleChangePassword}>
                <div className="password-input-wrapper grid-span-2">
                  <input
                    className="input"
                    name="currentPassword"
                    type={showPasswords.current ? "text" : "password"}
                    placeholder="Mật khẩu cũ"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordInputChange}
                  />
                  <button
                    className="password-toggle-btn"
                    type="button"
                    onClick={() => togglePasswordVisibility("current")}
                    aria-label={showPasswords.current ? "Ẩn mật khẩu cũ" : "Hiện mật khẩu cũ"}
                  >
                    {showPasswords.current ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                <div className="password-input-wrapper grid-span-2">
                  <input
                    className="input"
                    name="newPassword"
                    type={showPasswords.next ? "text" : "password"}
                    placeholder="Mật khẩu mới"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordInputChange}
                    disabled={!passwordForm.currentPassword.trim()}
                  />
                  <button
                    className="password-toggle-btn"
                    type="button"
                    onClick={() => togglePasswordVisibility("next")}
                    aria-label={showPasswords.next ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"}
                  >
                    {showPasswords.next ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                <div className="password-input-wrapper grid-span-2">
                  <input
                    className="input"
                    name="confirmPassword"
                    type={showPasswords.confirm ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordInputChange}
                    disabled={!passwordForm.currentPassword.trim()}
                  />
                  <button
                    className="password-toggle-btn"
                    type="button"
                    onClick={() => togglePasswordVisibility("confirm")}
                    aria-label={showPasswords.confirm ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"}
                  >
                    {showPasswords.confirm ? "Ẩn" : "Hiện"}
                  </button>
                </div>

                {passwordMessage ? <div className="success-box grid-span-2">{passwordMessage}</div> : null}
                {passwordError ? <div className="error-box grid-span-2">{passwordError}</div> : null}

                <div className="button-row grid-span-2">
                  <button className="btn btn-primary" type="submit" disabled={passwordSaving}>
                    {passwordSaving ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {activeTab === "orders" ? (
          <section className="account-profile-content-stack">
            <div className="order-list">
              {orders.map((order) => {
                const detail = orderDetailsMap[order.id] || order;
                const isExpanded = expandedOrderId === order.id;

                return (
                  <div key={order.id} className="card p-lg order-card">
                    <div className="order-top">
                      <div>
                        <h3>Đơn hàng #{order.id}</h3>
                        <p>Ngày tạo: {formatDate(order.createdAt)}</p>
                      </div>

                      <div className="order-right">
                        <strong>{formatCurrency(order.totalAmount)}</strong>
                        <span className={`admin-status-pill is-${String(order.status || "").toLowerCase()}`}>
                          {statusLabelMap[order.status] || order.status}
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          type="button"
                          onClick={() => handleToggleOrderDetail(order.id)}
                        >
                          {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                        </button>
                      </div>
                    </div>

                    {isExpanded ? (
                      <div className="order-items">
                        {loadingOrderId === order.id ? (
                          <div className="admin-empty-state">Đang tải chi tiết...</div>
                        ) : detail.items?.length ? (
                          detail.items.map((item, index) => (
                            <div key={`${order.id}-${index}`} className="order-item-row">
                              <img
                                src={getProductImageUrl({ imageUrl: item.imageUrl, name: item.productName })}
                                alt={item.productName}
                                onError={(event) => handleProductImageError(event, { name: item.productName })}
                              />
                              <div>
                                <p>
                                  <strong>{item.productName}</strong>
                                </p>
                                <p>Số lượng: {item.quantity}</p>
                                <p>Đơn giá: {formatCurrency(item.price)}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="admin-empty-state">Đơn hàng chưa có sản phẩm.</div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              {orders.length === 0 ? <div className="admin-empty-state">Bạn chưa có đơn hàng nào.</div> : null}
            </div>
          </section>
        ) : null}

        {activeTab === "purchased" ? (
          <section className="account-profile-content-stack">
            {purchasedLoading ? (
              <div className="admin-empty-state">Đang tải danh sách sản phẩm đã mua...</div>
            ) : purchasedItems.length ? (
              <div className="purchased-grid">
                {purchasedItems.map((item) => (
                  <article key={item.id} className="card p-lg purchased-card">
                    <img
                      src={getProductImageUrl({ imageUrl: item.imageUrl, name: item.productName })}
                      alt={item.productName}
                      onError={(event) => handleProductImageError(event, { name: item.productName })}
                    />
                    <div className="purchased-body">
                      <h3>{item.productName}</h3>
                      <p>
                        <strong>Đơn giá:</strong> {formatCurrency(item.unitPrice)}
                      </p>
                      <p>
                        <strong>Tổng số lượng đã mua:</strong> {item.totalQuantity}
                      </p>
                      <p>
                        <strong>Tổng tiền đã chi:</strong> {formatCurrency(item.totalSpent)}
                      </p>
                      <p>
                        <strong>Lần mua gần nhất:</strong> {formatDate(item.lastPurchasedAt)}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-empty-state">Bạn chưa có sản phẩm nào đã hoàn tất mua.</div>
            )}
          </section>
        ) : null}
      </section>
    </div>
  );
}
