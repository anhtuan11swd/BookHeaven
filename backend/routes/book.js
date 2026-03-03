import express from "express";
import rateLimit from "express-rate-limit";
import {
  createBook,
  deleteBook,
  deleteBookByHeader,
  getBookById,
  getBooks,
  getRecentBooks,
  updateBook,
  updateBookByHeader,
} from "../controllers/bookController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

export const bookRouter = express.Router();

const publicBooksLimiter = rateLimit({
  handler: (_req, res) => {
    return res.status(429).json({
      code: 429,
      error: "Quá nhiều yêu cầu, vui lòng thử lại sau",
    });
  },
  max: 100,
  message: undefined,
  standardHeaders: "draft-7",
  windowMs: 15 * 60 * 1000,
});

const adminOnly = [authenticateToken, authorizeRoles("admin")];

bookRouter.get("/", publicBooksLimiter, getBooks);
bookRouter.get("/get-all-books", publicBooksLimiter, getBooks);
bookRouter.get("/get-recent-books", publicBooksLimiter, getRecentBooks);
bookRouter.get("/get-book-by-id/:id", publicBooksLimiter, getBookById);
bookRouter.get("/:id", publicBooksLimiter, getBookById);
bookRouter.post("/", ...adminOnly, createBook);
bookRouter.post("/add-book", ...adminOnly, createBook);
bookRouter.put("/update-book", ...adminOnly, updateBookByHeader);
bookRouter.put("/:id", ...adminOnly, updateBook);
bookRouter.delete("/delete-book", ...adminOnly, deleteBookByHeader);
bookRouter.delete("/:id", ...adminOnly, deleteBook);
