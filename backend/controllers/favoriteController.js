import { z } from "zod";
import { User } from "../models/user.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Schema xác thực bookId
const bookIdSchema = z.object({
  bookId: z
    .string()
    .regex(objectIdRegex, {
      message: "ID sách không hợp lệ",
    })
    .trim(),
});

/**
 * Thêm sách vào danh sách yêu thích
 * PUT /api/v1/favorites
 */
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const bookIdRaw =
      req.headers.bookid ?? req.body?.bookId ?? req.query?.bookId;

    // Validate bookId bằng Zod
    const parsed = bookIdSchema.safeParse({ bookId: bookIdRaw });

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "ID sách không hợp lệ";
      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const bookId = parsed.data.bookId;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const user = await User.findById(userId).select("favorites");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const isExist =
      Array.isArray(user.favorites) &&
      user.favorites.some((fav) => fav.toString() === bookId.toString());

    if (isExist) {
      return res.status(200).json({
        code: 200,
        message: "Sách đã có trong danh sách yêu thích",
      });
    }

    await User.findByIdAndUpdate(userId, {
      $push: { favorites: bookId },
    });

    return res.status(200).json({
      code: 200,
      message: "Đã thêm sách vào danh sách yêu thích",
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        code: 400,
        error: "ID không hợp lệ",
      });
    }

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ khi xử lý yêu cầu thêm sách yêu thích",
    });
  }
};

/**
 * Xóa sách khỏi danh sách yêu thích
 * DELETE /api/v1/favorites
 */
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const bookIdRaw =
      req.headers.bookid ?? req.body?.bookId ?? req.query?.bookId;

    // Validate bookId bằng Zod
    const parsed = bookIdSchema.safeParse({ bookId: bookIdRaw });

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "ID sách không hợp lệ";
      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const bookId = parsed.data.bookId;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const user = await User.findById(userId).select("favorites");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const isExist =
      Array.isArray(user.favorites) &&
      user.favorites.some((fav) => fav.toString() === bookId.toString());

    if (!isExist) {
      return res.status(404).json({
        code: 404,
        error: "Sách không tồn tại trong danh sách yêu thích",
      });
    }

    await User.findByIdAndUpdate(userId, { $pull: { favorites: bookId } });

    return res.status(200).json({
      code: 200,
      message: "Đã xóa sách khỏi danh sách yêu thích",
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        code: 400,
        error: "ID không hợp lệ",
      });
    }

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ khi xử lý yêu cầu xóa sách yêu thích",
    });
  }
};

/**
 * Lấy danh sách sách yêu thích của người dùng
 * GET /api/v1/favorites
 */
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        error: "Thiếu userId",
      });
    }

    const userData = await User.findById(userId)
      .select("favorites")
      .populate("favorites");

    if (!userData) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const favoriteBooks = Array.isArray(userData.favorites)
      ? userData.favorites
      : [];

    return res.status(200).json({
      code: 200,
      data: favoriteBooks,
      status: "Thành công",
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        code: 400,
        error: "ID không hợp lệ",
      });
    }

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ khi xử lý yêu cầu lấy sách yêu thích",
    });
  }
};
