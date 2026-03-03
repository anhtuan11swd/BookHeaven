import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { authenticateToken } from "../middleware/auth.js";
import { Book } from "../models/book.js";
import { User } from "../models/user.js";
import { favoriteRouter } from "../routes/favorite.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1", favoriteRouter);

  // route phụ để xác nhận middleware bảo mật hoạt động
  app.get("/protected-favorites", authenticateToken, (_req, res) => {
    return res.status(200).json({ ok: true });
  });

  return app;
};

const createUserBookAndToken = async () => {
  const passwordHash = await bcrypt.hash("secret123", 10);

  const user = await User.create({
    address: "",
    email: `fav-${Date.now()}@example.com`,
    password: passwordHash,
    role: "user",
    username: `fav_user_${Date.now()}`,
  });

  const book = await Book.create({
    author: "Tác giả yêu thích",
    description: "Mô tả sách yêu thích",
    image_url: "https://example.com/fav.jpg",
    language: "vi",
    price: 123000,
    title: "Sách yêu thích",
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

describe("Favorite Books API", () => {
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
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test("PUT /api/v1/favorites thêm sách mới vào favorites", async () => {
    const { book, token, user } = await createUserBookAndToken();

    const res = await request(app)
      .put("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      message: "Đã thêm sách vào danh sách yêu thích",
    });

    const inDb = await User.findById(user._id).select("favorites");

    expect(Array.isArray(inDb?.favorites)).toBe(true);
    expect(
      inDb?.favorites.some((fav) => fav.toString() === book._id.toString()),
    ).toBe(true);
  });

  test("PUT /api/v1/favorites với sách đã tồn tại trả về thông báo trùng", async () => {
    const { book, token, user } = await createUserBookAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { favorites: book._id },
    });

    const res = await request(app)
      .put("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      message: "Sách đã có trong danh sách yêu thích",
    });
  });

  test("DELETE /api/v1/favorites xoá sách khỏi favorites khi tồn tại", async () => {
    const { book, token, user } = await createUserBookAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { favorites: book._id },
    });

    const res = await request(app)
      .delete("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      code: 200,
      message: "Đã xóa sách khỏi danh sách yêu thích",
    });

    const inDb = await User.findById(user._id).select("favorites");

    expect(
      inDb?.favorites.some((fav) => fav.toString() === book._id.toString()),
    ).toBe(false);
  });

  test("DELETE /api/v1/favorites với bookId không tồn tại trong favorites trả về 404", async () => {
    const { book, token } = await createUserBookAndToken();

    const res = await request(app)
      .delete("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`)
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(404);
    expect(res.body.code).toBe(404);
    expect(typeof res.body.error).toBe("string");
  });

  test("GET /api/v1/favorites trả về danh sách sách đã populate và không lộ thông tin nhạy cảm của user", async () => {
    const { book, token, user } = await createUserBookAndToken();

    await User.findByIdAndUpdate(user._id, {
      $push: { favorites: book._id },
    });

    const res = await request(app)
      .get("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
    expect(res.body.status).toBe("Thành công");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);

    const [first] = res.body.data;

    expect(first._id).toBe(book._id.toString());
    expect(first.title).toBe(book.title);
    expect(first.author).toBe(book.author);
  });

  test("tất cả endpoint /favorites yêu cầu token hợp lệ", async () => {
    const resPut = await request(app)
      .put("/api/v1/favorites")
      .send({ bookId: "123" });

    const resDelete = await request(app)
      .delete("/api/v1/favorites")
      .send({ bookId: "123" });

    const resGet = await request(app).get("/api/v1/favorites");

    [resPut, resDelete, resGet].forEach((res) => {
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        code: 401,
        error: "Yêu cầu xác thực",
      });
    });
  });

  test("người dùng không thể thao tác favorites của user khác vì userId chỉ lấy từ token", async () => {
    const { book, token } = await createUserBookAndToken();

    const otherUser = await User.create({
      address: "",
      email: `other-${Date.now()}@example.com`,
      password: await bcrypt.hash("secret123", 10),
      role: "user",
      username: `other_user_${Date.now()}`,
    });

    const res = await request(app)
      .put("/api/v1/favorites")
      .set("Authorization", `Bearer ${token}`)
      .set("id", otherUser._id.toString())
      .send({ bookId: book._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Đã thêm sách vào danh sách yêu thích");

    const targetUser = await User.findById(otherUser._id).select("favorites");
    expect(Array.isArray(targetUser?.favorites)).toBe(true);
    expect(targetUser?.favorites).toHaveLength(0);
  });
});
