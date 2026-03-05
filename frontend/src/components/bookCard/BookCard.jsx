import { Link } from "react-router-dom";

export const BookCard = ({ data, favorite = false, onRemove }) => {
  if (!data) return null;

  const { _id, title, author, image_url, price } = data;

  return (
    <div className="flex flex-col gap-3">
      <Link
        className="flex flex-col rounded overflow-hidden bg-zinc-800 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
        to={`/view-book-details/${_id}`}
      >
        <img
          alt={title}
          className="h-[25vh] w-full object-cover rounded-t"
          src={image_url}
        />
        <div className="p-3 flex flex-col gap-1">
          <h3 className="mt-1 font-semibold text-xl text-zinc-100 line-clamp-2">
            {title}
          </h3>
          <p className="text-zinc-400 text-sm">{author}</p>
          <p className="text-zinc-200 text-xl font-semibold">
            {typeof price === "number"
              ? `${price.toLocaleString("vi-VN")} ₫`
              : price}
          </p>
        </div>
      </Link>

      {favorite && (
        <button
          className="inline-flex items-center justify-center rounded-md border border-yellow-500 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-600 hover:bg-yellow-100 cursor-pointer transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (onRemove) {
              onRemove();
            }
          }}
          type="button"
        >
          Xóa khỏi yêu thích
        </button>
      )}
    </div>
  );
};
