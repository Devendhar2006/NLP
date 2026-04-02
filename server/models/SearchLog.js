import mongoose from "mongoose";

const searchLogSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, trim: true },
    totalResults: { type: Number, required: true },
    safeResults: { type: Number, required: true },
    blockedResults: { type: Number, required: true },
    includeBlocked: { type: Boolean, default: false },
    checkedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

export const SearchLog = mongoose.model("SearchLog", searchLogSchema);
