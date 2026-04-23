import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import logo from "../assets/tungzone-logo.png";
import defaultAvatar from "../assets/default-avatar.jpg";

const NAV_ITEMS = [
  { key: "iphone", label: "iPhone" },
  { key: "mac", label: "Mac" },
  { key: "ipad", label: "iPad" },
  { key: "watch", label: "Watch" },
  { key: "tainghe", label: "Tai nghe, Loa" },
  { key: "phukien", label: "Phụ kiện" },
];

const VIP_THRESHOLD = 40_000_000;

const ADMIN_MENU_ITEMS = [
  { key: "dashboard", label: "Tổng quan quản trị", hint: "Theo dõi hoạt động hệ thống", path: "/admin" },
  { key: "categories", label: "Danh mục", hint: "Quản lý nhóm sản phẩm", path: "/admin/categories" },
  { key: "products", label: "Sản phẩm", hint: "Thêm, sửa và cập nhật tồn kho", path: "/admin/products" },
  { key: "users", label: "Người dùng", hint: "Quản trị tài khoản khách hàng", path: "/admin/users" },
  { key: "orders", label: "Đơn hàng", hint: "Xử lý đơn và trạng thái giao hàng", path: "/admin/orders" },
  { key: "payments", label: "Thanh toán", hint: "Theo dõi giao dịch và MoMo", path: "/admin/payments" },
];

export default function Header() {
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const accountMenuRef = useRef(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [isVipMember, setIsVipMember] = useState(false);

  const selectedCategory =
    location.pathname === "/" ? new URLSearchParams(location.search).get("category") || "" : "";

  const userDisplayName = user?.fullName || user?.email || "Tài khoản";
  const isAdmin = user?.role === "ADMIN";

  const userInitials = useMemo(() => {
    if (!user) return "U";

    if (user.fullName) {
      return user.fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
    }

    return String(user.email || "U").charAt(0).toUpperCase();
  }, [user]);

  useEffect(() => {
    setAvatarLoadError(false);
  }, [user?.userId, user?.email]);

  useEffect(() => {
    let mounted = true;

    if (!user || isAdmin) {
      setIsVipMember(false);
      return () => {
        mounted = false;
      };
    }

    const loadVipStatus = async () => {
      try {
        const response = await axiosClient.get("/orders/my");
        const totalCompletedAmount = (response.data || [])
          .filter((order) => order.status === "COMPLETED")
          .reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);

        if (mounted) {
          setIsVipMember(totalCompletedAmount >= VIP_THRESHOLD);
        }
      } catch {
        if (mounted) {
          setIsVipMember(false);
        }
      }
    };

    loadVipStatus();

    return () => {
      mounted = false;
    };
  }, [isAdmin, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!accountMenuRef.current || accountMenuRef.current.contains(event.target)) {
        return;
      }
      setIsAccountMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setIsAccountMenuOpen(false);
    navigate("/");
  };

  const handleSearchClick = () => {
    if (location.pathname !== "/") {
      navigate("/?focus=1");
      return;
    }

    const input = document.getElementById("site-search-input");
    if (input) {
      input.focus();
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleCategoryClick = (key) => {
    const params = new URLSearchParams(location.search);

    if (key) {
      params.set("category", key);
    } else {
      params.delete("category");
    }

    params.set("focus", "products");
    const query = params.toString();
    navigate(query ? `/?${query}` : "/");
  };

  const goToProfileTab = (tab) => {
    setIsAccountMenuOpen(false);
    navigate(`/profile?tab=${tab}`);
  };

  const handleMenuAction = (callback) => {
    setIsAccountMenuOpen(false);
    callback();
  };

  const accountMenuSections = [
    {
      key: "account",
      title: "Tài khoản",
      items: [
        {
          key: "account-overview",
          label: "Thông tin tài khoản",
          hint: "Cập nhật hồ sơ cá nhân",
          action: () => goToProfileTab("account"),
        },
        {
          key: "password",
          label: "Đổi mật khẩu",
          hint: "Tăng cường bảo mật đăng nhập",
          action: () => goToProfileTab("password"),
        },
        {
          key: "orders",
          label: "Chi tiết đơn hàng",
          hint: "Theo dõi trạng thái mua hàng",
          action: () => goToProfileTab("orders"),
        },
        {
          key: "purchased",
          label: "Sản phẩm đã mua",
          hint: "Xem lại lịch sử sản phẩm",
          action: () => goToProfileTab("purchased"),
        },
      ],
    },
    ...(isAdmin
      ? [
          {
            key: "admin",
            title: "Quản trị",
            items: ADMIN_MENU_ITEMS.map((item) => ({
              ...item,
              action: () => navigate(item.path),
            })),
          },
        ]
      : []),
  ];

  return (
    <header className="site-header">
      <div className="container header-row">
        <div className="brand-lockup">
          <Link to="/" className="brand-logo" aria-label="TungZone">
            <img src={logo} alt="TungZone" />
          </Link>
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-badge">Premium Tech Store</span>
        </div>

        <nav className="nav-links" aria-label="Danh mục nổi bật">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${selectedCategory === item.key ? "active" : ""}`}
              type="button"
              onClick={() => handleCategoryClick(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button className="icon-button" type="button" aria-label="Tìm kiếm" onClick={handleSearchClick}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 4a7 7 0 1 0 4.48 12.38l3.07 3.07 1.41-1.41-3.07-3.07A7 7 0 0 0 11 4Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z" />
            </svg>
          </button>

          <Link to="/favorites" className="icon-button icon-button-fav" aria-label="Yêu thích">
            <img src="/icons/heart.png" alt="" className="icon-image" />
            {favoriteCount > 0 && <span className="icon-badge">{favoriteCount}</span>}
          </Link>

          <Link to="/cart" className="icon-button icon-button-cart" aria-label="Giỏ hàng">
            <img src="/icons/cart.png" alt="" className="icon-image" />
            {cartCount > 0 && <span className="icon-badge">{cartCount}</span>}
          </Link>

          {user ? (
            <div className="header-account" ref={accountMenuRef}>
              <button
                className="header-avatar-btn"
                type="button"
                aria-label="Mở menu tài khoản"
                aria-expanded={isAccountMenuOpen}
                onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              >
                {avatarLoadError ? (
                  <span className="header-avatar-fallback">{userInitials}</span>
                ) : (
                  <img
                    src={defaultAvatar}
                    alt="Avatar mặc định"
                    className="header-avatar-image"
                    onError={() => setAvatarLoadError(true)}
                  />
                )}
              </button>

              {isAccountMenuOpen ? (
                <div className="header-account-menu" role="menu" aria-label="Menu tài khoản">
                  <div className="header-account-meta">
                    <div>
                      <strong>{userDisplayName}</strong>
                      <span>{user?.email || ""}</span>
                    </div>
                    <span className={`header-account-role ${isAdmin ? "is-admin" : isVipMember ? "is-vip" : ""}`}>
                      {isAdmin ? "Quản trị viên" : isVipMember ? "VIP" : "Khách hàng"}
                    </span>
                  </div>

                  <div className="header-account-menu-body">
                    {accountMenuSections.map((section) => (
                      <div key={section.key} className="header-account-menu-section">
                        <div className="header-account-section-head">{section.title}</div>
                        <div className="header-account-section-list">
                          {section.items.map((item) => (
                            <button
                              key={item.key}
                              className="header-account-menu-item"
                              type="button"
                              onClick={() => handleMenuAction(item.action)}
                            >
                              <span className="header-account-menu-copy">
                                <strong>{item.label}</strong>
                                <span>{item.hint}</span>
                              </span>
                              {item.badge ? <span className="header-account-menu-badge">{item.badge}</span> : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="header-account-menu-footer">
                    <button className="header-account-menu-item is-danger" type="button" onClick={handleLogout}>
                      <span className="header-account-menu-copy">
                        <strong>Đăng xuất</strong>
                        <span>Kết thúc phiên làm việc hiện tại</span>
                      </span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <Link to="/login" className="btn btn-secondary header-auth-btn">
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
