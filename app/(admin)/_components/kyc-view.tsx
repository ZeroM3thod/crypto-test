// app/(admin)/_components/kyc-view.tsx
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

export function KycView({ initial }: { initial: any[] }) {
  const { toast, showToast } = useToast();
  const [kycData, setKycData] = useState(initial);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);

  const active = useMemo(
    () => kycData.find((k: any) => k.id === activeId) ?? null,
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
      pending: kycData.filter((k: any) => k.status === "pending").length,
      approved: kycData.filter((k: any) => k.status === "approved").length,
      rejected: kycData.filter((k: any) => k.status === "rejected").length,
    }),
    [kycData],
  );

  /* ---------- filtering ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return kycData.filter(
      (k: any) =>
        (!q ||
          `${k.first_name} ${k.last_name}`.toLowerCase().includes(q) ||
          k.user?.email.toLowerCase().includes(q) ||
          k.submission_id.toLowerCase().includes(q) ||
          k.user?.user_id.toLowerCase().includes(q)) &&
        (statusFilter === "all" || k.status === statusFilter),
    );
  }, [kycData, query, statusFilter]);

  /* ---------- actions ---------- */

  const approveKyc = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Approval failed");
      
      // Reload data
      const listRes = await fetch("/api/admin/kyc");
      const { submissions } = await listRes.json();
      setKycData(submissions);
      
      showToast("✓ KYC has been approved.");
      closeModal();
    } catch (error) {
      showToast("Failed to approve KYC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReject = async (id: string) => {
    if (!rejectReason.trim()) {
      showToast("Please write a rejection reason.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error("Rejection failed");
      
      // Reload data
      const listRes = await fetch("/api/admin/kyc");
      const { submissions } = await listRes.json();
      setKycData(submissions);
      
      showToast("✕ KYC has been rejected.");
      setShowRejectBox(false);
      setRejectReason("");
      closeModal();
    } catch (error) {
      showToast("Failed to reject KYC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reopenKyc = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/kyc/${id}/reopen`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Reopen failed");
      
      // Reload data
      const listRes = await fetch("/api/admin/kyc");
      const { submissions } = await listRes.json();
      setKycData(submissions);
      
      showToast("↺ KYC re-opened for review.");
      closeModal();
    } catch (error) {
      showToast("Failed to reopen KYC. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    downloadCSV(`kyc-applications-${Date.now()}.csv`, [
      ["ID", "Full Name", "User ID", "Email", "Country", "ID Type", "Submitted", "Status"],
      ...filtered.map((k: any) => [
        k.submission_id,
        `${k.first_name} ${k.last_name}`,
        k.user?.user_id || "",
        k.user?.email || "",
        k.country_name,
        k.document_type,
        formatDate(k.created_at),
        k.status,
      ]),
    ]);
    showToast("CSV exported successfully.");
  };

  /* ---------- table ---------- */

  const columns = useMemo<TableColumn<any>[]>(
    () => [
      {
        key: "fullName",
        header: "User",
        sortable: true,
        width: "1.3fr",
        cell: (k: any) => (
          <div className="flex items-center gap-2.5">
            <Avatar text={initials(`${k.first_name} ${k.last_name}`)} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{k.first_name} {k.last_name}</p>
              <p className="truncate text-xs text-muted-foreground">{k.user?.user_id || "N/A"}</p>
            </div>
          </div>
        ),
      },
      {
        key: "submission_id",
        header: "ID",
        width: "130px",
        cell: (k: any) => (
          <span className="text-xs text-muted-foreground">{k.submission_id}</span>
        ),
      },
      {
        key: "email",
        header: "Email",
        width: "1.4fr",
        cell: (k: any) => (
          <span className="block truncate text-xs text-muted-foreground">
            {k.user?.email || "N/A"}
          </span>
        ),
      },
      { 
        key: "document_type", 
        header: "ID type", 
        sortable: true, 
        width: "130px",
        cell: (k: any) => (
          <span className="text-xs capitalize">{k.document_type.replace("_", " ")}</span>
        ),
      },
      {
        key: "created_at",
        header: "Submitted",
        sortable: true,
        width: "120px",
        cell: (k: any) => (
          <span className="text-xs text-muted-foreground">
            {formatDate(k.created_at)}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        cell: (k: any) => <KycBadge status={k.status} />,
      },
      {
        key: "actions" as never,
        header: "Action",
        align: "right",
        width: "100px",
        cell: (k: any) => (
          <Button size="sm" variant="ghost" onClick={() => setActiveId(k.id)}>
            View →
          </Button>
        ),
      },
    ],
    [],
  );

  const processed = active?.history?.find((h: any) => h.performed_by);

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
                  {active.first_name} {active.last_name}
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {active.submission_id} · {active.user?.user_id || "N/A"}
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
                  <Field label="User ID" value={active.user?.user_id || "N/A"} />
                  <Field label="Email address" value={active.user?.email || "N/A"} />
                  <Field label="Phone number" value={active.user?.phone || "N/A"} />
                  <Field label="Full name" value={`${active.first_name} ${active.last_name}`} />
                </div>
              </Section>

              <Section title="KYC details">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Field label="Full name (on ID)" value={`${active.first_name} ${active.last_name}`} />
                  <Field label="Date of birth" value={formatDate(active.dob)} />
                  <Field label="ID type" value={active.document_type.replace("_", " ")} />
                  <Field label="ID document number" value={active.document_number} mono />
                  <Field label="Address line 1" value={active.address_line_1} />
                  <Field label="Address line 2" value={active.address_line_2 || "—"} />
                  <Field label="City" value={active.city} />
                  <Field label="State / province" value={active.state || "—"} />
                  <Field label="Zip / postal code" value={active.postal_code} mono />
                  <Field label="Country" value={active.country_name} />
                  <Field label="Submission date" value={formatDate(active.created_at)} />
                  <Field label="Application ID" value={active.submission_id} mono />
                </div>
              </Section>

              <Section title="Uploaded documents">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { url: active.front_image_url, label: "ID Card — Front", Icon: CreditCard },
                    { url: active.back_image_url, label: "ID Card — Back", Icon: CreditCard },
                    { url: active.selfie_image_url, label: "Selfie Photo", Icon: User },
                  ].map((img) => (
                    <div key={img.label}>
                      <button
                        type="button"
                        onClick={() => img.url && window.open(img.url, "_blank")}
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

              {processed ? (
                <Section title="Processed by">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted py-1 pl-1 pr-3 text-sm text-foreground">
                      <Avatar text={initials(`${processed.performer?.first_name || ""} ${processed.performer?.last_name || ""}`)} dark />
                      {processed.performer?.first_name} {processed.performer?.last_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      · {formatDate(processed.created_at)}
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
                      <Button size="md" variant="primary" onClick={() => approveKyc(active.id)} disabled={loading}>
                        ✓ Approve
                      </Button>
                      <Button size="md" variant="outline" onClick={() => setShowRejectBox((v) => !v)} disabled={loading}>
                        ✕ Reject
                      </Button>
                    </>
                  ) : (
                    <Button size="md" variant="outline" onClick={() => reopenKyc(active.id)} disabled={loading}>
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
                      <Button size="md" variant="primary" onClick={() => confirmReject(active.id)} disabled={loading}>
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
                  {[...(active.history || [])].reverse().map((h: any, i: number) => (
                    <div
                      key={i}
                      className="flex gap-3 border-b border-border p-3 last:border-b-0"
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${LOG_DOT[h.action as keyof typeof LOG_DOT] || "bg-muted-foreground"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">
                          <strong className="font-semibold capitalize">{h.action}</strong>
                          {h.performer ? (
                            <span className="text-muted-foreground">
                              {" "}
                              — {h.performer.first_name} {h.performer.last_name}
                            </span>
                          ) : null}
                        </p>
                        {h.reason ? (
                          <p className="mt-0.5 text-xs italic text-muted-foreground">
                            "{h.reason}"
                          </p>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(h.created_at)}
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
