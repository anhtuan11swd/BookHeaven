import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Book } from "../models/book.js";
import { User } from "../models/user.js";
import { bookRouter } from "../routes/book.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev_jwt_secret_change_me";

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1/books", bookRouter);

  return app;
};

describe("API Sách với quyền admin", () => {
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

  const createUserAndToken = async (role = "admin") => {
    const password = await bcrypt.hash("secret123", 10);

    const user = await User.create({
      address: "",
      email: `${role}-${Date.now()}@example.com`,
      password,
      role,
      username: `${role}_${Date.now()}`,
    });

    const payload = {
      email: user.email,
      role: user.role,
      sub: user._id.toString(),
      username: user.username,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

    return { token, user };
  };

  test("admin có thể thêm sách mới qua POST /api/v1/books/add-book", async () => {
    const { token } = await createUserAndToken("admin");

    const body = {
      author: "Tác giả A",
      description: "Mô tả sách",
      image_url: "https://example.com/image.jpg",
      language: "vi",
      price: 100000,
      title: "Sách mới",
    };

    const res = await request(app)
      .post("/api/v1/books/add-book")
      .set("Authorization", `Bearer ${token}`)
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body?.book?.title).toBe(body.title);
    expect(res.body?.book?.author).toBe(body.author);
  });

  test("user thường không thể thêm sách, nhận 403", async () => {
    const { token } = await createUserAndToken("user");

    const res = await request(app)
      .post("/api/v1/books/add-book")
      .set("Authorization", `Bearer ${token}`)
      .send({
        author: "Tác giả B",
        description: "Mô tả",
        image_url: "https://example.com/image2.jpg",
        language: "vi",
        price: 50000,
        title: "Sách user",
      });

    expect(res.status).toBe(403);
    expect(res.body).toEqual({
      code: 403,
      error: "Không có quyền truy cập",
    });
  });

  test("validate body không hợp lệ trả về 400", async () => {
    const { token } = await createUserAndToken("admin");

    const res = await request(app)
      .post("/api/v1/books/add-book")
      .set("Authorization", `Bearer ${token}`)
      .send({
        author: "",
        image_url: "not-a-url",
        language: "",
        price: -10,
        title: "",
      });

    expect(res.status).toBe(400);
    expect(typeof res.body?.error).toBe("string");
    expect(res.body?.code).toBe(400);
  });

  test("admin có thể cập nhật sách qua PUT /api/v1/books/update-book với bookid trong header", async () => {
    const { token } = await createUserAndToken("admin");

    const book = await Book.create({
      author: "Tác giả C",
      description: "Mô tả cũ",
      image_url: "https://example.com/old.jpg",
      language: "vi",
      price: 400000,
      title: "Sách cũ",
    });

    const updateBody = {
      description: "Mô tả mới",
      price: 500000,
    };

    const res = await request(app)
      .put("/api/v1/books/update-book")
      .set("Authorization", `Bearer ${token}`)
      .set("bookid", book._id.toString())
      .send(updateBody);

    expect(res.status).toBe(200);
    expect(res.body?.message).toBe("Cập nhật sách thành công");
    expect(res.body?.book?.price).toBe(updateBody.price);
    expect(res.body?.book?.description).toBe(updateBody.description);
  });

  test("bookid không hợp lệ trong header trả về 400", async () => {
    const { token } = await createUserAndToken("admin");

    const res = await request(app)
      .put("/api/v1/books/update-book")
      .set("Authorization", `Bearer ${token}`)
      .set("bookid", "invalid-id")
      .send({
        price: 100000,
      });

    expect(res.status).toBe(400);
    expect(res.body?.code).toBe(400);
    expect(typeof res.body?.error).toBe("string");
  });

  test("bookid hợp lệ nhưng không tồn tại trả về 404", async () => {
    const { token } = await createUserAndToken("admin");

    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .put("/api/v1/books/update-book")
      .set("Authorization", `Bearer ${token}`)
      .set("bookid", nonExistingId)
      .send({
        price: 100000,
      });

    expect(res.status).toBe(404);
    expect(res.body?.code).toBe(404);
    expect(res.body?.error).toBe("Không tìm thấy sách");
  });

  test("admin có thể xoá sách qua DELETE /api/v1/books/delete-book với bookid trong header", async () => {
    const { token } = await createUserAndToken("admin");

    const book = await Book.create({
      author: "Tác giả D",
      description: "Sách sẽ bị xoá",
      image_url: "https://example.com/delete.jpg",
      language: "vi",
      price: 200000,
      title: "Sách xoá",
    });

    const res = await request(app)
      .delete("/api/v1/books/delete-book")
      .set("Authorization", `Bearer ${token}`)
      .set("bookid", book._id.toString());

    expect(res.status).toBe(200);
    expect(res.body?.message).toBe("Xóa sách thành công");

    const inDb = await Book.findById(book._id);
    expect(inDb).toBeNull();
  });

  test("DELETE /api/v1/books/delete-book với bookid không hợp lệ trả về 400", async () => {
    const { token } = await createUserAndToken("admin");

    const res = await request(app)
      .delete("/api/v1/books/delete-book")
      .set("Authorization", `Bearer ${token}`)
      .set("bookid", "invalid-id");

    expect(res.status).toBe(400);
    expect(res.body?.code).toBe(400);
    expect(typeof res.body?.error).toBe("string");
  });

  test("DELETE /api/v1/books/delete-book với bookid hợp lệ nhưng không tồn tại trả về 404", async () => {
    const { token } = await createUserAndToken("admin");

    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .delete("/api/v1/books/delete-book")
      .set("Authorization", `Bearer ${token}`)
      .set("bookid", nonExistingId);

    expect(res.status).toBe(404);
    expect(res.body?.code).toBe(404);
    expect(res.body?.error).toBe("Không tìm thấy sách");
  });
});
