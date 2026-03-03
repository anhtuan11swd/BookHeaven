import mongoose from "mongoose";

export const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Kết nối cơ sở dữ liệu thành công");

    return { ok: true };
  } catch (_error) {
    console.error("Kết nối cơ sở dữ liệu thất bại");

    return {
      error: {
        code: 500,
        error: "Kết nối cơ sở dữ liệu thất bại",
      },
      ok: false,
    };
  }
};
