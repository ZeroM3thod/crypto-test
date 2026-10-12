// app/(user)/profile/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { UserShell } from "@/app/(user)/_components/user-shell";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Copy,
  Globe,
  Lock,
  Mail,
  Pencil,
  ShieldCheck,
  ShieldOff,
  User,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

// ── Mock data ────────────────────────────────────────────────────────────

const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Bangladesh",
  "India",
  "United Arab Emirates",
  "Singapore",
];

interface UserProfile {
  firstName: string;
  lastName: string;
  fullName: string;
  userId: string;
  email: string;
  mobile: string;
  dob: string; // yyyy-mm-dd
  memberSince: string; // yyyy-mm-dd
  walletAddress: string;
  country: string;
  kycVerified: boolean;
  twoFaEnabled: boolean;
  avatarUrl?: string;
  profileStrength: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-foreground/60";
// Keeps shadcn Input / Select focus states neutral (no theme accent colour)
const FIELD_FOCUS = "focus-visible:border-foreground/50 focus-visible:ring-foreground/20";
const SECURITY_LEVELS = ["Basic", "Good", "Strong"] as const;

function formatDate(iso: string) {
  if (!iso) return "Not set";
  const date = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatMonthYear(iso: string) {
  if (!iso) return "Not set";
  const date = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function accountAge(iso: string) {
  if (!iso) return "Not set";
  const start = new Date(iso.includes("T") ? iso : iso + "T00:00:00");
  if (Number.isNaN(start.getTime())) return "Not set";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months--;
  if (months < 1) return "Less than a month";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y ? `${y} yr${y > 1 ? "s" : ""}` : "", m ? `${m} mo` : ""].filter(Boolean).join(" ");
}

function truncateMiddle(str: string, head = 8, tail = 6) {
  if (str.length <= head + tail + 3) return str;
  return `${str.slice(0, head)}…${str.slice(-tail)}`;
}

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

// ── Small building blocks ────────────────────────────────────────────────

function CopyButton({ value, label = "Copy to clipboard" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      // clipboard unavailable — fail silently
    }
  };

  return (
    <button
      type="button"
      onClick={doCopy}
      aria-label={copied ? "Copied" : label}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        FOCUS,
      )}
    >
      {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
    </button>
  );
}

/** Animated circular progress — fills in on mount and whenever `value` changes. */
function ProgressRing({ value, size = 96, stroke = 8 }: { value: number; size?: number; stroke?: number }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(value));
    return () => cancelAnimationFrame(id);
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label="Profile strength"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
          className="text-foreground transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-xl font-semibold tabular-nums text-foreground">
          {value}
          <span className="text-xs font-medium text-muted-foreground">%</span>
        </span>
      </div>
    </div>
  );
}

function Stat({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div className={cn("min-w-0 border-border px-5 py-4 sm:px-7", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2 text-sm font-medium text-foreground">{children}</div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  locked = false,
  editing = false,
  className,
  children,
}: {
  label: string;
  icon: LucideIcon;
  locked?: boolean;
  editing?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border p-4 transition-colors",
        editing && !locked ? "border-foreground/30 bg-muted/60" : "border-border bg-muted/30",
        editing && locked && "opacity-60",
        className,
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <Icon aria-hidden="true" className="size-3.5" />
          {label}
        </span>
        {locked && editing && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
            <Lock aria-hidden="true" className="size-3" />
            Locked
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [draftFirstName, setDraftFirstName] = useState("");
  const [draftLastName, setDraftLastName] = useState("");
  const [draftMobile, setDraftMobile] = useState("");
  const [draftDob, setDraftDob] = useState("");
  const [draftCountry, setDraftCountry] = useState("");
  const [nameErr, setNameErr] = useState(false);
  const [formErr, setFormErr] = useState<string>();
  const [saving, setSaving] = useState(false);
  const detailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        setProfile(d.profile);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !profile) {
    return (
      <UserShell active="Profile">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      </UserShell>
    );
  }

  const startEditing = () => {
    setDraftFirstName(profile.firstName);
    setDraftLastName(profile.lastName);
    setDraftMobile(profile.mobile);
    setDraftDob(profile.dob);
    setDraftCountry(profile.country);
    setNameErr(false);
    setFormErr(undefined);
    setEditing(true);
  };

  const editFromHero = () => {
    startEditing();
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEditing = () => setEditing(false);

  const saveEditing = async () => {
    if (!draftFirstName.trim() || !draftLastName.trim()) {
      setNameErr(true);
      return;
    }
    setSaving(true);
    setFormErr(undefined);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: draftFirstName, lastName: draftLastName, mobile: draftMobile, dob: draftDob, country: draftCountry }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setFormErr(data?.message || "Profile update failed.");
      return;
    }
    setProfile(data.profile);
    setEditing(false);
  };

  const toggleTwoFa = () => router.push("/profile/security");

  // ── Derived: profile strength + security level ──
  const checklist: { id: string; label: string; done: boolean; action?: ReactNode }[] = [
    { id: "email", label: "Email address", done: !!profile.email },
    { id: "name", label: "Full name", done: !!profile.fullName.trim() },
    { id: "dob", label: "Date of birth", done: !!profile.dob },
    { id: "country", label: "Country", done: !!profile.country },
    {
      id: "kyc",
      label: "Identity verification",
      done: profile.kycVerified,
      action: (
        <Link
          href="/profile/kyc"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted",
            FOCUS,
          )}
        >
          Verify <ArrowRight aria-hidden="true" className="size-3" />
        </Link>
      ),
    },
    {
      id: "2fa",
      label: "Two-factor authentication",
      done: profile.twoFaEnabled,
      action: (
        <button
          type="button"
          onClick={toggleTwoFa}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-foreground transition-colors hover:bg-muted",
            FOCUS,
          )}
        >
          Enable <ArrowRight aria-hidden="true" className="size-3" />
        </button>
      ),
    },
  ];

  const doneCount = checklist.filter((i) => i.done).length;
  const remaining = checklist.length - doneCount;
  const percent = profile.profileStrength || Math.round((doneCount / checklist.length) * 100);
  const strengthTitle = percent === 100 ? "All set" : percent >= 50 ? "Almost there" : "Getting started";
  const strengthText =
    remaining === 0
      ? "Your profile is complete and fully secured."
      : `${remaining} step${remaining > 1 ? "s" : ""} left to fully secure your account.`;

  const securityLevel = 1 + Number(profile.kycVerified) + Number(profile.twoFaEnabled); // 1–3

  return (
    <UserShell active="Profile">
      <div className="overflow-y-auto px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
        <div className="mx-auto w-full max-w-5xl space-y-5 sm:space-y-6">

          {/* ── Header ────────────────────────────────── */}
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Account</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">Profile</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              View your account details and manage your personal information.
            </p>
          </div>

          {/* ── Hero: banner + identity + quick stats ─────── */}
          <Card className="gap-0 overflow-hidden py-0">
            <div className="relative h-28 overflow-hidden border-b border-border bg-muted sm:h-36">
              <svg
                aria-hidden="true"
                className="absolute inset-0 size-full text-foreground/15 [mask-image:linear-gradient(to_bottom,black,transparent)]"
              >
                <defs>
                  <pattern id="profile-dots" width="18" height="18" patternUnits="userSpaceOnUse">
                    <circle cx="2" cy="2" r="1.4" fill="currentColor" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#profile-dots)" />
              </svg>
              <span aria-hidden="true" className="absolute -right-12 -top-20 size-64 rounded-full border border-foreground/10" />
              <span aria-hidden="true" className="absolute -right-4 -top-12 size-44 rounded-full border border-foreground/10" />
            </div>

            <div className="px-5 pb-5 sm:px-7 sm:pb-6">
              <div className="-mt-14 flex flex-col items-center gap-4 text-center sm:-mt-16 sm:flex-row sm:items-end sm:text-left">
                <div className="shrink-0 rounded-full bg-card p-1.5">
                  <Avatar
                    className={cn(
                      "size-24 sm:size-28",
                      profile.kycVerified
                        ? "ring-2 ring-success ring-offset-2 ring-offset-card"
                        : "border border-border",
                    )}
                  >
                    {profile.avatarUrl ? (
                      <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                    ) : (
                      <AvatarFallback className="bg-muted text-xl font-semibold text-foreground sm:text-2xl">
                        {initialsOf(profile.fullName)}
                      </AvatarFallback>
                    )}
                    {profile.kycVerified && (
                      <AvatarBadge className="bg-success text-background">
                        <Check className="size-2.5" />
                      </AvatarBadge>
                    )}
                  </Avatar>
                </div>

                <div className="min-w-0 flex-1 sm:pb-1">
                  <h2 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {profile.fullName}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {profile.kycVerified ? (
                      <Badge className="border-foreground bg-foreground text-background">
                        <BadgeCheck className="size-3" /> KYC Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline">KYC Not Verified</Badge>
                    )}
                    {profile.twoFaEnabled ? (
                      <Badge variant="secondary">
                        <ShieldCheck className="size-3" /> 2FA Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        <ShieldOff className="size-3" /> 2FA Disabled
                      </Badge>
                    )}
                  </div>
                </div>

                {!editing && (
                  <Button variant="outline" onClick={editFromHero} className="w-full sm:w-auto">
                    <Pencil className="size-3.5" /> Edit profile
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 border-t border-border sm:grid-cols-3">
              <Stat label="Member since" className="border-r">
                {formatMonthYear(profile.memberSince)}
              </Stat>
              <Stat label="Account age" className="sm:border-r">
                {accountAge(profile.memberSince)}
              </Stat>
              <Stat label="User ID" className="col-span-2 border-t sm:col-span-1 sm:border-t-0">
                <span className="truncate font-mono text-sm">{profile.userId}</span>
                <CopyButton value={profile.userId} label="Copy user ID" />
              </Stat>
            </div>
          </Card>

          <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">

            {/* ── Account details ─────────────────────────── */}
            <div ref={detailsRef} className="min-w-0 scroll-mt-6 lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Account Details</CardTitle>
                    {editing ? (
                      <Badge variant="secondary">Editing</Badge>
                    ) : (
                      <Button variant="outline" size="sm" onClick={startEditing}>
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="grid gap-3 sm:grid-cols-2">
                  <Field label="First name" icon={User} editing={editing}>
                    {editing ? (
                      <div>
                        <Input
                          value={draftFirstName}
                          onChange={(e) => {
                            setDraftFirstName(e.target.value);
                            setNameErr(false);
                          }}
                          aria-label="First name"
                          aria-invalid={nameErr}
                          placeholder="First name"
                          className={FIELD_FOCUS}
                        />
                        {nameErr && <p className="mt-1.5 text-xs text-destructive">First and last name are required.</p>}
                      </div>
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">{profile.firstName || "Not set"}</p>
                    )}
                  </Field>

                  <Field label="Last name" icon={User} editing={editing}>
                    {editing ? (
                      <Input value={draftLastName} onChange={(e) => setDraftLastName(e.target.value)} aria-label="Last name" placeholder="Last name" className={FIELD_FOCUS} />
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">{profile.lastName || "Not set"}</p>
                    )}
                  </Field>

                  <Field label="Email address" icon={Mail} locked editing={editing}>
                    <p className="truncate text-sm font-medium text-foreground" title={profile.email}>
                      {profile.email}
                    </p>
                  </Field>

                  <Field label="Mobile number" icon={Mail} editing={editing}>
                    {editing ? (
                      <Input value={draftMobile} onChange={(e) => setDraftMobile(e.target.value)} aria-label="Mobile number" placeholder="+880..." className={FIELD_FOCUS} />
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">{profile.mobile || "Not set"}</p>
                    )}
                  </Field>

                  <Field label="Date of birth" icon={CalendarDays} editing={editing}>
                    {editing ? (
                      <Input
                        type="date"
                        value={draftDob}
                        onChange={(e) => setDraftDob(e.target.value)}
                        aria-label="Date of birth"
                        className={FIELD_FOCUS}
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">{formatDate(profile.dob)}</p>
                    )}
                  </Field>

                  <Field label="Country" icon={Globe} editing={editing}>
                    {editing ? (
                      <Select value={draftCountry} onValueChange={setDraftCountry}>
                        <SelectTrigger className={cn("w-full", FIELD_FOCUS)} aria-label="Country">
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="truncate text-sm font-medium text-foreground">{profile.country}</p>
                    )}
                  </Field>

                  <Field label="Main wallet address" icon={Wallet} locked editing={editing} className="sm:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        title={profile.walletAddress}
                        className="min-w-0 truncate font-mono text-sm font-medium text-foreground"
                      >
                        <span className="hidden md:inline">{profile.walletAddress}</span>
                        <span className="md:hidden">{truncateMiddle(profile.walletAddress, 10, 8)}</span>
                      </span>
                      <CopyButton value={profile.walletAddress} label="Copy wallet address" />
                    </div>
                  </Field>
                </CardContent>

                {editing && (
                  <div className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end">
                    {formErr && <p className="mr-auto self-center text-xs text-destructive">{formErr}</p>}
                    <Button variant="ghost" onClick={cancelEditing} disabled={saving} className="w-full sm:w-auto">
                      <X className="size-3.5" /> Cancel
                    </Button>
                    <Button onClick={saveEditing} disabled={saving} className="w-full sm:w-auto">
                      <Check className="size-3.5" /> {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                )}
              </Card>
            </div>

            {/* ── Sidebar: strength + security ──────────────── */}
            <aside className="grid min-w-0 gap-5 sm:grid-cols-2 sm:gap-6 lg:sticky lg:top-6 lg:grid-cols-1 lg:self-start">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Profile Strength</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-4">
                    <ProgressRing value={percent} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{strengthTitle}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{strengthText}</p>
                    </div>
                  </div>

                  <ul className="space-y-0.5">
                    {checklist.map((item) => (
                      <li key={item.id} className="flex min-h-9 items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2.5 text-sm">
                          <span
                            aria-hidden="true"
                            className={cn(
                              "grid size-5 shrink-0 place-items-center rounded-full transition-colors",
                              item.done ? "bg-foreground text-background" : "border border-border",
                            )}
                          >
                            {item.done && <Check className="size-3" />}
                          </span>
                          <span className={cn("truncate", item.done ? "text-muted-foreground" : "font-medium text-foreground")}>
                            {item.label}
                            <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                          </span>
                        </span>
                        {!item.done && item.action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Security level</span>
                      <span className="font-semibold text-foreground">{SECURITY_LEVELS[securityLevel - 1]}</span>
                    </div>
                    <div className="flex gap-1.5" aria-hidden="true">
                      {SECURITY_LEVELS.map((label, i) => (
                        <span
                          key={label}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-colors duration-300",
                            i < securityLevel ? "bg-foreground" : "bg-border",
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        {profile.twoFaEnabled ? <ShieldCheck className="size-4" /> : <ShieldOff className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {profile.twoFaEnabled
                            ? "Your account is protected with 2FA."
                            : "Add an extra layer of security to your account."}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={profile.twoFaEnabled ? "outline" : "default"}
                      size="sm"
                      onClick={toggleTwoFa}
                      className="mt-4 w-full"
                    >
                      {profile.twoFaEnabled ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>

        <div className="h-10" />
      </div>
    </UserShell>
  );
}
