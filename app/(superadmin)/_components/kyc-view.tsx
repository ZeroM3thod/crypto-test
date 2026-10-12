// app/(superadmin)/_components/kyc-view.tsx
"use client";

import {
  CheckCircle2,
  CreditCard,
  Download,
  Hourglass,
  ShieldCheck,
  User,
  UserPlus,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button";
import { Table, type TableColumn } from "@/components/motion/table";
import {
  MODERATOR,
  type HistoryEntry,
  type KycItem,
  type KycStatus,
} from "@/lib/admin-kyc-data";
import { Avatar, Dialog, Field, Section } from "./detail-ui";
import { PageHeader, SearchInput, StatCard } from "./finance-ui";
import { downloadCSV, initials, Toast, useToast } from "./review-ui";

/* ---------- helpers ---------- */

const formatDate = (s: string) =>
  s
    ? new Date(s).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "—";

const nowStr = () =>
  new Date()
    .toLocaleString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", "");

const TONE = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
} as const;

function KycBadge({
  status,
  label,
}: {
  status: KycStatus;
  label?: string;
}) {
  return (
    <AnimatedBadge status={TONE[status]} size="sm">
      <span className="capitalize">{label ?? status}</span>
    </AnimatedBadge>
  );
}

const LOG_DOT: Record<HistoryEntry["type"], string> = {
  submitted: "bg-muted-foreground",
  approved: "bg-(--color-success)",
  rejected: "bg-foreground",
  reopened: "bg-muted-foreground/50",
};

const SELECT_CLS =
  "h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

/* ---------- main view ---------- */

export function KycView({ initial }: { initial: KycItem[] }) {
  const { toast, showToast } = useToast();
  const [kycData, setKycData] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const active = useMemo(
    () => kycData.find((k) => k.id === activeId) ?? null,
    [kycData, activeId],
  );

  const closeModal = useCallback(() => {
    setActiveId(null);
    setShowRejectBox(false);
    setRejectReason("");
  }, []);

  /* ---------- stats ---------- */

  const stats = useMemo(
    () => ({
      total: kycData.length,
      pending: kycData.filter((k) => k.status === "pending").length,
      approved: kycData.filter((k) => k.status === "approved").length,
      rejected: kycData.filter((k) => k.status === "rejected").length,
    }),
    [kycData],
  );

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kycData.filter(
      (k) =>
        (!q ||
          k.fullName.toLowerCase().includes(q) ||
          k.username.toLowerCase().includes(q) ||
          k.email.toLowerCase().includes(q) ||
          k.id.toLowerCase().includes(q)) &&
        (statusFilter === "all" || k.status === statusFilter),
    );
  }, [kycData, query, statusFilter]);

  /* ---------- actions (local state only — no DB) ---------- */

  const update = (
    id: string,
    status: KycStatus,
    entry: Omit<HistoryEntry, "date" | "by">,
  ) =>
    setKycData((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              status,
              history: [
                ...k.history,
                { ...entry, date: nowStr(), by: MODERATOR },
              ],
            }
          : k,
      ),
    );

  const approveKyc = (id: string) => {
    // TODO: call your API here (approve KYC)
    update(id, "approved", {
      type: "approved",
      text: "KYC approved by moderator",
      reason: null,
    });
    showToast("✓ KYC has been approved.");
  };

  const confirmReject = (id: string) => {
    if (!rejectReason.trim()) {
      showToast("Please write a rejection reason.");
      return;
    }
    // TODO: call your API here (reject KYC + save reason)
    update(id, "rejected", {
      type: "rejected",
      text: "KYC rejected by moderator",
      reason: rejectReason.trim(),
    });
    showToast("✕ KYC has been rejected.");
    setShowRejectBox(false);
    setRejectReason("");
  };

  const reopenKyc = (id: string) => {
    // TODO: call your API here (re-open KYC)
    update(id, "pending", {
      type: "reopened",
      text: "Application re-opened for review",
      reason: null,
    });
    showToast("↺ KYC re-opened for review.");
  };

  const exportCSV = () => {
    downloadCSV(`kyc-applications-${Date.now()}.csv`, [
      ["ID", "Full Name", "Username", "Email", "Country", "ID Type", "Submitted", "Status"],
      ...filtered.map((k) => [
        k.id, k.fullName, k.username, k.email, k.country, k.idType, k.submittedDate, k.status,
      ]),
    ]);
    showToast("CSV exported successfully.");
  };

  /* ---------- table ---------- */

  const columns = useMemo<TableColumn<KycItem>[]>(
    () => [
      {
        key: "fullName",
        header: "User",
        sortable: true,
        width: "1.3fr",
        cell: (k) => (
          <div className="flex items-center gap-2.5">
            <Avatar text={initials(k.fullName)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{k.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{k.uid}</p>
            </div>
          </div>
        ),
      },
      {
        key: "username",
        header: "Username",
        width: "130px",
        cell: (k) => (
          <span className="text-xs text-muted-foreground">{k.username}</span>
        ),
      },
      {
        key: "email",
        header: "Email",
        width: "1.4fr",
        cell: (k) => (
          <span className="block truncate text-xs text-muted-foreground">
            {k.email}
          </span>
        ),
      },
      { key: "idType", header: "ID type", sortable: true, width: "130px" },
      {
        key: "submittedDate",
        header: "Submitted",
        sortable: true,
        width: "120px",
        cell: (k) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(k.submittedDate)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (k) => <KycBadge status={k.status} />,
      },
      {
        key: "actions" as never,
        header: "Action",
        align: "right",
        width: "100px",
        cell: (k) => (
          <Button size="sm" variant="ghost" onClick={() => setActiveId(k.id)}>
            View →
          </Button>
        ),
      },
    ],
    [],
  );

  const processed = active?.history.find((h) => h.by);

  return (
    <>
      <Toast toast={toast} />

      {/* ---------- KYC detail modal ---------- */}
      <Dialog open={!!active} onClose={closeModal}>
        {active ? (
          <>
            <div className="flex items-start justify-between gap-3 border-b border-border p-5">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold text-foreground">
                  {active.fullName}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {active.id} · {active.uid}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <KycBadge status={active.status} />
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto p-5">
              <Section title="User basic information">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Full name" value={active.fullName} />
                  <Field label="Email address" value={active.email} />
                  <Field label="Username" value={active.username} />
                  <Field label="Phone number" value={active.phone} />
                </div>
              </Section>

              <Section title="KYC details">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Full name (on ID)" value={active.fullName} />
                  <Field label="Date of birth" value={formatDate(active.dob)} />
                  <Field label="ID type" value={active.idType} />
                  <Field label="ID document number" value={active.idNumber} mono />
                  <Field label="Address line 1" value={active.address1} />
                  <Field label="Address line 2" value={active.address2} />
                  <Field label="City" value={active.city} />
                  <Field label="State / province" value={active.state} />
                  <Field label="Zip / postal code" value={active.zip} mono />
                  <Field label="Country" value={active.country} />
                  <Field label="Submission date" value={formatDate(active.submittedDate)} />
                  <Field label="Application ID" value={active.id} mono />
                </div>
              </Section>

              <Section title="Uploaded documents">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { url: active.idFrontUrl, label: "ID Card — Front", Icon: CreditCard },
                    { url: active.idBackUrl, label: "ID Card — Back", Icon: CreditCard },
                    { url: active.selfieUrl, label: "Selfie Photo", Icon: User },
                  ].map((img) => (
                    <div key={img.label}>
                      <button
                        type="button"
                        onClick={() => showToast(`Opening ${img.label} view…`)}
                        className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 transition-colors hover:bg-muted"
                      >
                        {img.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img.url}
                            alt={img.label}
                            className="size-full object-cover"
                          />
                        ) : (
                          <span className="flex flex-col items-center gap-2 text-muted-foreground">
                            <img.Icon className="size-6" aria-hidden="true" />
                            <span className="text-xs">{img.label}</span>
                          </span>
                        )}
                      </button>
                      <p className="mt-1.5 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                        {img.label}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>

              {processed?.by ? (
                <Section title="Processed by">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted py-1 pl-1 pr-3 text-sm text-foreground">
                      <Avatar text={processed.by.initials} dark />
                      {processed.by.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {processed.date}
                    </span>
                    <KycBadge
                      status={active.status === "rejected" ? "rejected" : "approved"}
                      label={active.status === "rejected" ? "Rejected" : "Approved"}
                    />
                  </div>
                </Section>
              ) : null}

              <Section
                title={active.status === "pending" ? "Take action" : "Re-review"}
              >
                <div className="flex flex-wrap gap-2">
                  {active.status === "pending" ? (
                    <>
                      <Button size="md" variant="primary" onClick={() => approveKyc(active.id)}>
                        ✓ Approve
                      </Button>
                      <Button size="md" variant="outline" onClick={() => setShowRejectBox((v) => !v)}>
                        ✕ Reject
                      </Button>
                    </>
                  ) : (
                    <Button size="md" variant="outline" onClick={() => reopenKyc(active.id)}>
                      ↺ Re-open for Review
                    </Button>
                  )}
                </div>

                {showRejectBox ? (
                  <div className="rounded-xl border border-border bg-muted p-4">
                    <p className="mb-2 text-xs font-medium text-foreground">
                      Write rejection reason:
                    </p>
                    <textarea
                      autoFocus
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this KYC is being rejected…"
                      className="min-h-24 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <div className="mt-3 flex gap-2">
                      <Button size="md" variant="primary" onClick={() => confirmReject(active.id)}>
                        Confirm Rejection
                      </Button>
                      <Button size="md" variant="ghost" onClick={() => setShowRejectBox(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Section>

              <Section title="Activity log">
                <div className="flex flex-col rounded-xl border border-border">
                  {[...active.history].reverse().map((h, i) => (
                    <div
                      key={i}
                      className="flex gap-3 border-b border-border p-3 last:border-b-0"
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${LOG_DOT[h.type]}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <strong className="font-semibold">{h.text}</strong>
                          {h.by ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {h.by.name}
                            </span>
                          ) : null}
                        </p>
                        {h.reason ? (
                          <p className="mt-0.5 text-xs italic text-muted-foreground">
                            “{h.reason}”
                          </p>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground">
                          {h.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>
          </>
        ) : null}
      </Dialog>

      {/* ---------- page ---------- */}
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div>
          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Compliance · Verification
          </span>
          <PageHeader
            title="KYC Management"
            description="Review, approve, and manage user identity verification submissions."
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total submissions" value={stats.total} icon={UserPlus} />
          <StatCard label="Pending review" value={stats.pending} icon={Hourglass} />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} positive />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} />
        </div>

        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                KYC applications
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {kycData.length} applications
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search name, email, ID…"
              />
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={SELECT_CLS}
              >
                <option value="all">All status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Button size="md" variant="outline" onClick={exportCSV}>
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={filtered}
              columns={columns}
              getRowId={(k) => k.id}
              height={520}
              rowHeight={60}
              className="rounded-xl"
              emptyState={
                <div className="flex flex-col items-center gap-2 text-center">
                  <ShieldCheck className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No KYC applications match your search or filter.
                  </p>
                </div>
              }
            />
          </div>
        </section>
      </div>
    </>
  );
}
