"use client";

import { useState } from "react";
import { CashflowMonth, CatMonth, CAT_COLORS, fmtMoney, Lang, I18N } from "../lib/data";

interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
  stroke?: number;
}
export function Sparkline({ data, w = 120, h = 36, color = "var(--ink)", fill = true, stroke = 1.5 }: SparklineProps) {
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

interface CashflowChartProps {
  data: CashflowMonth[];
  lang: Lang;
  showAnnotations?: boolean;
}
export function CashflowChart({ data, lang, showAnnotations = true }: CashflowChartProps) {
  const W = 700, H = 220, PAD_L = 48, PAD_R = 14, PAD_T = 16, PAD_B = 30;
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B;
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)));
  const step = innerW / data.length;
  const barW = Math.min(step * 0.35, 14);
  const yAt = (v: number) => PAD_T + innerH - (v / max) * innerH;
  const months = I18N[lang].months;

  const netLine = data.map((d, i) => {
    const x = PAD_L + step * i + step / 2;
    const net = d.income - d.expense;
    const y = PAD_T + innerH - (net / max) * innerH;
    return [x, y, net] as [number, number, number];
  });
  const netPath = netLine.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const yTicks = [0, max * 0.5, max].map((v) => ({ v, y: yAt(v) }));
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} x2={W - PAD_R} y1={t.y} y2={t.y} stroke="var(--border)" strokeDasharray={i === 0 ? "0" : "3 3"} />
            <text x={PAD_L - 6} y={t.y + 3} fontSize="10" textAnchor="end" fill="var(--ink-3)" fontFamily="var(--font-mono)">
              {t.v >= 1000 ? (t.v / 1000).toFixed(0) + "k" : t.v.toFixed(0)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = PAD_L + step * i + step / 2;
          const yI = yAt(d.income), yE = yAt(d.expense);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
              <rect x={cx - barW - 1} y={yI} width={barW} height={PAD_T + innerH - yI}
                fill="var(--accent)" opacity={hover === null || hover === i ? 0.9 : 0.4} rx="2" />
              <rect x={cx + 1} y={yE} width={barW} height={PAD_T + innerH - yE}
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
            <circle cx={PAD_L + step * 6 + step / 2} cy={yAt(16100)} r="6" fill="none" stroke="var(--warn)" strokeWidth="2" />
            <circle cx={PAD_L + step * 4 + step / 2} cy={yAt(21800)} r="6" fill="none" stroke="var(--accent)" strokeWidth="2" />
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
        <div className="tt" style={{ left: `${((PAD_L + step * hover + step / 2) / W) * 100}%`, top: 8, transform: "translateX(-50%)" }}>
          {months[hover]} · +{(data[hover].income - data[hover].expense).toLocaleString()}
        </div>
      )}
    </div>
  );
}

interface DonutChartProps {
  data: { v: number; color: string; label?: string }[];
  size?: number;
  thickness?: number;
}
export function DonutChart({ data, size = 170, thickness = 22 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.v, 0);
  const r = size / 2 - thickness / 2;
  const c = size / 2;
  let acc = 0;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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

interface BarListProps {
  items: CatMonth[];
  lang: Lang;
  showBudget?: boolean;
}
export function BarList({ items, lang, showBudget = true }: BarListProps) {
  const max = Math.max(...items.map((i) => Math.max(i.cur, i.budget || 0)));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {items.map((it) => {
        const pct = (it.cur / max) * 100;
        const budgetPct = it.budget ? (it.budget / max) * 100 : 0;
        const over = it.budget && it.cur > it.budget;
        const prevPct = (it.prev / max) * 100;
        return (
          <div key={it.k} style={{ display: "grid", gridTemplateColumns: "120px 1fr 80px", gap: 10, alignItems: "center", fontSize: 12 }}>
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
            <div className="num r" style={{ textAlign: "right", color: over ? "var(--danger)" : "var(--ink)" }}>
              {fmtMoney(it.cur, lang, true)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DailyChartProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
}
export function DailyChart({ data, w = 520, h = 120, color = "var(--ink)" }: DailyChartProps) {
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

interface AllocBarProps {
  segments: { v: number; color: string; label: string }[];
  h?: number;
}
export function AllocBar({ segments, h = 12 }: AllocBarProps) {
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

interface ProjectionChartProps {
  months: { label: string }[];
  balances: number[];
  lang: Lang;
}
export function ProjectionChart({ months, balances, lang: _lang }: ProjectionChartProps) {
  const W = 800, H = 200, PL = 50, PR = 14, PT = 16, PB = 28;
  const innerW = W - PL - PR, innerH = H - PT - PB;
  const max = Math.max(...balances, 100000);
  const min = Math.min(...balances, 50000);
  const range = max - min || 1;
  const step = innerW / (months.length - 1 || 1);
  const pts = balances.map((b, i) => [PL + step * i, PT + innerH - ((b - min) / range) * innerH]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const fillD = d + ` L${PL + step * (months.length - 1)},${PT + innerH} L${PL},${PT + innerH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", display: "block" }}>
      <defs>
        <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((p, i) => {
        const v = min + range * p;
        const y = PT + innerH - p * innerH;
        return (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={y} y2={y} stroke="var(--border)" strokeDasharray={i === 0 ? "0" : "3 3"} />
            <text x={PL - 6} y={y + 3} fontSize="10" textAnchor="end" fill="var(--ink-3)" fontFamily="var(--font-mono)">
              {(v / 1000).toFixed(0)}k
            </text>
          </g>
        );
      })}
      <path d={fillD} fill="url(#projGrad)" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="4" fill="var(--surface)" stroke="var(--accent)" strokeWidth="2" />
          <text x={p[0]} y={H - 10} fontSize="10" textAnchor="middle" fill="var(--ink-3)" fontFamily="var(--font-mono)">
            {months[i].label}
          </text>
          <text x={p[0]} y={p[1] - 10} fontSize="10" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)" fontWeight="600">
            {(balances[i] / 1000).toFixed(0)}k
          </text>
        </g>
      ))}
    </svg>
  );
}
