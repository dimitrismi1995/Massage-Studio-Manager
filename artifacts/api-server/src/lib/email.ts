import { Resend } from "resend";
import { logger } from "./logger";

// ── Brand palette ────────────────────────────────────────────────────────────
const BLUE      = "#5B9BD0";
const DARK      = "#1A2E4A";
const FOOTER_BG = "#4A87BB";
const ICON_BG   = "#EFF6FC";
const BORDER    = "#C8DFF2";
const WHITE     = "#FFFFFF";

// ── Website image URLs ────────────────────────────────────────────────────────
const SITE     = "https://moysidismassage.ch/wp-content/uploads/2026/07";
const LOGO_URL = `${SITE}/Group-101.png`;
const HERO_URL = "https://moysidismobilemassage.com/email-hero.png";
const PHOTO_URL = `${SITE}/Group-108-1.png`;
const GOOGLE_REVIEW_URL = "https://www.google.com/search?sca_esv=12e2dcfd274873dd&biw=402&bih=684&sxsrf=APpeQnvnUd68x-VTy2GRW_Pfl4FPr3Ylzw:1788597512480&kgmid=/g/11zdr_q5lz&q=Moysidis+Premium+Mobile+Massage&shem=epsd1,ltae,rimspwouoe&shndl=30&source=sh/x/loc/act/m1/3&kgs=6bf36dca77cf2898&utm_source=epsd1,ltae,rimspwouoe,sh/x/loc/act/m1/3";

// ── Icon glyphs (Unicode symbols — no external files, 100% email-client safe) ──
const ICON_CARE   = "&#x2665;"; // ♥  solid heart
const ICON_RELAX  = "&#x273F;"; // ✿  florette / lotus flower
const ICON_REVIEW = "&#x2726;"; // ✦  four-pointed star / quality

// ── App static asset base (footer pin icon hosted here) ──────────────────────
const APP_STATIC    = "https://moysidismobilemassage.com";
const PIN_ICON_URL  = `${APP_STATIC}/icon-pin.svg`;
const GLOBE_ICON_URL = `${APP_STATIC}/icon-globe.svg`;

// ── Google Fonts — Comfortaa only (single brand font) ────────────────────────
const GFONTS = "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&display=swap";
// Font stack with web-safe fallback
const FONT = "'Comfortaa','Trebuchet MS',Arial,Helvetica,sans-serif";

// ── Diamond brand separator ───────────────────────────────────────────────────
const DIAMOND_SEP = `
<svg width="52" height="24" viewBox="0 0 52 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 12 Q19 4 26 12 Q19 20 13 12Z" stroke="${BLUE}" stroke-width="1.3"/>
  <path d="M26 12 Q33 4 39 12 Q33 20 26 12Z" stroke="${BLUE}" stroke-width="1.3"/>
  <line x1="0" y1="12" x2="11" y2="12" stroke="${BLUE}" stroke-width="0.9" opacity="0.4"/>
  <line x1="41" y1="12" x2="52" y2="12" stroke="${BLUE}" stroke-width="0.9" opacity="0.4"/>
</svg>`;

// ── Icon row — Unicode glyph (white on solid blue circle, no external files) ──
function iconRow(glyph: string, html: string): string {
  return `<tr>
    <td style="padding:10px 36px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="68" valign="middle" style="padding-right:16px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="56" height="56" align="center" valign="middle"
                    style="width:56px;height:56px;min-width:56px;
                           background:${BLUE};border-radius:50%;
                           font-family:Arial,Helvetica,sans-serif;
                           font-size:26px;color:#FFFFFF;
                           text-align:center;line-height:56px;
                           mso-line-height-rule:exactly;">
                  ${glyph}
                </td>
              </tr>
            </table>
          </td>
          <td valign="middle"
              style="font-family:${FONT};font-size:14px;color:${DARK};line-height:1.75;">
            ${html}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Star links ────────────────────────────────────────────────────────────────
function buildStarLinks(baseUrl: string, clientId: number): string {
  return [1, 2, 3, 4, 5].map(n => {
    const url = `${baseUrl}/review?clientId=${clientId}&stars=${n}`;
    return `<a href="${url}" style="font-size:44px;color:${BLUE};text-decoration:none;
              display:inline-block;line-height:1;padding:0 4px;"
              title="${n} star${n > 1 ? "s" : ""}">&#9734;</a>`;
  }).join("");
}

// ── Plain-text fallback ───────────────────────────────────────────────────────
function buildText(opts: { baseUrl: string; clientId: number }): string {
  return [
    "Thank you very much for choosing Moysidis Mobile Massage today.",
    "",
    "It was a pleasure taking care of you, and I hope you feel relaxed and refreshed.",
    "",
    "Please rate your experience:",
    `${opts.baseUrl}/review?clientId=${opts.clientId}&stars=5`,
    "",
    "Leave a Google review:",
    GOOGLE_REVIEW_URL,
    "",
    "Thank you for your support, and I look forward to seeing you again!",
    "",
    "– Panagiotis",
    "Moysidis Mobile Massage",
    "",
    "Phone:  +41 783118433",
    "Email:  info@moysidismassage.ch",
    "Web:    www.moysidismassage.ch",
    "Area:   Zürich & Surrounding Area",
  ].join("\n");
}

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHtml(opts: { baseUrl: string; clientId: number }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <link href="${GFONTS}" rel="stylesheet"/>
  <title>Thank you – Moysidis Mobile Massage</title>
  <style>
    body,table,td,p,a,h1,h2,span{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    img{border:0;outline:none;text-decoration:none;-webkit-user-drag:none;user-drag:none;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    a{color:${BLUE};}
    @media(prefers-color-scheme:dark){
      .dm-outer {background-color:#0d1b2a!important;}
      .dm-white {background-color:#132233!important;}
      .dm-text  {color:#dce9f5!important;}
      .dm-sub   {color:#8ab8d8!important;}
      .dm-box   {background-color:#0d1b2a!important;border-color:#1e3a52!important;}
      .dm-icon  {background-color:#132233!important;border-color:#1e3a52!important;}
      .dm-hr    {border-top-color:#1e3a52!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#deedf8;">

<table class="dm-outer" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#deedf8;padding:20px 0 40px;">
<tr><td align="center">

<table width="600" cellpadding="0" cellspacing="0" border="0"
       style="max-width:600px;width:100%;border-radius:18px;overflow:hidden;
              box-shadow:0 4px 28px rgba(0,0,0,0.12);">

  <!-- ══ 1 · HEADER: Logo ════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:28px 0 20px;text-align:center;">
      <img src="${LOGO_URL}" alt="Moysidis Mobile Massage"
           width="172" style="width:172px;height:auto;display:block;margin:0 auto;"/>
    </td>
  </tr>

  <!-- ══ 2 · HERO: Massage photo, centered ═══════════════════════════════ -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:0;text-align:center;line-height:0;">
      <img src="${HERO_URL}" alt=""
           width="600"
           style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;-webkit-user-drag:none;user-drag:none;"/>
    </td>
  </tr>

  <!-- Wave separator -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:0;line-height:0;font-size:0;mso-line-height-rule:exactly;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 36"
           style="display:block;width:100%;height:36px;" preserveAspectRatio="none">
        <path d="M0,0 C180,36 420,36 600,0 L600,36 L0,36 Z" fill="#deedf8"/>
      </svg>
    </td>
  </tr>

  <!-- ══ 3 · HEADING ═════════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:36px 36px 4px;text-align:center;">
      <p class="dm-sub" style="margin:0 0 8px;
           font-family:${FONT};font-size:18px;font-weight:400;color:#666;
           letter-spacing:0.01em;">
        Thank you for choosing
      </p>
      <h1 style="margin:0 0 20px;
                 font-family:${FONT};
                 font-size:28px;font-weight:700;color:${BLUE};
                 letter-spacing:-0.01em;line-height:1.2;">
        Moysidis Mobile Massage
      </h1>
      <div style="text-align:center;line-height:0;font-size:0;">${DIAMOND_SEP}</div>
    </td>
  </tr>

  <!-- ══ 4 · ICON ROWS ═══════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:16px 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${iconRow(ICON_CARE,   `Thank you very much for choosing <strong>Moysidis Mobile Massage</strong> today.`)}
        ${iconRow(ICON_RELAX,  `It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.`)}
        ${iconRow(ICON_REVIEW, `Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review.`)}
      </table>
    </td>
  </tr>

  <!-- Divider -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:0 36px;">
      <hr class="dm-hr" style="border:none;border-top:1px solid ${BORDER};margin:0;"/>
    </td>
  </tr>

  <!-- ══ 5 · STAR RATING ═════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:22px 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:${ICON_BG};border-radius:14px;border:1.5px solid ${BORDER};">
        <tr>
          <td class="dm-box" style="padding:28px 20px 22px;text-align:center;">
            <p class="dm-text" style="margin:0 0 8px;
                 font-family:${FONT};font-size:17px;font-weight:700;color:${DARK};">
              How was your experience?
            </p>
            <div style="margin:0 0 10px;line-height:1;">
              ${buildStarLinks(opts.baseUrl, opts.clientId)}
            </div>
            <p class="dm-sub" style="margin:0;font-family:${FONT};
                 font-size:12px;color:#7aA6C6;letter-spacing:0.04em;">
              Tap a star to leave your rating
            </p>
             <table cellpadding="0" cellspacing="0" border="0" align="center"
                    style="margin:22px auto 0;">
               <tr>
                 <td align="center" bgcolor="${BLUE}"
                     style="background:${BLUE};border-radius:24px;">
                   <a href="${GOOGLE_REVIEW_URL}"
                      target="_blank"
                      style="display:inline-block;padding:13px 24px;
                             font-family:${FONT};font-size:14px;font-weight:700;
                             color:#FFFFFF;text-decoration:none;border-radius:24px;">
                     Leave a Google Review
                   </a>
                 </td>
               </tr>
             </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ 6 · SIGNATURE ═══════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-white" style="background:${WHITE};padding:0 36px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:${ICON_BG};border-radius:14px;border:1.5px solid ${BORDER};">
        <tr>
          <td class="dm-icon" style="padding:22px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="80" valign="middle" style="padding-right:18px;">
                  <img src="${PHOTO_URL}" alt="Panagiotis Moysidis"
                       width="68" height="68"
                       style="width:68px;height:68px;border-radius:50%;
                              display:block;border:2px solid ${BORDER};
                              object-fit:cover;-webkit-user-drag:none;user-drag:none;"/>
                </td>
                <td valign="middle">
                  <p class="dm-text" style="margin:0 0 6px;
                       font-family:${FONT};font-size:15px;color:${DARK};
                       font-weight:400;line-height:1.65;">
                    Thank you for your support,<br/>
                    and I look forward to seeing you again!
                  </p>
                  <p class="dm-text" style="margin:0;
                       font-family:${FONT};font-size:15px;
                       font-weight:700;color:${DARK};">
                    – Panagiotis
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ 7 · FOOTER ══════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:${FOOTER_BG};padding:28px 20px 24px;border-radius:0 0 18px 18px;">

      <!-- 4-col contact — all text forced #FFFFFF; icons are plain Unicode (no emoji) so CSS color applies -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin-bottom:22px;">
        <tr>
          <!-- Phone -->
          <td width="25%" align="center" valign="top" style="padding:0 4px;">
            <p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;
                 font-size:20px;line-height:1;color:#FFFFFF;">&#x260E;</p>
            <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;
                 color:#FFFFFF;line-height:1.55;">+41 783118433</p>
          </td>
          <!-- Email -->
          <td width="25%" align="center" valign="top" style="padding:0 4px;">
            <p style="margin:0 0 5px;font-family:Arial,Helvetica,sans-serif;
                 font-size:20px;line-height:1;color:#FFFFFF;">&#x2709;</p>
            <p style="margin:0;font-family:${FONT};font-size:11px;font-weight:700;
                 color:#FFFFFF;line-height:1.55;">
              <a href="mailto:info@moysidismassage.ch"
                 style="color:#FFFFFF;text-decoration:none;">info@moysidismassage.ch</a>
            </p>
          </td>
          <!-- Website -->
          <td width="25%" align="center" valign="top" style="padding:0 4px;">
            <img src="${GLOBE_ICON_URL}" width="22" height="22" alt=""
                 style="width:22px;height:22px;display:block;margin:0 auto 5px;"/>
            <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;
                 color:#FFFFFF;line-height:1.55;">
              <a href="https://www.moysidismassage.ch"
                 style="color:#FFFFFF;text-decoration:none;">moysidismassage.ch</a>
            </p>
          </td>
          <!-- Location -->
          <td width="25%" align="center" valign="top" style="padding:0 4px;">
            <img src="${PIN_ICON_URL}" width="22" height="22" alt=""
                 style="width:22px;height:22px;display:block;margin:0 auto 5px;"/>
            <p style="margin:0;font-family:${FONT};font-size:12px;font-weight:700;
                 color:#FFFFFF;line-height:1.55;">Zürich &amp;<br/>Surrounding Area</p>
          </td>
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin-bottom:16px;">
        <tr>
          <td style="border-top:1px solid rgba(255,255,255,0.4);
                     font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>

      <!-- Tagline -->
      <p style="margin:0 0 6px;text-align:center;
           font-family:${FONT};font-size:12px;font-weight:700;
           letter-spacing:0.18em;text-transform:uppercase;color:#FFFFFF;">
        MOBILE MASSAGE. PREMIUM EXPERIENCE.
      </p>
      <p style="margin:0;text-align:center;
           font-family:${FONT};font-size:20px;font-weight:600;
           font-style:italic;color:#FFFFFF;">
        Wherever you are.
      </p>

    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

// ── Exported send function ────────────────────────────────────────────────────
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
