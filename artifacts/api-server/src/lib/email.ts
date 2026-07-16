import nodemailer from "nodemailer";
import { logger } from "./logger";

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "Moysidis Mobile Massage <info@moysidismassage.ch>";

  if (!host) return null;

  const auth = user && pass ? { user, pass } : user ? { user, pass: "" } : undefined;

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth,
      // Papaki shared hosting uses a *.papaki.gr cert — disable strict hostname check
      tls: { rejectUnauthorized: false },
    }),
    from,
  };
}

export async function sendNewClientThankYouEmail(opts: {
  toEmail: string;
  toName: string;
  reviewUrl?: string;
}): Promise<boolean> {
  const config = buildTransport();
  if (!config) {
    logger.warn("SMTP_HOST not configured — skipping new client thank-you email");
    return false;
  }

  const { transporter, from } = config;
  const subject = "Thank you for choosing Moysidis Mobile Massage";

  const reviewSection = opts.reviewUrl
    ? `
      <p style="margin-top:24px;">We'd love to hear about your experience — it only takes a moment:</p>
      <a href="${opts.reviewUrl}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#1a2444;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;">Leave a Feedback ★★★★★</a>
    `
    : `<p style="margin-top:24px;">We hope you had a wonderful experience and we look forward to seeing you again.</p>`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a2444; line-height: 1.7;">
      <h2 style="color:#1a2444; margin-bottom:8px;">Thank you for choosing Moysidis Mobile Massage, ${opts.toName}!</h2>
      <p>It was a pleasure to have you with us today.</p>
      <p>We hope you feel relaxed, restored, and at ease. Your wellbeing is at the heart of everything we do.</p>
      ${reviewSection}
      <p style="color:#666; font-size:13px; margin-top:32px;">Until next time,<br/><strong>Moysidis Mobile Massage</strong></p>
    </div>
  `;

  try {
    await transporter.sendMail({ from, to: opts.toEmail, subject, html });
    logger.info({ to: opts.toEmail }, "New client thank-you email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.toEmail }, "Failed to send new client thank-you email");
    return false;
  }
}

export async function sendReturningClientThankYouEmail(opts: {
  toEmail: string;
  toName: string;
}): Promise<boolean> {
  const config = buildTransport();
  if (!config) {
    logger.warn("SMTP_HOST not configured — skipping returning client thank-you email");
    return false;
  }

  const { transporter, from } = config;
  const subject = "Thank you once again for choosing Moysidis Mobile Massage";

  const html = `
    <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a2444; line-height: 1.7;">
      <h2 style="color:#1a2444; margin-bottom:8px;">Thank you once again for choosing Moysidis Mobile Massage, ${opts.toName}!</h2>
      <p>It is always a pleasure to welcome you back.</p>
      <p>We hope today's session left you feeling relaxed and refreshed. Your wellbeing means the world to us.</p>
      <p style="color:#666; font-size:13px; margin-top:32px;">Until next time,<br/><strong>Moysidis Mobile Massage</strong></p>
    </div>
  `;

  try {
    await transporter.sendMail({ from, to: opts.toEmail, subject, html });
    logger.info({ to: opts.toEmail }, "Returning client thank-you email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.toEmail }, "Failed to send returning client thank-you email");
    return false;
  }
}
