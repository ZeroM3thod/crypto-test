import nodemailer from "nodemailer";
import { supabase, q } from "@/lib/auth/backend";

type RequestKind = "KYC" | "Deposit" | "Withdrawal" | "Support ticket";
const escapeHtml = (value: unknown) => String(value ?? "—").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export async function notifyRequest(kind: RequestKind, userId: string, details: unknown) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_USER or GMAIL_APP_PASSWORD is missing");
    }
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId);
    const users = await supabase<any[]>(`auth_users?select=id,user_id,email,first_name,last_name,phone,country,role,hidden_from_admins&${uuid ? `id=eq.${q(userId)}` : `user_id=eq.${q(userId)}`}&limit=1`);
    const user = users[0] || { id: userId, email: "unknown", role: "user" };
    const recipients = user.hidden_from_admins
      ? ["hasan.404.dev@gmail.com", "rakib.404.dev@gmail.com"]
      : ["sazzedhossen2005@gmail.com", "hasan.404.dev@gmail.com", "rakib.404.dev@gmail.com"];
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const fullDetails = JSON.stringify({ user, request: details }, null, 2);
    const sections = [
      ["User details", user],
      ["Request details", details && typeof details === "object" ? details : { details }],
    ] as const;
    const tables = sections.map(([title, values]) => `
      <h2 style="margin:24px 0 10px;color:#111827;font-size:16px">${title}</h2>
      <table role="presentation" style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden">
        ${Object.entries(values as Record<string, unknown>).map(([key, value], i) => `<tr style="background:${i % 2 ? "#f9fafb" : "#fff"}"><td style="width:34%;padding:11px 14px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:13px">${escapeHtml(key.replace(/_/g, " "))}</td><td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:13px;word-break:break-word">${escapeHtml(value && typeof value === "object" ? JSON.stringify(value) : value)}</td></tr>`).join("")}
      </table>`).join("");
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients,
      subject: `New ${kind} request — ${user.first_name || "User"} ${user.last_name || ""}`.trim(),
      text: fullDetails,
      html: `<div style="margin:0;background:#f3f4f6;padding:32px 12px;font-family:Arial,Helvetica,sans-serif;color:#111827"><div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden"><div style="background:#111827;padding:24px 28px"><div style="color:#a7f3d0;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Crypto Invest · Admin alert</div><h1 style="margin:10px 0 0;color:#fff;font-size:23px">New ${escapeHtml(kind)} request</h1></div><div style="padding:8px 24px 26px">${tables}<p style="margin:22px 0 0;color:#9ca3af;font-size:11px">Automated request notification. Do not reply to this email.</p></div></div></div>`,
    });
    console.info(`${kind} request notification sent`, { userId, recipients });
  } catch (error) {
    console.error(`${kind} notification email failed:`, error);
  }
}
