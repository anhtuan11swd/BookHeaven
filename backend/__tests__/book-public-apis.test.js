import express from "express";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { Book } from "../models/book.js";
import { bookRouter } from "../routes/book.js";

const createTestApp = () => {
  const app = express();

  app.use(express.json());
  app.use("/api/v1/books", bookRouter);

  return app;
};

describe("API Sách công khai", () => {
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

  test("GET /api/v1/books/get-all-books trả về danh sách sách sắp xếp mới nhất trước", async () => {
    const olderDate = new Date("2023-01-01T00:00:00.000Z");
    const newerDate = new Date("2024-01-01T00:00:00.000Z");

    await Book.create([
      {
        author: "Tác giả 1",
        createdAt: olderDate,
        description: "Sách cũ",
        image_url: "https://example.com/old.jpg",
        language: "vi",
        price: 100000,
        title: "Sách cũ",
        updatedAt: olderDate,
      },
      {
        author: "Tác giả 2",
        createdAt: newerDate,
        description: "Sách mới",
        image_url: "https://example.com/new.jpg",
        language: "vi",
        price: 150000,
        title: "Sách mới",
        updatedAt: newerDate,
      },
    ]);

    const res = await request(app).get("/api/v1/books/get-all-books");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.books)).toBe(true);
    expect(res.body.books).toHaveLength(2);
    expect(res.body.books[0]?.title).toBe("Sách mới");
    expect(res.body.books[1]?.title).toBe("Sách cũ");
  });

  test("GET /api/v1/books/get-recent-books trả về tối đa 4 sách mới nhất", async () => {
    const baseDate = new Date("2024-01-01T00:00:00.000Z");

    const booksToInsert = [];

    for (let i = 0; i < 6; i += 1) {
      booksToInsert.push({
        author: `Tác giả ${i}`,
        createdAt: new Date(baseDate.getTime() + i * 1000),
        description: `Mô tả ${i}`,
        image_url: `https://example.com/img-${i}.jpg`,
        language: "vi",
        price: 50000 + i * 10000,
        title: `Sách ${i}`,
        updatedAt: new Date(baseDate.getTime() + i * 1000),
      });
    }

    await Book.create(booksToInsert);

    const res = await request(app).get("/api/v1/books/get-recent-books");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body?.books)).toBe(true);
    expect(res.body.books.length).toBeLessThanOrEqual(4);

    const titles = res.body.books.map((b) => b.title);

    expect(titles[0]).toBe("Sách 5");
    expect(titles[1]).toBe("Sách 4");
    expect(titles[2]).toBe("Sách 3");
    expect(titles[3]).toBe("Sách 2");
  });

  test("GET /api/v1/books/get-book-by-id/:id trả về thông tin sách khi id hợp lệ", async () => {
    const book = await Book.create({
      author: "Tác giả X",
      description: "Mô tả X",
      image_url: "https://example.com/x.jpg",
      language: "vi",
      price: 123000,
      title: "Sách X",
    });

    const res = await request(app).get(
      `/api/v1/books/get-book-by-id/${book._id.toString()}`,
    );

    expect(res.status).toBe(200);
    expect(res.body?.book?._id).toBe(book._id.toString());
    expect(res.body?.book?.title).toBe("Sách X");
  });

  test("GET /api/v1/books/get-book-by-id/:id với id không hợp lệ trả về 400", async () => {
    const res = await request(app).get(
      "/api/v1/books/get-book-by-id/invalid-id",
    );

    expect(res.status).toBe(400);
    expect(res.body?.code).toBe(400);
    expect(typeof res.body?.error).toBe("string");
  });

  test("GET /api/v1/books/get-book-by-id/:id với id hợp lệ nhưng không tồn tại trả về 404", async () => {
    const nonExistingId = new mongoose.Types.ObjectId().toString();

    const res = await request(app).get(
      `/api/v1/books/get-book-by-id/${nonExistingId}`,
    );

    expect(res.status).toBe(404);
    expect(res.body?.code).toBe(404);
    expect(res.body?.error).toBe("Không tìm thấy sách");
  });
});
