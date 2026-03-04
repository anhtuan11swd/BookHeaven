import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

const navLinks = [
  { title: "Trang chủ", to: "/" },
  { title: "Tất cả sách", to: "/all-books" },
  { title: "Giỏ hàng", to: "/cart" },
  { title: "Trang cá nhân", to: "/profile" },
];

const Navbar = () => {
  return (
    <header className="bg-zinc-800 text-white">
      <nav className="flex justify-between items-center mx-auto px-2 md:px-4 py-4 max-w-7xl">
        <Link className="flex items-center gap-4" to="/">
          <div className="flex justify-center items-center bg-blue-500 rounded-full w-10 h-10">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-semibold text-2xl">Book Heaven</h1>
        </Link>

        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((item) => (
            <Link
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 font-medium hover:text-blue-500 text-sm transition-all duration-300 cursor-pointer"
              key={item.to}
              to={item.to}
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
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
      </nav>
    </header>
  );
};

export default Navbar;
