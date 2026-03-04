import { BookOpen } from "lucide-react";
import { useState } from "react";
import { FaGripLines, FaXmark } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const navLinks = [
  { title: "Trang chủ", to: "/" },
  { title: "Tất cả sách", to: "/all-books" },
  { title: "Giỏ hàng", to: "/cart" },
  { title: "Trang cá nhân", to: "/profile" },
];

const Navbar = () => {
  const [mobileNav, setMobileNav] = useState("hidden");

  // Lấy trạng thái đăng nhập và vai trò từ Redux store
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const role = useSelector((state) => state.auth.role);

  // Tạo bản sao mảng links để không mutate mảng gốc
  const links = [...navLinks];

  // Nếu chưa đăng nhập, loại bỏ 2 phần tử từ index 2 (Giỏ hàng và Trang cá nhân)
  if (!isLoggedIn) {
    links.splice(2, 2);
  }

  return (
    <header className="bg-zinc-800 text-white">
      <nav className="flex justify-between items-center mx-auto px-2 md:px-4 py-4 max-w-7xl">
        <Link className="flex items-center gap-4" to="/">
          <div className="flex justify-center items-center bg-blue-500 rounded-full w-10 h-10">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="font-semibold text-2xl">Book Heaven</h1>
            {role === "admin" && (
              <span className="mt-0.5 inline-flex items-center justify-center rounded border border-yellow-400 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-yellow-300">
                Admin
              </span>
            )}
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {links.map((item) => (
            <Link
              className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 font-medium text-sm transition-all duration-300 cursor-pointer ${
                item.to === "/profile" && isLoggedIn
                  ? "border border-blue-500 px-3 py-1 rounded flex items-center justify-center text-blue-400"
                  : "hover:text-blue-500"
              }`}
              key={item.to}
              to={item.to}
            >
              {item.title}
            </Link>
          ))}
        </div>

        {!isLoggedIn && (
          <div className="hidden md:flex items-center gap-4">
            <Link
              className="bg-transparent hover:bg-white px-4 py-2 border border-blue-500 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 text-blue-500 hover:text-zinc-800 transition-colors duration-300 cursor-pointer"
              to="/login"
            >
              Đăng nhập
            </Link>
            <Link
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 text-white transition-colors duration-300 cursor-pointer"
              to="/signup"
            >
              Đăng ký
            </Link>
          </div>
        )}

        <button
          aria-expanded={mobileNav === "block"}
          aria-label="Mở menu điều hướng"
          className="block md:hidden items-center p-3 text-white text-2xl hover:text-zinc-400 transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800"
          onClick={() =>
            setMobileNav((prev) => (prev === "hidden" ? "block" : "hidden"))
          }
          type="button"
        >
          <FaGripLines />
        </button>
      </nav>

      <div
        className={`${mobileNav} md:hidden bg-zinc-800 h-screen w-full fixed top-0 left-0 z-50 flex flex-col items-center justify-center`}
      >
        <button
          aria-label="Đóng menu điều hướng"
          className="absolute top-4 right-4 p-3 text-white text-2xl hover:text-zinc-400 transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800"
          onClick={() => setMobileNav("hidden")}
          type="button"
        >
          <FaXmark />
        </button>
        <div className="flex flex-col items-center">
          {links.map((item) => (
            <Link
              className={`text-4xl font-semibold mb-8 transition-colors duration-300 ${
                item.to === "/profile" && isLoggedIn
                  ? "text-blue-300 border border-blue-500 rounded px-4 py-2 flex items-center justify-center"
                  : "text-white hover:text-blue-400"
              }`}
              key={item.to}
              onClick={() => setMobileNav("hidden")}
              to={item.to}
            >
              {item.title}
            </Link>
          ))}

          {!isLoggedIn && (
            <div className="mt-4 flex flex-col items-center gap-4">
              <Link
                className="text-3xl bg-transparent hover:bg-white px-6 py-3 border border-blue-500 rounded text-blue-500 hover:text-zinc-800 transition-colors duration-300 cursor-pointer"
                onClick={() => setMobileNav("hidden")}
                to="/login"
              >
                Đăng nhập
              </Link>
              <Link
                className="text-3xl bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded text-white transition-colors duration-300 cursor-pointer"
                onClick={() => setMobileNav("hidden")}
                to="/signup"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
