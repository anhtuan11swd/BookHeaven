import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { authenticateToken } from "../middleware/auth.js";
import { Book } from "../models/book.js";
import { Order } from "../models/order.js";
import { User } from "../models/user.js";
import { orderRouter } from "../routes/order.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", orderRouter);

  // route phụ để xác nhận middleware bảo mật hoạt động
  app.get("/protected-orders", authenticateToken, (_req, res) => {
    return res.status(200).json({ ok: true });
  });

  return app;
};

const createUserBooksAndToken = async (role = "user") => {
  const passwordHash = await bcrypt.hash("secret123", 10);

  const user = await User.create({
    address: "",
    email: `order-${Date.now()}@example.com`,
    password: passwordHash,
    role,
    username: `order_user_${Date.now()}`,
  });

  const firstBook = await Book.create({
    author: "Tác giả order 1",
    description: "Mô tả sách order 1",
    image_url: "https://example.com/order1.jpg",
    language: "vi",
    price: 111000,
    title: "Sách order 1",
  });

  const secondBook = await Book.create({
    author: "Tác giả order 2",
    description: "Mô tả sách order 2",
    image_url: "https://example.com/order2.jpg",
    language: "vi",
    price: 222000,
    title: "Sách order 2",
  });

  const payload = {
    email: user.email,
    id: user._id.toString(),
    role: user.role,
    sub: user._id.toString(),
    username: user.username,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  return { firstBook, secondBook, token, user };
};

describe("Order API", () => {
  const app = createTestApp();
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  describe("Admin Order API", () => {
    test("GET /api/v1/orders trả về toàn bộ đơn hàng cho admin với populate user và book, sort mới nhất trước", async () => {
      const { firstBook, token, user } = await createUserBooksAndToken("admin");

      const firstOrder = await Order.create({
        book: firstBook._id,
        status: "Đã đặt hàng",
        user: user._id,
      });

      const secondOrder = await Order.create({
        book: firstBook._id,
        status: "Đã đặt hàng",
        user: user._id,
      });

      const res = await request(app)
        .get("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);

      const [latest, older] = res.body.data;

      expect(latest._id).toBe(secondOrder._id.toString());
      expect(older._id).toBe(firstOrder._id.toString());
      expect(latest.user._id).toBe(user._id.toString());
      expect(latest.book._id).toBe(firstBook._id.toString());
    });

    test("GET /api/v1/orders trả về 403 khi user không phải admin", async () => {
      const { token } = await createUserBooksAndToken("user");

      const res = await request(app)
        .get("/api/v1/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        code: 403,
        error: "Không có quyền truy cập",
      });
    });

    test("PATCH /api/v1/orders/:orderId/status cho phép admin cập nhật trạng thái đơn hàng hợp lệ", async () => {
      const { firstBook, token, user } = await createUserBooksAndToken("admin");

      const order = await Order.create({
        book: firstBook._id,
        status: "Đã đặt hàng",
        user: user._id,
      });

      const res = await request(app)
        .patch(`/api/v1/orders/${order._id.toString()}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Đang giao hàng" });

      expect(res.status).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.status).toBe("Đang giao hàng");
      expect(typeof res.body.message).toBe("string");
    });

    test("PATCH /api/v1/orders/:orderId/status trả về 403 khi user không phải admin", async () => {
      const { firstBook, token, user } = await createUserBooksAndToken("user");

      const order = await Order.create({
        book: firstBook._id,
        status: "Đã đặt hàng",
        user: user._id,
      });

      const res = await request(app)
        .patch(`/api/v1/orders/${order._id.toString()}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Đang giao hàng" });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({
        code: 403,
        error: "Không có quyền truy cập",
      });
    });

    test("PATCH /api/v1/orders/:orderId/status trả về 400 khi orderId không hợp lệ", async () => {
      const { token } = await createUserBooksAndToken("admin");

      const res = await request(app)
        .patch("/api/v1/orders/invalid-id/status")
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Đang giao hàng" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
      expect(typeof res.body.error).toBe("string");
    });

    test("PATCH /api/v1/orders/:orderId/status trả về 400 khi status không hợp lệ", async () => {
      const { firstBook, token, user } = await createUserBooksAndToken("admin");

      const order = await Order.create({
        book: firstBook._id,
        status: "Đã đặt hàng",
        user: user._id,
      });

      const res = await request(app)
        .patch(`/api/v1/orders/${order._id.toString()}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Trạng thái không hợp lệ" });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe(400);
      expect(typeof res.body.error).toBe("string");
    });

    test("PATCH /api/v1/orders/:orderId/status trả về 404 khi không tìm thấy đơn hàng", async () => {
      const { token } = await createUserBooksAndToken("admin");

      const nonExistingId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .patch(`/api/v1/orders/${nonExistingId}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "Đang giao hàng" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        code: 404,
        error: "Không tìm thấy đơn hàng",
      });
    });
  });

  afterEach(async () => {
    const { collections } = mongoose.connection;
    for (const key in collections) {
      const collection = collections[key];
      // eslint-disable-next-line no-await-in-loop
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test("POST /api/v1/orders/place tạo order cho từng sách trong cart và clear cart", async () => {
    const { firstBook, secondBook, token, user } =
      await createUserBooksAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { cart: { $each: [firstBook._id, secondBook._id] } },
    });

    const res = await request(app)
      .post("/api/v1/orders/place")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const updatedUser = await User.findById(user._id).select("cart orders");

    expect(Array.isArray(updatedUser?.cart)).toBe(true);
    expect(updatedUser?.cart).toHaveLength(0);
    expect(Array.isArray(updatedUser?.orders)).toBe(true);
    expect(updatedUser?.orders).toHaveLength(2);

    const ordersInDb = await Order.find({ user: user._id }).sort({
      createdAt: -1,
    });
    expect(ordersInDb).toHaveLength(2);
  });

  test("POST /api/v1/orders/place với cart trống trả về 400", async () => {
    const { token } = await createUserBooksAndToken();

    const res = await request(app)
      .post("/api/v1/orders/place")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(typeof res.body.error).toBe("string");
  });

  test("POST /api/v1/place-order hoạt động như /orders/place (tạo order từ cart và clear cart)", async () => {
    const { firstBook, secondBook, token, user } =
      await createUserBooksAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { cart: { $each: [firstBook._id, secondBook._id] } },
    });

    const res = await request(app)
      .post("/api/v1/place-order")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const updatedUser = await User.findById(user._id).select("cart orders");

    expect(Array.isArray(updatedUser?.cart)).toBe(true);
    expect(updatedUser?.cart).toHaveLength(0);
    expect(Array.isArray(updatedUser?.orders)).toBe(true);
    expect(updatedUser?.orders).toHaveLength(2);
  });

  test("POST /api/v1/orders/place với body.items tạo order từ danh sách bookId và không đụng tới cart", async () => {
    const { firstBook, secondBook, token, user } =
      await createUserBooksAndToken();

    const res = await request(app)
      .post("/api/v1/orders/place")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [
          { bookId: firstBook._id.toString() },
          { bookId: secondBook._id.toString() },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const updatedUser = await User.findById(user._id).select("cart orders");

    expect(Array.isArray(updatedUser?.cart)).toBe(true);
    expect(updatedUser?.cart).toHaveLength(0);
    expect(Array.isArray(updatedUser?.orders)).toBe(true);
    expect(updatedUser?.orders).toHaveLength(2);
  });

  test("POST /api/v1/orders/place với body.items có bookId không hợp lệ trả về 400", async () => {
    const { token } = await createUserBooksAndToken();

    const res = await request(app)
      .post("/api/v1/orders/place")
      .set("Authorization", `Bearer ${token}`)
      .send({
        items: [{ bookId: "invalid-id" }],
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
    expect(typeof res.body.error).toBe("string");
  });

  test("GET /api/v1/orders/my trả về danh sách đơn hàng của user hiện tại", async () => {
    const { firstBook, token, user } = await createUserBooksAndToken();

    await Order.create({
      book: firstBook._id,
      status: "Đã đặt hàng",
      user: user._id,
    });

    const res = await request(app)
      .get("/api/v1/orders/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  test("GET /api/v1/orders/my trả về mảng rỗng khi user chưa có đơn hàng", async () => {
    const { token } = await createUserBooksAndToken();

    const res = await request(app)
      .get("/api/v1/orders/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(0);
  });

  test("GET /api/v1/orders/my trả về đơn hàng đã populate book và đơn mới nhất đứng đầu", async () => {
    const { token, user } = await createUserBooksAndToken();

    const firstBook = await Book.create({
      author: "Tác giả order sort 1",
      description: "Mô tả sách order sort 1",
      image_url: "https://example.com/order-sort-1.jpg",
      language: "vi",
      price: 101000,
      title: "Sách order sort 1",
    });

    const secondBook = await Book.create({
      author: "Tác giả order sort 2",
      description: "Mô tả sách order sort 2",
      image_url: "https://example.com/order-sort-2.jpg",
      language: "vi",
      price: 202000,
      title: "Sách order sort 2",
    });

    await Order.create({
      book: firstBook._id,
      status: "Đã đặt hàng",
      user: user._id,
    });

    await Order.create({
      book: secondBook._id,
      status: "Đã đặt hàng",
      user: user._id,
    });

    const res = await request(app)
      .get("/api/v1/orders/my")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const [first, second] = res.body.data;

    // Đơn hàng mới tạo sau (secondBook) phải đứng đầu do sort createdAt: -1
    expect(first.book._id).toBe(secondBook._id.toString());
    expect(first.book.title).toBe(secondBook.title);
    expect(first.book.price).toBe(secondBook.price);

    // Đảm bảo order còn lại đúng theo thứ tự
    expect(second.book._id).toBe(firstBook._id.toString());
    expect(second.book.title).toBe(firstBook.title);
    expect(second.book.price).toBe(firstBook.price);
  });

  test("tất cả endpoint /orders yêu cầu token hợp lệ", async () => {
    const resPlace = await request(app).post("/api/v1/orders/place");
    const resMy = await request(app).get("/api/v1/orders/my");

    [resPlace, resMy].forEach((res) => {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    });
  });
});
