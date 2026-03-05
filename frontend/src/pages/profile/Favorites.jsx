import axios from "axios";
import { useEffect, useState } from "react";
import { BookCard } from "../../components/bookCard/BookCard";
import { Loader } from "../../components/Loader";

const BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://localhost:1000/api/v1";
const API_GET_FAVORITE_BOOKS = `${BASE_URL}/favorites`;
const API_REMOVE_FAVORITE = `${BASE_URL}/favorites`;

export const Favorites = () => {
  const [favoriteBooks, setFavoriteBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem sách yêu thích.");
      return;
    }

    const fetchFavorites = async () => {
      try {
        const response = await axios.get(API_GET_FAVORITE_BOOKS, {
          headers: {
            Authorization: `Bearer ${token}`,
            id,
          },
        });

        const list = response.data?.data;
        setFavoriteBooks(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Lỗi tải sách yêu thích", err);
        const msg =
          err.response?.data?.error ||
          "Không thể tải danh sách yêu thích. Vui lòng thử lại.";
        setError(msg);
        setFavoriteBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (bookId) => {
    const id = window.localStorage.getItem("id");
    const token = window.localStorage.getItem("token");

    if (!token || !id) {
      setError("Vui lòng đăng nhập lại để xóa sách yêu thích.");
      return;
    }

    try {
      await axios.delete(API_REMOVE_FAVORITE, {
        headers: {
          Authorization: `Bearer ${token}`,
          bookid: bookId,
          id,
        },
      });

      setFavoriteBooks((prev) =>
        Array.isArray(prev) ? prev.filter((book) => book._id !== bookId) : [],
      );
      window.alert("Đã xóa sách khỏi danh sách yêu thích");
    } catch (err) {
      console.error("Lỗi xóa sách yêu thích", err);
      const msg =
        err.response?.data?.error ||
        "Không thể xóa sách khỏi yêu thích. Vui lòng thử lại.";
      setError(msg);
    }
  };

  const hasFavorites = Array.isArray(favoriteBooks) && favoriteBooks.length > 0;

  return (
    <section className="min-h-[60vh] space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold text-zinc-100">
        Yêu thích
      </h1>
      <p className="text-sm md:text-base text-zinc-300">
        Danh sách sách yêu thích của bạn sẽ hiển thị tại đây.
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
      ) : hasFavorites ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {favoriteBooks.map((book) => (
            <BookCard
              data={book}
              favorite
              key={book._id}
              onRemove={() => handleRemoveFavorite(book._id)}
            />
          ))}
        </div>
      ) : (
        <output
          aria-live="polite"
          className="flex w-full flex-col items-center justify-center min-h-[40vh] text-zinc-500"
        >
          <svg
            aria-hidden="true"
            className="mb-4 h-24 w-24 text-zinc-500"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2.25l2.847 5.77 6.366.925-4.606 4.49 1.087 6.345L12 16.875l-5.694 2.905 1.087-6.345-4.606-4.49 6.366-.925L12 2.25z" />
          </svg>
          <p className="text-5xl font-semibold text-zinc-300">
            Chưa có sách yêu thích
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Thêm sách từ trang chi tiết sách để xem tại đây.
          </p>
        </output>
      )}
    </section>
  );
};
