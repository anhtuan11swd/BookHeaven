import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/user.js";

// Các schema xác thực
const signUpSchema = z.object({
  address: z.string().trim().optional().default(""),
  email: z.string().trim().toLowerCase().email({
    message: "Email không hợp lệ",
  }),
  password: z.string().min(6, {
    message: "Password phải dài hơn 5 ký tự",
  }),
  username: z.string().trim().min(4, {
    message: "Username phải dài hơn 3 ký tự",
  }),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email({
    message: "Email không hợp lệ",
  }),
  password: z.string().min(6, {
    message: "Password phải dài hơn 5 ký tự",
  }),
});

const updateMeSchema = z.object({
  address: z.string().trim(),
});

// JWT config
const JWT_SECRET = process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "30d";

/**
 * Đăng ký người dùng mới
 */
export const signUp = async (req, res) => {
  try {
    const parsed = signUpSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { address, email, password, username } = parsed.data;

    const existingByUsername = await User.findOne({
      username,
    });

    if (existingByUsername) {
      return res.status(409).json({
        code: 409,
        error: "Username đã tồn tại",
      });
    }

    const existingByEmail = await User.findOne({ email });

    if (existingByEmail) {
      return res.status(409).json({
        code: 409,
        error: "Email đã tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      address,
      email,
      password: hashedPassword,
      username,
    });

    await user.save();

    const safeUser = {
      address: user.address,
      email: user.email,
      id: user._id,
      role: user.role,
      username: user.username,
    };

    return res.status(201).json({
      message: "Đăng ký thành công",
      user: safeUser,
    });
  } catch (error) {
    // Chỉ log thông tin lỗi tổng quát, không log dữ liệu nhạy cảm
    console.error("Lỗi đăng ký:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * Đăng nhập người dùng
 */
export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { email, password } = parsed.data;

    const existingUser = await User.findOne({ email });

    if (!existingUser) {
      return res.status(401).json({
        code: 401,
        error: "Thông tin đăng nhập không hợp lệ",
      });
    }

    const isMatch = await bcrypt.compare(password, existingUser.password);

    if (!isMatch) {
      return res.status(401).json({
        code: 401,
        error: "Thông tin đăng nhập không hợp lệ",
      });
    }

    const payload = {
      email: existingUser.email,
      role: existingUser.role,
      sub: existingUser._id.toString(),
      username: existingUser.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const safeUser = {
      address: existingUser.address,
      email: existingUser.email,
      id: existingUser._id,
      role: existingUser.role,
      username: existingUser.username,
    };

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: safeUser,
    });
  } catch (error) {
    // Chỉ log thông tin lỗi tổng quát, không log dữ liệu nhạy cảm
    console.error("Lỗi đăng nhập:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * Lấy thông tin người dùng hiện tại
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const safeUser = {
      address: user.address,
      email: user.email,
      id: user._id,
      role: user.role,
      username: user.username,
    };

    return res.status(200).json({
      user: safeUser,
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error?.message ?? error);

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * Lấy thông tin người dùng (endpoint thay thế)
 */
export const getUserInformation = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const safeUser = {
      address: user.address,
      email: user.email,
      id: user._id,
      role: user.role,
      username: user.username,
    };

    return res.status(200).json({
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Lỗi lấy thông tin người dùng (get-user-information):",
      error?.message ?? error,
    );

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * Cập nhật thông tin người dùng
 */
export const updateMe = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const parsed = updateMeSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { address } = parsed.data;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    user.address = address;
    await user.save();

    const safeUser = {
      address: user.address,
      email: user.email,
      id: user._id,
      role: user.role,
      username: user.username,
    };

    return res.status(200).json({
      message: "Cập nhật hồ sơ thành công",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Lỗi cập nhật thông tin người dùng:",
      error?.message ?? error,
    );

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * Cập nhật địa chỉ người dùng
 */
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    }

    const parsed = updateMeSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message ?? "Dữ liệu không hợp lệ";

      return res.status(400).json({
        code: 400,
        error: message,
      });
    }

    const { address } = parsed.data;

    const user = await User.findByIdAndUpdate(
      userId,
      { address },
      { returnDocument: "after" },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    const safeUser = {
      address: user.address,
      email: user.email,
      id: user._id,
      role: user.role,
      username: user.username,
    };

    return res.status(200).json({
      message: "Cập nhật địa chỉ thành công",
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Lỗi cập nhật địa chỉ người dùng (update-address):",
      error?.message ?? error,
    );

    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};

/**
 * Health check endpoint
 */
export const healthCheck = (_req, res) => {
  res.status(200).json({ ok: true });
};
