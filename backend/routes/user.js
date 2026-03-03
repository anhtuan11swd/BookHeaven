import express from "express";
import rateLimit from "express-rate-limit";
import {
  getMe,
  getUserInformation,
  healthCheck,
  login,
  signUp,
  updateAddress,
  updateMe,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

export const userRouter = express.Router();

// Rate limiters
const signUpLimiter = rateLimit({
  handler: (_req, res) => {
    return res.status(429).json({
      code: 429,
      error: "Quá nhiều lần đăng ký, vui lòng thử lại sau",
    });
  },
  max: 20,
  message: undefined,
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

const loginLimiter = rateLimit({
  handler: (_req, res) => {
    return res.status(429).json({
      code: 429,
      error: "Quá nhiều lần đăng nhập, vui lòng thử lại sau",
    });
  },
  max: 50,
  message: undefined,
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

// Routes
userRouter.get("/health", healthCheck);
userRouter.post("/sign-up", signUpLimiter, signUp);
userRouter.post("/login", loginLimiter, login);
userRouter.get("/me", authenticateToken, getMe);
userRouter.get("/get-user-information", authenticateToken, getUserInformation);
userRouter.patch("/me", authenticateToken, updateMe);
userRouter.put("/update-address", authenticateToken, updateAddress);
