import { z } from "zod";
import { Order } from "../models/order.js";
import { User } from "../models/user.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const orderItemSchema = z.object({
  bookId: z
    .string()
    .regex(objectIdRegex, {
      message: "ID sách không hợp lệ",
    })
    .trim(),
});

const orderIdSchema = z.object({
  orderId: z
    .string()
    .regex(objectIdRegex, {
      message: "ID đơn hàng không hợp lệ",
    })
    .trim(),
});

const updateStatusSchema = z.object({
  status: z.enum(["Đã đặt hàng", "Đang giao hàng", "Đã giao", "Đã hủy"], {
    message: "Trạng thái đơn hàng không hợp lệ",
  }),
});

/**
 * Tạo đơn hàng cho người dùng
 * - Nếu body có mảng items: tạo đơn hàng từ danh sách bookId trong body
 * - Ngược lại: tạo đơn hàng từ giỏ hàng của người dùng
 * POST /api/v1/orders/place
 * POST /api/v1/place-order
 */
export const placeOrderFromCart = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const items = req.body?.items;

    if (Array.isArray(items) && items.length > 0) {
      const parsedItems = z.array(orderItemSchema).safeParse(items);

      if (!parsedItems.success) {
        const message =
          parsedItems.error.errors[0]?.message ??
          "Dữ liệu đơn hàng không hợp lệ";

        return res.status(400).json({
          code: 400,
          error: message,
        });
      }

      const validItems = parsedItems.data;
      const createdOrders = [];

      // Tạo từng đơn hàng bằng vòng lặp for...of
      for (const item of validItems) {
        const newOrder = await Order.create({
          book: item.bookId,
          status: "Đã đặt hàng",
          user: userId,
        });

        createdOrders.push(newOrder);

        await User.findByIdAndUpdate(userId, {
          $push: { orders: newOrder._id },
        });
      }

      return res.status(200).json({
        code: 200,
        data: createdOrders,
        message: "Đã tạo đơn hàng từ danh sách truyền vào",
      });
    }

    const user = await User.findById(userId).select("cart orders");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const cartBooks = Array.isArray(user.cart) ? user.cart : [];

    if (cartBooks.length === 0) {
      return res.status(400).json({
        code: 400,
        error: "Giỏ hàng trống",
      });
    }

    const ordersToCreate = cartBooks.map((bookId) => ({
      book: bookId,
      status: "Đã đặt hàng",
      user: userId,
    }));

    const createdOrders = await Order.insertMany(ordersToCreate);

    const orderIds = createdOrders.map((order) => order._id);

    await User.findByIdAndUpdate(userId, {
      $push: { orders: { $each: orderIds } },
      $set: { cart: [] },
    });

    return res.status(200).json({
      code: 200,
      data: createdOrders,
      message: "Đã tạo đơn hàng và làm trống giỏ hàng",
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
      error: "Lỗi máy chủ khi xử lý yêu cầu tạo đơn hàng",
    });
  }
};

/**
 * Lấy danh sách đơn hàng của chính người dùng
 * GET /api/v1/orders/my
 */
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const orders = await Order.find({ user: userId })
      .populate("book")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      code: 200,
      data: orders,
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
      error: "Lỗi máy chủ khi xử lý yêu cầu lấy đơn hàng",
    });
  }
};

/**
 * Lấy toàn bộ đơn hàng (chỉ admin)
 * GET /api/v1/orders
 */
export const getAllOrders = async (req, res) => {
  try {
    const role = req.user?.role;

    if (role !== "admin") {
      return res.status(403).json({
        code: 403,
        error: "Không có quyền truy cập",
      });
    }

    const orders = await Order.find({})
      .populate("user", "username email address role")
      .populate("book")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      code: 200,
      data: orders,
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
      error: "Lỗi máy chủ khi xử lý yêu cầu lấy toàn bộ đơn hàng",
    });
  }
};

/**
 * Cập nhật trạng thái đơn hàng (chỉ admin)
 * PATCH /api/v1/orders/:orderId/status
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const role = req.user?.role;

    if (role !== "admin") {
      return res.status(403).json({
        code: 403,
        error: "Không có quyền truy cập",
      });
    }

    const orderIdRaw =
      req.params.orderId ??
      req.headers.orderid ??
      req.body?.orderId ??
      req.query?.orderId;

    const statusRaw = req.body?.status;

    const parsedId = orderIdSchema.safeParse({ orderId: orderIdRaw });

    if (!parsedId.success) {
      const message =
        parsedId.error.errors[0]?.message ?? "ID đơn hàng không hợp lệ";

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const parsedStatus = updateStatusSchema.safeParse({ status: statusRaw });

    if (!parsedStatus.success) {
      const message =
        parsedStatus.error.errors[0]?.message ??
        "Trạng thái đơn hàng không hợp lệ";

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const orderId = parsedId.data.orderId;
    const status = parsedStatus.data.status;

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true },
    );

    if (!updatedOrder) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy đơn hàng",
      });
    }

    return res.status(200).json({
      code: 200,
      data: updatedOrder,
      message: "Cập nhật trạng thái đơn hàng thành công",
    });
  } catch (_error) {
    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ khi xử lý yêu cầu cập nhật trạng thái đơn hàng",
    });
  }
};
