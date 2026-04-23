import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../../api/supabaseClient";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập email đã đăng ký.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message || "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.");
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
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              ← Quay về đăng nhập
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/60">
              TungZone
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Quên mật khẩu
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/60">
            Nhập email đã đăng ký. Chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu đến hộp thư của bạn.
          </p>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-300">
              <p className="font-medium">Email đã được gửi!</p>
              <p className="mt-1 text-emerald-400/80">
                Vui lòng kiểm tra hộp thư (bao gồm thư rác) và nhấn liên kết để đặt lại mật khẩu.
              </p>
              <Link
                to="/login"
                className="mt-3 inline-block text-sm font-medium text-white underline underline-offset-2 hover:text-emerald-300"
              >
                Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? "Đang gửi..." : "Gửi hướng dẫn đặt lại"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
