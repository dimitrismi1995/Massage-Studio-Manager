import { Resend } from "resend";
import { logger } from "./logger";

// ── Brand palette ────────────────────────────────────────────────────────────
const BLUE       = "#5B9BD0";   // primary brand blue
const DARK       = "#1A2E4A";   // dark navy body text
const FOOTER_BG  = "#4A87BB";   // footer (slightly darker than brand blue)
const ICON_BG    = "#EFF6FC";   // icon circle background
const STAR_BG    = "#EFF6FC";   // star box background
const BORDER     = "#C8DFF2";   // subtle borders
const WHITE      = "#FFFFFF";

// ── Website assets (served directly from moysidismassage.ch) ─────────────────
const SITE     = "https://moysidismassage.ch/wp-content/uploads/2026/07";
const LOGO_URL = `${SITE}/Group-101.png`;
const HERO_URL = `${SITE}/professional-male-masseur-gives-shoulder-massage-young-woman-beautiful-woman-is-resting-blue-spa-bed.png`;
const PHOTO_URL = `${SITE}/Group-108-1.png`;

// ── Base64 SVG icons (data-URI — universally supported in email) ──────────────
// Content section icons: blue outline on transparent
const ICON_CARE   = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMicgaGVpZ2h0PSczMicgdmlld0JveD0nMCAwIDMyIDMyJyBmaWxsPSdub25lJz4KICAgIDxwYXRoIGQ9J00xNiA5Yy0xLjUtMi41LTUuNS0yLjUtNS41IDEuNSAwIDMuNSA1LjUgOCA1LjUgOHM1LjUtNC41IDUuNS04YzAtNC00LTQtNS41LTEuNXonIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnLz4KICAgIDxwYXRoIGQ9J004IDI2di00YzAtMS4xLjktMiAyLTJoMScgc3Ryb2tlPScjNUI5QkQwJyBzdHJva2Utd2lkdGg9JzEuNicgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJy8+CiAgICA8cGF0aCBkPSdNMjQgMjZ2LTRjMC0xLjEtLjktMiAyLTJoLTEnIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvPgogICAgPHBhdGggZD0nTTExIDIwaDEwJyBzdHJva2U9JyM1QjlCRDAnIHN0cm9rZS13aWR0aD0nMS42JyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz4KICA8L3N2Zz4=";
const ICON_RELAX  = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMicgaGVpZ2h0PSczMicgdmlld0JveD0nMCAwIDMyIDMyJyBmaWxsPSdub25lJz4KICAgIDxjaXJjbGUgY3g9JzE2JyBjeT0nNycgcj0nMi41JyBzdHJva2U9JyM1QjlCRDAnIHN0cm9rZS13aWR0aD0nMS42Jy8+CiAgICA8cGF0aCBkPSdNMTAgMTVjMS41LTIuNSAzLjUtNCA2LTRzNC41IDEuNSA2IDQnIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvPgogICAgPHBhdGggZD0nTTcgMTloMTgnIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjgnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvPgogICAgPHBhdGggZD0nTTEwIDE5bC0xLjUgNk0yMiAxOWwxLjUgNicgc3Ryb2tlPScjNUI5QkQwJyBzdHJva2Utd2lkdGg9JzEuNicgc3Ryb2tlLWxpbmVjYXA9J3JvdW5kJy8+CiAgICA8cGF0aCBkPSdNMTAgMjJoMTInIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjQnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcgc3Ryb2tlLWRhc2hhcnJheT0nMiAyJy8+CiAgPC9zdmc+";
const ICON_REVIEW = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSczMicgaGVpZ2h0PSczMicgdmlld0JveD0nMCAwIDMyIDMyJyBmaWxsPSdub25lJz4KICAgIDxwYXRoIGQ9J002IDhhMiAyIDAgMDEyLTJoMTZhMiAyIDAgMDEyIDJ2MTFhMiAyIDAgMDEtMiAyaC01LjVsLTQuNSAzLjVWMjFIOGEyIDIgMCAwMS0yLTJWOHonIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjYnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnLz4KICAgIDxwYXRoIGQ9J00xNiAxMi41bC44IDJoMi4ybC0xLjggMS40LjcgMi4xLTEuOS0xLjMtMS45IDEuMy43LTIuMS0xLjgtMS40aDIuMnonIHN0cm9rZT0nIzVCOUJEMCcgc3Ryb2tlLXdpZHRoPScxLjMnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnLz4KICA8L3N2Zz4=";

// Footer icons: white stroke on transparent
const ICON_PHONE  = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyOCcgaGVpZ2h0PScyOCcgdmlld0JveD0nMCAwIDI4IDI4JyBmaWxsPSdub25lJz4KICAgIDxwYXRoIGQ9J004IDRoNGwyIDUtMi41IDEuNWExMSAxMSAwIDAwNSA1TDE4IDEzbDUgMnY0YzAgMS4xLS45IDItMiAyQzkgMjEgNyA4IDggNmEyIDIgMCAwMTAtMnonIHN0cm9rZT0nd2hpdGUnIHN0cm9rZS13aWR0aD0nMS41JyBzdHJva2UtbGluZWNhcD0ncm91bmQnIHN0cm9rZS1saW5lam9pbj0ncm91bmQnLz4KICA8L3N2Zz4=";
const ICON_EMAIL  = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyOCcgaGVpZ2h0PScyOCcgdmlld0JveD0nMCAwIDI4IDI4JyBmaWxsPSdub25lJz4KICAgIDxyZWN0IHg9JzQnIHk9JzcnIHdpZHRoPScyMCcgaGVpZ2h0PScxNCcgcng9JzInIHN0cm9rZT0nd2hpdGUnIHN0cm9rZS13aWR0aD0nMS41Jy8+CiAgICA8cGF0aCBkPSdNNCA5bDEwIDcgMTAtNycgc3Ryb2tlPSd3aGl0ZScgc3Ryb2tlLXdpZHRoPScxLjUnIHN0cm9rZS1saW5lY2FwPSdyb3VuZCcvPgogIDwvc3ZnPg==";
const ICON_GLOBE  = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyOCcgaGVpZ2h0PScyOCcgdmlld0JveD0nMCAwIDI4IDI4JyBmaWxsPSdub25lJz4KICAgIDxjaXJjbGUgY3g9JzE0JyBjeT0nMTQnIHI9JzknIHN0cm9rZT0nd2hpdGUnIHN0cm9rZS13aWR0aD0nMS41Jy8+CiAgICA8cGF0aCBkPSdNMTQgNWMtMi41IDMtNCA1LjUtNCA5czEuNSA2IDQgOU0xNCA1YzIuNSAzIDQgNS41IDQgOXMtMS41IDYtNCA5TTUgMTRoMTgnIHN0cm9rZT0nd2hpdGUnIHN0cm9rZS13aWR0aD0nMS41JyBzdHJva2UtbGluZWNhcD0ncm91bmQnLz4KICA8L3N2Zz4=";
const ICON_PIN    = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyOCcgaGVpZ2h0PScyOCcgdmlld0JveD0nMCAwIDI4IDI4JyBmaWxsPSdub25lJz4KICAgIDxwYXRoIGQ9J00xNCA0YTcgNyAwIDAxNyA3YzAgNS03IDEzLTcgMTNTNyAxNiA3IDExYTcgNyAwIDAxNy03eicgc3Ryb2tlPSd3aGl0ZScgc3Ryb2tlLXdpZHRoPScxLjUnLz4KICAgIDxjaXJjbGUgY3g9JzE0JyBjeT0nMTEnIHI9JzIuNScgc3Ryb2tlPSd3aGl0ZScgc3Ryb2tlLXdpZHRoPScxLjUnLz4KICA8L3N2Zz4=";

// ── Diamond brand separator SVG (inline — decorative only) ───────────────────
const DIAMOND_SEP = `<svg width="52" height="24" viewBox="0 0 52 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 12 Q19 4 26 12 Q19 20 13 12Z" stroke="${BLUE}" stroke-width="1.3" fill="none"/>
  <path d="M26 12 Q33 4 39 12 Q33 20 26 12Z" stroke="${BLUE}" stroke-width="1.3" fill="none"/>
  <line x1="0" y1="12" x2="11" y2="12" stroke="${BLUE}" stroke-width="0.9" opacity="0.4"/>
  <line x1="41" y1="12" x2="52" y2="12" stroke="${BLUE}" stroke-width="0.9" opacity="0.4"/>
</svg>`;

// ── Clickable star links ──────────────────────────────────────────────────────
function buildStarLinks(baseUrl: string, clientId: number): string {
  const cells = [1, 2, 3, 4, 5].map(n => {
    const url = `${baseUrl}/review?clientId=${clientId}&stars=${n}`;
    return `<td style="padding:0 4px;">
      <a href="${url}" style="font-size:46px;color:${BLUE};text-decoration:none;
         line-height:1;display:inline-block;" title="${n} star${n > 1 ? "s" : ""}">★</a>
    </td>`;
  }).join("");
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:16px auto 10px;">
    <tr>${cells}</tr>
  </table>`;
}

// ── Icon row (content section) ────────────────────────────────────────────────
function iconRow(iconSrc: string, html: string): string {
  return `<tr>
    <td style="padding:10px 36px 10px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td width="58" valign="top" style="padding-right:16px;">
            <table cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="52" height="52"
                    style="width:52px;height:52px;background:${ICON_BG};
                           border-radius:50%;border:1px solid ${BORDER};
                           text-align:center;vertical-align:middle;" align="center" valign="middle">
                  <img src="${iconSrc}" width="30" height="30"
                       style="display:inline-block;vertical-align:middle;" alt=""/>
                </td>
              </tr>
            </table>
          </td>
          <td valign="middle"
              style="font-family:'Roboto',Arial,Helvetica,sans-serif;
                     font-size:14px;color:${DARK};line-height:1.7;vertical-align:middle;">
            ${html}
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Footer contact column ─────────────────────────────────────────────────────
function footerCol(iconSrc: string, line1: string, line2?: string): string {
  return `<td width="25%" align="center" style="padding:0 6px;vertical-align:top;">
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td width="40" height="40" align="center" valign="middle"
            style="width:40px;height:40px;background:rgba(255,255,255,0.18);
                   border-radius:50%;text-align:center;vertical-align:middle;">
          <img src="${iconSrc}" width="22" height="22"
               style="display:inline-block;vertical-align:middle;" alt=""/>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding-top:7px;
            font-family:'Roboto',Arial,Helvetica,sans-serif;
            font-size:11px;color:rgba(255,255,255,0.85);line-height:1.5;white-space:nowrap;">
          ${line1}${line2 ? `<br/>${line2}` : ""}
        </td>
      </tr>
    </table>
  </td>`;
}

// ── Plain-text fallback ───────────────────────────────────────────────────────
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
    "Phone:  +41 783118433",
    "Email:  info@moysidismassage.ch",
    "Web:    www.moysidismassage.ch",
    "Area:   Zürich & Surrounding Area",
  ].join("\n");
}

// ── HTML builder ──────────────────────────────────────────────────────────────
function buildHtml(opts: { baseUrl: string; clientId: number }): string {
  const GFONTS = "https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;600;700&family=Roboto:wght@400;500;700&family=Dancing+Script:wght@600;700&display=swap";

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
    body,table,td,p,a,h1,h2{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;margin:0;padding:0;}
    img{border:0;outline:none;text-decoration:none;}
    table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0;}
    a{color:${BLUE};}
    @media(prefers-color-scheme:dark){
      .dm-outer{background-color:#0d1b2a!important;}
      .dm-card {background-color:#132233!important;}
      .dm-text {color:#dce9f5!important;}
      .dm-sub  {color:#8ab8d8!important;}
      .dm-box  {background-color:#0d1b2a!important;border-color:#1e3a52!important;}
      .dm-sig  {background-color:#132233!important;border-color:#1e3a52!important;}
      .dm-icon {background-color:#132233!important;border-color:#1e3a52!important;}
      .dm-hr   {border-top-color:#1e3a52!important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#deedf8;">

<table class="dm-outer" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="background:#deedf8;padding:20px 0 36px;">
<tr><td align="center">

<!-- ░░ EMAIL CARD ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ -->
<table width="600" cellpadding="0" cellspacing="0" border="0"
       style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;
              box-shadow:0 4px 24px rgba(0,0,0,0.10);">

  <!-- ══ 1 · HERO ════════════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:28px 0 0;">
      <!-- Logo -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="padding:0 0 22px;">
            <img src="${LOGO_URL}" alt="Moysidis Mobile Massage"
                 width="168" style="width:168px;height:auto;display:block;margin:0 auto;"/>
          </td>
        </tr>
      </table>
      <!-- Tagline left / Photo right -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="40%" valign="middle" style="padding:0 0 0 36px;">
            <p style="margin:0;
                      font-family:'Dancing Script','Brush Script MT',cursive;
                      font-size:30px;font-weight:600;color:${DARK};line-height:1.3;">
              Wellness<br/>comes to you.
            </p>
          </td>
          <td width="60%" valign="bottom" align="right" style="padding:0;line-height:0;">
            <img src="${HERO_URL}" alt="Mobile massage"
                 width="360" style="width:100%;max-width:360px;height:auto;
                 display:block;border-radius:0 0 0 60px;margin-left:auto;"/>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Blue wave separator -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:0;line-height:0;font-size:0;mso-line-height-rule:exactly;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 38"
           style="display:block;width:100%;height:38px;" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#deedf8"/>
            <stop offset="100%" stop-color="#c8e0f5"/>
          </linearGradient>
        </defs>
        <path d="M0,0 C180,38 420,38 600,0 L600,38 L0,38 Z" fill="url(#wg)"/>
      </svg>
    </td>
  </tr>

  <!-- ══ 2 · HEADING ════════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:36px 36px 8px;text-align:center;">
      <p class="dm-sub" style="margin:0 0 6px;
           font-family:'Comfortaa','Trebuchet MS',Arial,sans-serif;
           font-size:19px;font-weight:400;color:#555;letter-spacing:0.01em;">
        Thank you for choosing
      </p>
      <h1 style="margin:0 0 20px;
                 font-family:'Comfortaa','Trebuchet MS',Arial,sans-serif;
                 font-size:30px;font-weight:700;color:${BLUE};
                 letter-spacing:-0.01em;line-height:1.2;">
        Moysidis Mobile Massage
      </h1>
      <!-- Gem separator -->
      <div style="text-align:center;line-height:0;">${DIAMOND_SEP}</div>
    </td>
  </tr>

  <!-- ══ 3 · ICON ROWS ══════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:14px 0 20px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${iconRow(ICON_CARE,   `Thank you very much for choosing <strong>Moysidis Mobile Massage</strong> today.`)}
        ${iconRow(ICON_RELAX,  `It was a pleasure taking care of you, and I hope you feel relaxed and refreshed after your session.`)}
        ${iconRow(ICON_REVIEW, `Your feedback means a lot to my business. If you enjoyed your experience, I would truly appreciate it if you could take a minute to leave a review.`)}
      </table>
    </td>
  </tr>

  <!-- Thin divider -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:0 36px;">
      <hr class="dm-hr" style="border:none;border-top:1px solid ${BORDER};margin:0;"/>
    </td>
  </tr>

  <!-- ══ 4 · STAR RATING ════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:20px 36px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:${STAR_BG};border-radius:14px;border:1px solid ${BORDER};">
        <tr>
          <td class="dm-box" style="padding:28px 20px 22px;text-align:center;">
            <p class="dm-text" style="margin:0 0 4px;
                 font-family:'Comfortaa','Trebuchet MS',Arial,sans-serif;
                 font-size:18px;font-weight:700;color:${DARK};">
              How was your experience?
            </p>
            ${buildStarLinks(opts.baseUrl, opts.clientId)}
            <p class="dm-sub" style="margin:0;
                 font-family:'Roboto',Arial,Helvetica,sans-serif;
                 font-size:12px;color:#8aabca;letter-spacing:0.02em;">
              Tap a star to leave your rating
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ══ 5 · SIGNATURE ══════════════════════════════════════════════════ -->
  <tr>
    <td class="dm-card" style="background:${WHITE};padding:0 36px 36px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="background:${ICON_BG};border-radius:14px;border:1px solid ${BORDER};">
        <tr>
          <td class="dm-sig" style="padding:24px 24px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="76" valign="top" style="padding-right:18px;">
                  <img src="${PHOTO_URL}" alt="Panagiotis Moysidis"
                       width="68" height="68"
                       style="width:68px;height:68px;border-radius:50%;
                              display:block;border:2.5px solid ${BORDER};
                              object-fit:cover;"/>
                </td>
                <td valign="middle">
                  <p class="dm-text" style="margin:0 0 3px;
                       font-family:'Roboto',Arial,Helvetica,sans-serif;
                       font-size:14px;color:${DARK};line-height:1.5;">
                    Thank you for your support,
                  </p>
                  <p style="margin:0 0 6px;
                       font-family:'Dancing Script','Brush Script MT',cursive;
                       font-size:22px;font-weight:600;color:${BLUE};line-height:1.3;">
                    and I look forward to seeing you again!
                  </p>
                  <p class="dm-text" style="margin:0;
                       font-family:'Roboto',Arial,Helvetica,sans-serif;
                       font-size:14px;font-weight:700;color:${DARK};">
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

  <!-- ══ 6 · FOOTER ═════════════════════════════════════════════════════ -->
  <tr>
    <td style="background:${FOOTER_BG};padding:28px 16px 22px;border-radius:0 0 16px 16px;">

      <!-- 4-column contact grid -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin-bottom:20px;">
        <tr>
          ${footerCol(ICON_PHONE, "+41 783118433")}
          ${footerCol(ICON_EMAIL, "info@moysidismassage.ch")}
          ${footerCol(ICON_GLOBE, "moysidismassage.ch")}
          ${footerCol(ICON_PIN,   "Zürich &amp;", "Surrounding Area")}
        </tr>
      </table>

      <!-- Divider -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0"
             style="margin-bottom:14px;">
        <tr>
          <td style="border-top:1px solid rgba(255,255,255,0.25);font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>

      <!-- Tagline -->
      <p style="margin:0 0 5px;text-align:center;
           font-family:'Comfortaa','Trebuchet MS',Arial,sans-serif;
           font-size:11px;font-weight:700;letter-spacing:0.15em;
           text-transform:uppercase;color:rgba(255,255,255,0.9);">
        MOBILE MASSAGE. PREMIUM EXPERIENCE.
      </p>
      <p style="margin:0;text-align:center;
           font-family:'Dancing Script','Brush Script MT',cursive;
           font-size:23px;font-weight:600;color:rgba(255,255,255,0.75);">
        Wherever you are.
      </p>

    </td>
  </tr>

</table>
<!-- ░░ END EMAIL CARD ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ -->

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
