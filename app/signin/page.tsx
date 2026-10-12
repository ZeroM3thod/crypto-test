"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, User } from "lucide-react";
import { StatefulButton, type ButtonState } from "@/components/motion/button";
import { Checkbox } from "@/components/motion/checkbox";
import { Input } from "@/components/motion/input";
import { WizardShell } from "@/components/motion/wizard-shell";
import { FloatingThemeToggle } from "@/components/theme-toggle";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// User ID: 3-32 chars, letters, numbers, underscore, dot, hyphen
const USER_ID_PATTERN = /^[A-Za-z0-9._-]{3,32}$/;

export default function SignInPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<ButtonState>("idle");
  const [formError, setFormError] = useState<string>();

  const touch = (key: string) =>
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  const trimmedIdentifier = identifier.trim();
  const isEmail = trimmedIdentifier.includes("@");

  const errors = {
    identifier: !trimmedIdentifier
      ? "Enter your email or user ID."
      : isEmail
        ? !EMAIL_PATTERN.test(trimmedIdentifier)
          ? "That doesn't look like an email address."
          : undefined
        : !USER_ID_PATTERN.test(trimmedIdentifier)
          ? "User ID must be 3-32 characters (letters, numbers, . _ -)."
          : undefined,
    password: !password ? "Enter your password." : undefined,
  };

  const shownError = (key: keyof typeof errors) => (touched[key] ? errors[key] : undefined);

  const handleSubmit = async () => {
    setTouched({ identifier: true, password: true });
    if (errors.identifier || errors.password) return;

    setFormError(undefined);
    setStatus("loading");

    try {
      const res = await fetch("/api/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: trimmedIdentifier,
          identifierType: isEmail ? "email" : "userId",
          password,
          remember,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setFormError(data?.message ?? "Invalid credentials.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 1800);
        return;
      }

      const data = await res.json().catch(() => null);
      setStatus("success");
      setTimeout(() => router.push(data?.redirect || "/dashboard"), 900);
    } catch {
      setFormError("Network error. Please try again.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 1800);
    }
  };

  return (
    <>
      <FloatingThemeToggle />
      <WizardShell shaderSide="right" stepKey="signin">
      <div className="flex w-full flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight text-white">Welcome back</h2>
          <p className="text-sm text-white">Sign in to continue.</p>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Email or user ID"
            type="text"
            inputMode="text"
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="you@example.com or your user ID"
            leftIcon={<User />}
            disabled={status === "loading"}
            value={identifier}
            onChange={setIdentifier}
            onBlur={() => touch("identifier")}
            error={shownError("identifier")}
            reserveErrorLine
            success={touched.identifier && !errors.identifier && Boolean(identifier)}
          />

          <Input
            label="Password"
            type={revealPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Your password"
            leftIcon={<Lock />}
            rightIcon={
              <button
                type="button"
                disabled={status === "loading"}
                onClick={() => setRevealPassword((p) => !p)}
                aria-label={revealPassword ? "Hide password" : "Show password"}
                className="text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
              >
                {revealPassword ? <EyeOff /> : <Eye />}
              </button>
            }
            disabled={status === "loading"}
            value={password}
            onChange={setPassword}
            onBlur={() => touch("password")}
            error={shownError("password")}
            reserveErrorLine
          />
        </div>

        <div className="flex items-center justify-between px-1">
          <Checkbox
            checked={remember}
            disabled={status === "loading"}
            onCheckedChange={setRemember}
            label="Remember me"
          />
          <button
            type="button"
            onClick={() => router.push("/forgot-password")}
            className="text-sm font-medium text-white underline-offset-4 hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {formError ? (
          <p
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <StatefulButton
            state={status}
            variant="primary"
            size="md"
            onClick={handleSubmit}
            loadingText="Signing in"
            successText="Signed in"
            errorText="Try again"
            icon={<ArrowRight className="h-4 w-4" />}
            className="ml-auto bg-white text-black hover:bg-white/90"
          >
            Sign in
          </StatefulButton>
        </div>

        <div className="text-center text-sm text-white">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/signup")}
            className="font-medium text-white underline underline-offset-4"
          >
            Sign up
          </button>
        </div>
      </div>
    </WizardShell>
    </>
  );
}
