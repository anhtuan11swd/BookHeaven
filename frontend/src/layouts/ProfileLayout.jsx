import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader } from "../components/Loader";
import { MobileNav } from "../components/profile/MobileNav";
import { Sidebar } from "../components/profile/Sidebar";

export const ProfileLayout = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const _isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    // Kiểm tra localStorage trực tiếp thay vì Redux state để tránh redirect khi reload
    if (!id || !token) {
      navigate("/login");
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const url =
          import.meta.env.VITE_API_USER_INFO ||
          "http://localhost:1000/api/v1/get-user-information";

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            id,
          },
        });

        setProfile(response.data?.user ?? null);
      } catch (err) {
        // Không log chi tiết dữ liệu nhạy cảm
        console.error("Lỗi tải thông tin người dùng", err);
        setError("Không thể tải thông tin người dùng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-zinc-900 text-white">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <section className="min-h-screen bg-zinc-900 text-white flex items-center justify-center px-4">
        <p className="text-center text-red-400 text-sm md:text-base">{error}</p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-900 px-4 py-6 text-white md:px-8">
      <div className="mx-auto flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="w-full flex flex-col gap-2 lg:w-1/6">
          <aside className="hidden lg:flex lg:h-screen">
            <div className="w-full rounded-lg bg-zinc-800 p-4">
              <Sidebar data={profile} />
            </div>
          </aside>
          <MobileNav />
        </div>

        <div className="mt-4 w-full lg:mt-8 lg:w-5/6">
          <div className="rounded-lg bg-zinc-800/40 p-4 md:p-6">
            <Outlet context={{ profile }} />
          </div>
        </div>
      </div>
    </section>
  );
};
