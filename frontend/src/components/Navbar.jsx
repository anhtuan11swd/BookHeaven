import { BookOpen } from "lucide-react";

const navLinks = [
  { href: "/", title: "Trang chủ" },
  { href: "/about", title: "Về chúng tôi" },
  { href: "/books", title: "Tất cả sách" },
  { href: "/contact", title: "Liên hệ" },
];

const Navbar = () => {
  return (
    <header className="bg-zinc-800 text-white">
      <nav className="flex justify-between items-center mx-auto px-2 md:px-4 py-4 max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex justify-center items-center bg-blue-500 rounded-full w-10 h-10">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-semibold text-2xl">Thiên Đường Sách</h1>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {navLinks.map((item) => (
            <a
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 font-medium hover:text-blue-500 text-sm transition-all duration-300 cursor-pointer"
              href={item.href}
              key={item.href}
            >
              {item.title}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button
            className="bg-transparent hover:bg-white px-4 py-2 border border-blue-500 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 text-blue-500 hover:text-zinc-800 transition-colors duration-300 cursor-pointer"
            type="button"
          >
            Đăng nhập
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 text-white transition-colors duration-300 cursor-pointer"
            type="button"
          >
            Đăng ký
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
