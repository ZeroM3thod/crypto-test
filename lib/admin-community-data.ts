// lib/admin-community-data.ts
export type ChatMessage = {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
  lang?: string;
  admin?: boolean;
  pinned?: boolean;
  fake?: boolean; // sent by Admin on behalf of a persona
};

export type ChatUser = {
  id: string;
  username: string;
  avatar: string;
  lang: string;
};

export type Ban = {
  userId: string;
  username: string;
  avatar: string;
  reason: string;
  bannedAt: string; // ISO
  expiresAt: string | null; // null = forever
  by: string;
};

export const EMOJIS = ["😀", "😂", "🔥", "🚀", "📈", "💰", "👍", "🎉", "💎", "⚡", "🌙", "💯"];

export function getInitialMessages(): ChatMessage[] {
  return [
    { id: "pin1", userId: "admin", username: "Admin", avatar: "A", admin: true, pinned: true, timestamp: "09:00", text: "Welcome to the International Community Chat! Please follow the community rules. Spam, abuse, and off-topic promotions are not allowed." },
    { id: "m0", userId: "u9", username: "Spam_Bot", avatar: "S", timestamp: "09:05", lang: "EN", text: "FREE crypto!!! click my link to double your money" },
    { id: "m1", userId: "u2", username: "Carlos_M", avatar: "C", timestamp: "09:14", lang: "EN", text: "Good morning everyone! 🌅" },
    { id: "m2", userId: "u3", username: "Yuki_T", avatar: "Y", timestamp: "09:15", lang: "EN", text: "Has anyone checked today's BTC price?" },
    { id: "m3", userId: "u4", username: "Fatima_A", avatar: "F", timestamp: "09:15", lang: "EN", text: "It's pumping 🚀 up 4% since midnight." },
    { id: "m4", userId: "u1", username: "Ava", avatar: "A", timestamp: "09:16", lang: "EN", text: "Mining earnings look solid today too." },
    { id: "m5", userId: "u5", username: "Raj_K", avatar: "R", timestamp: "09:17", lang: "EN", text: "Agreed! My contract credited early." },
    { id: "m6", userId: "u2", username: "Carlos_M", avatar: "C", timestamp: "09:18", lang: "EN", text: "Anyone tried the new AI trading plan?" },
    { id: "m7", userId: "u1", username: "Ava", avatar: "A", timestamp: "09:19", lang: "EN", text: "Yes! ROI has been great this week. Highly recommend the Growth tier." },
    { id: "m8", userId: "u6", username: "Lena_V", avatar: "L", timestamp: "09:20", lang: "EN", text: "@Ava which strategy did you pick?" },
    { id: "m9", userId: "u1", username: "Ava", avatar: "A", timestamp: "09:21", lang: "EN", text: "BTC/USDT with the momentum strategy 📈" },
    { id: "m10", userId: "u3", username: "Yuki_T", avatar: "Y", timestamp: "09:22", lang: "JP", text: "Thanks for the tip! Will try it." },
  ];
}

export function getChatUsers(): ChatUser[] {
  return [
    { id: "u1", username: "Ava", avatar: "A", lang: "EN" },
    { id: "u2", username: "Carlos_M", avatar: "C", lang: "ES" },
    { id: "u3", username: "Yuki_T", avatar: "Y", lang: "JP" },
    { id: "u4", username: "Fatima_A", avatar: "F", lang: "AR" },
    { id: "u5", username: "Raj_K", avatar: "R", lang: "EN" },
    { id: "u6", username: "Lena_V", avatar: "L", lang: "DE" },
    { id: "u7", username: "Omar_H", avatar: "O", lang: "AR" },
    { id: "u8", username: "Sophie_B", avatar: "S", lang: "FR" },
  ];
}

export function getInitialBans(): Ban[] {
  return [
    {
      userId: "u9",
      username: "Spam_Bot",
      avatar: "S",
      reason: "Posting scam links.",
      bannedAt: "2025-07-20T09:06:00Z",
      expiresAt: null,
      by: "Admin",
    },
  ];
}

export const INITIAL_RULES = [
  "Be respectful to all members.",
  "No spam, scam links, or unsolicited promotions.",
  "No hate speech, racism, or personal attacks.",
  "Do not share private keys or wallet credentials.",
  "English is preferred but all languages are welcome.",
];

export const INITIAL_BLOCKED_WORDS = ["badword1", "badword2"];

export const LANGS = ["EN", "ES", "JP", "AR", "DE", "FR", "BN", "HI"];

export type ScriptLine = {
  id: string;
  personaId: string; // "admin", a member id, or a custom persona id
  text: string;
  time: string; // "HH:MM" or "" = use the current time
  delay: number; // seconds to wait before this line (Play live mode)
};

export type SavedScript = { id: string; name: string; lines: ScriptLine[] };

export function getSavedScripts(): SavedScript[] {
  return [
    {
      id: "s1",
      name: "Morning market chat (sample)",
      lines: [
        { id: "s1a", personaId: "u2", text: "Morning all! Anyone watching ETH today?", time: "", delay: 0 },
        { id: "s1b", personaId: "u3", text: "Yes, it's holding support nicely 📈", time: "", delay: 3 },
        { id: "s1c", personaId: "u4", text: "I added some to my portfolio earlier 🚀", time: "", delay: 4 },
        { id: "s1d", personaId: "u5", text: "Nice! My mining payout hit early too.", time: "", delay: 3 },
        { id: "s1e", personaId: "u2", text: "Love this community 🔥", time: "", delay: 2 },
      ],
    },
  ];
}
