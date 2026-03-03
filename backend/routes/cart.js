import express from "express";
import rateLimit from "express-rate-limit";
import {
  addToCart,
  getCart,
  removeFromCart,
} from "../controllers/cartController.js";
import { authenticateToken } from "../middleware/auth.js";

export const cartRouter = express.Router();

// Rate limiter cho cart API - giới hạn 50 requests / 15 phút
const cartLimiter = rateLimit({
  handler: (_req, res) => {
    return res.status(429).json({
      code: 429,
      error: "Quá nhiều yêu cầu cart, vui lòng thử lại sau",
    });
  },
  max: 50,
  message: undefined,
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

cartRouter.put("/cart", authenticateToken, cartLimiter, addToCart);

cartRouter.put(
  "/cart/remove/:bookId",
  authenticateToken,
  cartLimiter,
  removeFromCart,
);

cartRouter.get("/cart", authenticateToken, cartLimiter, getCart);
