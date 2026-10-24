That's the bug. It comes from the referral insert in `verify-otp`, not from the code you pasted.

`referrals?on_conflict=referred_id` tells Postgres to ignore duplicates on `referred_id`, but your `referrals` table has no unique constraint on that column. Postgres rejects the insert with `42P10`, which makes `verify-otp` return 500 and the UI show "Wrong code".

The activation order makes it worse:

1. `updateUser` sets the account to `active`.
2. The referral insert throws.
3. The OTP is never consumed and no session is created.
4. Every retry hits `"This account is already verified"`.

So any account that used a referral code is now active but stuck. Those users can sign in with their password.

**Fix 1: add the constraint (run in the Supabase SQL editor)**

```sql
-- check for duplicates first; if this returns rows, delete the extras before continuing
select referred_id, count(*) from public.referrals group by referred_id having count(*) > 1;

alter table public.referrals
  add constraint referrals_referred_id_key unique (referred_id);
```

**Fix 2: make a referral failure unable to block verification** (in `app/api/verify-otp/route.ts`)

```ts
const refCode = String(user.referral_code || "").trim();
if (refCode) {
  try {
    const owners = await supabase<{ id: string }[]>(
      `auth_users?select=id&or=(user_id.eq.${q(refCode)},referral_code.eq.${q(refCode)})&status=eq.active&limit=1`
    );
    if (owners[0] && owners[0].id !== user.id) {
      await supabase("referrals?on_conflict=referred_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({ referrer_id: owners[0].id, referred_id: user.id }),
      });
    }
  } catch (err) {
    console.error("Referral link failed:", err); // don't fail signup over this
  }
}
```

Also move `await verifyOtp(email, cleanCode.trim(), purpose, true)` to right after `updateUser`, before the referral block, so the code is consumed as soon as the account activates.

**Stuck accounts:** users who already hit this are active with no session, so they just need to sign in with their email and password. Their referral rows were never created. If you want those back, I can write a SQL backfill that inserts them from `auth_users.referral_code`.

Do you want that backfill?