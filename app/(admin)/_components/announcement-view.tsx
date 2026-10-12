// app/(admin)/_components/announcement-view.tsx
"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Megaphone,
  Pin,
  Plus,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { AnimatedBadge } from "@/components/motion/animated-badge";
import { Button } from "@/components/motion/button";
import { Table, type TableColumn } from "@/components/motion/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/motion/tabs";
import {
  ANNOUNCEMENT_CATEGORIES,
  type Announcement,
  type AnnouncementCategory,
  type AnnouncementStatus,
} from "@/lib/admin-announcement-data";
import { Dialog, Section } from "./detail-ui";
import { PageHeader, SearchInput, StatCard } from "./finance-ui";
import { Toast, useToast } from "./review-ui";

/* ---------- helpers ---------- */

const CATEGORY_ICON: Record<AnnouncementCategory, React.ReactNode> = {
  "Platform Update": <Megaphone className="size-3.5" />,
  Maintenance: <Wrench className="size-3.5" />,
  "New Feature": <Sparkles className="size-3.5" />,
  Important: <AlertTriangle className="size-3.5" />,
};

const formatDate = (s: string) =>
  s
    ? new Date(s).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })
    : "—";

const FIELD_CLS =
  "w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

type Draft = {
  title: string;
  category: AnnouncementCategory;
  date: string;
  content: string;
  pinned: boolean;
  status: AnnouncementStatus;
};

const emptyDraft = (): Draft => ({
  title: "",
  category: "Platform Update",
  date: new Date().toISOString().slice(0, 10),
  content: "",
  pinned: false,
  status: "published",
});

type Filter = "All" | AnnouncementCategory;

/* ---------- preview (looks like the user-facing card) ---------- */

function PreviewCard({ draft }: { draft: Draft }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
          {CATEGORY_ICON[draft.category]}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {draft.pinned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                <Pin className="size-2.5" /> Pinned
              </span>
            ) : null}
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {draft.category}
            </span>
            <span className="inline-block size-1.5 rounded-full bg-foreground" />
          </div>
          <p className="text-sm font-semibold leading-snug text-foreground">
            {draft.title || "Announcement title"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {formatDate(draft.date)}
          </p>
        </div>
      </div>
      <div className="ml-12 mt-3 rounded-2xl bg-muted/40 px-4 py-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {draft.content || "Your announcement content will appear here."}
        </p>
      </div>
    </div>
  );
}

/* ---------- main view ---------- */

export function AnnouncementView({ initial }: { initial: Announcement[] }) {
  const { toast, showToast } = useToast();
  const [items, setItems] = useState(initial);
  const [category, setCategory] = useState<Filter>("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [busy, setBusy] = useState(false);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingId(null);
  }, []);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((a: Announcement) => {
    setEditingId(a.id);
    setDraft({
      title: a.title,
      category: a.category,
      date: a.date,
      content: a.content,
      pinned: a.pinned,
      status: a.status,
    });
    setFormOpen(true);
  }, []);

  async function api<T>(url: string, method: "POST" | "PUT" | "PATCH" | "DELETE", body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error || "Request failed");
    return data as T;
  }

  const save = async () => {
    if (draft.title.trim().length < 3) {
      showToast("Please enter a title (at least 3 characters).");
      return;
    }
    if (draft.content.trim().length < 10) {
      showToast("Please write the announcement content (at least 10 characters).");
      return;
    }
    if (!draft.date) {
      showToast("Please choose a date.");
      return;
    }
    const clean = {
      ...draft,
      title: draft.title.trim(),
      content: draft.content.trim(),
    };

    setBusy(true);
    try {
      if (editingId) {
        const data = await api<{ announcement: Announcement }>(`/api/admin/announcements/${editingId}`, "PUT", clean);
        setItems((prev) => prev.map((a) => (a.id === editingId ? data.announcement : a)));
        showToast("✓ Announcement updated.");
      } else {
        const data = await api<{ announcement: Announcement }>("/api/admin/announcements", "POST", clean);
        setItems((prev) => [data.announcement, ...prev]);
        showToast(clean.status === "published" ? "✓ Announcement published." : "✓ Saved as draft.");
      }
      closeForm();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  };

  const togglePin = useCallback(
    async (a: Announcement) => {
      try {
        const data = await api<{ announcement: Announcement }>(`/api/admin/announcements/${a.id}`, "PATCH", { pinned: !a.pinned });
        setItems((prev) => prev.map((x) => (x.id === a.id ? data.announcement : x)));
        showToast(a.pinned ? "Announcement unpinned." : "Announcement pinned.");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Request failed.");
      }
    },
    [showToast],
  );

  const toggleStatus = useCallback(
    async (a: Announcement) => {
      const next: AnnouncementStatus =
        a.status === "published" ? "draft" : "published";
      try {
        const data = await api<{ announcement: Announcement }>(`/api/admin/announcements/${a.id}`, "PATCH", { status: next });
        setItems((prev) => prev.map((x) => (x.id === a.id ? data.announcement : x)));
        showToast(next === "published" ? "✓ Announcement published." : "Announcement moved to drafts.");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Request failed.");
      }
    },
    [showToast],
  );

  const remove = useCallback(
    async (a: Announcement) => {
      if (!window.confirm(`Delete "${a.title}"? This cannot be undone.`)) return;
      try {
        await api(`/api/admin/announcements/${a.id}`, "DELETE");
        setItems((prev) => prev.filter((x) => x.id !== a.id));
        showToast("Announcement deleted.");
      } catch (error) {
        showToast(error instanceof Error ? error.message : "Request failed.");
      }
    },
    [showToast],
  );

  /* ---------- stats ---------- */

  const stats = useMemo(
    () => ({
      total: items.length,
      published: items.filter((a) => a.status === "published").length,
      drafts: items.filter((a) => a.status === "draft").length,
      pinned: items.filter((a) => a.pinned).length,
    }),
    [items],
  );

  /* ---------- filtering (pinned first, then newest — same as user page) ---------- */

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter(
        (a) =>
          (category === "All" || a.category === category) &&
          (statusFilter === "all" || a.status === statusFilter) &&
          (!q ||
            a.title.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) || b.date.localeCompare(a.date),
      );
  }, [items, category, statusFilter, query]);

  /* ---------- table ---------- */

  const columns = useMemo<TableColumn<Announcement>[]>(
    () => [
      {
        key: "title",
        header: "Title",
        sortable: true,
        width: "2fr",
        cell: (a) => (
          <div className="flex min-w-0 items-center gap-2">
            {a.pinned ? (
              <Pin
                aria-label="Pinned"
                className="size-3.5 shrink-0 text-foreground"
              />
            ) : null}
            <span className="truncate text-sm font-medium" title={a.title}>
              {a.title}
            </span>
          </div>
        ),
      },
      {
        key: "category",
        header: "Category",
        sortable: true,
        width: "160px",
        cell: (a) => (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {CATEGORY_ICON[a.category]}
            {a.category}
          </span>
        ),
      },
      {
        key: "date",
        header: "Date",
        sortable: true,
        width: "120px",
        cell: (a) => (
          <span className="text-xs text-muted-foreground">
            {new Date(a.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: "110px",
        cell: (a) => (
          <AnimatedBadge
            status={a.status === "published" ? "success" : "warning"}
            size="sm"
          >
            <span className="capitalize">{a.status}</span>
          </AnimatedBadge>
        ),
      },
      {
        key: "views",
        header: "Views",
        sortable: true,
        align: "right",
        width: "90px",
        cell: (a) => (
          <span className="tabular-nums">{a.views.toLocaleString()}</span>
        ),
      },
      {
        key: "actions" as never,
        header: "Action",
        align: "right",
        width: "330px",
        cell: (a) => (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="primary" onClick={() => openEdit(a)}>
              Edit
            </Button>
            <Button size="sm" variant="outline" onClick={() => togglePin(a)}>
              {a.pinned ? "Unpin" : "Pin"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => toggleStatus(a)}>
              {a.status === "published" ? "Unpublish" : "Publish"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => remove(a)}>
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [openEdit, togglePin, toggleStatus, remove],
  );

  return (
    <>
      <Toast toast={toast} />

      {/* ---------- create / edit dialog ---------- */}
      <Dialog open={formOpen} onClose={closeForm}>
        <div className="flex items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Edit announcement" : "New announcement"}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Published announcements appear on the user Community page.
            </p>
          </div>
          <button
            type="button"
            onClick={closeForm}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex flex-col gap-5 overflow-y-auto p-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Title *
            </span>
            <input
              autoFocus
              type="text"
              value={draft.title}
              maxLength={120}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. 🚨 Scheduled Maintenance — July 22, 2025"
              className={`${FIELD_CLS} h-10`}
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </span>
              <select
                value={draft.category}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    category: e.target.value as AnnouncementCategory,
                  })
                }
                className={`${FIELD_CLS} h-10`}
              >
                {ANNOUNCEMENT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </span>
              <input
                type="date"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                className={`${FIELD_CLS} h-10`}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </span>
              <select
                value={draft.status}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    status: e.target.value as AnnouncementStatus,
                  })
                }
                className={`${FIELD_CLS} h-10`}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Content *
              <span className="font-normal normal-case tracking-normal">
                {draft.content.length}/1000
              </span>
            </span>
            <textarea
              value={draft.content}
              maxLength={1000}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="Write the full announcement…"
              className={`${FIELD_CLS} min-h-32 resize-y py-2.5`}
            />
          </label>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground">
            <input
              type="checkbox"
              checked={draft.pinned}
              onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
              className="size-4 accent-foreground"
            />
            Pin to the top of the announcements page
          </label>

          <Section title="Live preview (as users see it)">
            <PreviewCard draft={draft} />
          </Section>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <Button size="md" variant="ghost" onClick={closeForm} disabled={busy}>
            Cancel
          </Button>
          <Button size="md" variant="primary" onClick={save} disabled={busy}>
            {editingId ? "Save changes" : "Create announcement"}
          </Button>
        </div>
      </Dialog>

      {/* ---------- page ---------- */}
      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Community · Content
            </span>
            <PageHeader
              title="Announcement Management"
              description="Create, edit, pin and publish announcements shown to all users."
            />
          </div>
          <Button size="md" variant="primary" onClick={openCreate}>
            <Plus className="size-4" />
            New announcement
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total announcements" value={stats.total} icon={Megaphone} />
          <StatCard label="Published" value={stats.published} icon={CheckCircle2} positive />
          <StatCard label="Drafts" value={stats.drafts} icon={FileText} />
          <StatCard label="Pinned" value={stats.pinned} icon={Pin} />
        </div>

        <section className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                All announcements
              </h2>
              <p className="text-xs text-muted-foreground">
                Showing {filtered.length} of {items.length} announcements
              </p>
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <Tabs
                value={category}
                onValueChange={(v) => setCategory(v as Filter)}
                variant="segment"
              >
                <TabsList>
                  <TabsTrigger value="All">All</TabsTrigger>
                  {ANNOUNCEMENT_CATEGORIES.map((c) => (
                    <TabsTrigger key={c} value={c}>
                      {c}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${FIELD_CLS} h-10 w-auto`}
              >
                <option value="all">All status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search announcements…"
              />
            </div>
          </div>

          <div className="mt-4">
            <Table
              data={filtered}
              columns={columns}
              getRowId={(a) => a.id}
              height={520}
              rowHeight={60}
              className="rounded-xl"
              emptyState={
                <div className="flex flex-col items-center gap-2 text-center">
                  <Megaphone className="size-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No announcements found.
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
