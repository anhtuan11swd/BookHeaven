import axios from "axios";
import { useEffect, useState } from "react";
import { FaEdit, FaHeart, FaShoppingCart, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { Loader } from "../components/Loader.jsx";

const BASE_URL = import.meta.env.VITE_BASE_URL;
const API_ADD_FAVORITE = `${BASE_URL}/favorites`;
const API_ADD_TO_CART = `${BASE_URL}/cart`;

const ViewBookDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const role = useSelector((state) => state.auth.role);

  const handleFavorite = async () => {
    const userId = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!userId || !token) {
      alert("Vui lòng đăng nhập để thêm sách vào danh sách yêu thích.");
      return;
    }

    try {
      const response = await axios.put(
        API_ADD_FAVORITE,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            bookid: id,
            id: userId,
          },
        },
      );

      const message =
        response?.data?.message || "Đã thêm sách vào danh sách yêu thích";
      alert(message);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.error ||
        "Không thể thêm sách vào danh sách yêu thích. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  const handleCart = async () => {
    const userId = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!userId || !token) {
      alert("Vui lòng đăng nhập để thêm sách vào giỏ hàng.");
      return;
    }

    try {
      const response = await axios.put(
        API_ADD_TO_CART,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            bookid: id,
            id: userId,
          },
        },
      );

      const message = response?.data?.message || "Đã thêm sách vào giỏ hàng";
      alert(message);
    } catch (err) {
      const errorMessage =
        err?.response?.data?.error ||
        "Không thể thêm sách vào giỏ hàng. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${BASE_URL}/books/get-book-by-id/${id}`,
        );
        setData(response.data.book ?? null);
      } catch (err) {
        if (err?.response?.status === 404 || err?.response?.status === 400) {
          setData(null);
        } else {
          console.error("Lỗi tải chi tiết sách:", err?.message ?? err);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <section className="min-h-screen bg-zinc-900 px-4 py-8 md:px-12">
        <Loader />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-900 px-4 py-8 text-zinc-300 md:px-12">
        <p className="text-center">Không tìm thấy sách.</p>
        <div className="flex gap-4">
          <Link
            className="cursor-pointer rounded bg-zinc-700 px-4 py-3 text-zinc-100 transition-colors duration-200 hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            to="/"
          >
            Về trang chủ
          </Link>
          <Link
            className="cursor-pointer rounded bg-zinc-700 px-4 py-3 text-zinc-100 transition-colors duration-200 hover:bg-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
            to="/all-books"
          >
            Tất cả sách
          </Link>
        </div>
      </section>
    );
  }

  const { title, author, description, image_url, language, price } = data;
  const priceFormatted =
    typeof price === "number"
      ? `${price.toLocaleString("vi-VN")} ₫`
      : String(price ?? "");

  return (
    <section
      aria-label="Chi tiết sách"
      className="min-h-screen bg-zinc-900 px-4 py-8 md:px-12"
    >
      <div className="mx-auto w-full max-w-6xl rounded-2xl bg-zinc-800 p-6 md:p-8 lg:p-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          <div className="flex shrink-0 flex-col lg:w-5/12">
            <div className="h-[30vh] w-full overflow-hidden rounded-xl bg-zinc-900/60 sm:h-[40vh] md:h-[50vh] lg:h-[60vh]">
              <img
                alt={title}
                className="h-full w-full object-cover"
                decoding="async"
                loading="lazy"
                src={image_url}
              />
            </div>
            {isLoggedIn && (
              <div className="mt-8 flex flex-col items-center gap-4 lg:mt-0 lg:items-start">
                {role === "user" && (
                  <>
                    <button
                      aria-label="Thêm vào giỏ hàng"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-base font-medium text-zinc-900 shadow-md transition-colors duration-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                      onClick={handleCart}
                      type="button"
                    >
                      <FaShoppingCart className="text-blue-500" />
                      <span>Thêm vào giỏ hàng</span>
                    </button>
                    <button
                      aria-label="Thêm vào danh sách yêu thích"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-base font-medium text-zinc-900 shadow-md transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                      onClick={handleFavorite}
                      type="button"
                    >
                      <FaHeart className="text-red-500" />
                      <span>Yêu thích</span>
                    </button>
                  </>
                )}

                {role === "admin" && (
                  <>
                    <button
                      aria-label="Chỉnh sửa sách"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-base font-medium text-zinc-900 shadow-md transition-colors duration-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                      type="button"
                    >
                      <FaEdit className="text-zinc-700" />
                      <span>Sửa sách</span>
                    </button>
                    <button
                      aria-label="Xóa sách"
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-base font-medium text-red-500 shadow-md transition-colors duration-200 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
                      type="button"
                    >
                      <FaTrash />
                      <span>Xóa sách</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-xl bg-zinc-900/40 p-4 md:p-6 lg:mt-0 lg:w-7/12">
            <h1 className="text-3xl font-semibold leading-tight text-zinc-100 md:text-4xl">
              {title}
            </h1>
            <p className="text-zinc-400">{author}</p>
            {description ? (
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                  Mô tả
                </h2>
                <p className="leading-relaxed text-zinc-300">{description}</p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-4">
              <div>
                <span className="text-sm text-zinc-500">Ngôn ngữ: </span>
                <span className="text-zinc-300">{language}</span>
              </div>
              <div>
                <span className="text-sm text-zinc-500">Giá: </span>
                <span className="text-xl font-semibold text-zinc-200">
                  {priceFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ViewBookDetails;
