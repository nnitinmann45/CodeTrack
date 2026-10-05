import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    platform: {
      type: String,
      enum: ["LeetCode", "Codeforces", "HackerRank", "GeeksforGeeks", "Other"],
      required: true,
    },
    url: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      required: true,
    },
    topic: { type: String, required: true },
    solvedDate: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);
schema.index({ user: 1, url: 1 }, { unique: true });
schema.index({ user: 1, solvedDate: -1 });
export const Problem = mongoose.model("Problem", schema);
