import mongoose from "mongoose";

const { Schema, model } = mongoose;

const orderSchema = new Schema(
  {
    book: {
      ref: "Book",
      required: true,
      type: Schema.Types.ObjectId,
    },
    status: {
      default: "Đã đặt hàng",
      enum: ["Đã đặt hàng", "Đang giao hàng", "Đã giao", "Đã hủy"],
      type: String,
    },
    user: {
      ref: "User",
      required: true,
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: true,
  },
);

export const Order = model("Order", orderSchema);
