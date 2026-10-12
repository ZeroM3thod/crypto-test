// app/api/owner/users/[id]/route.ts
// Owner-scoped user updates. The owner may edit profile/KYC/status data,
// wallet addresses and the wallet balances shown on the owner user-detail
// page (every balance change is audited: owner id, old value, new value).
// `rewards` is ignored here: rewards are created only through
// POST /api/owner/users/[id]/rewards so they cannot be double-credited.
import { requireOwner } from "@/lib/auth/require-owner";
import { logBalanceChange } from "@/lib/admin-data";
import { getUser, type WalletKey } from "@/lib/users-data";

/** Top-level fields the owner may update. Identity (`id`) and `rewards` are
 *  handled separately (immutable / rewards endpoint only). */
const OWNER_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "joinedAt",
  "dob",
  "country",
  "referredBy",
  "walletAddress",
  "twoFA",
  "status",
  "kyc",
  "referrals",
  "investments",
  "aiStrategies",
  "manualTrades",
  "logins",
  "dailyProfits",
  "aiTrades",
] as const;

const err = (error: string, status: number) => Response.json({ error }, { status });

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireOwner();

  const { id } = await params;
  const stored = getUser(id);
  if (!stored) return err("User not found", 404);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return err("Invalid JSON body", 400);

  // 1. identity is immutable (rows are keyed by it)
  if ("id" in body && body.id !== stored.id) return err("User id cannot be changed", 400);

  // rewards only exist through POST .../rewards — never applied here
  delete body.rewards;

  // 2. wallets: balance must be a sane number; addresses may be rewritten
  const balanceChanges: { wallet: WalletKey; from: number; to: number }[] = [];
  if ("wallets" in body) {
    const wallets = body.wallets;
    if (!wallets || typeof wallets !== "object" || Array.isArray(wallets)) {
      return err("Invalid wallets payload", 400);
    }
    for (const [key, sent] of Object.entries(wallets as Record<string, unknown>)) {
      const current = stored.wallets[key as WalletKey];
      if (!current) return err(`Unknown wallet: ${key}`, 400);
      if (!sent || typeof sent !== "object" || Array.isArray(sent)) {
        return err(`Invalid wallet payload: ${key}`, 400);
      }

      const patch = sent as Record<string, unknown>;
      if ("balance" in patch) {
        const balance = patch.balance;
        if (typeof balance !== "number" || !Number.isFinite(balance) || balance < 0) {
          return err(`wallets.${key}.balance must be a number >= 0`, 400);
        }
        if (balance !== current.balance) {
          balanceChanges.push({ wallet: key as WalletKey, from: current.balance, to: balance });
        }
      }
      // apply the rest (address, lockedBalance, transactions, ...) as-is
      Object.assign(current, patch);
    }
  }

  // 3. validate the top-level fields, then apply them
  const updates: [field: string, value: unknown][] = [];
  for (const field of OWNER_FIELDS) {
    if (!(field in body)) continue;
    const value = body[field];
    if (value === undefined) continue;
    if (field === "status" && value !== "active" && value !== "suspended") {
      return err("Invalid status: expected active | suspended", 400);
    }
    if (field === "twoFA" && typeof value !== "boolean") {
      return err("Invalid twoFA: expected boolean", 400);
    }
    if (field === "kyc" && (!value || typeof value !== "object" || Array.isArray(value))) {
      return err("Invalid kyc payload", 400);
    }
    updates.push([field, value]);
  }

  const target = stored as unknown as Record<string, unknown>;
  for (const [field, value] of updates) target[field] = value;
  for (const change of balanceChanges) {
    stored.wallets[change.wallet].balance = change.to;
    // audit trail: who changed it, and from which value to which value
    logBalanceChange({
      adminId: session.id,
      userId: id,
      wallet: change.wallet,
      from: change.from,
      to: change.to,
    });
  }

  return Response.json({ ok: true, id, updatedBy: session.id });
}
