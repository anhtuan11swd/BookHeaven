# backend mern bookheaven – auth với bcrypt

## tổng quan

Backend dùng Node.js/Express, MongoDB/Mongoose và `bcryptjs` để bảo vệ mật khẩu người dùng.  
Mật khẩu **không bao giờ** được lưu dạng plain text, luôn được băm (hash) với 10 salt rounds trước khi lưu vào database.

## thư viện chính

- `bcryptjs`: băm và so sánh mật khẩu.
- `express`, `express-rate-limit`: xây dựng REST API và chống brute force/rate limiting.
- `mongoose`: kết nối MongoDB, định nghĩa model `User` và `Book`.
- `zod`: validate và chuẩn hoá input từ client.
- `jsonwebtoken`: tạo và verify JWT token.
- `mongodb-memory-server`: tạo database tạm cho kiểm thử.

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
│   ├── userController.js       # logic xử lý auth và user
│   ├── bookController.js       # logic xử lý sách
│   ├── favoriteController.js   # logic xử lý sách yêu thích
│   └── cartController.js       # logic xử lý giỏ hàng
├── middleware/
│   └── auth.js                 # JWT authentication middleware
├── models/
│   ├── user.js                 # Mongoose User model
│   └── book.js                 # Mongoose Book model
├── routes/
│   ├── user.js                 # định nghĩa routes user và middleware
│   ├── book.js                 # định nghĩa routes book và middleware
│   ├── favorite.js             # định nghĩa routes favorites và middleware
│   └── cart.js                 # định nghĩa routes giỏ hàng và middleware
├── __tests__/
│   ├── auth.test.js            # kiểm thử API auth
│   ├── book.test.js            # kiểm thử API thêm sách
│   ├── book-public-apis.test.js # kiểm thử API public book
│   ├── favorite.test.js        # kiểm thử API favorites
│   └── cart.test.js            # kiểm thử API giỏ hàng
└── app.js                      # ứng dụng Express chính
```

- `routes/` chỉ định nghĩa các endpoint và middleware (rate limiting, auth), sau đó gọi controller tương ứng.
- `controllers/` chứa toàn bộ logic nghiệp vụ: validate, query database, format response.

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

## endpoint book

### thêm sách mới – `POST /api/v1/books/add-book`

- **Auth & quyền hạn**:
  - Yêu cầu header `Authorization: Bearer <token>` với token JWT hợp lệ.
  - Token phải thuộc user có `role: "admin"` (middleware `authenticateToken` + `authorizeRoles("admin")`).
- **Body (JSON)**:

```json
{
  "image_url": "https://example.com/book.jpg",
  "title": "Tên sách",
  "author": "Tác giả",
  "price": 120000,
  "description": "Mô tả sách",
  "language": "vi"
}
```

- **Response thành công** (`201`):

```json
{
  "message": "Tạo sách thành công",
  "book": {
    "_id": "6650...",
    "image_url": "https://example.com/book.jpg",
    "title": "Tên sách",
    "author": "Tác giả",
    "price": 120000,
    "description": "Mô tả sách",
    "language": "vi"
  }
}
```

- **Response khi không phải admin** (`403`):

```json
{
  "code": 403,
  "error": "Không có quyền truy cập"
}
```

- **Response validate lỗi** (`400`, ví dụ `image_url` sai định dạng hoặc thiếu `title`):

```json
{
  "code": 400,
  "error": "Dữ liệu sách không hợp lệ"
}
```

### cập nhật sách – `PUT /api/v1/books/update-book`

- **Auth & quyền hạn**:
  - Yêu cầu header `Authorization: Bearer <token>` với token JWT hợp lệ.
  - Token phải thuộc user có `role: "admin"` (middleware `authenticateToken` + `authorizeRoles("admin")`).
- **Headers bổ sung**:

```http
bookid: <Mongo ObjectId của sách cần cập nhật>
```

- **Body (JSON)** – tất cả các trường đều **optional** (chỉ gửi những trường cần đổi):

```json
{
  "image_url": "https://example.com/new-book.jpg",
  "title": "Tên sách mới",
  "author": "Tác giả mới",
  "price": 150000,
  "description": "Mô tả mới",
  "language": "vi"
}
```

- **Response thành công** (`200`):

```json
{
  "message": "Cập nhật sách thành công",
  "book": {
    "_id": "6650...",
    "image_url": "https://example.com/new-book.jpg",
    "title": "Tên sách mới",
    "author": "Tác giả mới",
    "price": 150000,
    "description": "Mô tả mới",
    "language": "vi"
  }
}
```

- **Response khi `bookid` không hợp lệ** (`400`):

```json
{
  "code": 400,
  "error": "ID sách không hợp lệ"
}
```

- **Response khi sách không tồn tại** (`404`):

```json
{
  "code": 404,
  "error": "Không tìm thấy sách"
}
```

#### cập nhật sách (param) – `PUT /api/v1/books/:id`

- **Auth & quyền hạn**: Yêu cầu admin (giống `update-book`).
- **Cách truyền ID**: Truyền trực tiếp trên URL (`/:id`) thay vì trong header.
- **Body**: Giống `update-book` - tất cả trường optional.
- **Response**: Giống `update-book`.

#### xóa sách (header) – `DELETE /api/v1/books/delete-book`

- **Auth & quyền hạn**: Yêu cầu admin.
- **Headers bổ sung**:

```http
bookid: <Mongo ObjectId của sách cần xóa>
```

- **Response thành công** (`200`):

```json
{
  "message": "Xóa sách thành công"
}
```

- **Response khi `bookid` không hợp lệ** (`400`):

```json
{
  "code": 400,
  "error": "ID sách không hợp lệ"
}
```

- **Response khi sách không tồn tại** (`404`):

```json
{
  "code": 404,
  "error": "Không tìm thấy sách"
}
```

#### xóa sách (param) – `DELETE /api/v1/books/:id`

- **Auth & quyền hạn**: Yêu cầu admin.
- **Cách truyền ID**: Truyền trực tiếp trên URL (`/:id`).
- **Response thành công** (`200`):

```json
{
  "message": "Xóa sách thành công"
}
```

- **Response lỗi**: Tương tự `delete-book` bằng header (400 cho ID invalid, 404 cho không tìm thấy).

### public apis (không cần auth)

Các endpoint dưới đây cho phép bất kỳ ai (người dùng thông thường hoặc khách truy cập) đều có thể truy cập để xem thông tin sách. Tất cả đều có rate limiting (100 requests / 15 phút).

#### lấy tất cả sách – `GET /api/v1/books/get-all-books`

- **Mô tả**: Truy xuất toàn bộ danh sách sách, sắp xếp mới nhất trước.
- **Response thành công** (`200`):

```json
{
  "books": [
    {
      "_id": "6650...",
      "image_url": "https://example.com/newest.jpg",
      "title": "Sách mới nhất",
      "author": "Tác giả",
      "price": 150000,
      "description": "Mô tả",
      "language": "vi",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "664f...",
      "image_url": "https://example.com/older.jpg",
      "title": "Sách cũ hơn",
      "author": "Tác giả",
      "price": 120000,
      "description": "Mô tả",
      "language": "vi",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

#### lấy sách mới thêm – `GET /api/v1/books/get-recent-books`

- **Mô tả**: Chỉ lấy 4 cuốn sách gần nhất để hiển thị trên trang chủ.
- **Response thành công** (`200`):

```json
{
  "books": [
    { "_id": "6650...", "title": "Sách 4", ... },
    { "_id": "664f...", "title": "Sách 3", ... },
    { "_id": "664e...", "title": "Sách 2", ... },
    { "_id": "664d...", "title": "Sách 1", ... }
  ]
}
```

#### lấy chi tiết sách – `GET /api/v1/books/get-book-by-id/:id`

- **Mô tả**: Hiển thị thông tin đầy đủ của một cuốn sách cụ thể.
- **Parameters**: `id` - MongoDB ObjectId của sách (24 ký tự hex).
- **Response thành công** (`200`):

```json
{
  "book": {
    "_id": "6650...",
    "image_url": "https://example.com/book.jpg",
    "title": "Tên sách",
    "author": "Tác giả",
    "price": 120000,
    "description": "Mô tả sách",
    "language": "vi",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

- **Response khi id không hợp lệ** (`400`):

```json
{
  "code": 400,
  "error": "ID sách không hợp lệ"
}
```

- **Response khi sách không tồn tại** (`404`):

```json
{
  "code": 404,
  "error": "Không tìm thấy sách"
}
```

## endpoint favorites (sách yêu thích)

Tất cả endpoints favorites đều yêu cầu xác thực JWT và có rate limiting (50 requests / 15 phút).

### thêm sách vào yêu thích – `PUT /api/v1/favorites`

- **Auth**: Yêu cầu header `Authorization: Bearer <token>`.
- **Body**:

```json
{
  "bookId": "6650..."
}
```

- **Hoặc Headers**:

```http
bookid: 6650...
```

- **Response thành công** (`200`):

```json
{
  "code": 200,
  "message": "Đã thêm sách vào danh sách yêu thích"
}
```

- **Response khi sách đã tồn tại** (`200`):

```json
{
  "code": 200,
  "message": "Sách đã có trong danh sách yêu thích"
}
```

- **Response khi bookId không hợp lệ** (`400`):

```json
{
  "code": 400,
  "error": "ID sách không hợp lệ"
}
```

### xóa sách khỏi yêu thích – `DELETE /api/v1/favorites`

- **Auth**: Yêu cầu header `Authorization: Bearer <token>`.
- **Body**:

```json
{
  "bookId": "6650..."
}
```

- **Hoặc Headers**:

```http
bookid: 6650...
```

- **Response thành công** (`200`):

```json
{
  "code": 200,
  "message": "Đã xóa sách khỏi danh sách yêu thích"
}
```

- **Response khi sách không có trong danh sách** (`404`):

```json
{
  "code": 404,
  "error": "Sách không tồn tại trong danh sách yêu thích"
}
```

### lấy danh sách sách yêu thích – `GET /api/v1/favorites`

- **Auth**: Yêu cầu header `Authorization: Bearer <token>`.
- **Mô tả**: Trả về danh sách sách đã populate đầy đủ thông tin (tiêu đề, tác giả, giá...), chỉ từ mảng `favorites` của user hiện tại.
- **Response thành công** (`200`):

```json
{
  "code": 200,
  "data": [
    {
      "_id": "6650...",
      "image_url": "https://example.com/book.jpg",
      "title": "Tên sách",
      "author": "Tác giả",
      "price": 120000,
      "description": "Mô tả sách",
      "language": "vi",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "status": "Thành công"
}
```

- **Response khi không có token** (`401`):

```json
{
  "code": 401,
  "error": "Yêu cầu xác thực"
}
```

## endpoint cart (giỏ hàng)

Tất cả endpoints cart đều yêu cầu xác thực JWT và có rate limiting (50 requests / 15 phút).

### thêm sách vào giỏ hàng – `PUT /api/v1/cart`

- **Auth**: Yêu cầu header `Authorization: Bearer <token>`.
- **Body**:

```json
{
  "bookId": "6650..."
}
```

- **Hoặc Headers**:

```http
bookid: 6650...
```

- **Response thành công** (`200`):

```json
{
  "code": 200,
  "message": "Đã thêm sách vào giỏ hàng"
}
```

- **Response khi sách đã tồn tại** (`200`):

```json
{
  "code": 200,
  "message": "Sách đã có trong giỏ hàng"
}
```

- **Response khi bookId không hợp lệ** (`400`):

```json
{
  "code": 400,
  "error": "ID sách không hợp lệ"
}
```

### xóa sách khỏi giỏ hàng – `PUT /api/v1/cart/remove/:bookId`

- **Auth**: Yêu cầu header `Authorization: Bearer <token>`.
- **Parameters**: `bookId` - MongoDB ObjectId của sách (24 ký tự hex), truyền trực tiếp trên URL.
- **Response thành công** (`200`):

```json
{
  "code": 200,
  "message": "Đã xóa sách khỏi giỏ hàng"
}
```

- **Response khi sách không có trong giỏ hàng** (`404`):

```json
{
  "code": 404,
  "error": "Sách không có trong giỏ hàng"
}
```

### lấy danh sách giỏ hàng – `GET /api/v1/cart`

- **Auth**: Yêu cầu header `Authorization: Bearer <token>`.
- **Mô tả**: Trả về danh sách sách trong giỏ hàng đã populate đầy đủ thông tin (tiêu đề, tác giả, giá...), sắp xếp với sách mới thêm nằm ở đầu danh sách.
- **Response thành công** (`200`):

```json
{
  "code": 200,
  "data": [
    {
      "_id": "6650...",
      "image_url": "https://example.com/book.jpg",
      "title": "Tên sách",
      "author": "Tác giả",
      "price": 120000,
      "description": "Mô tả sách",
      "language": "vi",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "status": "Thành công"
}
```

- **Response khi không có token** (`401`):

```json
{
  "code": 401,
  "error": "Yêu cầu xác thực"
}
```

## kiểm thử

- Sử dụng **Jest** và **Supertest**:
  - `jest.config.cjs` cấu hình `testEnvironment: "node"`.
  - File test: `__tests__/auth.test.js`, `__tests__/book.test.js`, `__tests__/book-public-apis.test.js`.
- Kiểm thử:
  - Auth: Băm và so sánh mật khẩu, đăng ký, đăng nhập, JWT.
  - Book Admin: Thêm, cập nhật, xóa sách (yêu cầu quyền admin).
  - Book Public: Lấy tất cả sách, sách mới nhất, chi tiết sách (không cần auth).
  - Favorites: Thêm, xóa, lấy danh sách sách yêu thích (yêu cầu auth, kiểm tra populate và bảo mật).
  - Cart: Thêm, xóa, lấy danh sách giỏ hàng (yêu cầu auth, kiểm tra populate và đảo thứ tự).

