import nodemailer from "nodemailer";
import { logger } from "./logger";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "Moysidis Mobile Massage <noreply@moysidis.ch>";

  if (!host || !user || !pass) {
    return null;
  }

  return { transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
}

export async function sendThankYouEmail(opts: {
  toEmail: string;
  toName: string;
  appointmentId: number;
  serviceType: string;
  reviewBaseUrl: string;
  language?: string;
}): Promise<boolean> {
  const config = createTransporter();
  if (!config) {
    logger.warn("SMTP not configured — skipping thank-you email");
    return false;
  }

  const { transporter, from } = config;
  const isDE = opts.language === "de";

  const subject = isDE
    ? "Vielen Dank für Ihre Massage bei Moysidis Mobile Massage"
    : "Thank you for your massage session — Moysidis Mobile Massage";

  const reviewLink = `${opts.reviewBaseUrl}?appointmentId=${opts.appointmentId}`;

  const html = isDE
    ? `
      <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a2444;">
        <img src="${opts.reviewBaseUrl.replace(/\/[^/]*$/, "")}/logo.png" alt="Moysidis Mobile Massage" style="width:180px; margin-bottom:24px;" />
        <h2 style="color:#1a2444;">Herzlichen Dank, ${opts.toName}!</h2>
        <p>Es war uns eine Freude, Ihnen heute eine <strong>${opts.serviceType}</strong> Massage anbieten zu dürfen.</p>
        <p>Wir hoffen, Sie fühlen sich entspannt und erholt. Ihre Gesundheit und Ihr Wohlbefinden liegen uns sehr am Herzen.</p>
        <p>Wir würden uns sehr über Ihre Bewertung freuen — es dauert nur eine Minute:</p>
        <a href="${reviewLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#1a2444;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">Bewertung abgeben ★★★★★</a>
        <p style="color:#666;font-size:13px;margin-top:32px;">Bis zum nächsten Mal — Ihr Moysidis Mobile Massage Team</p>
      </div>
    `
    : `
      <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a2444;">
        <img src="${opts.reviewBaseUrl.replace(/\/[^/]*$/, "")}/logo.png" alt="Moysidis Mobile Massage" style="width:180px; margin-bottom:24px;" />
        <h2 style="color:#1a2444;">Thank you, ${opts.toName}!</h2>
        <p>It was a pleasure to provide your <strong>${opts.serviceType}</strong> massage session today.</p>
        <p>We hope you feel relaxed, restored, and at ease. Your wellbeing is at the heart of everything we do.</p>
        <p>We'd love to hear your feedback — it only takes a moment:</p>
        <a href="${reviewLink}" style="display:inline-block;margin:16px 0;padding:12px 28px;background:#1a2444;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;">Leave a Review ★★★★★</a>
        <p style="color:#666;font-size:13px;margin-top:32px;">Until next time — The Moysidis Mobile Massage team</p>
      </div>
    `;

  try {
    await transporter.sendMail({ from, to: opts.toEmail, subject, html });
    logger.info({ to: opts.toEmail, appointmentId: opts.appointmentId }, "Thank-you email sent");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.toEmail }, "Failed to send thank-you email");
    return false;
  }
}
