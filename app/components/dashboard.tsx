"use client";

import { Icon } from "./icons";
import { Sparkline, CashflowChart, DonutChart, BarList, DailyChart, FXBar } from "./charts";
import { InsightCard } from "./shell";
import {
  I18N, Lang, fmtMoney, fmtDate, acctBRL,
  CASHFLOW_12M, ACCOUNTS, CARDS, TXNS, INSIGHTS, CAT_MONTH, PORTFOLIO, GOALS, UPCOMING, DAILY_30D, NARRATIVE, CAT_COLORS,
} from "../lib/data";

interface KPIProps {
  label: string;
  value: string;
  delta?: { pos: boolean; text: string } | null;
  sub?: string;
  spark?: number[];
  sparkColor?: string;
  icon?: string;
  privacyMask?: boolean;
}
export function KPI({ label, value, delta, sub, spark, sparkColor, icon, privacyMask = true }: KPIProps) {
  return (
    <div className="kpi">
      <div className="kpi-label">
        {icon && <Icon name={icon} style={{ width: 12, height: 12 }} className="" />}
        {label}
      </div>
      <div className={"kpi-value" + (privacyMask ? " privacy-mask" : "")}>{value}</div>
      {delta && (
        <div>
          <span className={"kpi-delta " + (delta.pos ? "pos" : "neg")}>
            <Icon name={delta.pos ? "arrow_up" : "arrow_down"} style={{ width: 10, height: 10 }} className="" />
            {delta.text}
          </span>
          {sub && <span className="muted" style={{ fontSize: 11, marginLeft: 8 }}>{sub}</span>}
        </div>
      )}
      {spark && (
        <div className="kpi-foot">
          <Sparkline data={spark} color={sparkColor || "var(--ink-3)"} w={200} h={28} />
        </div>
      )}
    </div>
  );
}

function KPIRow({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  const spark1 = [280, 285, 292, 298, 305, 308, 312, 318, 325, 331, 338, 342];
  const spark2 = [45, 52, 48, 55, 62, 58, 60, 65, 68, 64, 70, 75];
  const spark3 = [180, 195, 210, 225, 240, 255, 268, 272, 278, 280, 282, 284];
  const spark4 = [12, 14, 13, 15, 18, 16, 17, 20, 22, 19, 21, 23];
  return (
    <div className="grid g-4">
      <KPI icon="dollar" label={t.kpi_networth} value={fmtMoney(342157, lang, true)} delta={{ pos: true, text: "+R$ 8.240 (2.5%)" }} sub={t.vs_last_month} spark={spark1} sparkColor="var(--accent)" />
      <KPI icon="wallet" label={t.kpi_cash} value={fmtMoney(77716, lang, true)} delta={{ pos: false, text: "−R$ 3.120 (3.8%)" }} sub={t.vs_last_month} spark={spark2} sparkColor="var(--ink-3)" />
      <KPI icon="trend" label={t.kpi_invest} value={fmtMoney(284510, lang, true)} delta={{ pos: true, text: "+R$ 11.340 (4.1%)" }} sub={t.vs_last_month} spark={spark3} sparkColor="var(--info)" />
      <KPI icon="card" label={t.kpi_debt} value={fmtMoney(29011, lang, true)} delta={{ pos: false, text: "+R$ 5.920 (25.6%)" }} sub={t.vs_last_month} spark={spark4} sparkColor="var(--warn)" />
    </div>
  );
}

function DashboardClassic({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIRow lang={lang} />
      <div className="grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_cashflow}</h3>
            <div className="card-actions">
              <div className="seg">
                <button className="on">{t.last_12m}</button>
                <button>6m</button>
                <button>3m</button>
              </div>
              <button className="icon-btn"><Icon name="download" style={{ width: 13, height: 13 }} className="" /></button>
            </div>
          </div>
          <div className="card-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 10, fontSize: 11 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--accent)", borderRadius: 2 }}></span>
                <span className="muted">{lang === "pt" ? "Receitas" : "Income"}</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, background: "var(--ink)", borderRadius: 2 }}></span>
                <span className="muted">{lang === "pt" ? "Gastos" : "Expense"}</span>
              </span>
            </div>
            <CashflowChart data={CASHFLOW_12M} lang={lang} />
          </div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-head">
            <h3 className="card-title">
              <Icon name="sparkle" style={{ width: 12, height: 12, verticalAlign: "middle", marginRight: 4 }} className="" />
              {t.section_insights}
            </h3>
            <span className="pill accent">8 {lang === "pt" ? "novos" : "new"}</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", maxHeight: 410 }}>
            {INSIGHTS[lang].slice(0, 4).map((ins, i) => (
              <InsightCard key={i} insight={ins} lang={lang} compact />
            ))}
          </div>
          <div style={{ padding: 10, borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <button className="btn ghost sm" style={{ width: "100%" }}>{t.view_all} →</button>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_categories}</h3>
            <span className="chip-sm">{t.this_month}</span>
          </div>
          <div className="card-pad">
            <BarList items={CAT_MONTH.slice(0, 7)} lang={lang} />
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_accounts}</h3>
            <button className="btn ghost sm">{t.view_all}</button>
          </div>
          <div>
            {ACCOUNTS.map((a) => (
              <div key={a.id} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: a.color, display: "grid", placeItems: "center", color: "white", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  {a.name.split(" ")[0].slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{a.type} · {a.number}</div>
                </div>
                <div className="num" style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtMoney(acctBRL(a), lang, true)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_upcoming}</h3>
            <span className="chip-sm">30d</span>
          </div>
          <div>
            {UPCOMING.map((u, i) => (
              <div key={i} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ minWidth: 42 }}>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1 }}>{new Date(u.d).getDate()}</div>
                  <div className="mono" style={{ fontSize: 9, color: "var(--ink-3)", textTransform: "uppercase" }}>{I18N[lang].months[new Date(u.d).getMonth()]}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.merch}</div>
                  <div style={{ fontSize: 10.5, display: "flex", alignItems: "center", gap: 6 }}>
                    <span className="cat-dot" style={{ background: CAT_COLORS[u.cat] }}></span>
                    <span className="muted">{I18N[lang].categories[u.cat]}</span>
                    {u.warn && <span className="pill warn" style={{ marginLeft: "auto" }}>!</span>}
                  </div>
                </div>
                <div className="num neg" style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtMoney(u.amt, lang, true)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_recent}</h3>
            <div className="card-actions">
              <button className="btn ghost sm"><Icon name="filter" className="btn-icon" />{lang === "pt" ? "Filtrar" : "Filter"}</button>
              <button className="btn ghost sm">{t.view_all}</button>
            </div>
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
              {TXNS.slice(0, 10).map((tx, i) => (
                <tr key={i} onClick={() => { if (typeof window !== "undefined" && window.__openTxnEdit) window.__openTxnEdit(tx); }} style={{ cursor: "pointer" }}>
                  <td className="num muted" style={{ fontSize: 11.5 }}>{fmtDate(tx.d, lang)}</td>
                  <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                  <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>{I18N[lang].categories[tx.cat]}</span></td>
                  <td className="muted" style={{ fontSize: 11.5 }}>{tx.acct}</td>
                  <td className={"r num " + (tx.amt > 0 ? "pos" : "")} style={{ fontWeight: 600 }}>
                    {tx.amt > 0 ? "+" : ""}{fmtMoney(tx.amt, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_portfolio}</h3>
            <span className="pill accent">+4.1% {t.this_month}</span>
          </div>
          <div className="card-pad" style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <DonutChart data={[
              { v: 68000, color: "oklch(0.55 0.14 155)", label: "Ações" },
              { v: 89000, color: "oklch(0.55 0.14 220)", label: "Renda fixa" },
              { v: 45000, color: "oklch(0.65 0.15 30)", label: "ETF" },
              { v: 82000, color: "oklch(0.5 0.1 280)", label: "Tesouro" },
            ]} />
            <div style={{ flex: 1 }}>
              <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(284510, lang, true)}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 10 }}>{lang === "pt" ? "valor total" : "total value"}</div>
              {[
                { c: "oklch(0.55 0.14 155)", l: lang === "pt" ? "Ações" : "Equities", v: "23.9%" },
                { c: "oklch(0.55 0.14 220)", l: "CDB/LCI", v: "31.3%" },
                { c: "oklch(0.65 0.15 30)", l: "ETF", v: "15.8%" },
                { c: "oklch(0.5 0.1 280)", l: "Tesouro", v: "28.8%" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, padding: "3px 0" }}>
                  <span style={{ width: 8, height: 8, background: p.c, borderRadius: 2 }}></span>
                  <span>{p.l}</span>
                  <span className="num" style={{ marginLeft: "auto", color: "var(--ink-2)" }}>{p.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardCommand({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="grid g-4" style={{ gap: 10 }}>
        {[
          { l: t.kpi_networth, v: fmtMoney(342157, lang, true), d: "+2.5%", p: true },
          { l: t.kpi_month_income, v: fmtMoney(18927, lang, true), d: "+2.3%", p: true },
          { l: t.kpi_month_expense, v: fmtMoney(17240, lang, true), d: "+22.3%", p: false },
          { l: t.kpi_savings_rate, v: "8.9%", d: "-12.4%", p: false },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: "10px 14px" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 600 }}>{k.l}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3 }}>
              <span className="num" style={{ fontSize: 18, fontWeight: 600 }}>{k.v}</span>
              <span className={"num " + (k.p ? "pos" : "neg")} style={{ fontSize: 11 }}>{k.d}</span>
            </div>
          </div>
        ))}
      </div>

      <FXBar lang={lang} />

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_accounts}</h3>
            <span className="chip-sm">{ACCOUNTS.length}</span>
          </div>
          <table className="t">
            <tbody>
              {ACCOUNTS.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontSize: 11.5 }}>
                    <span style={{ width: 6, height: 6, background: a.color, borderRadius: "50%", display: "inline-block", marginRight: 6 }}></span>
                    {a.name}
                  </td>
                  <td className="r num" style={{ fontSize: 11.5 }}>{fmtMoney(acctBRL(a), lang, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_cards}</h3>
            <span className="chip-sm">{CARDS.length}</span>
          </div>
          <table className="t">
            <tbody>
              {CARDS.map((c) => {
                const pct = (c.used / c.limit) * 100;
                return (
                  <tr key={c.id}>
                    <td style={{ fontSize: 11.5 }}>{c.brand}<span className="muted mono" style={{ marginLeft: 6, fontSize: 10 }}>*{c.last4}</span></td>
                    <td style={{ width: 60 }}>
                      <div className="pbar" style={{ height: 4 }}><div className="pbar-fill" style={{ width: pct + "%", background: pct > 70 ? "var(--warn)" : "var(--ink-2)" }}></div></div>
                    </td>
                    <td className="r num" style={{ fontSize: 11.5 }}>{fmtMoney(c.used, lang, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_portfolio}</h3>
            <span className="pill accent" style={{ fontSize: 10 }}>+4.1%</span>
          </div>
          <table className="t">
            <thead><tr><th>Ativo</th><th className="r">Qtd</th><th className="r">P/L</th></tr></thead>
            <tbody>
              {PORTFOLIO.slice(0, 6).map((p, i) => {
                const pnl = (p.last - p.pm) / p.pm * 100;
                return (
                  <tr key={i}>
                    <td className="mono" style={{ fontSize: 11.5, fontWeight: 600 }}>{p.t}</td>
                    <td className="r num" style={{ fontSize: 11 }}>{p.q > 1 ? p.q : "—"}</td>
                    <td className={"r num " + (pnl >= 0 ? "pos" : "neg")} style={{ fontSize: 11 }}>{pnl > 0 ? "+" : ""}{pnl.toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{lang === "pt" ? "Gastos diários · 30 dias" : "Daily spend · 30d"}</h3>
            <span className="chip-sm">max: {fmtMoney(890, lang)}</span>
          </div>
          <div style={{ padding: "10px 14px" }}>
            <DailyChart data={DAILY_30D} color="var(--ink)" />
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_categories}</h3>
          </div>
          <div style={{ padding: "10px 14px" }}>
            <BarList items={CAT_MONTH.slice(0, 6)} lang={lang} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head" style={{ padding: "8px 14px" }}>
          <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_recent}</h3>
        </div>
        <table className="t">
          <thead><tr>
            <th style={{ width: 60 }}>{lang === "pt" ? "Data" : "Date"}</th>
            <th>{lang === "pt" ? "Descrição" : "Description"}</th>
            <th style={{ width: 120 }}>{lang === "pt" ? "Categoria" : "Category"}</th>
            <th style={{ width: 110 }}>{lang === "pt" ? "Conta" : "Account"}</th>
            <th className="r" style={{ width: 110 }}>{lang === "pt" ? "Valor" : "Amount"}</th>
          </tr></thead>
          <tbody>
            {TXNS.map((tx, i) => (
              <tr key={i} onClick={() => { if (typeof window !== "undefined" && window.__openTxnEdit) window.__openTxnEdit(tx); }} style={{ cursor: "pointer" }}>
                <td className="num muted" style={{ fontSize: 11 }}>{fmtDate(tx.d, lang)}</td>
                <td style={{ fontSize: 11.5 }}>{tx.merch}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>{I18N[lang].categories[tx.cat]}</span></td>
                <td className="muted" style={{ fontSize: 11 }}>{tx.acct}</td>
                <td className={"r num " + (tx.amt > 0 ? "pos" : "")} style={{ fontSize: 11.5, fontWeight: 600 }}>
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

function DashboardNarrative({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  const narrative = NARRATIVE[lang];
  const lines = narrative.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <KPIRow lang={lang} />
      <div className="card" style={{ background: "var(--ink)", color: "var(--bg)", border: "none", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", opacity: 0.25 }}></div>
        <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="sparkle" style={{ width: 14, height: 14 }} className="" />
              <span style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.7 }}>
                {lang === "pt" ? "Análise automática · abril/2026" : "Auto-analysis · April 2026"}
              </span>
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 14px", lineHeight: 1.2 }}>
              {t.narrative_title}
            </h2>
            <div style={{ fontSize: 13, lineHeight: 1.65, opacity: 0.85 }}>
              {lines.map((ln, i) => {
                if (!ln.trim()) return <br key={i} />;
                const parts = ln.split(/\*\*(.+?)\*\*/g);
                return (
                  <div key={i} style={{ marginBottom: 4 }}>
                    {parts.map((p, j) => j % 2 === 1
                      ? <strong key={j} style={{ color: "white", fontWeight: 600 }}>{p}</strong>
                      : p)}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.7, marginBottom: 14 }}>
              {lang === "pt" ? "Ações sugeridas" : "Suggested actions"}
            </div>
            {[
              { t: lang === "pt" ? "Adiantar R$ 2.500 Itaú" : "Advance $2,500 Itaú", s: lang === "pt" ? "Evita juros de R$ 312" : "Avoids $312 interest", k: "zap" },
              { t: lang === "pt" ? "Cancelar Netflix duplicado" : "Cancel duplicate Netflix", s: lang === "pt" ? "Economia: R$ 671/ano" : "Saves $671/year", k: "x" },
              { t: lang === "pt" ? "Rebalancear ITSA4" : "Rebalance ITSA4", s: lang === "pt" ? "Reduzir de 28% → 15%" : "Reduce from 28% → 15%", k: "refresh" },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <Icon name={a.k} style={{ width: 13, height: 13, stroke: "white" }} className="" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.t}</div>
                  <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{a.s}</div>
                </div>
                <button className="btn sm" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white" }}>{t.apply}</button>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 12, background: "rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 11, opacity: 0.85, fontFamily: "var(--font-mono)", lineHeight: 1.55 }}>
              <strong style={{ fontWeight: 600 }}>{lang === "pt" ? "Resumo:" : "Summary:"}</strong> {lang === "pt" ? "Gastos 22.3% acima · Dividendos 18% acima · Poupança em 27% (meta: 30%)" : "Spend 22.3% above · Dividends 18% above · Savings at 27% (goal: 30%)"}
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_cashflow}</h3>
            <div className="card-actions">
              <div className="seg"><button className="on">{t.last_12m}</button><button>6m</button></div>
            </div>
          </div>
          <div className="card-pad"><CashflowChart data={CASHFLOW_12M} lang={lang} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">{t.section_insights}</h3></div>
          <div>{INSIGHTS[lang].slice(0, 4).map((ins, i) => <InsightCard key={i} insight={ins} lang={lang} compact />)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">{t.section_goals}</h3></div>
        <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          {GOALS.map((g) => {
            const pct = (g.current / g.target) * 100;
            return (
              <div key={g.key}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{String(I18N[lang][`goal_${g.key}` as keyof typeof I18N.pt] ?? g.key)}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)", marginBottom: 8 }}>{fmtMoney(g.current, lang, true)} / {fmtMoney(g.target, lang, true)}</div>
                <div className="pbar"><div className="pbar-fill" style={{ width: pct + "%", background: "var(--accent)" }}></div></div>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 6, fontFamily: "var(--font-mono)" }}>{pct.toFixed(0)}% · {lang === "pt" ? "meta" : "due"} {g.when}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface DashboardProps {
  lang: Lang;
  layout: string;
  setLayout: (l: string) => void;
  hasData?: boolean;
}
export function Dashboard({ lang, layout, setLayout, hasData = false }: DashboardProps) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_dashboard}</h1>
          <div className="page-sub">
            {new Date().toLocaleDateString(lang === "pt" ? "pt-BR" : "en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <div className="seg">
            <button className={layout === "classic" ? "on" : ""} onClick={() => setLayout("classic")}>{t.layout_classic}</button>
            <button className={layout === "command" ? "on" : ""} onClick={() => setLayout("command")}>{t.layout_command}</button>
            <button className={layout === "narrative" ? "on" : ""} onClick={() => setLayout("narrative")}>{t.layout_narrative}</button>
          </div>
        </div>
      </div>
      {hasData ? (
        <>
          {layout === "classic" && <DashboardClassic lang={lang} />}
          {layout === "command" && <DashboardCommand lang={lang} />}
          {layout === "narrative" && <DashboardNarrative lang={lang} />}
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
          <Icon name="dashboard" style={{ width: 48, height: 48, stroke: "var(--ink-3)", strokeWidth: 1.1, marginBottom: 18 }} className="" />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
            {lang === "pt" ? "Nenhum dado ainda" : "No data yet"}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 340, lineHeight: 1.65 }}>
            {lang === "pt"
              ? "Importe um extrato, fatura ou nota de negociação para começar a ver seu painel financeiro."
              : "Import a statement, bill, or brokerage note to start seeing your financial dashboard."}
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button className="btn primary sm" onClick={() => (window as any).__navigate?.("import")}>
              <Icon name="upload" className="btn-icon" />
              {lang === "pt" ? "Importar documento" : "Import document"}
            </button>
            <button className="btn sm" onClick={() => (window as any).__openTxnEdit?.({ d: new Date().toISOString().slice(0, 10), merch: "", cat: "", acct: "", amt: 0 })}>
              <Icon name="plus" className="btn-icon" />
              {lang === "pt" ? "Adicionar transação" : "Add transaction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
