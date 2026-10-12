// app/api/owner/users/[id]/rewards/route.ts
// Send a reward to a user's Main or Investment wallet. One transaction against
// the mock store (swap for a DB transaction when the real backend lands):
// validate → insert the reward row → credit the wallet → lock the principal
// when the reward is non-withdrawable.
// Rewards are never sent through PATCH /api/owner/users/[id], so they cannot
// be double-credited or silently edited afterwards.
import { requireOwner } from "@/lib/auth/require-owner";
import { logBalanceChange } from "@/lib/admin-data";
import { getUser, type Reward, type RewardType, type RewardWallet } from "@/lib/users-data";

const WALLETS: readonly RewardWallet[] = ["main", "investment"];
const TYPES: readonly RewardType[] = ["withdrawable", "non_withdrawable"];

const err = (error: string, status: number) => Response.json({ error }, { status });
const pad = (n: number) => String(n).padStart(2, "0");

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. owner only
  const session = await requireOwner();

  const { id } = await params;
  const stored = getUser(id);
  if (!stored) return err("User not found", 404);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return err("Invalid JSON body", 400);

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const wallet = body.wallet as RewardWallet;
  const type = body.type as RewardType;
  const amount = body.amount;

  // 2. validate — amount must be greater than 0
  if (!title) return err("Reward title is required", 400);
  if (!description) return err("Reward description is required", 400);
  if (!WALLETS.includes(wallet)) return err("Unknown reward wallet", 400);
  if (!TYPES.includes(type)) return err("Unknown reward type", 400);
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    return err("Amount must be greater than 0", 400);
  }

  // 3. transaction: reward row + wallet credit (+ lock for non-withdrawable)
  const now = new Date();
  const reward: Reward = {
    id: `RWD-${now.getTime().toString(36).toUpperCase()}`,
    title,
    description,
    amount,
    wallet,
    type,
    sentAt: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    sentBy: session.id,
    status: "credited",
  };

  const target = stored.wallets[wallet];
  const from = target.balance;
  const to = from + amount;

  stored.rewards = [reward, ...stored.rewards];
  stored.wallets = {
    ...stored.wallets,
    [wallet]: {
      ...target,
      balance: to,
      // Non-withdrawable rewards can be invested, but the principal stays
      // locked (withdrawals may only use balance - lockedBalance).
      lockedBalance:
        type === "non_withdrawable" ? target.lockedBalance + amount : target.lockedBalance,
    },
  };

  // audit trail: who credited it, and from which value to which value
  logBalanceChange({ adminId: session.id, userId: id, wallet, from, to });

  return Response.json({ reward });
}
