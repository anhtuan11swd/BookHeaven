import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Outlet, useNavigate } from "react-router-dom";
import { Loader } from "../components/Loader";
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
    <section className="min-h-screen bg-zinc-900 text-white px-4 py-6 md:px-8">
      <div className="mx-auto flex flex-col gap-4 md:flex-row md:gap-6">
        <aside className="w-full md:w-1/6 md:h-screen">
          <div className="bg-zinc-800 rounded-lg p-4 h-full">
            <Sidebar data={profile} />
          </div>
        </aside>

        <div className="w-full md:w-5/6 mt-4 md:mt-0 lg:mt-8">
          <div className="bg-zinc-800/40 rounded-lg p-4 md:p-6">
            <Outlet context={{ profile }} />
          </div>
        </div>
      </div>
    </section>
  );
};
