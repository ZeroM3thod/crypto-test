// lib/admin-kyc-data.ts
export type KycStatus = "pending" | "approved" | "rejected";

export type Moderator = { name: string; initials: string; id: string };

export type HistoryEntry = {
  type: "submitted" | "approved" | "rejected" | "reopened";
  text: string;
  date: string;
  by: Moderator | null;
  reason?: string | null;
};

export type KycItem = {
  id: string;
  uid: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dob: string;
  idNumber: string;
  idType: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  submittedDate: string;
  status: KycStatus;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  selfieUrl: string | null;
  history: HistoryEntry[];
};

// TODO: replace with the signed-in admin from your auth
export const MODERATOR: Moderator = {
  name: "Marcus Reid",
  initials: "MR",
  id: "mod_001",
};
const SARAH: Moderator = { name: "Sarah Chen", initials: "SC", id: "mod_002" };

const submitted = (date: string): HistoryEntry => ({
  type: "submitted",
  text: "Application submitted by user",
  date,
  by: null,
});

export function getKycData(): KycItem[] {
  return [
    {
      id: "KYC-10041", uid: "USR-50291", fullName: "Alexandra Fontaine", username: "@alex.fontaine",
      email: "alex.fontaine@gmail.com", phone: "+1 (617) 882-4491", dob: "1992-03-15",
      idNumber: "P-A28847391", idType: "Passport", country: "United States",
      address1: "74 Marlborough Street", address2: "Apt 3B", city: "Boston",
      state: "Massachusetts", zip: "02116", submittedDate: "2025-04-22", status: "pending",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [submitted("2025-04-22 09:14")],
    },
    {
      id: "KYC-10040", uid: "USR-48823", fullName: "James Okafor", username: "@j.okafor",
      email: "james.okafor@outlook.com", phone: "+44 7700 912 341", dob: "1988-11-04",
      idNumber: "NI-GB-334812", idType: "National ID", country: "United Kingdom",
      address1: "12 Notting Hill Gate", address2: "Flat 7", city: "London",
      state: "England", zip: "W11 3JE", submittedDate: "2025-04-21", status: "pending",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [submitted("2025-04-21 14:53")],
    },
    {
      id: "KYC-10039", uid: "USR-47110", fullName: "Yuki Tanaka", username: "@yuki.tanaka",
      email: "yuki.tanaka@yahoo.co.jp", phone: "+81 90-3311-7728", dob: "1995-07-22",
      idNumber: "DL-JP-19954412", idType: "Driving Licence", country: "Japan",
      address1: "3-14-8 Shibuya", address2: "", city: "Tokyo",
      state: "Tokyo Metropolis", zip: "150-0002", submittedDate: "2025-04-20", status: "approved",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [
        submitted("2025-04-20 08:22"),
        { type: "approved", text: "KYC approved by moderator", date: "2025-04-20 11:47", by: MODERATOR, reason: null },
      ],
    },
    {
      id: "KYC-10038", uid: "USR-46802", fullName: "Priya Sharma", username: "@priya.sharma",
      email: "priya.sharma@protonmail.com", phone: "+91 98204 77332", dob: "1997-02-09",
      idNumber: "NI-IN-9902-7733", idType: "National ID", country: "India",
      address1: "45 MG Road", address2: "Block C, 2nd Floor", city: "Bangalore",
      state: "Karnataka", zip: "560001", submittedDate: "2025-04-19", status: "rejected",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [
        submitted("2025-04-19 17:06"),
        { type: "rejected", text: "KYC rejected by moderator", date: "2025-04-19 20:33", by: MODERATOR, reason: "ID image is blurry and unreadable. Please resubmit with a clear, high-quality photo." },
      ],
    },
    {
      id: "KYC-10037", uid: "USR-45501", fullName: "Carlos Mendoza", username: "@c.mendoza",
      email: "carlos.mendoza@icloud.com", phone: "+52 55 8811 4490", dob: "1990-06-30",
      idNumber: "P-MX-G29011944", idType: "Passport", country: "Mexico",
      address1: "Av. Insurgentes Sur 1602", address2: "Piso 8", city: "Mexico City",
      state: "CDMX", zip: "03940", submittedDate: "2025-04-18", status: "approved",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [
        submitted("2025-04-18 10:14"),
        { type: "approved", text: "KYC approved by moderator", date: "2025-04-18 14:22", by: SARAH, reason: null },
      ],
    },
    {
      id: "KYC-10036", uid: "USR-44193", fullName: "Elena Volkov", username: "@e.volkov",
      email: "elena.volkov@gmail.com", phone: "+7 916 321 5544", dob: "1993-12-17",
      idNumber: "NI-RU-7743-2291", idType: "National ID", country: "Russia",
      address1: "ul. Arbat 22", address2: "kv. 14", city: "Moscow",
      state: "Moscow Oblast", zip: "119002", submittedDate: "2025-04-17", status: "pending",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [submitted("2025-04-17 13:38")],
    },
    {
      id: "KYC-10035", uid: "USR-43880", fullName: "Noah Williams", username: "@noah.w",
      email: "noah.williams@hey.com", phone: "+1 (404) 553-9921", dob: "1991-08-11",
      idNumber: "DL-US-GA-8812-004", idType: "Driving Licence", country: "United States",
      address1: "890 Peachtree Street NE", address2: "", city: "Atlanta",
      state: "Georgia", zip: "30309", submittedDate: "2025-04-16", status: "rejected",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [
        submitted("2025-04-16 08:50"),
        { type: "rejected", text: "KYC rejected by moderator", date: "2025-04-16 09:15", by: SARAH, reason: "Selfie does not match the ID document photo. Please ensure the selfie clearly shows your face." },
      ],
    },
    {
      id: "KYC-10034", uid: "USR-42200", fullName: "Fatima Al-Rashid", username: "@f.alrashid",
      email: "fatima.alrashid@gmail.com", phone: "+971 50 442 8813", dob: "1994-05-03",
      idNumber: "P-UAE-784-1994-1234567", idType: "Passport", country: "UAE",
      address1: "Building 5, Sheikh Zayed Road", address2: "Apartment 1204", city: "Dubai",
      state: "Dubai Emirate", zip: "00000", submittedDate: "2025-04-15", status: "approved",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [
        submitted("2025-04-15 11:29"),
        { type: "approved", text: "KYC approved by moderator", date: "2025-04-15 15:44", by: MODERATOR, reason: null },
      ],
    },
    {
      id: "KYC-10033", uid: "USR-40987", fullName: "Liam O'Brien", username: "@liam.obrien",
      email: "liam.obrien@eircom.net", phone: "+353 85 770 4412", dob: "1989-09-28",
      idNumber: "NI-IE-33801-99", idType: "National ID", country: "Ireland",
      address1: "17 Grafton Street", address2: "", city: "Dublin",
      state: "County Dublin", zip: "D02 R590", submittedDate: "2025-04-14", status: "pending",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [submitted("2025-04-14 16:07")],
    },
    {
      id: "KYC-10032", uid: "USR-39874", fullName: "Mei Zhang", username: "@mei.zhang",
      email: "mei.zhang@163.com", phone: "+86 138 0013 8000", dob: "1996-01-14",
      idNumber: "NI-CN-110105199601140012", idType: "National ID", country: "China",
      address1: "No. 88 Wangfujing Street", address2: "Suite 401", city: "Beijing",
      state: "Beijing Municipality", zip: "100006", submittedDate: "2025-04-13", status: "approved",
      idFrontUrl: null, idBackUrl: null, selfieUrl: null,
      history: [
        submitted("2025-04-13 07:55"),
        { type: "approved", text: "KYC approved by moderator", date: "2025-04-13 10:30", by: SARAH, reason: null },
      ],
    },
  ];
}
