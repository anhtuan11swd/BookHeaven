import { Link } from "react-router-dom";
import heroImg from "../../assets/hero.png";

export const Hero = () => {
  return (
    <section className="bg-zinc-900 text-white">
      <div className="mx-auto flex min-h-[75vh] max-w-7xl flex-col items-center justify-center gap-8 px-2 py-8 md:px-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full flex-col items-center text-center lg:w-3/6 lg:items-start lg:text-left">
          <h1 className="text-4xl font-semibold leading-tight text-yellow-100 lg:text-6xl">
            Khám phá thế giới sách tại BookHeaven
          </h1>
          <p className="mt-4 max-w-xl text-xl text-zinc-300 lg:text-2xl">
            Tìm cuốn sách tiếp theo bạn yêu thích từ bộ sưu tập được tuyển chọn
            kỹ lưỡng, dành riêng cho những tâm hồn yêu đọc.
          </p>
          <div className="mt-8">
            <Link
              className="inline-flex items-center justify-center rounded-full border border-yellow-100 px-10 py-3 text-xl font-semibold text-yellow-100 cursor-pointer transition-colors duration-200 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-yellow-200 focus:ring-offset-2 focus:ring-offset-zinc-900"
              to="/all-books"
            >
              Khám phá sách
            </Link>
          </div>
        </div>

        <div className="flex w-full items-center justify-center lg:w-3/6">
          <img
            alt="Hình minh họa sách BookHeaven"
            className="w-full h-auto max-w-md rounded-3xl object-contain lg:h-full"
            src={heroImg}
          />
        </div>
      </div>
    </section>
  );
};
