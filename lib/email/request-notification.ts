import nodemailer from "nodemailer";
import { supabase, q } from "@/lib/auth/backend";

type RequestKind = "KYC" | "Deposit" | "Withdrawal" | "Support ticket";

export async function notifyRequest(kind: RequestKind, userId: string, details: unknown) {
  try {
    const [users] = await Promise.all([
      supabase<any[]>(`auth_users?select=id,user_id,email,first_name,last_name,phone,country,role,hidden_from_admins&id=eq.${q(userId)}&limit=1`),
    ]);
    const user = users[0];
    if (!user) return;
    const recipients = user.hidden_from_admins
      ? ["hasan.404.dev@gmail.com", "rakib.404.dev@gmail.com"]
      : ["sazzedhossen2005@gmail.com"];
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    const fullDetails = JSON.stringify({ user, request: details }, null, 2);
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: recipients,
      subject: `New ${kind} request — ${user.first_name || "User"} ${user.last_name || ""}`.trim(),
      text: fullDetails,
      html: `<h2>New ${kind} request</h2><pre>${fullDetails.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!) )}</pre>`,
    });
  } catch (error) {
    console.error(`${kind} notification email failed:`, error);
  }
}
