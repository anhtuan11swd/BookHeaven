import { NavLink } from "react-router-dom";

const navItemClasses = ({ isActive }) =>
  [
    "flex min-h-[44px] min-w-[44px] flex-1 items-center justify-center rounded-md px-3 py-3 text-sm font-medium transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800",
    isActive
      ? "bg-zinc-900 text-white"
      : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
  ].join(" ");

export const MobileNav = () => {
  return (
    <nav
      aria-label="Điều hướng tài khoản"
      className="flex w-full items-center justify-between gap-2 rounded-lg bg-zinc-800 p-2 lg:hidden"
    >
      <NavLink className={navItemClasses} end to="/profile">
        Yêu thích
      </NavLink>
      <NavLink className={navItemClasses} to="/profile/order-history">
        Lịch sử đơn hàng
      </NavLink>
      <NavLink className={navItemClasses} to="/profile/settings">
        Cài đặt
      </NavLink>
    </nav>
  );
};
