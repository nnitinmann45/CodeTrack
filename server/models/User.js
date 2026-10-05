import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    timezone: { type: String, default: "Asia/Kolkata" },
    tokenVersion: { type: Number, default: 0 },
    remindersEnabled: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    verificationHash: { type: String, select: false },
    verificationExpires: Date,
    reminderSentAt: Date,
    reminderLeaseUntil: Date,
  },
  { timestamps: true },
);
export const User = mongoose.model("User", schema);
export const publicUser = (u) => ({
  id: u._id.toString(),
  name: u.name,
  email: u.email,
  timezone: u.timezone,
  remindersEnabled: u.remindersEnabled,
  emailVerified: u.emailVerified,
});
