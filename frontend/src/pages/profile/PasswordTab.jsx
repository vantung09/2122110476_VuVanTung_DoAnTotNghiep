import { useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function PasswordTab({ profile, onProfileUpdate }) {
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

  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
        fullName: profile?.fullName || "",
        email: profile?.email || "",
        phoneNumber: profile?.phoneNumber || "",
        address: profile?.address || "",
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
      };

      const response = await axiosClient.put("/users/me", payload);

      onProfileUpdate(response.data);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setPasswordMessage("Đổi mật khẩu thành công.");
    } catch (error) {
      console.error(error);

      setPasswordError(
        error.response?.data?.message || "Đổi mật khẩu thất bại."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="account-profile-content-stack">
      <section className="account-profile-section">
        <h2 className="account-profile-section-title">
          Thông tin bảo mật
        </h2>

        <div className="account-profile-list card">
          <div className="account-profile-list-item is-static">
            <div className="account-profile-list-text">
              <strong>Email đăng nhập</strong>
              <span>{profile?.email || "--"}</span>
            </div>
          </div>
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
              aria-label={
                showPasswords.current
                  ? "Ẩn mật khẩu cũ"
                  : "Hiện mật khẩu cũ"
              }
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
              aria-label={
                showPasswords.next
                  ? "Ẩn mật khẩu mới"
                  : "Hiện mật khẩu mới"
              }
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
              aria-label={
                showPasswords.confirm
                  ? "Ẩn mật khẩu xác nhận"
                  : "Hiện mật khẩu xác nhận"
              }
            >
              {showPasswords.confirm ? "Ẩn" : "Hiện"}
            </button>
          </div>

          {passwordMessage ? (
            <div className="success-box grid-span-2">
              {passwordMessage}
            </div>
          ) : null}

          {passwordError ? (
            <div className="error-box grid-span-2">
              {passwordError}
            </div>
          ) : null}

          <div className="button-row grid-span-2">
            <button
              className="btn btn-primary"
              type="submit"
              disabled={passwordSaving}
            >
              {passwordSaving
                ? "Đang đổi mật khẩu..."
                : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}