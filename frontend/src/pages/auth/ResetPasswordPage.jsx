import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import supabase from "../../api/supabaseClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim()) {
      setError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Đặt lại mật khẩu thất bại. Liên kết có thể đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,55,95,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(0,210,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_center,_rgba(34,197,94,0.12),_transparent_30%)]" />

      <div className="relative z-10 mx-auto flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              ← Đăng nhập
            </Link>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
              TungZone
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Đặt lại mật khẩu
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Tạo mật khẩu mới cho tài khoản của bạn. Mật khẩu phải có ít nhất 6 ký tự.
          </p>

          {success ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
              <p className="font-medium">Đổi mật khẩu thành công!</p>
              <p className="mt-1 text-emerald-400/80">
                Mật khẩu đã được cập nhật. Bạn có thể đăng nhập bằng mật khẩu mới.
              </p>
              <Link
                to="/login"
                className="mt-3 inline-block text-sm font-medium text-white underline underline-offset-2 hover:text-emerald-300"
              >
                Đi đến đăng nhập
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 pr-16 text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white/80"
                  >
                    {showPassword ? "Ẩn" : "Hiện"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 focus:ring-4 focus:ring-white/5"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                className="group relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-zinc-900 transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(255,255,255,0.15)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
