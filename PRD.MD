Most likely the paste makes `onComplete` fire twice, and the second call overwrites the success with an error.

1. The first request verifies the code and activates the account.
2. The second request finds the account already `active` and returns `400 "This account is already verified"`.
3. Your client treats any non-OK response as `setOtpStatus("error")`, so the UI shows "Wrong code, try again."

Typing a code fires `onComplete` once, but pasting often triggers it from both the paste handler and the "6 digits filled" effect.

**To confirm:** open DevTools, go to the Network tab, paste the code, and look for two `verify-otp` requests. The first returns 200 and the second returns 400.

**Fix in `app/signup/page.tsx`:**

```tsx
import { useRef } from "react"; // add to your react import

// inside SignUpWizardContent
const verifyingRef = useRef(false);

// OTPInput
onComplete={async (raw) => {
  const v = raw.replace(/\D/g, "");          // strip spaces/newlines from pasted text
  if (v.length !== 6 || verifyingRef.current) return;
  verifyingRef.current = true;
  try {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code: v }),
    });
    if (res.ok) {
      localStorage.removeItem("pending_signup_email");
      localStorage.removeItem("pending_signup_at");
      setOtpStatus("success");
      setTimeout(() => router.push("/dashboard"), 900);
      return; // keep the lock after success
    }
    const data = await res.json().catch(() => null);
    setOtpStatus("error");
    if (res.status !== 400) setFormError(data?.message ?? "Verification failed. Try again.");
  } catch {
    setOtpStatus("error");
    setFormError("Network error. Please try again.");
  }
  verifyingRef.current = false; // unlock only after a failure
}}
```

This also stops every server failure from showing "Wrong code." Right now a 500 (for example, the `referrals` insert failing) looks the same as a bad code.

**Other things that cause this:**

- **Old code:** every resend or new signup invalidates earlier codes. Pasting from an older email fails, so use the newest one.
- **Hidden characters:** the fix above strips whitespace, but if the `OTPInput` component only accepts digits on keypress, it may be rejecting the paste. If the fix doesn't help, send me `components/motion/otp-input.tsx` and I'll check its paste handling.
- **Failed activation:** if the Network tab shows a single request returning 500, send me the response message.

What does the Network tab show when you paste?