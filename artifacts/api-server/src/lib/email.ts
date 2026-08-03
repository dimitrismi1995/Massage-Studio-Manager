import { Resend } from "resend";
import { logger } from "./logger";

// Brand palette (mirrors index.css)
const NAVY   = "#0d1f3c";   // hsl(216 65% 11%) — primary / sidebar
const STEEL  = "#4a6fa5";   // hsl(215 38% 47%) — accent
const WARM   = "#f7f5f2";   // hsl(30 20% 97%)  — background
const MUTED  = "#526278";   // hsl(216 20% 40%) — muted foreground
const BORDER = "#cdd4de";   // hsl(216 20% 85%) — border
const AMBER  = "#f59e0b";   // star colour

function buildStarLinks(baseUrl: string, clientId: number): string {
  const stars = [1, 2, 3, 4, 5].map(n => {
    const url = `${baseUrl}/review?clientId=${clientId}&stars=${n}`;
    return `<td style="padding:0 6px;">
      <a href="${url}"
         style="display:inline-block;font-size:40px;text-decoration:none;color:${AMBER};line-height:1;transition:transform .1s;"
         title="${n} star${n > 1 ? "s" : ""}">★</a>
    </td>`;
  }).join("");

  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 8px;">
      <tr>${stars}</tr>
    </table>
    <p style="font-size:13px;color:${MUTED};margin:0 0 8px;text-align:center;font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
      Tap a star to leave your rating
    </p>`;
}

function buildHtml(opts: { baseUrl: string; clientId: number }): string {
  const googleFont = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <link href="${googleFont}" rel="stylesheet"/>
  <title>Thank you for choosing Moysidis Mobile Massage</title>
</head>
<body style="margin:0;padding:0;background-color:${WARM};font-family:'Plus Jakarta Sans',Georgia,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background-color:${WARM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;">

          <!-- ── Header ── -->
          <tr>
            <td style="background-color:${NAVY};border-radius:12px 12px 0 0;
                        padding:36px 40px 28px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;
                         letter-spacing:0.12em;text-transform:uppercase;
                         color:rgba(255,255,255,0.55);
                         font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Mobile Massage Therapy
              </p>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;
                          letter-spacing:-0.01em;line-height:1.2;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Moysidis Mobile Massage
              </h1>
            </td>
          </tr>

          <!-- ── Accent stripe ── -->
          <tr>
            <td style="background-color:${STEEL};height:4px;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 12px 12px;
                        padding:40px 40px 32px;border:1px solid ${BORDER};
                        border-top:none;">

              <p style="margin:0 0 20px;font-size:16px;font-weight:600;
                          color:${NAVY};line-height:1.5;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Dear Client,
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Thank you very much for choosing Moysidis Mobile Massage today.
              </p>

              <p style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                It was a pleasure taking care of you, and I hope you feel relaxed
                and refreshed after your session.
              </p>

              <p style="margin:0 0 24px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Your feedback means a lot to my business. If you enjoyed your
                experience, I would truly appreciate it if you could take a minute
                to leave a review.
              </p>

              <!-- ── Stars ── -->
              <div style="background-color:${WARM};border-radius:10px;
                           padding:24px 16px;text-align:center;
                           border:1px solid ${BORDER};margin:0 0 28px;">
                <p style="margin:0 0 4px;font-size:13px;font-weight:600;
                            letter-spacing:0.08em;text-transform:uppercase;
                            color:${MUTED};
                            font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                  How was your session?
                </p>
                ${buildStarLinks(opts.baseUrl, opts.clientId)}
              </div>

              <p style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Thank you for your support, and I look forward to seeing you
                again soon.
              </p>

              <!-- ── Divider ── -->
              <hr style="border:none;border-top:1px solid ${BORDER};margin:28px 0;"/>

              <p style="margin:0;font-size:15px;color:${NAVY};line-height:1.7;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Kind regards,<br/>
                <strong style="font-weight:700;">Panagiotis Moysidis</strong><br/>
                <span style="color:${STEEL};font-weight:600;">Moysidis Mobile Massage</span>
              </p>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:20px 0 8px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${MUTED};
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                © ${new Date().getFullYear()} Moysidis Mobile Massage · Switzerland
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function buildText(opts: { baseUrl: string; clientId: number }): string {
  const reviewUrl = `${opts.baseUrl}/review?clientId=${opts.clientId}&stars=5`;
  return [
    "Thank you very much for choosing Moysidis Mobile Massage today.",
    "",
    "It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.",
    "",
    "Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review:",
    reviewUrl,
    "",
    "Thank you for your support, and I look forward to seeing you again soon.",
    "",
    "Kind regards,",
    "Panagiotis Moysidis",
    "Moysidis Mobile Massage",
  ].join("\n");
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
      text: buildText({ baseUrl: opts.baseUrl, clientId: opts.clientId }),
      headers: {
        "X-Entity-Ref-ID": `moysidis-thankyou-${opts.clientId}-${Date.now()}`,
      },
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
