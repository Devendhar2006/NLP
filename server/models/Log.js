import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    result: { type: String, enum: ["safe", "unsafe"], required: true },
    maskedText: { type: String, required: true },
    confidence: { type: Number, required: true },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const Log = mongoose.model("Log", logSchema);
