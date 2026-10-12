"use client";

import { UserShell } from "@/app/(user)/_components/user-shell";
import { Pin, Search, Bell, ChevronDown, Megaphone, Wrench, Sparkles, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import type { Announcement, AnnouncementCategory } from "@/lib/admin-announcement-data";

function Badge({ label }: { label: string }) {
  return <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>;
}

function SectionHeader({ title }: { title: string }) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-foreground">{title}</h2></div>;
}

const CATEGORIES: ("All" | AnnouncementCategory)[] = ["All", "Platform Update", "Maintenance", "New Feature", "Important"];
const CATEGORY_ICON: Record<AnnouncementCategory, React.ReactNode> = {
  "Platform Update": <Megaphone className="size-3.5" />,
  Maintenance: <Wrench className="size-3.5" />,
  "New Feature": <Sparkles className="size-3.5" />,
  Important: <AlertTriangle className="size-3.5" />,
};

function AnnouncementCard({ item, onRead }: { item: Announcement & { read?: boolean }; onRead: (id: string) => void }) {
  const [expanded, setExpanded] = useState(item.pinned);
  function toggle() {
    setExpanded((p) => !p);
    if (!item.read) onRead(item.id);
    fetch(`/api/announcements/${item.id}/view`, { method: "POST" }).catch(() => {});
  }
  return (
    <div className={`overflow-hidden rounded-4xl border bg-card transition-colors ${item.read ? "border-border" : "border-foreground/20"}`}>
      <button type="button" onClick={toggle} className="flex w-full items-start gap-4 p-6 text-left transition-colors hover:bg-muted/30 outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">{CATEGORY_ICON[item.category]}</div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {item.pinned ? <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground"><Pin className="size-2.5" /> Pinned</span> : null}
            <Badge label={item.category} />
            {!item.read ? <span className="inline-block size-1.5 rounded-full bg-foreground" aria-label="Unread" /> : null}
          </div>
          <p className={`text-sm leading-snug ${item.read ? "font-medium" : "font-semibold"} text-foreground`}>{item.title}</p>
          <p className="text-[11px] text-muted-foreground">{new Date(item.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <ChevronDown className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded ? <div className="px-6 pb-6 pt-0"><div className="ml-[52px] rounded-2xl bg-muted/40 px-4 py-3"><p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{item.content}</p></div></div> : null}
    </div>
  );
}

export function AnnouncementsClient({ initial }: { initial: Announcement[] }) {
  const [items, setItems] = useState<(Announcement & { read?: boolean })[]>(initial.map((a) => ({ ...a, read: false })));
  const [category, setCategory] = useState<"All" | AnnouncementCategory>("All");
  const [search, setSearch] = useState("");
  function markRead(id: string) {
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  }
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((a) => (category === "All" || a.category === category) && (!q || a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q)));
  }, [items, category, search]);
  const pinned = filtered.filter((a) => a.pinned);
  const unpinned = filtered.filter((a) => !a.pinned);
  const unreadCount = items.filter((a) => !a.read).length;
  return (
    <UserShell active="Community">
      <div className="space-y-8 overflow-y-auto px-5 py-6 sm:px-7 sm:py-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-medium text-muted-foreground">Community</p><h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Announcements</h1></div>
          {unreadCount > 0 ? <div className="flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1.5"><Bell className="size-3.5 text-muted-foreground" /><span className="text-xs font-semibold text-foreground">{unreadCount} unread</span></div> : null}
        </div>
        <section aria-label="Filters"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5"><Search className="size-4 shrink-0 text-muted-foreground" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..." className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" /></div><div className="flex shrink-0 flex-wrap items-center gap-1 rounded-xl bg-muted p-1">{CATEGORIES.map((c) => <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === c ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{c}</button>)}</div></div></section>
        {pinned.length > 0 ? <section aria-label="Pinned Announcements"><SectionHeader title="Pinned" /><div className="space-y-3">{pinned.map((a) => <AnnouncementCard key={a.id} item={a} onRead={markRead} />)}</div></section> : null}
        <section aria-label="All Announcements"><SectionHeader title={category === "All" ? "All Announcements" : category} />{unpinned.length === 0 && pinned.length === 0 ? <div className="flex flex-col items-center gap-3 py-12 text-center"><div className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground"><Megaphone className="size-5" /></div><p className="text-sm text-muted-foreground">No announcements found.</p></div> : <div className="space-y-3">{unpinned.map((a) => <AnnouncementCard key={a.id} item={a} onRead={markRead} />)}</div>}</section>
        <div className="h-20" />
      </div>
    </UserShell>
  );
}
