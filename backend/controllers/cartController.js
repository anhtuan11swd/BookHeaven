import { z } from "zod";
import { User } from "../models/user.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Schema xác thực bookId cho giỏ hàng
const bookIdSchema = z.object({
  bookId: z
    .string()
    .regex(objectIdRegex, {
      message: "ID sách không hợp lệ",
    })
    .trim(),
});

/**
 * Thêm sách vào giỏ hàng
 * PUT /api/v1/cart
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const bookIdRaw =
      req.headers.bookid ?? req.body?.bookId ?? req.query?.bookId;

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

    const user = await User.findById(userId).select("cart");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const isExist =
      Array.isArray(user.cart) &&
      user.cart.some((item) => item.toString() === bookId.toString());

    if (isExist) {
      return res.status(200).json({
        code: 200,
        message: "Sách đã có trong giỏ hàng",
      });
    }

    await User.findByIdAndUpdate(userId, {
      $push: { cart: bookId },
    });

    return res.status(200).json({
      code: 200,
      message: "Đã thêm sách vào giỏ hàng",
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
      error: "Lỗi máy chủ khi xử lý yêu cầu thêm sách vào giỏ hàng",
    });
  }
};

/**
 * Xóa sách khỏi giỏ hàng
 * PUT /api/v1/cart/remove/:bookId
 */
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const bookIdRaw =
      req.params.bookId ??
      req.headers.bookid ??
      req.body?.bookId ??
      req.query?.bookId;

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

    const user = await User.findById(userId).select("cart");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const isExist =
      Array.isArray(user.cart) &&
      user.cart.some((item) => item.toString() === bookId.toString());

    if (!isExist) {
      return res.status(404).json({
        code: 404,
        error: "Sách không có trong giỏ hàng",
      });
    }

    await User.findByIdAndUpdate(userId, { $pull: { cart: bookId } });

    return res.status(200).json({
      code: 200,
      message: "Đã xóa sách khỏi giỏ hàng",
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
      error: "Lỗi máy chủ khi xử lý yêu cầu xóa sách khỏi giỏ hàng",
    });
  }
};

/**
 * Lấy danh sách sách trong giỏ hàng của người dùng
 * GET /api/v1/cart
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(400).json({
        code: 400,
        error: "Thiếu userId",
      });
    }

    const userData = await User.findById(userId)
      .select("cart")
      .populate("cart");

    if (!userData) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const cartBooks = Array.isArray(userData.cart) ? userData.cart : [];
    const reversed = [...cartBooks].reverse();

    return res.status(200).json({
      code: 200,
      data: reversed,
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
      error: "Lỗi máy chủ khi xử lý yêu cầu lấy giỏ hàng",
    });
  }
};
