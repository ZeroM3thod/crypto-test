// components/motion/trading-chart.tsx
"use client";

import {
  ColorType,
  CrosshairMode,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Candle = {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const FOUR_H = 4 * 3600;

const ASSETS = [
  { id: "BTCUSDT", symbol: "BTC/USDT", name: "Bitcoin", glyph: "₿", base: 52000, seed: 11 },
  { id: "ETHUSDT", symbol: "ETH/USDT", name: "Ethereum", glyph: "Ξ", base: 3000, seed: 22 },
  { id: "SOLUSDT", symbol: "SOL/USDT", name: "Solana", glyph: "◎", base: 150, seed: 33 },
  { id: "BNBUSDT", symbol: "BNB/USDT", name: "BNB", glyph: "◆", base: 580, seed: 44 },
] as const;
type Asset = (typeof ASSETS)[number];
type AssetId = Asset["id"];
const BTC_BASE = 52000;

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function genHistory(count: number, scale: number, seed: number): Candle[] {
  const rand = mulberry32(seed);
  const phases = [
    { start: 52000 * scale, end: 73000 * scale, bars: 90 },
    { start: 73000 * scale, end: 56000 * scale, bars: 60 },
    { start: 56000 * scale, end: 68000 * scale, bars: 50 },
    { start: 68000 * scale, end: 61000 * scale, bars: 40 },
    { start: 61000 * scale, end: 67000 * scale, bars: 29 },
  ];
  const candles: Candle[] = [];
  let price = BTC_BASE * scale;
  let ts = Math.floor(new Date("2024-03-01").getTime() / 1000);
  let pi = 0;
  let pb = 0;
  for (let i = 0; i < count; i++) {
    const ph = phases[Math.min(pi, phases.length - 1)];
    const trend = (ph.end - ph.start) / ph.bars;
    const vol = price * 0.012;
    const open = price;
    const move = trend + (rand() - 0.42) * vol;
    const close = open + move;
    const wick = Math.abs(move) * (0.5 + rand());
    const high = Math.max(open, close) + rand() * wick * 0.6;
    const low = Math.min(open, close) - rand() * wick * 0.6;
    const volume = 800 + rand() * 3000 + Math.abs(move / price) * 80000;
    candles.push({
      time: ts as UTCTimestamp,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: +volume.toFixed(0),
    });
    price = close;
    ts += FOUR_H;
    pb++;
    if (pb >= ph.bars) {
      pi++;
      pb = 0;
    }
  }
  return candles;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtVol = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n.toFixed(0);

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3 ? h.split("").map((x) => x + x).join("") : h,
    16,
  );
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

// Green/red only — read from the theme's --success / --destructive vars so the
// chart always matches globals.css instead of carrying its own hex values.
const UP_FALLBACK = "#4ade80";
const DOWN_FALLBACK = "#ef4444";

const INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"] as const;
type ChartType = "candle" | "line" | "area";

function readVar(el: HTMLElement, name: string, fallback: string) {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v || fallback;
}

export function TradingChart() {
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const lineRef = useRef<ISeriesApi<"Line"> | null>(null);
  const areaRef = useRef<ISeriesApi<"Area"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);

  const [assetId, setAssetId] = useState<AssetId>("BTCUSDT");
  const asset: Asset = ASSETS.find((a) => a.id === assetId) ?? ASSETS[0];
  const scale = asset.base / BTC_BASE;

  const history = useMemo(() => genHistory(269, scale, asset.seed), [scale, asset.seed]);
  const [interval, setIntervalValue] = useState<(typeof INTERVALS)[number]>("4H");
  const [type, setType] = useState<ChartType>("candle");
  const [ohlc, setOhlc] = useState<Candle>(history[history.length - 1]);

  const [ohlcAssetId, setOhlcAssetId] = useState<AssetId>(assetId);
  if (ohlcAssetId !== assetId) {
    setOhlcAssetId(assetId);
    setOhlc(history[history.length - 1]);
  }
  const hoverRef = useRef<number | null>(null);
  const liveRef = useRef<Candle>(history[history.length - 1]);

  useEffect(() => {
    const host = hostRef.current;
    const root = rootRef.current;
    if (!host || !root) return;

    liveRef.current = history[history.length - 1];
    hoverRef.current = null;

    const bg = readVar(root, "--chart-bg", "#1c1c1c");
    const fg = readVar(root, "--chart-fg", "#71717a");
    const grid = readVar(root, "--chart-grid", "rgba(255,255,255,0.06)");
    const UP = readVar(root, "--success", UP_FALLBACK);
    const DOWN = readVar(root, "--destructive", DOWN_FALLBACK);

    const chart = createChart(host, {
      width: host.clientWidth,
      height: host.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: fg,
        fontSize: 11,
        fontFamily: "var(--font-sans), system-ui, sans-serif",
      },
      grid: { vertLines: { color: grid }, horzLines: { color: grid } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: fg, width: 1, style: 3, labelBackgroundColor: bg },
        horzLine: { color: fg, width: 1, style: 3, labelBackgroundColor: bg },
      },
      rightPriceScale: { borderColor: grid, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { borderColor: grid, timeVisible: true, secondsVisible: false, rightOffset: 4 },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: false, pinch: true, axisPressedMouseMove: { time: true, price: true } },
    });
    chartRef.current = chart;

    const candle = chart.addCandlestickSeries({
      upColor: UP, downColor: DOWN, borderUpColor: UP, borderDownColor: DOWN, wickUpColor: UP, wickDownColor: DOWN,
    });
    candle.setData(history);
    candleRef.current = candle;

    const volume = chart.addHistogramSeries({ priceFormat: { type: "volume" }, priceScaleId: "vol" });
    volume.setData(
      history.map((c) => ({ time: c.time, value: c.volume, color: c.close >= c.open ? rgba(UP, 0.35) : rgba(DOWN, 0.3) })),
    );
    chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, borderVisible: false });
    volumeRef.current = volume;

    chart.timeScale().fitContent();

    const byTime = new Map(history.map((c) => [c.time as number, c]));
    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        hoverRef.current = null;
        setOhlc(liveRef.current);
        return;
      }
      hoverRef.current = param.time as number;
      const c = liveRef.current.time === (param.time as number) ? liveRef.current : byTime.get(param.time as number);
      if (c) setOhlc(c);
    });

    let last: Candle = { ...history[history.length - 1] };
    let live: Candle | null = null;
    let tickCount = 0;
    let price = last.close;
    let trend = (Math.random() - 0.5) * 60 * scale;
    const TICKS_PER_CANDLE = 80;

    const tick = window.setInterval(() => {
      const volatility = price * 0.0015;
      price = Math.max(price + trend * 0.01 + (Math.random() - 0.48) * volatility, asset.base * 0.02);
      if (Math.random() < 0.05) trend = (Math.random() - 0.5) * 120 * scale;

      if (!live) {
        live = { time: (last.time + FOUR_H) as UTCTimestamp, open: price, high: price, low: price, close: price, volume: 0 };
      }
      live.close = +price.toFixed(2);
      live.high = +Math.max(live.high, price).toFixed(2);
      live.low = +Math.min(live.low, price).toFixed(2);
      live.volume += 20 + Math.random() * 80;

      candle.update(live);
      volume.update({ time: live.time, value: live.volume, color: live.close >= live.open ? rgba(UP, 0.35) : rgba(DOWN, 0.3) });
      lineRef.current?.update({ time: live.time, value: live.close });
      areaRef.current?.update({ time: live.time, value: live.close });

      liveRef.current = { ...live };
      if (hoverRef.current === null || hoverRef.current === live.time) setOhlc({ ...live });

      tickCount++;
      if (tickCount >= TICKS_PER_CANDLE) {
        last = { ...live };
        live = null;
        tickCount = 0;
        price = last.close;
      }
    }, 800);

    let vZoom: { min: number; max: number } | null = null;
    candle.applyOptions({
      autoscaleInfoProvider: (original: () => unknown) => {
        const res = original() as { priceRange: { minValue: number; maxValue: number } | null; margins?: { above: number; below: number } } | null;
        if (!vZoom) return res;
        return { priceRange: { minValue: vZoom.min, maxValue: vZoom.max }, margins: res?.margins };
      },
    });

    const timeH = () => chart.timeScale().height();
    const priceW = () => chart.priceScale("right").width();
    const currentRange = () => {
      const h = host.clientHeight - timeH();
      const max = candle.coordinateToPrice(0);
      const min = candle.coordinateToPrice(h);
      return max != null && min != null ? { min: Number(min), max: Number(max) } : null;
    };
    const onWheel = (e: WheelEvent) => {
      const rect = host.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const overPrice = x > rect.width - priceW();
      const overTime = y > rect.height - timeH();
      e.preventDefault();
      const step = Math.min(Math.abs(e.deltaY), 120) / 120;
      const zoomIn = e.deltaY < 0;
      if (overPrice && !overTime) {
        const factor = zoomIn ? Math.pow(0.85, step) : Math.pow(1 / 0.85, step);
        const r = vZoom ?? currentRange();
        if (!r) return;
        const plotH = host.clientHeight - timeH();
        const anchor = candle.coordinateToPrice(Math.min(Math.max(y, 0), plotH));
        if (anchor == null) return;
        const a = Number(anchor);
        const min = a - (a - r.min) * factor;
        const max = a + (r.max - a) * factor;
        if (max - min < Math.max(scale, 0.02)) return;
        vZoom = { min, max };
        chart.priceScale("right").applyOptions({ autoScale: true });
      } else {
        const ts = chart.timeScale();
        const cur = ts.options().barSpacing;
        const next = cur * (zoomIn ? Math.pow(1.12, step) : Math.pow(1 / 1.12, step));
        ts.applyOptions({ barSpacing: Math.min(Math.max(next, 0.5), 60) });
      }
    };
    const onDbl = (e: MouseEvent) => {
      const rect = host.getBoundingClientRect();
      if (e.clientX - rect.left > rect.width - priceW()) {
        vZoom = null;
        chart.priceScale("right").applyOptions({ autoScale: true });
      }
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    host.addEventListener("dblclick", onDbl);

    resetViewRef.current = () => {
      vZoom = null;
      chart.priceScale("right").applyOptions({ autoScale: true });
      chart.timeScale().fitContent();
    };

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: host.clientWidth, height: host.clientHeight });
    });
    ro.observe(host);

    return () => {
      window.clearInterval(tick);
      ro.disconnect();
      host.removeEventListener("wheel", onWheel);
      host.removeEventListener("dblclick", onDbl);
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      lineRef.current = null;
      areaRef.current = null;
      volumeRef.current = null;
      resetViewRef.current = null;
    };
  }, [history, asset.base, scale]);

  useEffect(() => {
    const chart = chartRef.current;
    const candle = candleRef.current;
    const root = rootRef.current;
    if (!chart || !candle) return;
    const UP = root ? readVar(root, "--success", UP_FALLBACK) : UP_FALLBACK;
    const data = history.map((c) => ({ time: c.time, value: c.close }));

    if (type === "line" && !lineRef.current) {
      lineRef.current = chart.addLineSeries({ color: UP, lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
      lineRef.current.setData(data);
    }
    if (type === "area" && !areaRef.current) {
      areaRef.current = chart.addAreaSeries({
        topColor: rgba(UP, 0.3), bottomColor: rgba(UP, 0), lineColor: UP, lineWidth: 2, priceLineVisible: false, lastValueVisible: false,
      });
      areaRef.current.setData(data);
    }
    candle.applyOptions({ visible: type === "candle" });
    lineRef.current?.applyOptions({ visible: type === "line" });
    areaRef.current?.applyOptions({ visible: type === "area" });
  }, [type, history]);

  const diff = ohlc.close - ohlc.open;
  const pct = (diff / ohlc.open) * 100;
  const positive = diff >= 0;

  return (
    <div ref={rootRef} className="trading-chart w-full overflow-hidden rounded-3xl border border-border bg-background">
      {/* Header */}
      <div className="border-b border-border/80 px-4 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card text-base font-semibold text-foreground">
              {asset.glyph}
            </div>
            <div className="min-w-0">
              <AssetPicker assets={ASSETS} value={asset} onChange={setAssetId} />
              <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>BINANCE · {interval}</span>
                <span className="inline-flex items-center gap-1.5 text-success">
                  <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-current" />
                  Live
                </span>
              </p>
            </div>
          </div>

          <div className="ml-auto text-right">
            <div className="text-xl font-semibold leading-none tracking-tight text-foreground tabular-nums sm:text-2xl">
              {fmt(ohlc.close)}
            </div>
            <div className={`mt-1 text-sm font-medium tabular-nums ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? "+" : ""}{diff.toFixed(2)} ({positive ? "+" : ""}{pct.toFixed(2)}%)
            </div>
          </div>
        </div>

        {/* Interval tabs + chart type */}
        <div className="flex items-center justify-between gap-3 pb-3">
          <div role="tablist" aria-label="Interval" className="flex min-w-0 gap-1 overflow-x-auto rounded-full bg-card p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {INTERVALS.map((iv) => {
              const active = iv === interval;
              return (
                <button
                  key={iv}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setIntervalValue(iv)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                    active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {iv}
                </button>
              );
            })}
          </div>

          <div role="group" aria-label="Chart type" className="flex shrink-0 gap-1 rounded-full bg-card p-1">
            {([["candle", "Candles"], ["line", "Line"], ["area", "Area"]] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={type === id}
                aria-label={label}
                title={label}
                onClick={() => setType(id)}
                className={`flex size-8 items-center justify-center rounded-full transition-colors ${
                  type === id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ChartTypeIcon type={id} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* OHLC strip */}
      <div className="grid grid-cols-3 gap-2 px-3 pt-3 sm:grid-cols-6">
        {([
          ["Open", fmt(ohlc.open), ""],
          ["High", fmt(ohlc.high), "text-success"],
          ["Low", fmt(ohlc.low), "text-destructive"],
          ["Close", fmt(ohlc.close), ""],
          ["Volume", fmtVol(ohlc.volume), ""],
          ["Change", `${positive ? "+" : ""}${pct.toFixed(2)}%`, positive ? "text-success" : "text-destructive"],
        ] as const).map(([label, value, tone]) => (
          <div key={label} className="min-w-0 rounded-2xl bg-card px-3 py-2">
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className={`truncate text-sm font-semibold tabular-nums text-foreground ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Chart — trimmed heights so it fits inside the shell alongside the order panel */}
      <div className="p-3">
        <div className="relative rounded-3xl bg-card p-2 sm:p-3">
          <div ref={hostRef} className="h-[320px] w-full touch-pan-y sm:h-[400px] lg:h-[460px]" />
          <button
            type="button"
            title="Auto — reset chart to the default view"
            aria-label="Auto: reset chart to the default view"
            onClick={() => resetViewRef.current?.()}
            className="absolute bottom-[11px] right-3 z-10 h-5 rounded-md border border-border bg-background px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:bottom-[15px] sm:right-4"
          >
            Auto
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetPicker({ assets, value, onChange }: { assets: readonly Asset[]; value: Asset; onChange: (id: AssetId) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative min-w-0">
      <h2 className="min-w-0 text-lg font-semibold leading-tight tracking-tight text-foreground sm:text-xl">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Select chart, current ${value.symbol}`}
          onClick={() => setOpen((o) => !o)}
          className="-mx-1.5 flex max-w-full items-center gap-1.5 rounded-xl px-1.5 py-0.5 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="truncate">{value.symbol}</span>
          <ChevronDown aria-hidden className={`size-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </h2>

      {open && (
        <div role="menu" aria-label="Select chart" className="absolute left-0 top-full z-30 mt-2 w-60 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl border border-border bg-background p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-12px_rgba(0,0,0,0.25)]">
          {assets.map((a) => {
            const active = a.id === value.id;
            return (
              <button
                key={a.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => { onChange(a.id); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors ${active ? "bg-card" : "hover:bg-card"}`}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-foreground">
                  {a.glyph}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{a.symbol}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{a.name}</span>
                </span>
                {active && <Check className="size-4 shrink-0 text-success" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChartTypeIcon({ type }: { type: ChartType }) {
  if (type === "candle") {
    return (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
        <rect x="2" y="4" width="3" height="6" rx=".5" />
        <line x1="3.5" y1="2" x2="3.5" y2="4" stroke="currentColor" strokeWidth="1.2" />
        <line x1="3.5" y1="10" x2="3.5" y2="12" stroke="currentColor" strokeWidth="1.2" />
        <rect x="8" y="2" width="3" height="6" rx=".5" />
        <line x1="9.5" y1="1" x2="9.5" y2="2" stroke="currentColor" strokeWidth="1.2" />
        <line x1="9.5" y1="8" x2="9.5" y2="13" stroke="currentColor" strokeWidth="1.2" />
      </svg>
    );
  }
  if (type === "line") {
    return (
      <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <polyline points="1,11 5,6 8,8 13,3" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M1 11 L5 6 L8 8 L13 3 L13 12 L1 12 Z" fill="currentColor" opacity=".3" stroke="none" />
      <polyline points="1,11 5,6 8,8 13,3" />
    </svg>
  );
}
