import axios from "axios";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Loader } from "../../components/Loader";

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://localhost:1000/api/v1";
const API_UPDATE_ADDRESS = `${BASE_URL}/update-address`;

export const Settings = () => {
  const { profile } = useOutletContext() ?? {};
  const [address, setAddress] = useState(profile?.address ?? "");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  useEffect(() => {
    setAddress(profile?.address ?? "");
  }, [profile?.address]);

  if (!profile) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </section>
    );
  }

  const handleUpdateAddress = async () => {
    const token = window.localStorage.getItem("token");
    if (!token) {
      setUpdateError("Yêu cầu đăng nhập.");
      return;
    }
    setUpdateError("");
    setUpdating(true);
    try {
      const response = await axios.put(
        API_UPDATE_ADDRESS,
        { address },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const message = response.data?.message ?? "Cập nhật địa chỉ thành công";
      alert(message);
    } catch (err) {
      const msg =
        err.response?.data?.error ??
        "Không thể cập nhật địa chỉ. Vui lòng thử lại.";
      setUpdateError(msg);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <section className="min-h-[60vh] space-y-4 text-zinc-100">
      <h1 className="text-2xl font-semibold text-zinc-100 md:text-3xl">
        Cài đặt
      </h1>

      <div className="flex flex-col gap-12">
        <div>
          <div className="mb-1 block text-sm font-medium text-zinc-300">
            Tên người dùng
          </div>
          <p className="rounded bg-zinc-800/60 px-3 py-2 text-zinc-100">
            {profile?.username ?? "—"}
          </p>
        </div>

        <div>
          <div className="mb-1 block text-sm font-medium text-zinc-300">
            Email
          </div>
          <p className="rounded bg-zinc-800/60 px-3 py-2 text-zinc-100 break-all">
            {profile?.email ?? "—"}
          </p>
        </div>

        <div>
          <label
            className="mb-1 block text-sm font-medium text-zinc-300"
            htmlFor="settings-address"
          >
            Địa chỉ
          </label>
          <textarea
            className="w-full rounded border border-zinc-600 bg-zinc-800/60 px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="settings-address"
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Nhập địa chỉ giao hàng"
            rows={4}
            value={address}
          />
        </div>

        {updateError && (
          <p className="text-sm text-red-400" role="alert">
            {updateError}
          </p>
        )}

        <button
          className="w-fit rounded bg-yellow-500 px-4 py-2 font-bold text-zinc-900 transition-colors hover:bg-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 disabled:opacity-60"
          disabled={updating}
          onClick={handleUpdateAddress}
          type="button"
        >
          {updating ? "Đang cập nhật…" : "Cập nhật"}
        </button>
      </div>
    </section>
  );
};
