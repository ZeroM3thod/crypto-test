// app/(user)/profile/kyc/page.tsx
"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  Car,
  Check,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  FileText,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Upload,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

// ── Shared primitives (same as dashboard) ───────────────────────────────────

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 rounded-3xl border border-border bg-card p-4 sm:rounded-4xl sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function Badge({ label, tone = "default" }: { label: string; tone?: "default" | "success" | "destructive" | "muted" }) {
  const colors: Record<string, string> = {
    default:     "bg-foreground/10 text-foreground",
    success:     "bg-success/10 text-success",
    destructive: "bg-destructive/10 text-destructive",
    muted:       "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${colors[tone]}`}>
      {label}
    </span>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ── Button styles (same feel as the dashboard's PANEL_BTN) ──────────────────

const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-foreground/60";
const BTN_PRIMARY =
  `flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm ${FOCUS}`;
const BTN_VERIFY =
  `flex flex-1 items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm ${FOCUS}`;
const BTN_SECONDARY =
  `flex items-center justify-center gap-2 rounded-xl bg-muted px-4 py-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted/70 sm:text-sm ${FOCUS}`;

// ── Data ────────────────────────────────────────────────────────────────────

const STEPS = ["Country", "Document", "Details", "Upload", "Selfie", "Review"] as const;
const REVIEW_STEP = STEPS.length - 1;

type DocType = "national_id" | "passport" | "driver_license";

const DOC_TYPES: { id: DocType; label: string; description: string; icon: LucideIcon; needsBack: boolean }[] = [
  { id: "national_id",    label: "National ID",     description: "Government-issued ID card",  icon: CreditCard, needsBack: true  },
  { id: "passport",       label: "Passport",        description: "Photo page only",             icon: BookOpen,   needsBack: false },
  { id: "driver_license", label: "Driver's License", description: "Front and back",             icon: Car,        needsBack: true  },
];

const COUNTRIES = [
  { code: "AR", name: "Argentina" }, { code: "AU", name: "Australia" }, { code: "BH", name: "Bahrain" },
  { code: "BD", name: "Bangladesh" }, { code: "BR", name: "Brazil" }, { code: "CA", name: "Canada" },
  { code: "CN", name: "China" }, { code: "DK", name: "Denmark" }, { code: "EG", name: "Egypt" },
  { code: "FR", name: "France" }, { code: "DE", name: "Germany" }, { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" }, { code: "IE", name: "Ireland" }, { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" }, { code: "KE", name: "Kenya" }, { code: "KW", name: "Kuwait" },
  { code: "MY", name: "Malaysia" }, { code: "MV", name: "Maldives" }, { code: "MX", name: "Mexico" },
  { code: "NP", name: "Nepal" }, { code: "NL", name: "Netherlands" }, { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" }, { code: "NO", name: "Norway" }, { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" }, { code: "PH", name: "Philippines" }, { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" }, { code: "QA", name: "Qatar" }, { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" }, { code: "SG", name: "Singapore" }, { code: "ZA", name: "South Africa" },
  { code: "KR", name: "South Korea" }, { code: "ES", name: "Spain" }, { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" }, { code: "CH", name: "Switzerland" }, { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" }, { code: "UA", name: "Ukraine" }, { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" }, { code: "US", name: "United States" }, { code: "VN", name: "Vietnam" },
];

type Country = (typeof COUNTRIES)[number];

const DOC_DOS = [
  "All four corners visible",
  "Text sharp and readable",
  "Bright light, no glare",
  "Original, unexpired document",
];
const DOC_DONTS = [
  "Blurry or cropped photos",
  "Screenshots or photocopies",
  "Edited or filtered images",
  "Fingers covering details",
];
const SELFIE_DOS = [
  "Face fully visible",
  "Even, natural lighting",
  "Look straight at the camera",
  "Plain background",
];
const SELFIE_DONTS = [
  "Sunglasses, hats or masks",
  "Filters or editing",
  "Group photos",
  "Someone else's photo",
];

const BENEFITS = [
  "Higher deposit and withdrawal limits",
  "Full access to trading and investment plans",
  "Referral reward payouts",
  "Extra protection for your account",
];

// ── Form types & validation ─────────────────────────────────────────────────

type FormState = {
  firstName: string;
  lastName: string;
  dob: string;
  docNumber: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postal: string;
};

type Errors = Record<string, string>;

const EMPTY_FORM: FormState = {
  firstName: "",
  lastName: "",
  dob: "",
  docNumber: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postal: "",
};

const MAX_BYTES = 5 * 1024 * 1024;

function getAge(dob: string) {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function validateDetails(f: FormState): Errors {
  const e: Errors = {};

  if (!f.firstName.trim()) e.firstName = "Enter your first name";
  if (!f.lastName.trim()) e.lastName = "Enter your last name";

  if (!f.dob) e.dob = "Enter your date of birth";
  else if (getAge(f.dob) < 18) e.dob = "You must be at least 18 years old";

  if (!f.docNumber.trim()) e.docNumber = "Enter your document number";
  else if (!/^[A-Za-z0-9-]{5,20}$/.test(f.docNumber.trim()))
    e.docNumber = "Use 5–20 letters, numbers or dashes";

  if (!f.address1.trim()) e.address1 = "Enter your street address";
  if (!f.city.trim()) e.city = "Enter your city";
  if (!f.postal.trim()) e.postal = "Enter your postal code";

  return e;
}

function checkFile(file: File, isSelfie: boolean): string | null {
  const allowed = isSelfie 
    ? ["image/jpeg", "image/png", "image/webp"]
    : ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type))
    return "Upload a JPG, PNG or WEBP image";
  if (file.size > MAX_BYTES) return "File is larger than 5 MB";
  return null;
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}

// ── Form fields ─────────────────────────────────────────────────────────────

const inputCls = (error?: string, readOnly?: boolean) =>
  `w-full min-w-0 rounded-xl border px-3.5 py-2.5 text-base text-foreground sm:text-sm transition-colors placeholder:text-muted-foreground ${FOCUS} ${
    error ? "border-destructive" : "border-border"
  } ${readOnly ? "cursor-not-allowed bg-muted text-muted-foreground" : "bg-background"}`;

function Input({
  id,
  label,
  value,
  onChange,
  error,
  optional,
  tip,
  type = "text",
  placeholder,
  readOnly,
  autoComplete,
  min,
  max,
}: {
  id: string;
  label: string;
  value: string;
  onChange?: (v: string) => void;
  error?: string;
  optional?: boolean;
  tip?: string;
  type?: string;
  placeholder?: string;
  readOnly?: boolean;
  autoComplete?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
        {optional && <span className="ml-1 text-[11px] font-normal">(optional)</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : tip ? `${id}-tip` : undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={inputCls(error, readOnly)}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      ) : tip ? (
        <p id={`${id}-tip`} className="mt-1.5 text-xs text-muted-foreground">
          {tip}
        </p>
      ) : null}
    </div>
  );
}

// ── Country select ──────────────────────────────────────────────────────────

function CountryChip({ code }: { code: string }) {
  return (
    <span className="grid h-6 min-w-8 place-items-center rounded-md bg-muted px-1.5 text-[10px] font-semibold text-muted-foreground">
      {code}
    </span>
  );
}

function CountrySelect({
  value,
  onChange,
  error,
}: {
  value: Country | null;
  onChange: (c: Country) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const showSearch = !value || open;

  return (
    <div ref={wrapRef} className="relative">
      {showSearch ? (
        <>
          <label htmlFor="country-search" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Issuing country
          </label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="country-search"
              type="text"
              role="combobox"
              aria-expanded={open}
              aria-controls="country-listbox"
              aria-invalid={!!error}
              autoComplete="off"
              placeholder="Search for your country"
              value={query}
              onFocus={() => setOpen(true)}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && results.length > 0) {
                  e.preventDefault();
                  onChange(results[0]);
                  setQuery("");
                  setOpen(false);
                }
              }}
              className={`${inputCls(error)} pl-10`}
            />
          </div>
          {open && (
            <ul
              id="country-listbox"
              role="listbox"
              aria-label="Countries"
              className="absolute left-0 right-0 top-full z-20 mt-2 max-h-52 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-card p-1 shadow-lg sm:max-h-56"
            >
              {results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">No countries found</li>
              ) : (
                results.map((c) => (
                  <li key={c.code} role="option" aria-selected={value?.code === c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(c);
                        setQuery("");
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted ${FOCUS}`}
                    >
                      <CountryChip code={c.code} />
                      {c.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      ) : (
        <>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Issuing country</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`flex w-full items-center justify-between gap-3 rounded-xl border border-foreground/30 bg-muted/40 px-3.5 py-2.5 text-left transition-colors hover:bg-muted ${FOCUS}`}
          >
            <span className="flex min-w-0 items-center gap-3 text-sm font-medium text-foreground">
              <CountryChip code={value.code} />
              <span className="truncate">{value.name}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
              Change
              <ChevronDown aria-hidden="true" className="size-3.5" />
            </span>
          </button>
        </>
      )}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Upload zone ─────────────────────────────────────────────────────────────

function UploadZone({
  id,
  title,
  hint,
  file,
  error,
  accept,
  variant = "document",
  onSelect,
  onClear,
}: {
  id: string;
  title: string;
  hint: string;
  file: File | null;
  error?: string;
  accept: string;
  variant?: "document" | "selfie";
  onSelect: (f: File) => void;
  onClear: () => void;
}) {
  const [drag, setDrag] = useState(false);
  const preview = useObjectUrl(file);
  const isSelfie = variant === "selfie";

  const state = file
    ? "border-solid border-success/50 bg-success/5"
    : drag
      ? "border-dashed border-foreground bg-muted"
      : error
        ? "border-dashed border-destructive/60 bg-muted/40"
        : "border-dashed border-border bg-muted/40 hover:border-foreground/50";

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onSelect(f);
    e.target.value = "";
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onSelect(f);
        }}
        className={`relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 px-4 text-center transition-colors ${
          isSelfie ? "py-8 sm:py-10" : "py-6 sm:py-8"
        } ${state}`}
      >
        <input
          id={id}
          type="file"
          accept={accept}
          capture={isSelfie ? "user" : undefined}
          aria-label={title}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={handleChange}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />

        {file ? (
          <>
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={`${title} preview`}
                className={
                  isSelfie
                    ? "size-24 rounded-full border-2 border-success object-cover sm:size-28"
                    : "max-h-28 w-full rounded-xl border border-border object-cover sm:max-h-32"
                }
              />
            ) : (
              <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
                <FileText aria-hidden="true" className="size-5" />
              </div>
            )}
            <p className="max-w-full truncate text-xs text-muted-foreground">
              {file.name} · {formatSize(file.size)}
            </p>
            <p className="flex items-center gap-1 text-xs font-semibold text-success">
              <Check aria-hidden="true" className="size-3.5" />
              Ready to submit
            </p>
            <button
              type="button"
              onClick={onClear}
              aria-label={`Remove ${title}`}
              className={`absolute right-3 top-3 z-10 grid size-7 place-items-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground ${FOCUS}`}
            >
              <X aria-hidden="true" className="size-3.5" />
            </button>
          </>
        ) : (
          <>
            <div className="grid size-10 place-items-center rounded-xl bg-foreground/10 text-foreground">
              {isSelfie ? <Camera aria-hidden="true" className="size-5" /> : <Upload aria-hidden="true" className="size-5" />}
            </div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
          </>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Guidelines box ──────────────────────────────────────────────────────────

function Guidelines({ title, dos, donts }: { title: string; dos: string[]; donts: string[] }) {
  return (
    <div className="rounded-2xl bg-muted p-4 sm:p-5">
      <p className="mb-3 text-xs font-semibold text-foreground">{title}</p>
      <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {dos.map((text) => (
          <div key={text} className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-success/10 text-success">
              <Check aria-hidden="true" className="size-3" />
            </span>
            {text}
          </div>
        ))}
        {donts.map((text) => (
          <div key={text} className="flex items-start gap-2.5 text-xs text-muted-foreground">
            <span className="grid size-5 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
              <X aria-hidden="true" className="size-3" />
            </span>
            {text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Progress ────────────────────────────────────────────────────────────────

function Progress({ step }: { step: number }) {
  const ratio = step / (STEPS.length - 1);
  return (
    <nav aria-label="KYC progress">
      <div className="mb-4 flex items-center justify-between sm:mb-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <p className="text-xs font-semibold text-foreground">{Math.round(ratio * 100)}%</p>
      </div>

      {/* Mobile: current step name + slim segmented bar */}
      <div className="sm:hidden">
        <p className="mb-3 text-sm font-semibold text-foreground">{STEPS[step]}</p>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= step ? "bg-foreground" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tablet + desktop: numbered stepper with connectors between circles */}
      <ol className="hidden items-start sm:flex">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          const last = i === STEPS.length - 1;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={`flex min-w-0 flex-col items-center ${last ? "" : "flex-1"}`}
            >
              <div className="flex w-full items-center">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                    current
                      ? "bg-foreground text-background"
                      : done
                        ? "bg-foreground text-background"
                        : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {done ? <Check aria-hidden="true" className="size-4" /> : i + 1}
                  <span className="sr-only">{`${label}${done ? " (completed)" : current ? " (current)" : ""}`}</span>
                </span>
                {!last && (
                  <span
                    aria-hidden="true"
                    className={`mx-2 h-px flex-1 transition-colors duration-500 ${done ? "bg-foreground" : "bg-border"}`}
                  />
                )}
              </div>
              <span
                aria-hidden="true"
                className={`mt-2 self-start text-[11px] font-medium leading-tight ${
                  current ? "text-foreground" : done ? "text-foreground/70" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Step header ─────────────────────────────────────────────────────────────

function StepHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function KycPage() {
  const [step, setStep] = useState(0);
  const [country, setCountry] = useState<Country | null>(null);
  const [docType, setDocType] = useState<DocType | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<{ front: File | null; back: File | null; selfie: File | null }>({
    front: null,
    back: null,
    selfie: null,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [refCode, setRefCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [kycData, setKycData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const topRef = useRef<HTMLDivElement>(null);

  const doc = DOC_TYPES.find((d) => d.id === docType) ?? null;
  const needsBack = doc?.needsBack ?? true;

  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  }, []);

  // Fetch KYC status on mount
  useEffect(() => {
    const fetchKycStatus = async () => {
      try {
        const res = await fetch("/api/kyc/status");
        if (res.ok) {
          const data = await res.json();
          setKycStatus(data.kycStatus);
          setKycData(data.submission);
          if (data.submission?.submission_id) {
            setRefCode(data.submission.submission_id);
          }
          // If status is pending or approved, show review step
          if (data.kycStatus === "pending" || data.kycStatus === "verified") {
            setStep(REVIEW_STEP);
          }
        }
      } catch (error) {
        console.error("Failed to fetch KYC status:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchKycStatus();
  }, []);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const clearError = (key: string) =>
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    clearError(key);
  };

  const setDocFile = (kind: "front" | "back" | "selfie", file: File) => {
    const problem = checkFile(file, kind === "selfie");
    if (problem) {
      setErrors((prev) => ({ ...prev, [kind]: problem }));
      return;
    }
    setFiles((prev) => ({ ...prev, [kind]: file }));
    clearError(kind);
  };

  const clearFile = (kind: "front" | "back" | "selfie") =>
    setFiles((prev) => ({ ...prev, [kind]: null }));

  const goTo = (n: number) => {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleContinue = () => {
    const e: Errors = {};
    if (step === 0 && !country) e.country = "Select the country that issued your document";
    if (step === 1 && !docType) e.docType = "Choose the document you'll use";
    if (step === 2) Object.assign(e, validateDetails(form));
    if (step === 3) {
      if (!files.front) e.front = "Upload the front of your document";
      if (needsBack && !files.back) e.back = "Upload the back of your document";
    }
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    goTo(step + 1);
  };

  const handleBack = () => {
    setErrors({});
    goTo(step - 1);
  };

  const handleSubmit = async () => {
    if (!files.selfie) {
      setErrors({ selfie: "Upload a selfie to continue" });
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      // Upload images to Cloudinary
      const uploadFile = async (file: File, type: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);
        
        const res = await fetch("/api/kyc/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        return data.url;
      };

      const frontImageUrl = await uploadFile(files.front!, "front");
      const backImageUrl = files.back ? await uploadFile(files.back, "back") : null;
      const selfieImageUrl = await uploadFile(files.selfie, "selfie");

      // Submit KYC
      const res = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          docType,
          firstName: form.firstName,
          lastName: form.lastName,
          dob: form.dob,
          docNumber: form.docNumber,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          postal: form.postal,
          frontImageUrl,
          backImageUrl,
          selfieImageUrl,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      
      const data = await res.json();
      setRefCode(data.submissionId);
      goTo(REVIEW_STEP);
    } catch {
      setErrors({ submit: "We couldn't submit your documents. Check your connection and try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const submitted = step === REVIEW_STEP;
  const status: { label: string; tone: "default" | "muted" | "success" } = 
    kycStatus === "verified" 
      ? { label: "Verified", tone: "success" }
      : kycStatus === "rejected"
        ? { label: "Rejected", tone: "default" }
        : submitted || kycStatus === "pending"
          ? { label: "Pending review", tone: "default" }
          : step === 0 && !country
            ? { label: "Not started", tone: "muted" }
            : { label: "In progress", tone: "default" };

  return (
    <UserShell active="KYC Verification">
      <div className="mx-auto w-full max-w-7xl space-y-6 overflow-x-hidden overflow-y-auto px-4 py-5 sm:space-y-8 sm:px-6 sm:py-7 lg:px-8 lg:py-8">

        {/* ── Header ────────────────────────────────────── */}
        <div ref={topRef} className="scroll-mt-6">
          <p className="text-xs font-medium text-muted-foreground">Profile</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
            Verify your identity
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Complete KYC to unlock deposits, withdrawals, trading and investment plans. It takes about 5 minutes.
          </p>
        </div>

        <div className="grid gap-5 sm:gap-6 lg:grid-cols-3">

          {/* ── Main flow ─────────────────────────────── */}
          <div className="min-w-0 space-y-5 sm:space-y-6 lg:col-span-2">
            <section aria-label="Progress">
              <Card>
                <Progress step={step} />
              </Card>
            </section>

            <section aria-label="Verification form">
              <Card className="sm:p-6 lg:p-8">

                {/* Step 0 — Country */}
                {step === 0 && (
                  <div>
                    <StepHeader
                      title="Where was your ID issued?"
                      description="Select the country of the document you'll upload."
                    />
                    <div className="min-h-56 sm:min-h-64">
                      <CountrySelect
                        value={country}
                        error={errors.country}
                        onChange={(c) => {
                          setCountry(c);
                          clearError("country");
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Step 1 — Document type */}
                {step === 1 && (
                  <div>
                    <StepHeader
                      title="Choose your document"
                      description="Pick one government-issued ID. It must be valid and in your name."
                    />
                    <div role="group" aria-label="Document type" className="grid gap-3 md:grid-cols-3">
                      {DOC_TYPES.map(({ id, label, description, icon: Icon }) => {
                        const selected = docType === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => {
                              setDocType(id);
                              clearError("docType");
                              if (id === "passport") clearFile("back");
                            }}
                            className={`relative flex flex-row items-center gap-4 rounded-2xl border p-4 text-left transition-colors md:flex-col md:gap-3 md:p-5 md:text-center ${FOCUS} ${
                              selected
                                ? "border-foreground bg-muted"
                                : "border-border bg-muted/40 hover:border-foreground/40 hover:bg-muted"
                            }`}
                          >
                            {selected && (
                              <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-foreground text-background">
                                <Check aria-hidden="true" className="size-3" />
                              </span>
                            )}
                            <span
                              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                                selected ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              <Icon aria-hidden="true" className="size-5" />
                            </span>
                            <span className="min-w-0 pr-6 md:pr-0">
                              <span className="block text-sm font-semibold text-foreground">{label}</span>
                              <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {errors.docType && (
                      <p role="alert" className="mt-3 text-xs text-destructive">
                        {errors.docType}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 2 — Personal details */}
                {step === 2 && (
                  <div>
                    <StepHeader
                      title="Confirm your details"
                      description="Enter them exactly as they appear on your document."
                    />
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input id="firstName" label="First name" autoComplete="given-name" value={form.firstName} error={errors.firstName} onChange={(v) => setField("firstName", v)} />
                        <Input id="lastName" label="Last name" autoComplete="family-name" value={form.lastName} error={errors.lastName} onChange={(v) => setField("lastName", v)} />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input id="dob" label="Date of birth" type="date" autoComplete="bday" max={maxDob} value={form.dob} error={errors.dob} onChange={(v) => setField("dob", v)} />
                        <Input id="issuingCountry" label="Issuing country" value={country?.name ?? ""} readOnly />
                      </div>
                      <Input id="docNumber" label={`${doc?.label ?? "Document"} number`} value={form.docNumber} error={errors.docNumber} placeholder="e.g. A1234567" onChange={(v) => setField("docNumber", v)} />

                      <div className="flex items-center gap-3 pt-2">
                        <span className="text-xs font-semibold text-foreground">Residential address</span>
                        <span aria-hidden="true" className="h-px flex-1 bg-border" />
                      </div>

                      <Input id="address1" label="Street address" autoComplete="address-line1" value={form.address1} error={errors.address1} onChange={(v) => setField("address1", v)} />
                      <Input id="address2" label="Apartment, suite, etc." optional autoComplete="address-line2" value={form.address2} onChange={(v) => setField("address2", v)} />
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        <Input id="city" label="City" autoComplete="address-level2" value={form.city} error={errors.city} onChange={(v) => setField("city", v)} />
                        <Input id="state" label="State / region" optional autoComplete="address-level1" value={form.state} onChange={(v) => setField("state", v)} />
                        <Input id="postal" label="Postal code" autoComplete="postal-code" value={form.postal} error={errors.postal} onChange={(v) => setField("postal", v)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 — Upload document */}
                {step === 3 && (
                  <div>
                    <StepHeader
                      title={`Upload your ${doc?.label ?? "document"}`}
                        description={
                          needsBack
                            ? "We need clear photos of both sides. JPG, PNG or WEBP, up to 5 MB each."
                            : "We need a clear photo of the photo page. JPG, PNG or WEBP, up to 5 MB."
                        }
                    />
                    <div className={`mb-5 grid gap-4 sm:mb-6 ${needsBack ? "sm:grid-cols-2" : ""}`}>
                      <UploadZone
                        id="doc-front"
                        title={needsBack ? "Front side" : "Photo page"}
                        hint="Drag a file here or click to browse"
                        accept="image/jpeg,image/png,image/webp"
                        file={files.front}
                        error={errors.front}
                        onSelect={(f) => setDocFile("front", f)}
                        onClear={() => clearFile("front")}
                      />
                      {needsBack && (
                        <UploadZone
                          id="doc-back"
                          title="Back side"
                          hint="Drag a file here or click to browse"
                          accept="image/jpeg,image/png,image/webp"
                          file={files.back}
                          error={errors.back}
                          onSelect={(f) => setDocFile("back", f)}
                          onClear={() => clearFile("back")}
                        />
                      )}
                    </div>
                    <Guidelines title="Photo guidelines" dos={DOC_DOS} donts={DOC_DONTS} />
                  </div>
                )}

                {/* Step 4 — Selfie */}
                {step === 4 && (
                  <div>
                    <StepHeader
                      title="Take a selfie"
                      description="We'll match your face to the photo on your document. JPG, PNG or WEBP, up to 5 MB."
                    />
                    <div className="mb-6">
                      <UploadZone
                        id="selfie"
                        variant="selfie"
                        title="Upload or take a selfie"
                        hint="On mobile, this opens your front camera"
                        accept="image/jpeg,image/png,image/webp"
                        file={files.selfie}
                        error={errors.selfie}
                        onSelect={(f) => setDocFile("selfie", f)}
                        onClear={() => clearFile("selfie")}
                      />
                    </div>
                    <Guidelines title="Selfie guidelines" dos={SELFIE_DOS} donts={SELFIE_DONTS} />
                    {errors.submit && (
                      <p role="alert" className="mt-4 text-xs text-destructive">
                        {errors.submit}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 5 — Review / pending / approved / rejected */}
                {step === REVIEW_STEP && (
                  <div className="flex flex-col items-center text-center">
                    {kycStatus === "verified" ? (
                      // Approved Status
                      <>
                        <div className="relative mb-5 grid size-20 place-items-center sm:mb-6 sm:size-24">
                          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-success/10" />
                          <div className="relative grid size-12 place-items-center rounded-2xl bg-success/10 text-success sm:size-14">
                            <ShieldCheck aria-hidden="true" className="size-7" />
                          </div>
                        </div>
                        <Badge label="KYC Verified" tone="success" />
                        <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                          Your identity is verified
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                          You now have full access to deposits, withdrawals, trading and investment plans.
                        </p>
                        {refCode && (
                          <div className="mt-6 flex w-full items-center justify-between gap-4 rounded-2xl bg-muted p-4 text-left">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Reference number</p>
                              <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">{refCode}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopy}
                              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-foreground transition-opacity hover:opacity-75 ${FOCUS}`}
                            >
                              {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
                              {copied ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}
                        <Link href="/dashboard" className={`${BTN_PRIMARY} mt-6 w-full flex-none sm:w-auto sm:px-8`}>
                          Back to dashboard
                        </Link>
                      </>
                    ) : kycStatus === "rejected" && kycData?.rejection_reason ? (
                      // Rejected Status
                      <>
                        <div className="relative mb-5 grid size-20 place-items-center sm:mb-6 sm:size-24">
                          <span aria-hidden="true" className="absolute inset-0 rounded-full bg-destructive/10" />
                          <div className="relative grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive sm:size-14">
                            <X aria-hidden="true" className="size-7" />
                          </div>
                        </div>
                        <Badge label="Rejected" tone="destructive" />
                        <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                          KYC verification was rejected
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                          Please review the reason below and submit again with the correct documents.
                        </p>
                        
                        <div className="mt-6 w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-left">
                          <p className="text-xs font-semibold text-destructive">Rejection Reason:</p>
                          <p className="mt-1.5 text-sm text-foreground">{kycData.rejection_reason}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setStep(0);
                            setCountry(null);
                            setDocType(null);
                            setForm(EMPTY_FORM);
                            setFiles({ front: null, back: null, selfie: null });
                            setErrors({});
                            setKycStatus(null);
                            setKycData(null);
                            setRefCode("");
                          }}
                          className={`${BTN_PRIMARY} mt-6 w-full flex-none sm:w-auto sm:px-8`}
                        >
                          Submit Again
                        </button>
                      </>
                    ) : (
                      // Pending Status
                      <>
                        <div className="relative mb-5 grid size-20 place-items-center sm:mb-6 sm:size-24">
                          <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-foreground/10" />
                          <span aria-hidden="true" className="absolute inset-3 rounded-full border border-foreground/25" />
                          <div className="relative grid size-12 place-items-center rounded-2xl bg-foreground/10 text-foreground sm:size-14">
                            <ShieldCheck aria-hidden="true" className="size-7" />
                          </div>
                        </div>
                        <Badge label="Pending review" />
                        <h2 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                          Your documents are under review
                        </h2>
                        <p className="mt-2 max-w-md text-sm text-muted-foreground">
                          We&apos;ll notify you as soon as the review is done. Most reviews finish within 24 hours.
                        </p>

                        <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
                          {[
                            { label: "Document check", icon: FileText },
                            { label: "Face match", icon: Camera },
                            { label: "Final review", icon: ShieldCheck },
                          ].map(({ label, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-3 rounded-2xl bg-muted p-4 text-left sm:block">
                              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-foreground/10 text-foreground sm:mb-3">
                                <Icon aria-hidden="true" className="size-4" />
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">{label}</p>
                                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                                  <span aria-hidden="true" className="inline-block size-1.5 animate-pulse rounded-full bg-foreground" />
                                  In queue
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {refCode && (
                          <div className="mt-4 flex w-full items-center justify-between gap-4 rounded-2xl bg-muted p-4 text-left">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">Reference number</p>
                              <p className="mt-0.5 truncate font-mono text-sm font-semibold text-foreground">{refCode}</p>
                            </div>
                            <button
                              type="button"
                              onClick={handleCopy}
                              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-foreground transition-opacity hover:opacity-75 ${FOCUS}`}
                            >
                              {copied ? <Check aria-hidden="true" className="size-3.5" /> : <Copy aria-hidden="true" className="size-3.5" />}
                              {copied ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}

                        <Link href="/dashboard" className={`${BTN_PRIMARY} mt-6 w-full flex-none sm:w-auto sm:px-8`}>
                          Back to dashboard
                        </Link>
                      </>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {step < REVIEW_STEP && (
                  <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                    {step > 0 && (
                      <button type="button" onClick={handleBack} disabled={submitting} className={`${BTN_SECONDARY} sm:px-5`}>
                        <ArrowLeft aria-hidden="true" className="size-4" />
                        Back
                      </button>
                    )}
                    {step < 4 ? (
                      <button type="button" onClick={handleContinue} className={BTN_PRIMARY}>
                        Continue
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} disabled={submitting} className={BTN_VERIFY}>
                        {submitting ? (
                          <>
                            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                            Submitting…
                          </>
                        ) : (
                          <>
                            <ShieldCheck aria-hidden="true" className="size-4" />
                            Submit for verification
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {step < REVIEW_STEP && (
                  <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Lock aria-hidden="true" className="size-3" />
                    Encrypted in transit and used only to verify your identity
                  </p>
                )}
              </Card>
            </section>
          </div>

          {/* ── Sidebar ──────────────────────────────── */}
          <aside className="grid min-w-0 gap-5 sm:grid-cols-2 sm:gap-6 lg:sticky lg:top-6 lg:grid-cols-1 lg:self-start">
            <section aria-label="Verification status" className="min-w-0">
              <SectionHeader title="Verification Status" />
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="grid size-8 place-items-center rounded-xl bg-foreground/10 text-foreground">
                      <ShieldCheck aria-hidden="true" className="size-4" />
                    </div>
                    <p className="text-sm font-semibold text-card-foreground">KYC</p>
                  </div>
                  <Badge label={status.label} tone={status.tone} />
                </div>
                <ul className="space-y-2.5">
                  {STEPS.slice(0, REVIEW_STEP).map((label, i) => {
                    const done = submitted || i < step;
                    const current = !submitted && i === step;
                    return (
                      <li key={label} className="flex items-center justify-between text-xs">
                        <span className={current ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
                        {done ? (
                          <span className="flex items-center gap-1 font-medium text-success">
                            <Check aria-hidden="true" className="size-3" />
                            Done
                          </span>
                        ) : current ? (
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Clock aria-hidden="true" className="size-3" />
                            In progress
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Pending</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </section>

            <section aria-label="Why verify" className="min-w-0">
              <SectionHeader title="Why Verify" />
              <Card>
                <ul className="space-y-3">
                  {BENEFITS.map((text) => (
                    <li key={text} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <span className="grid size-5 shrink-0 place-items-center rounded-md bg-success/10 text-success">
                        <Check aria-hidden="true" className="size-3" />
                      </span>
                      {text}
                    </li>
                  ))}
                </ul>
              </Card>
            </section>

            <section aria-label="Help" className="min-w-0 sm:col-span-2 lg:col-span-1">
              <Card>
                <p className="text-sm font-semibold text-card-foreground">Need help?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Stuck on a step or your document was rejected? Our support team can help.
                </p>
                <Link href="/support/create-ticket" className={`${BTN_SECONDARY} mt-4 w-full`}>
                  Contact support
                </Link>
              </Card>
            </section>
          </aside>
        </div>

        <div className="h-16 sm:h-20" />
      </div>
    </UserShell>
  );
}