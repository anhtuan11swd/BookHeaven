import mongoose from "mongoose";

const { Schema, model } = mongoose;

const bookSchema = new Schema(
  {
    author: {
      required: true,
      trim: true,
      type: String,
    },
    description: {
      default: "",
      type: String,
    },
    image_url: {
      required: true,
      type: String,
    },
    language: {
      required: true,
      trim: true,
      type: String,
    },
    price: {
      min: 0,
      required: true,
      type: Number,
    },
    title: {
      required: true,
      trim: true,
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Book = model("Book", bookSchema);
