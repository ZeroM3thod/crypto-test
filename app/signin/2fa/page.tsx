"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { OTPInput, type OTPStatus } from "@/components/motion/otp-input";
import { WizardShell } from "@/components/motion/wizard-shell";
import { FloatingThemeToggle } from "@/components/theme-toggle";

const RESEND_COOLDOWN = 30; // seconds

export default function TwoFactorPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<OTPStatus>("idle");
  const [formError, setFormError] = useState<string>();

  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>();

  // ---- Resend cooldown timer ----
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  // ---- Verify the 2FA code (fires automatically when all digits are entered) ----
  const handleComplete = useCallback(
    async (code: string) => {
      setFormError(undefined);
      setResendMessage(undefined);
      try {
        const res = await fetch("/api/signin/2fa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        if (res.ok) {
          setOtpStatus("success");
          const data = await res.json().catch(() => null);
          setTimeout(() => router.push(data?.redirect || "/dashboard"), 900);
          return;
        }

        const data = await res.json().catch(() => null);
        setOtpStatus("error");
        if (data?.message) setFormError(data.message);
      } catch {
        setOtpStatus("error");
        setFormError("Network error. Please try again.");
      }
    },
    [router],
  );

  // ---- Resend the code ----
  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setFormError(undefined);
    setResendMessage(undefined);
    try {
      const res = await fetch("/api/signin/2fa/resend", { method: "POST" });
      if (res.ok) {
        setResendMessage("A new code has been sent.");
        setOtp("");
        setOtpStatus("idle");
        setCooldown(RESEND_COOLDOWN);
      } else {
        const data = await res.json().catch(() => null);
        setFormError(data?.message ?? "Couldn't resend the code. Please try again.");
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
      <WizardShell shaderSide="right" stepKey="2fa">
        <div className="flex w-full flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Two-factor authentication
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app or the one we sent you.
            </p>
          </div>

          <div className="flex justify-center">
            <OTPInput
              label="Authentication code"
              hint="Enter the 6-digit code."
              successMessage="Verified! Redirecting…"
              errorMessage="Wrong code, try again."
              value={otp}
              status={otpStatus}
              onChange={(v) => {
                setOtp(v);
                if (otpStatus !== "idle") setOtpStatus("idle");
                if (formError) setFormError(undefined);
              }}
              onComplete={handleComplete}
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

          {resendMessage ? (
            <p role="status" className="px-1 text-center text-xs text-muted-foreground">
              {resendMessage}
            </p>
          ) : null}

          <div className="flex flex-col items-center gap-2 text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:text-muted-foreground"
            >
              {resending
                ? "Sending…"
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
            </button>

            <Link
              href="/signin"
              className="text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </WizardShell>
    </>
  );
}
