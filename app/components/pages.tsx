"use client";

import { useState } from "react";
import { Icon } from "./icons";
import { KPI } from "./dashboard";
import { InsightCard } from "./shell";
import { CashflowChart, DonutChart, BarList, AllocBar, Sparkline } from "./charts";
import {
  I18N, Lang, fmtMoney, fmtDate,
  ACCOUNTS, CARDS, TXNS, INSIGHTS, CAT_MONTH, PORTFOLIO, GOALS, CASHFLOW_12M,
  CAT_COLORS, LEARNED_RULES, Txn,
} from "../lib/data";

/* ============ CARDS ============ */
export function CardsPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  const [selected, setSelected] = useState(CARDS[1]);

  const cardTxns: (Txn & { installment?: string | null })[] = [
    { d: "2026-04-16", merch: "Amazon Brasil", cat: "shopping", acct: "Itaú Click", amt: -489.00, installment: null },
    { d: "2026-04-15", merch: "iFood", cat: "rest", acct: "Itaú Click", amt: -84.50, installment: null },
    { d: "2026-04-14", merch: "Pão de Açúcar", cat: "food", acct: "Itaú Click", amt: -312.45, installment: null },
    { d: "2026-04-13", merch: "Kindle Store", cat: "education", acct: "Itaú Click", amt: -39.90, installment: null },
    { d: "2026-04-12", merch: "Farmácia SP", cat: "health", acct: "Itaú Click", amt: -124.20, installment: null },
    { d: "2026-04-11", merch: "Uber Eats", cat: "rest", acct: "Itaú Click", amt: -45.00, installment: null },
    { d: "2026-04-10", merch: "Shell", cat: "transport", acct: "Itaú Click", amt: -245.00, installment: null },
    { d: "2026-04-09", merch: "Apple.com · iPad 4/12", cat: "shopping", acct: "Itaú Click", amt: -499.00, installment: "4/12" },
    { d: "2026-04-08", merch: "Decolar · Passagem", cat: "leisure", acct: "Itaú Click", amt: -1840.00, installment: "1/6" },
    { d: "2026-04-07", merch: "Cinemark", cat: "leisure", acct: "Itaú Click", amt: -72.00, installment: null },
  ];

  const pct = (selected.used / selected.limit) * 100;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">{CARDS.length} {lang === "pt" ? "cartões ativos" : "active cards"} · {fmtMoney(CARDS.reduce((s, c) => s + c.used, 0), lang, true)} {lang === "pt" ? "em faturas" : "in bills"}</div>
        </div>
        <button className="btn sm"><Icon name="plus" className="btn-icon" />{lang === "pt" ? "Adicionar cartão" : "Add card"}</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {CARDS.map((c) => {
          const p = (c.used / c.limit) * 100;
          const isSel = c.id === selected.id;
          return (
            <div key={c.id} onClick={() => setSelected(c)} className="card" style={{
              minWidth: 260, cursor: "pointer",
              borderColor: isSel ? "var(--ink)" : "var(--border)",
              borderWidth: isSel ? 2 : 1,
              padding: 14, background: c.color, color: "white",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }}></div>
              <div style={{ fontSize: 11, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>{c.brand}</div>
              <div className="mono" style={{ fontSize: 12, opacity: 0.75, marginBottom: 2 }}>•••• {c.last4}</div>
              <div className="num privacy-mask" style={{ fontSize: 19, fontWeight: 600, marginTop: 6 }}>{fmtMoney(c.used, lang, true)}</div>
              <div style={{ fontSize: 10.5, opacity: 0.7, marginBottom: 8 }}>{lang === "pt" ? "de" : "of"} {fmtMoney(c.limit, lang, true)}</div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: p + "%", background: p > 70 ? "#ffb454" : "white" }}></div>
              </div>
              <div className="mono" style={{ fontSize: 10, marginTop: 6, opacity: 0.7, display: "flex", justifyContent: "space-between" }}>
                <span>{lang === "pt" ? "fecha" : "close"} d{c.close}</span>
                <span>{lang === "pt" ? "vence" : "due"} d{c.due}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 6 }}>
            {lang === "pt" ? "Fatura atual" : "Current bill"}
          </div>
          <div className="num" style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(selected.used, lang)}</div>
          <div style={{ marginTop: 10, marginBottom: 6 }}>
            <div className="pbar" style={{ height: 8 }}>
              <div className="pbar-fill" style={{ width: pct + "%", background: pct > 70 ? "var(--warn)" : "var(--ink)" }}></div>
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{pct.toFixed(1)}% {lang === "pt" ? "do limite" : "of limit"}</span>
              <span>{lang === "pt" ? "disponível" : "available"}: {fmtMoney(selected.limit - selected.used, lang, true)}</span>
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
            { l: lang === "pt" ? "Fechamento" : "Closing", d: `d${selected.close}`, sub: lang === "pt" ? "8 dias" : "8 days" },
            { l: lang === "pt" ? "Vencimento" : "Due date", d: `d${selected.due}`, sub: lang === "pt" ? "22 dias" : "22 days" },
            { l: lang === "pt" ? "Parcelas futuras" : "Future installments", d: "7", sub: fmtMoney(3240, lang, true) },
          ].map((e, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? "1px solid var(--border)" : "none" }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{e.l}</div>
                <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{e.sub}</div>
              </div>
              <div className="num" style={{ fontSize: 16, fontWeight: 600 }}>{e.d}</div>
            </div>
          ))}
        </div>
        <div className="card card-pad">
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 10 }}>
            {lang === "pt" ? "Análise da fatura" : "Bill analysis"}
          </div>
          {[
            { l: lang === "pt" ? "Shopping" : "Shopping", v: "38%", c: CAT_COLORS.shopping },
            { l: lang === "pt" ? "Restaurantes" : "Restaurants", v: "22%", c: CAT_COLORS.rest },
            { l: lang === "pt" ? "Alimentação" : "Groceries", v: "18%", c: CAT_COLORS.food },
            { l: lang === "pt" ? "Lazer" : "Leisure", v: "12%", c: CAT_COLORS.leisure },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11.5 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: r.c }}></span>
              <span>{r.l}</span>
              <span className="num" style={{ marginLeft: "auto" }}>{r.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{lang === "pt" ? "Transações · " + selected.brand : "Transactions · " + selected.brand}</h3>
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
            {cardTxns.map((tx, i) => (
              <tr key={i}>
                <td className="num muted">{fmtDate(tx.d, lang)}</td>
                <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>{I18N[lang].categories[tx.cat]}</span></td>
                <td className="mono muted" style={{ fontSize: 11 }}>{tx.installment || "—"}</td>
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
export function InvestPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
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
          <button className="btn sm"><Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar nota" : "Import note"}</button>
          <button className="btn primary sm"><Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova operação" : "New trade"}</button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 14 }}>
        <KPI label={lang === "pt" ? "Patrimônio" : "Total"} value={fmtMoney(total, lang, true)} delta={{ pos: true, text: `+${fmtMoney(total - totalCost, lang, true)}` }} sub={lang === "pt" ? "resultado total" : "total result"} />
        <KPI label={lang === "pt" ? "Rentab. mês" : "Monthly return"} value="+4.12%" delta={{ pos: true, text: "vs CDI: +1.8pp" }} />
        <KPI label={lang === "pt" ? "Proventos 12m" : "Dividends 12m"} value={fmtMoney(8420, lang, true)} delta={{ pos: true, text: "DY: 5.8%" }} />
        <KPI label={lang === "pt" ? "IR a pagar" : "Tax owed"} value={fmtMoney(612, lang, true)} delta={{ pos: false, text: lang === "pt" ? "vence d30" : "due d30" }} sub={lang === "pt" ? "day-trade abril" : "day-trade April"} />
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
                    <span style={{ width: 7, height: 7, background: a.c, borderRadius: 2 }}></span>
                    <span>{a.l}</span>
                  </div>
                  <div className="num" style={{ fontSize: 15, fontWeight: 600, marginTop: 3 }}>{a.v}</div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>{lang === "pt" ? "meta" : "target"}: {a.t}</div>
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
            {[
              { t: "ITSA4", v: 28, warn: true },
              { t: "IVVB11", v: 18.2, warn: false },
              { t: "CDB BTG 27", v: 14.1, warn: false },
              { t: "BOVA11", v: 12.8, warn: false },
              { t: "Tesouro IPCA 29", v: 9.3, warn: false },
            ].map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0" }}>
                <span className="mono" style={{ fontSize: 11.5, width: 110, fontWeight: 600 }}>{p.t}</span>
                <div className="pbar" style={{ flex: 1 }}>
                  <div className="pbar-fill" style={{ width: (p.v / 30) * 100 + "%", background: p.warn ? "var(--warn)" : "var(--ink-2)" }}></div>
                </div>
                <span className={"num " + (p.warn ? "pill warn" : "")} style={{ fontSize: 11, width: 48, textAlign: "right" }}>{p.v.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="tabs">
          <div className="tab on">{lang === "pt" ? "Posições" : "Positions"}</div>
          <div className="tab">{lang === "pt" ? "Operações" : "Trades"}</div>
          <div className="tab">{lang === "pt" ? "Proventos" : "Dividends"}</div>
          <div className="tab">{lang === "pt" ? "Notas de corretagem" : "Brokerage notes"}</div>
          <div className="tab">IR 2026</div>
        </div>
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
              const weight = (pos / total) * 100;
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
                  <td className="r num muted">{p.dy ? p.dy + "%" : "—"}</td>
                  <td className="r num muted">{weight.toFixed(1)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ IMPORT ============ */
export function ImportPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  const [drag, setDrag] = useState(false);
  const [step, setStep] = useState(0);

  const history = [
    { d: "2026-04-15", name: "fatura_nubank_abr2026.pdf", type: "PDF", bank: "Nubank", txns: 47, status: "done" },
    { d: "2026-04-10", name: "extrato_itau_032026.ofx", type: "OFX", bank: "Itaú", txns: 132, status: "done" },
    { d: "2026-04-08", name: "nota_xp_12042026.pdf", type: "PDF", bank: "XP Investimentos", txns: 8, status: "review" },
    { d: "2026-04-02", name: "extrato_btg_032026.xml", type: "XML", bank: "BTG", txns: 24, status: "done" },
    { d: "2026-03-28", name: "screenshot_pix.png", type: "IMG", bank: "—", txns: 1, status: "done" },
  ];

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
          <div className={"dz" + (drag ? " drag" : "")}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); setStep(1); }}
            onClick={() => setStep(1)}
          >
            <Icon name="upload" style={{ width: 38, height: 38, stroke: "var(--ink-3)", strokeWidth: 1.3 }} className="" />
            <div style={{ fontSize: 16, fontWeight: 600, margin: "10px 0 4px" }}>
              {lang === "pt" ? "Arraste arquivos ou clique para selecionar" : "Drag files or click to select"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
              {lang === "pt" ? "Faturas, extratos, notas de negociação, comprovantes de Pix, qualquer coisa" : "Bills, statements, brokerage notes, Pix receipts, anything"}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14, flexWrap: "wrap" }}>
              {["PDF", "OFX", "XML", "CSV", "PNG/JPG", "Screenshot"].map((f, i) => (
                <span key={i} className="pill">{f}</span>
              ))}
            </div>
          </div>

          {step >= 1 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-head">
                <h3 className="card-title">{lang === "pt" ? "Processando · fatura_nubank_abr2026.pdf" : "Processing · fatura_nubank_abr2026.pdf"}</h3>
                <button className="btn ghost sm" onClick={() => setStep(0)}><Icon name="x" className="btn-icon" /></button>
              </div>
              <div className="card-pad">
                <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
                  {["Detectar", "Extrair", "Categorizar", "Revisar", "Importar"].map((s, i) => (
                    <div key={i} style={{ flex: 1 }}>
                      <div style={{ height: 4, borderRadius: 2, background: i < 3 ? "var(--accent)" : "var(--bg-3)", marginBottom: 6 }}></div>
                      <div style={{ fontSize: 10.5, color: i < 3 ? "var(--ink)" : "var(--ink-3)", fontWeight: 500 }}>
                        {i < 3 && <Icon name="check" style={{ width: 10, height: 10, stroke: "var(--accent)", verticalAlign: "middle", marginRight: 3 }} className="" />}
                        {s}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 14, background: "var(--bg-2)", borderRadius: 8, marginBottom: 12, fontFamily: "var(--font-mono)", fontSize: 11.5, lineHeight: 1.6 }}>
                  <div>✓ {lang === "pt" ? "Formato detectado: Nubank · fatura de cartão" : "Format detected: Nubank · credit card bill"}</div>
                  <div>✓ 47 {lang === "pt" ? "transações extraídas" : "transactions extracted"}</div>
                  <div>✓ {lang === "pt" ? "44 categorizadas automaticamente" : "44 auto-categorized"}</div>
                  <div style={{ color: "var(--warn-fg)" }}>⚠ 3 {lang === "pt" ? "precisam de revisão" : "need review"}</div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                  <button className="btn sm" onClick={() => setStep(0)}>{lang === "pt" ? "Cancelar" : "Cancel"}</button>
                  <button className="btn primary sm">{lang === "pt" ? "Importar 47 transações" : "Import 47 transactions"}</button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--accent-bg)", display: "grid", placeItems: "center", color: "var(--accent-fg)" }}>
                <Icon name="lock" style={{ width: 17, height: 17 }} className="" />
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
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Data" : "Date"}</th>
            <th>{lang === "pt" ? "Arquivo" : "File"}</th>
            <th>{lang === "pt" ? "Tipo" : "Type"}</th>
            <th>{lang === "pt" ? "Origem" : "Source"}</th>
            <th className="r">{lang === "pt" ? "Transações" : "Transactions"}</th>
            <th>{lang === "pt" ? "Status" : "Status"}</th>
          </tr></thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i}>
                <td className="num muted">{fmtDate(h.d, lang)}</td>
                <td className="mono" style={{ fontSize: 11.5 }}>{h.name}</td>
                <td><span className="chip-sm">{h.type}</span></td>
                <td>{h.bank}</td>
                <td className="r num">{h.txns}</td>
                <td>
                  <span className={"pill " + (h.status === "done" ? "accent" : "warn") + " dot"}>
                    {h.status === "done" ? (lang === "pt" ? "Importado" : "Imported") : (lang === "pt" ? "Revisar" : "Review")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ INSIGHTS ============ */
export function InsightsPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? INSIGHTS[lang] : INSIGHTS[lang].filter((i) => i.kind === filter);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_insights}</h1>
          <div className="page-sub">{lang === "pt" ? "Análises automáticas baseadas nos seus dados · atualizadas a cada hora" : "Automatic analyses based on your data · refreshed hourly"}</div>
        </div>
        <div className="seg">
          {[
            { k: "all", l: lang === "pt" ? "Todos" : "All", n: INSIGHTS[lang].length },
            { k: "warn", l: lang === "pt" ? "Atenção" : "Warnings" },
            { k: "danger", l: lang === "pt" ? "Urgentes" : "Urgent" },
            { k: "pos", l: lang === "pt" ? "Positivos" : "Positive" },
            { k: "info", l: "Info" },
          ].map((f) => (
            <button key={f.k} className={filter === f.k ? "on" : ""} onClick={() => setFilter(f.k)}>
              {f.l}{f.n ? ` (${f.n})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 320px", gap: 14 }}>
        <div className="card">
          {filtered.map((ins, i) => <InsightCard key={i} insight={ins} lang={lang} />)}
        </div>
        <div>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", fontWeight: 600, marginBottom: 8 }}>
              {lang === "pt" ? "Resumo do mês" : "Month summary"}
            </div>
            {[
              { l: lang === "pt" ? "Alertas gerados" : "Alerts generated", v: 23, c: "var(--ink)" },
              { l: lang === "pt" ? "Ações aplicadas" : "Actions applied", v: 14, c: "var(--accent)" },
              { l: lang === "pt" ? "Economia sugerida" : "Suggested savings", v: "R$ 1.840", c: "var(--accent)" },
              { l: lang === "pt" ? "Tempo poupado" : "Time saved", v: "4.2h", c: "var(--ink-2)" },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{r.l}</span>
                <span className="num" style={{ fontSize: 13, fontWeight: 600, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
          <div className="card card-pad" style={{ background: "linear-gradient(135deg, var(--accent-bg), var(--bg-2))" }}>
            <Icon name="sparkle" style={{ width: 18, height: 18, stroke: "var(--accent-fg)" }} className="" />
            <div style={{ fontWeight: 600, fontSize: 13, margin: "8px 0 4px" }}>{lang === "pt" ? "Configurar alertas" : "Configure alerts"}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.55 }}>
              {lang === "pt" ? "Defina gatilhos personalizados: gasto por categoria, variação de ativo…" : "Set custom triggers: category spend, asset variance, FX rate changes…"}
            </div>
            <button className="btn sm" style={{ marginTop: 10 }}>{lang === "pt" ? "Abrir" : "Open"} →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ REPORTS ============ */
export function ReportsPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_reports}</h1>
          <div className="page-sub">{lang === "pt" ? "Relatórios customizáveis · exporte em PDF/CSV" : "Custom reports · export as PDF/CSV"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div className="seg">
            <button>{t.last_30d}</button>
            <button className="on">90d</button>
            <button>{t.last_12m}</button>
            <button>{t.ytd}</button>
          </div>
          <button className="btn sm"><Icon name="download" className="btn-icon" />{lang === "pt" ? "Exportar" : "Export"}</button>
        </div>
      </div>

      <div className="grid g-4" style={{ marginBottom: 14 }}>
        <KPI label={lang === "pt" ? "Receita total" : "Total income"} value={fmtMoney(58400, lang, true)} delta={{ pos: true, text: "+8.2%" }} sub="90d" />
        <KPI label={lang === "pt" ? "Gastos totais" : "Total expense"} value={fmtMoney(44680, lang, true)} delta={{ pos: false, text: "+14.1%" }} sub="90d" />
        <KPI label={lang === "pt" ? "Saldo líquido" : "Net"} value={fmtMoney(13720, lang, true)} delta={{ pos: false, text: "-12.4%" }} sub="90d" />
        <KPI label={lang === "pt" ? "Taxa de poupança" : "Savings rate"} value="23.5%" delta={{ pos: false, text: "-6.1pp" }} sub="90d" />
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-head"><h3 className="card-title">{lang === "pt" ? "Fluxo de caixa · 12 meses" : "Cash flow · 12 months"}</h3></div>
          <div className="card-pad"><CashflowChart data={CASHFLOW_12M} lang={lang} showAnnotations={false} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3 className="card-title">{lang === "pt" ? "Distribuição por categoria" : "Category distribution"}</h3></div>
          <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <DonutChart data={CAT_MONTH.map((c) => ({ v: c.cur, color: CAT_COLORS[c.k] }))} size={150} />
            <div style={{ flex: 1 }}>
              {CAT_MONTH.slice(0, 6).map((c) => {
                const total = CAT_MONTH.reduce((s, x) => s + x.cur, 0);
                const pct = (c.cur / total) * 100;
                return (
                  <div key={c.k} style={{ display: "flex", alignItems: "center", gap: 7, padding: "3px 0", fontSize: 11.5 }}>
                    <span style={{ width: 7, height: 7, background: CAT_COLORS[c.k], borderRadius: 2 }}></span>
                    <span>{I18N[lang].categories[c.k]}</span>
                    <span className="num muted" style={{ marginLeft: "auto" }}>{pct.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">{lang === "pt" ? "Comparativo mensal · últimos 6 meses" : "Monthly comparison · last 6 months"}</h3></div>
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
            {CASHFLOW_12M.slice(6).map((m, i) => {
              const net = m.income - m.expense;
              const rate = ((net / m.income) * 100).toFixed(1);
              const prev = i > 0 ? CASHFLOW_12M[6 + i - 1].expense : m.expense;
              const delta = (((m.expense - prev) / prev) * 100).toFixed(1);
              return (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{I18N[lang].months[m.m]} / 2026</td>
                  <td className="r num pos">{fmtMoney(m.income, lang, true)}</td>
                  <td className="r num">{fmtMoney(m.expense, lang, true)}</td>
                  <td className="r num" style={{ fontWeight: 600 }}>{fmtMoney(net, lang, true)}</td>
                  <td className="r num">{rate}%</td>
                  <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS.housing }}></span>{I18N[lang].categories.housing}</span></td>
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
export function BudgetPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_budget}</h1>
          <div className="page-sub">{lang === "pt" ? "Orçamento mensal + metas de longo prazo" : "Monthly budget + long-term goals"}</div>
        </div>
        <button className="btn primary sm"><Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova meta" : "New goal"}</button>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{t.section_budget} · {I18N[lang].months[3]}</h3>
            <span className="pill warn">2 {lang === "pt" ? "estouradas" : "over budget"}</span>
          </div>
          <div className="card-pad"><BarList items={CAT_MONTH} lang={lang} /></div>
        </div>
        <div className="card card-pad">
          <div style={{ marginBottom: 14 }}>
            <div className="num" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--ink)" }}>
              {fmtMoney(17240, lang)} / {fmtMoney(13600, lang)}
            </div>
            <div style={{ fontSize: 12, color: "var(--danger)", fontWeight: 500, marginTop: 4 }}>
              {lang === "pt" ? "26.8% acima do orçamento" : "26.8% over budget"}
            </div>
          </div>
          <div className="pbar" style={{ height: 10, marginBottom: 14 }}>
            <div className="pbar-fill" style={{ width: "100%", background: "var(--danger)" }}></div>
          </div>
          <div style={{ padding: 12, background: "var(--warn-bg)", borderRadius: 8, fontSize: 11.5, lineHeight: 1.55, color: "var(--warn-fg)" }}>
            <strong>{lang === "pt" ? "Categorias estouradas:" : "Over-budget categories:"}</strong>
            <div style={{ marginTop: 5 }}>
              • {I18N[lang].categories.rest}: +{fmtMoney(442, lang)} (31%)<br />
              • {I18N[lang].categories.shopping}: +{fmtMoney(1120, lang)} (56%)
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3 className="card-title">{t.section_goals}</h3></div>
        <div className="card-pad" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
          {GOALS.map((g) => {
            const pct = (g.current / g.target) * 100;
            const monthsLeft = (new Date(g.when).getFullYear() - 2026) * 12 + (new Date(g.when).getMonth() - 3);
            const needed = (g.target - g.current) / Math.max(monthsLeft, 1);
            return (
              <div key={g.key} style={{ padding: 14, background: "var(--bg-2)", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{String(I18N[lang][`goal_${g.key}` as keyof typeof I18N.pt] ?? g.key)}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{lang === "pt" ? "meta" : "target"}: {g.when}</div>
                  </div>
                  <span className="num" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{pct.toFixed(0)}%</span>
                </div>
                <div className="pbar" style={{ height: 8, marginBottom: 10 }}>
                  <div className="pbar-fill" style={{ width: pct + "%", background: "var(--accent)" }}></div>
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-2)", display: "flex", justifyContent: "space-between" }}>
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

/* ============ ACCOUNTS ============ */
export function AccountsPage({ lang, onEditTxn }: { lang: Lang; onEditTxn?: (tx: Txn) => void }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">{ACCOUNTS.length} {lang === "pt" ? "contas · saldo consolidado" : "accounts · consolidated balance"} {fmtMoney(ACCOUNTS.reduce((s, a) => s + a.balance, 0), lang, true)}</div>
        </div>
        <button className="btn sm"><Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova conta" : "New account"}</button>
      </div>
      <div className="grid g-3" style={{ marginBottom: 14 }}>
        {ACCOUNTS.map((a) => (
          <div key={a.id} className="card card-pad">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: a.color, display: "grid", placeItems: "center", color: "white", fontSize: 12, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                {a.name.split(" ")[0].slice(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div className="mono muted" style={{ fontSize: 10.5 }}>{a.type} · {a.number}</div>
              </div>
            </div>
            <div className="num" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(a.balance, lang, true)}</div>
            <Sparkline data={[100, 102, 98, 105, 110, 108, 115, 118, 120, 125, 128, 130]} w={240} h={30} color="var(--ink-3)" />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><h3 className="card-title">{t.section_recent}</h3></div>
        <table className="t">
          <thead><tr>
            <th>{lang === "pt" ? "Data" : "Date"}</th>
            <th>{lang === "pt" ? "Descrição" : "Description"}</th>
            <th>{lang === "pt" ? "Categoria" : "Category"}</th>
            <th>{lang === "pt" ? "Conta" : "Account"}</th>
            <th className="r">{lang === "pt" ? "Valor" : "Amount"}</th>
          </tr></thead>
          <tbody>
            {TXNS.map((tx, i) => (
              <tr key={i} onClick={() => onEditTxn && onEditTxn(tx)} style={{ cursor: onEditTxn ? "pointer" : "default" }}>
                <td className="num muted">{fmtDate(tx.d, lang)}</td>
                <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>{I18N[lang].categories[tx.cat]}</span></td>
                <td className="muted">{tx.acct}</td>
                <td className={"r num " + (tx.amt > 0 ? "pos" : "")} style={{ fontWeight: 600 }}>{tx.amt > 0 ? "+" : ""}{fmtMoney(tx.amt, lang)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ CATEGORIES ============ */
function LearnedRulesPanel({ lang }: { lang: Lang }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-head">
        <h3 className="card-title">
          <Icon name="sparkle" style={{ width: 12, height: 12, verticalAlign: "middle", marginRight: 4 }} className="" />
          {lang === "pt" ? "Regras aprendidas" : "Learned rules"}
        </h3>
        <span className="chip-sm">{LEARNED_RULES.length}</span>
      </div>
      <table className="t">
        <thead><tr>
          <th>{lang === "pt" ? "Padrão" : "Pattern"}</th>
          <th>{lang === "pt" ? "Categoria" : "Category"}</th>
          <th>{lang === "pt" ? "Subcategoria" : "Subcategory"}</th>
          <th className="r">{lang === "pt" ? "Confiança" : "Confidence"}</th>
          <th className="r">{lang === "pt" ? "Aplicado" : "Applied"}</th>
        </tr></thead>
        <tbody>
          {LEARNED_RULES.map((r, i) => (
            <tr key={i}>
              <td className="mono" style={{ fontWeight: 600, fontSize: 11.5 }}>{r.pattern}</td>
              <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[r.cat] }}></span>{I18N[lang].categories[r.cat]}</span></td>
              <td className="muted">{r.sub || "—"}</td>
              <td className="r">
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                  <div className="pbar" style={{ width: 60 }}><div className="pbar-fill" style={{ width: (r.confidence * 100) + "%", background: r.confidence > 0.9 ? "var(--accent)" : "var(--warn)" }}></div></div>
                  <span className="num" style={{ fontSize: 11, minWidth: 35 }}>{(r.confidence * 100).toFixed(0)}%</span>
                </div>
              </td>
              <td className="r num muted">{r.seen}×</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CategoriesPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_categories}</h1>
          <div className="page-sub">{lang === "pt" ? "Regras automáticas + categorias personalizadas" : "Automatic rules + custom categories"}</div>
        </div>
        <button className="btn primary sm"><Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova categoria" : "New category"}</button>
      </div>
      <LearnedRulesPanel lang={lang} />
      <div className="grid g-3" style={{ gap: 14 }}>
        {Object.keys(I18N[lang].categories).map((k) => {
          const cur = CAT_MONTH.find((c) => c.k === k);
          return (
            <div key={k} className="card card-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: CAT_COLORS[k] || "var(--bg-3)", opacity: 0.15 }}></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{I18N[lang].categories[k]}</div>
                </div>
              </div>
              {cur && (
                <>
                  <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{fmtMoney(cur.cur, lang, true)}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>{lang === "pt" ? "este mês" : "this month"}</div>
                  <Sparkline data={[cur.prev * 0.8, cur.prev * 0.9, cur.prev, cur.prev * 1.1, cur.cur * 0.95, cur.cur]} w={240} h={28} color={CAT_COLORS[k]} />
                </>
              )}
            </div>
          );
        })}
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
          { l: lang === "pt" ? "Senha mestra" : "Master password", s: lang === "pt" ? "Última alteração há 42 dias" : "Last changed 42 days ago", b: lang === "pt" ? "Alterar" : "Change" },
          { l: lang === "pt" ? "Backup automático" : "Auto-backup", s: lang === "pt" ? "Diário · último: 04:00 hoje" : "Daily · last: 04:00 today", b: lang === "pt" ? "Configurar" : "Configure" },
          { l: lang === "pt" ? "Localização do vault" : "Vault location", s: "~/finance-pro/vault.db", b: lang === "pt" ? "Mover" : "Move" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.l}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.s}</div>
            </div>
            <button className="btn sm">{s.b}</button>
          </div>
        ))}
      </div>
    </div>
  );
}
