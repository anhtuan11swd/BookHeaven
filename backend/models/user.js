import mongoose from "mongoose";

const { Schema, model } = mongoose;

const userSchema = new Schema(
  {
    address: {
      default: "",
      trim: true,
      type: String,
    },
    avatar: {
      default: "",
      type: String,
    },
    cart: [
      {
        ref: "Book",
        type: Schema.Types.ObjectId,
      },
    ],
    email: {
      lowercase: true,
      required: true,
      trim: true,
      type: String,
      unique: true,
    },
    favorites: [
      {
        ref: "Book",
        type: Schema.Types.ObjectId,
      },
    ],
    orders: [
      {
        ref: "Order",
        type: Schema.Types.ObjectId,
      },
    ],
    password: {
      required: true,
      type: String,
    },
    role: {
      default: "user",
      enum: ["user", "admin"],
      type: String,
    },
    username: {
      required: true,
      trim: true,
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const User = model("User", userSchema);
