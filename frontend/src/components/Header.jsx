import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useFavorites } from "../contexts/FavoriteContext";
import logo from "../assets/tungzone-logo.png";

export default function Header() {
  const { user, logout } = useAuth();
  const { count: cartCount } = useCart();
  const { count: favoriteCount } = useFavorites();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
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
    params.delete("focus");
    navigate(`/?${params.toString()}`);
  };

  return (
    <header className="site-header">
      <div className="container header-row">
        <Link to="/" className="brand-logo">
          <img src={logo} alt="tungzone" />
        </Link>

        <nav className="nav-links">
  <button className="nav-item" type="button" onClick={() => handleCategoryClick("iphone")}>
    iPhone
  </button>
  <button className="nav-item" type="button" onClick={() => handleCategoryClick("mac")}>
    Mac
  </button>
  <button className="nav-item" type="button" onClick={() => handleCategoryClick("ipad")}>
    iPad
  </button>
  <button className="nav-item" type="button" onClick={() => handleCategoryClick("watch")}>
    Watch
  </button>
  <button className="nav-item" type="button" onClick={() => handleCategoryClick("tainghe")}>
    Tai nghe, Loa
  </button>
  <button className="nav-item" type="button" onClick={() => handleCategoryClick("phukien")}>
    Phụ kiện
  </button>
  {user?.role === "ADMIN" && <NavLink to="/admin">Quản trị</NavLink>}
</nav>

        <div className="header-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Tìm kiếm"
            onClick={handleSearchClick}
          >
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
            <>
              <span className="welcome-text">Xin chào, {user.fullName}</span>
              <button className="btn btn-secondary" onClick={handleLogout}>
                Đăng xuất
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-secondary">Đăng nhập</Link>
          )}
        </div>
      </div>
    </header>
  );
}
