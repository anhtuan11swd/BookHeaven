import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      code: 401,
      error: "Yêu cầu xác thực",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (_error) {
    return res.status(401).json({
      code: 401,
      error: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

export const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        code: 403,
        error: "Không có quyền truy cập",
      });
    }

    return next();
  };
