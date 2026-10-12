"use client";

import { useCallback, useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Checkbox } from "@/components/motion/checkbox";
import { CountrySelect } from "@/components/motion/country-select";
import { DobField, type DobValue } from "@/components/motion/dob-field";
import { Input } from "@/components/motion/input";
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input";
import { PhoneInput } from "@/components/motion/phone-input";
import { StepCard } from "@/components/motion/step-card";
import { WizardShell } from "@/components/motion/wizard-shell";
import { FloatingThemeToggle } from "@/components/theme-toggle";
import { passwordStrength } from "@/components/motion/signup-form-extended"; // reuse the same scoring fn
import { COUNTRIES } from "@/lib/countries";
import { DIAL_CODES } from "@/lib/dial-codes";

const TOTAL_STEPS = 6;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_DOB: DobValue = { month: "January", day: "1", year: "2000" };

// Odd step -> shader right, even step -> shader left. Matches: 1 right, 2 left, 3 right, 4 left, 5 right, 6 left.
function shaderSideFor(step: number): "left" | "right" {
  return step % 2 === 1 ? "right" : "left";
}

function SignUpWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  // ---- All fields across all steps, one flat state object ----
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");
  const [dob, setDob] = useState<DobValue>(DEFAULT_DOB);
  const [referral, setReferral] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<OTPStatus>("idle");

  const setCountryAndPrefix = (nextCountry: string) => {
    setCountry(nextCountry);
    const code = DIAL_CODES[COUNTRIES.find((c) => c.name === nextCountry)?.code || ""];
    if (code) setMobile((value) => `${code} ${value.replace(/^\+\d+\s*/, "")}`.trim());
  };

  // Pre-fill referral code from URL
  useEffect(() => {
    const refParam = searchParams.get("ref");
    if (refParam) {
      setReferral(refParam);
    }
  }, [searchParams]);

  // touched flags per-field, reused across steps (same pattern as SignUpForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = useCallback((key: string) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const strength = passwordStrength(password);

  // ---- Per-step validation ----
  const stepErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!firstName.trim()) e.firstName = "Enter your first name.";
      if (!lastName.trim()) e.lastName = "Enter your last name.";
    }
    if (step === 2) {
      if (!email.trim()) e.email = "Enter your email.";
      else if (!EMAIL_PATTERN.test(email)) e.email = "That doesn't look like an email address.";
      if (!mobile.trim()) e.mobile = "Enter your mobile number.";
    }
    if (step === 3) {
      if (!country) e.country = "Select your country.";
      // dob always has a value (defaulted), no hard requirement beyond that
    }
    // step 4 (referral) is optional — no errors possible
    if (step === 5) {
      if (!password) e.password = "Choose a password.";
      else if (password.length < 8) e.password = "Use at least 8 characters.";
      if (!confirmPassword) e.confirmPassword = "Confirm your password.";
      else if (confirmPassword !== password) e.confirmPassword = "Passwords don't match.";
      if (!terms) e.terms = "Accept the terms to continue.";
    }
    return e;
  }, [step, firstName, lastName, email, mobile, country, password, confirmPassword, terms]);

  const shownError = (key: string) => (touched[key] ? stepErrors[key] : undefined);

  const touchStepFields = () => {
    const fieldsByStep: Record<number, string[]> = {
      1: ["firstName", "lastName"],
      2: ["email", "mobile"],
      3: ["country", "dob"],
      4: [],
      5: ["password", "confirmPassword", "terms"],
      6: [],
    };
    setTouched((prev) => {
      const next = { ...prev };
      for (const f of fieldsByStep[step] ?? []) next[f] = true;
      return next;
    });
  };

  const goNext = async () => {
    touchStepFields();
    if (Object.keys(stepErrors).length > 0) return;

    if (step === 5) {
      // Submit the whole payload, then move to OTP step.
      setSubmitting(true);
      setFormError(undefined);
      try {
        const res = await fetch("/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName, lastName, email, mobile, country, dob, referral, password,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setFormError(data?.message ?? "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
        setSubmitting(false);
        setStep(6);
      } catch {
        setFormError("Network error. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    if (step === 6) {
      // handled by OTPInput's onComplete instead
      return;
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  return (
    <>
      <FloatingThemeToggle />
      <WizardShell shaderSide={shaderSideFor(step)} stepKey={step}>
      {step === 1 ? (
        <StepCard
          title="What's your name?"
          description="Let's start with the basics."
          onNext={goNext}
          hideBack
        >
          <Input
            label="First name"
            placeholder="Ada"
            leftIcon={<User />}
            value={firstName}
            onChange={setFirstName}
            onBlur={() => touch("firstName")}
            error={shownError("firstName")}
            reserveErrorLine
            success={touched.firstName && !stepErrors.firstName && Boolean(firstName)}
          />
          <Input
            label="Last name"
            placeholder="Lovelace"
            leftIcon={<User />}
            value={lastName}
            onChange={setLastName}
            onBlur={() => touch("lastName")}
            error={shownError("lastName")}
            reserveErrorLine
            success={touched.lastName && !stepErrors.lastName && Boolean(lastName)}
          />

          {/* Sign in */}
          <p className="px-1 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/signin"
              className="font-medium text-foreground underline-offset-4 outline-none transition-colors hover:underline focus-visible:underline"
            >
              Sign in
            </Link>
          </p>
        </StepCard>
      ) : null}

      {step === 2 ? (
        <StepCard
          title="Contact details"
          description="How can we reach you?"
          onBack={goBack}
          onNext={goNext}
        >
          <Input
            label="Email"
            type="email"
            inputMode="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            value={email}
            onChange={setEmail}
            onBlur={() => touch("email")}
            error={shownError("email")}
            reserveErrorLine
            success={touched.email && !stepErrors.email && Boolean(email)}
          />
          <PhoneInput
            label="Mobile number"
            country={country}
            onCountryChange={setCountryAndPrefix}
            value={mobile}
            onChange={setMobile}
            onBlur={() => touch("mobile")}
            error={shownError("mobile")}
            reserveErrorLine
            success={touched.mobile && !stepErrors.mobile && Boolean(mobile)}
          />
        </StepCard>
      ) : null}

      {step === 3 ? (
        <StepCard
          title="Where are you from?"
          description="Used to personalize your experience."
          onBack={goBack}
          onNext={goNext}
        >
          <CountrySelect
            value={country}
            onValueChange={(v) => {
              setCountryAndPrefix(v);
              touch("country");
            }}
            error={shownError("country")}
            reserveErrorLine
            success={touched.country && !stepErrors.country && Boolean(country)}
          />
          <DobField
            value={dob}
            onValueChange={setDob}
            reserveErrorLine
          />
        </StepCard>
      ) : null}

      {step === 4 ? (
        <StepCard
          title="Got a referral code?"
          description="Optional — leave blank if you don't have one."
          onBack={goBack}
          onNext={goNext}
          nextLabel={referral.trim() ? "Next" : "Skip"}
        >
          <Input
            label="Referral code (optional)"
            placeholder="e.g. FRIEND25"
            value={referral}
            onChange={setReferral}
            reserveErrorLine
          />
        </StepCard>
      ) : null}

      {step === 5 ? (
        <StepCard
          title="Secure your account"
          description="Choose a strong password."
          onBack={goBack}
          onNext={goNext}
          nextLabel="Create account"
          nextState={submitting ? "loading" : "idle"}
        >
          <Input
            label="Password"
            type={revealPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            leftIcon={<Lock />}
            rightIcon={
              <button
                type="button"
                onClick={() => setRevealPassword((p) => !p)}
                aria-label={revealPassword ? "Hide password" : "Show password"}
                className="text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
              >
                {revealPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            value={password}
            onChange={setPassword}
            onBlur={() => touch("password")}
            error={shownError("password")}
            reserveErrorLine
          />
          {password.length > 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              Password strength: {["Too short", "Weak", "Fair", "Good", "Strong"][strength]}
            </p>
          ) : null}
          <Input
            label="Confirm password"
            type={revealPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Re-enter your password"
            leftIcon={<Lock />}
            value={confirmPassword}
            onChange={setConfirmPassword}
            onBlur={() => touch("confirmPassword")}
            error={shownError("confirmPassword")}
            reserveErrorLine
          />
          <Checkbox
            checked={terms}
            onCheckedChange={(next) => {
              setTerms(next);
              touch("terms");
            }}
            label="I agree to the Terms and Privacy Policy"
          />
          {shownError("terms") ? (
            <p role="alert" className="px-1 text-xs text-destructive">
              {shownError("terms")}
            </p>
          ) : null}
          {formError ? (
            <p role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {formError}
            </p>
          ) : null}
        </StepCard>
      ) : null}

      {step === 6 ? (
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Verify your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to {email || "your email"}.
            </p>
          </div>
          <div className="flex justify-center">
            <OTPInput
              label="Verification code"
              hint="Enter the 6-digit code we sent you."
              successMessage="Verified! Redirecting…"
              errorMessage="Wrong code, try again."
              value={otp}
              status={otpStatus}
              onChange={(v) => {
                setOtp(v);
                if (otpStatus !== "idle") setOtpStatus("idle");
              }}
              onComplete={async (v) => {
                const res = await fetch("/api/verify-otp", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email, code: v }),
                });
                if (res.ok) {
                  setOtpStatus("success");
                  setTimeout(() => router.push("/dashboard"), 900);
                } else {
                  setOtpStatus("error");
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </WizardShell>
    </>
  );
}

export default function SignUpWizardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignUpWizardContent />
    </Suspense>
  );
}