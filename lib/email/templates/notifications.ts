const esc = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function renderNotificationEmail(title: string, message: string, details: Record<string, string | number> = {}) {
  const safeTitle = esc(title);
  const safeMessage = esc(message);
  const rows = Object.entries(details).map(([label, value]) => `<tr><td style="padding:10px 0;color:#a1a1aa;border-bottom:1px solid #2a2a2a">${esc(label)}</td><td style="padding:10px 0;text-align:right;border-bottom:1px solid #2a2a2a;color:#ededed">${esc(String(value))}</td></tr>`).join("");
  const text = `${message}${Object.entries(details).map(([label, value]) => `\n${label}: ${value}`).join("")}`;
  return {
    subject: title,
    text,
    html: `<!DOCTYPE html><html lang="en"><body style="margin:0;padding:40px 16px;background:#151515;font-family:Arial,Helvetica,sans-serif;color:#ededed"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table role="presentation" width="600" style="max-width:600px;width:100%;background:#1c1c1c;border:1px solid #2a2a2a"><tr><td style="height:3px;background:#fff"></td></tr><tr><td style="padding:40px"><h1 style="font-family:Georgia,serif;font-weight:400;text-align:center">${safeTitle}</h1><p style="font-size:15px;line-height:1.8;text-align:center">${safeMessage}</p><table role="presentation" width="100%" style="margin-top:28px;border-collapse:collapse">${rows}</table><p style="font-size:12px;color:#a1a1aa;text-align:center;margin:30px 0 0">If you have questions, contact our support team.</p></td></tr><tr><td style="height:3px;background:#fff"></td></tr></table></td></tr></table></body></html>`,
  };
}

export async function sendNotificationEmail(email: string, title: string, message: string, details: Record<string, string | number> = {}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production") return;
    throw new Error("Email provider is not configured.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: email, ...renderNotificationEmail(title, message, details) }),
  });
  if (!res.ok) throw new Error(await res.text());
}
