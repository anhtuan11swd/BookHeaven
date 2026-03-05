import { useDispatch } from "react-redux";
import { NavLink, useNavigate } from "react-router-dom";
import { authActions } from "../../store/auth";

export const Sidebar = ({ data }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const initial =
    data?.username && data.username.length > 0
      ? data.username.charAt(0).toUpperCase()
      : "?";

  const handleLogout = () => {
    window.localStorage.removeItem("id");
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("role");

    dispatch(authActions.logout());
    navigate("/login");
  };

  const renderAvatar = () => {
    if (data?.avatar) {
      return (
        <img
          alt={data.username || "Ảnh đại diện"}
          className="h-12 w-12 rounded-full object-cover"
          src={data.avatar}
        />
      );
    }

    return (
      <span aria-hidden="true" className="text-lg font-semibold">
        {initial}
      </span>
    );
  };

  const navItemClasses = ({ isActive }) =>
    [
      "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium cursor-pointer transition-all duration-200",
      isActive
        ? "bg-zinc-900 text-white"
        : "text-zinc-300 hover:bg-zinc-800 hover:text-white",
    ].join(" ");

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 text-white">
            {renderAvatar()}
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-lg md:text-xl font-semibold text-zinc-100">
              {data?.username || "Người dùng"}
            </span>
            {data?.email && (
              <span className="mt-1 text-xs md:text-sm text-zinc-300 break-all">
                {data.email}
              </span>
            )}
          </div>
        </div>

        <nav className="mt-4 flex flex-col gap-1">
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
      </div>

      <div className="mt-4 md:mt-6">
        <button
          className="w-full rounded-md bg-zinc-900 py-2 text-sm font-medium text-zinc-100 cursor-pointer transition-colors duration-200 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800"
          onClick={handleLogout}
          type="button"
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
};
