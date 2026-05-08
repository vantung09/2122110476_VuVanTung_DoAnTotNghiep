import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../contexts/AdminAuthContext";
import axiosClient from "../../api/axiosClient";

function getErrorMessage(error, fallback) {
  const data = error.response?.data;
  const message =
    typeof data === "string"
      ? data
      : typeof data?.message === "string"
      ? data.message
      : data && typeof data === "object"
      ? Object.values(data).find(Boolean)
      : "";
  if (String(message).toLowerCase().includes("bad credentials")) {
    return "Email hoặc mật khẩu không đúng.";
  }
  return message || fallback;
}

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputsUnlocked, setInputsUnlocked] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await axiosClient.post("/auth/login", {
        email,
        password,
      });
      if (res.data?.role !== "ADMIN") {
        setError("Tai khoan nay khong co quyen quan tri.");
        return;
      }
      login(res.data);
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Đăng nhập thất bại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-root">
      <div className="admin-login-card">
        <div className="admin-login-brand">
          <span className="brand-tung">tung</span>
          <span className="brand-z">Z</span>
          <span className="brand-o">O</span>
          <span className="brand-n">N</span>
          <span className="brand-e">E</span>
        </div>

        <div className="admin-login-header">
          <h1>Đăng nhập Quản trị</h1>
          <p>Trung tâm điều hành riêng dành cho quản trị viên.</p>
        </div>

        <form className="admin-login-form" onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" data-form-type="other">
          <div className="admin-form-group">
            <label>Email quản trị</label>
            <input
              type="email"
              name="admin-login-email"
              value={email}
              readOnly={!inputsUnlocked}
              onFocus={() => setInputsUnlocked(true)}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email quản trị"
              autoComplete="off"
              required
            />
          </div>

          <div className="admin-form-group">
            <label>Mật khẩu</label>
            <div className="admin-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                name="admin-login-password"
                value={password}
                readOnly={!inputsUnlocked}
                onFocus={() => setInputsUnlocked(true)}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu quản trị"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
          </div>

          {error && <div className="admin-error-box">{error}</div>}

          <button type="submit" className="admin-login-btn" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập Quản trị"}
          </button>
        </form>

        <div className="admin-login-footer">
          <a href="/" className="admin-back-link">
            ← Quay về cửa hàng
          </a>
        </div>
      </div>
    </div>
  );
}
