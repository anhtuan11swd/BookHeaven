import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDatabase } from "./connection/connection.js";
import { bookRouter } from "./routes/book.js";
import { cartRouter } from "./routes/cart.js";
import { favoriteRouter } from "./routes/favorite.js";
import { orderRouter } from "./routes/order.js";
import { userRouter } from "./routes/user.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 1000;

app.use(express.json());
app.use(cors());

app.use("/api/v1", userRouter);
app.use("/api/v1", favoriteRouter);
app.use("/api/v1", cartRouter);
app.use("/api/v1", orderRouter);
app.use("/api/v1/books", bookRouter);

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
