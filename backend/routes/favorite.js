import express from "express";
import rateLimit from "express-rate-limit";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../controllers/favoriteController.js";
import { authenticateToken } from "../middleware/auth.js";

export const favoriteRouter = express.Router();

// Rate limiter cho favorites API - giới hạn 50 requests / 15 phút
const favoritesLimiter = rateLimit({
  handler: (_req, res) => {
    return res.status(429).json({
      code: 429,
      error: "Quá nhiều yêu cầu favorites, vui lòng thử lại sau",
    });
  },
  max: 50,
  message: undefined,
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

favoriteRouter.put(
  "/favorites",
  authenticateToken,
  favoritesLimiter,
  addFavorite,
);

favoriteRouter.delete(
  "/favorites",
  authenticateToken,
  favoritesLimiter,
  removeFavorite,
);

favoriteRouter.get(
  "/favorites",
  authenticateToken,
  favoritesLimiter,
  getFavorites,
);
