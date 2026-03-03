# backend mern bookheaven – auth với bcrypt

## tổng quan

Backend dùng Node.js/Express, MongoDB/Mongoose và `bcryptjs` để bảo vệ mật khẩu người dùng.  
Mật khẩu **không bao giờ** được lưu dạng plain text, luôn được băm (hash) với 10 salt rounds trước khi lưu vào database.

## thư viện chính

- `bcryptjs`: băm và so sánh mật khẩu.
- `express`, `express-rate-limit`: xây dựng REST API và chống brute force.
- `mongoose`: kết nối MongoDB, định nghĩa model `User`.
- `zod`: validate và chuẩn hoá input từ client.

## model user (rút gọn)

```js
// models/user.js (rút gọn)
password: {
  required: true,
  type: String, // Lưu giá trị hash từ bcrypt, không phải plain password
},
```

## endpoint auth

### sign-up – `POST /api/v1/sign-up`

- **Body**:

```json
{
  "email": "user@example.com",
  "password": "secret123",
  "username": "user123",
  "address": "Hà Nội"
}
```

- **Quy trình**:
  - Validate body bằng Zod (`signUpSchema`).
  - Kiểm tra trùng `username` và `email`.
  - Băm mật khẩu với `await bcrypt.hash(password, 10)`.
  - Lưu user vào MongoDB với hash thay vì mật khẩu gốc.
  - Trả về thông tin user **không bao gồm `password`**.

- **Response thành công** (`201`):

```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": "664d8f...",
    "email": "user@example.com",
    "username": "user123",
    "address": "Hà Nội",
    "role": "user"
  }
}
```

- **Error format** (ví dụ dữ liệu không hợp lệ):

```json
{
  "code": 400,
  "error": "Email không hợp lệ"
}
```

### login – `POST /api/v1/login`

- **Body**:

```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

- **Quy trình**:
  - Validate body bằng Zod (`loginSchema`).
  - Tìm user theo `email`.
  - Dùng `await bcrypt.compare(plainPassword, existingUser.password)` để so sánh:
    - Nếu trùng khớp: đăng nhập thành công.
    - Nếu không: trả về `401` với thông báo lỗi chung.

- **Response thành công** (`200`):

```json
{
  "message": "Đăng nhập thành công",
  "user": {
    "id": "664d8f...",
    "email": "user@example.com",
    "username": "user123",
    "address": "Hà Nội",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR..."
}
```

- **Response sai thông tin đăng nhập** (`401`):

```json
{
  "code": 401,
  "error": "Thông tin đăng nhập không hợp lệ"
}
```

### lấy thông tin người dùng – `GET /api/v1/get-user-information`

- **Yêu cầu**:
  - Gửi header `Authorization: Bearer <token>` với token JWT nhận được từ bước login.
- **Hành vi**:
  - Middleware `authenticateToken` kiểm tra token.
  - Server truy vấn user hiện tại theo `sub` trong token và loại trừ trường `password` bằng `.select("-password")`.
- **Response thành công** (`200`):

```json
{
  "user": {
    "id": "664d8f...",
    "email": "user@example.com",
    "username": "user123",
    "address": "Hà Nội",
    "role": "user"
  }
}
```

### cập nhật địa chỉ – `PUT /api/v1/update-address`

- **Body**:

```json
{
  "address": "Địa chỉ mới"
}
```

- **Yêu cầu**:
  - Gửi kèm header `Authorization: Bearer <token>`.
- **Hành vi**:
  - Validate `address` bằng Zod (bắt buộc, string, trim).
  - Cập nhật địa chỉ trong database bằng `User.findByIdAndUpdate` cho user hiện tại.
- **Response thành công** (`200`):

```json
{
  "message": "Cập nhật địa chỉ thành công",
  "user": {
    "id": "664d8f...",
    "email": "user@example.com",
    "username": "user123",
    "address": "Địa chỉ mới",
    "role": "user"
  }
}
```

## bảo mật và rate limiting

- Không log `password`, token, hoặc toàn bộ `req.body`. Chỉ log message lỗi tổng quát.
- Các lỗi đều dùng format thống nhất: `{ "code": number, "error": string }`.
- Dùng `express-rate-limit`:
  - `signUpLimiter` cho `/sign-up` để giới hạn số lần đăng ký.
  - `loginLimiter` cho `/login` để giảm nguy cơ brute force.

## cấu trúc thư mục

```
backend/
├── controllers/
│   └── userController.js    # logic xử lý auth và user
├── middleware/
│   └── auth.js              # JWT authentication middleware
├── models/
│   └── user.js              # Mongoose User model
├── routes/
│   └── user.js              # định nghĩa routes và middleware
├── __tests__/
│   └── auth.test.js         # kiểm thử API
└── app.js                   # ứng dụng Express chính
```

- `routes/user.js` chỉ định nghĩa các endpoint và middleware (rate limiting, auth), sau đó gọi controller tương ứng.
- `controllers/userController.js` chứa toàn bộ logic nghiệp vụ: validate, query database, băm mật khẩu, tạo JWT, format response.

## json web token (jwt)

- Server tạo JWT khi login thành công với payload chứa:
  - `sub`: id người dùng.
  - `username`: tên đăng nhập.
  - `role`: vai trò (`user`/`admin`).
  - `email`: email.
- Token được ký bằng `JWT_SECRET` và hết hạn sau `JWT_EXPIRES_IN` (mặc định `30d`).
- Client gửi token trong header:

```http
Authorization: Bearer <token>
```

- Middleware `authenticateToken` sẽ:
  - Đọc header `Authorization`.
  - Verify token bằng `JWT_SECRET`.
  - Gắn payload vào `req.user` nếu hợp lệ.
  - Trả về `401` nếu thiếu, sai hoặc hết hạn token.

### ví dụ middleware authenticateToken và route bảo vệ

```js
// middleware/auth.js
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
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET ?? "dev_jwt_secret_change_me",
    );
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({
      code: 401,
      error: "Token không hợp lệ hoặc đã hết hạn",
    });
  }
};

// routes/user.js - chỉ định nghĩa route, gọi controller
import { getMe } from "../controllers/userController.js";

userRouter.get("/me", authenticateToken, getMe);

// controllers/userController.js - chứa logic xử lý
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ code: 401, error: "Yêu cầu xác thực" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        error: "Không tìm thấy người dùng",
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy thông tin người dùng:", error?.message ?? error);
    return res.status(500).json({
      code: 500,
      error: "Lỗi máy chủ nội bộ",
    });
  }
};
```

## kiểm thử

- Sử dụng **Jest** và **Supertest**:
  - `jest.config.cjs` cấu hình `testEnvironment: "node"`.
  - File test chính: `__tests__/auth.test.js`.
- Kiểm thử:
  - Băm và so sánh mật khẩu với `bcrypt.hash` / `bcrypt.compare`.
  - Đảm bảo route `/sign-up` và `/login` hoạt động và tuân thủ schema/format trả về.

