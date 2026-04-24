"use client";

import { Icon } from "./icons";
import { Sparkline, CashflowChart, DonutChart, BarList, DailyChart, FXBar } from "./charts";
import { InsightCard } from "./shell";
import {
  I18N, Lang, fmtMoney, fmtDate, CAT_COLORS, Txn,
} from "../lib/data";

/* ─── Stats derived from real txns ──────────────────────────────── */

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
  const prevIncome = prevMo.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const prevExpense = Math.abs(prevMo.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));

  const byCat: Record<string, number> = {};
  const prevByCat: Record<string, number> = {};
  thisMo.filter(t => t.amt < 0 && t.cat).forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amt); });
  prevMo.filter(t => t.amt < 0 && t.cat).forEach(t => { prevByCat[t.cat] = (prevByCat[t.cat] || 0) + Math.abs(t.amt); });

  const catSummary = Object.entries(byCat)
    .map(([k, cur]) => ({ k, cur, prev: prevByCat[k] || 0, budget: 0 }))
    .sort((a, b) => b.cur - a.cur);

  // Cashflow last 12 months
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

  // Accounts derived from txns
  const acctMap: Record<string, number> = {};
  txns.forEach(t => { acctMap[t.acct] = (acctMap[t.acct] ?? 0) + t.amt; });
  const accounts = Object.entries(acctMap)
    .map(([name, balance]) => ({ name, balance }))
    .sort((a, b) => b.balance - a.balance);

  // Daily spend last 30 days
  const daily: number[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const s = d.toISOString().slice(0, 10);
    daily.push(txns.filter(t => t.d === s && t.amt < 0).reduce((sum, t) => sum + Math.abs(t.amt), 0));
  }

  const topCat = catSummary[0]?.k ?? null;
  const net = income - expense;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;

  return { income, expense, prevIncome, prevExpense, net, savingsRate, catSummary, cashflow, topCat, accounts, daily };
}

function pctDelta(curr: number, prev: number) {
  if (prev === 0) return null;
  const pct = ((curr - prev) / prev) * 100;
  return { pos: pct >= 0, text: `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%` };
}

/* ─── KPI card ───────────────────────────────────────────────────── */

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

/* ─── Shared empty micro-state ───────────────────────────────────── */

function MiniEmpty({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ padding: "24px 16px", textAlign: "center" }}>
      <Icon name={icon} style={{ width: 28, height: 28, stroke: "var(--ink-4)", strokeWidth: 1.2, marginBottom: 8 }} className="" />
      <div style={{ fontSize: 12, color: "var(--ink-4)" }}>{label}</div>
    </div>
  );
}

/* ─── Dashboard Classic ──────────────────────────────────────────── */

function DashboardClassic({ lang, txns }: { lang: Lang; txns: Txn[] }) {
  const t = I18N[lang];
  const s = computeStats(txns);
  const incomeSpark = s.cashflow.map(c => c.income);
  const expSpark = s.cashflow.map(c => c.expense);
  const sorted = [...txns].sort((a, b) => b.d.localeCompare(a.d));

  // Simple real insights from stats
  const insights = [];
  if (s.income > 0 && s.expense > s.income) insights.push({ kind: "warn" as const, t: lang === "pt" ? "Gastos acima da receita" : "Expenses exceed income", x: lang === "pt" ? `Você gastou ${fmtMoney(s.expense - s.income, lang, true)} a mais do que recebeu neste mês.` : `You spent ${fmtMoney(s.expense - s.income, lang, true)} more than you earned this month.`, tag: lang === "pt" ? "Atenção" : "Warning", when: lang === "pt" ? "Este mês" : "This month" });
  if (s.topCat) insights.push({ kind: "info" as const, t: lang === "pt" ? `Principal gasto: ${I18N[lang].categories[s.topCat]}` : `Top spend: ${I18N[lang].categories[s.topCat]}`, x: lang === "pt" ? `${I18N[lang].categories[s.topCat]} é a categoria com maior gasto este mês (${fmtMoney(s.catSummary[0]?.cur ?? 0, lang, true)}).` : `${I18N[lang].categories[s.topCat]} is your top expense category this month (${fmtMoney(s.catSummary[0]?.cur ?? 0, lang, true)}).`, tag: lang === "pt" ? "Categoria" : "Category", when: lang === "pt" ? "Este mês" : "This month" });
  if (s.savingsRate > 0) insights.push({ kind: "pos" as const, t: lang === "pt" ? `Taxa de poupança: ${s.savingsRate.toFixed(0)}%` : `Savings rate: ${s.savingsRate.toFixed(0)}%`, x: lang === "pt" ? "Você está poupando parte da sua renda este mês. Continue assim!" : "You are saving a portion of your income this month. Keep it up!", tag: lang === "pt" ? "Poupança" : "Savings", when: lang === "pt" ? "Este mês" : "This month" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid g-4">
        <KPI icon="dollar" label={t.kpi_month_income} value={fmtMoney(s.income, lang, true)} delta={pctDelta(s.income, s.prevIncome)} sub={t.vs_last_month} spark={incomeSpark} sparkColor="var(--accent)" />
        <KPI icon="wallet" label={t.kpi_month_expense} value={fmtMoney(s.expense, lang, true)} delta={s.prevExpense > 0 ? { pos: s.expense <= s.prevExpense, text: `${s.expense <= s.prevExpense ? "" : "+"}${(((s.expense - s.prevExpense) / s.prevExpense) * 100).toFixed(1)}%` } : null} sub={t.vs_last_month} spark={expSpark} sparkColor="var(--ink-3)" />
        <KPI icon="trend" label={t.kpi_savings_rate} value={s.income > 0 ? s.savingsRate.toFixed(1) + "%" : "—"} delta={null} sub={lang === "pt" ? "do salário poupado" : "of income saved"} privacyMask={false} />
        <KPI icon="card" label={lang === "pt" ? "Saldo líquido" : "Net cash"} value={fmtMoney(s.net, lang, true)} delta={null} sub={lang === "pt" ? "receita − despesa" : "income − expense"} sparkColor="var(--warn)" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.8fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_cashflow}</h3>
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
            {s.cashflow.length > 0 ? <CashflowChart data={s.cashflow} lang={lang} /> : <MiniEmpty icon="trend" label={lang === "pt" ? "Sem dados de cashflow" : "No cashflow data"} />}
          </div>
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="card-head">
            <h3 className="card-title">
              <Icon name="sparkle" style={{ width: 12, height: 12, verticalAlign: "middle", marginRight: 4 }} className="" />
              {t.section_insights}
            </h3>
          </div>
          <div style={{ flex: 1, overflow: "auto", maxHeight: 410 }}>
            {insights.length > 0
              ? insights.map((ins, i) => <InsightCard key={i} insight={ins} lang={lang} compact />)
              : <MiniEmpty icon="sparkle" label={lang === "pt" ? "Nenhum insight disponível" : "No insights yet"} />}
          </div>
          <div style={{ padding: 10, borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <button className="btn ghost sm" style={{ width: "100%" }} onClick={() => (window as any).__navigate?.("insights")}>{t.view_all} →</button>
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
            {s.catSummary.length > 0
              ? <BarList items={s.catSummary.slice(0, 7)} lang={lang} />
              : <MiniEmpty icon="tag" label={lang === "pt" ? "Sem gastos este mês" : "No expenses this month"} />}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_accounts}</h3>
            <button className="btn ghost sm" onClick={() => (window as any).__navigate?.("accounts")}>{t.view_all}</button>
          </div>
          <div>
            {s.accounts.length > 0 ? s.accounts.map((a, i) => (
              <div key={i} style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "var(--bg-3)", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</div>
                </div>
                <div className={"num " + (a.balance >= 0 ? "" : "neg")} style={{ fontSize: 12.5, fontWeight: 600 }}>{fmtMoney(a.balance, lang, true)}</div>
              </div>
            )) : <MiniEmpty icon="wallet" label={lang === "pt" ? "Nenhuma conta" : "No accounts"} />}
          </div>
        </div>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_upcoming}</h3>
            <span className="chip-sm">30d</span>
          </div>
          <MiniEmpty icon="clock" label={lang === "pt" ? "Recorrentes: em breve" : "Recurring: coming soon"} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{t.section_recent}</h3>
          <div className="card-actions">
            <button className="btn ghost sm"><Icon name="filter" className="btn-icon" />{lang === "pt" ? "Filtrar" : "Filter"}</button>
            <button className="btn ghost sm" onClick={() => (window as any).__navigate?.("accounts")}>{t.view_all}</button>
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
            {sorted.slice(0, 10).map((tx, i) => (
              <tr key={i} onClick={() => (window as any).__openTxnEdit?.(tx)} style={{ cursor: "pointer" }}>
                <td className="num muted" style={{ fontSize: 11.5 }}>{fmtDate(tx.d, lang)}</td>
                <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>{I18N[lang].categories[tx.cat] ?? tx.cat}</span></td>
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

/* ─── Dashboard Command ──────────────────────────────────────────── */

function DashboardCommand({ lang, txns }: { lang: Lang; txns: Txn[] }) {
  const t = I18N[lang];
  const s = computeStats(txns);
  const sorted = [...txns].sort((a, b) => b.d.localeCompare(a.d));
  const dailyMax = s.daily.length > 0 ? Math.max(...s.daily) : 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="grid g-4" style={{ gap: 10 }}>
        {[
          { l: t.kpi_month_income, v: fmtMoney(s.income, lang, true), d: s.prevIncome > 0 ? pctDelta(s.income, s.prevIncome) : null },
          { l: t.kpi_month_expense, v: fmtMoney(s.expense, lang, true), d: s.prevExpense > 0 ? pctDelta(s.expense, s.prevExpense) : null },
          { l: lang === "pt" ? "Saldo líquido" : "Net cash", v: fmtMoney(s.net, lang, true), d: null },
          { l: t.kpi_savings_rate, v: s.income > 0 ? s.savingsRate.toFixed(1) + "%" : "—", d: null },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: "10px 14px" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-3)", fontWeight: 600 }}>{k.l}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 3 }}>
              <span className="num privacy-mask" style={{ fontSize: 18, fontWeight: 600 }}>{k.v}</span>
              {k.d && <span className={"num " + (k.d.pos ? "pos" : "neg")} style={{ fontSize: 11 }}>{k.d.text}</span>}
            </div>
          </div>
        ))}
      </div>

      <FXBar lang={lang} />

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_accounts}</h3>
            <span className="chip-sm">{s.accounts.length}</span>
          </div>
          {s.accounts.length > 0 ? (
            <table className="t">
              <tbody>
                {s.accounts.map((a, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 11.5 }}>
                      <span style={{ width: 6, height: 6, background: "var(--ink-3)", borderRadius: "50%", display: "inline-block", marginRight: 6 }}></span>
                      {a.name}
                    </td>
                    <td className={"r num " + (a.balance >= 0 ? "" : "neg")} style={{ fontSize: 11.5 }}>{fmtMoney(a.balance, lang, true)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <MiniEmpty icon="wallet" label={lang === "pt" ? "Nenhuma conta" : "No accounts"} />}
        </div>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_categories}</h3>
          </div>
          <div style={{ padding: "10px 14px" }}>
            {s.catSummary.length > 0
              ? <BarList items={s.catSummary.slice(0, 6)} lang={lang} />
              : <MiniEmpty icon="tag" label={lang === "pt" ? "Sem gastos este mês" : "No expenses this month"} />}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr", gap: 10 }}>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{lang === "pt" ? "Gastos diários · 30 dias" : "Daily spend · 30d"}</h3>
            {dailyMax > 0 && <span className="chip-sm">max: {fmtMoney(dailyMax, lang)}</span>}
          </div>
          <div style={{ padding: "10px 14px" }}>
            {s.daily.some(v => v > 0)
              ? <DailyChart data={s.daily} color="var(--ink)" />
              : <MiniEmpty icon="trend" label={lang === "pt" ? "Sem gastos nos últimos 30 dias" : "No spend in the last 30 days"} />}
          </div>
        </div>
        <div className="card">
          <div className="card-head" style={{ padding: "8px 14px" }}>
            <h3 className="card-title" style={{ fontSize: 10.5 }}>{t.section_portfolio}</h3>
          </div>
          <MiniEmpty icon="trend" label={lang === "pt" ? "Portfólio: em breve" : "Portfolio: coming soon"} />
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
            {sorted.slice(0, 15).map((tx, i) => (
              <tr key={i} onClick={() => (window as any).__openTxnEdit?.(tx)} style={{ cursor: "pointer" }}>
                <td className="num muted" style={{ fontSize: 11 }}>{fmtDate(tx.d, lang)}</td>
                <td style={{ fontSize: 11.5 }}>{tx.merch}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>{I18N[lang].categories[tx.cat] ?? tx.cat}</span></td>
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

/* ─── Dashboard Narrative ────────────────────────────────────────── */

function DashboardNarrative({ lang, txns }: { lang: Lang; txns: Txn[] }) {
  const t = I18N[lang];
  const s = computeStats(txns);
  const pt = lang === "pt";

  const insights = [];
  if (s.income > 0 && s.expense > s.income) insights.push({ kind: "warn" as const, t: pt ? "Gastos acima da receita" : "Expenses exceed income", x: pt ? `Você gastou ${fmtMoney(s.expense - s.income, lang, true)} a mais do que recebeu neste mês.` : `You spent ${fmtMoney(s.expense - s.income, lang, true)} more than you earned this month.`, tag: pt ? "Atenção" : "Warning", when: pt ? "Este mês" : "This month" });
  if (s.topCat) insights.push({ kind: "info" as const, t: pt ? `Principal: ${I18N[lang].categories[s.topCat]}` : `Top: ${I18N[lang].categories[s.topCat]}`, x: pt ? `${I18N[lang].categories[s.topCat]} é a categoria com maior gasto este mês.` : `${I18N[lang].categories[s.topCat]} is your top expense category this month.`, tag: pt ? "Categoria" : "Category", when: pt ? "Este mês" : "This month" });
  if (s.savingsRate > 0) insights.push({ kind: "pos" as const, t: pt ? `Poupança: ${s.savingsRate.toFixed(0)}%` : `Savings: ${s.savingsRate.toFixed(0)}%`, x: pt ? "Você está poupando parte da sua renda este mês." : "You are saving a portion of your income this month.", tag: pt ? "Poupança" : "Savings", when: pt ? "Este mês" : "This month" });

  const narrativeSummary = s.income > 0
    ? pt
      ? `Em **${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}**, você recebeu **${fmtMoney(s.income, lang, true)}** e gastou **${fmtMoney(s.expense, lang, true)}**, resultando em um saldo líquido de **${fmtMoney(s.net, lang, true)}**.\n\nTaxa de poupança: **${s.savingsRate.toFixed(1)}%**${s.topCat ? `. Maior gasto: **${I18N[lang].categories[s.topCat]}** (${fmtMoney(s.catSummary[0]?.cur ?? 0, lang, true)})` : ""}.`
      : `In **${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}**, you earned **${fmtMoney(s.income, lang, true)}** and spent **${fmtMoney(s.expense, lang, true)}**, resulting in a net balance of **${fmtMoney(s.net, lang, true)}**.\n\nSavings rate: **${s.savingsRate.toFixed(1)}%**${s.topCat ? `. Top expense: **${I18N[lang].categories[s.topCat]}** (${fmtMoney(s.catSummary[0]?.cur ?? 0, lang, true)})` : ""}.`
    : pt ? "Importe suas transações para ver a análise automática do seu mês." : "Import your transactions to see an automatic analysis of your month.";

  const lines = narrativeSummary.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="grid g-4">
        <KPI icon="dollar" label={t.kpi_month_income} value={fmtMoney(s.income, lang, true)} delta={pctDelta(s.income, s.prevIncome)} sub={t.vs_last_month} spark={s.cashflow.map(c => c.income)} sparkColor="var(--accent)" />
        <KPI icon="wallet" label={t.kpi_month_expense} value={fmtMoney(s.expense, lang, true)} delta={s.prevExpense > 0 ? { pos: s.expense <= s.prevExpense, text: `${s.expense <= s.prevExpense ? "" : "+"}${(((s.expense - s.prevExpense) / s.prevExpense) * 100).toFixed(1)}%` } : null} sub={t.vs_last_month} spark={s.cashflow.map(c => c.expense)} sparkColor="var(--ink-3)" />
        <KPI icon="trend" label={t.kpi_savings_rate} value={s.income > 0 ? s.savingsRate.toFixed(1) + "%" : "—"} delta={null} sub={lang === "pt" ? "do salário poupado" : "of income saved"} privacyMask={false} />
        <KPI icon="card" label={lang === "pt" ? "Saldo líquido" : "Net cash"} value={fmtMoney(s.net, lang, true)} delta={null} sub={lang === "pt" ? "receita − despesa" : "income − expense"} />
      </div>

      <div className="card" style={{ background: "var(--ink)", color: "var(--bg)", border: "none", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)", opacity: 0.25 }}></div>
        <div style={{ padding: "22px 26px", display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 32, position: "relative" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="sparkle" style={{ width: 14, height: 14 }} className="" />
              <span style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.7 }}>
                {pt ? "Análise automática" : "Auto-analysis"} · {new Date().toLocaleDateString(pt ? "pt-BR" : "en-US", { month: "long", year: "numeric" })}
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
              {pt ? "Distribuição de gastos" : "Expense breakdown"}
            </div>
            {s.catSummary.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {s.catSummary.slice(0, 5).map((c, i) => {
                  const pct = s.expense > 0 ? (c.cur / s.expense * 100) : 0;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="cat-dot" style={{ background: CAT_COLORS[c.k] ?? "var(--ink-3)", flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, flex: 1 }}>{I18N[lang].categories[c.k] ?? c.k}</span>
                      <span className="mono" style={{ fontSize: 11, opacity: 0.7 }}>{pct.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontSize: 12, opacity: 0.5 }}>{pt ? "Sem gastos este mês" : "No expenses this month"}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_cashflow}</h3>
          </div>
          <div className="card-pad">
            {s.cashflow.length > 0
              ? <CashflowChart data={s.cashflow} lang={lang} />
              : <MiniEmpty icon="trend" label={pt ? "Sem dados de cashflow" : "No cashflow data"} />}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">{t.section_insights}</h3></div>
          <div>
            {insights.length > 0
              ? insights.map((ins, i) => <InsightCard key={i} insight={ins} lang={lang} compact />)
              : <MiniEmpty icon="sparkle" label={pt ? "Nenhum insight disponível" : "No insights yet"} />}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">{t.section_goals}</h3></div>
        <MiniEmpty icon="target" label={pt ? "Metas: crie sua primeira meta" : "Goals: create your first goal"} />
      </div>
    </div>
  );
}

/* ─── Dashboard root ─────────────────────────────────────────────── */

interface DashboardProps {
  lang: Lang;
  layout: string;
  setLayout: (l: string) => void;
  hasData?: boolean;
  txns?: Txn[];
}
export function Dashboard({ lang, layout, setLayout, hasData = false, txns = [] }: DashboardProps) {
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
          {layout === "classic" && <DashboardClassic lang={lang} txns={txns} />}
          {layout === "command" && <DashboardCommand lang={lang} txns={txns} />}
          {layout === "narrative" && <DashboardNarrative lang={lang} txns={txns} />}
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
            <button className="btn sm" onClick={() => (window as any).__modal?.("newtxn", {})}>
              <Icon name="plus" className="btn-icon" />
              {lang === "pt" ? "Adicionar transação" : "Add transaction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
