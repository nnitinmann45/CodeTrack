import nodemailer from "nodemailer";
export function mailReady() {
  return process.env.MAIL_PROVIDER === "resend"
    ? Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM)
    : process.env.MAIL_PROVIDER === "smtp" &&
        Boolean(
          process.env.SMTP_HOST &&
            process.env.SMTP_USER &&
            process.env.SMTP_PASS &&
            process.env.MAIL_FROM,
        );
}
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function sendMail({ to, subject, html }) {
  if (!mailReady()) throw new Error("Email delivery has not been configured.");
  if (process.env.MAIL_PROVIDER === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM,
        to: [to],
        subject,
        html,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok)
      throw new Error(
        "Email provider rejected delivery. Check provider configuration and sender verification.",
      );
  } else {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 15000,
      socketTimeout: 15000,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });
  }
}
