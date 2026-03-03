import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./connection/connection.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 1000;

app.get("/", (_req, res) => {
  res.send("Xin chào từ backend");
});

const startServer = async () => {
  const result = await connectDatabase();

  if (!result.ok) {
    console.error(result.error.error);
    return;
  }

  app.listen(PORT, () => {
    // Chỉ log thông tin không nhạy cảm
    console.log(`Server đang chạy trên cổng ${PORT}`);
  });
};

startServer();
