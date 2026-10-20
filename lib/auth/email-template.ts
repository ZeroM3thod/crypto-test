/**
 * Verification-code email. No branding or site name.
 * Layout follows the reference design; every colour comes from globals.css (dark theme tokens).
 */

export type OtpPurpose = "signup" | "login" | "reset" | (string & {});

export type OtpEmailInput = {
  code: string;
  purpose?: OtpPurpose;
  firstName?: string;
  /** Minutes until the code expires. Default 10. */
  expiresInMinutes?: number;
};

// globals.css dark tokens
const C = {
  background: "#151515",
  foreground: "#ededed",
  border: "#2a2a2a",
  muted: "#1f1f1f",
  mutedForeground: "#a1a1aa",
  primary: "#ffffff",
  card: "#1c1c1c",
  chartFg: "#71717a",
};

const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "'DM Sans',Arial,Helvetica,sans-serif";
const MONO = "'SF Mono',SFMono-Regular,ui-monospace,Menlo,Consolas,'Liberation Mono',monospace";

const COPY: Record<
  string,
  { subject: string; before: string; accent: string; tagline: string; lead: string; sub: string; ignore: string }
> = {
  signup: {
    subject: "Verify your email",
    before: "Confirm Your",
    accent: "Email",
    tagline: "One step away from your account",
    lead: "Your account has been created. Enter the code below to verify your email address.",
    sub: "Verifying your email activates your account and keeps it secure.",
    ignore: "If you did not create an account, you can safely ignore this email.",
  },
  login: {
    subject: "Your sign-in code",
    before: "Your",
    accent: "Sign-in Code",
    tagline: "Finish signing in",
    lead: "Enter the code below to finish signing in to your account.",
    sub: "This code can only be used once.",
    ignore: "If this wasn’t you, ignore this email and consider changing your password.",
  },
  reset: {
    subject: "Reset your password",
    before: "Reset Your",
    accent: "Password",
    tagline: "Choose a new password",
    lead: "Enter the code below to choose a new password for your account.",
    sub: "This code can only be used once.",
    ignore: "If you didn’t request a reset, ignore this email. Your password won’t change.",
  },
};

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderOtpEmail(input: OtpEmailInput) {
  const minutes = input.expiresInMinutes ?? 10;
  const copy = COPY[input.purpose || "signup"] || COPY.signup;
  const code = String(input.code).replace(/\s+/g, "");
  const name = input.firstName ? esc(input.firstName.trim()) : "";

  const subject = copy.subject;
  const preheader = `Your verification code is ${code}. It expires in ${minutes} minutes.`;

  const rule = (color: string) =>
    `background:${color};background-image:linear-gradient(90deg,transparent,${color},transparent);`;
  const bar = `background:${C.primary};background-image:linear-gradient(90deg,transparent,${C.primary} 30%,${C.primary} 70%,transparent);`;

  const digits = code
    .split("")
    .map(
      (d) => `
                      <td align="center" width="46" style="padding:0 4px;">
                        <div style="width:46px;height:60px;line-height:60px;background:${C.background};border:1px solid ${C.border};border-radius:4px;font-family:${MONO};font-size:28px;font-weight:600;color:${C.foreground};text-align:center;">${esc(d)}</div>
                      </td>`
    )
    .join("");

  const infoCell = (title: string, sub: string, middle = false) => `
                      <td width="33%" style="text-align:center;padding:0 8px;${
                        middle ? `border-left:1px solid ${C.border};border-right:1px solid ${C.border};` : ""
                      }">
                        <p style="margin:0 0 6px;font-family:${SERIF};font-size:20px;color:${C.primary};">&#10022;</p>
                        <p style="margin:0;font-family:${SANS};font-size:11px;font-weight:400;letter-spacing:0.1em;text-transform:uppercase;color:${C.foreground};">${title}</p>
                        <p style="margin:4px 0 0;font-family:${SANS};font-size:11px;font-weight:300;color:${C.mutedForeground};">${sub}</p>
                      </td>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  @media (max-width:520px) {
    .px { padding-left:24px !important; padding-right:24px !important; }
    .h1 { font-size:27px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.background};font-family:${SANS};">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">
  ${esc(preheader)}${"&nbsp;&zwnj;".repeat(40)}
</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${C.background};padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

        <!-- TOP BAR -->
        <tr>
          <td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td height="3" style="height:3px;line-height:3px;font-size:0;${bar}border-radius:2px;">&nbsp;</td>
          </tr></table></td>
        </tr>

        <!-- CARD -->
        <tr>
          <td style="background-color:${C.card};border-left:1px solid ${C.border};border-right:1px solid ${C.border};border-bottom:1px solid ${C.border};border-radius:0 0 4px 4px;">

            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="px" style="padding:52px 48px 0;">

                  <!-- Icon badge -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:32px;">
                    <tr>
                      <td style="background:${C.muted};border:1px solid ${C.border};border-radius:50%;width:72px;height:72px;text-align:center;vertical-align:middle;">
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top:20px;">
                          <circle cx="16" cy="16" r="14" stroke="${C.primary}" stroke-width="1.2" stroke-dasharray="3 2"/>
                          <path d="M10 16.5L14 20.5L22 12" stroke="${C.primary}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </td>
                    </tr>
                  </table>

                  <!-- Headline -->
                  <h1 class="h1" style="font-family:${SERIF};font-size:32px;font-weight:400;color:${C.foreground};text-align:center;margin:0 0 12px;line-height:1.2;letter-spacing:-0.01em;">
                    ${esc(copy.before)} <em style="font-style:italic;color:${C.primary};">${esc(copy.accent)}</em>
                  </h1>
                  <p style="font-family:${SANS};font-size:13px;font-weight:300;color:${C.mutedForeground};text-align:center;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 36px;">${esc(copy.tagline)}</p>

                  <!-- Rule -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                    <tr><td height="1" style="height:1px;line-height:1px;font-size:0;${rule(C.border)}">&nbsp;</td></tr>
                  </table>

                  <!-- Body text -->
                  <p style="font-family:${SANS};font-size:15px;font-weight:300;color:${C.foreground};line-height:1.8;margin:0 0 16px;text-align:center;">
                    ${name ? `Hi ${name}. ` : ""}${esc(copy.lead)}
                  </p>
                  <p style="font-family:${SANS};font-size:15px;font-weight:300;color:${C.mutedForeground};line-height:1.8;margin:0 0 36px;text-align:center;">
                    ${esc(copy.sub)}
                  </p>

                  <!-- Code -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:20px;">
                    <tr>${digits}
                    </tr>
                  </table>

                  <p style="font-family:${SANS};font-size:12px;color:${C.mutedForeground};text-align:center;line-height:1.8;margin:0 0 44px;">
                    This code expires in <strong style="color:${C.foreground};font-weight:500;">${minutes} minutes</strong>.
                  </p>

                  <!-- Divider -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                    <tr><td height="1" style="height:1px;line-height:1px;font-size:0;${rule(C.border)}">&nbsp;</td></tr>
                  </table>

                  <!-- Info row -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:48px;">
                    <tr>${infoCell("Single-use", "One-time code")}${infoCell("Time-limited", `${minutes} minutes`, true)}${infoCell("Private", "Never share it")}
                    </tr>
                  </table>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="px" style="background-color:${C.muted};border-top:1px solid ${C.border};padding:28px 48px;border-radius:0 0 4px 4px;text-align:center;">
                  <p style="margin:0 0 10px;font-family:${SANS};font-size:12px;font-weight:300;color:${C.mutedForeground};line-height:1.8;">
                    ${esc(copy.ignore)}
                  </p>
                  <p style="margin:0;font-family:${SANS};font-size:10px;font-weight:300;color:${C.chartFg};letter-spacing:0.08em;text-transform:uppercase;">
                    Automated message &middot; Please do not reply
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- BOTTOM BAR -->
        <tr>
          <td><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
            <td height="3" style="height:3px;line-height:3px;font-size:0;${bar}border-radius:2px;">&nbsp;</td>
          </tr></table></td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;

  const text = [
    `${copy.before} ${copy.accent}`,
    "",
    `${name ? `Hi ${input.firstName?.trim()}. ` : ""}${copy.lead}`,
    "",
    `Your code: ${code}`,
    `Expires in ${minutes} minutes.`,
    "",
    "Never share this code with anyone.",
    copy.ignore,
  ].join("\n");

  return { subject, html, text };
}