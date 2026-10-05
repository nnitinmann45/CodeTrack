import { z } from "zod";
import { todayIn } from "./stats.js";
export const timezoneSchema = z.string().refine((v) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: v });
    return true;
  } catch {
    return false;
  }
}, "Invalid timezone");
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const registrationSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: emailSchema,
  password: z
    .string()
    .min(8)
    .max(72)
    .refine(
      (v) => Buffer.byteLength(v, "utf8") <= 72,
      "Password must be at most 72 UTF-8 bytes",
    ),
  timezone: timezoneSchema.default("Asia/Kolkata"),
});
export function problemSchema(timezone) {
  return z.object({
    title: z.string().trim().min(1).max(160),
    platform: z.enum([
      "LeetCode",
      "Codeforces",
      "HackerRank",
      "GeeksforGeeks",
      "Other",
    ]),
    url: z
      .string()
      .trim()
      .url()
      .max(1000)
      .refine(
        (v) => ["https:", "http:"].includes(new URL(v).protocol),
        "Use an HTTP or HTTPS link",
      )
      .transform((v) => {
        const u = new URL(v);
        u.hash = "";
        u.search = "";
        u.hostname = u.hostname.toLowerCase();
        return u.toString().replace(/\/$/, "");
      }),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    topic: z.string().trim().min(1).max(60),
    solvedDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => {
        const d = new Date(v + "T00:00:00Z");
        return (
          !isNaN(d) &&
          d.toISOString().slice(0, 10) === v &&
          v >= "2000-01-01" &&
          v <= todayIn(timezone)
        );
      }, "Use a real date between 2000-01-01 and today"),
    notes: z.string().trim().max(5000).default(""),
  });
}
