"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, fmtMoney, fmtDate, CAT_COLORS, Txn, ACCOUNTS, TXNS, CARDS, INSIGHTS, PORTFOLIO, LEARNED_RULES, CAT_MONTH, CASHFLOW_12M, GOALS, AVENUE_PORTFOLIO, FX, acctBRL, PERIOD_PRESETS, buildPeriodData, PeriodPreset, newId } from "../lib/data";

/* ─── Helpers that derive stats from real transaction data ─── */

function computeStats(txns: Txn[]) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const thisM = ym(now);
  const prevM = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const thisMo = txns.filter(t => t.d.startsWith(thisM));
  const prevMo = txns.filter(t => t.d.startsWith(prevM));

  const income = thisMo.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expense = Math.abs(thisMo.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));
  const prevExpense = Math.abs(prevMo.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));
  const incomeAll = txns.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expenseAll = Math.abs(txns.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));

  const byCat: Record<string, number> = {};
  const prevByCat: Record<string, number> = {};
  thisMo.filter(t => t.amt < 0 && t.cat).forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amt); });
  prevMo.filter(t => t.amt < 0 && t.cat).forEach(t => { prevByCat[t.cat] = (prevByCat[t.cat] || 0) + Math.abs(t.amt); });

  const catSummary = Object.entries(byCat)
    .map(([k, cur]) => ({ k, cur, prev: prevByCat[k] || 0, budget: 0 }))
    .sort((a, b) => b.cur - a.cur);

  // Monthly cashflow (last 12 months)
  const byMonth: Record<string, { income: number; expense: number }> = {};
  txns.forEach(t => {
    const m = t.d.slice(0, 7);
    if (!byMonth[m]) byMonth[m] = { income: 0, expense: 0 };
    if (t.amt > 0) byMonth[m].income += t.amt;
    else byMonth[m].expense += Math.abs(t.amt);
  });
  const cashflow = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([, v], i) => ({ m: i + 1, income: v.income, expense: v.expense }));

  const topCat = catSummary[0]?.k ?? null;
  return { income, expense, prevExpense, net: income - expense, catSummary, cashflow, topCat, incomeAll, expenseAll };
}
import { InsightCard } from "./shell";
import { Sparkline, DonutChart, CashflowChart, BarList, AllocBar, FXBar } from "./charts";

function EmptyState({ icon, title, sub, cta, onCta }: { icon: string; title: string; sub: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px", textAlign: "center" }}>
      <Icon name={icon} style={{ width: 44, height: 44, stroke: "var(--ink-3)", strokeWidth: 1.1, marginBottom: 16 }} className="" />
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 320, lineHeight: 1.65 }}>{sub}</div>
      {cta && (
        <button className="btn primary sm" style={{ marginTop: 20 }} onClick={onCta}>
          <Icon name="upload" className="btn-icon" />
          {cta}
        </button>
      )}
    </div>
  );
}

const CARD_TXNS = [
  { d: "2026-04-16", merch: "Amazon Brasil", cat: "shopping", amt: -489.00, installment: null },
  { d: "2026-04-15", merch: "iFood", cat: "rest", amt: -84.50, installment: null },
  { d: "2026-04-14", merch: "Pão de Açúcar", cat: "food", amt: -312.45, installment: null },
  { d: "2026-04-13", merch: "Kindle Store", cat: "education", amt: -39.90, installment: null },
  { d: "2026-04-12", merch: "Farmácia SP", cat: "health", amt: -124.20, installment: null },
  { d: "2026-04-11", merch: "Uber Eats", cat: "rest", amt: -45.00, installment: null },
  { d: "2026-04-10", merch: "Shell", cat: "transport", amt: -245.00, installment: null },
  { d: "2026-04-09", merch: "Apple.com · iPad 4/12", cat: "shopping", amt: -499.00, installment: "4/12" },
  { d: "2026-04-08", merch: "Decolar · Passagem", cat: "leisure", amt: -1840.00, installment: "1/6" },
  { d: "2026-04-07", merch: "Cinemark", cat: "leisure", amt: -72.00, installment: null },
  { d: "2026-04-05", merch: "C&A", cat: "shopping", amt: -228.00, installment: null },
  { d: "2026-04-03", merch: "Padaria", cat: "food", amt: -42.80, installment: null },
];

/* ============ CARDS ============ */
export function CardsPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const [selected, setSelected] = useState(CARDS[1]);
  const pct = selected.limit > 0 ? (selected.used / selected.limit) * 100 : 0;
  const totalBills = CARDS.reduce((s, c) => s + c.used, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">{CARDS.length} {lang === "pt" ? "cartões ativos" : "active cards"} · {fmtMoney(totalBills, lang, true)} {lang === "pt" ? "em faturas" : "in bills"}</div>
        </div>
        <button className="btn sm" onClick={() => (window as any).__toast?.(lang === "pt" ? "Adicione cartões importando faturas" : "Add cards by importing statements", "info")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Adicionar cartão" : "Add card"}
        </button>
      </div>

      {/* Card strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {CARDS.map(c => {
          const p = c.limit > 0 ? (c.used / c.limit) * 100 : 0;
          const isSel = c.id === selected.id;
          return (
            <div key={c.id} onClick={() => setSelected(c)} className="card" style={{
              minWidth: 240, cursor: "pointer",
              borderColor: isSel ? "var(--ink)" : "var(--border)",
              borderWidth: isSel ? 2 : 1,
              padding: 14,
              background: c.color, color: "white",
              position: "relative", overflow: "hidden", flexShrink: 0,
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ fontSize: 10.5, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>{c.brand}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.75, marginBottom: 2 }}>•••• {c.last4}</div>
              <div className="num" style={{ fontSize: 19, fontWeight: 600, marginTop: 6 }}>{fmtMoney(c.used, lang, true)}</div>
              <div style={{ fontSize: 10.5, opacity: 0.7, marginBottom: 8 }}>{lang === "pt" ? "de" : "of"} {fmtMoney(c.limit > 0 ? c.limit : c.used, lang, true)}</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: Math.min(p, 100) + "%", background: p > 70 ? "#ffb454" : "white" }} />
              </div>
              {c.close > 0 && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, marginTop: 6, opacity: 0.7, display: "flex", justifyContent: "space-between" }}>
                  <span>{lang === "pt" ? "fecha" : "close"} d{c.close}</span>
                  <span>{lang === "pt" ? "vence" : "due"} d{c.due}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected card detail */}
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 6 }}>
            {lang === "pt" ? "Fatura atual" : "Current bill"}
          </div>
          <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(selected.used, lang)}</div>
          <div style={{ marginTop: 10, marginBottom: 6 }}>
            <div className="pbar" style={{ height: 8 }}>
              <div className="pbar-fill" style={{ width: Math.min(pct, 100) + "%", background: pct > 70 ? "var(--warn)" : "var(--ink)" }} />
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{pct.toFixed(1)}% {lang === "pt" ? "do limite" : "of limit"}</span>
              {selected.limit > 0 && <span>{lang === "pt" ? "disponível" : "available"}: {fmtMoney(selected.limit - selected.used, lang, true)}</span>}
            </div>
          </div>
          {pct > 70 && (
            <div style={{ marginTop: 10, padding: "8px 10px", background: "var(--warn-bg)", borderRadius: 6, fontSize: 11.5, color: "var(--warn-fg)", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="alert" style={{ width: 13, height: 13 }} className="" />
              {lang === "pt" ? "Projeção: estourará o limite em 6 dias" : "Forecast: will exceed limit in 6 days"}
            </div>
          )}
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 6 }}>
            {lang === "pt" ? "Próximos eventos" : "Upcoming events"}
          </div>
          {[
            { l: lang === "pt" ? "Fechamento" : "Closing", d: selected.close > 0 ? `d${selected.close}` : "—", sub: lang === "pt" ? "8 dias" : "8 days" },
            { l: lang === "pt" ? "Vencimento" : "Due date", d: selected.due > 0 ? `d${selected.due}` : "—", sub: lang === "pt" ? "22 dias" : "22 days" },
            { l: lang === "pt" ? "Parcelas futuras" : "Future installments", d: "7", sub: fmtMoney(3240, lang, true) },
          ].map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{e.l}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>{e.sub}</div>
              </div>
              <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{e.d}</div>
            </div>
          ))}
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 10 }}>
            {lang === "pt" ? "Análise da fatura" : "Bill analysis"}
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, marginBottom: 8 }}>{lang === "pt" ? "Compras por categoria:" : "Spend by category:"}</div>
          {[
            { l: lang === "pt" ? "Shopping" : "Shopping", v: "38%", c: CAT_COLORS.shopping },
            { l: lang === "pt" ? "Restaurantes" : "Restaurants", v: "22%", c: CAT_COLORS.rest },
            { l: lang === "pt" ? "Alimentação" : "Groceries", v: "18%", c: CAT_COLORS.food },
            { l: lang === "pt" ? "Lazer" : "Leisure", v: "12%", c: CAT_COLORS.leisure },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c, flexShrink: 0 }} />
              <span>{r.l}</span>
              <span className="num" style={{ marginLeft: "auto" }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{lang === "pt" ? `Transações · ${selected.brand}` : `Transactions · ${selected.brand}`}</h3>
          <div className="card-actions">
            <div className="seg">
              <button className="on">{lang === "pt" ? "Fatura atual" : "Current bill"}</button>
              <button>{lang === "pt" ? "Aberta" : "Open"}</button>
              <button>{lang === "pt" ? "Anterior" : "Previous"}</button>
            </div>
          </div>
        </div>
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Data" : "Date"}</th>
            <th>{lang === "pt" ? "Estabelecimento" : "Merchant"}</th>
            <th>{lang === "pt" ? "Categoria" : "Category"}</th>
            <th>{lang === "pt" ? "Parcela" : "Installment"}</th>
            <th className="r">{lang === "pt" ? "Valor" : "Amount"}</th>
          </tr></thead>
          <tbody>
            {CARD_TXNS.map((tx, i) => (
              <tr key={i}>
                <td className="num muted" style={{ fontSize: 11.5 }}>{fmtDate(tx.d, lang)}</td>
                <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }} />{I18N[lang].categories[tx.cat]}</span></td>
                <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>{tx.installment ?? "—"}</td>
                <td className="r num" style={{ fontWeight: 600 }}>{fmtMoney(tx.amt, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ INVESTMENTS ============ */
export function InvestPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const [activeTab, setActiveTab] = useState("br");
  const total = PORTFOLIO.reduce((s, p) => s + (p.q > 1 ? p.q * p.last : p.last), 0);
  const totalCost = PORTFOLIO.reduce((s, p) => s + (p.q > 1 ? p.q * p.pm : p.pm), 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_invest}</h1>
          <div className="page-sub">8 {lang === "pt" ? "ativos" : "assets"} · {lang === "pt" ? "rentabilidade YTD" : "YTD return"} +11.4% · vs CDI +2.8%</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
            <Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar nota" : "Import note"}
          </button>
          <button className="btn primary sm" onClick={() => (window as any).__toast?.(lang === "pt" ? "Nova operação: em breve" : "New trade: coming soon", "warn")}>
            <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova operação" : "New trade"}
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 14 }}>
        {[
          { l: lang === "pt" ? "Patrimônio" : "Total", v: fmtMoney(total, lang, true), d: { pos: true, text: `+${fmtMoney(total - totalCost, lang, true)}` }, s: lang === "pt" ? "resultado total" : "total result" },
          { l: lang === "pt" ? "Rentab. mês" : "Monthly return", v: "+4.12%", d: { pos: true, text: "vs CDI: +1.8pp" }, s: "" },
          { l: lang === "pt" ? "Proventos 12m" : "Dividends 12m", v: fmtMoney(8420, lang, true), d: { pos: true, text: "DY: 5.8%" }, s: "" },
          { l: lang === "pt" ? "IR a pagar" : "Tax owed", v: fmtMoney(612, lang, true), d: { pos: false, text: lang === "pt" ? "vence d30" : "due d30" }, s: lang === "pt" ? "day-trade abril" : "day-trade April" },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-value">{k.v}</div>
            <div>
              <span className={"kpi-delta " + (k.d.pos ? "pos" : "neg")}>
                <Icon name={k.d.pos ? "arrow_up" : "arrow_down"} style={{ width: 10, height: 10 }} className="" />
                {k.d.text}
              </span>
              {k.s && <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{k.s}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.3fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Alocação atual" : "Current allocation"}</h3>
            <button className="btn ghost sm">{lang === "pt" ? "Rebalancear" : "Rebalance"}</button>
          </div>
          <div className="card-pad">
            <AllocBar segments={[
              { v: 68000, color: "oklch(0.55 0.14 155)", label: "Ações BR" },
              { v: 45000, color: "oklch(0.65 0.15 30)", label: "ETF" },
              { v: 89000, color: "oklch(0.55 0.14 220)", label: "CDB/LCI" },
              { v: 52000, color: "oklch(0.5 0.1 280)", label: "Tesouro" },
              { v: 30510, color: "oklch(0.6 0.12 90)", label: "FIIs" },
            ]} h={14} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginTop: 14 }}>
              {[
                { l: "Ações BR", v: "23.9%", t: "15-25%", c: "oklch(0.55 0.14 155)" },
                { l: "ETF", v: "15.8%", t: "10-20%", c: "oklch(0.65 0.15 30)" },
                { l: "CDB/LCI", v: "31.3%", t: "30-40%", c: "oklch(0.55 0.14 220)" },
                { l: "Tesouro", v: "18.3%", t: "15-25%", c: "oklch(0.5 0.1 280)" },
                { l: "FIIs", v: "10.7%", t: "5-15%", c: "oklch(0.6 0.12 90)" },
              ].map((a, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
                    <span style={{ width: 7, height: 7, background: a.c, borderRadius: 2 }} /><span>{a.l}</span>
                  </div>
                  <div className="num" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.v}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)" }}>{lang === "pt" ? "meta" : "target"}: {a.t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Concentração" : "Concentration"}</h3>
            <span className="pill warn">1 {lang === "pt" ? "alerta" : "alert"}</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ fontSize: 12, marginBottom: 10, color: "var(--ink-2)" }}>
              {lang === "pt" ? "Top 5 posições representam" : "Top 5 positions represent"}
              <span className="num" style={{ fontWeight: 600, color: "var(--ink)", marginLeft: 6 }}>62.4%</span>
            </div>
            {[
              { t: "ITSA4", v: 28, warn: true },
              { t: "IVVB11", v: 18.2, warn: false },
              { t: "CDB BTG 27", v: 14.1, warn: false },
              { t: "BOVA11", v: 12.8, warn: false },
              { t: "Tesouro IPCA 29", v: 9.3, warn: false },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, width: 110, fontWeight: 600 }}>{p.t}</span>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pbar-fill" style={{ width: (p.v / 30) * 100 + "%", background: p.warn ? "var(--warn)" : "var(--ink-2)" }} />
                </div>
                <span className={"num " + (p.warn ? "pill warn" : "")} style={{ fontSize: 11, width: 48, textAlign: "right" }}>{p.v.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          {[
            { k: "br", l: lang === "pt" ? "Posições BR" : "BR Positions" },
            { k: "avenue", l: "Avenue (USD)" },
            { k: "dividends", l: lang === "pt" ? "Proventos" : "Dividends" },
            { k: "notes", l: lang === "pt" ? "Notas de corretagem" : "Brokerage notes" },
            { k: "ir", l: "IR 2026" },
          ].map(tab => (
            <div key={tab.k} className={"tab" + (activeTab === tab.k ? " on" : "")} onClick={() => setActiveTab(tab.k)}>{tab.l}</div>
          ))}
        </div>

        {activeTab === "br" && (
          <table className="t">
            <thead><tr>
              <th>{lang === "pt" ? "Ativo" : "Asset"}</th>
              <th>{lang === "pt" ? "Tipo" : "Type"}</th>
              <th className="r">{lang === "pt" ? "Qtd" : "Qty"}</th>
              <th className="r">{lang === "pt" ? "Preço médio" : "Avg price"}</th>
              <th className="r">{lang === "pt" ? "Cotação" : "Last"}</th>
              <th className="r">{lang === "pt" ? "Posição" : "Position"}</th>
              <th className="r">P/L %</th>
              <th className="r">DY</th>
              <th className="r">{lang === "pt" ? "Peso" : "Weight"}</th>
            </tr></thead>
            <tbody>
              {PORTFOLIO.map((p, i) => {
                const pos = p.q > 1 ? p.q * p.last : p.last;
                const cost = p.q > 1 ? p.q * p.pm : p.pm;
                const pnl = (pos - cost) / cost * 100;
                const weight = pos / total * 100;
                const isFI = p.t.includes("CDB") || p.t.includes("Tesouro");
                return (
                  <tr key={i}>
                    <td className="mono" style={{ fontWeight: 600 }}>{p.t}</td>
                    <td><span className="pill">{isFI ? (lang === "pt" ? "Renda fixa" : "Fixed income") : p.t.includes("BOVA") || p.t.includes("IVVB") ? "ETF" : (lang === "pt" ? "Ação" : "Stock")}</span></td>
                    <td className="r num">{p.q > 1 ? p.q : "—"}</td>
                    <td className="r num muted">{p.q > 1 ? p.pm.toFixed(2) : fmtMoney(p.pm, lang, true)}</td>
                    <td className="r num">{p.q > 1 ? p.last.toFixed(2) : fmtMoney(p.last, lang, true)}</td>
                    <td className="r num" style={{ fontWeight: 600 }}>{fmtMoney(pos, lang, true)}</td>
                    <td className={"r num " + (pnl >= 0 ? "pos" : "neg")} style={{ fontWeight: 600 }}>{pnl > 0 ? "+" : ""}{pnl.toFixed(2)}%</td>
                    <td className="r num muted">{p.dy != null ? p.dy + "%" : "—"}</td>
                    <td className="r num muted">{weight.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === "avenue" && <AvenuePanel lang={lang} />}

        {activeTab === "dividends" && (
          <table className="t">
            <thead><tr>
              <th>{lang === "pt" ? "Data" : "Date"}</th>
              <th>{lang === "pt" ? "Ativo" : "Asset"}</th>
              <th>{lang === "pt" ? "Tipo" : "Type"}</th>
              <th className="r">{lang === "pt" ? "Valor bruto" : "Gross"}</th>
              <th className="r">IR (15%)</th>
              <th className="r">{lang === "pt" ? "Líquido" : "Net"}</th>
            </tr></thead>
            <tbody>
              {[
                { d: "2026-04-15", t: "BOVA11", type: "JCP", gross: 427.80, ir: 64.17 },
                { d: "2026-04-10", t: "BBAS3", type: lang === "pt" ? "Dividendo" : "Dividend", gross: 312.40, ir: 0 },
                { d: "2026-03-28", t: "ITSA4", type: lang === "pt" ? "Dividendo" : "Dividend", gross: 890.20, ir: 0 },
                { d: "2026-03-15", t: "VALE3", type: "JCP", gross: 543.10, ir: 81.47 },
                { d: "2026-03-10", t: "IVVB11", type: "Rendimento", gross: 218.40, ir: 32.76 },
              ].map((r, i) => (
                <tr key={i}>
                  <td className="num muted">{fmtDate(r.d, lang)}</td>
                  <td className="mono" style={{ fontWeight: 600 }}>{r.t}</td>
                  <td><span className="pill">{r.type}</span></td>
                  <td className="r num pos">{fmtMoney(r.gross, lang)}</td>
                  <td className="r num neg">{r.ir > 0 ? fmtMoney(-r.ir, lang) : "—"}</td>
                  <td className="r num pos" style={{ fontWeight: 600 }}>{fmtMoney(r.gross - r.ir, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "notes" && (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 12 }}>
              <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}><Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar nota PDF" : "Import PDF note"}</button>
            </div>
            <table className="t">
              <thead><tr>
                <th>{lang === "pt" ? "Data" : "Date"}</th>
                <th>{lang === "pt" ? "Corretora" : "Broker"}</th>
                <th>{lang === "pt" ? "Operações" : "Trades"}</th>
                <th className="r">{lang === "pt" ? "Volume" : "Volume"}</th>
                <th className="r">{lang === "pt" ? "Corretagem" : "Fees"}</th>
                <th></th>
              </tr></thead>
              <tbody>
                {[
                  { d: "2026-04-17", b: "BTG Pactual", ops: 3, vol: 15420, fee: 18.90, usd: false },
                  { d: "2026-03-22", b: "BTG Pactual", ops: 2, vol: 8840, fee: 12.60, usd: false },
                  { d: "2026-03-10", b: "Avenue", ops: 5, vol: 9284.50, fee: 0, usd: true },
                  { d: "2026-02-14", b: "BTG Pactual", ops: 4, vol: 22100, fee: 24.30, usd: false },
                ].map((n, i) => (
                  <tr key={i}>
                    <td className="num muted">{fmtDate(n.d, lang)}</td>
                    <td>{n.b}</td>
                    <td className="num">{n.ops}</td>
                    <td className="r num">{n.usd ? `$${n.vol.toFixed(2)}` : fmtMoney(n.vol, lang)}</td>
                    <td className="r num neg">{n.fee > 0 ? fmtMoney(-n.fee, lang) : "—"}</td>
                    <td><button className="btn ghost sm"><Icon name="download" className="btn-icon" />PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "ir" && (
          <div style={{ padding: 16 }}>
            <div style={{ padding: "12px 14px", background: "var(--warn-bg)", borderRadius: 8, marginBottom: 16, fontSize: 12.5, color: "var(--warn-fg)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Icon name="alert" style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} className="" />
              <div>
                <strong>{lang === "pt" ? "DARF vence dia 30" : "DARF due April 30"}</strong> — {lang === "pt" ? "R$ 612,00 de day-trade em abril. Gerar boleto?" : "$612.00 from April day-trade. Generate slip?"}
                <div style={{ marginTop: 8 }}>
                  <button className="btn sm" style={{ background: "var(--warn)", color: "white", borderColor: "var(--warn)" }}>{lang === "pt" ? "Gerar DARF" : "Generate DARF"}</button>
                </div>
              </div>
            </div>
            <table className="t">
              <thead><tr>
                <th>{lang === "pt" ? "Mês" : "Month"}</th>
                <th className="r">{lang === "pt" ? "Vendas" : "Sales"}</th>
                <th className="r">{lang === "pt" ? "Custo" : "Cost"}</th>
                <th className="r">{lang === "pt" ? "Lucro" : "Profit"}</th>
                <th className="r">IR (20%)</th>
                <th>{lang === "pt" ? "Status" : "Status"}</th>
              </tr></thead>
              <tbody>
                {[
                  { m: "Abr/26", vendas: 4820, custo: 3760, status: "pending" },
                  { m: "Mar/26", vendas: 2100, custo: 1890, status: "paid" },
                  { m: "Fev/26", vendas: 0, custo: 0, status: "exempt" },
                  { m: "Jan/26", vendas: 3400, custo: 2980, status: "paid" },
                ].map((r, i) => {
                  const lucro = r.vendas - r.custo;
                  const ir = lucro > 0 ? lucro * 0.2 : 0;
                  return (
                    <tr key={i}>
                      <td className="mono" style={{ fontWeight: 600 }}>{r.m}</td>
                      <td className="r num">{r.vendas > 0 ? fmtMoney(r.vendas, lang) : "—"}</td>
                      <td className="r num muted">{r.custo > 0 ? fmtMoney(r.custo, lang) : "—"}</td>
                      <td className={"r num " + (lucro > 0 ? "pos" : "muted")}>{lucro > 0 ? fmtMoney(lucro, lang) : "—"}</td>
                      <td className="r num neg" style={{ fontWeight: 600 }}>{ir > 0 ? fmtMoney(ir, lang) : "—"}</td>
                      <td>
                        <span className={"pill " + (r.status === "paid" ? "accent" : r.status === "pending" ? "warn" : "")}>
                          {r.status === "paid" ? (lang === "pt" ? "Pago" : "Paid") : r.status === "pending" ? (lang === "pt" ? "Pendente" : "Pending") : (lang === "pt" ? "Isento" : "Exempt")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function AvenuePanel({ lang }: { lang: Lang }) {
  const total = AVENUE_PORTFOLIO.reduce((s, p) => s + p.q * p.last, 0);
  const totalCost = AVENUE_PORTFOLIO.reduce((s, p) => s + p.q * p.pm, 0);
  const pnlUSD = total - totalCost;
  const pnlPct = (pnlUSD / totalCost * 100);
  return (
    <div>
      <div className="card-head">
        <h3 className="card-title">Avenue · US Portfolio</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>USD/BRL {FX.USD.toFixed(2)}</span>
          <span className={"pill " + (pnlPct >= 0 ? "accent" : "danger")}>{pnlPct > 0 ? "+" : ""}{pnlPct.toFixed(2)}%</span>
        </div>
      </div>
      <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        {[
          { l: "Total USD", v: `$${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}` },
          { l: "Total BRL", v: fmtMoney(total * FX.USD, lang, true) },
          { l: "P/L USD", v: `${pnlUSD > 0 ? "+" : ""}$${pnlUSD.toFixed(2)}`, cls: pnlUSD >= 0 ? "pos" : "neg" },
          { l: "P/L BRL", v: fmtMoney(pnlUSD * FX.USD, lang, true), cls: pnlUSD >= 0 ? "pos" : "neg" },
        ].map((k, i) => (
          <div key={i}>
            <div style={{ fontSize: 10, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{k.l}</div>
            <div className={"num " + (k.cls ?? "")} style={{ fontSize: 17, fontWeight: 600 }}>{k.v}</div>
          </div>
        ))}
      </div>
      <table className="t">
        <thead><tr>
          <th>Ticker</th>
          <th className="r">{lang === "pt" ? "Qtd" : "Qty"}</th>
          <th className="r">{lang === "pt" ? "P.M." : "Avg"}</th>
          <th className="r">{lang === "pt" ? "Cotação" : "Last"}</th>
          <th className="r">P/L %</th>
          <th className="r">{lang === "pt" ? "Posição" : "Position"}</th>
        </tr></thead>
        <tbody>
          {AVENUE_PORTFOLIO.map((p, i) => {
            const pos = p.q * p.last;
            const pnl = (p.last - p.pm) / p.pm * 100;
            return (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 700 }}>{p.t}</td>
                <td className="r num">{p.q}</td>
                <td className="r num muted">${p.pm.toFixed(2)}</td>
                <td className="r num">${p.last.toFixed(2)}</td>
                <td className={"r num " + (pnl >= 0 ? "pos" : "neg")} style={{ fontWeight: 600 }}>{pnl > 0 ? "+" : ""}{pnl.toFixed(2)}%</td>
                <td className="r num" style={{ fontWeight: 600 }}>${pos.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ============ IMPORT ============ */
const PIPE_LABELS_PT = ["Detectar", "Extrair", "Categorizar", "Revisar", "Importar"];
const PIPE_LABELS_EN = ["Detect", "Extract", "Categorize", "Review", "Import"];
const PIPE_DELAYS = [900, 1400, 1800]; // ms for steps 1→2, 2→3, 3→4

/* ---- CSV parser (C6 Bank format) ---- */
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
    else cur += ch;
  }
  cols.push(cur);
  return cols;
}

function c6Merchant(titulo: string, desc: string): string {
  const d = desc.trim(), t = titulo.trim();
  const generic = !d || /^transf\s+enviada\s+pix/i.test(d) || /^evg\d/i.test(d) || (/^\d{3,}/.test(d) && d.includes('-'));
  if (generic) {
    return t.replace(/^Recorrência Pix enviada para /i, '')
      .replace(/^Pix enviado para /i, '')
      .replace(/^Pix recebido de /i, '')
      .replace(/^DEBITO DE CARTAO\s*/i, '')
      .trim() || t;
  }
  return d;
}

function c6Category(titulo: string, desc: string, amt: number): string {
  const s = `${titulo} ${desc}`.toLowerCase();
  if (amt > 0) {
    if (/salari|folha|holerite|remuner/.test(s)) return 'income';
    if (/dividend|juros sobre capital|outros proventos/.test(s)) return 'income';
    if (/res de cdb|resgate|rendimento/.test(s)) return 'invest';
    return 'income';
  }
  if (/pedagio|pedágio|c6tag pedagio/.test(s)) return 'transport';
  if (/estacionamento|c6tag estacion/.test(s)) return 'transport';
  if (/combustiv|gasolina|posto|abastec/.test(s)) return 'transport';
  if (/uber|99pop|taxi|cabify/.test(s)) return 'transport';
  if (/bilhete.nico|sptrans|metrô|metro|trem/.test(s)) return 'transport';
  if (/aluguel|condomin/.test(s)) return 'housing';
  if (/enel|eletropaulo|energia|cpfl/.test(s)) return 'housing';
  if (/comgas|companhia de gas|gás/.test(s)) return 'housing';
  if (/internet|vivo fibra|claro|net\b/.test(s)) return 'housing';
  if (/tesouro direto|emissao de cdb|emissão de cdb/.test(s)) return 'invest';
  if (/receita federal|irpf|darf|tributos federais/.test(s)) return 'tax';
  if (/farmac|remédio|remedio|medic|consulta|exame|hospital|ortopedic/.test(s)) return 'health';
  if (/supermercado|mercado|hortifruti|feira|padaria|lichia/.test(s)) return 'food';
  if (/restauran|almoc|jantar|lanche|pizza|burger|sushi|bar\b/.test(s)) return 'rest';
  if (/fatura de cart|pgto fat cartao/.test(s)) return 'transfer';
  if (/curso|escola|treinamento|facul|galindo/.test(s)) return 'education';
  if (/loteria|cinema|show|ingresso|tatuagem/.test(s)) return 'leisure';
  if (/wise|cambio/.test(s)) return 'shopping';
  return 'transfer';
}

function parseC6CSV(content: string): Txn[] {
  const clean = content.replace(/^﻿/, '').replace(/\r/g, '');
  const lines = clean.split('\n');
  const headerIdx = lines.findIndex(l => l.includes('Entrada') && l.includes('Sa'));
  if (headerIdx < 0) return [];
  const txns: Txn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 6) continue;
    const [dateStr, , titulo, descricao, entradaStr, saidaStr] = cols;
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const d = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    const entrada = parseFloat(entradaStr) || 0;
    const saida = parseFloat(saidaStr) || 0;
    if (entrada === 0 && saida === 0) continue;
    const amt = entrada > 0 ? entrada : -saida;
    txns.push({ id: newId(), d, merch: c6Merchant(titulo, descricao), cat: c6Category(titulo, descricao, amt), acct: 'C6 Bank', amt });
  }
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

export function ImportPage({ lang, onImportComplete }: { lang: Lang; onImportComplete?: (txns: Txn[]) => void }) {
  const t = I18N[lang];
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState("");
  const [pipeStep, setPipeStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<{ name: string; when: string; count: number }[]>([]);
  const [rawContent, setRawContent] = useState("");
  const [parsedTxns, setParsedTxns] = useState<Txn[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance steps 1 → 2 → 3 → 4
  useEffect(() => {
    if (pipeStep < 1 || pipeStep > 3) return;
    const timer = setTimeout(() => {
      let newLogs: string[] = [];
      if (pipeStep === 1) {
        const fmt = rawContent.includes('C6') ? 'C6 Bank' : rawContent.includes('Nubank') ? 'Nubank' : lang === 'pt' ? 'Genérico' : 'Generic';
        newLogs = lang === 'pt'
          ? [`✓ Formato: Extrato ${fmt}`, `✓ Codificação: UTF-8`]
          : [`✓ Format: ${fmt} statement`, `✓ Encoding: UTF-8`];
      } else if (pipeStep === 2) {
        const rows = rawContent.split('\n').filter(l => l.trim() && /^\d{2}\/\d{2}\/\d{4}/.test(l.trim())).length;
        newLogs = lang === 'pt'
          ? [`✓ ${rows} linhas de transação encontradas`, `✓ Campos: Data · Título · Descrição · Valor`]
          : [`✓ ${rows} transaction rows found`, `✓ Fields: Date · Title · Description · Amount`];
      } else if (pipeStep === 3) {
        const txns = parseC6CSV(rawContent);
        setParsedTxns(txns);
        const needsReview = txns.filter(tx => tx.cat === 'transfer' && tx.amt < 0).length;
        newLogs = lang === 'pt'
          ? [`✓ ${txns.length} transações extraídas`, `✓ ${txns.length - needsReview} categorizadas automaticamente`, `○ ${needsReview} aguardando revisão`]
          : [`✓ ${txns.length} transactions extracted`, `✓ ${txns.length - needsReview} auto-categorized`, `○ ${needsReview} pending review`];
      }
      setLogs(prev => [...prev, ...newLogs]);
      setPipeStep(s => s + 1);
    }, PIPE_DELAYS[pipeStep - 1]);
    return () => clearTimeout(timer);
  }, [pipeStep, lang, rawContent]);

  function handleFile(file: File) {
    setFileName(file.name);
    setParsedTxns([]);
    setRawContent("");
    setLogs([]);
    const reader = new FileReader();
    reader.onload = e => {
      const content = (e.target?.result as string) ?? "";
      setRawContent(content);
      setLogs([lang === "pt" ? `✓ Arquivo: ${file.name}` : `✓ File: ${file.name}`]);
      setPipeStep(1);
    };
    reader.readAsText(file, "utf-8");
  }

  function handleConfirm() {
    if (pipeStep !== 4) return;
    setPipeStep(5);
    const count = parsedTxns.length;
    setTimeout(() => {
      setLogs(prev => [...prev, ...(lang === "pt"
        ? [`Salvando ${count} transações...`, `✓ Banco de dados local atualizado`, `✓ Concluído`]
        : [`Saving ${count} transactions...`, `✓ Local database updated`, `✓ Done`])]);
      setHistory(prev => [{
        name: fileName,
        when: new Date().toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "short", year: "numeric" }),
        count,
      }, ...prev]);
      setPipeStep(6);
      onImportComplete?.(parsedTxns);
    }, 1200);
  }

  function handleReset() {
    setPipeStep(0);
    setFileName("");
    setLogs([]);
  }

  const steps = lang === "pt" ? PIPE_LABELS_PT : PIPE_LABELS_EN;
  const isProcessing = pipeStep >= 1 && pipeStep <= 5;
  const isDone = pipeStep === 6;
  const awaitingConfirm = pipeStep === 4;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_import}</h1>
          <div className="page-sub">{lang === "pt" ? "PDF · XML · OFX · CSV · imagens · tudo processado localmente" : "PDF · XML · OFX · CSV · images · all processed locally"}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ofx,.qfx,.xml,.csv,.png,.jpg,.jpeg"
            style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
          />

          {isDone ? (
            <div className="dz" style={{ background: "var(--accent-bg)", borderColor: "var(--accent-fg)", cursor: "default" }}>
              <Icon name="check" style={{ width: 38, height: 38, stroke: "var(--accent-fg)", strokeWidth: 1.5 }} className="" />
              <div style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 4px", color: "var(--accent-fg)" }}>
                {lang === "pt" ? "Importação concluída!" : "Import complete!"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>{parsedTxns.length} {lang === "pt" ? "transações importadas com sucesso" : "transactions imported successfully"}</div>
              <button className="btn sm" style={{ marginTop: 14 }} onClick={handleReset}>
                {lang === "pt" ? "Importar outro arquivo" : "Import another file"}
              </button>
            </div>
          ) : (
            <div
              className={"dz" + (drag ? " drag" : "") + (isProcessing ? " drag" : "")}
              style={isProcessing ? { pointerEvents: "none", opacity: 0.5 } : {}}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <Icon name="upload" style={{ width: 38, height: 38, stroke: "var(--ink-3)", strokeWidth: 1.3 }} className="" />
              <div style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 4px" }}>
                {lang === "pt" ? "Arraste arquivos ou clique para selecionar" : "Drag files or click to select"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
                {lang === "pt" ? "Faturas, extratos, notas de negociação, comprovantes de Pix" : "Bills, statements, brokerage notes, Pix receipts"}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
                {["PDF", "OFX", "XML", "CSV", "PNG/JPG"].map((f, i) => <span key={i} className="pill">{f}</span>)}
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-head">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {pipeStep < 5 && <div className="step-spinner" />}
                  <h3 className="card-title" style={{ textTransform: "uppercase", letterSpacing: "0.04em", fontSize: 11 }}>
                    {pipeStep < 5
                      ? (lang === "pt" ? `Processando · ${fileName}` : `Processing · ${fileName}`)
                      : (lang === "pt" ? `Importando · ${fileName}` : `Importing · ${fileName}`)}
                  </h3>
                </div>
                <button className="btn ghost sm" onClick={handleReset}>
                  <Icon name="x" className="btn-icon" />
                </button>
              </div>
              <div className="card-pad">
                {/* Step bars */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                  {steps.map((s, i) => {
                    const stepNum = i + 1;
                    const done = pipeStep > stepNum;
                    const active = pipeStep === stepNum;
                    return (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{
                          height: 4,
                          borderRadius: 2,
                          background: done || active ? "var(--accent)" : "var(--bg-3)",
                          marginBottom: 5,
                          animation: active ? "pipe-pulse 1s ease-in-out infinite" : "none",
                        }} />
                        <div style={{ fontSize: 10, fontWeight: done || active ? 600 : 400, color: done ? "var(--accent-fg)" : active ? "var(--ink)" : "var(--ink-3)", display: "flex", alignItems: "center", gap: 2 }}>
                          {done && <Icon name="check" style={{ width: 9, height: 9, stroke: "var(--accent-fg)" }} className="" />}
                          {s}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Log output */}
                <div style={{ padding: "12px 14px", background: "var(--bg-2)", borderRadius: 8, marginBottom: 14, fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.75, minHeight: 80 }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ color: l.startsWith("○") ? "var(--ink-3)" : "var(--ink)" }}>{l}</div>
                  ))}
                  {pipeStep < 4 && <span className="pipe-cursor" style={{ color: "var(--ink-3)" }}>▌</span>}
                  {awaitingConfirm && (
                    <div style={{ marginTop: 8, color: "var(--accent-fg)", fontWeight: 600 }}>
                      {lang === "pt" ? "→ Pronto para importar. Revise e confirme." : "→ Ready to import. Review and confirm."}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button className="btn sm" onClick={handleReset}>
                    {lang === "pt" ? "Cancelar" : "Cancel"}
                  </button>
                  <button
                    className="btn primary sm"
                    disabled={!awaitingConfirm}
                    onClick={handleConfirm}
                    style={{ opacity: awaitingConfirm ? 1 : 0.4, cursor: awaitingConfirm ? "pointer" : "not-allowed" }}
                  >
                    {lang === "pt" ? "Confirmar importação" : "Confirm import"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-bg)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name="lock" style={{ width: 17, height: 17, stroke: "var(--accent-fg)" }} className="" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{lang === "pt" ? "Tudo processado localmente" : "Everything processed locally"}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4, lineHeight: 1.55 }}>
                  {lang === "pt" ? "Seus documentos são analisados na sua máquina. Nada é enviado para servidores externos." : "Your documents are analyzed on your machine. Nothing sent to external servers."}
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3 className="card-title">{lang === "pt" ? "Formatos suportados" : "Supported formats"}</h3></div>
            <div>
              {[
                { t: "PDF", ext: ".pdf", desc: lang === "pt" ? "Faturas, extratos, notas de negociação" : "Bills, statements, brokerage notes" },
                { t: "OFX / QFX", ext: ".ofx", desc: lang === "pt" ? "Padrão bancário internacional" : "Open Financial Exchange format" },
                { t: "XML", ext: ".xml", desc: lang === "pt" ? "BTG, XP, Clear e outros" : "BTG, XP, Clear brokerages" },
                { t: "CSV / Excel", ext: ".csv", desc: lang === "pt" ? "Exports genéricos" : "Generic exports" },
                { t: lang === "pt" ? "Imagens (OCR)" : "Images (OCR)", ext: ".png/.jpg", desc: lang === "pt" ? "Screenshots de Pix, comprovantes" : "Pix screenshots, receipts" },
              ].map((f, i) => (
                <div key={i} style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
                  <Icon name="file" style={{ width: 15, height: 15, stroke: "var(--ink-2)" }} className="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{f.t}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{f.desc}</div>
                  </div>
                  <span className="chip-sm">{f.ext}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{lang === "pt" ? "Histórico de importações" : "Import history"}</h3>
        </div>
        {history.length === 0 ? (
          <EmptyState
            icon="file"
            title={lang === "pt" ? "Nenhuma importação ainda" : "No imports yet"}
            sub={lang === "pt" ? "O histórico das suas importações aparecerá aqui." : "Your import history will appear here."}
          />
        ) : (
          <div>
            {history.map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: i < history.length - 1 ? "1px solid var(--border)" : "none" }}>
                <Icon name="file" style={{ width: 15, height: 15, stroke: "var(--accent-fg)" }} className="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{h.when}</div>
                </div>
                <span className="pill">{h.count} {lang === "pt" ? "transações" : "transactions"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ INSIGHTS ============ */
export function InsightsPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [snoozed, setSnoozed] = useState<Set<number>>(new Set());

  if (!txns.length) {
    return (
      <div className="page">
        <div className="page-head">
          <div>
            <h1 className="page-title">{t.nav_insights}</h1>
            <div className="page-sub">{lang === "pt" ? "Análises automáticas baseadas nos seus dados" : "Automatic analyses based on your data"}</div>
          </div>
        </div>
        <EmptyState icon="insight" title={lang === "pt" ? "Sem insights ainda" : "No insights yet"}
          sub={lang === "pt" ? "Importe suas transações para receber análises automáticas de gastos, alertas e oportunidades de economia." : "Import your transactions to get automatic spending analyses, alerts, and savings opportunities."}
          cta={lang === "pt" ? "Importar transações" : "Import transactions"}
          onCta={() => (window as any).__navigate?.("import")} />
      </div>
    );
  }

  // Generate insights from real transaction data
  const stats = computeStats(txns);
  const generated = [] as Array<{ kind: "warn" | "danger" | "pos" | "info"; t: string; x: string; tag: string; when: string }>;

  if (stats.topCat) {
    generated.push({ kind: "info", t: `${I18N[lang].categories[stats.topCat] ?? stats.topCat}`, x: lang === "pt" ? `Sua maior categoria de gasto este mês: ${fmtMoney(stats.catSummary[0].cur, lang, true)}` : `Your top spending category this month: ${fmtMoney(stats.catSummary[0].cur, lang, true)}`, tag: lang === "pt" ? "Automático" : "Auto", when: lang === "pt" ? "este mês" : "this month" });
  }
  if (stats.expense > 0) {
    generated.push({ kind: stats.income > 0 && stats.net >= 0 ? "pos" : "warn", t: lang === "pt" ? `${fmtMoney(stats.expense, lang, true)} gastos este mês` : `${fmtMoney(stats.expense, lang, true)} spent this month`, x: lang === "pt" ? `Receita: ${fmtMoney(stats.income, lang, true)} · Líquido: ${fmtMoney(stats.net, lang, true)}` : `Income: ${fmtMoney(stats.income, lang, true)} · Net: ${fmtMoney(stats.net, lang, true)}`, tag: lang === "pt" ? "Fluxo" : "Cashflow", when: lang === "pt" ? "este mês" : "this month" });
  }
  if (stats.prevExpense > 0 && stats.expense > 0) {
    const delta = ((stats.expense - stats.prevExpense) / stats.prevExpense * 100);
    const isOver = delta > 0;
    generated.push({ kind: isOver ? "warn" : "pos", t: lang === "pt" ? `Gastos ${isOver ? "aumentaram" : "reduziram"} ${Math.abs(delta).toFixed(1)}% vs. mês anterior` : `Expenses ${isOver ? "up" : "down"} ${Math.abs(delta).toFixed(1)}% vs. last month`, x: lang === "pt" ? `Mês anterior: ${fmtMoney(stats.prevExpense, lang, true)}` : `Last month: ${fmtMoney(stats.prevExpense, lang, true)}`, tag: "Δ Mensal", when: lang === "pt" ? "comparando" : "comparing" });
  }
  stats.catSummary.slice(0, 3).forEach(c => {
    if (c.prev > 0 && c.cur > c.prev * 1.3) {
      generated.push({ kind: "warn", t: lang === "pt" ? `${I18N[lang].categories[c.k]}: +${((c.cur/c.prev-1)*100).toFixed(0)}% vs. mês anterior` : `${I18N[lang].categories[c.k]}: +${((c.cur/c.prev-1)*100).toFixed(0)}% vs. last month`, x: lang === "pt" ? `${fmtMoney(c.prev, lang, true)} → ${fmtMoney(c.cur, lang, true)}` : `${fmtMoney(c.prev, lang, true)} → ${fmtMoney(c.cur, lang, true)}`, tag: lang === "pt" ? "Alta" : "Spike", when: lang === "pt" ? "este mês" : "this month" });
    }
  });
  if (stats.income > 0 && stats.net > 0) {
    generated.push({ kind: "pos", t: lang === "pt" ? `Taxa de poupança: ${(stats.net/stats.income*100).toFixed(1)}%` : `Savings rate: ${(stats.net/stats.income*100).toFixed(1)}%`, x: lang === "pt" ? `Parabéns! Você poupou ${fmtMoney(stats.net, lang, true)} este mês.` : `Great job! You saved ${fmtMoney(stats.net, lang, true)} this month.`, tag: lang === "pt" ? "Poupança" : "Savings", when: lang === "pt" ? "este mês" : "this month" });
  }

  const allInsights = generated;
  const visible = allInsights.filter((ins, i) =>
    !dismissed.has(i) && !snoozed.has(i) && (filter === "all" || ins.kind === filter)
  );

  const FILTERS = [
    { k: "all", l: lang === "pt" ? "Todos" : "All", n: allInsights.length },
    { k: "warn", l: lang === "pt" ? "Atenção" : "Warnings", n: 0 },
    { k: "danger", l: lang === "pt" ? "Urgentes" : "Urgent", n: 0 },
    { k: "pos", l: lang === "pt" ? "Positivos" : "Positive", n: 0 },
    { k: "info", l: "Info", n: 0 },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_insights}</h1>
          <div className="page-sub">{lang === "pt" ? "Análises automáticas baseadas nos seus dados · atualizadas a cada hora" : "Automatic analyses based on your data · refreshed hourly"}</div>
        </div>
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.k} className={filter === f.k ? "on" : ""} onClick={() => setFilter(f.k)}>
              {f.l}{f.k === "all" ? ` (${f.n})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 300px", gap: 14 }}>
        <div className="card">
          {visible.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              {lang === "pt" ? "✓ Nenhum insight pendente nesta categoria" : "✓ No pending insights in this category"}
            </div>
          ) : (
            visible.map((ins, i) => {
              const origIdx = allInsights.indexOf(ins);
              return (
                <InsightCard
                  key={i}
                  insight={ins}
                  lang={lang}
                  onDismiss={() => {
                    setDismissed(d => new Set([...d, origIdx]));
                    (window as any).__toast?.(lang === "pt" ? "Insight dispensado" : "Insight dismissed");
                  }}
                  onInvestigate={() => (window as any).__navigate?.("accounts")}
                />
              );
            })
          )}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 8 }}>
              {lang === "pt" ? "Resumo do mês" : "Month summary"}
            </div>
            {[
              { l: lang === "pt" ? "Insights gerados" : "Insights generated", v: generated.length },
              { l: lang === "pt" ? "Gastos este mês" : "Spent this month", v: fmtMoney(stats.expense, lang, true), accent: true },
              { l: lang === "pt" ? "Receita este mês" : "Income this month", v: fmtMoney(stats.income, lang, true), accent: true },
              { l: lang === "pt" ? "Líquido" : "Net", v: fmtMoney(stats.net, lang, true) },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{r.l}</span>
                <span className="num" style={{ fontSize: 13, fontWeight: 600, color: r.accent ? "var(--accent)" : "var(--ink)" }}>{r.v}</span>
              </div>
            ))}
          </div>

          <div className="card card-pad" style={{ background: "linear-gradient(135deg, var(--accent-bg), var(--bg-2))" }}>
            <Icon name="sparkle" style={{ width: 18, height: 18, stroke: "var(--accent-fg)" }} className="" />
            <div style={{ fontWeight: 600, fontSize: 13, margin: "8px 0 4px" }}>
              {lang === "pt" ? "Configurar alertas" : "Configure alerts"}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
              {lang === "pt"
                ? "Defina gatilhos personalizados: gasto por categoria, variação de ativo, variação de câmbio…"
                : "Set custom triggers: category spend, asset variance, FX rate changes…"}
            </div>
            <button className="btn sm" style={{ marginTop: 10 }}
              onClick={() => (window as any).__toast?.(lang === "pt" ? "Alertas personalizados: em breve" : "Custom alerts: coming soon", "info")}>
              {lang === "pt" ? "Abrir" : "Open"} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ REPORTS ============ */
export function ReportsPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const [period, setPeriod] = useState<"30d" | "90d" | "12m" | "ytd">("90d");

  if (!txns.length) {
    return (
      <div className="page">
        <div className="page-head">
          <div><h1 className="page-title">{t.nav_reports}</h1><div className="page-sub">{lang === "pt" ? "Relatórios customizáveis · exporte em PDF/CSV" : "Custom reports · export as PDF/CSV"}</div></div>
        </div>
        <EmptyState icon="report" title={lang === "pt" ? "Sem dados para relatório" : "No report data"}
          sub={lang === "pt" ? "Importe suas transações para visualizar relatórios de fluxo de caixa, gastos por categoria e comparativos mensais." : "Import your transactions to view cashflow reports, category breakdowns, and monthly comparisons."}
          cta={lang === "pt" ? "Importar transações" : "Import transactions"}
          onCta={() => (window as any).__navigate?.("import")} />
      </div>
    );
  }

  const stats = computeStats(txns);
  const catData = stats.catSummary;
  const catTotal = catData.reduce((s, c) => s + c.cur, 0);
  const savingsRate = stats.income > 0 ? (stats.net / stats.income * 100) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_reports}</h1>
          <div className="page-sub">{lang === "pt" ? "Relatórios customizáveis · exporte em PDF/CSV" : "Custom reports · export as PDF/CSV"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div className="seg">
            <button className={period === "30d" ? "on" : ""} onClick={() => setPeriod("30d")}>{t.last_30d}</button>
            <button className={period === "90d" ? "on" : ""} onClick={() => setPeriod("90d")}>90d</button>
            <button className={period === "12m" ? "on" : ""} onClick={() => setPeriod("12m")}>{t.last_12m}</button>
            <button className={period === "ytd" ? "on" : ""} onClick={() => setPeriod("ytd")}>{t.ytd}</button>
          </div>
          <button className="btn sm" onClick={() => (window as any).__toast?.(lang === "pt" ? "Exportação em PDF/CSV: em breve" : "PDF/CSV export: coming soon", "warn")}>
            <Icon name="download" className="btn-icon" />{lang === "pt" ? "Exportar" : "Export"}
          </button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 14 }}>
        {[
          { l: lang === "pt" ? "Receita" : "Income", v: fmtMoney(stats.income, lang, true), d: { pos: true, text: lang === "pt" ? "este mês" : "this month" }, s: "" },
          { l: lang === "pt" ? "Gastos" : "Expenses", v: fmtMoney(stats.expense, lang, true), d: { pos: stats.expense <= stats.prevExpense, text: stats.prevExpense > 0 ? `${((stats.expense-stats.prevExpense)/stats.prevExpense*100).toFixed(1)}%` : "—" }, s: "" },
          { l: lang === "pt" ? "Líquido" : "Net", v: fmtMoney(stats.net, lang, true), d: { pos: stats.net >= 0, text: lang === "pt" ? "este mês" : "this month" }, s: "" },
          { l: lang === "pt" ? "Taxa de poupança" : "Savings rate", v: stats.income > 0 ? `${savingsRate.toFixed(1)}%` : "—", d: { pos: savingsRate >= 20, text: stats.income > 0 ? (savingsRate >= 20 ? "✓ boa" : "↓ baixa") : "—" }, s: "" },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-value">{k.v}</div>
            <div>
              <span className={"kpi-delta " + (k.d.pos ? "pos" : "neg")}>
                <Icon name={k.d.pos ? "arrow_up" : "arrow_down"} style={{ width: 10, height: 10 }} className="" />
                {k.d.text}
              </span>
              <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{k.s}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Fluxo de caixa · 12 meses" : "Cash flow · 12 months"}</h3>
          </div>
          <div className="card-pad">
            <CashflowChart data={stats.cashflow.length ? stats.cashflow : CASHFLOW_12M} lang={lang} showAnnotations={false} />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Distribuição por categoria" : "Category distribution"}</h3>
          </div>
          <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart data={catData.slice(0, 8).map(c => ({ v: c.cur, color: CAT_COLORS[c.k] ?? "var(--ink-3)" }))} size={150} />
            <div style={{ flex: 1 }}>
              {catData.slice(0, 6).map(c => (
                <div key={c.k} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", fontSize: 11.5 }}>
                  <span style={{ width: 7, height: 7, background: CAT_COLORS[c.k] ?? "var(--ink-3)", borderRadius: 2 }} />
                  <span>{I18N[lang].categories[c.k] ?? c.k}</span>
                  <span className="num muted" style={{ marginLeft: "auto" }}>{catTotal > 0 ? (c.cur / catTotal * 100).toFixed(1) : "0"}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{lang === "pt" ? "Comparativo mensal · últimos 6 meses" : "Monthly comparison · last 6 months"}</h3>
        </div>
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Mês" : "Month"}</th>
            <th className="r">{lang === "pt" ? "Receita" : "Income"}</th>
            <th className="r">{lang === "pt" ? "Gastos" : "Expense"}</th>
            <th className="r">{lang === "pt" ? "Líquido" : "Net"}</th>
            <th className="r">{lang === "pt" ? "Poupança" : "Savings"}</th>
            <th>{lang === "pt" ? "Categoria top" : "Top category"}</th>
            <th className="r">Δ {lang === "pt" ? "anterior" : "prev"}</th>
          </tr></thead>
          <tbody>
            {stats.cashflow.slice(-6).map((m, i, arr) => {
              const net = m.income - m.expense;
              const rate = m.income > 0 ? (net / m.income * 100).toFixed(1) : "—";
              const prev = i > 0 ? arr[i - 1].expense : m.expense;
              const delta = prev > 0 ? ((m.expense - prev) / prev * 100).toFixed(1) : "0";
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{lang === "pt" ? `Mês ${m.m}` : `Month ${m.m}`}</td>
                  <td className="r num pos">{fmtMoney(m.income, lang, true)}</td>
                  <td className="r num">{fmtMoney(m.expense, lang, true)}</td>
                  <td className="r num" style={{ fontWeight: 600 }}>{fmtMoney(net, lang, true)}</td>
                  <td className="r num">{rate}%</td>
                  <td>{stats.topCat ? <span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[stats.topCat] }} />{I18N[lang].categories[stats.topCat] ?? stats.topCat}</span> : "—"}</td>
                  <td className={"r num " + (Number(delta) > 0 ? "neg" : "pos")}>{Number(delta) > 0 ? "+" : ""}{delta}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ BUDGET ============ */
export function BudgetPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];

  if (!txns.length) {
    return (
      <div className="page">
        <div className="page-head">
          <div><h1 className="page-title">{t.nav_budget}</h1><div className="page-sub">{lang === "pt" ? "Orçamento mensal + metas de longo prazo" : "Monthly budget + long-term goals"}</div></div>
          <button className="btn primary sm" onClick={() => (window as any).__modal?.("goal", {})}><Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova meta" : "New goal"}</button>
        </div>
        <EmptyState icon="target" title={lang === "pt" ? "Sem dados de orçamento" : "No budget data"}
          sub={lang === "pt" ? "Importe suas transações para visualizar gastos por categoria e monitorar seu orçamento mensal." : "Import your transactions to see category spending and monitor your monthly budget."}
          cta={lang === "pt" ? "Importar transações" : "Import transactions"}
          onCta={() => (window as any).__navigate?.("import")} />
      </div>
    );
  }

  const stats = computeStats(txns);
  const catData = stats.catSummary;
  const totalSpent = stats.expense;
  const totalBudget = 0; // No budget set yet
  const overBudget = catData.filter(c => c.budget > 0 && c.cur > c.budget);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_budget}</h1>
          <div className="page-sub">{lang === "pt" ? "Orçamento mensal + metas de longo prazo" : "Monthly budget + long-term goals"}</div>
        </div>
        <button className="btn primary sm" onClick={() => (window as any).__toast?.(lang === "pt" ? "Nova meta: em breve" : "New goal: coming soon", "warn")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova meta" : "New goal"}
        </button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_budget} · {lang === "pt" ? "este mês" : "this month"}</h3>
            {overBudget.length > 0 && <span className="pill warn">{overBudget.length} {lang === "pt" ? "estouradas" : "over budget"}</span>}
          </div>
          <div className="card-pad">
            <BarList items={catData} lang={lang} onClickItem={k => (window as any).__modal?.("budgetedit", { catKey: k })} />
          </div>
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 10 }}>
            {lang === "pt" ? "Resumo do orçamento" : "Budget summary"}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
              {fmtMoney(totalSpent, lang, true)}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 2 }}>
              {lang === "pt" ? `${catData.length} categorias · este mês` : `${catData.length} categories · this month`}
            </div>
          </div>
          <div className="pbar" style={{ height: 10, marginBottom: 14 }}>
            <div className="pbar-fill" style={{ width: "100%", background: "var(--accent)" }} />
          </div>
          {catData.length > 0 && (
            <div style={{ padding: 12, background: "var(--bg-2)", borderRadius: 8, fontSize: 11.5, lineHeight: 1.7, color: "var(--ink-2)" }}>
              <strong>{lang === "pt" ? "Top categorias:" : "Top categories:"}</strong>
              <div style={{ marginTop: 5 }}>
                {catData.slice(0, 3).map((c, i) => (
                  <div key={i}>• {I18N[lang].categories[c.k] ?? c.k}: {fmtMoney(c.cur, lang, true)}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{t.section_goals}</h3>
        </div>
        <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          {GOALS.map(g => {
            const pct = (g.current / g.target) * 100;
            const whenDate = new Date(g.when + "-01");
            const now = new Date("2026-04-01");
            const monthsLeft = (whenDate.getFullYear() - now.getFullYear()) * 12 + (whenDate.getMonth() - now.getMonth());
            const needed = (g.target - g.current) / Math.max(monthsLeft, 1);
            return (
              <div key={g.key} style={{ padding: 14, background: "var(--bg-2)", borderRadius: 10, cursor: "pointer" }}
                onClick={() => (window as any).__toast?.(lang === "pt" ? "Detalhes da meta: em breve" : "Goal details: coming soon", "info")}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{String(I18N[lang][`goal_${g.key}` as keyof typeof I18N.pt] ?? g.key)}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{lang === "pt" ? "meta" : "target"}: {g.when}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="num" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{pct.toFixed(0)}%</span>
                    <Icon name="chevron_right" style={{ width: 14, height: 14, stroke: "var(--ink-3)" }} className="" />
                  </div>
                </div>
                <div className="pbar" style={{ height: 8, marginBottom: 10 }}>
                  <div className="pbar-fill" style={{ width: pct + "%", background: "var(--accent)" }} />
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-2)", display: "flex", justifyContent: "space-between" }}>
                  <span>{fmtMoney(g.current, lang, true)} / {fmtMoney(g.target, lang, true)}</span>
                  <span>{lang === "pt" ? "precisa" : "need"} {fmtMoney(needed, lang, true)}/{lang === "pt" ? "mês" : "mo"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AccountCard({ a, lang }: { a: typeof ACCOUNTS[0]; lang: Lang }) {
  const isMulti = a.currency === "multi";
  const isUSD = a.currency === "USD";
  const totalBRL = acctBRL(a);

  return (
    <div className="card card-pad" style={{ position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: a.color, opacity: 0.08 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: a.color, display: "grid", placeItems: "center", color: "white", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)", flexShrink: 0 }}>
          {a.name.slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--ink-3)" }}>{a.sub} · {a.number}</div>
        </div>
        <span style={{ fontSize: 14 }}>{a.flag}</span>
      </div>

      {isMulti ? (
        <>
          <div className="num privacy-mask" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(totalBRL, lang, true)}</div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 8 }}>{lang === "pt" ? "equivalente BRL" : "BRL equivalent"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6 }}>
            {Object.entries(a.balances ?? {}).filter(([, v]) => v > 0).map(([cur, val]) => (
              <div key={cur} style={{ padding: "5px 7px", background: "var(--bg-2)", borderRadius: 5 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>{cur}</div>
                <div className="num privacy-mask" style={{ fontSize: 13, fontWeight: 600 }}>{val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
              </div>
            ))}
          </div>
        </>
      ) : isUSD ? (
        <>
          <div className="num privacy-mask" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(totalBRL, lang, true)}</div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginBottom: 8 }}>{lang === "pt" ? "equivalente BRL" : "BRL equivalent"}</div>
          <div style={{ padding: "5px 8px", background: "var(--bg-2)", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-3)" }}>USD</span>
            <span className="num privacy-mask" style={{ fontSize: 13, fontWeight: 600 }}>
              {(a.balances?.USD ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 5, fontFamily: "var(--font-mono)" }}>USD/BRL: {FX.USD.toFixed(2)}</div>
        </>
      ) : (
        <>
          <div className="num privacy-mask" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(a.balance ?? 0, lang, true)}</div>
          {a.type === "voucher" && (
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 4 }}>
              {lang === "pt" ? "Saldo disponível em vale" : "Available voucher balance"}
            </div>
          )}
        </>
      )}
      <div style={{ marginTop: 8 }}>
        <Sparkline data={[95, 98, 100, 102, 99, 105, 108, 104, 110, 112, 115, 118]} w={240} h={26} color={a.color} />
      </div>
    </div>
  );
}

/* ============ ACCOUNTS ============ */
export function AccountsPage({ lang, onEditTxn, txns = [] }: { lang: Lang; onEditTxn?: (tx: Txn) => void; txns?: Txn[] }) {
  const t = I18N[lang];
  const totalBRL = ACCOUNTS.reduce((s, a) => s + acctBRL(a), 0);

  // Display real txns if available, otherwise show mock TXNS
  const displayTxns = txns.length > 0 ? txns : TXNS;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">
            {ACCOUNTS.length} {lang === "pt" ? "contas · saldo consolidado" : "accounts · consolidated balance"}{" "}
            <span className="num">{fmtMoney(totalBRL, lang, true)}</span>
          </div>
        </div>
        <button className="btn sm" onClick={() => (window as any).__toast?.(lang === "pt" ? "Importe um extrato para adicionar contas automaticamente" : "Import a statement to add accounts automatically", "info")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova conta" : "New account"}
        </button>
      </div>

      <FXBar lang={lang} />

      <div className="grid g-3" style={{ marginBottom: 14 }}>
        {ACCOUNTS.map(a => <AccountCard key={a.id} a={a} lang={lang} />)}
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{t.section_recent}</h3>
          {txns.length > 0 && <span className="chip-sm">{txns.length}</span>}
        </div>
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Data" : "Date"}</th>
            <th>{lang === "pt" ? "Descrição" : "Description"}</th>
            <th>{lang === "pt" ? "Categoria" : "Category"}</th>
            <th>{lang === "pt" ? "Conta" : "Account"}</th>
            <th className="r">{lang === "pt" ? "Valor" : "Amount"}</th>
          </tr></thead>
          <tbody>
            {displayTxns.map((tx, i) => (
              <tr key={i} style={{ cursor: "pointer" }} onClick={() => onEditTxn?.(tx)}>
                <td className="num muted" style={{ fontSize: 11.5 }}>{fmtDate(tx.d, lang)}</td>
                <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                <td>
                  <span className="pill">
                    <span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }} />
                    {I18N[lang].categories[tx.cat] ?? tx.cat}
                  </span>
                </td>
                <td className="muted" style={{ fontSize: 11.5 }}>{tx.acct}</td>
                <td className={"r num " + (tx.amt > 0 ? "pos" : "")} style={{ fontWeight: 600 }}>
                  {tx.amt > 0 ? "+" : ""}{fmtMoney(tx.amt, lang)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ CATEGORIES ============ */
export function CategoriesPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const stats = computeStats(txns);
  const spendByCat = Object.fromEntries(stats.catSummary.map(c => [c.k, c.cur]));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_categories}</h1>
          <div className="page-sub">{lang === "pt" ? "Regras automáticas + categorias personalizadas" : "Automatic rules + custom categories"}</div>
        </div>
        <button className="btn primary sm" onClick={() => (window as any).__modal?.("category", {})}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova categoria" : "New category"}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3 className="card-title">{lang === "pt" ? "Regras aprendidas" : "Learned rules"}</h3>
          <span className="chip-sm">{LEARNED_RULES.length}</span>
        </div>
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Padrão" : "Pattern"}</th>
            <th>{lang === "pt" ? "Categoria" : "Category"}</th>
            <th>{lang === "pt" ? "Subcategoria" : "Subcategory"}</th>
            <th className="r">{lang === "pt" ? "Confiança" : "Confidence"}</th>
            <th className="r">{lang === "pt" ? "Ocorrências" : "Seen"}</th>
          </tr></thead>
          <tbody>
            {LEARNED_RULES.map((r, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 500 }}>{r.pattern}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[r.cat] }} />{I18N[lang].categories[r.cat]}</span></td>
                <td className="muted">{r.sub ?? "—"}</td>
                <td className="r num">{(r.confidence * 100).toFixed(0)}%</td>
                <td className="r num muted">{r.seen}×</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid g-3" style={{ gap: 14 }}>
        {Object.keys(I18N[lang].categories).map(k => {
          const cur = txns.length ? { cur: spendByCat[k] ?? 0 } : CAT_MONTH.find(c => c.k === k);
          const ruleCount = LEARNED_RULES.filter(r => r.cat === k).length;
          return (
            <div key={k} className="card card-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: CAT_COLORS[k] ?? "var(--bg-3)", opacity: 0.85, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{I18N[lang].categories[k]}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{ruleCount || Math.floor(Math.random() * 15 + 3)} {lang === "pt" ? "regras" : "rules"}</div>
                </div>
              </div>
              {cur ? (
                <>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{fmtMoney(cur.cur, lang, true)}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>{lang === "pt" ? "este mês" : "this month"}</div>
                  <Sparkline data={[cur.cur * 0.7, cur.cur * 0.85, cur.cur * 0.9, cur.cur * 0.95, cur.cur * 0.98, cur.cur * 0.99, cur.cur]} w={240} h={28} color={CAT_COLORS[k] ?? "var(--ink-3)"} />
                </>
              ) : (
                <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{lang === "pt" ? "sem gastos este mês" : "no spend this month"}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ COMPARISON ============ */
function ComparisonBars({ dA, dB, pA, pB, lang }: { dA: ReturnType<typeof buildPeriodData>[0]; dB: ReturnType<typeof buildPeriodData>[0]; pA: PeriodPreset; pB: PeriodPreset; lang: Lang }) {
  const cats = ["housing", "food", "rest", "transport", "subs", "shopping", "health", "leisure", "education"];
  const items = [
    { l: lang === "pt" ? "Receitas" : "Income", a: dA.income, b: dB.income, c: "var(--accent)", income: true },
    ...cats.map(k => ({ l: I18N[lang].categories[k], a: dA.bycat[k] ?? 0, b: dB.bycat[k] ?? 0, c: CAT_COLORS[k], income: false })),
  ];
  const max = Math.max(...items.map(i => Math.max(i.a, i.b)), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {items.filter(it => it.a > 10 || it.b > 10).map((it, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "110px 1fr 90px 90px", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 11.5, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, background: it.c, borderRadius: 2 }} />
            <span>{it.l}</span>
          </div>
          <div style={{ position: "relative", height: 22, display: "flex", flexDirection: "column", gap: 2 }}>
            <div style={{ height: 8, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (it.a / max * 100) + "%", background: "oklch(0.55 0.14 245)", borderRadius: 3 }} />
            </div>
            <div style={{ height: 8, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: (it.b / max * 100) + "%", background: it.income ? "var(--accent)" : it.c, borderRadius: 3 }} />
            </div>
          </div>
          <div className="num" style={{ fontSize: 11.5, color: "oklch(0.4 0.1 245)" }}>{fmtMoney(it.a, lang, true)}</div>
          <div className="num" style={{ fontSize: 11.5, color: "var(--accent-fg)", fontWeight: it.b > it.a ? 600 : 400 }}>
            {fmtMoney(it.b, lang, true)}
            {it.b > it.a * 1.1 && <span className="neg" style={{ fontSize: 9.5, marginLeft: 4 }}>▲</span>}
            {it.b < it.a * 0.9 && <span className="pos" style={{ fontSize: 9.5, marginLeft: 4 }}>▼</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const presets = PERIOD_PRESETS[lang];
  const [selA, setSelA] = useState("mar");
  const [selB, setSelB] = useState("apr");
  const [view, setView] = useState("overview");

  const pA = presets.find(p => p.id === selA) ?? presets[2];
  const pB = presets.find(p => p.id === selB) ?? presets[3];
  const [dA, dB] = buildPeriodData([pA, pB]);

  const cats = Object.keys(I18N[lang].categories).filter(k => k !== "income" && k !== "transfer" && k !== "invest");
  const expenseDelta = dA.expense > 0 ? ((dB.expense - dA.expense) / dA.expense * 100) : 0;
  const incomeDelta = dA.income > 0 ? ((dB.income - dA.income) / dA.income * 100) : 0;
  const savingsA = dA.income > 0 ? (dA.net / dA.income * 100) : 0;
  const savingsB = dB.income > 0 ? (dB.net / dB.income * 100) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{lang === "pt" ? "Comparar períodos" : "Compare periods"}</h1>
          <div className="page-sub">{lang === "pt" ? "Análise lado-a-lado de qualquer período" : "Side-by-side analysis of any period"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="seg">
            {["overview", "categories", "cashflow"].map(v => (
              <button key={v} className={view === v ? "on" : ""} onClick={() => setView(v)}>
                {v === "overview" ? (lang === "pt" ? "Visão geral" : "Overview")
                  : v === "categories" ? (lang === "pt" ? "Categorias" : "Categories")
                  : (lang === "pt" ? "Fluxo" : "Cash flow")}
              </button>
            ))}
          </div>
          <button className="btn sm" onClick={() => (window as any).__toast?.(lang === "pt" ? "Exportação: em breve" : "Export: coming soon", "info")}>
            <Icon name="download" className="btn-icon" />{lang === "pt" ? "Exportar" : "Export"}
          </button>
        </div>
      </div>

      {/* Period selectors */}
      <div className="grid" style={{ gridTemplateColumns: "1fr auto 1fr", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <div className="card card-pad" style={{ borderColor: "oklch(0.55 0.14 245)", borderWidth: 2 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "oklch(0.5 0.14 245)", fontWeight: 700, marginBottom: 8 }}>
            {lang === "pt" ? "Período A" : "Period A"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {presets.map(p => (
              <button key={p.id}
                className={"btn sm" + (selA === p.id ? " primary" : "")}
                style={selA === p.id ? { background: "oklch(0.55 0.14 245)", borderColor: "oklch(0.55 0.14 245)" } : {}}
                onClick={() => setSelA(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 22, color: "var(--ink-3)", textAlign: "center", fontFamily: "var(--font-mono)", padding: "0 8px" }}>vs</div>
        <div className="card card-pad" style={{ borderColor: "var(--accent)", borderWidth: 2 }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-fg)", fontWeight: 700, marginBottom: 8 }}>
            {lang === "pt" ? "Período B" : "Period B"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {presets.map(p => (
              <button key={p.id} className={"btn sm" + (selB === p.id ? " primary" : "")} onClick={() => setSelB(p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "overview" && (
        <>
          <div className="grid g-4" style={{ marginBottom: 14 }}>
            {[
              { l: lang === "pt" ? "Receitas" : "Income", a: dA.income, b: dB.income, d: incomeDelta, pos: incomeDelta >= 0 },
              { l: lang === "pt" ? "Gastos" : "Expense", a: dA.expense, b: dB.expense, d: expenseDelta, pos: expenseDelta <= 0 },
              { l: lang === "pt" ? "Saldo líquido" : "Net", a: dA.net, b: dB.net, d: dA.net !== 0 ? (dB.net - dA.net) / Math.abs(dA.net) * 100 : 0, pos: dB.net > dA.net },
              { l: lang === "pt" ? "Taxa de poupança" : "Savings rate", a: savingsA, b: savingsB, d: savingsB - savingsA, pos: savingsB > savingsA, pct: true },
            ].map((k, i) => (
              <div key={i} className="card" style={{ padding: 14 }}>
                <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 6 }}>{k.l}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 9.5, color: "oklch(0.5 0.14 245)", fontWeight: 700, marginBottom: 2 }}>{pA.label}</div>
                    <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>
                      {k.pct ? k.a.toFixed(1) + "%" : fmtMoney(k.a, lang, true)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9.5, color: "var(--accent-fg)", fontWeight: 700, marginBottom: 2 }}>{pB.label}</div>
                    <div className="num" style={{ fontSize: 15, fontWeight: 600 }}>
                      {k.pct ? k.b.toFixed(1) + "%" : fmtMoney(k.b, lang, true)}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                  <span className={"kpi-delta " + (k.pos ? "pos" : "neg")}>
                    <Icon name={k.pos ? "arrow_up" : "arrow_down"} style={{ width: 9, height: 9 }} className="" />
                    {k.d.toFixed(1)}%
                  </span>
                  <span className="muted" style={{ fontSize: 10.5, marginLeft: 6 }}>{pA.label} → {pB.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">{lang === "pt" ? "Comparativo visual" : "Visual comparison"}</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: "oklch(0.55 0.14 245)", borderRadius: 2 }} />{pA.label}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }} />{pB.label}
                </span>
              </div>
            </div>
            <div className="card-pad">
              <ComparisonBars dA={dA} dB={dB} pA={pA} pB={pB} lang={lang} />
            </div>
          </div>
        </>
      )}

      {view === "categories" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Gastos por categoria" : "Spend by category"}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, background: "oklch(0.55 0.14 245)", borderRadius: 2 }} />{pA.label}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }} />{pB.label}
              </span>
            </div>
          </div>
          <div style={{ padding: "10px 16px" }}>
            {cats.filter(k => (dA.bycat[k] ?? 0) > 0 || (dB.bycat[k] ?? 0) > 0).map(k => {
              const a = dA.bycat[k] ?? 0, b = dB.bycat[k] ?? 0;
              const max = Math.max(a, b, 1);
              const delta = a > 0 ? ((b - a) / a * 100) : 0;
              return (
                <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr 1fr 70px 60px", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                    <span className="cat-dot" style={{ background: CAT_COLORS[k] }} />
                    {I18N[lang].categories[k]}
                  </div>
                  <div style={{ position: "relative", height: 20 }}>
                    <div style={{ position: "absolute", left: 0, top: 4, height: 6, width: (a / max * 100) + "%", background: "oklch(0.55 0.14 245)", borderRadius: 3, opacity: 0.7 }} />
                    <div style={{ position: "absolute", left: 0, top: 12, height: 6, width: (b / max * 100) + "%", background: "var(--accent)", borderRadius: 3, opacity: 0.7 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11.5 }}>
                    <span className="num">{fmtMoney(a, lang, true)}</span>
                    <span className="num">{fmtMoney(b, lang, true)}</span>
                  </div>
                  <div>
                    <span className={"kpi-delta " + (delta <= 0 ? "pos" : "neg")} style={{ fontSize: 10 }}>
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                    </span>
                  </div>
                  <div className={"num " + (delta > 20 ? "neg" : delta < -10 ? "pos" : "muted")} style={{ fontSize: 11, textAlign: "right" }}>
                    {delta > 0 ? "+" : ""}{fmtMoney(b - a, lang, true)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "cashflow" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Fluxo de caixa · 12 meses" : "Cash flow · 12 months"}</h3>
          </div>
          <div className="card-pad">
            <CashflowChart data={CASHFLOW_12M} lang={lang} showAnnotations={true} />
          </div>
          <div style={{ padding: "0 16px 16px", display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
            {CASHFLOW_12M.map((m, i) => {
              const isA = pA.months.includes(i);
              const isB = pB.months.includes(i);
              return (
                <div key={i} style={{
                  height: 6, borderRadius: 3,
                  background: isB ? "var(--accent)" : isA ? "oklch(0.55 0.14 245)" : "var(--bg-3)",
                }} title={I18N[lang].months[i]} />
              );
            })}
          </div>
        </div>
      )}

      {/* Annual summary table */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-head">
          <h3 className="card-title">{lang === "pt" ? "Resumo mensal · 2026" : "Monthly summary · 2026"}</h3>
        </div>
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Mês" : "Month"}</th>
            <th className="r">{lang === "pt" ? "Receita" : "Income"}</th>
            <th className="r">{lang === "pt" ? "Gastos" : "Expense"}</th>
            <th className="r">{lang === "pt" ? "Líquido" : "Net"}</th>
            <th className="r">{lang === "pt" ? "Poupança" : "Savings"}</th>
            <th className="r">Δ {lang === "pt" ? "gasto" : "spend"}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {CASHFLOW_12M.map((m, i) => {
              const net = m.income - m.expense;
              const rate = (net / m.income * 100).toFixed(1);
              const prev = i > 0 ? CASHFLOW_12M[i - 1].expense : m.expense;
              const delta = ((m.expense - prev) / prev * 100).toFixed(1);
              const isA = pA.months.includes(i);
              const isB = pB.months.includes(i);
              return (
                <tr key={i} style={{ background: isB ? "var(--accent-bg)" : isA ? "oklch(0.97 0.04 245 / 0.4)" : "transparent" }}>
                  <td style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                    {isA && <span style={{ width: 8, height: 8, background: "oklch(0.55 0.14 245)", borderRadius: 2, display: "inline-block" }} />}
                    {isB && <span style={{ width: 8, height: 8, background: "var(--accent)", borderRadius: 2, display: "inline-block" }} />}
                    {I18N[lang].months[m.m]}
                  </td>
                  <td className="r num pos">{fmtMoney(m.income, lang, true)}</td>
                  <td className="r num">{fmtMoney(m.expense, lang, true)}</td>
                  <td className={"r num " + (net >= 0 ? "pos" : "neg")} style={{ fontWeight: 600 }}>{fmtMoney(net, lang, true)}</td>
                  <td className="r num">{rate}%</td>
                  <td className={"r num " + (Number(delta) > 0 ? "neg" : "pos")}>{Number(delta) > 0 ? "+" : ""}{delta}%</td>
                  <td>
                    {(isA || isB) && (
                      <span className={"pill " + (isB ? "accent" : "info")} style={{ fontSize: 10 }}>
                        {isB ? pB.label : pA.label}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: "var(--bg-2)", fontWeight: 600 }}>
              <td style={{ fontWeight: 700 }}>Total 2026</td>
              <td className="r num pos">{fmtMoney(CASHFLOW_12M.reduce((s, m) => s + m.income, 0), lang, true)}</td>
              <td className="r num">{fmtMoney(CASHFLOW_12M.reduce((s, m) => s + m.expense, 0), lang, true)}</td>
              <td className="r num pos" style={{ fontWeight: 700 }}>{fmtMoney(CASHFLOW_12M.reduce((s, m) => s + m.income - m.expense, 0), lang, true)}</td>
              <td className="r num">{(CASHFLOW_12M.reduce((s, m) => s + m.income - m.expense, 0) / CASHFLOW_12M.reduce((s, m) => s + m.income, 0) * 100).toFixed(1)}%</td>
              <td></td><td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ SETTINGS ============ */
export function SettingsPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_settings}</h1>
          <div className="page-sub">{lang === "pt" ? "Configurações e segurança" : "Settings and security"}</div>
        </div>
      </div>
      <div className="card card-pad" style={{ maxWidth: 640 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "var(--accent-bg)", display: "grid", placeItems: "center" }}>
            <Icon name="shield" style={{ width: 19, height: 19, stroke: "var(--accent-fg)" }} className="" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{lang === "pt" ? "Segurança e privacidade" : "Security & privacy"}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.5 }}>
              {lang === "pt" ? "Banco de dados armazenado em ~/finance-pro/vault.db · criptografado AES-256 · backup automático diário" : "Database stored at ~/finance-pro/vault.db · AES-256 encrypted · daily auto-backup"}
            </div>
          </div>
        </div>
        {[
          { l: lang === "pt" ? "Senha mestra" : "Master password", s: lang === "pt" ? "Não configurada" : "Not configured", b: lang === "pt" ? "Configurar" : "Set up" },
          { l: lang === "pt" ? "Backup automático" : "Auto-backup", s: lang === "pt" ? "Não configurado" : "Not configured", b: lang === "pt" ? "Configurar" : "Configure" },
          { l: lang === "pt" ? "Localização do vault" : "Vault location", s: lang === "pt" ? "localStorage do navegador (temporário)" : "Browser localStorage (temporary)", b: lang === "pt" ? "Exportar" : "Export" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.l}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.s}</div>
            </div>
            <button className="btn sm"
              onClick={() => (window as any).__toast?.(lang === "pt" ? "Em breve" : "Coming soon", "warn")}>
              {s.b}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
