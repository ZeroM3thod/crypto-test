/**
 * Verification-code email. No branding or site name.
 * Every colour comes from globals.css (dark theme tokens), with white as the accent.
 */

export type OtpPurpose = "signup" | "login" | "reset" | (string & {});

export type OtpEmailInput = {
  code: string;
  purpose?: OtpPurpose;
  firstName?: string;
  /** Minutes until the code expires. Default 10. */
  expiresInMinutes?: number;
  /**
   * Base URL of your app (e.g. https://example.com). Used for the "Copy code" button,
   * which opens `${appUrl}/copy#CODE`. Defaults to process.env.APP_URL.
   * If neither is set, the button is left out.
   */
  appUrl?: string;
};

const C = {
  background: "#151515",
  foreground: "#ededed",
  border: "#2a2a2a",
  muted: "#1f1f1f",
  mutedForeground: "#a1a1aa",
  accent: "#ffffff",
  card: "#1c1c1c",
};

const SERIF = "'Cormorant Garamond',Georgia,'Times New Roman',serif";
const SANS = "'DM Sans',Arial,Helvetica,sans-serif";
const MONO = "'SF Mono',SFMono-Regular,ui-monospace,Menlo,Consolas,'Liberation Mono',monospace";

const COPY: Record<string, { subject: string; before: string; accent: string; lead: string; ignore: string }> = {
  signup: {
    subject: "Verify your email",
    before: "Confirm Your",
    accent: "Email",
    lead: "Enter the code below to verify your email address and activate your account.",
    ignore: "If you did not create an account, you can safely ignore this email.",
  },
  login: {
    subject: "Your sign-in code",
    before: "Your",
    accent: "Sign-in Code",
    lead: "Enter the code below to finish signing in to your account.",
    ignore: "If this wasn’t you, ignore this email and consider changing your password.",
  },
  reset: {
    subject: "Reset your password",
    before: "Reset Your",
    accent: "Password",
    lead: "Enter the code below to choose a new password for your account.",
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
  const base = (input.appUrl || process.env.APP_URL || "").replace(/\/+$/, "");
  const copyUrl = base ? `${base}/copy#${encodeURIComponent(code)}` : "";

  const subject = copy.subject;
  const preheader = `Your verification code is ${code}. It expires in ${minutes} minutes.`;

  const bar = `background:${C.accent};background-image:linear-gradient(90deg,transparent,${C.accent} 30%,${C.accent} 70%,transparent);`;

  const digits = code
    .split("")
    .map(
      (d) => `
                      <td align="center" width="46" style="padding:0 4px;">
                        <div style="width:46px;height:60px;line-height:60px;background:${C.background};border:1px solid ${C.border};border-radius:4px;font-family:${MONO};font-size:28px;font-weight:600;color:${C.foreground};text-align:center;">${esc(d)}</div>
                      </td>`
    )
    .join("");

  const button = copyUrl
    ? `
                  <!-- Copy button -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:24px;">
                    <tr>
                      <td style="background-color:${C.accent};border-radius:4px;text-align:center;">
                        <a href="${esc(copyUrl)}" target="_blank" style="display:inline-block;padding:14px 40px;font-family:${SANS};font-size:12px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;color:${C.background};text-decoration:none;">
                          Copy code
                        </a>
                      </td>
                    </tr>
                  </table>`
    : "";

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
                <td class="px" style="padding:52px 48px 44px;">

                  <!-- Headline -->
                  <h1 class="h1" style="font-family:${SERIF};font-size:32px;font-weight:400;color:${C.foreground};text-align:center;margin:0 0 24px;line-height:1.2;letter-spacing:-0.01em;">
                    ${esc(copy.before)} <em style="font-style:italic;color:${C.accent};">${esc(copy.accent)}</em>
                  </h1>

                  <!-- Body text -->
                  <p style="font-family:${SANS};font-size:15px;font-weight:300;color:${C.foreground};line-height:1.8;margin:0 0 32px;text-align:center;">
                    ${name ? `Hi ${name}. ` : ""}${esc(copy.lead)}
                  </p>

                  <!-- Code -->
                  <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:24px;-webkit-user-select:all;user-select:all;">
                    <tr>${digits}
                    </tr>
                  </table>
${button}
                  <p style="font-family:${SANS};font-size:12px;color:${C.mutedForeground};text-align:center;line-height:1.8;margin:0;">
                    This code expires in <strong style="color:${C.foreground};font-weight:500;">${minutes} minutes</strong>.
                  </p>

                </td>
              </tr>
            </table>

            <!-- FOOTER -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td class="px" style="background-color:${C.muted};border-top:1px solid ${C.border};padding:24px 48px;border-radius:0 0 4px 4px;text-align:center;">
                  <p style="margin:0;font-family:${SANS};font-size:12px;font-weight:300;color:${C.mutedForeground};line-height:1.8;">
                    ${esc(copy.ignore)}
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
    copy.ignore,
  ].join("\n");

  return { subject, html, text };
}