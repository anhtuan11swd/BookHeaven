import express from "express";
import rateLimit from "express-rate-limit";
import {
  getAllOrders,
  getMyOrders,
  placeOrderFromCart,
  updateOrderStatus,
} from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/auth.js";

export const orderRouter = express.Router();

// Rate limiter cho orders API - giới hạn 50 requests / 15 phút
const ordersLimiter = rateLimit({
  handler: (_req, res) => {
    return res.status(429).json({
      code: 429,
      error: "Quá nhiều yêu cầu orders, vui lòng thử lại sau",
    });
  },
  max: 50,
  message: undefined,
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

orderRouter.post(
  "/place-order",
  authenticateToken,
  ordersLimiter,
  placeOrderFromCart,
);

orderRouter.post(
  "/orders/place",
  authenticateToken,
  ordersLimiter,
  placeOrderFromCart,
);

orderRouter.get("/orders/my", authenticateToken, ordersLimiter, getMyOrders);

orderRouter.get("/orders", authenticateToken, ordersLimiter, getAllOrders);

orderRouter.patch(
  "/orders/:orderId/status",
  authenticateToken,
  ordersLimiter,
  updateOrderStatus,
);
