import { Resend } from "resend";
import { logger } from "./logger";

// ── Brand palette (from moysidismassage.ch) ──────────────────────────────────
const BRAND_BLUE  = "#5B9BD0";   // primary brand blue (nav, headings, stars)
const DARK_NAVY   = "#1A2E4A";   // MOYSIDIS dark text
const FOOTER_BG   = "#3A6A96";   // footer background (darker brand blue)
const ICON_BG     = "#EEF5FA";   // icon circle fill
const LIGHT_BG    = "#F2F8FC";   // star box / subtle row bg
const BORDER_COL  = "#CBE3F5";   // dividers & borders
const WHITE       = "#FFFFFF";

// ── Website image URLs (served directly from moysidismassage.ch CDN) ─────────
const SITE        = "https://moysidismassage.ch/wp-content/uploads/2026/07";
const LOGO_URL    = `${SITE}/Group-101.png`;
const HERO_URL    = `${SITE}/professional-male-masseur-gives-shoulder-massage-young-woman-beautiful-woman-is-resting-blue-spa-bed.png`;
const PHOTO_URL   = `${SITE}/Group-108-1.png`;   // about-me section (Panagiotis)

// ── SVG icons ────────────────────────────────────────────────────────────────
const ICON_CARE = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="15" cy="9" r="4" stroke="${BRAND_BLUE}" stroke-width="1.8" fill="none"/>
  <path d="M7 26c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="${BRAND_BLUE}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M12 21l1.5 2.5 4-5" stroke="${BRAND_BLUE}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

const ICON_RELAX = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="15" cy="6" r="3" stroke="${BRAND_BLUE}" stroke-width="1.8" fill="none"/>
  <path d="M9 14s2-3.5 6-3.5 6 3.5 6 3.5" stroke="${BRAND_BLUE}" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <path d="M6 18h18" stroke="${BRAND_BLUE}" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9 18l-1 5M21 18l1 5" stroke="${BRAND_BLUE}" stroke-width="1.8" stroke-linecap="round"/>
</svg>`;

const ICON_REVIEW = `<svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M5 7a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2h-5l-5 4v-4H7a2 2 0 01-2-2V7z" stroke="${BRAND_BLUE}" stroke-width="1.8" fill="none"/>
  <path d="M15 11l.9 2h2l-1.5 1.3.5 2-1.9-1-1.9 1 .5-2L12 13h2z" stroke="${BRAND_BLUE}" stroke-width="1.4" fill="none"/>
</svg>`;

// ── Diamond separator (matches the gem icon on brand) ────────────────────────
const DIAMOND_SEP = `<svg width="40" height="22" viewBox="0 0 40 22" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 11 L11 4 L20 11 L11 18 Z" stroke="${BRAND_BLUE}" stroke-width="1.3" fill="none" opacity="0.7"/>
  <path d="M20 11 L27 4 L36 11 L27 18 Z" stroke="${BRAND_BLUE}" stroke-width="1.3" fill="none" opacity="0.7"/>
  <line x1="0" y1="11" x2="3" y2="11" stroke="${BRAND_BLUE}" stroke-width="1" opacity="0.4"/>
  <line x1="37" y1="11" x2="40" y2="11" stroke="${BRAND_BLUE}" stroke-width="1" opacity="0.4"/>
</svg>`;

// ── Clickable stars ──────────────────────────────────────────────────────────
function buildStarLinks(baseUrl: string, clientId: number): string {
  const cells = [1, 2, 3, 4, 5].map(n => {
    const url = `${baseUrl}/review?clientId=${clientId}&stars=${n}`;
    return `<td style="padding:0 6px;">
      <a href="${url}" style="font-size:44px;color:${BRAND_BLUE};text-decoration:none;line-height:1;" title="${n} star${n > 1 ? "s" : ""}">★</a>
    </td>`;
  }).join("");
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:14px auto 8px;"><tr>${cells}</tr></table>`;
}

// ── Icon row ─────────────────────────────────────────────────────────────────
function iconRow(svg: string, html: string): string {
  return `<tr><td style="padding:10px 32px;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
      <td width="60" valign="top" style="padding-right:14px;">
        <table cellpadding="0" cellspacing="0" border="0">
          <tr><td style="width:52px;height:52px;background:${ICON_BG};border-radius:50%;
              border:1px solid ${BORDER_COL};text-align:center;vertical-align:middle;"
              width="52" height="52" align="center">${svg}</td></tr>
        </table>
      </td>
      <td valign="middle" style="font-family:'Roboto',Arial,sans-serif;font-size:14px;
          color:${DARK_NAVY};line-height:1.7;">${html}</td>
    </tr></table>
  </td></tr>`;
}

// ── Plain-text fallback ──────────────────────────────────────────────────────
function buildText(opts: { baseUrl: string; clientId: number }): string {
  return [
    "Thank you very much for choosing Moysidis Mobile Massage today.",
    "",
    "It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.",
    "",
    "Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review:",
    `${opts.baseUrl}/review?clientId=${opts.clientId}&stars=5`,
    "",
    "Thank you for your support, and I look forward to seeing you again soon.",
    "",
    "Kind regards,",
    "Panagiotis Moysidis",
    "Moysidis Mobile Massage",
    "",
    "Phone:   +41 78 311 84 33",
    "Email:   info@moysidismassage.ch",
    "Web:     www.moysidismassage.ch",
    "Area:    Zürich & Surrounding Area",
  ].join("\n");
}

// ── HTML email ───────────────────────────────────────────────────────────────
function buildHtml(opts: { baseUrl: string; clientId: number }): string {
  const gFonts = "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&family=Roboto:wght@400;500;700&family=Dancing+Script:wght@600&display=swap";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light dark"/>
  <meta name="supported-color-schemes" content="light dark"/>
  <link href="${gFonts}" rel="stylesheet"/>
  <title>Thank you – Moysidis Mobile Massage</title>
  <style>
    body,table,td,p,a,h1,h2{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    img{border:0;outline:none;text-decoration:none;display:block;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    @media (prefers-color-scheme:dark){
      .dm-bg   {background-color:#0f1e2e!important;}
      .dm-card {background-color:#162638!important;border-color:#1e3a52!important;}
      .dm-txt  {color:#dce8f4!important;}
      .dm-mut  {color:#7bb0d4!important;}
      .dm-hr   {border-top-color:#1e3a52!important;}
      .dm-star {background-color:#0f1e2e!important;border-color:#1e3a52!important;}
      .dm-sig  {background-color:#162638!important;border-color:#1e3a52!important;}
      .dm-icon {background-color:#162638!important;border-color:#1e3a52!important;}
    }
  </style>
</head>
<body class="dm-bg" style="margin:0;padding:0;background:#eaf3fa;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eaf3fa;padding:24px 0 36px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- ══ HERO ═══════════════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:${WHITE};border-radius:16px 16px 0 0;padding:28px 0 0;">
      <!-- Logo -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding:0 0 20px;">
            <img src="${LOGO_URL}" alt="Moysidis Mobile Massage"
                 width="170" style="width:170px;height:auto;display:block;margin:0 auto;"/>
          </td>
        </tr>
      </table>
      <!-- Hero split: tagline left, massage photo right -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="42%" valign="middle" style="padding:0 0 0 32px;">
            <p style="margin:0;font-family:'Dancing Script',cursive;font-size:28px;
                       font-weight:600;color:${DARK_NAVY};line-height:1.35;">
              Wellness<br/>comes to you.
            </p>
          </td>
          <td width="58%" valign="bottom" style="padding:0;text-align:right;">
            <img src="${HERO_URL}" alt="Mobile massage therapy"
                 width="348" style="width:100%;max-width:348px;height:auto;
                 display:block;border-radius:0 0 0 56px;margin-left:auto;"/>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Wave separator -->
  <tr>
    <td style="background:${WHITE};padding:0;line-height:0;font-size:0;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 36"
           style="display:block;width:100%;" preserveAspectRatio="none">
        <path d="M0,0 C200,36 400,36 600,0 L600,36 L0,36 Z" fill="${LIGHT_BG}"/>
      </svg>
    </td>
  </tr>

  <!-- ══ THANK YOU HEADING ══════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:32px 32px 4px;text-align:center;">
      <p class="dm-mut" style="margin:0 0 6px;font-family:'Roboto',Arial,sans-serif;
           font-size:20px;font-weight:400;color:#555;">
        Thank you for choosing
      </p>
      <h1 style="margin:0 0 18px;font-family:'Comfortaa',Arial,sans-serif;
                 font-size:30px;font-weight:700;color:${BRAND_BLUE};letter-spacing:-0.01em;
                 line-height:1.2;">
        Moysidis Mobile Massage
      </h1>
      <div style="text-align:center;">${DIAMOND_SEP}</div>
    </td>
  </tr>

  <!-- ══ THREE ICON ROWS ════════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:12px 0 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${iconRow(ICON_CARE, `Thank you very much for choosing <strong>Moysidis Mobile Massage</strong> today.`)}
        ${iconRow(ICON_RELAX, `It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.`)}
        ${iconRow(ICON_REVIEW, `Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review.`)}
      </table>
    </td>
  </tr>

  <!-- ══ STAR RATING ════════════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:8px 32px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:${LIGHT_BG};border-radius:14px;border:1px solid ${BORDER_COL};">
        <tr>
          <td class="dm-star" style="padding:26px 16px;text-align:center;">
            <p class="dm-txt" style="margin:0 0 2px;font-family:'Comfortaa',Arial,sans-serif;
                 font-size:17px;font-weight:700;color:${DARK_NAVY};">
              How was your experience?
            </p>
            ${buildStarLinks(opts.baseUrl, opts.clientId)}
            <p class="dm-mut" style="margin:0;font-family:'Roboto',Arial,sans-serif;
                 font-size:12px;color:#888;">
              Tap a star to leave your rating
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ SIGNATURE ══════════════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:0 32px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:${LIGHT_BG};border-radius:14px;border:1px solid ${BORDER_COL};">
        <tr>
          <td class="dm-sig" style="padding:22px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <!-- Circular photo -->
                <td width="70" valign="top" style="padding-right:18px;">
                  <img src="${PHOTO_URL}" alt="Panagiotis Moysidis"
                       width="62" height="62"
                       style="width:62px;height:62px;border-radius:50%;
                              object-fit:cover;display:block;
                              border:2px solid ${BORDER_COL};"/>
                </td>
                <!-- Text -->
                <td valign="middle">
                  <p class="dm-txt" style="margin:0 0 2px;font-family:'Roboto',Arial,sans-serif;
                       font-size:14px;color:${DARK_NAVY};line-height:1.5;">
                    Thank you for your support,
                  </p>
                  <p style="margin:2px 0 6px;font-family:'Dancing Script',cursive;
                       font-size:21px;color:${BRAND_BLUE};font-weight:600;line-height:1.3;">
                    and I look forward to seeing you again!
                  </p>
                  <p class="dm-txt" style="margin:0;font-family:'Roboto',Arial,sans-serif;
                       font-size:14px;color:${DARK_NAVY};font-weight:500;">
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

  <!-- ══ FOOTER ════════════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:${FOOTER_BG};border-radius:0 0 16px 16px;padding:28px 20px 22px;">

      <!-- 4-col contact -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
        <tr>
          <td width="25%" align="center" style="padding:0 4px;">
            <p style="margin:0 0 5px;font-size:22px;line-height:1;">📞</p>
            <p style="margin:0;font-family:'Roboto',Arial,sans-serif;font-size:11px;
                 color:#d4eaf9;line-height:1.5;">+41 783118433</p>
          </td>
          <td width="25%" align="center" style="padding:0 4px;">
            <p style="margin:0 0 5px;font-size:22px;line-height:1;">✉️</p>
            <p style="margin:0;font-family:'Roboto',Arial,sans-serif;font-size:11px;
                 color:#d4eaf9;line-height:1.5;">info@moysidismassage.ch</p>
          </td>
          <td width="25%" align="center" style="padding:0 4px;">
            <p style="margin:0 0 5px;font-size:22px;line-height:1;">🌐</p>
            <p style="margin:0;font-family:'Roboto',Arial,sans-serif;font-size:11px;
                 color:#d4eaf9;line-height:1.5;">moysidismassage.ch</p>
          </td>
          <td width="25%" align="center" style="padding:0 4px;">
            <p style="margin:0 0 5px;font-size:22px;line-height:1;">📍</p>
            <p style="margin:0;font-family:'Roboto',Arial,sans-serif;font-size:11px;
                 color:#d4eaf9;line-height:1.5;">Zürich &amp;<br/>Surrounding Area</p>
          </td>
        </tr>
      </table>

      <hr style="border:none;border-top:1px solid rgba(255,255,255,0.2);margin:0 0 16px;"/>

      <p style="margin:0 0 4px;font-family:'Comfortaa',Arial,sans-serif;font-size:11px;
           font-weight:700;letter-spacing:0.12em;text-transform:uppercase;
           color:#e8f4fc;text-align:center;">
        MOBILE MASSAGE. PREMIUM EXPERIENCE.
      </p>
      <p style="margin:0;font-family:'Dancing Script',cursive;font-size:22px;
           color:#b8d8f0;text-align:center;font-weight:600;">
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

// ── Exported send function ───────────────────────────────────────────────────
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
