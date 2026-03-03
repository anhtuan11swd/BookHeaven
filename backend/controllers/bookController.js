import { z } from "zod";
import { Book } from "../models/book.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const getFirstZodIssueMessage = (error, defaultMessage) => {
  const issues = Array.isArray(error?.errors)
    ? error.errors
    : Array.isArray(error?.issues)
      ? error.issues
      : [];

  return issues[0]?.message ?? defaultMessage;
};

const createBookSchema = z.object({
  author: z.string().trim().min(1, {
    message: "Tác giả là bắt buộc",
  }),
  description: z.string().trim().optional().default(""),
  image_url: z.string().trim().url({
    message: "image_url phải là URL hợp lệ",
  }),
  language: z.string().trim().min(1, {
    message: "Ngôn ngữ là bắt buộc",
  }),
  price: z
    .number({
      invalid_type_error: "Giá phải là số",
    })
    .min(0, {
      message: "Giá không được âm",
    }),
  title: z.string().trim().min(1, {
    message: "Tiêu đề là bắt buộc",
  }),
});

const updateBookSchema = createBookSchema.partial();

const idParamSchema = z.object({
  id: z
    .string()
    .regex(objectIdRegex, {
      message: "ID sách không hợp lệ",
    })
    .trim(),
});

const updateBookHeaderSchema = z.object({
  bookid: z
    .string()
    .regex(objectIdRegex, {
      message: "ID sách không hợp lệ",
    })
    .trim(),
});

export const getBooks = async (_req, res) => {
  try {
    const books = await Book.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      books,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách sách:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const getRecentBooks = async (_req, res) => {
  try {
    const books = await Book.find()
      .sort({
        createdAt: -1,
      })
      .limit(4);

    return res.status(200).json({
      books,
    });
  } catch (error) {
    console.error("Lỗi lấy sách mới nhất:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const getBookById = async (req, res) => {
  try {
    const parsedParams = idParamSchema.safeParse(req.params ?? {});

    if (!parsedParams.success) {
      const message = getFirstZodIssueMessage(
        parsedParams.error,
        "Tham số không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { id } = parsedParams.data;

    const book = await Book.findById(id);

    if (!book) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy sách",
      });
    }

    return res.status(200).json({
      book,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết sách:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const createBook = async (req, res) => {
  try {
    const parsed = createBookSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      const message = getFirstZodIssueMessage(
        parsed.error,
        "Dữ liệu sách không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const data = parsed.data;

    const existing = await Book.findOne({
      author: data.author,
      language: data.language,
      title: data.title,
    });

    if (existing) {
      return res.status(409).json({
        code: 409,
        error: "Sách đã tồn tại trong hệ thống",
      });
    }

    const book = new Book(data);
    await book.save();

    return res.status(201).json({
      book,
      message: "Tạo sách thành công",
    });
  } catch (error) {
    console.error("Lỗi tạo sách:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const updateBook = async (req, res) => {
  try {
    const parsedParams = idParamSchema.safeParse(req.params ?? {});

    if (!parsedParams.success) {
      const message = getFirstZodIssueMessage(
        parsedParams.error,
        "Tham số không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const parsedBody = updateBookSchema.safeParse(req.body ?? {});

    if (!parsedBody.success) {
      const message = getFirstZodIssueMessage(
        parsedBody.error,
        "Dữ liệu sách không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { id } = parsedParams.data;
    const update = parsedBody.data;

    const book = await Book.findByIdAndUpdate(id, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy sách",
      });
    }

    return res.status(200).json({
      book,
      message: "Cập nhật sách thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật sách:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const updateBookByHeader = async (req, res) => {
  try {
    const parsedHeaders = updateBookHeaderSchema.safeParse(req.headers ?? {});

    if (!parsedHeaders.success) {
      const message = getFirstZodIssueMessage(
        parsedHeaders.error,
        "Tham số không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const parsedBody = updateBookSchema.safeParse(req.body ?? {});

    if (!parsedBody.success) {
      const message = getFirstZodIssueMessage(
        parsedBody.error,
        "Dữ liệu sách không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { bookid } = parsedHeaders.data;
    const update = parsedBody.data;

    const book = await Book.findByIdAndUpdate(bookid, update, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy sách",
      });
    }

    return res.status(200).json({
      book,
      message: "Cập nhật sách thành công",
    });
  } catch (error) {
    console.error("Lỗi cập nhật sách (header):", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const deleteBookByHeader = async (req, res) => {
  try {
    const parsedHeaders = updateBookHeaderSchema.safeParse(req.headers ?? {});

    if (!parsedHeaders.success) {
      const message = getFirstZodIssueMessage(
        parsedHeaders.error,
        "Tham số không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { bookid } = parsedHeaders.data;

    const book = await Book.findByIdAndDelete(bookid);

    if (!book) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy sách",
      });
    }

    return res.status(200).json({
      message: "Xóa sách thành công",
    });
  } catch (error) {
    console.error("Lỗi xoá sách (header):", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const parsedParams = idParamSchema.safeParse(req.params ?? {});

    if (!parsedParams.success) {
      const message = getFirstZodIssueMessage(
        parsedParams.error,
        "Tham số không hợp lệ",
      );

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { id } = parsedParams.data;

    const book = await Book.findByIdAndDelete(id);

    if (!book) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy sách",
      });
    }

    return res.status(200).json({
      message: "Xóa sách thành công",
    });
  } catch (error) {
    console.error("Lỗi xoá sách:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};
