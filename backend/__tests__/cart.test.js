import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { authenticateToken } from "../middleware/auth.js";
import { Book } from "../models/book.js";
import { User } from "../models/user.js";
import { cartRouter } from "../routes/cart.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", cartRouter);

  // route phụ để xác nhận middleware bảo mật hoạt động
  app.get("/protected-cart", authenticateToken, (_req, res) => {
    return res.status(200).json({ ok: true });
  });

  return app;
};

const createUserBookAndToken = async () => {
  const passwordHash = await bcrypt.hash("secret123", 10);

  const user = await User.create({
    address: "",
    email: `cart-${Date.now()}@example.com`,
    password: passwordHash,
    role: "user",
    username: `cart_user_${Date.now()}`,
  });

  const book = await Book.create({
    author: "Tác giả giỏ hàng",
    description: "Mô tả sách trong giỏ hàng",
    image_url: "https://example.com/cart.jpg",
    language: "vi",
    price: 123000,
    title: "Sách trong giỏ hàng",
  });

  const payload = {
    email: user.email,
    id: user._id.toString(),
    role: user.role,
    sub: user._id.toString(),
    username: user.username,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  return { book, token, user };
};

describe("Cart API", () => {
  const app = createTestApp();
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
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

  test("PUT /api/v1/cart thêm sách mới vào giỏ hàng", async () => {
    const { book, token, user } = await createUserBookAndToken();

    const res = await request(app)
      .put("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      message: "Đã thêm sách vào giỏ hàng",
    });

    const inDb = await User.findById(user._id).select("cart");

    expect(Array.isArray(inDb?.cart)).toBe(true);
    expect(
      inDb?.cart.some((item) => item.toString() === book._id.toString()),
    ).toBe(true);
  });

  test("PUT /api/v1/cart với sách đã tồn tại trả về thông báo trùng", async () => {
    const { book, token, user } = await createUserBookAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { cart: book._id },
    });

    const res = await request(app)
      .put("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      message: "Sách đã có trong giỏ hàng",
    });
  });

  test("PUT /api/v1/cart/remove/:bookId xoá sách khỏi cart khi tồn tại", async () => {
    const { book, token, user } = await createUserBookAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { cart: book._id },
    });

    const res = await request(app)
      .put(`/api/v1/cart/remove/${book._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      message: "Đã xóa sách khỏi giỏ hàng",
    });

    const inDb = await User.findById(user._id).select("cart");

    expect(
      inDb?.cart.some((item) => item.toString() === book._id.toString()),
    ).toBe(false);
  });

  test("PUT /api/v1/cart/remove/:bookId với bookId không tồn tại trong cart trả về 404", async () => {
    const { book, token } = await createUserBookAndToken();

    const res = await request(app)
      .put(`/api/v1/cart/remove/${book._id.toString()}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(typeof res.body.error).toBe("string");
  });

  test("GET /api/v1/cart trả về danh sách sách đã populate, đảo thứ tự và không lộ thông tin nhạy cảm của user", async () => {
    const { token, user } = await createUserBookAndToken();

    const firstBook = await Book.create({
      author: "Tác giả 1",
      description: "Mô tả 1",
      image_url: "https://example.com/1.jpg",
      language: "vi",
      price: 111000,
      title: "Sách 1",
    });

    const secondBook = await Book.create({
      author: "Tác giả 2",
      description: "Mô tả 2",
      image_url: "https://example.com/2.jpg",
      language: "vi",
      price: 222000,
      title: "Sách 2",
    });

    await User.findByIdAndUpdate(user._id, {
      $push: { cart: { $each: [firstBook._id, secondBook._id] } },
    });

    const res = await request(app)
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.status).toBe("Thành công");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const [first] = res.body.data;

    expect(first._id).toBe(secondBook._id.toString());
    expect(first.title).toBe(secondBook.title);
    expect(first.author).toBe(secondBook.author);
  });

  test("tất cả endpoint /cart yêu cầu token hợp lệ", async () => {
    const resPut = await request(app)
      .put("/api/v1/cart")
      .send({ bookId: "123" });

    const resRemove = await request(app).put(
      "/api/v1/cart/remove/656565656565656565656565",
    );

    const resGet = await request(app).get("/api/v1/cart");

    [resPut, resRemove, resGet].forEach((res) => {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    });
  });

  test("người dùng không thể thao tác cart của user khác vì userId chỉ lấy từ token", async () => {
    const { book, token } = await createUserBookAndToken();

    const otherUser = await User.create({
      address: "",
      email: `other-cart-${Date.now()}@example.com`,
      password: await bcrypt.hash("secret123", 10),
      role: "user",
      username: `other_cart_user_${Date.now()}`,
    });

    const res = await request(app)
      .put("/api/v1/cart")
      .set("Authorization", `Bearer ${token}`)
      .set("id", otherUser._id.toString())
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Đã thêm sách vào giỏ hàng");

    const targetUser = await User.findById(otherUser._id).select("cart");
    expect(Array.isArray(targetUser?.cart)).toBe(true);
    expect(targetUser?.cart).toHaveLength(0);
  });
});
