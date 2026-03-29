import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { useAuth } from "../../contexts/AuthContext";

const DEFAULT_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  remember: false,
  agree: false,
};

export default function TungzoneAuthUI({ defaultMode = "login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const googleButtonRef = useRef(null);
  const googleInitialized = useRef(false);
  const [mode, setMode] = useState(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const hasGoogleClientId = googleClientId && googleClientId !== "YOUR_CLIENT_ID";

  useEffect(() => {
    if (location.pathname.includes("register")) {
      setMode("register");
    } else {
      setMode("login");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!hasGoogleClientId) return;
    if (googleInitialized.current) return;

    const renderGoogleButton = () => {
      if (!window.google || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            setLoading(true);
            setError("");
            const res = await axiosClient.post("/auth/google", {
              credential: response.credential,
            });
            login(res.data);
            const redirectTarget = location.state?.from;
            const nextPath =
              redirectTarget && res.data.role !== "ADMIN"
                ? redirectTarget
                : res.data.role === "ADMIN"
                ? "/admin"
                : "/";
            navigate(nextPath);
          } catch (err) {
            setError(err.response?.data?.message || "Đăng nhập Google thất bại");
          } finally {
            setLoading(false);
          }
        },
      });
      const containerWidth = googleButtonRef.current.clientWidth || 320;
      const width = Math.max(240, Math.min(400, containerWidth));
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        width,
      });
    };

    const initGoogle = () => {
      renderGoogleButton();
      googleInitialized.current = true;
    };

    if (window.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.body.appendChild(script);

    const handleResize = () => {
      if (googleInitialized.current) {
        renderGoogleButton();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      script.onload = null;
      window.removeEventListener("resize", handleResize);
    };
  }, [googleClientId, hasGoogleClientId, login, location.state?.from, navigate]);

  const content = useMemo(() => {
    return mode === "login"
      ? {
          title: "Đăng nhập vào TungZone",
          subtitle:
            "Truy cập tài khoản để theo dõi đơn hàng, ưu đãi và trải nghiệm mua sắm premium.",
          button: "Đăng nhập ngay",
          switchText: "Chưa có tài khoản?",
          switchAction: "Tạo tài khoản",
        }
      : {
          title: "Tạo tài khoản mới",
          subtitle:
            "Đăng ký để lưu sản phẩm yêu thích, đặt hàng nhanh hơn và nhận ưu đãi thành viên.",
          button: "Tạo tài khoản",
          switchText: "Đã có tài khoản?",
          switchAction: "Đăng nhập",
        };
  }, [mode]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    navigate(nextMode === "register" ? "/register" : "/login");
  };

  const handleBack = () => {
    const target = location.state?.from || "/";
    navigate(target);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const res = await axiosClient.post("/auth/login", {
          email: form.email,
          password: form.password,
        });
        login(res.data);
        const redirectTarget = location.state?.from;
        const nextPath =
          redirectTarget && res.data.role !== "ADMIN"
            ? redirectTarget
            : res.data.role === "ADMIN"
            ? "/admin"
            : "/";
        navigate(nextPath);
      } else {
        if (form.password !== form.confirmPassword) {
          setError("Mật khẩu xác nhận không khớp.");
          return;
        }
        if (!form.agree) {
          setError("Vui lòng đồng ý với điều khoản sử dụng.");
          return;
        }
        const fullName = [form.lastName, form.firstName].filter(Boolean).join(" ").trim();
        const res = await axiosClient.post("/auth/register", {
          fullName,
          email: form.email,
          password: form.password,
        });
        login(res.data);
        const redirectTarget = location.state?.from;
        navigate(redirectTarget || "/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (mode === "login" ? "Đăng nhập thất bại" : "Đăng ký thất bại")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#050816] text-white relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,55,95,0.18),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(0,210,255,0.18),_transparent_28%),radial-gradient(circle_at_bottom_center,_rgba(34,197,94,0.12),_transparent_30%)]" />
      <div className="absolute -top-28 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-[24rem] w-[24rem] rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative hidden min-h-[780px] overflow-hidden p-8 lg:block xl:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.01))]" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Trải nghiệm đăng nhập nhanh và an toàn cho khách hàng
                </div>

                <div className="mt-8 text-6xl font-semibold tracking-tight xl:text-7xl">
                  <span className="text-white">tung</span>
                  <span className="text-[#ff3b30]">Z</span>
                  <span className="text-[#30d158]">O</span>
                  <span className="text-[#40c8ff]">N</span>
                  <span className="text-[#ff2d95]">E</span>
                </div>

                <div className="mt-8 max-w-xl space-y-5">
                  <h2 className="text-4xl font-semibold leading-tight text-white xl:text-5xl">
                    Mua sắm Apple chính hãng, ưu đãi tốt mỗi ngày.
                  </h2>
                  <p className="max-w-lg text-base leading-8 text-white/65 xl:text-lg">
                    Đăng nhập để theo dõi đơn hàng, quản lý bảo hành, tích điểm thành viên và nhận
                    thông báo khuyến mãi mới nhất từ TungZone.
                  </p>
                </div>
              </div>

              <div className="relative mt-12 grid grid-cols-12 gap-5">
                <div className="col-span-7 rounded-[28px] border border-white/10 bg-white/8 p-5 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-white/55">Ưu đãi thành viên</p>
                      <p className="mt-1 text-2xl font-semibold">Ưu đãi VIP</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/80">
                      New
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] bg-[#0b1020] p-5 ring-1 ring-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/45">Sản phẩm nổi bật</p>
                        <p className="mt-1 text-lg font-medium text-white/90">iPhone / Mac / iPad</p>
                      </div>
                      <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-white/20 to-white/5" />
                    </div>
                    <div className="mt-5 h-40 rounded-[22px] border border-white/5 bg-[linear-gradient(145deg,#0f172a,#111827,#0b1220)] p-4">
                      <div className="flex h-full items-end justify-center gap-3">
                        <div className="h-20 w-14 rounded-t-[16px] rounded-b-[18px] bg-white/90 shadow-2xl shadow-black/30" />
                        <div className="h-28 w-16 rounded-t-[18px] rounded-b-[20px] bg-zinc-300/90 shadow-2xl shadow-black/30" />
                        <div className="h-24 w-20 rounded-[20px] bg-gradient-to-b from-[#1d4ed8] to-[#0f172a] shadow-2xl shadow-blue-900/30" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-5 flex flex-col gap-5">
                  <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
                    <p className="text-sm text-white/50">Mua sắm</p>
                    <p className="mt-2 text-3xl font-semibold">Nhanh và dễ</p>
                    <p className="mt-3 text-sm leading-7 text-white/60">
                      Chọn máy, thêm giỏ, thanh toán trong vài bước. Theo dõi đơn và trạng thái vận
                      chuyển ngay trên tài khoản.
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/8 p-5 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div>
                      <p className="text-sm text-white/50">Thanh toán</p>
                      <p className="mt-2 text-3xl font-semibold">An toàn</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                        <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                      </div>
                    </div>
                    <div className="mt-5 space-y-3">
                      <div className="h-3 rounded-full bg-white/10">
                        <div className="h-3 w-4/5 rounded-full bg-gradient-to-r from-[#ff3b30] via-[#30d158] to-[#40c8ff]" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-white/50">
                        <span>Giao hàng nhanh</span>
                        <span>Hỗ trợ 24/7</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 backdrop-blur-xl">
                    <p className="text-sm text-white/50">Cam kết</p>
                    <p className="mt-2 text-lg font-medium text-white/90">
                      Hàng chính hãng, bảo hành rõ ràng và đổi trả minh bạch theo chính sách.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="relative flex min-h-[780px] items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,0.95))] px-5 py-8 sm:px-8 lg:px-10">
            <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,59,48,0.12),transparent_35%)]" />
            <div className="relative w-full max-w-md">
              <div className="mb-8 flex items-center justify-between lg:hidden">
                <div className="text-3xl font-bold tracking-tight text-zinc-900">
                  <span>tung</span>
                  <span className="text-[#ff3b30]">Z</span>
                  <span className="text-[#30d158]">O</span>
                  <span className="text-[#40c8ff]">N</span>
                  <span className="text-[#ff2d95]">E</span>
                </div>
                <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                  Premium
                </div>
              </div>

              <div className="rounded-[30px] border border-zinc-200/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-sm"
                  >
                    ← Quay về
                  </button>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-500">
                    TungZone
                  </span>
                </div>
                <div className="inline-flex rounded-full bg-zinc-100 p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("login")}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      mode === "login"
                        ? "bg-zinc-900 text-white shadow-lg"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeChange("register")}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                      mode === "register"
                        ? "bg-zinc-900 text-white shadow-lg"
                        : "text-zinc-500 hover:text-zinc-900"
                    }`}
                  >
                    Register
                  </button>
                </div>

                <div className="mt-6">
                  <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-[2rem]">
                    {content.title}
                  </h1>
                  <p className="mt-3 text-sm leading-7 text-zinc-500 sm:text-[15px]">
                    {content.subtitle}
                  </p>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-center">
                    {hasGoogleClientId ? (
                      <div ref={googleButtonRef} className="w-full auth-google-button" />
                    ) : (
                      <button
                        type="button"
                        className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-500"
                        onClick={() =>
                          setError("Vui lòng cấu hình Google Client ID để đăng nhập.")
                        }
                      >
                        Google
                      </button>
                    )}
                  </div>
                  
                </div>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs uppercase tracking-[0.24em] text-zinc-400">
                      hoặc dùng email
                    </span>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  {mode === "register" && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">Họ</label>
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Nguyễn"
                          value={form.lastName}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-700">Tên</label>
                        <input
                          type="text"
                          name="firstName"
                          placeholder="Mạnh"
                          value={form.firstName}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-700">Mật khẩu</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Nhập mật khẩu"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-16 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        {showPassword ? "Ẩn" : "Hiện"}
                      </button>
                    </div>
                  </div>

                  {mode === "register" && (
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-700">
                        Xác nhận mật khẩu
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          placeholder="Nhập lại mật khẩu"
                          value={form.confirmPassword}
                          onChange={handleChange}
                          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-16 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          {showConfirmPassword ? "Ẩn" : "Hiện"}
                        </button>
                      </div>
                    </div>
                  )}

                  {mode === "login" ? (
                    <div className="flex items-center justify-between pt-1 text-sm">
                      <label className="flex items-center gap-3 text-zinc-500">
                        <input
                          type="checkbox"
                          name="remember"
                          checked={form.remember}
                          onChange={handleChange}
                          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        />
                        Ghi nhớ đăng nhập
                      </label>
                      <button type="button" className="font-medium text-zinc-900 hover:underline">
                        Quên mật khẩu?
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
                      <input
                        type="checkbox"
                        name="agree"
                        checked={form.agree}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                      />
                      <span>
                        Tôi đồng ý với điều khoản sử dụng, chính sách bảo mật và nhận thông báo ưu
                        đãi từ TungZone.
                      </span>
                    </label>
                  )}

                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative mt-2 inline-flex w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-950 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:shadow-[0_18px_30px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,59,48,0.18),rgba(48,209,88,0.14),rgba(64,200,255,0.18),rgba(255,45,149,0.16))] opacity-70" />
                    <span className="relative z-10">
                      {loading ? "Đang xử lý..." : content.button}
                    </span>
                  </button>
                </form>

                <div className="mt-6 rounded-[24px] bg-zinc-50 p-4 ring-1 ring-zinc-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">Hỗ trợ mua sắm dễ dàng</p>
                      <p className="mt-1 text-sm leading-6 text-zinc-500">
                        Lưu giỏ hàng, thanh toán nhanh, theo dõi đơn và bảo hành ngay trong tài khoản.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-sm ring-1 ring-zinc-200">
                      TungZone
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-center text-sm text-zinc-500">
                  {content.switchText}{" "}
                  <button
                    type="button"
                    onClick={() => handleModeChange(mode === "login" ? "register" : "login")}
                    className="font-semibold text-zinc-950 hover:underline"
                  >
                    {content.switchAction}
                  </button>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
