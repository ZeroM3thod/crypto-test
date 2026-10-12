// app/(admin)/_components/daily-profit-view.tsx
"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Eye,
  Power, RotateCcw, SkipForward, X, Zap,
} from "lucide-react";

type Status =
  | "Not set" | "Draft" | "Scheduled" | "Processing" | "Credited"
  | "Partially Failed" | "Skipped" | "Reversed" | "Failed";

type Row = {
  id: string; name: string; exchange: string; stake: number; investors: number;
  excluded: number; excludedWhy: string; avg7: number; rate: string; note: string;
  status: Status; batchId?: string;
};
type Batch = {
  id: string; date: string; strategy: string; rate: number; total: number;
  users: number; status: Status; by: string; source: string;
};
type Settings = { maxPct: number; deviation: number; largePayout: number; skipWeekends: boolean; notify: boolean };

const SEED: Row[] = [
  { id: "s1", name: "Alpha Momentum", exchange: "Binance", stake: 1250000, investors: 842, excluded: 31500, excludedWhy: "12 pending withdrawals, 4 started today", avg7: 0.82, rate: "", note: "", status: "Not set" },
  { id: "s2", name: "Delta Neutral", exchange: "OKX", stake: 980500, investors: 610, excluded: 8200, excludedWhy: "3 frozen", avg7: 0.55, rate: "0.6", note: "", status: "Draft" },
  { id: "s3", name: "Grid Master", exchange: "Bybit", stake: 430250, investors: 297, excluded: 0, excludedWhy: "None", avg7: 0.71, rate: "0.7", note: "", status: "Credited", batchId: "B-1042" },
  { id: "s4", name: "Arbitrage Pro", exchange: "Binance", stake: 2210000, investors: 1503, excluded: 54000, excludedWhy: "21 pending withdrawals, 2 cancelled", avg7: 0.48, rate: "", note: "", status: "Not set" },
];
const SEED_BATCHES: Batch[] = [
  { id: "B-1042", date: "2026-10-04", strategy: "Grid Master", rate: 0.7, total: 3011.75, users: 297, status: "Credited", by: "admin", source: "manual" },
  { id: "B-1041", date: "2026-10-03", strategy: "Alpha Momentum", rate: 0.84, total: 10500, users: 840, status: "Credited", by: "admin", source: "schedule" },
  { id: "B-1040", date: "2026-10-03", strategy: "Delta Neutral", rate: 0.52, total: 5098.6, users: 608, status: "Reversed", by: "admin", source: "manual" },
];

const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const floor2 = (n: number) => Math.floor(n * 100) / 100;
const payoutOf = (r: Row) => floor2(r.stake * ((parseFloat(r.rate) || 0) / 100));

const badge: Record<Status, string> = {
  "Not set": "bg-muted text-muted-foreground",
  Draft: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  Scheduled: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Processing: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Credited: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  "Partially Failed": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  Skipped: "bg-muted text-muted-foreground",
  Reversed: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  Failed: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function Badge({ s }: { s: Status }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${badge[s]}`}>{s}</span>;
}

function Modal({ title, onClose, children, side }: { title: string; onClose: () => void; children: ReactNode; side?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className={`fixed inset-0 z-50 flex bg-black/50 ${side ? "justify-end" : "items-center justify-center p-4"}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`flex flex-col bg-background shadow-xl ${side ? "h-full w-full max-w-md border-l border-border" : "max-h-[90vh] w-full max-w-2xl rounded-xl border border-border"}`}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const btn = "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btn} bg-foreground text-background hover:opacity-90`;
const btnGhost = `${btn} border border-border hover:bg-muted`;

export function DailyProfitView() {
  const [tab, setTab] = useState<"Board" | "Batches" | "Settings">("Board");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<Row[]>(SEED);
  const [batches, setBatches] = useState<Batch[]>(SEED_BATCHES);
  const [settings, setSettings] = useState<Settings>({ maxPct: 2, deviation: 50, largePayout: 25000, skipWeekends: false, notify: true });
  const [kill, setKill] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [drawer, setDrawer] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewed, setPreviewed] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [bulkRate, setBulkRate] = useState("");
  const inFlight = useRef<Set<string>>(new Set()); // idempotency guard against double-click

  const isBackfill = date < new Date().toISOString().slice(0, 10);
  const patch = (id: string, p: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const stats = useMemo(() => {
    const credited = rows.filter((r) => r.status === "Credited");
    return {
      today: credited.reduce((a, r) => a + payoutOf(r), 0),
      awaiting: rows.filter((r) => r.status === "Not set" || r.status === "Draft").length,
      stake: rows.reduce((a, r) => a + r.stake, 0),
    };
  }, [rows]);

  const banner = kill
    ? { cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30", msg: "Kill switch is on. All crediting and scheduled runs are blocked." }
    : stats.awaiting > 0
      ? { cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", msg: `${stats.awaiting} strategies still need a rate. Cutoff is 18:00 UTC.` }
      : { cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", msg: "All strategies are credited for this date." };

  const execute = (id: string) => {
    if (inFlight.current.has(id) || kill) return;
    inFlight.current.add(id);
    const row = rows.find((r) => r.id === id)!;
    patch(id, { status: "Processing" });
    let p = 0;
    const t = setInterval(() => {
      p = Math.min(100, p + 20);
      setProgress((s) => ({ ...s, [id]: p }));
      if (p >= 100) {
        clearInterval(t);
        const batchId = `B-${1043 + batches.length - SEED_BATCHES.length}`;
        patch(id, { status: "Credited", batchId });
        setBatches((b) => [{ id: batchId, date, strategy: row.name, rate: parseFloat(row.rate), total: payoutOf(row), users: row.investors, status: "Credited", by: "admin", source: isBackfill ? "backfill" : "manual" }, ...b]);
        inFlight.current.delete(id);
      }
    }, 350);
  };

  const reverse = (r: Row) => {
    const reason = window.prompt("Reason for reversal (required)");
    if (!reason?.trim()) return;
    patch(r.id, { status: "Reversed" });
    setBatches((b) => b.map((x) => (x.id === r.batchId ? { ...x, status: "Reversed" } : x)));
  };

  const bulkApply = () => {
    if (!bulkRate) return;
    setRows((rs) => rs.map((r) => (picked.has(r.id) && r.status !== "Credited" ? { ...r, rate: bulkRate, status: "Draft" } : r)));
    setPreviewed((p) => { const n = new Set(p); picked.forEach((id) => n.delete(id)); return n; });
  };

  const drawerRow = rows.find((r) => r.id === drawer);
  const previewRow = rows.find((r) => r.id === preview);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Daily profit</h1>
          <p className="text-sm text-muted-foreground">Set, preview, and credit profit shown on the user AI Trading page. All times UTC.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputCls} w-auto`} aria-label="Credit date" />
          <button onClick={() => window.confirm(kill ? "Turn the kill switch off?" : "Turn the kill switch on? This blocks all crediting.") && setKill(!kill)}
            className={`${btn} ${kill ? "bg-red-600 text-white" : "border border-border hover:bg-muted"}`}>
            <Power className="size-4" /> Kill switch {kill ? "on" : "off"}
          </button>
        </div>
      </div>

      <nav className="flex gap-1 border-b border-border" aria-label="Daily profit sections">
        {(["Board", "Batches", "Settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-current={tab === t}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </nav>

      {tab === "Board" && (
        <>
          {isBackfill && <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">Backfill mode: crediting creates a new batch dated {date}. Past batches are never edited.</p>}
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${banner.cls}`}>
            {kill ? <Power className="size-4" /> : stats.awaiting ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}
            {banner.msg}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Credited today", usd(stats.today)],
              ["Awaiting rate", String(stats.awaiting)],
              ["Eligible stake", usd(stats.stake)],
              ["Next auto-run", "00:05 UTC"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-border p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          {picked.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-3">
              <span className="text-sm font-medium">{picked.size} selected</span>
              <input value={bulkRate} onChange={(e) => setBulkRate(e.target.value)} placeholder="Rate %" inputMode="decimal" className={`${inputCls} w-28`} />
              <button className={btnGhost} onClick={bulkApply}>Apply rate</button>
              <button className={btnGhost} onClick={() => { const first = rows.find((r) => picked.has(r.id) && r.rate); if (first) setPreview(first.id); }}>Preview first</button>
              <button className={btnGhost} onClick={() => { setRows((rs) => rs.map((r) => (picked.has(r.id) && r.status !== "Credited" ? { ...r, status: "Skipped" } : r))); setPicked(new Set()); }}>Skip selected</button>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 p-3"><input type="checkbox" aria-label="Select all" checked={picked.size === rows.length} onChange={(e) => setPicked(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())} /></th>
                  {["Strategy", "Eligible stake", "Investors", "Rate %", "7-day avg", "Est. payout", "Status", "Actions"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rate = parseFloat(r.rate);
                  const locked = r.status === "Credited" || r.status === "Processing" || r.status === "Reversed";
                  const warn = !isNaN(rate) && (rate > settings.maxPct || rate < 0 || (r.avg7 > 0 && (Math.abs(rate - r.avg7) / r.avg7) * 100 > settings.deviation));
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3"><input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.has(r.id)} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) { n.add(r.id); } else { n.delete(r.id); } return n; })} /></td>
                      <td className="p-3"><p className="font-medium">{r.name}</p><p className="text-xs text-muted-foreground">{r.exchange}</p></td>
                      <td className="p-3 tabular-nums" title={`Excluded ${usd(r.excluded)}: ${r.excludedWhy}`}>{usd(r.stake)}</td>
                      <td className="p-3 tabular-nums">{r.investors.toLocaleString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <input value={r.rate} disabled={locked} inputMode="decimal" aria-label={`${r.name} rate`}
                            onChange={(e) => { if (/^-?\d*\.?\d{0,4}$/.test(e.target.value)) { patch(r.id, { rate: e.target.value, status: e.target.value ? "Draft" : "Not set" }); setPreviewed((p) => { const n = new Set(p); n.delete(r.id); return n; }); } }}
                            className={`${inputCls} w-24 tabular-nums`} />
                          {warn && <AlertTriangle className="size-4 text-amber-500" aria-label="Rate outside the safe range or far from the 7-day average" />}
                        </div>
                      </td>
                      <td className="p-3 tabular-nums text-muted-foreground">{r.avg7.toFixed(2)}%</td>
                      <td className="p-3 tabular-nums">{r.rate ? usd(payoutOf(r)) : "-"}</td>
                      <td className="p-3">
                        <Badge s={r.status} />
                        {r.status === "Processing" && <div className="mt-1.5 h-1 w-20 overflow-hidden rounded bg-muted"><div className="h-full bg-amber-500 transition-all" style={{ width: `${progress[r.id] ?? 0}%` }} /></div>}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button className={btnGhost} disabled={locked || r.status === "Skipped"} onClick={() => setDrawer(r.id)}>Set</button>
                          <button className={btnGhost} disabled={!r.rate || locked} onClick={() => setPreview(r.id)}><Eye className="size-4" />Preview</button>
                          <button className={btnPrimary} disabled={kill || locked || !previewed.has(r.id)} onClick={() => setPreview(r.id)} title={previewed.has(r.id) ? "" : "Preview first"}><Zap className="size-4" />Credit</button>
                          <button className={btnGhost} disabled={locked} aria-label="Skip" onClick={() => patch(r.id, { status: "Skipped" })}><SkipForward className="size-4" /></button>
                          <button className={btnGhost} disabled={r.status !== "Credited"} aria-label="Reverse" onClick={() => reverse(r)}><RotateCcw className="size-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Batches" && <BatchesTable batches={batches} />}

      {tab === "Settings" && (
        <div className="max-w-xl space-y-4 rounded-xl border border-border p-5">
          {([["maxPct", "Max daily %"], ["deviation", "Deviation threshold from 7-day average (%)"], ["largePayout", "Typed confirmation above payout (USD)"]] as const).map(([k, l]) => (
            <label key={k} className="block space-y-1.5 text-sm"><span className="font-medium">{l}</span>
              <input type="number" value={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: Number(e.target.value) })} className={inputCls} /></label>
          ))}
          {([["skipWeekends", "Skip weekends"], ["notify", "Send “Profit Credited” notifications"]] as const).map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings[k]} onChange={(e) => setSettings({ ...settings, [k]: e.target.checked })} />{l}</label>
          ))}
          <p className="text-xs text-muted-foreground">Settings changes require re-authentication once the API is connected.</p>
        </div>
      )}

      {drawerRow && (
        <RateDrawer row={drawerRow} date={date} backfill={isBackfill} settings={settings} onClose={() => setDrawer(null)}
          onSave={(rate, note, open) => { patch(drawerRow.id, { rate, note, status: "Draft" }); setPreviewed((p) => { const n = new Set(p); n.delete(drawerRow.id); return n; }); setDrawer(null); if (open) setPreview(drawerRow.id); }} />
      )}

      {previewRow && (
        <PreviewDialog row={previewRow} date={date} settings={settings} kill={kill}
          onClose={() => setPreview(null)}
          onDraft={() => { setPreviewed((p) => new Set(p).add(previewRow.id)); setPreview(null); }}
          onConfirm={() => { setPreviewed((p) => new Set(p).add(previewRow.id)); setPreview(null); execute(previewRow.id); }} />
      )}
    </div>
  );
}

function BatchesTable({ batches }: { batches: Batch[] }) {
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const size = 8;
  const list = batches.filter((b) => (b.strategy + b.id + b.status).toLowerCase().includes(q.toLowerCase()));
  const shown = list.slice(page * size, page * size + size);
  const exportCsv = () => {
    const csv = ["id,date,strategy,rate,total,users,status,source", ...list.map((b) => [b.id, b.date, b.strategy, b.rate, b.total, b.users, b.status, b.source].join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "profit-batches.csv";
    a.click();
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search batch, strategy, or status" className={`${inputCls} max-w-xs`} />
        <button className={btnGhost} onClick={exportCsv}>Export CSV</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr>{["Batch", "Date", "Strategy", "Rate", "Total", "Users", "Source", "Status"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No batches match your search.</td></tr>}
            {shown.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="p-3 font-medium">{b.id}</td><td className="p-3">{b.date}</td><td className="p-3">{b.strategy}</td>
                <td className="p-3 tabular-nums">{b.rate}%</td><td className="p-3 tabular-nums">{usd(b.total)}</td>
                <td className="p-3 tabular-nums">{b.users}</td><td className="p-3 text-muted-foreground">{b.source}</td><td className="p-3"><Badge s={b.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground">
        Page {page + 1} of {Math.max(1, Math.ceil(list.length / size))}
        <button className={btnGhost} disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="size-4" /></button>
        <button className={btnGhost} disabled={(page + 1) * size >= list.length} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  );
}

function RateDrawer({ row, date, backfill, settings, onClose, onSave }: {
  row: Row; date: string; backfill: boolean; settings: Settings; onClose: () => void; onSave: (rate: string, note: string, preview: boolean) => void;
}) {
  const [rate, setRate] = useState(row.rate);
  const [note, setNote] = useState(row.note);
  const [reason, setReason] = useState("");
  const [negOk, setNegOk] = useState(false);
  const n = parseFloat(rate);
  const neg = n < 0;
  const hint = n > settings.maxPct && n / 10 <= settings.maxPct ? `Did you mean ${n / 10} instead of ${n}?` : "";
  const needReason = neg || backfill;
  const valid = !isNaN(n) && (!neg || negOk) && (!needReason || reason.trim().length > 0);
  const est = floor2(row.stake * (n / 100 || 0));
  return (
    <Modal title={`Set rate: ${row.name}`} onClose={onClose} side>
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Credit date {date}. Percent of eligible stake.</p>
        <label className="block space-y-1.5"><span className="font-medium">Rate (%)</span>
          <input autoFocus value={rate} inputMode="decimal" onChange={(e) => /^-?\d*\.?\d{0,4}$/.test(e.target.value) && setRate(e.target.value)} className={inputCls} /></label>
        {hint && <p className="text-amber-600 dark:text-amber-400">{hint}</p>}
        {n > settings.maxPct && <p className="text-red-600 dark:text-red-400">Above the {settings.maxPct}% maximum. You will need to type CREDIT to confirm.</p>}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3">
          <div><p className="text-xs text-muted-foreground">Estimated payout</p><p className="font-semibold tabular-nums">{usd(est)}</p></div>
          <div><p className="text-xs text-muted-foreground">Average per investor</p><p className="font-semibold tabular-nums">{usd(row.investors ? est / row.investors : 0)}</p></div>
        </div>
        <label className="block space-y-1.5"><span className="font-medium">Note shown to users</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} /></label>
        {neg && <label className="flex items-center gap-2"><input type="checkbox" checked={negOk} onChange={(e) => setNegOk(e.target.checked)} />I understand this reduces accrued profit.</label>}
        {needReason && <label className="block space-y-1.5"><span className="font-medium">Reason ({neg ? "negative rate" : "backdated"})</span>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} /></label>}
        <div className="flex justify-end gap-2 pt-2">
          <button className={btnGhost} onClick={onClose}>Cancel</button>
          <button className={btnGhost} disabled={!valid} onClick={() => onSave(rate, note, false)}>Save draft</button>
          <button className={btnPrimary} disabled={!valid} onClick={() => onSave(rate, note, true)}>Save and preview</button>
        </div>
      </div>
    </Modal>
  );
}

function PreviewDialog({ row, date, settings, kill, onClose, onDraft, onConfirm }: {
  row: Row; date: string; settings: Settings; kill: boolean; onClose: () => void; onDraft: () => void; onConfirm: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [code, setCode] = useState("");
  const rate = parseFloat(row.rate) || 0;
  const total = payoutOf(row);
  const samples = Array.from({ length: Math.min(8, row.investors) }, (_, i) => {
    const stake = Math.round((row.stake / row.investors) * (0.4 + ((i * 37) % 17) / 10));
    return { user: `u***${((1000 + i * 73) % 9000) + 100}@mail.com`, stake, profit: floor2(stake * (rate / 100)) };
  });
  const needsTyped = rate > settings.maxPct || rate < 0 || total > settings.largePayout;
  const checks: [string, boolean][] = [
    ["Rate within the maximum", rate <= settings.maxPct && rate >= 0],
    ["No duplicate batch for this strategy and date", row.status !== "Credited"],
    ["Kill switch is off", !kill],
    ["No batch processing on this strategy", row.status !== "Processing"],
  ];
  return (
    <Modal title={`Preview: ${row.name}, ${date}`} onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Payout", usd(total)], ["Investors", row.investors.toLocaleString()], ["Average", usd(row.investors ? total / row.investors : 0)], ["Rate", `${rate}%`]].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border p-3"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold tabular-nums">{v}</p></div>
          ))}
        </div>
        <div>
          <p className="mb-1.5 font-medium">Pre-checks</p>
          <ul className="space-y-1">{checks.map(([l, ok]) => (
            <li key={l} className="flex items-center gap-2">{ok ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-red-500" />}{l}</li>
          ))}</ul>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs"><thead className="bg-muted/50 text-left text-muted-foreground"><tr><th className="p-2">User</th><th className="p-2">Stake</th><th className="p-2">Profit to credit</th></tr></thead>
            <tbody>{samples.map((s) => <tr key={s.user} className="border-t border-border"><td className="p-2">{s.user}</td><td className="p-2 tabular-nums">{usd(s.stake)}</td><td className="p-2 tabular-nums">{usd(s.profit)}</td></tr>)}</tbody></table>
        </div>
        <p className="text-muted-foreground">Excluded: {usd(row.excluded)} ({row.excludedWhy}). The list is re-validated when you confirm.</p>
        {needsTyped && <label className="block space-y-1.5"><span className="font-medium">Type CREDIT to confirm this payout</span><input value={typed} onChange={(e) => setTyped(e.target.value)} className={inputCls} /></label>}
        <label className="block space-y-1.5"><span className="font-medium">Re-authenticate with your 6-digit MFA code</span>
          <input value={code} inputMode="numeric" maxLength={6} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={`${inputCls} w-40 tabular-nums`} /></label>
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>Back</button>
          <button className={btnGhost} onClick={onDraft}>Save draft</button>
          <button className={btnPrimary} disabled={kill || !checks.every(([, ok]) => ok) || code.length !== 6 || (needsTyped && typed !== "CREDIT")} onClick={onConfirm}>
            Confirm and credit
          </button>
        </div>
      </div>
    </Modal>
  );
}
