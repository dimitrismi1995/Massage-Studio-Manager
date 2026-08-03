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
  const logoUrl = `${opts.baseUrl}/logo.png`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <link href="${googleFont}" rel="stylesheet"/>
  <title>Thank you for choosing Moysidis Mobile Massage</title>
  <style>
    /* Dark mode overrides — keeps the navy header as-is (already dark),
       adapts the body card and text so it stays readable */
    @media (prefers-color-scheme: dark) {
      .email-outer  { background-color: #0d1f3c !important; }
      .email-card   { background-color: #122240 !important; border-color: #1e3a5f !important; }
      .email-text   { color: #e8edf5 !important; }
      .email-muted  { color: #8fa3bc !important; }
      .email-divider{ border-top-color: #1e3a5f !important; }
      .email-star-box { background-color: #0d1f3c !important; border-color: #1e3a5f !important; }
      .email-steel  { color: #7ba4d4 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${WARM};font-family:'Plus Jakarta Sans',Georgia,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         class="email-outer"
         style="background-color:${WARM};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:560px;">

          <!-- ── Header (always dark navy — logo visible in both modes) ── -->
          <tr>
            <td style="background-color:${NAVY};border-radius:12px 12px 0 0;
                        padding:28px 40px 24px;text-align:center;">
              <img src="${logoUrl}"
                   alt="Moysidis Mobile Massage"
                   width="80" height="60"
                   style="display:block;margin:0 auto 12px;width:80px;height:auto;
                          border:0;outline:none;text-decoration:none;"
              />
              <p style="margin:0 0 2px;font-size:11px;font-weight:600;
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
            <td class="email-card"
                style="background-color:#ffffff;border-radius:0 0 12px 12px;
                        padding:40px 40px 32px;border:1px solid ${BORDER};
                        border-top:none;">

              <p class="email-text"
                 style="margin:0 0 20px;font-size:16px;font-weight:600;
                          color:${NAVY};line-height:1.5;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Dear Client,
              </p>

              <p class="email-text"
                 style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Thank you very much for choosing Moysidis Mobile Massage today.
              </p>

              <p class="email-text"
                 style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                It was a pleasure taking care of you, and I hope you feel relaxed
                and refreshed after your session.
              </p>

              <p class="email-text"
                 style="margin:0 0 24px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Your feedback means a lot to my business. If you enjoyed your
                experience, I would truly appreciate it if you could take a minute
                to leave a review.
              </p>

              <!-- ── Stars ── -->
              <table class="email-star-box" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:${WARM};border-radius:10px;
                            border:1px solid ${BORDER};margin:0 0 28px;">
                <tr>
                  <td style="padding:24px 16px;text-align:center;">
                    <p class="email-muted"
                       style="margin:0 0 4px;font-size:13px;font-weight:600;
                               letter-spacing:0.08em;text-transform:uppercase;
                               color:${MUTED};
                               font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                      How was your session?
                    </p>
                    ${buildStarLinks(opts.baseUrl, opts.clientId)}
                  </td>
                </tr>
              </table>

              <p class="email-text"
                 style="margin:0 0 16px;font-size:15px;color:${NAVY};line-height:1.75;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Thank you for your support, and I look forward to seeing you
                again soon.
              </p>

              <!-- ── Divider ── -->
              <hr class="email-divider"
                  style="border:none;border-top:1px solid ${BORDER};margin:28px 0;"/>

              <p class="email-text"
                 style="margin:0;font-size:15px;color:${NAVY};line-height:1.7;
                          font-family:'Plus Jakarta Sans',Georgia,sans-serif;">
                Kind regards,<br/>
                <strong style="font-weight:700;">Panagiotis Moysidis</strong><br/>
                <span class="email-steel"
                      style="color:${STEEL};font-weight:600;">Moysidis Mobile Massage</span>
              </p>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:20px 0 8px;text-align:center;">
              <p class="email-muted"
                 style="margin:0;font-size:12px;color:${MUTED};
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
