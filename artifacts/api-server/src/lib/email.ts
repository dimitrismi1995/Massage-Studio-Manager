import { Resend } from "resend";
import { logger } from "./logger";

function buildStarLinks(baseUrl: string, clientId: number): string {
  const cells = [1, 2, 3, 4, 5].map(n => {
    const url = `${baseUrl}/review?clientId=${clientId}&stars=${n}`;
    return `<td style="padding:0 4px;">
      <a href="${url}" style="font-size:36px;text-decoration:none;color:#f59e0b;line-height:1;" title="${n} star${n > 1 ? 's' : ''}">★</a>
    </td>`;
  }).join('');

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:20px auto;">
      <tr>${cells}</tr>
    </table>
    <p style="font-size:12px;color:#999;margin-top:4px;text-align:center;">Tap a star to leave your rating</p>
  `;
}

function buildHtml(opts: { baseUrl: string; clientId: number }): string {
  return `
    <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; color: #1a2444; line-height: 1.8;">
      <p>Thank you very much for choosing Moysidis Mobile Massage today.</p>
      <p>It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.</p>
      <p style="margin-top:20px;">Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review.</p>
      ${buildStarLinks(opts.baseUrl, opts.clientId)}
      <p style="margin-top:24px;">Thank you for your support, and I look forward to seeing you again soon.</p>
      <p style="margin-top:24px;">Kind regards,<br/><strong>Panagiotis Moysidis</strong><br/>Moysidis Mobile Massage</p>
    </div>
  `;
}

export async function sendThankYouEmail(opts: {
  toEmail: string;
  toName: string;
  clientId: number;
  baseUrl: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("RESEND_API_KEY not configured — skipping thank-you email");
    return false;
  }

  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: "Moysidis Mobile Massage <info@moysidismassage.ch>",
      to: opts.toEmail,
      subject: "Thank you for choosing Moysidis Mobile Massage",
      html: buildHtml({ baseUrl: opts.baseUrl, clientId: opts.clientId }),
    });

    if (error) {
      logger.error({ error, to: opts.toEmail }, "Resend API error sending thank-you email");
      return false;
    }

    logger.info({ to: opts.toEmail, clientId: opts.clientId }, "Thank-you email sent via Resend");
    return true;
  } catch (err) {
    logger.error({ err, to: opts.toEmail }, "Failed to send thank-you email via Resend");
    return false;
  }
}
