"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/motion/input";
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input";
import { StepCard } from "@/components/motion/step-card";
import { WizardShell } from "@/components/motion/wizard-shell";
import { FloatingThemeToggle } from "@/components/theme-toggle";
import { passwordStrength } from "@/components/motion/signup-form-extended"; // reuse the same scoring fn

const TOTAL_STEPS = 3;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Odd step -> shader right, even step -> shader left. Matches: 1 right, 2 left, 3 right.
function shaderSideFor(step: number): "left" | "right" {
  return step % 2 === 1 ? "right" : "left";
}

export default function ForgotPasswordWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>();

  // ---- Step 1: email ----
  const [email, setEmail] = useState("");

  // ---- Step 2: otp ----
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<OTPStatus>("idle");
  const [resending, setResending] = useState(false);

  // ---- Step 3: new password ----
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revealPassword, setRevealPassword] = useState(false);

  const strength = passwordStrength(password);

  // touched flags per-field, reused across steps (same pattern as SignUpForm)
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = useCallback((key: string) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  // ---- Per-step validation ----
  const stepErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!email.trim()) e.email = "Enter your email.";
      else if (!EMAIL_PATTERN.test(email)) e.email = "That doesn't look like an email address.";
    }
    if (step === 3) {
      if (!password) e.password = "Choose a password.";
      else if (password.length < 8) e.password = "Use at least 8 characters.";
      if (!confirmPassword) e.confirmPassword = "Confirm your password.";
      else if (confirmPassword !== password) e.confirmPassword = "Passwords don't match.";
    }
    return e;
  }, [step, email, password, confirmPassword]);

  const shownError = (key: string) => (touched[key] ? stepErrors[key] : undefined);

  const touchStepFields = () => {
    const fieldsByStep: Record<number, string[]> = {
      1: ["email"],
      2: [],
      3: ["password", "confirmPassword"],
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

    if (step === 1) {
      // Request OTP, then move to verification step.
      setSubmitting(true);
      setFormError(undefined);
      try {
        const res = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setFormError(data?.message ?? "We couldn't find an account with that email.");
          setSubmitting(false);
          return;
        }
        setSubmitting(false);
        setStep(2);
      } catch {
        setFormError("Network error. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    if (step === 2) {
      // handled by OTPInput's onComplete instead
      return;
    }

    if (step === 3) {
      // Save the new password.
      setSubmitting(true);
      setFormError(undefined);
      try {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp, password }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setFormError(data?.message ?? "Something went wrong. Please try again.");
          setSubmitting(false);
          return;
        }
        setSubmitting(false);
        router.push("/signin");
      } catch {
        setFormError("Network error. Please try again.");
        setSubmitting(false);
      }
      return;
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setFormError(undefined);
    setStep((s) => Math.max(s - 1, 1));
  };

  const resendOtp = async () => {
    setResending(true);
    setFormError(undefined);
    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setFormError("Couldn't resend the code. Please try again.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <>
      <FloatingThemeToggle />
      <WizardShell shaderSide={shaderSideFor(step)} stepKey={step}>
      {step === 1 ? (
        <StepCard
          title="Forgot password?"
          description="Enter your email and we'll send you a code to reset it."
          onNext={goNext}
          nextLabel="Send code"
          nextState={submitting ? "loading" : "idle"}
          hideBack
        >
          <Input
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            leftIcon={<Mail />}
            disabled={submitting}
            value={email}
            onChange={setEmail}
            onBlur={() => touch("email")}
            error={shownError("email")}
            reserveErrorLine
            success={touched.email && !stepErrors.email && Boolean(email)}
          />
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {formError}
            </p>
          ) : null}
        </StepCard>
      ) : null}

      {step === 2 ? (
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to {email || "your email"}.
            </p>
          </div>
          <div className="flex justify-center">
            <OTPInput
              label="Verification code"
              hint="Enter the 6-digit code we sent you."
              successMessage="Verified!"
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
                  setTimeout(() => setStep(3), 700);
                } else {
                  setOtpStatus("error");
                }
              }}
            />
          </div>
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {formError}
            </p>
          ) : null}
          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              disabled={resending}
              onClick={resendOtp}
              className="font-medium text-foreground underline underline-offset-4 disabled:opacity-50"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
          </div>
          <button
            type="button"
            onClick={goBack}
            className="text-center text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </div>
      ) : null}

      {step === 3 ? (
        <StepCard
          title="Set a new password"
          description="Choose a strong password for your account."
          onNext={goNext}
          nextLabel="Save password"
          nextState={submitting ? "loading" : "idle"}
          hideBack
        >
          <Input
            label="New password"
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
            label="Confirm new password"
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
          {formError ? (
            <p
              role="alert"
              className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {formError}
            </p>
          ) : null}
        </StepCard>
      ) : null}
    </WizardShell>
    </>
  );
}