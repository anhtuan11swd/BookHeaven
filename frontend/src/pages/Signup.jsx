import { useState } from "react";
import { Link } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    address: "",
    email: "",
    password: "",
    username: "",
  });
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
    setIsPending(true);
    try {
      // TODO: Gửi dữ liệu form lên API signup ở bước tiếp theo
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section
      aria-label="Đăng ký"
      className="flex min-h-screen items-center justify-center bg-zinc-900 px-4 text-zinc-100"
    >
      <div className="w-full max-w-md rounded-lg bg-zinc-800 px-6 py-8 shadow-lg">
        <h1 className="text-center text-2xl font-semibold text-zinc-100">
          Đăng ký
        </h1>

        <form className="mt-6" noValidate onSubmit={handleSubmit}>
          <div className="mt-4 flex flex-col gap-1">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="mt-1 min-h-[44px] w-full rounded-md bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 outline-none ring-1 ring-zinc-600 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-yellow-400"
              id="username"
              name="username"
              onChange={handleChange}
              placeholder="Nhập username"
              type="text"
              value={formData.username}
            />
          </div>

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
            <input
              className="mt-1 min-h-[44px] w-full rounded-md bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 outline-none ring-1 ring-zinc-600 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-yellow-400"
              id="password"
              name="password"
              onChange={handleChange}
              placeholder="Nhập mật khẩu"
              type="password"
              value={formData.password}
            />
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <label
              className="text-sm font-medium text-zinc-300"
              htmlFor="address"
            >
              Địa chỉ
            </label>
            <textarea
              className="mt-1 min-h-[88px] w-full resize-y rounded-md bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 outline-none ring-1 ring-zinc-600 transition-shadow duration-200 focus-visible:ring-2 focus-visible:ring-yellow-400"
              id="address"
              name="address"
              onChange={handleChange}
              placeholder="Nhập địa chỉ"
              rows={3}
              value={formData.address}
            />
          </div>

          <button
            className="mt-6 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-md bg-yellow-400 px-4 py-3 text-base font-semibold text-zinc-900 transition-colors duration-200 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            type="submit"
          >
            {isPending ? "Đang xử lý…" : "Đăng ký"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          Đã có tài khoản?
          <Link
            className="ml-1 cursor-pointer text-yellow-300 underline-offset-2 transition-colors duration-200 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
            to="/login"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </section>
  );
};

export default Signup;
