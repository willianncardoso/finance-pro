"use client";

import { useState } from "react";
import { Lang, I18N, fmtMoney, CashflowMonth, CatMonth, CAT_COLORS } from "../lib/data";

/* ---- Sparkline ---- */
export function Sparkline({ data, w = 120, h = 36, color = "var(--ink)", fill = true, stroke = 1.5 }: {
  data: number[]; w?: number; h?: number; color?: string; fill?: boolean; stroke?: number;
}) {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const dx = w / (data.length - 1 || 1);
  const pts = data.map((v, i) => [i * dx, h - ((v - min) / range) * (h - 4) - 2]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillD = fill ? d + ` L${w},${h} L0,${h} Z` : null;
  return (
    <svg className="sparkline" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fillD && <path d={fillD} fill={color} opacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---- CashflowChart ---- */
export function CashflowChart({ data, lang, showAnnotations = true }: { data: CashflowMonth[]; lang: Lang; showAnnotations?: boolean }) {
  const W = 700, H = 220, PL = 48, PR = 14, PT = 16, PB = 30;
  const innerW = W - PL - PR, innerH = H - PT - PB;
  const max = Math.max(...data.map(d => Math.max(d.income, d.expense)));
  const step = innerW / data.length;
  const barW = Math.min(step * 0.35, 14);
  const yAt = (v: number) => PT + innerH - (v / max) * innerH;
  const months = I18N[lang].months;
  const [hover, setHover] = useState<number | null>(null);

  const netLine = data.map((d, i) => {
    const x = PL + step * i + step / 2;
    const net = d.income - d.expense;
    const y = PT + innerH - (net / max) * innerH;
    return [x, y, net] as [number, number, number];
  });
  const netPath = netLine.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const yTicks = [0, max * 0.5, max].map(v => ({ v, y: yAt(v) }));

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={t.y} y2={t.y} stroke="var(--border)" strokeDasharray={i === 0 ? "0" : "3 3"} />
            <text x={PL - 6} y={t.y + 3} fontSize="10" textAnchor="end" fill="var(--ink-3)" fontFamily="var(--font-mono)">
              {t.v >= 1000 ? (t.v / 1000).toFixed(0) + "k" : t.v.toFixed(0)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PL + step * i + step / 2;
          const yI = yAt(d.income), yE = yAt(d.expense);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <rect x={cx - barW - 1} y={yI} width={barW} height={PT + innerH - yI}
                fill="var(--accent)" opacity={hover === null || hover === i ? 0.9 : 0.4} rx="2" />
              <rect x={cx + 1} y={yE} width={barW} height={PT + innerH - yE}
                fill="var(--ink)" opacity={hover === null || hover === i ? 0.85 : 0.35} rx="2" />
              <text x={cx} y={H - 12} fontSize="10" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--font-mono)">
                {months[i]}
              </text>
            </g>
          );
        })}
        <path d={netPath} fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5" />
        {netLine.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.5" />
        ))}
        {showAnnotations && (
          <>
            <circle cx={PL + step * 6 + step / 2} cy={yAt(16100)} r="6" fill="none" stroke="var(--warn)" strokeWidth="2" />
            <circle cx={PL + step * 4 + step / 2} cy={yAt(21800)} r="6" fill="none" stroke="var(--accent)" strokeWidth="2" />
          </>
        )}
      </svg>
      {showAnnotations && (
        <>
          <div className="annot" style={{ left: "55%", top: "22%" }}>
            {lang === "pt" ? "Bônus anual +R$ 3.3k" : "Annual bonus +$3.3k"}
          </div>
          <div className="annot" style={{ left: "68%", top: "68%" }}>
            {lang === "pt" ? "Pico de gastos (viagem)" : "Spike (trip)"}
          </div>
        </>
      )}
      {hover !== null && (
        <div className="tt" style={{ left: `${((PL + step * hover + step / 2) / W) * 100}%`, top: 8, transform: "translateX(-50%)" }}>
          {months[hover]} · +{(data[hover].income - data[hover].expense).toLocaleString()}
        </div>
      )}
    </div>
  );
}

/* ---- DonutChart ---- */
export function DonutChart({ data, size = 170, thickness = 22 }: {
  data: { v: number; color: string; label?: string }[];
  size?: number;
  thickness?: number;
}) {
  const total = data.reduce((s, d) => s + d.v, 0);
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  let acc = 0;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const len = (d.v / total) * circ;
        const gap = circ - len;
        const off = -acc * circ;
        acc += d.v / total;
        return (
          <circle key={i} cx={c} cy={c} r={r} fill="none"
            stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${len - 2} ${gap + 2}`}
            strokeDashoffset={off}
            transform={`rotate(-90 ${c} ${c})`}
            strokeLinecap="butt" />
        );
      })}
    </svg>
  );
}

/* ---- BarList ---- */
export function BarList({ items, lang, showBudget = true, onClickItem }: {
  items: CatMonth[];
  lang: Lang;
  showBudget?: boolean;
  onClickItem?: (k: string) => void;
}) {
  const max = Math.max(...items.map(i => Math.max(i.cur, i.budget || 0)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map(it => {
        const pct = (it.cur / max) * 100;
        const budgetPct = it.budget ? (it.budget / max) * 100 : 0;
        const over = it.budget && it.cur > it.budget;
        const prevPct = (it.prev / max) * 100;
        return (
          <div key={it.k} style={{ display: "grid", gridTemplateColumns: "120px 1fr 80px", gap: 10, alignItems: "center", fontSize: 12, cursor: onClickItem ? "pointer" : "default", padding: "3px 4px", borderRadius: 5 }}
            onClick={() => onClickItem?.(it.k)}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="cat-dot" style={{ background: CAT_COLORS[it.k] }}></span>
              <span>{I18N[lang].categories[it.k]}</span>
            </div>
            <div style={{ position: "relative", height: 18 }}>
              <div style={{ position: "absolute", left: 0, top: 6, height: 6, width: `${pct}%`, background: CAT_COLORS[it.k], borderRadius: 3, opacity: 0.9 }} />
              {showBudget && it.budget && (
                <div style={{ position: "absolute", left: `${budgetPct}%`, top: 2, height: 14, width: 1.5, background: "var(--ink-3)" }} />
              )}
              <div style={{ position: "absolute", left: `${prevPct}%`, top: 10, width: 5, height: 5, borderRadius: "50%", background: "var(--ink-4)", transform: "translate(-50%, 0)" }} title="mês anterior" />
            </div>
            <div className="num" style={{ textAlign: "right", color: over ? "var(--danger)" : "var(--ink)" }}>
              {fmtMoney(it.cur, lang, true)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---- DailyChart ---- */
export function DailyChart({ data, w = 520, h = 120, color = "var(--ink)" }: {
  data: number[]; w?: number; h?: number; color?: string;
}) {
  const max = Math.max(...data);
  const dx = w / (data.length - 1);
  const pts = data.map((v, i) => [i * dx, h - (v / max) * (h - 10) - 4]);
  const d = pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillD = d + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: "100%", height: h, display: "block" }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill="url(#g1)" />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => data[i] > 400 ? (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--warn)" />
      ) : null)}
    </svg>
  );
}

/* ---- AllocBar ---- */
export function AllocBar({ segments, h = 12 }: {
  segments: { v: number; color: string; label: string }[];
  h?: number;
}) {
  const total = segments.reduce((s, d) => s + d.v, 0);
  return (
    <div style={{ display: "flex", height: h, borderRadius: 4, overflow: "hidden", background: "var(--bg-3)" }}>
      {segments.map((s, i) => {
        const pct = (s.v / total) * 100;
        return <div key={i} style={{ width: `${pct}%`, background: s.color }} title={`${s.label}: ${pct.toFixed(1)}%`} />;
      })}
    </div>
  );
}

/* ---- FXBar ---- */
export function FXBar({ lang }: { lang: Lang }) {
  const pairs = [
    { pair: "USD/BRL", rate: 5.12, prev: 5.08, flag: "🇺🇸" },
    { pair: "EUR/BRL", rate: 5.54, prev: 5.49, flag: "🇪🇺" },
    { pair: "GBP/BRL", rate: 6.48, prev: 6.41, flag: "🇬🇧" },
  ];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {pairs.map((fx, i) => {
        const delta = ((fx.rate - fx.prev) / fx.prev) * 100;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <span style={{ fontSize: 14 }}>{fx.flag}</span>
            <span className="mono" style={{ fontSize: 11.5, fontWeight: 600 }}>{fx.pair}</span>
            <span className="num" style={{ fontSize: 13, fontWeight: 600 }}>{fx.rate.toFixed(2)}</span>
            <span className={"num " + (delta >= 0 ? "neg" : "pos")} style={{ fontSize: 10.5 }}>{delta > 0 ? "+" : ""}{delta.toFixed(2)}%</span>
          </div>
        );
      })}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, color: "var(--ink-3)" }}>
        <svg viewBox="0 0 24 24" style={{ width: 12, height: 12 }} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        {lang === "pt" ? "Atualizado 4min atrás" : "Updated 4min ago"}
      </div>
    </div>
  );
}
