import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader } from "../components/Loader.jsx";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const ViewBookDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:gap-8">
        <div className="flex shrink-0 flex-col md:w-1/2">
          <div className="aspect-3/4 w-full overflow-hidden rounded-lg bg-zinc-800">
            <img
              alt={title}
              className="h-full w-full object-cover"
              decoding="async"
              loading="lazy"
              src={image_url}
            />
          </div>
          <div className="mt-4 flex gap-3">
            {/* Chừa không gian cho nút Thêm vào yêu thích / Thêm vào giỏ hàng (Redux) */}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-lg bg-zinc-800 p-4 md:w-1/2 md:p-6">
          <h1 className="text-3xl font-semibold leading-tight text-zinc-100 md:text-4xl">
            {title}
          </h1>
          <p className="text-zinc-400">{author}</p>
          {description ? (
            <div className="flex flex-col gap-1">
              <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
                Mô tả
              </h2>
              <p className="text-zinc-300 leading-relaxed">{description}</p>
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
    </section>
  );
};

export default ViewBookDetails;
