import axios from "axios";
import { useEffect, useState } from "react";
import { BookCard } from "../components/bookCard/BookCard.jsx";
import { Loader } from "../components/Loader.jsx";

const API_ALL_BOOKS = import.meta.env.VITE_API_ALL_BOOKS;

const AllBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllBooks = async () => {
      try {
        const response = await axios.get(API_ALL_BOOKS);
        setBooks(response.data.books ?? []);
      } catch (err) {
        console.error("Lỗi tải tất cả sách:", err?.message ?? err);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBooks();
  }, []);

  return (
    <section className="bg-zinc-900 min-h-screen py-8 px-4 text-zinc-100">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-semibold text-yellow-100">All Books</h1>
        <div className="mt-4">
          {loading ? (
            <Loader />
          ) : books.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-400">
              Hiện chưa có sách trong hệ thống.
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

export default AllBooks;
