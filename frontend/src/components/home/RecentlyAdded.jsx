import axios from "axios";
import { useEffect, useState } from "react";
import { BookCard } from "../bookCard/BookCard.jsx";
import { Loader } from "../Loader.jsx";

const API_RECENT_BOOKS = import.meta.env.VITE_API_RECENT_BOOKS;

export const RecentlyAdded = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentBooks = async () => {
      try {
        const response = await axios.get(API_RECENT_BOOKS);
        setBooks(response.data.books ?? []);
      } catch (err) {
        console.error("Lỗi tải sách mới:", err?.message ?? err);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBooks();
  }, []);

  return (
    <section className="mb-8">
      <div className="mx-auto mt-8 max-w-7xl px-4">
        <h2 className="text-3xl font-semibold text-yellow-100">
          Sách Mới Thêm Gần Đây
        </h2>
        <div className="mt-4">
          {loading ? (
            <Loader />
          ) : books.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              Hiện chưa có sách mới được thêm.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {books.map((item) => (
                <BookCard data={item} key={item._id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
