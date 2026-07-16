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

function buildHtml(reviewUrl?: string): string {
  const reviewBlock = reviewUrl
    ? `
      <p style="margin:20px 0 8px;">Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review.</p>
      <p style="margin:16px 0;">
        <a href="${reviewUrl}" style="display:inline-block;padding:12px 28px;background:#1a2444;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-size:15px;">Leave a Review ★★★★★</a>
      </p>
    `
    : `<p style="margin:20px 0 8px;">Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review.</p>`;

  return `
    <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a2444; line-height: 1.8;">
      <p>Thank you very much for choosing Moysidis Mobile Massage today.</p>
      <p>It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.</p>
      ${reviewBlock}
      <p style="margin-top:24px;">Thank you for your support, and I look forward to seeing you again soon.</p>
      <p style="margin-top:24px;">Kind regards,<br/><strong>Panagiotis Moysidis</strong><br/>Moysidis Mobile Massage</p>
    </div>
  `;
}

export async function sendNewClientThankYouEmail(opts: {
  toEmail: string;
  toName: string;
  reviewUrl?: string;
}): Promise<boolean> {
  const config = buildTransport();
  if (!config) {
    logger.warn("SMTP_HOST not configured — skipping thank-you email");
    return false;
  }

  const { transporter, from } = config;
  const subject = "Thank you for choosing Moysidis Mobile Massage";
  const html = buildHtml(opts.reviewUrl);

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
    logger.warn("SMTP_HOST not configured — skipping thank-you email");
    return false;
  }

  const { transporter, from } = config;
  const subject = "Thank you for choosing Moysidis Mobile Massage";
  const html = buildHtml();

  try {
    await transporter.sendMail({ from, to: opts.toEmail, subject, html });
    logger.info({ to: opts.toEmail }, "Returning client thank-you email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.toEmail }, "Failed to send returning client thank-you email");
    return false;
  }
}
