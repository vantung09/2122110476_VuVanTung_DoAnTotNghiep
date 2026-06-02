import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { getLocalOrders, getLocalProfile, isBackendUnavailableError, isLocalAuthSession } from "../api/demoStore";
import { useAuth } from "../contexts/AuthContext";
import AccountTab from "./profile/AccountTab";
import PasswordTab from "./profile/PasswordTab";
import OrdersTab from "./profile/OrdersTab";
import PurchasedTab from "./profile/PurchasedTab";

const PROFILE_TABS = [
  { key: "account", label: "Tổng quan", navHint: "Thông tin cá nhân", title: "Tổng quan", description: "Quản lý hồ sơ cá nhân, thông tin liên hệ và quyền lợi thành viên của bạn." },
  { key: "password", label: "Bảo mật", navHint: "Mật khẩu đăng nhập", title: "Bảo mật", description: "Đổi mật khẩu để bảo vệ tài khoản và giữ an toàn cho dữ liệu cá nhân." },
  { key: "orders", label: "Đơn hàng", navHint: "Chi tiết giao dịch", title: "Chi tiết đơn hàng", description: "Theo dõi trạng thái từng đơn và xem sản phẩm trong mỗi lần mua." },
  { key: "purchased", label: "Sản phẩm đã mua", navHint: "Lịch sử sản phẩm", title: "Sản phẩm đã mua", description: "Danh sách tổng hợp từ các đơn đã hoàn tất của bạn." },
];

const VALID_TABS = new Set(PROFILE_TABS.map((tab) => tab.key));

function isValidProfileData(data) {
  return data && typeof data === "object" && !Array.isArray(data) && data.email;
}

function isOrderList(data) {
  return Array.isArray(data);
}

export default function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const activeTab = useMemo(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    return VALID_TABS.has(tab) ? tab : "account";
  }, [location.search]);

  const activeTabConfig = useMemo(
    () => PROFILE_TABS.find((tab) => tab.key === activeTab) || PROFILE_TABS[0],
    [activeTab]
  );

  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const syncProfileState = (data) => {
    setProfile(data);
    updateUser({
      fullName: data.fullName,
      email: data.email,
      role: data.role,
      userId: data.id,
    });
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (isLocalAuthSession(user)) {
          const localProfile = getLocalProfile(user);
          syncProfileState(localProfile);
          setOrders(getLocalOrders(localProfile));
          setPageError("");
          return;
        }

        const [profileResult, ordersResult] = await Promise.allSettled([
          axiosClient.get("/users/me"),
          axiosClient.get("/orders/my"),
        ]);

        if (!mounted) return;

        if (profileResult.status === "rejected" && isBackendUnavailableError(profileResult.reason)) {
          const localProfile = getLocalProfile(user);
          syncProfileState(localProfile);
          setOrders(getLocalOrders(localProfile));
          setPageError("");
          return;
        }

        if (profileResult.status === "rejected") {
          setPageError(profileResult.reason?.response?.status === 401
            ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            : "Không tải được dữ liệu tài khoản.");
          return;
        }

        const profileData = profileResult.value.data;
        if (!isValidProfileData(profileData)) {
          const localProfile = getLocalProfile(user);
          syncProfileState(localProfile);
          setOrders(getLocalOrders(localProfile));
          setPageError("");
          return;
        }

        syncProfileState(profileData);
        setOrders(
          ordersResult.status === "rejected" && isBackendUnavailableError(ordersResult.reason)
            ? getLocalOrders(profileData)
            : isOrderList(ordersResult.value?.data)
            ? ordersResult.value.data
            : getLocalOrders(profileData)
        );
        setPageError("");
      } catch (error) {
        if (!mounted) return;
        setPageError("Không tải được dữ liệu tài khoản.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => { mounted = false; };
  }, [user?.email, user?.userId]);

  const goToTab = (tab) => navigate(`/profile?tab=${tab}`);

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
          <button className="account-profile-nav-btn is-danger" type="button" onClick={handleLogout}>
            <span className="account-profile-nav-title">Đăng xuất</span>
            <span className="account-profile-nav-sub">Thoát phiên đăng nhập</span>
          </button>
        </nav>
      </aside>

      <section className="account-profile-main">
        <header className="account-profile-header">
          <h1>{activeTabConfig.title}</h1>
          <p>{activeTabConfig.description}</p>
        </header>

        {pageError && <div className="error-box">{pageError}</div>}

        {activeTab === "account" && (
          <AccountTab
            profile={profile}
            orders={orders}
            onProfileUpdate={syncProfileState}
          />
        )}

        {activeTab === "password" && (
          <PasswordTab
            profile={profile}
            onProfileUpdate={syncProfileState}
          />
        )}

        {activeTab === "orders" && (
          <OrdersTab orders={orders} />
        )}

        {activeTab === "purchased" && (
          <PurchasedTab orders={orders} />
        )}
      </section>
    </div>
  );
}
