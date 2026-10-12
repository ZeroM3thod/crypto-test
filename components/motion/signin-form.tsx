"use client";
// beui.dev/components/blocks/signin-form
// Same visual language as SignUpForm — same Input, Checkbox, StatefulButton,
// same card shell, same touched/error pattern — just fewer fields.

import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { StatefulButton } from "@/components/motion/button";
import { Checkbox } from "@/components/motion/checkbox";
import { Input } from "@/components/motion/input";
import { cn } from "@/lib/utils";

export type SignInStatus = "idle" | "loading" | "success" | "error";

export type SignInValues = {
  email: string;
  password: string;
  remember: boolean;
};

export type SignInErrors = Partial<Record<keyof SignInValues, string>>;

export type SignInFormClassNames = {
  root?: string;
  header?: string;
  title?: string;
  description?: string;
  fields?: string;
  options?: string;
  submit?: string;
  footer?: string;
};

export interface SignInFormProps {
  values?: SignInValues;
  defaultValues?: Partial<SignInValues>;
  onValuesChange?: (values: SignInValues) => void;
  onSubmit?: (values: SignInValues) => void | Promise<void>;
  validate?: (values: SignInValues) => SignInErrors;
  status?: SignInStatus;
  errorMessage?: string;
  title?: ReactNode;
  description?: ReactNode;
  submitLabel?: string;
  footer?: ReactNode;
  /** Rendered next to "Remember me" — e.g. a "Forgot password?" link. */
  secondaryAction?: ReactNode;
  className?: string;
  classNames?: SignInFormClassNames;
}

const EMPTY_VALUES: SignInValues = {
  email: "",
  password: "",
  remember: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function defaultValidate(values: SignInValues): SignInErrors {
  const errors: SignInErrors = {};

  if (!values.email.trim()) {
    errors.email = "Enter your email.";
  } else if (!EMAIL_PATTERN.test(values.email)) {
    errors.email = "That doesn't look like an email address.";
  }

  if (!values.password) {
    errors.password = "Enter your password.";
  }

  return errors;
}

export function SignInForm({
  values: valuesProp,
  defaultValues,
  onValuesChange,
  onSubmit,
  validate,
  status: statusProp,
  errorMessage,
  title = "Welcome back",
  description = "Sign in to continue.",
  submitLabel = "Sign in",
  footer,
  secondaryAction,
  className,
  classNames,
}: SignInFormProps) {
  const reduce = useReducedMotion();
  const baseId = useId();

  const controlled = valuesProp !== undefined;
  const [internalValues, setInternalValues] = useState<SignInValues>({
    ...EMPTY_VALUES,
    ...defaultValues,
  });
  const values = controlled ? valuesProp : internalValues;

  const [internalStatus, setInternalStatus] = useState<SignInStatus>("idle");
  const status = statusProp ?? internalStatus;

  const [revealPassword, setRevealPassword] = useState(false);

  const [touched, setTouched] = useState<Partial<Record<keyof SignInValues, boolean>>>(
    {},
  );

  const errors = useMemo(
    () => (validate ?? defaultValidate)(values),
    [values, validate],
  );

  const setValue = useCallback(
    <K extends keyof SignInValues>(key: K, next: SignInValues[K]) => {
      const nextValues = { ...values, [key]: next };
      if (!controlled) {
        setInternalValues(nextValues);
        if (statusProp === undefined) {
          setInternalStatus((current) =>
            current === "success" || current === "error" ? "idle" : current,
          );
        }
      }
      onValuesChange?.(nextValues);
    },
    [controlled, onValuesChange, statusProp, values],
  );

  const touch = useCallback((key: keyof SignInValues) => {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }, []);

  const shownError = (key: keyof SignInValues) =>
    touched[key] ? errors[key] : undefined;

  const isValid = (key: keyof SignInValues) =>
    Boolean(touched[key]) && !errors[key] && Boolean(values[key]);

  const isSubmitting = status === "loading";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({ email: true, password: true, remember: true });

    if (Object.keys(errors).length > 0) return;
    if (!onSubmit) return;

    if (statusProp === undefined) setInternalStatus("loading");
    try {
      await onSubmit(values);
      if (statusProp === undefined) setInternalStatus("success");
    } catch {
      if (statusProp === undefined) setInternalStatus("error");
    }
  };

  const formErrorId = `${baseId}-form-error`;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className={cn(
        "flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-border p-6",
        className,
        classNames?.root,
      )}
    >
      {title || description ? (
        <div className={cn("flex flex-col gap-1", classNames?.header)}>
          {title ? (
            <h2
              className={cn(
                "text-xl font-semibold tracking-tight text-foreground",
                classNames?.title,
              )}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className={cn(
                "text-sm text-muted-foreground",
                classNames?.description,
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className={cn("flex flex-col gap-1", classNames?.fields)}>
        <Input
          label="Email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          leftIcon={<Mail />}
          disabled={isSubmitting}
          value={values.email}
          onChange={(next) => setValue("email", next)}
          onBlur={() => touch("email")}
          error={shownError("email")}
          reserveErrorLine
          success={isValid("email")}
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
              disabled={isSubmitting}
              onClick={() => setRevealPassword((prev) => !prev)}
              aria-label={revealPassword ? "Hide password" : "Show password"}
              className="text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
            >
              {revealPassword ? <EyeOff /> : <Eye />}
            </button>
          }
          disabled={isSubmitting}
          value={values.password}
          onChange={(next) => setValue("password", next)}
          onBlur={() => touch("password")}
          error={shownError("password")}
          reserveErrorLine
        />
      </div>

      <div
        className={cn(
          "flex items-center justify-between px-1",
          classNames?.options,
        )}
      >
        <Checkbox
          checked={values.remember}
          disabled={isSubmitting}
          onCheckedChange={(next) => setValue("remember", next)}
          label="Remember me"
        />
        {secondaryAction}
      </div>

      <AnimatePresence initial={false}>
        {errorMessage ? (
          <motion.p
            id={formErrorId}
            role="alert"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
          >
            {errorMessage}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <StatefulButton
        type="submit"
        size="lg"
        state={status}
        loadingText="Signing in"
        successText="Signed in"
        errorText="Try again"
        aria-describedby={errorMessage ? formErrorId : undefined}
        className={cn("w-full", classNames?.submit)}
      >
        {submitLabel}
      </StatefulButton>

      {footer ? (
        <div
          className={cn(
            "text-center text-sm text-muted-foreground",
            classNames?.footer,
          )}
        >
          {footer}
        </div>
      ) : null}
    </form>
  );
}
