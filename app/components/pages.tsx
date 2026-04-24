"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, fmtMoney, fmtDate, CAT_COLORS, Txn, PERIOD_PRESETS, PeriodPreset, newId } from "../lib/data";

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
import { Sparkline, DonutChart, CashflowChart, BarList } from "./charts";

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


/* ============ CARDS ============ */

// Available months from txns set, sorted descending
function availableMonths(txns: Txn[]): string[] {
  const set = new Set(txns.map(t => t.d.slice(0, 7)));
  return [...set].sort((a, b) => b.localeCompare(a));
}

function monthLabel(ym: string, lang: Lang): string {
  const [y, m] = ym.split('-');
  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
  return d.toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { month: 'long', year: 'numeric' });
}

export function CardsPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const pt = lang === 'pt';
  const months = availableMonths(txns);
  const [selMonth, setSelMonth] = useState(months[0] ?? '');
  const [selAcct, setSelAcct] = useState('all');
  const [search, setSearch] = useState('');

  // Sync selMonth when txns change (e.g. first import)
  useEffect(() => {
    if (!selMonth && months.length > 0) setSelMonth(months[0]);
  }, [months.length]);

  if (!txns.length) return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">{pt ? "Sem transações importadas" : "No transactions imported yet"}</div>
        </div>
        <button className="btn primary sm" onClick={() => (window as any).__navigate?.("import")}>
          <Icon name="upload" className="btn-icon" />{pt ? "Importar fatura" : "Import statement"}
        </button>
      </div>
      <EmptyState icon="card" title={pt ? "Nenhuma fatura ainda" : "No statements yet"} sub={pt ? "Importe uma fatura CSV do seu cartão (C6, Nubank, OFX…) para ver seus gastos aqui." : "Import a credit card statement (CSV, OFX…) to see your spending here."} cta={pt ? "Importar fatura" : "Import statement"} onCta={() => (window as any).__navigate?.("import")} />
    </div>
  );

  // Accounts derived from txns
  const allAccts = [...new Set(txns.map(t => t.acct))].sort();

  // Filtered by month and account
  const inMonth = selMonth ? txns.filter(t => t.d.startsWith(selMonth)) : txns;
  const inAcct = selAcct === 'all' ? inMonth : inMonth.filter(t => t.acct === selAcct);
  const filtered = search
    ? inAcct.filter(t => t.merch.toLowerCase().includes(search.toLowerCase()) || (t.cat + t.sub).toLowerCase().includes(search.toLowerCase()))
    : inAcct;

  // Per-account summary for selected month
  const acctSummary = allAccts.map(name => {
    const rows = inMonth.filter(t => t.acct === name && t.amt < 0);
    const total = rows.reduce((s, t) => s + Math.abs(t.amt), 0);
    const count = rows.length;
    return { name, total, count };
  }).filter(a => a.count > 0).sort((a, b) => b.total - a.total);

  // Category breakdown for filtered view
  const byCat: Record<string, number> = {};
  inAcct.filter(t => t.amt < 0).forEach(t => { byCat[t.cat] = (byCat[t.cat] ?? 0) + Math.abs(t.amt); });
  const catBreakdown = Object.entries(byCat).map(([k, v]) => ({ k, cur: v, prev: 0, budget: 0 })).sort((a, b) => b.cur - a.cur);

  const totalExpense = filtered.filter(t => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
  const totalIncome = filtered.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">{selMonth ? monthLabel(selMonth, lang) : ''} · {allAccts.length} {pt ? 'cartões / contas' : 'cards / accounts'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn sm" onClick={() => (window as any).__modal?.('export', {})}>
            <Icon name="download" className="btn-icon" />{pt ? 'Exportar' : 'Export'}
          </button>
          <button className="btn primary sm" onClick={() => (window as any).__navigate?.('import')}>
            <Icon name="upload" className="btn-icon" />{pt ? 'Importar fatura' : 'Import statement'}
          </button>
        </div>
      </div>

      {/* Account summary cards */}
      {acctSummary.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
          {/* "All" pill */}
          <div
            onClick={() => setSelAcct('all')}
            style={{ flexShrink: 0, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${selAcct === 'all' ? 'var(--ink)' : 'var(--border)'}`, background: selAcct === 'all' ? 'var(--bg-3)' : 'var(--surface)', cursor: 'pointer', minWidth: 130 }}
          >
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600 }}>{pt ? 'Todos' : 'All'}</div>
            <div className="num privacy-mask" style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}>{fmtMoney(acctSummary.reduce((s, a) => s + a.total, 0), lang, true)}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{acctSummary.reduce((s, a) => s + a.count, 0)} {pt ? 'transações' : 'transactions'}</div>
          </div>
          {acctSummary.map(a => (
            <div
              key={a.name}
              onClick={() => setSelAcct(selAcct === a.name ? 'all' : a.name)}
              style={{ flexShrink: 0, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${selAcct === a.name ? 'var(--ink)' : 'var(--border)'}`, background: selAcct === a.name ? 'var(--bg-3)' : 'var(--surface)', cursor: 'pointer', minWidth: 160 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700, color: 'white' }}>
                  {a.name.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
              </div>
              <div className="num neg privacy-mask" style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(a.total, lang, true)}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{a.count} {pt ? 'transações' : 'transactions'}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, marginBottom: 14 }}>
        {/* Category breakdown */}
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{pt ? 'Gastos por categoria' : 'Spending by category'}</h3>
            <span className="chip-sm">{selMonth ? monthLabel(selMonth, lang) : pt ? 'Total' : 'All time'}</span>
          </div>
          <div className="card-pad">
            {catBreakdown.length > 0
              ? <BarList items={catBreakdown.slice(0, 8)} lang={lang} />
              : <div style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center', padding: 24 }}>{pt ? 'Sem gastos neste período' : 'No expenses in this period'}</div>}
          </div>
        </div>
        {/* Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 180 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 4 }}>{pt ? 'Total gasto' : 'Total spent'}</div>
            <div className="num neg privacy-mask" style={{ fontSize: 22, fontWeight: 700 }}>{fmtMoney(totalExpense, lang, true)}</div>
          </div>
          {totalIncome > 0 && (
            <div className="card card-pad">
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 4 }}>{pt ? 'Créditos / estornos' : 'Credits / refunds'}</div>
              <div className="num pos privacy-mask" style={{ fontSize: 22, fontWeight: 700 }}>+{fmtMoney(totalIncome, lang, true)}</div>
            </div>
          )}
          <div className="card card-pad">
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 4 }}>{pt ? 'Transações' : 'Transactions'}</div>
            <div className="num" style={{ fontSize: 22, fontWeight: 700 }}>{filtered.length}</div>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Icon name="search" style={{ width: 13, height: 13, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', stroke: 'var(--ink-3)' }} className="" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={pt ? 'Buscar estabelecimento…' : 'Search merchant…'}
            style={{ width: '100%', paddingLeft: 30, paddingRight: 10, height: 34, border: '1px solid var(--border-2)', borderRadius: 8, fontSize: 13, background: 'var(--bg-2)', color: 'var(--ink)', boxSizing: 'border-box' }}
          />
        </div>
        {months.length > 0 && (
          <select
            value={selMonth}
            onChange={e => setSelMonth(e.target.value)}
            className="field"
            style={{ height: 34, fontSize: 13, padding: '0 10px', flexShrink: 0 }}
          >
            {months.map(m => <option key={m} value={m}>{monthLabel(m, lang)}</option>)}
          </select>
        )}
        {selAcct !== 'all' && (
          <button className="pill" style={{ cursor: 'pointer', background: 'var(--bg-3)', border: '1px solid var(--border)', padding: '4px 10px' }} onClick={() => setSelAcct('all')}>
            {selAcct} ×
          </button>
        )}
        {search && (
          <button className="btn ghost sm" onClick={() => setSearch('')}>
            {pt ? 'Limpar' : 'Clear'}
          </button>
        )}
      </div>

      {/* Transactions table */}
      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{pt ? 'Transações' : 'Transactions'}</h3>
          <span className="chip-sm">{filtered.length}</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
            {pt ? 'Nenhuma transação encontrada' : 'No transactions found'}
          </div>
        ) : (
          <table className="t">
            <thead><tr>
              <th>{pt ? 'Data' : 'Date'}</th>
              <th>{pt ? 'Estabelecimento' : 'Merchant'}</th>
              <th>{pt ? 'Categoria' : 'Category'}</th>
              <th>{pt ? 'Conta' : 'Account'}</th>
              <th>{pt ? 'Parcela' : 'Installment'}</th>
              <th className="r">{pt ? 'Valor' : 'Amount'}</th>
            </tr></thead>
            <tbody>
              {filtered.map((tx, i) => (
                <tr key={i} onClick={() => (window as any).__openTxnEdit?.(tx)} style={{ cursor: 'pointer' }}>
                  <td className="num muted" style={{ fontSize: 11.5 }}>{fmtDate(tx.d, lang)}</td>
                  <td style={{ fontWeight: 500 }}>{tx.merch}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span className="pill">
                        <span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }} />
                        {I18N[lang].categories[tx.cat] ?? tx.cat}
                      </span>
                      {tx.sub && <span style={{ fontSize: 10, color: 'var(--ink-4)', paddingLeft: 14 }}>{tx.sub}</span>}
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 11 }}>{tx.acct}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>{tx.installment ?? '—'}</td>
                  <td className={"r num " + (tx.amt > 0 ? 'pos' : '')} style={{ fontWeight: 600 }}>
                    {tx.amt > 0 ? '+' : ''}{fmtMoney(tx.amt, lang)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ============ INVESTMENTS ============ */
export function InvestPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_invest}</h1>
          <div className="page-sub">{lang === "pt" ? "Portfólio de investimentos" : "Investment portfolio"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
            <Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar nota" : "Import note"}
          </button>
        </div>
      </div>

      <EmptyState
        icon="bar_chart"
        title={lang === "pt" ? "Nenhum portfólio cadastrado" : "No portfolio yet"}
        sub={lang === "pt" ? "Importe notas de corretagem para visualizar suas posições, rentabilidade e relatório de IR." : "Import brokerage notes to see your positions, returns and tax report."}
        cta={lang === "pt" ? "Importar nota" : "Import note"}
        onCta={() => (window as any).__navigate?.("import")}
      />
    </div>
  );
}

/* ============ IMPORT / PARSING ============ */
const PIPE_LABELS_PT = ["Detectar", "Extrair", "Categorizar", "Revisar", "Importar"];
const PIPE_LABELS_EN = ["Detect", "Extract", "Categorize", "Review", "Import"];
const PIPE_DELAYS = [800, 1200, 1600]; // ms for steps 1→2, 2→3, 3→4

/* ── Universal categorizer ──────────────────────────────────────── */
function catFor(text: string, amt: number): { cat: string; sub: string } {
  const s = text.toLowerCase();

  if (amt > 0) {
    if (/salari|folha|holerite|remuner|payroll/.test(s)) return { cat: 'income', sub: 'Salário' };
    if (/dividend|jscp|juros sobre capital|outros proventos/.test(s)) return { cat: 'income', sub: 'Dividendos' };
    if (/resgate|rendimento|res de cdb/.test(s)) return { cat: 'invest', sub: 'Resgate' };
    if (/reembolso|estorno|devolução|cashback/.test(s)) return { cat: 'income', sub: 'Reembolso' };
    return { cat: 'income', sub: 'Outros' };
  }

  // Transfer / credit card payment
  if (/fatura de cart|pgto fat cartao|pagamento fatura|pagto cartão/.test(s)) return { cat: 'transfer', sub: 'Pix enviado' };
  if (/transf.*pix|pix.*envi|transferência|ted |doc /.test(s)) return { cat: 'transfer', sub: 'Pix enviado' };

  // Transport
  if (/uber|99pop|99 taxi|taxi|cabify|indriver/.test(s)) return { cat: 'transport', sub: 'Uber/99' };
  if (/pedagio|pedágio|c6tag|sem parar|conectcar|veloe/.test(s)) return { cat: 'transport', sub: 'Pedágio' };
  if (/estacionamento|estapark|multipark|park/.test(s)) return { cat: 'transport', sub: 'Estacionamento' };
  if (/combustiv|gasolina|etanol|posto |shell|ipiranga|br dist|petrobras|raizen/.test(s)) return { cat: 'transport', sub: 'Combustível' };
  if (/bilhete.nico|sptrans|metrô|metro|trem|cptm|brt|onibus|ônibus/.test(s)) return { cat: 'transport', sub: 'Transporte público' };
  if (/seguro.*auto|dpvat|ipva|detran/.test(s)) return { cat: 'transport', sub: 'Manutenção' };

  // Housing
  if (/aluguel|locação|imob/.test(s)) return { cat: 'housing', sub: 'Aluguel' };
  if (/condomin/.test(s)) return { cat: 'housing', sub: 'Condomínio' };
  if (/enel|eletropaulo|cemig|copel|coelba|energi|light s\.a|eletric/.test(s)) return { cat: 'housing', sub: 'Energia' };
  if (/comgas|companhia de gas|gás|gas natural|cosan/.test(s)) return { cat: 'housing', sub: 'Gás' };
  if (/sabesp|cedae|embasa|agua e esgoto|saneamento/.test(s)) return { cat: 'housing', sub: 'Água' };
  if (/claro|vivo fibra|tim fibra|net\b|oi fibra|internet|banda larga/.test(s)) return { cat: 'housing', sub: 'Internet' };
  if (/iptu/.test(s)) return { cat: 'housing', sub: 'IPTU' };

  // Investments
  if (/tesouro direto|tesouro selic|tesouro prefixado/.test(s)) return { cat: 'invest', sub: 'Aporte' };
  if (/emissao de cdb|emissão de cdb|cdb |lci |lca |debenture/.test(s)) return { cat: 'invest', sub: 'Aporte' };
  if (/corretag|bovespa|b3\b|xp investimentos|rico\.com|clear\.com/.test(s)) return { cat: 'invest', sub: 'Corretagem' };

  // Taxes / government
  if (/receita federal|irpf|darf|tributo|imposto|issqn|icms/.test(s)) return { cat: 'tax', sub: 'DARF' };
  if (/ipva/.test(s)) return { cat: 'tax', sub: 'IPVA' };
  if (/inss|previdencia|rgps/.test(s)) return { cat: 'tax', sub: 'IR' };

  // Health
  if (/farmac|drogasil|droga raia|ultrafarma|onofre|pague menos/.test(s)) return { cat: 'health', sub: 'Farmácia' };
  if (/consulta|médic|medic|clínica|clinica|hospital|upa |ubs |hcor|einstein|sírio/.test(s)) return { cat: 'health', sub: 'Consulta' };
  if (/exame|laborat|fleury|dasa|hemocen|diagnóstico/.test(s)) return { cat: 'health', sub: 'Exame' };
  if (/plano de saude|amil|bradesco saude|sulamerica|unimed|hapvida|notredame/.test(s)) return { cat: 'health', sub: 'Plano de saúde' };
  if (/psico|terapia|psiquiat/.test(s)) return { cat: 'health', sub: 'Terapia' };
  if (/dentist|odonto|clínica dental|dental/.test(s)) return { cat: 'health', sub: 'Consulta' };

  // Subscriptions / streaming
  if (/netflix|hbo|max\b|disney|prime video|globoplay|paramount|apple tv|star\+/.test(s)) return { cat: 'subs', sub: 'Streaming' };
  if (/spotify|deezer|apple music|youtube premium|tidal/.test(s)) return { cat: 'subs', sub: 'Streaming' };
  if (/microsoft 365|office 365|google one|icloud|adobe|dropbox|notion\.so|figma\.com/.test(s)) return { cat: 'subs', sub: 'Software' };
  if (/antivirus|kaspersky|norton|bitdefender/.test(s)) return { cat: 'subs', sub: 'Software' };
  if (/assinatura|revista|jornal|folha uol|estadão|nexo/.test(s)) return { cat: 'subs', sub: 'Jornal/revista' };

  // Gym / fitness
  if (/smartfit|bodytech|bluefit|selfit|academia|crossfit|pilates|spinning|fit pass|gympass|wellhub/.test(s)) return { cat: 'subs', sub: 'Academia' };

  // Supermarket / grocery
  if (/pao de acucar|paodeacucar|carrefour|extra\b|atacadao|assai|makro|sam.s club|costco|rede.s ipi/.test(s)) return { cat: 'food', sub: 'Supermercado' };
  if (/supermercado|mercado\b|hortifruti|quitanda|mercearia|armazem/.test(s)) return { cat: 'food', sub: 'Supermercado' };
  if (/padaria|panificadora|confeitaria/.test(s)) return { cat: 'food', sub: 'Padaria' };
  if (/feira livre|banca de legumes/.test(s)) return { cat: 'food', sub: 'Feira' };

  // Restaurants / food delivery
  if (/ifood|rappi|uber eats|james delivery|aiqfome/.test(s)) return { cat: 'rest', sub: 'Delivery' };
  if (/mcdonalds|mcdonald|burguer king|bob.s\b|subway|habib|giraffas|madero|outback/.test(s)) return { cat: 'rest', sub: 'Fast food' };
  if (/starbucks|coffee|cafeteria|cafe\b/.test(s)) return { cat: 'rest', sub: 'Café' };
  if (/restauran|rest\.|almoc|jantar|lanchon|pizza|pizzar|sushi|japonê|rodizio|churrascaria|bar\b|boteco|choperia/.test(s)) return { cat: 'rest', sub: 'Restaurante' };

  // E-commerce / shopping
  if (/amazon|amz\b/.test(s)) return { cat: 'shopping', sub: 'Eletrônicos' };
  if (/mercado livre|mercadolivre|mercadopago/.test(s)) return { cat: 'shopping', sub: 'Eletrônicos' };
  if (/shopee|aliexpress|shein|wish\.com/.test(s)) return { cat: 'shopping', sub: 'Roupas' };
  if (/americanas|magazine luiza|magalu|casas bahia|pontofrio|extra\.com|submarino/.test(s)) return { cat: 'shopping', sub: 'Eletrônicos' };
  if (/renner|riachuelo|c&a\b|cea\b|zara|hm\b|h&m|marisa|farm\b|reserva|dudalina|aramis/.test(s)) return { cat: 'shopping', sub: 'Roupas' };
  if (/lojas americanas|leroy merlin|tok.stok|etna|camicado|leroy/.test(s)) return { cat: 'shopping', sub: 'Casa' };
  if (/apple store|apple\.com|samsung|positivo/.test(s)) return { cat: 'shopping', sub: 'Eletrônicos' };

  // Beauty / personal care
  if (/salon|salão|cabeleireiro|barbearia|manicure|nail|estética|estetica|beauty|l.oreal|wella|boticário/.test(s)) return { cat: 'shopping', sub: 'Beleza' };
  if (/farmacinha|beleza|maquiagem|perfume|sephora|o boticario|natura|avon/.test(s)) return { cat: 'shopping', sub: 'Beleza' };

  // Pet
  if (/petlove|cobasi|petz|pet shop|veterinár|veterinar|clinica vet|agropet/.test(s)) return { cat: 'shopping', sub: 'Pet' };

  // Education
  if (/curso|escola|treinamento|facul|universidade|udemy|coursera|alura|rocketseat|dio\.me/.test(s)) return { cat: 'education', sub: 'Curso' };
  if (/livraria|livro|amazon kindle|kindle|saraiva|cultura\b/.test(s)) return { cat: 'education', sub: 'Livros' };

  // Leisure / travel
  if (/hotel|pousada|hostel|airbnb|booking|decolar|submarino viagem|latam|gol\.com|azul\.com|voeazul/.test(s)) return { cat: 'leisure', sub: 'Viagem' };
  if (/cinema|ingresso|show|teatro|evento|ticketmaster|sympla|ticket360/.test(s)) return { cat: 'leisure', sub: 'Cinema/show' };
  if (/loteria|mega.sena|jogo|aposta|bet365|sportingbet|parimatch/.test(s)) return { cat: 'leisure', sub: 'Hobby' };
  if (/tatuagem|tattoo|piercing/.test(s)) return { cat: 'leisure', sub: 'Hobby' };

  // FX
  if (/wise|remessa|cambio|câmbio|paypal|payoneer/.test(s)) return { cat: 'shopping', sub: 'Internacional' };

  return { cat: 'shopping', sub: 'Outros' };
}

/* ── CSV line splitter (comma or semicolon, handles quotes) ────── */
function splitLine(line: string, sep: string): string[] {
  const cols: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === sep && !inQ) { cols.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  cols.push(cur.trim());
  return cols;
}

// Detect whether the file uses comma or semicolon as separator
function detectSep(header: string): string {
  const commas = (header.match(/,/g) ?? []).length;
  const semis = (header.match(/;/g) ?? []).length;
  return semis > commas ? ';' : ',';
}

function parseCSVLine(line: string): string[] { return splitLine(line, ','); }

// Strip BOM + normalize line endings, return clean lines
function cleanLines(content: string): string[] {
  return content.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
}

// Parse a BRL/generic numeric string: "1.234,56" → 1234.56 or "1234.56" → 1234.56
function parseBRLNum(s: string): number {
  const t = s.trim().replace(/['"]/g, '');
  // BRL format: thousands dot, decimal comma
  if (/^\d{1,3}(\.\d{3})*(,\d+)?$/.test(t)) return parseFloat(t.replace(/\./g, '').replace(',', '.'));
  // US/ISO format
  if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  // Comma only (e.g. "45,90")
  if (/^-?\d+(,\d+)?$/.test(t)) return parseFloat(t.replace(',', '.'));
  return NaN;
}

/* ── Format detection ───────────────────────────────────────────── */
type CsvFormat = 'c6' | 'nubank' | 'inter' | 'bradesco' | 'ofx' | 'generic';

function detectFormat(content: string, filename: string): { fmt: CsvFormat; sep: string; headerIdx: number } {
  const fn = filename.toLowerCase();
  const lines = cleanLines(content);
  const headSample = lines.slice(0, 8).join('\n').toLowerCase();

  // OFX
  if (fn.endsWith('.ofx') || fn.endsWith('.qfx') || headSample.includes('<ofx>') || headSample.includes('<stmttrn>')) {
    return { fmt: 'ofx', sep: ',', headerIdx: 0 };
  }

  // Find the actual header row (first non-empty line)
  const headerLineIdx = lines.findIndex(l => l.trim().length > 0);
  const rawHeader = headerLineIdx >= 0 ? lines[headerLineIdx] : '';
  const sep = detectSep(rawHeader);
  const headerCols = splitLine(rawHeader, sep).map(c => c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));

  // C6: has columns like data, saldo, titulo, descricao, entrada, saida
  const hasEntrada = headerCols.some(c => c.includes('entrada'));
  const hasSaida = headerCols.some(c => c.includes('saida') || c.includes('saída'));
  const hasData = headerCols.some(c => c === 'data' || c.startsWith('data'));
  const hasTitulo = headerCols.some(c => c.includes('titulo') || c.includes('título'));
  if (hasEntrada && hasSaida) return { fmt: 'c6', sep, headerIdx: headerLineIdx };

  // Nubank: date/data + category/categoria + title/titulo + amount/valor
  const hasDate = headerCols.some(c => c === 'date' || c === 'data');
  const hasAmt = headerCols.some(c => c === 'amount' || c === 'valor');
  const hasCat = headerCols.some(c => c === 'category' || c === 'categoria');
  const hasTitle = headerCols.some(c => c === 'title' || c === 'titulo');
  if (hasDate && hasAmt && (hasCat || hasTitle)) return { fmt: 'nubank', sep, headerIdx: headerLineIdx };

  // Inter / Bradesco fallbacks
  if (headSample.includes('inter bank') || headSample.includes('banco inter')) return { fmt: 'inter', sep, headerIdx: headerLineIdx };
  if (headSample.includes('bradesco')) return { fmt: 'bradesco', sep, headerIdx: headerLineIdx };

  // Heuristic: first data line has DD/MM/YYYY pattern → likely C6 or similar
  const firstDataLine = lines.find(l => /\d{2}\/\d{2}\/\d{4}/.test(l));
  if (firstDataLine) return { fmt: 'c6', sep: detectSep(firstDataLine), headerIdx: headerLineIdx };

  return { fmt: 'generic', sep, headerIdx: headerLineIdx };
}

/* ── C6 Bank CSV parser ─────────────────────────────────────────── */
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

function parseC6CSV(content: string, acct = 'C6 Bank', sep = ',', hIdx = -1): Txn[] {
  const lines = cleanLines(content);
  // Find header row: contains both "entrada" and "saída/saida"
  const headerIdx = hIdx >= 0 ? hIdx : lines.findIndex(l => {
    const n = l.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return n.includes('entrada') && n.includes('saida');
  });
  if (headerIdx < 0) return [];

  // Map header columns → indices
  const headerCols = splitLine(lines[headerIdx], sep).map(c =>
    c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  );
  const idxOf = (key: string) => headerCols.findIndex(c => c.includes(key));
  const iDate = idxOf('data') >= 0 ? idxOf('data') : 0;
  const iTitulo = idxOf('titulo') >= 0 ? idxOf('titulo') : 2;
  const iDesc = idxOf('descri') >= 0 ? idxOf('descri') : 3;
  const iEntrada = idxOf('entrada') >= 0 ? idxOf('entrada') : headerCols.length - 2;
  const iSaida = idxOf('saida') >= 0 ? idxOf('saida') : headerCols.length - 1;

  const txns: Txn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitLine(line, sep);
    if (cols.length < 3) continue;
    const dateStr = cols[iDate] ?? '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const d = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const titulo = cols[iTitulo] ?? '';
    const descricao = cols[iDesc] ?? '';
    const entrada = parseBRLNum(cols[iEntrada] ?? '');
    const saida = parseBRLNum(cols[iSaida] ?? '');
    const entradaV = isNaN(entrada) ? 0 : entrada;
    const saidaV = isNaN(saida) ? 0 : saida;
    if (entradaV === 0 && saidaV === 0) continue;
    const amt = entradaV > 0 ? entradaV : -saidaV;
    const merch = c6Merchant(titulo, descricao);
    const { cat, sub } = catFor(`${titulo} ${descricao}`, amt);
    txns.push({ id: newId(), d, merch, cat, sub, acct, amt });
  }
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── Nubank CSV parser ──────────────────────────────────────────── */
function parseNubankCSV(content: string, acct = 'Nubank', sep = ',', hIdx = -1): Txn[] {
  const lines = cleanLines(content).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headerIdx = hIdx >= 0 ? hIdx : 0;
  const headerCols = splitLine(lines[headerIdx], sep).map(c =>
    c.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
  );
  const idxOf = (key: string) => headerCols.findIndex(c => c.includes(key));
  const iDate = idxOf('date') >= 0 ? idxOf('date') : idxOf('data') >= 0 ? idxOf('data') : 0;
  const iTitle = idxOf('title') >= 0 ? idxOf('title') : idxOf('titulo') >= 0 ? idxOf('titulo') : 2;
  const iAmt = idxOf('amount') >= 0 ? idxOf('amount') : idxOf('valor') >= 0 ? idxOf('valor') : 3;

  const txns: Txn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], sep);
    if (cols.length < 3) continue;
    const dateStr = cols[iDate]?.trim() ?? '';
    if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
    const titulo = cols[iTitle]?.trim() ?? '';
    const raw = parseBRLNum(cols[iAmt] ?? '');
    if (isNaN(raw)) continue;
    // Nubank credit card: positive = expense, negative = credit/refund
    const amt = -raw;
    const { cat, sub } = catFor(titulo, amt);
    txns.push({ id: newId(), d: dateStr, merch: titulo, cat, sub, acct, amt });
  }
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── OFX parser ─────────────────────────────────────────────────── */
function parseOFX(content: string, acct = 'Importado'): Txn[] {
  const txns: Txn[] = [];
  // Handle both SGML (no closing tags) and XML OFX
  const normalized = content.replace(/<\/STMTTRN>/gi, '</STMTTRN>');
  const blocks = normalized.split(/<STMTTRN>/i).slice(1);
  for (const block of blocks) {
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>\\s*([^\n<]+)`, 'i'));
      return m ? m[1].trim() : '';
    };
    const dtRaw = get('DTPOSTED');
    if (!dtRaw || dtRaw.length < 8) continue;
    const d = `${dtRaw.slice(0, 4)}-${dtRaw.slice(4, 6)}-${dtRaw.slice(6, 8)}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const amtStr = get('TRNAMT');
    const amtRaw = parseFloat(amtStr.replace(',', '.'));
    if (isNaN(amtRaw)) continue;
    const merch = get('MEMO') || get('NAME') || get('FITID');
    const { cat, sub } = catFor(merch, amtRaw);
    txns.push({ id: newId(), d, merch: merch.slice(0, 80), cat, sub, acct, amt: amtRaw });
  }
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── Generic CSV parser (best-effort, column-sniffing) ─────────── */
function parseGenericCSV(content: string, acct = 'Importado', sep = ','): Txn[] {
  const lines = cleanLines(content).filter(l => l.trim());
  if (lines.length < 2) return [];
  const txns: Txn[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitLine(lines[i], sep);
    let d = '', merch = '', amtRaw = NaN;
    for (const col of cols) {
      const c = col.trim();
      if (!d && /^\d{2}\/\d{2}\/\d{4}$/.test(c)) {
        const p = c.split('/');
        d = `${p[2]}-${p[1]}-${p[0]}`;
      } else if (!d && /^\d{4}-\d{2}-\d{2}$/.test(c)) {
        d = c;
      } else if (isNaN(amtRaw)) {
        const n = parseBRLNum(c);
        if (!isNaN(n) && Math.abs(n) > 0.01) amtRaw = n;
      } else if (!merch && c.length > 2 && !/^\d/.test(c)) {
        merch = c;
      }
    }
    if (!d || isNaN(amtRaw)) continue;
    const { cat, sub } = catFor(merch, amtRaw);
    txns.push({ id: newId(), d, merch: merch || 'Desconhecido', cat, sub, acct, amt: amtRaw });
  }
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── Route file to parser ────────────────────────────────────────── */
function parseFile(content: string, filename: string, acct?: string): { txns: Txn[]; fmt: CsvFormat; rawHeader: string } {
  const { fmt, sep, headerIdx } = detectFormat(content, filename);
  const lines = cleanLines(content);
  const rawHeader = lines[headerIdx] ?? lines[0] ?? '';
  const name = acct || (fmt === 'c6' ? 'C6 Bank' : fmt === 'nubank' ? 'Nubank' : 'Importado');
  let txns: Txn[];
  if (fmt === 'nubank') txns = parseNubankCSV(content, name, sep, headerIdx);
  else if (fmt === 'ofx') txns = parseOFX(content, name);
  else if (fmt === 'c6') txns = parseC6CSV(content, name, sep, headerIdx);
  else txns = parseGenericCSV(content, name, sep);
  return { txns, fmt, rawHeader };
}

export function ImportPage({ lang, onImportComplete }: { lang: Lang; onImportComplete?: (txns: Txn[], mode: 'merge' | 'replace') => void }) {
  const t = I18N[lang];
  const pt = lang === 'pt';
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pipeStep, setPipeStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<{ name: string; when: string; count: number; fmt: string }[]>([]);
  const [rawContent, setRawContent] = useState('');
  const [detectedFmt, setDetectedFmt] = useState<CsvFormat>('generic');
  const [acctName, setAcctName] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fp_imports');
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, []);
  const [parsedTxns, setParsedTxns] = useState<Txn[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance steps 1 → 2 → 3 → 4
  useEffect(() => {
    if (pipeStep < 1 || pipeStep > 3) return;
    const timer = setTimeout(() => {
      let newLogs: string[] = [];
      if (pipeStep === 1) {
        const { fmt, rawHeader } = parseFile(rawContent, fileName, acctName || undefined);
        setDetectedFmt(fmt);
        const fmtLabel: Record<CsvFormat, string> = { c6: 'C6 Bank CSV', nubank: 'Nubank CSV', inter: 'Banco Inter CSV', bradesco: 'Bradesco CSV', ofx: 'OFX/QFX', generic: pt ? 'CSV Genérico' : 'Generic CSV' };
        const headerPreview = rawHeader.length > 60 ? rawHeader.slice(0, 60) + '…' : rawHeader;
        newLogs = pt
          ? [`✓ Formato detectado: ${fmtLabel[fmt]}`, `  Header: ${headerPreview}`]
          : [`✓ Format detected: ${fmtLabel[fmt]}`, `  Header: ${headerPreview}`];
      } else if (pipeStep === 2) {
        const nonEmpty = cleanLines(rawContent).filter(l => l.trim()).length;
        const dataRows = Math.max(0, nonEmpty - 1);
        newLogs = pt
          ? [`✓ ${dataRows} linhas de dados encontradas`, `✓ Iniciando categorização inteligente`]
          : [`✓ ${dataRows} data rows found`, `✓ Starting smart categorization`];
      } else if (pipeStep === 3) {
        const { txns: result } = parseFile(rawContent, fileName, acctName || undefined);
        setParsedTxns(result);
        if (result.length === 0) {
          newLogs = pt
            ? [`✗ Nenhuma transação encontrada`, `  Verifique se o arquivo é um CSV válido do C6 ou Nubank`]
            : [`✗ No transactions found`, `  Check that the file is a valid C6 or Nubank CSV`];
        } else {
          const uncategorized = result.filter(tx => tx.cat === 'shopping' && tx.sub === 'Outros').length;
          const categorized = result.length - uncategorized;
          newLogs = pt
            ? [`✓ ${result.length} transações extraídas`, `✓ ${categorized} categorizadas automaticamente`, uncategorized > 0 ? `○ ${uncategorized} com categoria genérica` : `✓ Todas categorizadas com sucesso`]
            : [`✓ ${result.length} transactions extracted`, `✓ ${categorized} auto-categorized`, uncategorized > 0 ? `○ ${uncategorized} with generic category` : `✓ All categorized successfully`];
        }
      }
      setLogs(prev => [...prev, ...newLogs]);
      setPipeStep(s => s + 1);
    }, PIPE_DELAYS[pipeStep - 1]);
    return () => clearTimeout(timer);
  }, [pipeStep, lang, rawContent, fileName, acctName]);

  function handleFile(file: File) {
    setFileName(file.name);
    setParsedTxns([]);
    setRawContent('');
    setLogs([]);
    setShowPreview(false);
    const reader = new FileReader();
    reader.onload = e => {
      const content = (e.target?.result as string) ?? '';
      setRawContent(content);
      setLogs([pt ? `✓ Arquivo: ${file.name}` : `✓ File: ${file.name}`]);
      setPipeStep(1);
    };
    reader.readAsText(file, 'utf-8');
  }

  function handleConfirm(mode: 'merge' | 'replace') {
    if (pipeStep !== 4) return;
    setPipeStep(5);
    const count = parsedTxns.length;
    const fmtLabels: Record<CsvFormat, string> = { c6: 'C6 Bank', nubank: 'Nubank', inter: 'Inter', bradesco: 'Bradesco', ofx: 'OFX', generic: pt ? 'Genérico' : 'Generic' };
    setTimeout(() => {
      setLogs(prev => [...prev, ...(pt
        ? [`Mesclando ${count} transações...`, `✓ Banco de dados local atualizado`, `✓ Concluído`]
        : [`Merging ${count} transactions...`, `✓ Local database updated`, `✓ Done`])]);
      const entry = {
        name: fileName,
        when: new Date().toLocaleDateString(pt ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        count,
        fmt: fmtLabels[detectedFmt],
      };
      setHistory(prev => {
        const updated = [entry, ...prev];
        try { localStorage.setItem('fp_imports', JSON.stringify(updated)); } catch {}
        return updated;
      });
      setPipeStep(6);
      onImportComplete?.(parsedTxns, mode);
    }, 1000);
  }

  function handleReset() {
    setPipeStep(0);
    setFileName('');
    setLogs([]);
    setShowPreview(false);
  }

  const steps = pt ? PIPE_LABELS_PT : PIPE_LABELS_EN;
  const isProcessing = pipeStep >= 1 && pipeStep <= 5;
  const isDone = pipeStep === 6;
  const awaitingConfirm = pipeStep === 4;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_import}</h1>
          <div className="page-sub">{pt ? 'OFX · CSV C6 · CSV Nubank · CSV genérico · tudo processado localmente' : 'OFX · C6 CSV · Nubank CSV · Generic CSV · all processed locally'}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ofx,.qfx,.csv,.txt"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />

          {isDone ? (
            <div className="dz" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent-fg)', cursor: 'default' }}>
              <Icon name="check" style={{ width: 38, height: 38, stroke: 'var(--accent-fg)', strokeWidth: 1.5 }} className="" />
              <div style={{ fontSize: 16, fontWeight: 600, margin: '10px 0 4px', color: 'var(--accent-fg)' }}>
                {pt ? 'Importação concluída!' : 'Import complete!'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>{parsedTxns.length} {pt ? 'transações mescladas com sucesso' : 'transactions merged successfully'}</div>
              <button className="btn sm" style={{ marginTop: 14 }} onClick={handleReset}>
                {pt ? 'Importar outro arquivo' : 'Import another file'}
              </button>
            </div>
          ) : (
            <div
              className={'dz' + (drag ? ' drag' : '') + (isProcessing ? ' drag' : '')}
              style={isProcessing ? { pointerEvents: 'none', opacity: 0.5 } : {}}
              onDragOver={e => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <Icon name="upload" style={{ width: 38, height: 38, stroke: 'var(--ink-3)', strokeWidth: 1.3 }} className="" />
              <div style={{ fontSize: 16, fontWeight: 600, margin: '10px 0 4px' }}>
                {pt ? 'Arraste o arquivo ou clique para selecionar' : 'Drag file or click to select'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                {pt ? 'Fatura CSV do C6, Nubank, ou arquivo OFX do seu banco' : 'C6 or Nubank CSV statement, or OFX from your bank'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {['CSV (C6)', 'CSV (Nubank)', 'OFX/QFX', 'CSV genérico'].map((f, i) => <span key={i} className="pill">{f}</span>)}
              </div>
            </div>
          )}

          {/* Account name override (shown before processing) */}
          {!isProcessing && !isDone && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{pt ? 'Nome da conta (opcional):' : 'Account name (optional):'}</label>
              <input
                value={acctName}
                onChange={e => setAcctName(e.target.value)}
                placeholder={pt ? 'Ex: Nubank, C6 Crédito…' : 'e.g. Nubank, C6 Credit…'}
                className="field"
                style={{ flex: 1, height: 32, fontSize: 12 }}
              />
            </div>
          )}

          {isProcessing && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {pipeStep < 5 && <div className="step-spinner" />}
                  <h3 className="card-title" style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 11 }}>
                    {pipeStep < 5 ? (pt ? `Processando · ${fileName}` : `Processing · ${fileName}`) : (pt ? `Importando · ${fileName}` : `Importing · ${fileName}`)}
                  </h3>
                </div>
                <button className="btn ghost sm" onClick={handleReset}>
                  <Icon name="x" className="btn-icon" />
                </button>
              </div>
              <div className="card-pad">
                {/* Step bars */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {steps.map((s, i) => {
                    const stepNum = i + 1;
                    const done = pipeStep > stepNum;
                    const active = pipeStep === stepNum;
                    return (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{ height: 4, borderRadius: 2, background: done || active ? 'var(--accent)' : 'var(--bg-3)', marginBottom: 5, animation: active ? 'pipe-pulse 1s ease-in-out infinite' : 'none' }} />
                        <div style={{ fontSize: 10, fontWeight: done || active ? 600 : 400, color: done ? 'var(--accent-fg)' : active ? 'var(--ink)' : 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          {done && <Icon name="check" style={{ width: 9, height: 9, stroke: 'var(--accent-fg)' }} className="" />}
                          {s}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Log output */}
                <div style={{ padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 8, marginBottom: awaitingConfirm ? 12 : 14, fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.75, minHeight: 80 }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ color: l.startsWith('○') ? 'var(--ink-3)' : 'var(--ink)' }}>{l}</div>
                  ))}
                  {pipeStep < 4 && <span className="pipe-cursor" style={{ color: 'var(--ink-3)' }}>▌</span>}
                  {awaitingConfirm && (
                    <div style={{ marginTop: 8, color: 'var(--accent-fg)', fontWeight: 600 }}>
                      {pt ? '→ Pronto. Revise as transações abaixo e confirme.' : '→ Ready. Review transactions below and confirm.'}
                    </div>
                  )}
                </div>

                {/* Transaction preview */}
                {awaitingConfirm && parsedTxns.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-2)' }}>
                        {pt ? `Prévia · ${parsedTxns.length} transações` : `Preview · ${parsedTxns.length} transactions`}
                      </span>
                      <button className="btn ghost sm" style={{ fontSize: 10 }} onClick={() => setShowPreview(v => !v)}>
                        {showPreview ? (pt ? 'Ocultar' : 'Hide') : (pt ? 'Ver todas' : 'Show all')}
                      </button>
                    </div>
                    <div style={{ maxHeight: showPreview ? 320 : 160, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
                      <table className="t" style={{ margin: 0 }}>
                        <thead><tr>
                          <th style={{ fontSize: 10 }}>{pt ? 'Data' : 'Date'}</th>
                          <th style={{ fontSize: 10 }}>{pt ? 'Estabelecimento' : 'Merchant'}</th>
                          <th style={{ fontSize: 10 }}>{pt ? 'Categoria' : 'Category'}</th>
                          <th className="r" style={{ fontSize: 10 }}>{pt ? 'Valor' : 'Amount'}</th>
                        </tr></thead>
                        <tbody>
                          {parsedTxns.slice(0, showPreview ? 200 : 5).map((tx, i) => (
                            <tr key={i}>
                              <td className="muted" style={{ fontSize: 10.5 }}>{tx.d}</td>
                              <td style={{ fontSize: 10.5, fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.merch}</td>
                              <td>
                                <span className="pill" style={{ fontSize: 9.5 }}>
                                  <span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }} />
                                  {I18N[lang].categories[tx.cat] ?? tx.cat}
                                </span>
                              </td>
                              <td className={"r num " + (tx.amt > 0 ? 'pos' : '')} style={{ fontSize: 10.5, fontWeight: 600 }}>
                                {tx.amt > 0 ? '+' : ''}{fmtMoney(tx.amt, lang)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <button className="btn sm" onClick={handleReset}>{pt ? 'Cancelar' : 'Cancel'}</button>
                  {awaitingConfirm && (
                    <button className="btn ghost sm" onClick={() => handleConfirm('replace')} style={{ color: 'var(--ink-3)' }}>
                      {pt ? 'Substituir tudo' : 'Replace all'}
                    </button>
                  )}
                  <button
                    className="btn primary sm"
                    disabled={!awaitingConfirm}
                    onClick={() => handleConfirm('merge')}
                    style={{ opacity: awaitingConfirm ? 1 : 0.4, cursor: awaitingConfirm ? 'pointer' : 'not-allowed' }}
                  >
                    {pt ? 'Mesclar e importar' : 'Merge & import'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card card-pad" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--accent-bg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <Icon name="lock" style={{ width: 17, height: 17, stroke: 'var(--accent-fg)' }} className="" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{pt ? 'Tudo processado localmente' : 'Everything processed locally'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.55 }}>
                  {pt ? 'Seus arquivos são analisados no seu navegador. Nada é enviado para servidores.' : 'Files are analyzed in your browser. Nothing is sent to external servers.'}
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3 className="card-title">{pt ? 'Formatos suportados' : 'Supported formats'}</h3></div>
            <div>
              {[
                { t: 'CSV — C6 Bank', ext: '.csv', desc: pt ? 'Exportado do app C6' : 'Exported from C6 app', ok: true },
                { t: 'CSV — Nubank', ext: '.csv', desc: pt ? 'Exportado do app Nubank' : 'Exported from Nubank app', ok: true },
                { t: 'OFX / QFX', ext: '.ofx', desc: pt ? 'Padrão bancário internacional (Inter, Bradesco…)' : 'Open Financial Exchange (Inter, Bradesco…)', ok: true },
                { t: 'CSV genérico', ext: '.csv', desc: pt ? 'Qualquer CSV com data e valor' : 'Any CSV with date and amount', ok: true },
                { t: pt ? 'PDF / Imagem' : 'PDF / Image', ext: '.pdf', desc: pt ? 'Em desenvolvimento' : 'Coming soon', ok: false },
              ].map((f, i) => (
                <div key={i} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i < 4 ? '1px solid var(--border)' : 'none', opacity: f.ok ? 1 : 0.45 }}>
                  <Icon name="file" style={{ width: 15, height: 15, stroke: f.ok ? 'var(--accent-fg)' : 'var(--ink-3)' }} className="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{f.t}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{f.desc}</div>
                  </div>
                  <span className={'chip-sm' + (f.ok ? '' : ' muted')}>{f.ext}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{pt ? 'Histórico de importações' : 'Import history'}</h3>
        </div>
        {history.length === 0 ? (
          <EmptyState
            icon="file"
            title={pt ? 'Nenhuma importação ainda' : 'No imports yet'}
            sub={pt ? 'O histórico das suas importações aparecerá aqui.' : 'Your import history will appear here.'}
          />
        ) : (
          <div>
            {history.map((h, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <Icon name="file" style={{ width: 15, height: 15, stroke: 'var(--accent-fg)' }} className="" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{h.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{h.when}{h.fmt ? ` · ${h.fmt}` : ''}</div>
                </div>
                <span className="pill">{h.count} {pt ? 'transações' : 'transactions'}</span>
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
          <button className="btn sm" onClick={() => (window as any).__modal?.("export", {})}>
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
            <CashflowChart data={stats.cashflow} lang={lang} showAnnotations={false} />
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
        <button className="btn primary sm" onClick={() => (window as any).__modal?.("goal", {})}>
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
          <button className="btn sm" onClick={() => (window as any).__modal?.("goal", {})}>
            <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova meta" : "New goal"}
          </button>
        </div>
        <EmptyState icon="target" title={lang === "pt" ? "Nenhuma meta cadastrada" : "No goals yet"} sub={lang === "pt" ? "Crie metas financeiras para acompanhar seu progresso ao longo do tempo." : "Create financial goals to track your progress over time."} />
      </div>
    </div>
  );
}


/* ============ ACCOUNTS ============ */
export function AccountsPage({ lang, onEditTxn, txns = [] }: { lang: Lang; onEditTxn?: (tx: Txn) => void; txns?: Txn[] }) {
  const t = I18N[lang];

  if (!txns.length) return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">{lang === "pt" ? "Sem dados importados" : "No data imported"}</div>
        </div>
        <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
          <Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar extrato" : "Import statement"}
        </button>
      </div>
      <EmptyState icon="bank" title={lang === "pt" ? "Nenhuma conta ainda" : "No accounts yet"} sub={lang === "pt" ? "Importe um extrato bancário para ver suas contas e transações aqui." : "Import a bank statement to see your accounts and transactions here."} cta={lang === "pt" ? "Importar extrato" : "Import statement"} onCta={() => (window as any).__navigate?.("import")} />
    </div>
  );

  // Derive accounts summary from real txns
  const acctMap: Record<string, number> = {};
  txns.forEach(tx => { acctMap[tx.acct] = (acctMap[tx.acct] ?? 0) + tx.amt; });
  const accounts = Object.entries(acctMap).map(([name, balance]) => ({ name, balance }));
  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">
            {accounts.length} {lang === "pt" ? "contas · saldo consolidado" : "accounts · consolidated balance"}{" "}
            <span className="num">{fmtMoney(totalBalance, lang, true)}</span>
          </div>
        </div>
        <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
          <Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar extrato" : "Import statement"}
        </button>
      </div>

      <div className="grid g-3" style={{ marginBottom: 14 }}>
        {accounts.map((a, i) => (
          <div key={i} className="card card-pad" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "var(--ink)", opacity: 0.05 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--ink)", display: "grid", placeItems: "center", color: "var(--bg)", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {a.name.slice(0, 2).toUpperCase()}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
            </div>
            <div className="num privacy-mask" style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{fmtMoney(a.balance, lang, true)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{t.section_recent}</h3>
          <span className="chip-sm">{txns.length}</span>
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
            {txns.map((tx, i) => (
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

      <div className="grid g-3" style={{ gap: 14 }}>
        {Object.keys(I18N[lang].categories).map(k => {
          const spend = spendByCat[k] ?? 0;
          return (
            <div key={k} className="card card-pad">
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 7, background: CAT_COLORS[k] ?? "var(--bg-3)", opacity: 0.85, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{I18N[lang].categories[k]}</div>
                </div>
              </div>
              {txns.length ? (
                spend > 0 ? (
                  <>
                    <div className="num" style={{ fontSize: 18, fontWeight: 600 }}>{fmtMoney(spend, lang, true)}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 6 }}>{lang === "pt" ? "este mês" : "this month"}</div>
                    <Sparkline data={[spend * 0.7, spend * 0.85, spend * 0.9, spend * 0.95, spend * 0.98, spend * 0.99, spend]} w={240} h={28} color={CAT_COLORS[k] ?? "var(--ink-3)"} />
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{lang === "pt" ? "sem gastos este mês" : "no spend this month"}</div>
                )
              ) : (
                <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{lang === "pt" ? "sem dados" : "no data"}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============ COMPARISON ============ */
function ComparisonBars({ dA, dB, pA, pB, lang }: { dA: ReturnType<typeof buildRealPeriodData>[0]; dB: ReturnType<typeof buildRealPeriodData>[0]; pA: PeriodPreset; pB: PeriodPreset; lang: Lang }) {
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

function buildRealPeriodData(txns: Txn[], presets: PeriodPreset[]): import("../lib/data").PeriodData[] {
  const now = new Date();
  const year = now.getFullYear();
  return presets.map(p => {
    const months = p.months.map(m => `${year}-${String(m + 1).padStart(2, "0")}`);
    const filtered = txns.filter(t => months.some(m => t.d.startsWith(m)));
    const income = filtered.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
    const expense = Math.abs(filtered.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));
    const bycat: Record<string, number> = {};
    filtered.filter(t => t.amt < 0).forEach(t => { bycat[t.cat] = (bycat[t.cat] ?? 0) + Math.abs(t.amt); });
    return { label: p.label, income, expense, net: income - expense, bycat };
  });
}

export function ComparisonPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const presets = PERIOD_PRESETS[lang];
  const [selA, setSelA] = useState("mar");
  const [selB, setSelB] = useState("apr");
  const [view, setView] = useState("overview");

  if (!txns.length) return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{lang === "pt" ? "Comparar períodos" : "Compare periods"}</h1>
          <div className="page-sub">{lang === "pt" ? "Análise lado-a-lado de qualquer período" : "Side-by-side analysis of any period"}</div>
        </div>
      </div>
      <EmptyState icon="bar_chart" title={lang === "pt" ? "Sem dados para comparar" : "No data to compare"} sub={lang === "pt" ? "Importe transações para comparar receitas e gastos entre períodos." : "Import transactions to compare income and expenses across periods."} cta={lang === "pt" ? "Importar extrato" : "Import statement"} onCta={() => (window as any).__navigate?.("import")} />
    </div>
  );

  const pA = presets.find(p => p.id === selA) ?? presets[2];
  const pB = presets.find(p => p.id === selB) ?? presets[3];
  const [dA, dB] = buildRealPeriodData(txns, [pA, pB]);
  const { cashflow } = computeStats(txns);

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
          <button className="btn sm" onClick={() => (window as any).__modal?.("export", {})}>
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
            <h3 className="card-title">{lang === "pt" ? "Fluxo de caixa" : "Cash flow"}</h3>
          </div>
          <div className="card-pad">
            <CashflowChart data={cashflow} lang={lang} showAnnotations={true} />
          </div>
        </div>
      )}

      {/* Monthly summary table */}
      {cashflow.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-head">
            <h3 className="card-title">{lang === "pt" ? "Resumo por período" : "Period summary"}</h3>
          </div>
          <table className="t">
            <thead><tr>
              <th>{lang === "pt" ? "Período" : "Period"}</th>
              <th className="r">{lang === "pt" ? "Receita" : "Income"}</th>
              <th className="r">{lang === "pt" ? "Gastos" : "Expense"}</th>
              <th className="r">{lang === "pt" ? "Líquido" : "Net"}</th>
              <th className="r">{lang === "pt" ? "Poupança" : "Savings"}</th>
            </tr></thead>
            <tbody>
              {cashflow.map((m, i) => {
                const net = m.income - m.expense;
                const rate = m.income > 0 ? (net / m.income * 100).toFixed(1) : "—";
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{lang === "pt" ? `Período ${m.m}` : `Period ${m.m}`}</td>
                    <td className="r num pos">{fmtMoney(m.income, lang, true)}</td>
                    <td className="r num">{fmtMoney(m.expense, lang, true)}</td>
                    <td className={"r num " + (net >= 0 ? "pos" : "neg")} style={{ fontWeight: 600 }}>{fmtMoney(net, lang, true)}</td>
                    <td className="r num">{rate}{rate !== "—" ? "%" : ""}</td>
                  </tr>
                );
              })}
              <tr style={{ background: "var(--bg-2)", fontWeight: 600 }}>
                <td style={{ fontWeight: 700 }}>{lang === "pt" ? "Total" : "Total"}</td>
                <td className="r num pos">{fmtMoney(cashflow.reduce((s, m) => s + m.income, 0), lang, true)}</td>
                <td className="r num">{fmtMoney(cashflow.reduce((s, m) => s + m.expense, 0), lang, true)}</td>
                <td className="r num pos" style={{ fontWeight: 700 }}>{fmtMoney(cashflow.reduce((s, m) => s + m.income - m.expense, 0), lang, true)}</td>
                <td className="r num">
                  {(() => { const ti = cashflow.reduce((s,m) => s+m.income,0); const tn = cashflow.reduce((s,m) => s+m.income-m.expense,0); return ti > 0 ? (tn/ti*100).toFixed(1)+"%" : "—"; })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
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
