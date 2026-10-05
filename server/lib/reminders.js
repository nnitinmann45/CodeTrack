import { User } from "../models/User.js";
import { Problem } from "../models/Problem.js";
import { todayIn, shiftDate } from "./stats.js";
import { mailReady, sendMail, escapeHtml } from "./mail.js";
export async function runReminders(origin) {
  if (!mailReady()) return { sent: 0, failed: 0, skipped: "Email is disabled" };
  const now = new Date(),
    cutoff = new Date(now.getTime() - 86400000);
  // Daily reminders only for verified, opted-in users inactive for two calendar days.
  const candidates = await User.find({
    remindersEnabled: true,
    emailVerified: true,
    createdAt: { $lte: new Date(now.getTime() - 2 * 86400000) },
    $or: [
      { reminderSentAt: { $exists: false } },
      { reminderSentAt: { $lte: cutoff } },
    ],
  }).limit(100);
  let sent = 0,
    failed = 0;
  for (const user of candidates) {
    const latest = await Problem.findOne({ user: user.id })
      .sort({ solvedDate: -1 })
      .lean();
    if (
      latest &&
      latest.solvedDate > shiftDate(todayIn(user.timezone, now), -2)
    )
      continue;
    const claimed = await User.findOneAndUpdate(
      {
        _id: user.id,
        remindersEnabled: true,
        emailVerified: true,
        $and: [
          {
            $or: [
              { reminderLeaseUntil: { $exists: false } },
              { reminderLeaseUntil: { $lte: now } },
            ],
          },
          {
            $or: [
              { reminderSentAt: { $exists: false } },
              { reminderSentAt: { $lte: cutoff } },
            ],
          },
        ],
      },
      { $set: { reminderLeaseUntil: new Date(now.getTime() + 10 * 60000) } },
      { new: true },
    );
    if (!claimed) continue;
    try {
      await sendMail({
        to: user.email,
        subject: "One problem today? Your CodeTrack reminder",
        html: `<h2>Hi ${escapeHtml(user.name)},</h2><p>A little practice goes a long way. Pick one problem and keep learning.</p><p><a href="${escapeHtml(origin)}">Open CodeTrack</a></p><p>You requested these reminders. You can turn them off in CodeTrack Settings.</p>`,
      });
      await User.updateOne(
        { _id: user.id },
        {
          $set: { reminderSentAt: new Date() },
          $unset: { reminderLeaseUntil: 1 },
        },
      );
      sent++;
    } catch {
      await User.updateOne(
        { _id: user.id },
        { $unset: { reminderLeaseUntil: 1 } },
      );
      failed++;
    }
  }
  return { sent, failed };
}
