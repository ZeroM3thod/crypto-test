Here is the full code, also attached as `email-template.ts`.

**1. `lib/auth/email-template.ts`**

```ts
export type OtpPurpose = "signup" | "login" | "reset" | (string & {});

export type OtpEmailInput = {
  code: string;
  purpose?: OtpPurpose;
  firstName?: string;
  expiresInMinutes?: number;
  appName?: string;
  appUrl?: string;
  supportEmail?: string;
};

const C = {
  bg: "#151515",
  card: "#1c1c1c",
  cell: "#151515",
  border: "#2a2a2a",
  borderStrong: "#363636",
  text: "#f2f2f2",
  muted: "#8f8f8f",
  faint: "#5f5f5f",
  primary: "#0285f7",
  accent: "#2dd4c4",
  warning: "#f5b942",
};

const FONT =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif";
const MONO =
  "'SF Mono',SFMono-Regular,ui-monospace,Menlo,Consolas,'Liberation Mono',monospace";

const COPY: Record<string, { subject: string; title: string; lead: string; ignore: string }> = {
  signup: {
    subject: "Verify your email",
    title: "Confirm your email",
    lead: "Welcome aboard! Enter this code to finish creating your account.",
    ignore: "If you didn’t create an account, you can safely ignore this email.",
  },
  login: {
    subject: "Your sign-in code",
    title: "Your sign-in code",
    lead: "Use this code to finish signing in to your account.",
    ignore: "If this wasn’t you, ignore this email and consider changing your password.",
  },
  reset: {
    subject: "Reset your password",
    title: "Reset your password",
    lead: "Use this code to choose a new password for your account.",
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
  const appName = input.appName || process.env.APP_NAME || "Your App";
  const appUrl = input.appUrl || process.env.APP_URL || "";
  const supportEmail = input.supportEmail || process.env.SUPPORT_EMAIL || "";
  const minutes = input.expiresInMinutes ?? 10;
  const copy = COPY[input.purpose || "signup"] || COPY.signup;
  const code = String(input.code).replace(/\s+/g, "");
  const name = input.firstName ? esc(input.firstName.trim()) : "";
  const brand = esc(appName);
  const year = new Date().getFullYear();

  const subject = `${copy.subject} · ${appName}`;
  const preheader = `Your ${appName} code is ${code}. It expires in ${minutes} minutes.`;

  const digits = code
    .split("")
    .map(
      (d) => `
                <td align="center" width="46" style="padding:0 4px;">
                  <div style="width:46px;height:58px;line-height:58px;background:${C.cell};border:1px solid ${C.borderStrong};border-radius:12px;font-family:${MONO};font-size:26px;font-weight:700;color:${C.text};text-align:center;">${esc(d)}</div>
                </td>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>${esc(subject)}</title>
  <style>
    @media (max-width:520px) {
      .px { padding-left:20px !important; padding-right:20px !important; }
      .title { font-size:22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${C.bg};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">
    ${esc(preheader)}${"&nbsp;&zwnj;".repeat(40)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:480px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:30px;height:30px;border-radius:9px;background:${C.primary};background-image:linear-gradient(135deg,${C.primary},${C.accent});text-align:center;font-family:${FONT};font-size:15px;font-weight:800;color:#ffffff;line-height:30px;">${esc(appName.charAt(0).toUpperCase())}</td>
                  <td style="padding-left:10px;font-family:${FONT};font-size:17px;font-weight:600;color:${C.text};letter-spacing:-0.01em;">${
                    appUrl
                      ? `<a href="${esc(appUrl)}" style="color:${C.text};text-decoration:none;">${brand}</a>`
                      : brand
                  }</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${C.card};border:1px solid ${C.border};border-radius:20px;overflow:hidden;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">

                <tr>
                  <td height="3" style="height:3px;line-height:3px;font-size:0;background:${C.primary};background-image:linear-gradient(90deg,${C.primary},${C.accent});">&nbsp;</td>
                </tr>

                <tr>
                  <td class="px" style="padding:36px 36px 8px;font-family:${FONT};">
                    <div style="display:inline-block;padding:5px 11px;border:1px solid ${C.border};border-radius:999px;background:${C.bg};font-size:12px;font-weight:500;color:${C.muted};">
                      <span style="color:${C.accent};">&#9679;</span>&nbsp; Verification code
                    </div>
                    <h1 class="title" style="margin:18px 0 10px;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:${C.text};">${esc(copy.title)}</h1>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:${C.muted};">
                      ${name ? `Hi ${name}, ` : ""}${esc(copy.lead)}
                    </p>
                  </td>
                </tr>

                <tr>
                  <td class="px" align="center" style="padding:28px 36px 8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                      <tr>${digits}
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td class="px" align="center" style="padding:16px 36px 4px;font-family:${FONT};font-size:13px;color:${C.muted};">
                    <span style="color:${C.warning};">&#9201;</span>&nbsp; Expires in <strong style="color:${C.text};font-weight:600;">${minutes} minutes</strong>
                  </td>
                </tr>

                <tr>
                  <td class="px" style="padding:28px 36px 0;">
                    <div style="height:1px;line-height:1px;font-size:0;background:${C.border};">&nbsp;</div>
                  </td>
                </tr>

                <tr>
                  <td class="px" style="padding:22px 36px 34px;font-family:${FONT};">
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:${C.muted};">
                      <strong style="color:${C.text};font-weight:600;">Never share this code.</strong>
                      ${esc(appName)} will never ask for it by phone, chat or email.
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:${C.faint};">${esc(copy.ignore)}</p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px 12px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${C.faint};">
              ${
                supportEmail
                  ? `Need help? <a href="mailto:${esc(supportEmail)}" style="color:${C.muted};text-decoration:underline;">${esc(supportEmail)}</a><br/>`
                  : ""
              }
              &copy; ${year} ${brand}. All rights reserved.<br/>
              This is an automated message, please don’t reply.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `${copy.title} — ${appName}`,
    "",
    `${name ? `Hi ${input.firstName?.trim()}, ` : ""}${copy.lead}`,
    "",
    `Your code: ${code}`,
    `Expires in ${minutes} minutes.`,
    "",
    `Never share this code. ${appName} will never ask for it.`,
    copy.ignore,
  ].join("\n");

  return { subject, html, text };
}
```

**2. Using it inside `createOtp`** (in `@/lib/auth/backend`)

```ts
import { renderOtpEmail } from "@/lib/auth/email-template";

// after you generate and store the code:
const { subject, html, text } = renderOtpEmail({
  code,
  purpose,                    // "signup" | "login" | "reset"
  firstName: user.firstName,
  expiresInMinutes: 10,       // match your real expiry
});

await sendMail({ to: email, subject, html, text });
```

**3. Example `sendMail`** (only if you don't have one yet; this uses nodemailer)

```ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `"${process.env.APP_NAME}" <no-reply@yourdomain.com>`,
    ...opts,
  });
}
```

**4. `.env`**

```
APP_NAME=YourBrand
APP_URL=https://yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
MAIL_FROM="YourBrand <no-reply@yourdomain.com>"
```

`route.ts` needs no change, since it already calls `createOtp`. If you send me your `backend.ts`, I'll make the exact edit to `createOtp` instead of this generic snippet.