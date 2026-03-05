import axios from "axios";
import { useEffect, useState } from "react";
import { AiFillDelete } from "react-icons/ai";
import { Link, useNavigate } from "react-router-dom";
import { Loader } from "../components/Loader";

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://localhost:1000/api/v1";
const API_CART = `${BASE_URL}/cart`;

export const Cart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem giỏ hàng.");
      return;
    }

    const fetchCart = async () => {
      try {
        const response = await axios.get(API_CART, {
          headers: {
            Authorization: `Bearer ${token}`,
            id,
          },
        });

        const data = response.data?.data;
        setCart(Array.isArray(data) ? data : []);
        setError("");
      } catch (err) {
        console.error("Lỗi tải giỏ hàng", err);
        const msg =
          err.response?.data?.error ||
          "Không thể tải giỏ hàng. Vui lòng thử lại.";
        setError(msg);
        setCart([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  useEffect(() => {
    if (!Array.isArray(cart) || cart.length === 0) {
      setTotal(0);
      return;
    }
    const sum = cart.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
    setTotal(sum);
  }, [cart]);

  const deleteItem = async (bookId) => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!token || !id) {
      setError("Vui lòng đăng nhập lại để xóa sách khỏi giỏ hàng.");
      return;
    }

    try {
      await axios.put(`${BASE_URL}/cart/remove/${bookId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          id,
        },
      });
      setCart((prev) =>
        Array.isArray(prev) ? prev.filter((b) => b._id !== bookId) : [],
      );
      alert("Đã xóa sách khỏi giỏ hàng");
    } catch (err) {
      console.error("Lỗi xóa sách khỏi giỏ hàng", err);
      const msg =
        err.response?.data?.error ||
        "Không thể xóa sách khỏi giỏ hàng. Vui lòng thử lại.";
      setError(msg);
    }
  };

  const placeOrder = async () => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!token || !id) {
      setError("Vui lòng đăng nhập để đặt hàng.");
      return;
    }

    if (!Array.isArray(cart) || cart.length === 0) return;

    setPlacingOrder(true);
    setError("");

    try {
      await axios.post(
        `${BASE_URL}/place-order`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            id,
          },
        },
      );
      alert("Đặt hàng thành công");
      setCart([]);
      navigate("/profile/order-history");
    } catch (err) {
      console.error("Lỗi đặt hàng", err);
      const msg =
        err.response?.data?.error || "Không thể đặt hàng. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setPlacingOrder(false);
    }
  };

  const hasItems = Array.isArray(cart) && cart.length > 0;

  return (
    <section className="min-h-screen overflow-x-hidden bg-zinc-900 p-4 sm:p-6 lg:p-12 text-white">
      <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100 mb-6">
        Giỏ hàng
      </h1>

      {error && (
        <p className="text-red-400 text-sm md:text-base mb-4" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="w-full h-screen flex items-center justify-center">
          <Loader />
        </div>
      ) : !hasItems ? (
        <output
          aria-live="polite"
          className="flex w-full flex-col items-center justify-center min-h-[60vh] text-zinc-500"
        >
          <svg
            aria-hidden="true"
            className="mb-6 h-32 w-32 sm:h-40 sm:w-40 text-zinc-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
            />
          </svg>
          <p className="text-2xl md:text-3xl font-semibold text-zinc-300">
            Giỏ hàng trống
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Thêm sách từ trang chi tiết sách để xem tại đây.
          </p>
          <Link
            className="mt-6 inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-amber-500 cursor-pointer min-h-[44px]"
            to="/all-books"
          >
            Xem sách
          </Link>
        </output>
      ) : (
        <div className="flex flex-col gap-4">
          {cart.map((item) => (
            <div
              className="flex flex-col sm:flex-row gap-4 rounded-xl bg-zinc-800 p-4 sm:p-6 items-center sm:items-stretch"
              key={item._id}
            >
              <Link
                className="shrink-0 rounded-lg overflow-hidden w-full sm:w-24 h-36 sm:h-28 bg-zinc-700 cursor-pointer"
                to={`/books/${item._id}`}
              >
                <img
                  alt={item.title}
                  className="w-full h-full object-cover"
                  src={item.image_url}
                />
              </Link>
              <div className="flex flex-col flex-1 min-w-0">
                <Link
                  className="text-zinc-100 font-medium hover:underline truncate cursor-pointer"
                  to={`/books/${item._id}`}
                >
                  {item.title}
                </Link>
                <p className="text-sm text-zinc-400 mt-0.5">{item.author}</p>
                <p className="text-zinc-200 mt-auto">
                  {typeof item.price === "number"
                    ? new Intl.NumberFormat("vi-VN", {
                        currency: "VND",
                        style: "currency",
                      }).format(item.price)
                    : item.price}
                </p>
              </div>
              <button
                aria-label="Xóa khỏi giỏ hàng"
                className="shrink-0 p-3 rounded-lg text-red-400 hover:bg-zinc-700 hover:text-red-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-amber-500 cursor-pointer"
                onClick={() => deleteItem(item._id)}
                type="button"
              >
                <AiFillDelete aria-hidden className="size-6" />
              </button>
            </div>
          ))}
          <div className="mt-4 rounded-xl bg-zinc-800 p-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-zinc-300">
              {cart.length} {cart.length === 1 ? "sách" : "sách"}
            </p>
            <p className="text-zinc-100 font-semibold">
              {new Intl.NumberFormat("vi-VN", {
                currency: "VND",
                style: "currency",
              }).format(total)}
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-amber-500 text-zinc-900 font-medium hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-amber-500 cursor-pointer min-h-[44px]"
              disabled={placingOrder || loading}
              onClick={placeOrder}
              type="button"
            >
              {placingOrder ? "Đang xử lý..." : "Hoàn tất đặt hàng"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Cart;
