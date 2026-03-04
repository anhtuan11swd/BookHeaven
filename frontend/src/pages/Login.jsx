import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { authActions } from "../store/auth.js";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [isPending, setIsPending] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { email, password } = formData;

    if (!email || !password) {
      window.alert("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setIsPending(true);
    try {
      const response = await axios.post(
        "http://localhost:1000/api/v1/login",
        formData,
      );

      const data = response?.data || {};
      const { token, user } = data;
      const { id, role } = user || {};

      if (!id || !token) {
        window.alert(
          "Đăng nhập không thành công. Thiếu thông tin phiên làm việc.",
        );
        return;
      }

      window.localStorage.setItem("id", id);
      window.localStorage.setItem("token", token);
      if (role) {
        window.localStorage.setItem("role", role);
      }

      dispatch(authActions.login());
      dispatch(authActions.changeRole(role || "user"));

      navigate("/profile");
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        "Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.";
      window.alert(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section
      aria-label="Đăng nhập"
      className="flex min-h-screen items-center justify-center bg-zinc-900 px-4 text-zinc-100"
    >
      <div className="w-full max-w-md rounded-lg bg-zinc-800 px-6 py-8 shadow-lg">
        <h1 className="text-center text-2xl font-semibold text-zinc-100">
          Đăng nhập
        </h1>

        <form className="mt-6" noValidate onSubmit={handleSubmit}>
          <div className="mt-4 flex flex-col gap-1">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-md bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 outline-none ring-1 ring-zinc-600 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-yellow-400"
              id="email"
              name="email"
              onChange={handleChange}
              placeholder="Nhập email"
              type="email"
              value={formData.email}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative mt-1">
              <input
                className="min-h-[44px] w-full rounded-md bg-zinc-900 px-3 py-2.5 pr-12 text-base text-zinc-100 outline-none ring-1 ring-zinc-600 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-yellow-400"
                id="password"
                name="password"
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                type={showPassword ? "text" : "password"}
                value={formData.password}
              />
              <button
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-0 top-0 flex h-full w-12 cursor-pointer items-center justify-center rounded-r-md text-zinc-400 transition-colors duration-200 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <button
            className="mt-6 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-md bg-yellow-400 px-4 py-3 text-base font-semibold text-zinc-900 transition-colors duration-200 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Đang xử lý…" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          Chưa có tài khoản?
          <Link
            className="ml-1 cursor-pointer text-yellow-300 underline-offset-2 transition-colors duration-200 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            to="/signup"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
