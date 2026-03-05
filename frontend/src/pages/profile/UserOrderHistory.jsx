import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader } from "../../components/Loader";

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://localhost:1000/api/v1";
const API_ORDER_HISTORY = `${BASE_URL}/orders/my`;

const formatPrice = (value) => {
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    style: "currency",
  }).format(value);
};

const truncate = (str, maxLen = 50) => {
  if (!str || typeof str !== "string") return "—";
  return str.length <= maxLen ? str : `${str.slice(0, maxLen)}…`;
};

const getStatusClass = (status) => {
  if (!status) return "text-zinc-300";
  if (status === "Đã đặt hàng") return "text-yellow-500";
  if (status === "Đã hủy") return "text-red-500";
  return "text-green-500";
};

export const UserOrderHistory = () => {
  const [orderHistory, setOrderHistory] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("token");

    if (!token) {
      setError("Yêu cầu mã xác thực. Vui lòng đăng nhập.");
      setOrderHistory([]);
      setLoading(false);
      return;
    }

    const fetchOrderHistory = async () => {
      try {
        const response = await axios.get(API_ORDER_HISTORY, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = response.data?.data;
        setOrderHistory(Array.isArray(data) ? data : []);
      } catch (err) {
        const msg =
          err.response?.data?.error ||
          "Không thể tải lịch sử đơn hàng. Vui lòng thử lại.";
        setError(msg);
        setOrderHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  const hasOrders = Array.isArray(orderHistory) && orderHistory.length > 0;
  const isEmpty =
    !loading && Array.isArray(orderHistory) && orderHistory.length === 0;

  return (
    <section className="min-h-[60vh] space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100">
        Lịch sử đơn hàng
      </h1>
      <p className="text-sm md:text-base text-zinc-300">
        Lịch sử đơn hàng của bạn sẽ được hiển thị tại đây.
      </p>

      {error && (
        <p className="text-red-400 text-sm md:text-base" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader />
        </div>
      ) : isEmpty ? (
        <output
          aria-live="polite"
          className="flex min-h-[40vh] w-full flex-col items-center justify-center text-zinc-500"
        >
          <svg
            aria-hidden="true"
            className="mb-4 h-24 w-24 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
            />
          </svg>
          <p className="text-xl font-semibold text-zinc-300">
            Chưa có lịch sử đơn hàng
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Chưa có đơn hàng nào. Đơn hàng của bạn sẽ hiển thị tại đây.
          </p>
        </output>
      ) : hasOrders ? (
        <div className="overflow-x-auto rounded-lg bg-zinc-800 p-4">
          <table className="w-full table-auto border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-600 text-zinc-400">
                <th className="w-[3%] py-3 pr-2">STT</th>
                <th className="w-[22%] py-3 pr-2">Sách</th>
                <th className="w-[45%] py-3 pr-2">Mô tả</th>
                <th className="w-[9%] py-3 pr-2">Giá</th>
                <th className="w-[16%] py-3 pr-2">Trạng thái</th>
                <th className="hidden w-[5%] py-3 pr-2 md:table-cell">
                  Thanh toán
                </th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {orderHistory.map((order, index) => {
                const book = order.book;
                return (
                  <tr
                    className="border-b border-zinc-700 last:border-0"
                    key={order._id}
                  >
                    <td className="py-3 pr-2">{index + 1}</td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        {book?.image_url ? (
                          <img
                            alt={book.title || "Sách"}
                            className="h-10 w-10 shrink-0 rounded object-cover"
                            src={book.image_url}
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-zinc-700 text-xs">
                            —
                          </span>
                        )}
                        {book?._id ? (
                          <Link
                            aria-label={`Xem chi tiết: ${book.title ?? "Sách"}`}
                            className="line-clamp-2 cursor-pointer hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-800 rounded"
                            to={`/view-book-details/${book._id}`}
                          >
                            {book?.title ?? "—"}
                          </Link>
                        ) : (
                          <span className="line-clamp-2">
                            {book?.title ?? "—"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-2">
                      <span className="line-clamp-2">
                        {truncate(book?.description)}
                      </span>
                    </td>
                    <td className="py-3 pr-2">{formatPrice(book?.price)}</td>
                    <td className={`py-3 pr-2 ${getStatusClass(order.status)}`}>
                      {order.status ?? "—"}
                    </td>
                    <td className="hidden py-3 pr-2 md:table-cell">COD</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
};
