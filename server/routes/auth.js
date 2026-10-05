import { Router } from "express";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { rateLimit } from "express-rate-limit";
import { User, publicUser } from "../models/User.js";
import {
  registrationSchema,
  emailSchema,
  timezoneSchema,
} from "../lib/validation.js";
import {
  authenticate,
  setSession,
  cookieName,
  cookieOptions,
} from "../middleware/auth.js";
import { mailReady, sendMail, escapeHtml } from "../lib/mail.js";
export function authRoutes(config) {
  const r = Router(),
    auth = authenticate(config);
  const loginLimit = rateLimit({
    windowMs: 15 * 60000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
  });
  const mailLimit = rateLimit({
    windowMs: 60 * 60000,
    limit: 3,
    keyGenerator: (req) => req.user.id,
    message: {
      message:
        "Please wait an hour before requesting more verification emails.",
    },
  });
  r.post("/register", loginLimit, async (req, res) => {
    const data = registrationSchema.parse(req.body);
    const user = await User.create({
      ...data,
      passwordHash: await bcrypt.hash(data.password, 12),
    });
    setSession(res, user, config);
    res.status(201).json({ user: publicUser(user) });
  });
  r.post("/login", loginLimit, async (req, res) => {
    const data = z
      .object({ email: emailSchema, password: z.string().min(1).max(72) })
      .parse(req.body);
    const user = await User.findOne({ email: data.email }).select(
      "+passwordHash",
    );
    // A fixed valid hash also performs work for unknown accounts.
    const dummy =
      "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
    const valid = await bcrypt.compare(
      data.password,
      user?.passwordHash || dummy,
    );
    if (!user || !valid)
      return res.status(401).json({ message: "Incorrect email or password." });
    setSession(res, user, config);
    res.json({ user: publicUser(user) });
  });
  r.get("/me", auth, (req, res) =>
    res.json({ user: publicUser(req.user), mailConfigured: mailReady() }),
  );
  r.post("/logout", auth, async (req, res) => {
    await User.updateOne({ _id: req.user.id }, { $inc: { tokenVersion: 1 } });
    const { maxAge, ...options } = cookieOptions(config);
    res.clearCookie(cookieName, options);
    res.json({ message: "Logged out on all devices." });
  });
  r.patch("/settings", auth, async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(2).max(60),
        timezone: timezoneSchema,
        remindersEnabled: z.boolean(),
      })
      .parse(req.body);
    if (data.remindersEnabled && (!req.user.emailVerified || !mailReady()))
      return res
        .status(400)
        .json({
          message:
            "Verify your email and configure email delivery before enabling reminders.",
        });
    Object.assign(req.user, data);
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  });
  r.post("/send-verification", auth, mailLimit, async (req, res) => {
    if (!mailReady())
      return res
        .status(503)
        .json({ message: "Email is not configured on this deployment." });
    if (req.user.emailVerified)
      return res.json({ message: "Your email is already verified." });
    const token = randomBytes(32).toString("hex");
    req.user.verificationHash = createHash("sha256")
      .update(token)
      .digest("hex");
    req.user.verificationExpires = new Date(Date.now() + 3600000);
    await req.user.save();
    await sendMail({
      to: req.user.email,
      subject: "Verify your CodeTrack email",
      html: `<p>Hi ${escapeHtml(req.user.name)},</p><p><a href="${config.origin}/?verify=${token}">Verify your email</a> to enable optional practice reminders. This link expires in one hour.</p><p>If you did not request this, ignore this message.</p>`,
    });
    res.json({ message: "Verification email sent. Check your inbox." });
  });
  r.post("/verify-email", async (req, res) => {
    const { token } = z
      .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
      .parse(req.body);
    const user = await User.findOneAndUpdate(
      {
        verificationHash: createHash("sha256").update(token).digest("hex"),
        verificationExpires: { $gt: new Date() },
      },
      {
        $set: { emailVerified: true },
        $unset: { verificationHash: 1, verificationExpires: 1 },
      },
    );
    if (!user)
      return res
        .status(400)
        .json({ message: "Verification link is invalid or expired." });
    res.json({
      message: "Email verified. You can now enable reminders in Settings.",
    });
  });
  return r;
}
