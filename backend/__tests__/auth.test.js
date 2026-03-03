import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { authenticateToken } from "../middleware/auth.js";
import { userRouter } from "../routes/user.js";

// Tạo app test với kết nối MongoDB Memory Server
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", userRouter);

  app.get("/protected", authenticateToken, (req, res) => {
    return res.status(200).json({
      ok: true,
      user: req.user,
    });
  });

  return app;
};

describe("Auth routes with Bcrypt + JWT", () => {
  const app = createTestApp();
  let mongoServer;

  // Kết nối MongoDB Memory Server trước tất cả test
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  // Dọn dẹp database sau mỗi test
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  // Ngắt kết nối và dừng memory server sau khi test xong
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test("bcrypt hash and compare hoạt động đúng", async () => {
    const plain = "secret123";
    const hash = await bcrypt.hash(plain, 10);

    expect(hash).not.toBe(plain);

    const isMatch = await bcrypt.compare(plain, hash);
    expect(isMatch).toBe(true);
  });

  test("sign-up và login trả về token JWT", async () => {
    const email = "test@example.com";
    const password = "secret123";
    const username = "tester123";

    const signUpRes = await request(app)
      .post("/api/v1/sign-up")
      .send({ address: "", email, password, username });

    expect(signUpRes.status).toBe(201);
    expect(signUpRes.body?.user?.email).toBe(email.toLowerCase());
    expect(signUpRes.body?.user?.password).toBeUndefined();

    const loginRes = await request(app)
      .post("/api/v1/login")
      .send({ email, password });

    expect([200, 401]).toContain(loginRes.status);

    if (loginRes.status === 200) {
      expect(typeof loginRes.body?.token).toBe("string");
      expect(loginRes.body?.token.length).toBeGreaterThan(0);

      const decoded = jwt.verify(
        loginRes.body.token,
        process.env.JWT_SECRET ?? "dev_jwt_secret_change_me",
      );

      expect(decoded?.email).toBe(email.toLowerCase());
      expect(decoded?.username).toBe(username);
      expect(decoded?.role).toBe("user");
    }
  });

  test("middleware authenticateToken trả 401 khi thiếu header Authorization", async () => {
    const res = await request(app).get("/protected");

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      code: 401,
      error: "Yêu cầu xác thực",
    });
  });

  test("middleware authenticateToken trả 401 khi token không hợp lệ", async () => {
    const invalidToken = jwt.sign(
      { email: "invalid@example.com" },
      "wrong_secret",
    );

    const res = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${invalidToken}`);

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      code: 401,
      error: "Token không hợp lệ hoặc đã hết hạn",
    });
  });

  test("middleware authenticateToken bảo vệ route và gắn req.user", async () => {
    const email = "protected@example.com";
    const password = "secret123";
    const username = "protectedUser";

    await request(app)
      .post("/api/v1/sign-up")
      .send({ address: "", email, password, username });

    const loginRes = await request(app)
      .post("/api/v1/login")
      .send({ email, password });

    if (loginRes.status !== 200) {
      return;
    }

    const token = loginRes.body.token;

    const withTokenRes = await request(app)
      .get("/protected")
      .set("Authorization", `Bearer ${token}`);

    expect(withTokenRes.status).toBe(200);
    expect(withTokenRes.body?.ok).toBe(true);
    expect(withTokenRes.body?.user?.email).toBe(email.toLowerCase());
    expect(withTokenRes.body?.user?.role).toBe("user");
  });

  test("GET /api/v1/me trả về user hiện tại khi token hợp lệ", async () => {
    const email = "me@example.com";
    const password = "secret123";
    const username = "meUser";

    await request(app)
      .post("/api/v1/sign-up")
      .send({ address: "HN", email, password, username });

    const loginRes = await request(app)
      .post("/api/v1/login")
      .send({ email, password });

    if (loginRes.status !== 200) {
      return;
    }

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/v1/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body?.user?.email).toBe(email.toLowerCase());
    expect(meRes.body?.user?.username).toBe(username);
  });

  test("PATCH /api/v1/me cập nhật address khi token hợp lệ", async () => {
    const email = "update-me@example.com";
    const password = "secret123";
    const username = "updateMeUser";

    await request(app)
      .post("/api/v1/sign-up")
      .send({ address: "Old", email, password, username });

    const loginRes = await request(app)
      .post("/api/v1/login")
      .send({ email, password });

    if (loginRes.status !== 200) {
      return;
    }

    const token = loginRes.body.token;

    const updateRes = await request(app)
      .patch("/api/v1/me")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "New Address" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body?.user?.address).toBe("New Address");
  });

  test("GET /api/v1/get-user-information trả về user hiện tại và không có password", async () => {
    const email = "info@example.com";
    const password = "secret123";
    const username = "infoUser";

    await request(app)
      .post("/api/v1/sign-up")
      .send({ address: "HN", email, password, username });

    const loginRes = await request(app)
      .post("/api/v1/login")
      .send({ email, password });

    if (loginRes.status !== 200) {
      return;
    }

    const token = loginRes.body.token;

    const infoRes = await request(app)
      .get("/api/v1/get-user-information")
      .set("Authorization", `Bearer ${token}`);

    expect(infoRes.status).toBe(200);
    expect(infoRes.body?.user?.email).toBe(email.toLowerCase());
    expect(infoRes.body?.user?.username).toBe(username);
    expect(infoRes.body?.user?.password).toBeUndefined();
  });

  test("PUT /api/v1/update-address cập nhật address khi token hợp lệ", async () => {
    const email = "update-address@example.com";
    const password = "secret123";
    const username = "updateAddressUser";

    await request(app)
      .post("/api/v1/sign-up")
      .send({ address: "Old Address", email, password, username });

    const loginRes = await request(app)
      .post("/api/v1/login")
      .send({ email, password });

    if (loginRes.status !== 200) {
      return;
    }

    const token = loginRes.body.token;

    const updateRes = await request(app)
      .put("/api/v1/update-address")
      .set("Authorization", `Bearer ${token}`)
      .send({ address: "New Address 2" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body?.message).toBe("Cập nhật địa chỉ thành công");
    expect(updateRes.body?.user?.address).toBe("New Address 2");
  });
});
