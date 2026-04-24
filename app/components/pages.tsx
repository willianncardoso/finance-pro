"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, fmtMoney, fmtDate, CAT_COLORS, Txn, PERIOD_PRESETS, PeriodPreset, newId, CardMeta, SUBCATS } from "../lib/data";

/* ─── Helpers that derive stats from real transaction data ─── */

function computeStats(txns: Txn[]) {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const ym = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  const thisM = ym(now);
  const prevM = ym(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const active = txns.filter(t => !t.exclude);
  const thisMo = active.filter(t => t.d.startsWith(thisM));
  const prevMo = active.filter(t => t.d.startsWith(prevM));

  const income = thisMo.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expense = Math.abs(thisMo.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));
  const prevExpense = Math.abs(prevMo.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));
  const incomeAll = active.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expenseAll = Math.abs(active.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0));

  const byCat: Record<string, number> = {};
  const prevByCat: Record<string, number> = {};
  thisMo.filter(t => t.amt < 0 && t.cat).forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + Math.abs(t.amt); });
  prevMo.filter(t => t.amt < 0 && t.cat).forEach(t => { prevByCat[t.cat] = (prevByCat[t.cat] || 0) + Math.abs(t.amt); });

  const catSummary = Object.entries(byCat)
    .map(([k, cur]) => ({ k, cur, prev: prevByCat[k] || 0, budget: 0 }))
    .sort((a, b) => b.cur - a.cur);

  // Monthly cashflow (last 12 months) — excluded txns not counted
  const byMonth: Record<string, { income: number; expense: number }> = {};
  active.forEach(t => {
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

// Card accent colors per known issuers
function cardAccent(acct: string): string {
  const a = acct.toLowerCase();
  if (a.includes('nubank')) return '#820ad1';
  if (a.includes('c6')) return '#1a1a1a';
  if (a.includes('itaú') || a.includes('itau')) return '#ec7000';
  if (a.includes('bradesco')) return '#cc0000';
  if (a.includes('inter')) return '#ff7a00';
  if (a.includes('xp')) return '#000';
  return 'var(--accent)';
}

export function CardsPage({ lang, txns = [], cardMeta = {}, onUpdateCardMeta }: {
  lang: Lang; txns?: Txn[];
  cardMeta?: CardMeta;
  onUpdateCardMeta?: (acct: string, meta: { dueDay?: number }) => void;
}) {
  const t = I18N[lang];
  const pt = lang === 'pt';

  const cardTxns = txns.filter(tx => tx.kind === 'card');
  const effective = cardTxns.length > 0 ? cardTxns : txns.filter(tx => tx.kind !== 'account');

  const months = availableMonths(effective);
  const [selMonth, setSelMonth] = useState('');
  const [selAcct, setSelAcct] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [selCat, setSelCat] = useState('');
  const [editDueAcct, setEditDueAcct] = useState<string | null>(null);
  const [dueInputVal, setDueInputVal] = useState('');
  const [dupDismissed, setDupDismissed] = useState(false);

  if (!effective.length) return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">{pt ? 'Nenhuma fatura importada' : 'No card statements imported'}</div>
        </div>
        <button className="btn primary sm" onClick={() => (window as any).__navigate?.('import')}>
          <Icon name="upload" className="btn-icon" />{pt ? 'Importar fatura' : 'Import statement'}
        </button>
      </div>
      <EmptyState icon="card"
        title={pt ? 'Nenhuma fatura ainda' : 'No statements yet'}
        sub={pt ? 'Importe uma fatura CSV do C6 ou Nubank para ver seus gastos aqui.' : 'Import a C6 or Nubank CSV statement to see your card spending here.'}
        cta={pt ? 'Importar fatura' : 'Import statement'}
        onCta={() => (window as any).__navigate?.('import')}
      />
    </div>
  );

  const allAccts = [...new Set(effective.map(tx => tx.acct))].sort();

  // Filter pipeline
  const inMonth = selMonth ? effective.filter(tx => tx.d.startsWith(selMonth)) : effective;
  const inAcct  = selAcct === 'all' ? inMonth : inMonth.filter(tx => tx.acct === selAcct);
  // Category breakdown uses inAcct (stable — doesn't shrink when selCat is active)
  const byCat: Record<string, number> = {};
  inAcct.filter(tx => tx.amt < 0 && tx.cat !== 'transfer').forEach(tx => {
    byCat[tx.cat] = (byCat[tx.cat] ?? 0) + Math.abs(tx.amt);
  });
  const catBreakdown = Object.entries(byCat).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  const catTotal = catBreakdown.reduce((s, c) => s + c.v, 0);

  const inCat = selCat ? inAcct.filter(tx => tx.cat === selCat) : inAcct;
  const searched = search.trim()
    ? inCat.filter(tx =>
        tx.merch.toLowerCase().includes(search.toLowerCase()) ||
        (I18N[lang].categories[tx.cat] ?? tx.cat).toLowerCase().includes(search.toLowerCase())
      )
    : inCat;
  const filtered = [...searched].sort((a, b) =>
    sortBy === 'amount' ? Math.abs(b.amt) - Math.abs(a.amt) : b.d.localeCompare(a.d)
  );

  // Per-account totals — excluded txns and excluded-reimb not counted
  const acctSummary = allAccts.map(name => {
    const rows = inMonth.filter(tx => tx.acct === name);
    const expense = rows.filter(tx => tx.amt < 0 && !tx.exclude).reduce((s, tx) => s + Math.abs(tx.amt), 0);
    const refunds = rows.filter(tx => tx.amt > 0 && tx.cat !== 'transfer' && !tx.excludeReimb).reduce((s, tx) => s + tx.amt, 0);
    return { name, expense, refunds, count: rows.filter(tx => tx.amt < 0 && !tx.exclude).length };
  }).filter(a => a.expense > 0 || a.count > 0).sort((a, b) => b.expense - a.expense);

  // Totals (expenses only; genuine refunds separately)
  const totalExpense = filtered.filter(tx => tx.amt < 0 && !tx.exclude).reduce((s, tx) => s + Math.abs(tx.amt), 0);
  const totalRefunds = filtered.filter(tx => tx.amt > 0 && tx.cat !== 'transfer' && !tx.excludeReimb).reduce((s, tx) => s + tx.amt, 0);

  // Duplicate detection: same acct + date + amount appearing more than once
  const dupMap: Record<string, string[]> = {};
  effective.forEach(tx => {
    if (!tx.id) return;
    const key = `${tx.acct}|${tx.d}|${tx.amt.toFixed(2)}`;
    dupMap[key] = [...(dupMap[key] ?? []), tx.id];
  });
  const dupGroups = Object.entries(dupMap).filter(([, ids]) => ids.length > 1);
  const dupTxns = dupGroups.flatMap(([, ids]) => ids.slice(1).map(id => effective.find(t => t.id === id)!).filter(Boolean));

  // Month navigation
  const mIdx = months.indexOf(selMonth);
  const goOlder = () => { if (!selMonth) setSelMonth(months[0]); else if (mIdx < months.length - 1) setSelMonth(months[mIdx + 1]); };
  const goNewer = () => { if (!selMonth) return; if (mIdx > 0) setSelMonth(months[mIdx - 1]); else setSelMonth(''); };
  const olderDisabled = selMonth ? mIdx >= months.length - 1 : false;
  const newerDisabled = !selMonth;

  const clearFilters = () => { setSearch(''); setSelAcct('all'); setSelMonth(''); setSelCat(''); };
  const hasFilters = !!(search || selAcct !== 'all' || selMonth || selCat);

  return (
    <div className="page">
      {/* ── Duplicate alert ────────────────────────────────────────── */}
      {dupTxns.length > 0 && !dupDismissed && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', marginBottom: 12, background: '#f59e0b14', border: '1.5px solid #f59e0b50', borderRadius: 10 }}>
          <Icon name="alert" style={{ width: 18, height: 18, stroke: '#b45309', strokeWidth: 2, flexShrink: 0, marginTop: 1 }} className="" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>
              {pt ? `${dupTxns.length} transação(ões) possivelmente duplicada(s) detectada(s)` : `${dupTxns.length} possible duplicate transaction(s) detected`}
            </div>
            <div style={{ fontSize: 11, color: '#b45309', marginTop: 3 }}>
              {dupTxns.slice(0, 3).map(tx => `${tx.d} · ${tx.merch} · ${tx.amt < 0 ? '-' : '+'}R$${Math.abs(tx.amt).toFixed(2).replace('.', ',')}`).join(' | ')}
              {dupTxns.length > 3 ? ` e mais ${dupTxns.length - 3}…` : ''}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              {dupTxns.slice(0, 5).map(tx => (
                <button key={tx.id} className="btn sm" style={{ fontSize: 11, padding: '2px 8px', borderColor: '#f59e0b80' }}
                  onClick={() => (window as any).__openTxnEdit?.(tx)}>
                  {tx.merch.slice(0, 18)}…
                </button>
              ))}
              <button className="btn ghost sm" style={{ fontSize: 11, marginLeft: 'auto' }} onClick={() => setDupDismissed(true)}>
                {pt ? 'Dispensar' : 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">
            {allAccts.length} {pt ? (allAccts.length === 1 ? 'cartão' : 'cartões') : (allAccts.length === 1 ? 'card' : 'cards')}
            {selMonth ? ` · ${monthLabel(selMonth, lang)}` : ` · ${pt ? 'todos os meses' : 'all months'}`}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 34, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            <button className="btn ghost sm" style={{ borderRadius: 0, borderRight: '1px solid var(--border)', padding: '0 11px', height: '100%', fontSize: 16, lineHeight: 1 }}
              disabled={olderDisabled} onClick={goOlder} title={pt ? 'Mês anterior' : 'Previous month'}>‹</button>
            <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: 12, fontWeight: 600, padding: '0 8px', height: '100%', cursor: 'pointer', color: 'var(--ink)', minWidth: 130 }}>
              <option value="">{pt ? 'Todos os meses' : 'All months'}</option>
              {months.map(m => <option key={m} value={m}>{monthLabel(m, lang)}</option>)}
            </select>
            <button className="btn ghost sm" style={{ borderRadius: 0, borderLeft: '1px solid var(--border)', padding: '0 11px', height: '100%', fontSize: 16, lineHeight: 1 }}
              disabled={newerDisabled} onClick={goNewer} title={pt ? 'Próximo mês' : 'Next month'}>›</button>
          </div>
          <button className="btn primary sm" onClick={() => (window as any).__navigate?.('import')}>
            <Icon name="upload" className="btn-icon" />{pt ? 'Importar' : 'Import'}
          </button>
        </div>
      </div>

      {/* ── Card chips ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {/* All-cards chip */}
        <div role="button" tabIndex={0}
          onClick={() => setSelAcct('all')}
          onKeyDown={e => e.key === 'Enter' && setSelAcct('all')}
          style={{ flexShrink: 0, cursor: 'pointer', borderRadius: 14, padding: '14px 18px', minWidth: 150,
            background: selAcct === 'all' ? 'var(--ink)' : 'var(--surface)',
            border: `1.5px solid ${selAcct === 'all' ? 'transparent' : 'var(--border)'}`,
            color: selAcct === 'all' ? 'var(--surface)' : 'var(--ink)', userSelect: 'none' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', opacity: 0.55, textTransform: 'uppercase', marginBottom: 8 }}>{pt ? 'Todos os cartões' : 'All cards'}</div>
          <div className="num privacy-mask" style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {fmtMoney(acctSummary.reduce((s, a) => s + a.expense, 0), lang, true)}
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 6 }}>
            {acctSummary.reduce((s, a) => s + a.count, 0)} {pt ? 'compras' : 'purchases'}
          </div>
        </div>

        {acctSummary.map(a => {
          const accent = cardAccent(a.name);
          const active = selAcct === a.name;
          const isDark = accent === '#1a1a1a' || accent === '#000';
          const bg = active ? (isDark ? '#2a2a2a' : accent) : 'var(--surface)';
          const dueDay = cardMeta[a.name]?.dueDay;
          const isEditingDue = editDueAcct === a.name;
          return (
            <div key={a.name} role="button" tabIndex={0}
              onClick={() => { if (!isEditingDue) setSelAcct(active ? 'all' : a.name); }}
              onKeyDown={e => e.key === 'Enter' && !isEditingDue && setSelAcct(active ? 'all' : a.name)}
              style={{ flexShrink: 0, cursor: 'pointer', borderRadius: 14, padding: '14px 18px', minWidth: 185,
                background: bg, border: `1.5px solid ${active ? 'transparent' : 'var(--border)'}`,
                color: active ? '#fff' : 'var(--ink)', userSelect: 'none',
                boxShadow: active ? `0 4px 16px ${accent}40` : 'none',
                transition: 'box-shadow 0.15s, background 0.15s' }}>
              {/* Card brand strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 18, borderRadius: 4, background: active ? 'rgba(255,255,255,0.2)' : accent + '25',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.3)' : accent + '40'}` }} />
                <div style={{ fontSize: 11, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: active ? 0.9 : 1 }}>{a.name}</div>
              </div>
              <div className="num privacy-mask" style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
                {fmtMoney(a.expense, lang, true)}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 6, opacity: 0.6, fontSize: 11 }}>
                <span>{a.count} {pt ? 'tx' : 'tx'}</span>
                {a.refunds > 0 && <span>+{fmtMoney(a.refunds, lang, true)} {pt ? 'est.' : 'ref.'}</span>}
              </div>
              {/* Due date editor */}
              <div
                onClick={e => e.stopPropagation()}
                style={{ marginTop: 10, borderTop: `1px solid ${active ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`, paddingTop: 8 }}
              >
                {isEditingDue ? (
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <input
                      autoFocus
                      type="number"
                      min={1} max={31}
                      value={dueInputVal}
                      onChange={e => setDueInputVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          const d = parseInt(dueInputVal, 10);
                          if (d >= 1 && d <= 31) onUpdateCardMeta?.(a.name, { dueDay: d });
                          setEditDueAcct(null);
                        }
                        if (e.key === 'Escape') setEditDueAcct(null);
                      }}
                      placeholder="1-31"
                      style={{ width: 54, height: 24, fontSize: 12, border: `1px solid ${active ? 'rgba(255,255,255,0.4)' : 'var(--border)'}`,
                        borderRadius: 6, padding: '0 6px', background: active ? 'rgba(255,255,255,0.12)' : 'var(--bg-2)',
                        color: active ? '#fff' : 'var(--ink)' }}
                    />
                    <button
                      onClick={() => {
                        const d = parseInt(dueInputVal, 10);
                        if (d >= 1 && d <= 31) onUpdateCardMeta?.(a.name, { dueDay: d });
                        setEditDueAcct(null);
                      }}
                      style={{ fontSize: 11, padding: '2px 8px', borderRadius: 5, border: 'none', cursor: 'pointer',
                        background: active ? 'rgba(255,255,255,0.22)' : 'var(--accent)', color: active ? '#fff' : '#fff' }}>
                      {pt ? 'Ok' : 'Ok'}
                    </button>
                    {dueDay && (
                      <button
                        onClick={() => { onUpdateCardMeta?.(a.name, { dueDay: undefined }); setEditDueAcct(null); }}
                        style={{ fontSize: 11, padding: '2px 6px', borderRadius: 5, border: 'none', cursor: 'pointer',
                          background: 'transparent', color: active ? 'rgba(255,255,255,0.6)' : 'var(--ink-3)' }}>
                        ×
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => { setDueInputVal(dueDay ? String(dueDay) : ''); setEditDueAcct(a.name); }}
                    style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      color: active ? (dueDay ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)') : (dueDay ? 'var(--ink-2)' : 'var(--ink-3)'),
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9 }}>📅</span>
                    {dueDay ? (pt ? `Vence dia ${dueDay}` : `Due day ${dueDay}`) : (pt ? 'Definir vencimento' : 'Set due date')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <div className="card card-pad" style={{ flex: 1 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>{pt ? 'Total gasto' : 'Total spent'}</div>
          <div className="num neg privacy-mask" style={{ fontSize: 24, fontWeight: 700 }}>{fmtMoney(totalExpense, lang, true)}</div>
          {selMonth && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 4 }}>{monthLabel(selMonth, lang)}</div>}
        </div>
        {totalRefunds > 0 && (
          <div className="card card-pad" style={{ flex: 1 }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>{pt ? 'Estornos' : 'Refunds'}</div>
            <div className="num pos privacy-mask" style={{ fontSize: 24, fontWeight: 700 }}>+{fmtMoney(totalRefunds, lang, true)}</div>
          </div>
        )}
        <div className="card card-pad" style={{ flex: 1 }}>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-3)', fontWeight: 600, marginBottom: 6 }}>{pt ? 'Compras' : 'Purchases'}</div>
          <div className="num" style={{ fontSize: 24, fontWeight: 700 }}>{filtered.filter(tx => tx.amt < 0).length}</div>
        </div>
      </div>

      {/* ── Category breakdown — DonutChart + interactive legend ───── */}
      {catBreakdown.length > 0 && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-head">
            <h3 className="card-title">{pt ? 'Gastos por categoria' : 'Spending by category'}</h3>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {selCat && (
                <button className="btn ghost sm" style={{ fontSize: 11 }} onClick={() => setSelCat('')}>
                  × {I18N[lang].categories[selCat] ?? selCat}
                </button>
              )}
              <span className="chip-sm">{selAcct !== 'all' ? selAcct : selMonth ? monthLabel(selMonth, lang) : pt ? 'todos' : 'all'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0, padding: '16px', alignItems: 'flex-start' }}>
            {/* Donut */}
            <div style={{ position: 'relative', flexShrink: 0, marginRight: 20 }}>
              <DonutChart
                data={catBreakdown.slice(0, 9).map(c => ({
                  v: c.v,
                  color: selCat === '' || selCat === c.k ? (CAT_COLORS[c.k] ?? 'var(--ink-3)') : 'var(--bg-3)',
                  label: c.k,
                }))}
                size={148}
                thickness={26}
              />
              {/* Center text */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div className="num privacy-mask" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {fmtMoney(selCat ? (byCat[selCat] ?? 0) : catTotal, lang, true)}
                </div>
                <div style={{ fontSize: 9, color: 'var(--ink-3)', marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {selCat ? (I18N[lang].categories[selCat] ?? selCat) : (pt ? 'total' : 'total')}
                </div>
              </div>
            </div>
            {/* Category rows */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {catBreakdown.slice(0, 9).map(c => {
                const pct = catTotal > 0 ? (c.v / catTotal * 100) : 0;
                const active = selCat === c.k;
                const color = CAT_COLORS[c.k] ?? 'var(--ink-3)';
                return (
                  <div key={c.k}
                    onClick={() => setSelCat(active ? '' : c.k)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                      background: active ? color + '12' : 'transparent',
                      border: `1.5px solid ${active ? color + '50' : 'transparent'}`,
                      opacity: selCat && !active ? 0.45 : 1,
                      transition: 'opacity 0.12s, background 0.12s' }}>
                    <span className="cat-dot" style={{ background: color, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12, fontWeight: active ? 600 : 400 }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{I18N[lang].categories[c.k] ?? c.k}</span>
                        <span className="num" style={{ flexShrink: 0, marginLeft: 8, color: active ? 'var(--ink)' : 'var(--ink-2)' }}>{fmtMoney(c.v, lang, true)}</span>
                      </div>
                      <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--ink-3)', flexShrink: 0, minWidth: 28, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Filter bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Icon name="search" style={{ width: 13, height: 13, position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', stroke: 'var(--ink-3)', pointerEvents: 'none' }} className="" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={pt ? 'Buscar estabelecimento ou categoria…' : 'Search merchant or category…'}
            style={{ width: '100%', paddingLeft: 30, paddingRight: search ? 30 : 10, height: 34, border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg-2)', color: 'var(--ink)', boxSizing: 'border-box' }}
          />
          {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>}
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as 'date' | 'amount')}
          className="field" style={{ height: 34, fontSize: 12, padding: '0 10px', flexShrink: 0 }}>
          <option value="date">{pt ? 'Mais recente' : 'Most recent'}</option>
          <option value="amount">{pt ? 'Maior valor' : 'Highest amount'}</option>
        </select>
        {hasFilters && <button className="btn ghost sm" onClick={clearFilters}>{pt ? 'Limpar filtros' : 'Clear filters'}</button>}
      </div>

      {/* ── Transactions ───────────────────────────────────────────── */}
      <div className="card">
        <div className="card-head">
          <h3 className="card-title">
            {selCat ? (I18N[lang].categories[selCat] ?? selCat) : (pt ? 'Transações' : 'Transactions')}
          </h3>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {hasFilters && <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{pt ? 'filtrado' : 'filtered'}</span>}
            <span className="chip-sm">{filtered.filter(tx => tx.amt < 0).length}</span>
          </div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '40px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 12 }}>{pt ? 'Nenhuma transação encontrada' : 'No transactions found'}</div>
            {hasFilters && <button className="btn ghost sm" onClick={clearFilters}>{pt ? 'Limpar filtros' : 'Clear filters'}</button>}
          </div>
        ) : sortBy === 'amount' ? (
          <div>
            {filtered.map((tx, i) => (
              <TxRow key={tx.id ?? i} tx={tx} showAcct={allAccts.length > 1} lang={lang} accent={cardAccent(tx.acct)} last={i === filtered.length - 1} />
            ))}
          </div>
        ) : (
          (() => {
            const byDate: { date: string; rows: typeof filtered }[] = [];
            filtered.forEach(tx => {
              const last = byDate[byDate.length - 1];
              if (last && last.date === tx.d) last.rows.push(tx);
              else byDate.push({ date: tx.d, rows: [tx] });
            });
            return (
              <div>
                {byDate.map(({ date, rows }, gi) => (
                  <div key={date} style={{ borderTop: gi > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ padding: '6px 16px', fontSize: 11, fontWeight: 600, color: 'var(--ink-3)', background: 'var(--bg-2)', letterSpacing: '0.04em' }}>
                      {new Date(date + 'T12:00:00').toLocaleDateString(pt ? 'pt-BR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </div>
                    {rows.map((tx, ri) => (
                      <TxRow key={tx.id ?? ri} tx={tx} showAcct={allAccts.length > 1} lang={lang} accent={cardAccent(tx.acct)} last={ri === rows.length - 1} />
                    ))}
                  </div>
                ))}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

function TxRow({ tx, showAcct, lang, accent, last }: { tx: Txn; showAcct: boolean; lang: Lang; accent: string; last: boolean }) {
  const pt = lang === 'pt';
  const excluded = tx.exclude === true;
  const reimbPending = tx.reimbursable && !tx.reimburseReceived;
  const reimbDone = tx.reimburseReceived === true;
  const avatarBg = accent === '#1a1a1a' ? 'var(--bg-3)' : accent + '20';
  const avatarColor = accent === '#1a1a1a' ? 'var(--ink-2)' : accent;

  function handleQuickReceive(e: React.MouseEvent) {
    e.stopPropagation();
    const ra = tx.reimbAmt ?? Math.abs(tx.amt);
    (window as any).__addTxn?.({
      d: new Date().toISOString().slice(0, 10),
      merch: (pt ? 'Reembolso · ' : 'Reimbursement · ') + tx.merch,
      cat: 'income', sub: 'Reembolso',
      acct: tx.acct, amt: ra,
    });
    (window as any).__updateTxn?.({ ...tx, reimbursable: undefined, reimburseReceived: true });
    (window as any).__toast?.(pt ? `✓ Reembolso de ${fmtMoney(ra, lang)} registrado` : `✓ Reimbursement of ${fmtMoney(ra, lang)} recorded`);
  }

  return (
    <div
      onClick={() => (window as any).__openTxnEdit?.(tx)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: last ? 'none' : '1px solid var(--border)', cursor: 'pointer', opacity: excluded ? 0.5 : 1 }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: avatarBg, display: 'grid', placeItems: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: avatarColor }}>
        {tx.merch.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || '?'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: excluded ? 'line-through' : 'none', color: excluded ? 'var(--ink-3)' : 'var(--ink)' }}>{tx.merch}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="pill" style={{ fontSize: 10 }}>
            <span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }} />
            {I18N[lang].categories[tx.cat] ?? tx.cat}
          </span>
          {showAcct && <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{tx.acct}</span>}
          {tx.installment && (
            <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--font-mono)', background: 'var(--accent)18', borderRadius: 4, padding: '1px 5px' }}>
              {pt ? 'parc' : 'inst'} {tx.installment}
            </span>
          )}
          {excluded && (
            <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--ink-3)', background: 'var(--bg-3)', borderRadius: 4, padding: '1px 5px', letterSpacing: '0.03em' }}>
              {pt ? 'excluído' : 'excluded'}
            </span>
          )}
          {tx.source === 'paste' && (
            <span style={{ fontSize: 10, fontWeight: 600, border: '1px solid #7c3aed40', borderRadius: 4, padding: '1px 5px',
              background: '#7c3aed0d', color: '#7c3aed', letterSpacing: '0.02em' }}>
              {pt ? 'colado' : 'pasted'}
            </span>
          )}
          {reimbPending && (
            <button
              onClick={handleQuickReceive}
              title={pt ? 'Clique para marcar como recebido e registrar receita' : 'Click to mark as received and log income'}
              style={{ fontSize: 10, fontWeight: 600, border: '1px solid #f59e0b60', borderRadius: 4, padding: '1px 6px',
                background: '#f59e0b14', color: '#b45309', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
              💸 {pt ? 'a receber' : 'pending'}{tx.reimbAmt ? ` ${fmtMoney(tx.reimbAmt, lang, true)}` : ''}
            </button>
          )}
          {reimbDone && (
            <span style={{ fontSize: 10, fontWeight: 600, border: '1px solid #22c55e50', borderRadius: 4, padding: '1px 6px',
              background: '#22c55e12', color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3 }}>
              ✓ {pt ? 'reembolsado' : 'reimbursed'}
            </span>
          )}
        </div>
      </div>
      <div className={'num' + (tx.amt > 0 ? ' pos' : '')} style={{ fontWeight: 700, fontSize: 14, flexShrink: 0, color: tx.amt > 0 ? 'var(--pos)' : excluded ? 'var(--ink-3)' : 'var(--ink)', textDecoration: excluded ? 'line-through' : 'none' }}>
        {tx.amt > 0 ? '+' : ''}{fmtMoney(tx.amt, lang)}
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

  // Check user-learned rules first (saved via EditDrawer category corrections)
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('fp_learned_rules') : null;
    if (stored) {
      const rules: Array<{ merch: string; cat: string; sub: string }> = JSON.parse(stored);
      const norm = s.replace(/[^a-z0-9]/g, '');
      for (const r of rules) {
        const rNorm = r.merch.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rNorm.length >= 4 && norm.includes(rNorm)) return { cat: r.cat, sub: r.sub };
      }
    }
  } catch {}

  if (amt > 0) {
    if (/salari|folha|holerite|remuner|payroll/.test(s)) return { cat: 'income', sub: 'Salário' };
    if (/dividend|jscp|juros sobre capital|outros proventos/.test(s)) return { cat: 'income', sub: 'Dividendos' };
    if (/resgate|rendimento|res de cdb/.test(s)) return { cat: 'invest', sub: 'Resgate' };
    if (/reembolso|estorno|devolução|cashback/.test(s)) return { cat: 'income', sub: 'Reembolso' };
    return { cat: 'income', sub: 'Outros' };
  }

  // Transfer / credit card payment (includes C6 "Pagamento recebido" entries and standalone "pagamento")
  if (/^pagamento$|fatura de cart|pgto fat cartao|pagamento fatura|pagto cartão|pagamento recebido|pgto receb|bill payment/.test(s)) return { cat: 'transfer', sub: 'Pagamento' };
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
type CsvFormat = 'c6' | 'c6fatura' | 'c6paste' | 'nubank' | 'inter' | 'bradesco' | 'ofx' | 'generic' | 'numbers';

function detectFormat(content: string, filename: string): { fmt: CsvFormat; sep: string; headerIdx: number } {
  // Apple Numbers / ZIP format (binary) — cannot parse as CSV
  if (content.startsWith('PK')) return { fmt: 'numbers', sep: ',', headerIdx: -1 };

  const fn = filename.toLowerCase();
  const lines = cleanLines(content);
  const headSample = lines.slice(0, 8).join('\n').toLowerCase();

  // OFX
  if (fn.endsWith('.ofx') || fn.endsWith('.qfx') || headSample.includes('<ofx>') || headSample.includes('<stmttrn>')) {
    return { fmt: 'ofx', sep: ',', headerIdx: 0 };
  }

  // Find the actual header row: scan up to 15 lines for one with CSV separators + known keywords
  const headerLineIdx = (() => {
    const n = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
    for (let i = 0; i < Math.min(lines.length, 15); i++) {
      const l = lines[i];
      if (!l.trim()) continue;
      if (!(l.includes(',') || l.includes(';'))) continue;
      const ln = n(l);
      if (
        (ln.includes('entrada') && (ln.includes('saida') || ln.includes('lancamento'))) ||
        ln.includes('datadecompra') || ln.includes('datacompra') ||
        (ln.includes('date') && ln.includes('amount')) ||
        (ln.includes('data') && ln.includes('titulo'))
      ) return i;
    }
    return lines.findIndex(l => l.trim().length > 0);
  })();
  const rawHeader = headerLineIdx >= 0 ? lines[headerLineIdx] : '';
  const sep = detectSep(rawHeader);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const headerCols = splitLine(rawHeader, sep).map(c => norm(c));

  // C6 Fatura (credit card bill) — check multiple indicators, any one is sufficient
  // "Data de Compra" normalizes to "datadecompra" (not "datacompra"!) — check both
  const hasDataCompra  = headerCols.some(c => c.includes('datadecompra') || c.includes('datacompra') || c.includes('dtcompra'));
  // "Final do Cartão" normalizes to "finaldocartao"
  const hasFinalCartao = headerCols.some(c => c.includes('finaldocartao') || c.includes('finalcartao') || c.includes('final'));
  // "Cotação" normalizes to "cotacao" in the middle of "cotacaoemr"
  const hasCotacao     = headerCols.some(c => c.includes('cotacao'));
  // "Parcela" has no accents — always reliable
  const hasParcela     = headerCols.some(c => c === 'parcela' || c.startsWith('parc'));
  if (hasDataCompra || (hasFinalCartao && hasCotacao) || (hasFinalCartao && hasParcela)) {
    return { fmt: 'c6fatura', sep, headerIdx: headerLineIdx };
  }

  // C6 Extrato (bank statement): has Entrada + Saída
  const hasEntrada = headerCols.some(c => c.includes('entrada'));
  const hasSaida   = headerCols.some(c => c.includes('saida'));
  if (hasEntrada && hasSaida) return { fmt: 'c6', sep, headerIdx: headerLineIdx };

  // Nubank: date/data + title + amount (3 columns)
  const hasDate  = headerCols.some(c => c === 'date' || c === 'data');
  const hasAmt   = headerCols.some(c => c === 'amount' || c === 'valor');
  const hasTitle = headerCols.some(c => c === 'title' || c === 'titulo');
  if (hasDate && hasAmt && hasTitle) return { fmt: 'nubank', sep, headerIdx: headerLineIdx };

  // Inter / Bradesco fallbacks
  if (headSample.includes('inter bank') || headSample.includes('banco inter')) return { fmt: 'inter', sep, headerIdx: headerLineIdx };
  if (headSample.includes('bradesco')) return { fmt: 'bradesco', sep, headerIdx: headerLineIdx };

  // Heuristic: DD/MM/YYYY data rows but no recognisable header → generic C6 extrato
  // Only trigger if the file also has "entrada" or "saida" somewhere in the content
  const hasEntradaInFile = content.toLowerCase().includes('entrada');
  const firstDataLine    = lines.find(l => /\d{2}\/\d{2}\/\d{4}/.test(l));
  if (firstDataLine && hasEntradaInFile) return { fmt: 'c6', sep: detectSep(firstDataLine), headerIdx: headerLineIdx };

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

/* ── Installment helpers ────────────────────────────────────────── */

// Returns YYYY-MM of the most-represented month in the txn list
function computeStatementMonth(txns: { d: string }[]): string {
  const counts: Record<string, number> = {};
  for (const tx of txns) {
    const m = tx.d.slice(0, 7);
    counts[m] = (counts[m] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (!entries.length) return '';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// Extract "N/T" installment label from a description string and return cleaned merchant + label
function extractInstallment(text: string): { merch: string; installment: string | null } {
  // Matches "2/12", "02/12", "03/36" anywhere in the string
  const m = text.match(/\b(\d{1,2})\/(\d{2,3})\b/);
  if (!m) return { merch: text.trim(), installment: null };
  const label = `${parseInt(m[1], 10)}/${parseInt(m[2], 10)}`;
  const cleaned = text.slice(0, m.index).replace(/[\s\-–/]+$/, '').trim() ||
                  text.slice(m.index! + m[0].length).trim();
  return { merch: cleaned || text.trim(), installment: label };
}

// Clamp date day to last valid day of month (e.g. "2026-02-30" → "2026-02-28")
function clampToMonth(ym: string, day: string): string {
  const d = new Date(`${ym}-${day}T12:00:00`);
  if (!isNaN(d.getTime())) return `${ym}-${day}`;
  const last = new Date(parseInt(ym.slice(0, 4)), parseInt(ym.slice(5, 7)), 0);
  return last.toISOString().slice(0, 10);
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
    txns.push({ id: newId(), d, merch, cat, sub, acct, amt, kind: 'account' });
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
  const iAmt = idxOf('amount') >= 0 ? idxOf('amount') : idxOf('valor') >= 0 ? idxOf('valor') : 2;

  const raw_txns: Txn[] = [];
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
    const { merch, installment } = extractInstallment(titulo);
    const { cat, sub } = catFor(titulo, amt);
    raw_txns.push({ id: newId(), d: dateStr, merch, cat, sub, acct, amt, installment, kind: 'card' });
  }
  // Redate installments: Nubank CSVs already use billing date, but guard anyway
  const stmtMonth = computeStatementMonth(raw_txns);
  const txns = stmtMonth
    ? raw_txns.map(tx => {
        if (!tx.installment || tx.d.startsWith(stmtMonth)) return tx;
        return { ...tx, d: clampToMonth(stmtMonth, tx.d.slice(8, 10)) };
      })
    : raw_txns;
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── C6 Fatura CSV parser (credit card bill) ────────────────────── */
function parseC6FaturaCSV(content: string, acct = 'C6 Bank', sep = ';', hIdx = -1): Txn[] {
  const lines = cleanLines(content);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

  const headerIdx = hIdx >= 0 ? hIdx : lines.findIndex(l => {
    const n = norm(l);
    return n.includes('datacompra') || (n.includes('data') && n.includes('compra'));
  });
  if (headerIdx < 0) return [];

  const headerCols = splitLine(lines[headerIdx], sep).map(c => norm(c));
  const idxOf = (pred: (c: string) => boolean) => headerCols.findIndex(pred);

  const colDate   = idxOf(c => c.includes('datacompra') || (c.includes('data') && !c.includes('cotacao')));
  const colFinal  = idxOf(c => c.includes('finaldocartao') || c.includes('finalcartao') || c.includes('final'));
  const colDesc   = idxOf(c => c.includes('descricao') || c.startsWith('descri'));
  const colCat    = idxOf(c => c === 'categoria' || c.startsWith('categ'));
  const colParc   = idxOf(c => c === 'parcela' || c.startsWith('parc'));
  const colValor  = (() => {
    const i = idxOf(c => c.includes('valor') && c.includes('r') && !c.includes('us'));
    return i >= 0 ? i : headerCols.length - 1;
  })();

  // Detect card number from first data row to build a specific acct label
  const firstData = lines[headerIdx + 1] ? splitLine(lines[headerIdx + 1], sep) : [];
  const cardLast4 = colFinal >= 0 ? firstData[colFinal]?.trim() : '';
  const resolvedAcct = cardLast4 ? `${acct} •${cardLast4}` : acct;

  const raw_txns: Txn[] = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = splitLine(line, sep);
    if (cols.length < 3) continue;

    const dateStr = cols[colDate >= 0 ? colDate : 0]?.trim() ?? '';
    const parts = dateStr.split('/');
    if (parts.length !== 3) continue;
    const d = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;

    const descricao = cols[colDesc >= 0 ? colDesc : 4]?.trim() ?? '';
    const categoria = cols[colCat >= 0 ? colCat : 3]?.trim() ?? '';
    // Explicit parcela column (some C6 exports have it)
    const parcelaCol = colParc >= 0 ? (cols[colParc]?.trim() ?? '') : '';
    const raw = parseBRLNum(cols[colValor] ?? '');
    if (isNaN(raw) || raw === 0) continue;

    // C6 Fatura: positive = expense → negate to app convention (expense = negative)
    const amt = -raw;

    // Extract installment: prefer explicit column, else parse from description
    let installment: string | null = null;
    let cleanMerch = descricao;

    if (parcelaCol && parcelaCol !== 'Única' && parcelaCol !== 'Unica') {
      // Explicit column: "3/12", "3 de 12", etc.
      const pm = parcelaCol.match(/(\d+)\s*(?:de|\/)\s*(\d+)/i);
      installment = pm ? `${parseInt(pm[1], 10)}/${parseInt(pm[2], 10)}` : parcelaCol;
    } else {
      // Embedded in description: "LOJA 03/12" or "LOJA PARC 3/12"
      const ex = extractInstallment(descricao);
      installment = ex.installment;
      cleanMerch = ex.merch;
    }

    const { cat, sub } = catFor(`${descricao} ${categoria}`, amt);
    raw_txns.push({ id: newId(), d, merch: cleanMerch || descricao || 'C6', cat, sub, acct: resolvedAcct, amt, installment, kind: 'card' });
  }

  // Redate installments to statement month so April faturas show April dates
  const stmtMonth = computeStatementMonth(raw_txns);
  const txns = stmtMonth
    ? raw_txns.map(tx => {
        if (!tx.installment || tx.d.startsWith(stmtMonth)) return tx;
        return { ...tx, d: clampToMonth(stmtMonth, tx.d.slice(8, 10)) };
      })
    : raw_txns;
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
    txns.push({ id: newId(), d, merch: merch.slice(0, 80), cat, sub, acct, amt: amtRaw, kind: 'account' });
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
    txns.push({ id: newId(), d, merch: merch || 'Desconhecido', cat, sub, acct, amt: amtRaw, kind: 'card' });
  }
  return txns.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── C6 App paste-text parser ───────────────────────────────────── */
// Handles text copied from the C6 Bank mobile app (open invoices, statement screens).
// Each transaction block: [Date header] → [Category line] → [Merchant] → [Amount] → [Amount (bold repeat)] → [optional: EM NX]
function parseC6AppText(text: string, acct = 'C6 Bank'): Txn[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const results: Txn[] = [];

  const AMT_RE  = /^R\$\s*([\d.]+,\d{2})$/;
  // Matches "Hoje, DD/MM/YY", "Quinta-feira, DD/MM/YY", etc.
  const DATE_RE = /(Hoje|Ontem|Segunda|Ter[cç]a|Quarta|Quinta|Sexta|S[aá]bado|Domingo)(?:-feira)?,?\s+(\d{1,2})\/(\d{2})\/(\d{2,4})/i;
  const INST_RE = /^EM\s+(\d+)\s*X$/i;
  // C6 category lines: contain "/" or match known Portuguese banking category words
  const CAT_RE  = /\/|Associa[çc]|Recreativo|Transporte|El[eé]trico|Empresa\s+(?:para|servi)|Servi[çc]os?\s+(?:Prof|Pess|Tele|Aut)|Departamento|Especialidade\s+varejo|Supermercado|Restaurante|Lanchon|Vestu[aá]rio|Arte\s+\/|Artesanato|Relacionados.*[Aa]utomotivo/i;

  let currentDate = new Date().toISOString().slice(0, 10);
  let pendingCat  = '';
  let pendingMerch = '';
  let lastAmtStr  = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Date header
    const dm = line.match(DATE_RE);
    if (dm) {
      const [, , day, mon, yr] = dm;
      const year = yr.length === 2 ? `20${yr}` : yr;
      currentDate = `${year}-${mon.padStart(2, '0')}-${day.padStart(2, '0')}`;
      pendingMerch = '';
      lastAmtStr   = '';
      continue;
    }

    // "EM NX" installment marker — applies to the last emitted txn
    const im = line.match(INST_RE);
    if (im) {
      const total = parseInt(im[1], 10);
      if (results.length > 0 && !results[results.length - 1].installment) {
        results[results.length - 1].installment = `1/${total}`;
      }
      continue;
    }

    // Amount line
    const am = line.match(AMT_RE);
    if (am) {
      const amtStr = am[1];
      if (amtStr === lastAmtStr) {
        // Bold-repeat duplicate — skip it and reset so the next txn can start
        lastAmtStr = '';
        continue;
      }
      lastAmtStr = amtStr;
      if (pendingMerch) {
        const amtRaw = parseFloat(amtStr.replace(/\./g, '').replace(',', '.'));
        if (!isNaN(amtRaw) && amtRaw !== 0) {
          const amt = -amtRaw; // C6 app shows positive amounts; outflows become negative
          const { cat, sub } = catFor(`${pendingMerch} ${pendingCat}`, amt);
          results.push({ id: newId(), d: currentDate, merch: pendingMerch, cat, sub, acct, amt, kind: 'card', source: 'paste' });
          pendingMerch = '';
        }
      }
      continue;
    }

    // Category line
    if (CAT_RE.test(line)) {
      pendingCat   = line;
      pendingMerch = '';
      lastAmtStr   = '';
      continue;
    }

    // Merchant name — anything else non-trivial
    if (line.length >= 2) {
      pendingMerch = line;
      lastAmtStr   = '';
    }
  }

  return results.sort((a, b) => b.d.localeCompare(a.d));
}

/* ── Route file to parser ────────────────────────────────────────── */
function parseFile(content: string, filename: string, acct?: string): { txns: Txn[]; fmt: CsvFormat; rawHeader: string } {
  const { fmt, sep, headerIdx } = detectFormat(content, filename);
  const lines = cleanLines(content);
  const rawHeader = lines[headerIdx] ?? lines[0] ?? '';
  const nameMap: Partial<Record<CsvFormat, string>> = { c6: 'C6 Bank', c6fatura: 'C6 Bank', nubank: 'Nubank' };
  const name = acct || nameMap[fmt] || 'Importado';
  let txns: Txn[];
  if (fmt === 'numbers') txns = [];
  else if (fmt === 'nubank') txns = parseNubankCSV(content, name, sep, headerIdx);
  else if (fmt === 'ofx') txns = parseOFX(content, name);
  else if (fmt === 'c6') txns = parseC6CSV(content, name, sep, headerIdx);
  else if (fmt === 'c6fatura') txns = parseC6FaturaCSV(content, name, sep, headerIdx);
  else txns = parseGenericCSV(content, name, sep);
  return { txns, fmt, rawHeader };
}

export function ImportPage({ lang, onImportComplete, onDeleteBatch, existingAccts = [] }: { lang: Lang; onImportComplete?: (txns: Txn[], mode: 'merge' | 'replace') => void; onDeleteBatch?: (txnIds: string[]) => void; existingAccts?: string[] }) {
  const t = I18N[lang];
  const pt = lang === 'pt';
  const [drag, setDrag] = useState(false);
  const [fileName, setFileName] = useState('');
  const [pipeStep, setPipeStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<{ id?: string; name: string; when: string; count: number; fmt: string; kind?: 'card' | 'account'; txnIds?: string[] }[]>([]);
  const [rawContent, setRawContent] = useState('');
  const [detectedFmt, setDetectedFmt] = useState<CsvFormat>('generic');
  const [acctName, setAcctName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [fmtWarnPaused, setFmtWarnPaused] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const [imageData, setImageData] = useState<{ base64: string; mediaType: string } | null>(null);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [historySort, setHistorySort] = useState<'recent' | 'name'>('recent');
  const [editingHistId, setEditingHistId] = useState<string | null>(null);
  const [editingHistName, setEditingHistName] = useState('');

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
    if (fmtWarnPaused) return; // waiting for user to confirm unknown format
    const timer = setTimeout(async () => {
      let newLogs: string[] = [];
      let earlyExit = false;
      let pauseForFmtWarning = false;
      try {
        if (pipeStep === 1) {
          // ── Image / screenshot mode (Tesseract via local API route) ──
          if (isImageMode && imageData) {
            newLogs = pt
              ? [`✓ Imagem detectada: ${fileName}`, `⟳ Processando OCR local…`]
              : [`✓ Image detected: ${fileName}`, `⟳ Running local OCR…`];
            setLogs(prev => [...prev, ...newLogs]);
            newLogs = [];
            try {
              const res = await fetch('/api/ocr', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData.base64, mediaType: imageData.mediaType, today: new Date().toISOString().slice(0, 10) }),
              });
              const data = await res.json();
              if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`);
              const raw: { date: string; merchant: string; amount: number; account?: string; installment?: string | null }[] = data.txns;
              const result: Txn[] = raw.map(r => {
                const { cat, sub } = catFor(r.merchant, r.amount);
                return { id: newId(), d: r.date, merch: r.merchant, cat, sub, acct: r.account || acctName || 'Screenshot', amt: r.amount, installment: r.installment ?? null, kind: 'card' as const };
              }).filter(tx => tx.d && tx.amt !== 0);
              setParsedTxns(result);
              if (result.length === 0) {
                newLogs = pt
                  ? [`✗ Nenhuma transação encontrada`, data.rawText ? `  Texto lido: ${String(data.rawText).slice(0, 100).replace(/\n/g, ' ')}…` : '']
                  : [`✗ No transactions found`, data.rawText ? `  Text read: ${String(data.rawText).slice(0, 100).replace(/\n/g, ' ')}…` : ''];
              } else {
                newLogs = pt
                  ? [`✓ ${result.length} transações extraídas (OCR local, sem IA, sem nuvem)`]
                  : [`✓ ${result.length} transactions extracted (local OCR, no AI, no cloud)`];
              }
            } catch (ocrErr: any) {
              newLogs = pt
                ? [`✗ Erro ao processar imagem: ${ocrErr?.message ?? String(ocrErr)}`]
                : [`✗ Image processing error: ${ocrErr?.message ?? String(ocrErr)}`];
              earlyExit = true;
            }
            setLogs(prev => [...prev, ...newLogs]);
            setPipeStep(4);
            return;
          }

          // ── Paste text mode (C6 App statement) ──────────────────────
          if (isPasteMode && pasteText) {
            newLogs = pt
              ? [`✓ Texto colado detectado`, `⟳ Analisando formato C6 App…`]
              : [`✓ Pasted text detected`, `⟳ Parsing C6 App format…`];
            setLogs(prev => [...prev, ...newLogs]);
            newLogs = [];
            const result = parseC6AppText(pasteText, acctName || 'C6 Bank');
            setParsedTxns(result);
            setDetectedFmt('c6paste');
            if (result.length === 0) {
              newLogs = [pt ? '✗ Nenhuma transação encontrada. Verifique o formato do texto.' : '✗ No transactions found. Check the text format.'];
            } else {
              const uncategorized = result.filter(tx => tx.cat === 'shopping' && tx.sub === 'Outros').length;
              newLogs = [
                pt ? `✓ ${result.length} transações extraídas (C6 App)` : `✓ ${result.length} transactions extracted (C6 App)`,
                uncategorized > 0 ? `○ ${uncategorized} com categoria genérica` : `✓ Todas categorizadas`,
              ];
            }
            setLogs(prev => [...prev, ...newLogs]);
            setPipeStep(4);
            return;
          }

          // ── Normal CSV mode ──────────────────────────────────────────
          const detected = detectFormat(rawContent, fileName);
          const { fmt, rawHeader } = parseFile(rawContent, fileName, acctName || undefined);
          setDetectedFmt(fmt);
          const fmtLabel: Record<CsvFormat, string> = {
            c6: 'C6 Bank Extrato CSV', c6fatura: 'C6 Bank Fatura CSV', c6paste: pt ? 'C6 Texto colado' : 'C6 Pasted text',
            nubank: 'Nubank CSV', inter: 'Banco Inter CSV', bradesco: 'Bradesco CSV',
            ofx: 'OFX/QFX', generic: pt ? 'CSV Genérico' : 'Generic CSV', numbers: 'Apple Numbers',
          };
          // Debug details always included
          const normFn = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
          const hCols = rawHeader.split(detected.sep === ';' ? ';' : ',').slice(0, 5).map(c => normFn(c.trim())).join(' | ');
          const debugLines = [
            `  sep="${detected.sep}" headerLn=${detected.headerIdx} cols=[${hCols}]`,
          ];
          if (fmt === 'numbers') {
            newLogs = pt
              ? [`✗ Arquivo Apple Numbers detectado`, `  Exporte como CSV no Numbers: Arquivo → Exportar para → CSV`, `  Depois importe o arquivo .csv gerado`]
              : [`✗ Apple Numbers file detected`, `  Export as CSV in Numbers: File → Export To → CSV`, `  Then import the generated .csv file`];
            setLogs(prev => [...prev, ...newLogs]);
            setParsedTxns([]);
            setPipeStep(4);
            return;
          }
          if (fmt === 'generic') {
            // Unknown format — warn and pause for user confirmation
            const headerPreview = rawHeader.length > 60 ? rawHeader.slice(0, 60) + '…' : rawHeader;
            newLogs = [
              `⚠ Formato não reconhecido`,
              `  Header: ${headerPreview}`,
              ...debugLines,
              `  O analisador genérico tentará extrair data e valor.`,
              `  Confirme para continuar ou cancele.`,
            ];
            setFmtWarnPaused(true);
            pauseForFmtWarning = true;
          } else {
            const headerPreview = rawHeader.length > 60 ? rawHeader.slice(0, 60) + '…' : rawHeader;
            newLogs = [
              `✓ Formato: ${fmtLabel[fmt]}`,
              `  Header: ${headerPreview}`,
              ...debugLines,
            ];
          }
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
            newLogs = [
              `✗ Nenhuma transação encontrada`,
              `  fmt=${detectedFmt} — verifique se o arquivo é válido`,
            ];
          } else {
            const uncategorized = result.filter(tx => tx.cat === 'shopping' && tx.sub === 'Outros').length;
            const categorized = result.length - uncategorized;
            const kindCard = result.filter(tx => tx.kind === 'card').length;
            const kindAcct = result.filter(tx => tx.kind === 'account').length;
            newLogs = [
              `✓ ${result.length} transações extraídas`,
              `  tipo: ${kindCard} cartão / ${kindAcct} conta`,
              `  conta: ${result[0]?.acct ?? '?'}`,
              `✓ ${categorized} categorizadas automaticamente`,
              uncategorized > 0 ? `○ ${uncategorized} com categoria genérica` : `✓ Todas categorizadas`,
            ];
          }
        }
      } catch (err: any) {
        newLogs = pt
          ? [`✗ Erro ao processar: ${err?.message ?? String(err)}`]
          : [`✗ Error processing file: ${err?.message ?? String(err)}`];
        earlyExit = true;
      }
      setLogs(prev => [...prev, ...newLogs]);
      if (!pauseForFmtWarning) {
        setPipeStep(earlyExit ? 4 : s => s + 1);
      }
    }, PIPE_DELAYS[pipeStep - 1]);
    return () => clearTimeout(timer);
  }, [pipeStep, lang, rawContent, fileName, acctName, fmtWarnPaused, isImageMode, imageData, isPasteMode, pasteText]);

  function handleFile(file: File) {
    setFileName(file.name);
    setParsedTxns([]);
    setRawContent('');
    setLogs([]);
    setShowPreview(false);
    setFmtWarnPaused(false);
    setImageData(null);

    const isImage = /\.(png|jpe?g|webp|heic|heif|gif)$/i.test(file.name) || file.type.startsWith('image/');
    setIsImageMode(isImage);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = (e.target?.result as string) ?? '';
        // dataUrl is "data:<mediaType>;base64,<data>"
        const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) { setLogs([pt ? '✗ Erro ao ler imagem' : '✗ Error reading image']); return; }
        const [, mediaType, base64] = match;
        setImageData({ base64, mediaType });
        setLogs([pt ? `✓ Arquivo: ${file.name}` : `✓ File: ${file.name}`]);
        setPipeStep(1);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const content = (e.target?.result as string) ?? '';
        setRawContent(content);
        setLogs([pt ? `✓ Arquivo: ${file.name}` : `✓ File: ${file.name}`]);
        setPipeStep(1);
      };
      reader.readAsText(file, 'utf-8');
    }
  }

  function handleConfirm(mode: 'merge' | 'replace') {
    if (pipeStep !== 4) return;
    setPipeStep(5);
    const count = parsedTxns.length;
    const fmtLabels: Record<CsvFormat, string> = { c6: 'C6 Bank', c6fatura: 'C6 Fatura', c6paste: pt ? 'C6 Texto colado' : 'C6 Pasted', nubank: 'Nubank', inter: 'Inter', bradesco: 'Bradesco', ofx: 'OFX', generic: pt ? 'Genérico' : 'Generic', numbers: 'Numbers' };
    setTimeout(() => {
      setLogs(prev => [...prev, ...(pt
        ? [`Mesclando ${count} transações...`, `✓ Banco de dados local atualizado`, `✓ Concluído`]
        : [`Merging ${count} transactions...`, `✓ Local database updated`, `✓ Done`])]);
      const entry = {
        id: newId(),
        name: fileName,
        when: new Date().toLocaleDateString(pt ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }),
        count,
        fmt: fmtLabels[detectedFmt],
        kind: (parsedTxns[0]?.kind ?? 'card') as 'card' | 'account',
        txnIds: parsedTxns.map(t => t.id).filter(Boolean) as string[],
      };
      // Write localStorage DIRECTLY here — not inside a React state updater,
      // because the component may unmount (route change) before the updater runs.
      try {
        const stored = localStorage.getItem('fp_imports');
        const prev: typeof entry[] = stored ? JSON.parse(stored) : [];
        localStorage.setItem('fp_imports', JSON.stringify([entry, ...prev]));
      } catch {}
      setHistory(prev => [entry, ...prev]);
      setPipeStep(6);
      onImportComplete?.(parsedTxns, mode);
    }, 1000);
  }

  function handleReset() {
    setPipeStep(0);
    setFileName('');
    setRawContent('');
    setParsedTxns([]);
    setLogs([]);
    setShowPreview(false);
    setAcctName('');
    setFmtWarnPaused(false);
    setIsImageMode(false);
    setImageData(null);
    setIsPasteMode(false);
    setPasteText('');
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
            accept=".ofx,.qfx,.csv,.txt,.png,.jpg,.jpeg,.webp,.heic,.heif"
            style={{ display: 'none' }}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
          />

          {/* Mode toggle */}
          {!isProcessing && !isDone && (
            <div className="seg" style={{ marginBottom: 10, fontSize: 12 }}>
              <button className={!isPasteMode ? 'on' : ''} onClick={() => setIsPasteMode(false)}>
                📁 {pt ? 'Arquivo' : 'File'}
              </button>
              <button className={isPasteMode ? 'on' : ''} onClick={() => setIsPasteMode(true)}>
                📋 {pt ? 'Colar texto (C6 App)' : 'Paste text (C6 App)'}
              </button>
            </div>
          )}

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
          ) : isPasteMode && !isProcessing ? (
            <div>
              {/* Card / account selector */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--ink-3)', display: 'block', marginBottom: 4, fontWeight: 500 }}>
                  {pt ? 'Cartão / conta' : 'Card / account'}
                  <span style={{ color: 'var(--danger, #ef4444)', marginLeft: 2 }}>*</span>
                </label>
                {existingAccts.length > 0 ? (
                  <>
                    <select
                      value={existingAccts.includes(acctName) ? acctName : acctName ? '__custom__' : ''}
                      onChange={e => {
                        if (e.target.value === '__custom__') setAcctName('');
                        else setAcctName(e.target.value);
                      }}
                      className="field"
                      style={{ width: '100%', fontSize: 13, marginBottom: 6 }}
                    >
                      <option value="" disabled>{pt ? '— Selecione um cartão —' : '— Select a card —'}</option>
                      {existingAccts.map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                      <option value="__custom__">{pt ? '✏ Outro (digitar)…' : '✏ Other (type)…'}</option>
                    </select>
                    {(!existingAccts.includes(acctName) || acctName === '') && (
                      <input
                        autoFocus={!existingAccts.includes(acctName) && acctName !== ''}
                        value={acctName}
                        onChange={e => setAcctName(e.target.value)}
                        placeholder={pt ? 'Nome do cartão / conta' : 'Card / account name'}
                        className="field"
                        style={{ width: '100%', fontSize: 13, boxSizing: 'border-box' }}
                      />
                    )}
                  </>
                ) : (
                  <input
                    value={acctName}
                    onChange={e => setAcctName(e.target.value)}
                    placeholder={pt ? 'Ex: C6 Bank •4321' : 'e.g. C6 Bank •4321'}
                    className="field"
                    style={{ width: '100%', fontSize: 13, boxSizing: 'border-box' }}
                  />
                )}
                <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 4 }}>
                  {pt
                    ? 'Selecionar um cartão já existente permite que a fatura CSV oficial, quando importada depois, substitua automaticamente as transações não editadas.'
                    : 'Selecting an existing card lets the official CSV invoice, imported later, automatically replace unedited transactions.'}
                </div>
              </div>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder={pt
                  ? 'Cole aqui o texto copiado do app do C6 Bank (extrato ou fatura aberta)…\n\nExemplo:\nHoje, 24/04/26\nRestaurante / Lanchonete / Bar\nALBUONI PIZZERIA\nR$ 58,98\nR$ 58,98'
                  : 'Paste text copied from the C6 Bank app (statement or open invoice)…\n\nExample:\nHoje, 24/04/26\nRestaurante / Lanchonete / Bar\nALBUONI PIZZERIA\nR$ 58,98\nR$ 58,98'}
                style={{ width: '100%', minHeight: 200, padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 12.5, fontFamily: 'var(--font-mono)', lineHeight: 1.65, background: 'var(--bg-2)', color: 'var(--ink)', resize: 'vertical', boxSizing: 'border-box' }}
              />
              <button
                className="btn primary"
                style={{ marginTop: 8, width: '100%' }}
                disabled={!pasteText.trim() || !acctName.trim()}
                onClick={() => {
                  setFileName(pt ? 'fatura-c6-colada.txt' : 'c6-pasted.txt');
                  setLogs([pt ? `✓ Processando texto colado…` : `✓ Processing pasted text…`]);
                  setParsedTxns([]);
                  setShowPreview(false);
                  setPipeStep(1);
                }}
              >
                {pt ? 'Processar texto' : 'Process text'}
              </button>
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                {pt
                  ? 'Transações marcadas como "colado". Ao importar o CSV oficial depois, as não editadas serão substituídas automaticamente.'
                  : 'Transactions tagged as "pasted". When you import the official CSV later, unedited ones are replaced automatically.'}
              </div>
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
                {pt ? 'CSV do C6/Nubank, OFX do banco, ou print da Wallet/app do C6' : 'C6/Nubank CSV, bank OFX, or screenshot from Wallet/C6 app'}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
                {['CSV (C6)', 'CSV (Nubank)', 'OFX/QFX', 'PNG/JPG'].map((f, i) => <span key={i} className="pill">{f}</span>)}
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
                <div style={{ position: 'relative' }}>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-2)', borderRadius: 8, marginBottom: (awaitingConfirm || fmtWarnPaused) ? 12 : 14, fontFamily: 'var(--font-mono)', fontSize: 11.5, lineHeight: 1.75, minHeight: 80 }}>
                    {logs.map((l, i) => (
                      <div key={i} style={{ color: l.startsWith('○') ? 'var(--ink-3)' : l.startsWith('⚠') ? 'var(--warn, #f59e0b)' : l.startsWith('✗') ? 'var(--danger, #ef4444)' : 'var(--ink)' }}>{l}</div>
                    ))}
                    {pipeStep < 4 && !fmtWarnPaused && <span className="pipe-cursor" style={{ color: 'var(--ink-3)' }}>▌</span>}
                    {awaitingConfirm && (
                      <div style={{ marginTop: 8, color: 'var(--accent-fg)', fontWeight: 600 }}>
                        {pt ? '→ Pronto. Revise as transações abaixo e confirme.' : '→ Ready. Review transactions below and confirm.'}
                      </div>
                    )}
                  </div>
                  {logs.length > 0 && (
                    <button
                      className="btn ghost sm"
                      style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, padding: '2px 8px', opacity: 0.6 }}
                      onClick={() => navigator.clipboard?.writeText(logs.join('\n'))}
                      title="Copiar log"
                    >
                      copiar
                    </button>
                  )}
                </div>

                {/* Unknown format warning — pause before proceeding */}
                {fmtWarnPaused && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 12px', background: 'var(--warn-bg, #fffbeb)', border: '1px solid var(--warn, #f59e0b)', borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ flex: 1, fontSize: 12, color: 'var(--warn-fg, #92400e)' }}>
                      {pt ? 'Formato não reconhecido. O analisador genérico tentará importar. Deseja continuar mesmo assim?' : 'Unrecognized format. The generic parser will try to import. Continue anyway?'}
                    </div>
                    <button className="btn sm" onClick={handleReset}>{pt ? 'Cancelar' : 'Cancel'}</button>
                    <button className="btn primary sm" onClick={() => { setFmtWarnPaused(false); setPipeStep(2); }}>
                      {pt ? 'Continuar mesmo assim' : 'Continue anyway'}
                    </button>
                  </div>
                )}

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
                <div style={{ fontWeight: 600, fontSize: 13 }}>{pt ? 'Privacidade' : 'Privacy'}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 4, lineHeight: 1.55 }}>
                  {pt ? 'CSVs e OFX são analisados localmente no navegador. Prints de tela são enviados à API da Anthropic para extração de texto.' : 'CSVs and OFX are analyzed locally in the browser. Screenshots are sent to the Anthropic API for text extraction.'}
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
                { t: pt ? 'Print — Apple Wallet / app C6' : 'Screenshot — Apple Wallet / C6 app', ext: '.png .jpg', desc: pt ? 'Print da tela com transações — OCR local, sem nuvem' : 'Screenshot with visible transactions — local OCR, no cloud', ok: true },
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
          <div style={{ display: 'flex', gap: 6 }}>
            <button className={'btn ghost sm' + (historySort === 'recent' ? ' primary' : '')} style={{ fontSize: 11 }} onClick={() => setHistorySort('recent')}>
              {pt ? 'Recentes' : 'Recent'}
            </button>
            <button className={'btn ghost sm' + (historySort === 'name' ? ' primary' : '')} style={{ fontSize: 11 }} onClick={() => setHistorySort('name')}>
              {pt ? 'A–Z' : 'A–Z'}
            </button>
          </div>
        </div>
        {history.length === 0 ? (
          <EmptyState
            icon="file"
            title={pt ? 'Nenhuma importação ainda' : 'No imports yet'}
            sub={pt ? 'O histórico das suas importações aparecerá aqui.' : 'Your import history will appear here.'}
          />
        ) : (
          <div>
            {[...history]
              .sort((a, b) => historySort === 'name' ? a.name.localeCompare(b.name) : 0)
              .map((h, i) => {
                const isEditing = editingHistId === (h.id ?? String(i));
                const saveHistName = () => {
                  const v = editingHistName.trim();
                  if (v && v !== h.name) {
                    const newHist = history.map(x => (x.id ?? '') === (h.id ?? '') ? { ...x, name: v } : x);
                    setHistory(newHist);
                    try { localStorage.setItem('fp_imports', JSON.stringify(newHist)); } catch {}
                  }
                  setEditingHistId(null);
                };
                return (
                  <div key={h.id ?? i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 30, height: 30, borderRadius: 7, background: h.kind === 'account' ? 'var(--bg-3)' : 'var(--accent-bg)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Icon name={h.kind === 'account' ? 'bank' : 'card'} style={{ width: 14, height: 14, stroke: h.kind === 'account' ? 'var(--ink-3)' : 'var(--accent-fg)' }} className="" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {isEditing ? (
                        <input
                          autoFocus
                          className="field"
                          style={{ fontSize: 12, padding: '2px 6px', width: '100%' }}
                          value={editingHistName}
                          onChange={e => setEditingHistName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveHistName(); if (e.key === 'Escape') setEditingHistId(null); }}
                          onBlur={saveHistName}
                        />
                      ) : (
                        <div style={{ fontSize: 12, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.name}</div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{h.when}{h.fmt ? ` · ${h.fmt}` : ''}</div>
                    </div>
                    <span className="pill" style={{ flexShrink: 0 }}>{h.count} {pt ? 'tx' : 'tx'}</span>
                    <button
                      className="btn ghost sm"
                      style={{ padding: '4px 6px', opacity: 0.5, flexShrink: 0 }}
                      title={pt ? 'Renomear' : 'Rename'}
                      onClick={() => { setEditingHistId(h.id ?? String(i)); setEditingHistName(h.name); }}
                    >
                      <Icon name="tag" style={{ width: 12, height: 12, stroke: 'currentColor' }} className="" />
                    </button>
                    {h.txnIds && h.txnIds.length > 0 && onDeleteBatch && (
                      <button
                        className="btn ghost sm"
                        style={{ padding: '4px 6px', color: 'var(--danger, #ef4444)', flexShrink: 0 }}
                        title={pt ? 'Excluir este lote' : 'Delete this batch'}
                        onClick={() => {
                          const msg = pt
                            ? `Excluir as ${h.count} transações de "${h.name}"? Esta ação não pode ser desfeita.`
                            : `Delete the ${h.count} transactions from "${h.name}"? This cannot be undone.`;
                          if (!confirm(msg)) return;
                          onDeleteBatch(h.txnIds!);
                          const newHist = history.filter((_, j) => j !== i);
                          setHistory(newHist);
                          try { localStorage.setItem('fp_imports', JSON.stringify(newHist)); } catch {}
                        }}
                      >
                        <Icon name="trash" style={{ width: 13, height: 13, stroke: 'currentColor' }} className="" />
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Clear all data */}
      <div className="card" style={{ borderColor: 'var(--danger, #ef4444)' }}>
        <div className="card-head">
          <h3 className="card-title" style={{ color: 'var(--danger, #ef4444)' }}>
            {pt ? 'Zona de perigo' : 'Danger zone'}
          </h3>
        </div>
        <div style={{ padding: '16px' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 12 }}>
            {pt
              ? 'Remove todas as transações e o histórico de importações permanentemente.'
              : 'Permanently removes all transactions and import history.'}
          </p>
          <button
            className="btn"
            style={{ background: 'var(--danger, #ef4444)', color: '#fff', borderColor: 'var(--danger, #ef4444)' }}
            onClick={() => {
              const msg = pt
                ? 'Tem certeza? Isso apagará TODAS as transações e o histórico de importações. Esta ação não pode ser desfeita.'
                : 'Are you sure? This will delete ALL transactions and import history. This cannot be undone.';
              if (!confirm(msg)) return;
              localStorage.removeItem('fp_txns');
              localStorage.removeItem('fp_imports');
              localStorage.removeItem('fp_state');
              window.location.reload();
            }}
          >
            {pt ? 'Limpar todos os dados' : 'Clear all data'}
          </button>
        </div>
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
function periodCutoff(period: "30d" | "90d" | "12m" | "ytd"): string {
  const d = new Date();
  if (period === "30d") d.setDate(d.getDate() - 30);
  else if (period === "90d") d.setDate(d.getDate() - 90);
  else if (period === "12m") d.setFullYear(d.getFullYear() - 1);
  else { d.setMonth(0); d.setDate(1); } // ytd: Jan 1
  return d.toISOString().slice(0, 10);
}

function exportCSV(txns: Txn[], lang: Lang) {
  const header = lang === "pt"
    ? "Data,Descrição,Categoria,Subcategoria,Conta,Valor"
    : "Date,Description,Category,Subcategory,Account,Amount";
  const rows = txns.map(t =>
    [t.d, `"${t.merch.replace(/"/g, '""')}"`, t.cat, t.sub ?? "", `"${t.acct}"`, t.amt.toFixed(2)].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `finance-pro-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export function ReportsPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const t = I18N[lang];
  const pt = lang === "pt";
  const [period, setPeriod] = useState<"30d" | "90d" | "12m" | "ytd">("90d");
  const [reportTab, setReportTab] = useState<"overview" | "categories" | "merchants" | "monthly">("overview");

  if (!txns.length) {
    return (
      <div className="page">
        <div className="page-head">
          <div><h1 className="page-title">{t.nav_reports}</h1></div>
        </div>
        <EmptyState icon="report" title={pt ? "Sem dados para relatório" : "No report data"}
          sub={pt ? "Importe suas transações para visualizar relatórios detalhados." : "Import your transactions to view detailed reports."}
          cta={pt ? "Importar transações" : "Import transactions"}
          onCta={() => (window as any).__navigate?.("import")} />
      </div>
    );
  }

  // Period-aware filtered set
  const cutoff = periodCutoff(period);
  const filtered = txns.filter(t => !t.exclude && t.d >= cutoff);
  const expenses = filtered.filter(t => t.amt < 0);
  const incomes = filtered.filter(t => t.amt > 0);

  const totalIncome = incomes.reduce((s, t) => s + t.amt, 0);
  const totalExpense = Math.abs(expenses.reduce((s, t) => s + t.amt, 0));
  const net = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (net / totalIncome) * 100 : 0;

  // Category breakdown
  const byCat: Record<string, number> = {};
  expenses.filter(t => t.cat !== "transfer").forEach(t => {
    byCat[t.cat] = (byCat[t.cat] ?? 0) + Math.abs(t.amt);
  });
  const catBreakdown = Object.entries(byCat).map(([k, v]) => ({ k, v })).sort((a, b) => b.v - a.v);
  const catTotal = catBreakdown.reduce((s, c) => s + c.v, 0);

  // Sub-category breakdown per category
  const bySub: Record<string, Record<string, number>> = {};
  expenses.filter(t => t.sub && t.cat !== "transfer").forEach(t => {
    if (!bySub[t.cat]) bySub[t.cat] = {};
    bySub[t.cat][t.sub!] = (bySub[t.cat][t.sub!] ?? 0) + Math.abs(t.amt);
  });

  // Top merchants
  const byMerch: Record<string, { total: number; count: number; cat: string }> = {};
  expenses.filter(t => t.cat !== "transfer").forEach(t => {
    if (!byMerch[t.merch]) byMerch[t.merch] = { total: 0, count: 0, cat: t.cat };
    byMerch[t.merch].total += Math.abs(t.amt);
    byMerch[t.merch].count++;
  });
  const topMerchants = Object.entries(byMerch).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total).slice(0, 15);

  // Monthly breakdown (last 12 months or period)
  const monthlyMap: Record<string, { ym: string; income: number; expense: number }> = {};
  filtered.forEach(t => {
    const ym = t.d.slice(0, 7);
    if (!monthlyMap[ym]) monthlyMap[ym] = { ym, income: 0, expense: 0 };
    if (t.amt > 0) monthlyMap[ym].income += t.amt;
    else monthlyMap[ym].expense += Math.abs(t.amt);
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.ym.localeCompare(b.ym));

  // Spending by day of week
  const DAY_NAMES_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const DAY_NAMES_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDow: number[] = [0, 0, 0, 0, 0, 0, 0];
  expenses.forEach(t => {
    const dow = new Date(t.d + "T12:00:00").getDay();
    byDow[dow] += Math.abs(t.amt);
  });
  const maxDow = Math.max(...byDow, 1);

  // cashflow data for chart
  const cashflowForChart = computeStats(txns).cashflow;

  // avg monthly spend
  const months = monthlyData.length || 1;
  const avgMonthlySpend = totalExpense / months;

  const periodLabel: Record<string, string> = {
    "30d": pt ? "últimos 30 dias" : "last 30 days",
    "90d": pt ? "últimos 90 dias" : "last 90 days",
    "12m": pt ? "últimos 12 meses" : "last 12 months",
    "ytd": pt ? "ano até hoje" : "year to date",
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_reports}</h1>
          <div className="page-sub">{filtered.length} {pt ? "transações ·" : "transactions ·"} {periodLabel[period]}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div className="seg" style={{ fontSize: 12 }}>
            <button className={period === "30d" ? "on" : ""} onClick={() => setPeriod("30d")}>{t.last_30d}</button>
            <button className={period === "90d" ? "on" : ""} onClick={() => setPeriod("90d")}>90d</button>
            <button className={period === "12m" ? "on" : ""} onClick={() => setPeriod("12m")}>{t.last_12m}</button>
            <button className={period === "ytd" ? "on" : ""} onClick={() => setPeriod("ytd")}>{t.ytd}</button>
          </div>
          <button className="btn sm" onClick={() => exportCSV(filtered, lang)}>
            <Icon name="download" className="btn-icon" />{pt ? "CSV" : "CSV"}
          </button>
        </div>
      </div>

      {/* KPI row — period aware */}
      <div className="grid g-4" style={{ marginBottom: 14 }}>
        {[
          { l: pt ? "Receita" : "Income", v: fmtMoney(totalIncome, lang, true), pos: true },
          { l: pt ? "Gastos" : "Expenses", v: fmtMoney(totalExpense, lang, true), pos: false },
          { l: pt ? "Líquido" : "Net", v: (net >= 0 ? "+" : "") + fmtMoney(net, lang, true), pos: net >= 0 },
          { l: pt ? "Taxa de poupança" : "Savings rate", v: totalIncome > 0 ? `${savingsRate.toFixed(1)}%` : "—", pos: savingsRate >= 20 },
        ].map((k, i) => (
          <div key={i} className="kpi">
            <div className="kpi-label">{k.l}</div>
            <div className="kpi-value">{k.v}</div>
          </div>
        ))}
      </div>

      {/* Report tabs */}
      <div className="seg" style={{ marginBottom: 14, fontSize: 12 }}>
        <button className={reportTab === "overview" ? "on" : ""} onClick={() => setReportTab("overview")}>{pt ? "Visão geral" : "Overview"}</button>
        <button className={reportTab === "categories" ? "on" : ""} onClick={() => setReportTab("categories")}>{pt ? "Categorias" : "Categories"}</button>
        <button className={reportTab === "merchants" ? "on" : ""} onClick={() => setReportTab("merchants")}>{pt ? "Estabelecimentos" : "Merchants"}</button>
        <button className={reportTab === "monthly" ? "on" : ""} onClick={() => setReportTab("monthly")}>{pt ? "Mensal" : "Monthly"}</button>
      </div>

      {reportTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Cashflow chart */}
          <div className="card">
            <div className="card-head"><h3 className="card-title">{pt ? "Fluxo de caixa · histórico" : "Cash flow · history"}</h3></div>
            <div className="card-pad">
              <CashflowChart data={cashflowForChart} lang={lang} showAnnotations={false} />
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {/* Category donut */}
            <div className="card">
              <div className="card-head"><h3 className="card-title">{pt ? "Por categoria" : "By category"}</h3></div>
              <div className="card-pad" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <DonutChart data={catBreakdown.slice(0, 8).map(c => ({ v: c.v, color: CAT_COLORS[c.k] ?? "var(--ink-3)" }))} size={130} />
                <div style={{ flex: 1 }}>
                  {catBreakdown.slice(0, 7).map(c => (
                    <div key={c.k} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0", fontSize: 11 }}>
                      <span style={{ width: 7, height: 7, background: CAT_COLORS[c.k] ?? "var(--ink-3)", borderRadius: 2, flexShrink: 0 }} />
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{I18N[lang].categories[c.k] ?? c.k}</span>
                      <span className="num muted">{catTotal > 0 ? (c.v / catTotal * 100).toFixed(0) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Day of week */}
            <div className="card">
              <div className="card-head"><h3 className="card-title">{pt ? "Gastos por dia da semana" : "Spending by weekday"}</h3></div>
              <div className="card-pad">
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
                  {byDow.map((v, i) => {
                    const pct = (v / maxDow) * 100;
                    const names = pt ? DAY_NAMES_PT : DAY_NAMES_EN;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ width: "100%", height: `${Math.max(pct, 4)}%`, background: "var(--accent)", borderRadius: "3px 3px 0 0", opacity: 0.75, minHeight: 4 }} />
                        <div style={{ fontSize: 9, color: "var(--ink-3)", fontWeight: 600 }}>{names[i]}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--ink-3)" }}>
                  {pt
                    ? `Média mensal de gastos: ${fmtMoney(avgMonthlySpend, lang, true)}`
                    : `Avg monthly spending: ${fmtMoney(avgMonthlySpend, lang, true)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportTab === "categories" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {catBreakdown.map(c => {
            const subs = bySub[c.k] ? Object.entries(bySub[c.k]).sort(([, a], [, b]) => b - a) : [];
            return (
              <div key={c.k} className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: CAT_COLORS[c.k] ?? "var(--ink-3)", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{I18N[lang].categories[c.k] ?? c.k}</div>
                    <div style={{ marginTop: 4, height: 5, background: "var(--bg-3)", borderRadius: 3 }}>
                      <div style={{ width: `${catTotal > 0 ? (c.v / catTotal * 100) : 0}%`, height: "100%", background: CAT_COLORS[c.k] ?? "var(--ink-3)", borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>{fmtMoney(c.v, lang, true)}</div>
                    <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{catTotal > 0 ? (c.v / catTotal * 100).toFixed(1) : 0}%</div>
                  </div>
                </div>
                {subs.length > 0 && (
                  <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)", padding: "6px 0" }}>
                    {subs.map(([sub, v]) => (
                      <div key={sub} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 16px 4px 36px", fontSize: 11 }}>
                        <span style={{ flex: 1, color: "var(--ink-2)" }}>{sub}</span>
                        <div style={{ width: 80, height: 4, background: "var(--bg-3)", borderRadius: 2 }}>
                          <div style={{ width: `${c.v > 0 ? (v / c.v * 100) : 0}%`, height: "100%", background: CAT_COLORS[c.k] + "90", borderRadius: 2 }} />
                        </div>
                        <span className="num" style={{ width: 70, textAlign: "right", color: "var(--ink-2)" }}>{fmtMoney(v, lang, true)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {reportTab === "merchants" && (
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{pt ? "Top estabelecimentos" : "Top merchants"}</h3>
            <span className="chip-sm">{topMerchants.length}</span>
          </div>
          <table className="t">
            <thead><tr>
              <th>#</th>
              <th>{pt ? "Estabelecimento" : "Merchant"}</th>
              <th>{pt ? "Categoria" : "Category"}</th>
              <th className="r">{pt ? "Transações" : "Transactions"}</th>
              <th className="r">{pt ? "Total" : "Total"}</th>
              <th className="r">{pt ? "Média" : "Avg"}</th>
              <th></th>
            </tr></thead>
            <tbody>
              {topMerchants.map((m, i) => (
                <tr key={i}>
                  <td className="muted" style={{ fontSize: 11 }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{m.name}</td>
                  <td>
                    <span className="pill" style={{ fontSize: 10 }}>
                      <span className="cat-dot" style={{ background: CAT_COLORS[m.cat] }} />
                      {I18N[lang].categories[m.cat] ?? m.cat}
                    </span>
                  </td>
                  <td className="r muted" style={{ fontSize: 11 }}>{m.count}</td>
                  <td className="r num" style={{ fontWeight: 600 }}>{fmtMoney(m.total, lang, true)}</td>
                  <td className="r num muted" style={{ fontSize: 11 }}>{fmtMoney(m.total / m.count, lang, true)}</td>
                  <td style={{ width: 70 }}>
                    <div style={{ height: 4, background: "var(--bg-3)", borderRadius: 2 }}>
                      <div style={{ width: `${topMerchants[0].total > 0 ? (m.total / topMerchants[0].total * 100) : 0}%`, height: "100%", background: CAT_COLORS[m.cat] ?? "var(--ink-3)", borderRadius: 2 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportTab === "monthly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Mini bars per month */}
          <div className="card card-pad">
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>{pt ? "Gastos mensais" : "Monthly expenses"}</div>
            {(() => {
              const maxExp = Math.max(...monthlyData.map(m => m.expense), 1);
              return (
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 100, overflowX: "auto" }}>
                  {monthlyData.map((m, i) => {
                    const pct = (m.expense / maxExp) * 100;
                    const label = new Date(m.ym + "-01").toLocaleDateString(pt ? "pt-BR" : "en-US", { month: "short" });
                    return (
                      <div key={i} style={{ flex: "0 0 auto", minWidth: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <div style={{ fontSize: 8, color: "var(--ink-3)", fontWeight: 600 }}>{fmtMoney(m.expense / 1000, lang, false)}k</div>
                        <div style={{ width: 28, height: `${Math.max(pct, 4)}%`, background: "var(--ink)", borderRadius: "3px 3px 0 0", opacity: 0.75, minHeight: 4 }} />
                        <div style={{ fontSize: 9, color: "var(--ink-3)", fontWeight: 600 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="card">
            <div className="card-head"><h3 className="card-title">{pt ? "Comparativo mensal" : "Monthly comparison"}</h3></div>
            <table className="t">
              <thead><tr>
                <th>{pt ? "Mês" : "Month"}</th>
                <th className="r">{pt ? "Receita" : "Income"}</th>
                <th className="r">{pt ? "Gastos" : "Expense"}</th>
                <th className="r">{pt ? "Líquido" : "Net"}</th>
                <th className="r">{pt ? "Poupança" : "Savings"}</th>
                <th className="r">Δ</th>
              </tr></thead>
              <tbody>
                {monthlyData.map((m, i, arr) => {
                  const mNet = m.income - m.expense;
                  const rate = m.income > 0 ? (mNet / m.income * 100).toFixed(0) : "—";
                  const prev = i > 0 ? arr[i - 1].expense : m.expense;
                  const delta = prev > 0 ? ((m.expense - prev) / prev * 100).toFixed(1) : "0";
                  const label = new Date(m.ym + "-01").toLocaleDateString(pt ? "pt-BR" : "en-US", { month: "long", year: "numeric" });
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 600, fontSize: 12 }}>{label}</td>
                      <td className="r num pos">{m.income > 0 ? fmtMoney(m.income, lang, true) : "—"}</td>
                      <td className="r num">{fmtMoney(m.expense, lang, true)}</td>
                      <td className={"r num" + (mNet >= 0 ? " pos" : "")} style={{ fontWeight: 600 }}>{(mNet >= 0 ? "+" : "") + fmtMoney(mNet, lang, true)}</td>
                      <td className="r num muted">{rate}{typeof rate === "string" && rate !== "—" ? "%" : ""}</td>
                      <td className={"r num " + (Number(delta) > 0 ? "neg" : "pos")} style={{ fontSize: 11 }}>
                        {i > 0 ? (Number(delta) > 0 ? "+" : "") + delta + "%" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
type AcctPeriod = 'week' | 'month' | '3months' | 'year' | 'all';

function payMethod(tx: Txn, pt: boolean): { label: string; color: string } {
  const m = tx.merch.toLowerCase();
  if (tx.cat === 'transfer') {
    if (/pix/.test(m)) return { label: 'PIX', color: '#22c55e' };
    if (/ted|doc/.test(m)) return { label: 'TED', color: '#3b82f6' };
    return { label: pt ? 'Transf.' : 'Transfer', color: '#6366f1' };
  }
  if (tx.kind === 'card') return { label: pt ? 'Crédito' : 'Credit', color: '#8b5cf6' };
  if (tx.amt > 0) {
    if (/pix/.test(m)) return { label: 'PIX', color: '#22c55e' };
    if (/salari|salário/.test(m)) return { label: pt ? 'Salário' : 'Salary', color: '#10b981' };
    return { label: pt ? 'Crédito' : 'Credit', color: '#10b981' };
  }
  if (/pix/.test(m)) return { label: 'PIX', color: '#f59e0b' };
  if (/débito|debito|cartao deb/.test(m)) return { label: pt ? 'Débito' : 'Debit', color: '#f97316' };
  return { label: pt ? 'Débito' : 'Debit', color: 'var(--ink-3)' };
}

export function AccountsPage({ lang, onEditTxn, txns = [] }: { lang: Lang; onEditTxn?: (tx: Txn) => void; txns?: Txn[] }) {
  const t = I18N[lang];
  const pt = lang === 'pt';
  const [period, setPeriod] = useState<AcctPeriod>('month');
  const [selAcct, setSelAcct] = useState('all');
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');

  if (!txns.length) return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">{pt ? "Sem dados importados" : "No data imported"}</div>
        </div>
        <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
          <Icon name="upload" className="btn-icon" />{pt ? "Importar extrato" : "Import statement"}
        </button>
      </div>
      <EmptyState icon="bank" title={pt ? "Nenhuma conta ainda" : "No accounts yet"} sub={pt ? "Importe um extrato bancário para ver suas contas e transações aqui." : "Import a bank statement to see your accounts and transactions here."} cta={pt ? "Importar extrato" : "Import statement"} onCta={() => (window as any).__navigate?.("import")} />
    </div>
  );

  // Period filter
  const now = new Date();
  const cutoff: string | null = (() => {
    if (period === 'all') return null;
    const d = new Date(now);
    if (period === 'week') d.setDate(d.getDate() - 7);
    else if (period === 'month') d.setDate(d.getDate() - 30);
    else if (period === '3months') d.setDate(d.getDate() - 90);
    else d.setDate(d.getDate() - 365);
    return d.toISOString().slice(0, 10);
  })();

  const periodTxns = cutoff ? txns.filter(tx => tx.d >= cutoff) : txns;
  const acctTxns = selAcct === 'all' ? periodTxns : periodTxns.filter(tx => tx.acct === selAcct);
  const searchedTxns = search.trim()
    ? acctTxns.filter(tx => tx.merch.toLowerCase().includes(search.toLowerCase()) || tx.acct.toLowerCase().includes(search.toLowerCase()))
    : acctTxns;
  const displayTxns = [...searchedTxns].sort((a, b) => sortDir === 'desc' ? b.d.localeCompare(a.d) : a.d.localeCompare(b.d));

  // Account summaries (from period-filtered txns)
  const allAccts = [...new Set(txns.map(tx => tx.acct))].sort();
  const acctMap: Record<string, { in: number; out: number }> = {};
  periodTxns.forEach(tx => {
    if (!acctMap[tx.acct]) acctMap[tx.acct] = { in: 0, out: 0 };
    if (tx.amt > 0) acctMap[tx.acct].in += tx.amt;
    else acctMap[tx.acct].out += Math.abs(tx.amt);
  });
  const accounts = Object.entries(acctMap).map(([name, v]) => ({ name, ...v, net: v.in - v.out })).sort((a, b) => b.out - a.out);

  const PERIOD_LABELS: Record<AcctPeriod, string> = {
    week: pt ? 'Semana' : 'Week',
    month: pt ? 'Mês' : 'Month',
    '3months': pt ? '3 meses' : '3 months',
    year: pt ? 'Ano' : 'Year',
    all: pt ? 'Tudo' : 'All',
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">
            {displayTxns.length} {pt ? "transações" : "transactions"} · {pt ? "período:" : "period:"} {PERIOD_LABELS[period]}
          </div>
        </div>
        <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
          <Icon name="upload" className="btn-icon" />{pt ? "Importar" : "Import"}
        </button>
      </div>

      {/* Period filter */}
      <div className="seg" style={{ marginBottom: 12, fontSize: 12 }}>
        {(Object.keys(PERIOD_LABELS) as AcctPeriod[]).map(p => (
          <button key={p} className={period === p ? 'on' : ''} onClick={() => setPeriod(p)}>{PERIOD_LABELS[p]}</button>
        ))}
      </div>

      {/* Account chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        <button className={'btn sm' + (selAcct === 'all' ? ' primary' : '')} onClick={() => setSelAcct('all')}>
          {pt ? 'Todas as contas' : 'All accounts'}
        </button>
        {accounts.map(a => (
          <button key={a.name} className={'btn sm' + (selAcct === a.name ? ' primary' : '')} onClick={() => setSelAcct(selAcct === a.name ? 'all' : a.name)} style={{ flexShrink: 0 }}>
            {a.name}
            {selAcct !== a.name && <span style={{ marginLeft: 5, fontSize: 10, opacity: 0.6 }}>{fmtMoney(a.out, lang, true)}</span>}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {selAcct !== 'all' && acctMap[selAcct] && (
        <div className="grid g-3" style={{ marginBottom: 14 }}>
          <div className="card card-pad">
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{pt ? 'Entradas' : 'Income'}</div>
            <div className="num pos" style={{ fontSize: 18, fontWeight: 700 }}>+{fmtMoney(acctMap[selAcct].in, lang, true)}</div>
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{pt ? 'Saídas' : 'Expenses'}</div>
            <div className="num" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{fmtMoney(acctMap[selAcct].out, lang, true)}</div>
          </div>
          <div className="card card-pad">
            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>{pt ? 'Saldo período' : 'Period balance'}</div>
            {(() => { const net = acctMap[selAcct].in - acctMap[selAcct].out; return (
              <div className={'num' + (net >= 0 ? ' pos' : '')} style={{ fontSize: 18, fontWeight: 700 }}>
                {net >= 0 ? '+' : ''}{fmtMoney(net, lang, true)}
              </div>
            ); })()}
          </div>
        </div>
      )}

      {/* Transaction table */}
      <div className="card">
        <div className="card-head">
          <h3 className="card-title">{pt ? 'Transações' : 'Transactions'}</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              placeholder={pt ? 'Buscar…' : 'Search…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="field"
              style={{ height: 28, fontSize: 12, padding: '0 8px', width: 140 }}
            />
            <button className="btn ghost sm" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')} title={pt ? 'Inverter ordem' : 'Toggle sort'}>
              <Icon name={sortDir === 'desc' ? 'arrow_down' : 'arrow_up'} className="btn-icon" />
            </button>
            <span className="chip-sm">{displayTxns.length}</span>
          </div>
        </div>
        <table className="t">
          <thead><tr>
            <th>{pt ? "Data" : "Date"}</th>
            <th>{pt ? "Descrição" : "Description"}</th>
            <th>{pt ? "Tipo" : "Type"}</th>
            <th>{pt ? "Categoria" : "Category"}</th>
            {selAcct === 'all' && <th>{pt ? "Conta" : "Account"}</th>}
            <th className="r">{pt ? "Valor" : "Amount"}</th>
          </tr></thead>
          <tbody>
            {displayTxns.map((tx, i) => {
              const pm = payMethod(tx, pt);
              return (
                <tr key={i} style={{ cursor: "pointer", opacity: tx.exclude ? 0.45 : 1 }} onClick={() => onEditTxn?.(tx)}>
                  <td className="num muted" style={{ fontSize: 11.5 }}>{fmtDate(tx.d, lang)}</td>
                  <td style={{ fontWeight: 500, textDecoration: tx.exclude ? 'line-through' : 'none' }}>{tx.merch}</td>
                  <td>
                    <span style={{ fontSize: 10, fontWeight: 600, borderRadius: 4, padding: '1px 6px', background: pm.color + '18', color: pm.color, border: `1px solid ${pm.color}40`, whiteSpace: 'nowrap' }}>
                      {pm.label}
                    </span>
                  </td>
                  <td>
                    <span className="pill">
                      <span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }} />
                      {I18N[lang].categories[tx.cat] ?? tx.cat}
                    </span>
                  </td>
                  {selAcct === 'all' && <td className="muted" style={{ fontSize: 11.5 }}>{tx.acct}</td>}
                  <td className={"r num " + (tx.amt > 0 ? "pos" : "")} style={{ fontWeight: 600 }}>
                    {tx.amt > 0 ? "+" : ""}{fmtMoney(tx.amt, lang)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============ CATEGORIES ============ */
interface CatConfig {
  labels: Record<string, string>;
  subcats: Record<string, string[]>;
  custom: string[];
  colors: Record<string, string>;
}
const EMPTY_CAT_CONFIG: CatConfig = { labels: {}, subcats: {}, custom: [], colors: {} };
function loadCatConfig(): CatConfig {
  try { return { ...EMPTY_CAT_CONFIG, ...JSON.parse(localStorage.getItem("fp_cat_config") ?? "{}") }; } catch { return EMPTY_CAT_CONFIG; }
}
function saveCatConfig(c: CatConfig) { localStorage.setItem("fp_cat_config", JSON.stringify(c)); }

export function CategoriesPage({ lang, txns = [] }: { lang: Lang; txns?: Txn[] }) {
  const [config, setConfig] = useState<CatConfig>(EMPTY_CAT_CONFIG);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingCatVal, setEditingCatVal] = useState("");
  const [editingSub, setEditingSub] = useState<{ cat: string; sub: string } | null>(null);
  const [editingSubVal, setEditingSubVal] = useState("");
  const [addingSubFor, setAddingSubFor] = useState<string | null>(null);
  const [newSubVal, setNewSubVal] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState("");
  const catInputRef = useRef<HTMLInputElement>(null);
  const subInputRef = useRef<HTMLInputElement>(null);
  const newSubInputRef = useRef<HTMLInputElement>(null);
  const newCatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setConfig(loadCatConfig()); }, []);
  useEffect(() => { if (editingCat && catInputRef.current) catInputRef.current.focus(); }, [editingCat]);
  useEffect(() => { if (editingSub && subInputRef.current) subInputRef.current.focus(); }, [editingSub]);
  useEffect(() => { if (addingSubFor && newSubInputRef.current) newSubInputRef.current.focus(); }, [addingSubFor]);
  useEffect(() => { if (showNewCat && newCatInputRef.current) newCatInputRef.current.focus(); }, [showNewCat]);

  const updateConfig = (fn: (c: CatConfig) => CatConfig) => {
    setConfig(prev => { const next = fn(prev); saveCatConfig(next); return next; });
  };

  const builtinKeys = Object.keys(I18N[lang].categories);
  const allCatKeys = [...new Set([...builtinKeys, ...config.custom, ...txns.map(t => t.cat)])].filter(Boolean);

  const catLabel = (k: string) => config.labels[k] ?? I18N[lang].categories[k] ?? k;
  const catColor = (k: string) => config.colors[k] ?? CAT_COLORS[k] ?? "var(--bg-3)";
  const catSubcats = (k: string): string[] => {
    const base = SUBCATS[k] ?? [];
    const cfg = config.subcats[k] ?? [];
    const fromTxns = [...new Set(txns.filter(t => t.cat === k && t.sub).map(t => t.sub!))];
    return [...new Set([...base, ...cfg, ...fromTxns])];
  };

  // spending this month per cat and sub
  const now = new Date();
  const thisYm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthTxns = txns.filter(t => t.d.startsWith(thisYm) && !t.exclude);
  const spendByCat: Record<string, number> = {};
  const spendBySub: Record<string, Record<string, number>> = {};
  const countByCat: Record<string, number> = {};
  const countBySub: Record<string, Record<string, number>> = {};
  for (const t of monthTxns) {
    const abs = Math.abs(t.amt);
    if (t.amt < 0) {
      spendByCat[t.cat] = (spendByCat[t.cat] ?? 0) + abs;
      countByCat[t.cat] = (countByCat[t.cat] ?? 0) + 1;
      if (t.sub) {
        if (!spendBySub[t.cat]) spendBySub[t.cat] = {};
        spendBySub[t.cat][t.sub] = (spendBySub[t.cat][t.sub] ?? 0) + abs;
        if (!countBySub[t.cat]) countBySub[t.cat] = {};
        countBySub[t.cat][t.sub] = (countBySub[t.cat][t.sub] ?? 0) + 1;
      }
    }
  }

  const saveCatLabel = () => {
    if (!editingCat) return;
    const v = editingCatVal.trim();
    if (v) updateConfig(c => ({ ...c, labels: { ...c.labels, [editingCat]: v } }));
    setEditingCat(null);
  };
  const saveSubLabel = () => {
    if (!editingSub) return;
    const v = editingSubVal.trim();
    if (v && v !== editingSub.sub) {
      updateConfig(c => {
        const existing = catSubcats(editingSub.cat);
        const updated = existing.map(s => s === editingSub.sub ? v : s);
        const newCfg = { ...c, subcats: { ...c.subcats, [editingSub.cat]: updated } };
        return newCfg;
      });
      // bulk rename across txns
      if (typeof (window as any).__bulkUpdateSub === "function") {
        (window as any).__bulkUpdateSub(editingSub.cat, editingSub.sub, v);
      }
    }
    setEditingSub(null);
  };
  const addSub = (cat: string) => {
    const v = newSubVal.trim();
    if (!v) { setAddingSubFor(null); return; }
    updateConfig(c => {
      const existing = catSubcats(cat);
      if (existing.includes(v)) { setAddingSubFor(null); setNewSubVal(""); return c; }
      return { ...c, subcats: { ...c.subcats, [cat]: [...(c.subcats[cat] ?? []), v] } };
    });
    setAddingSubFor(null);
    setNewSubVal("");
  };
  const createCat = () => {
    const v = newCatLabel.trim();
    if (!v) { setShowNewCat(false); return; }
    const key = v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    updateConfig(c => ({
      ...c,
      labels: { ...c.labels, [key]: v },
      custom: c.custom.includes(key) ? c.custom : [...c.custom, key],
    }));
    setNewCatLabel("");
    setShowNewCat(false);
    setExpanded(prev => new Set([...prev, key]));
  };

  const toggle = (k: string) => setExpanded(prev => {
    const next = new Set(prev);
    next.has(k) ? next.delete(k) : next.add(k);
    return next;
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{I18N[lang].nav_categories}</h1>
          <div className="page-sub">{lang === "pt" ? "Categorias e subcategorias dos seus gastos" : "Spending categories and subcategories"}</div>
        </div>
        <button className="btn primary sm" onClick={() => setShowNewCat(true)}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova categoria" : "New category"}
        </button>
      </div>

      {showNewCat && (
        <div className="card card-pad" style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <input
            ref={newCatInputRef}
            className="input"
            style={{ flex: 1, fontSize: 13 }}
            placeholder={lang === "pt" ? "Nome da categoria..." : "Category name..."}
            value={newCatLabel}
            onChange={e => setNewCatLabel(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") createCat(); if (e.key === "Escape") { setShowNewCat(false); setNewCatLabel(""); } }}
          />
          <button className="btn primary sm" onClick={createCat}>{lang === "pt" ? "Criar" : "Create"}</button>
          <button className="btn sm" onClick={() => { setShowNewCat(false); setNewCatLabel(""); }}>{lang === "pt" ? "Cancelar" : "Cancel"}</button>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {allCatKeys.map(k => {
          const isOpen = expanded.has(k);
          const spend = spendByCat[k] ?? 0;
          const count = countByCat[k] ?? 0;
          const subs = catSubcats(k);
          const color = catColor(k);
          const isEditingThis = editingCat === k;

          return (
            <div key={k} className="card" style={{ overflow: "hidden" }}>
              {/* Category row */}
              <div
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", userSelect: "none" }}
                onClick={() => { if (!isEditingThis) toggle(k); }}
              >
                <div style={{ width: 28, height: 28, borderRadius: 6, background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isEditingThis ? (
                    <input
                      ref={catInputRef}
                      className="input"
                      style={{ fontSize: 13, fontWeight: 600, width: "100%", padding: "2px 6px" }}
                      value={editingCatVal}
                      onChange={e => setEditingCatVal(e.target.value)}
                      onKeyDown={e => { e.stopPropagation(); if (e.key === "Enter") saveCatLabel(); if (e.key === "Escape") setEditingCat(null); }}
                      onClick={e => e.stopPropagation()}
                      onBlur={saveCatLabel}
                    />
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{catLabel(k)}</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {spend > 0 && <span className="num" style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-1)" }}>{fmtMoney(spend, lang, true)}</span>}
                  {count > 0 && <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{count} {lang === "pt" ? "txns" : "txns"}</span>}
                  <button
                    className="btn ghost sm"
                    style={{ padding: "2px 5px", opacity: 0.6 }}
                    onClick={e => { e.stopPropagation(); setEditingCat(k); setEditingCatVal(catLabel(k)); setExpanded(prev => new Set([...prev, k])); }}
                    title={lang === "pt" ? "Renomear" : "Rename"}
                  >
                    <Icon name="tag" className="btn-icon" />
                  </button>
                  <Icon name={isOpen ? "chevron_down" : "chevron_right"} className="nav-icon" style={{ width: 14, height: 14, opacity: 0.4 }} />
                </div>
              </div>

              {/* Subcategory list */}
              {isOpen && (
                <div style={{ borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
                  {subs.length === 0 && !addingSubFor && (
                    <div style={{ padding: "8px 14px 8px 50px", fontSize: 11, color: "var(--ink-4)" }}>
                      {lang === "pt" ? "Sem subcategorias" : "No subcategories"}
                    </div>
                  )}
                  {subs.map(sub => {
                    const subSpend = spendBySub[k]?.[sub] ?? 0;
                    const subCount = countBySub[k]?.[sub] ?? 0;
                    const isEditingSub = editingSub?.cat === k && editingSub?.sub === sub;
                    return (
                      <div key={sub} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 14px 7px 50px", borderBottom: "1px solid var(--border)" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {isEditingSub ? (
                            <input
                              ref={subInputRef}
                              className="input"
                              style={{ fontSize: 12, width: "100%", padding: "2px 6px" }}
                              value={editingSubVal}
                              onChange={e => setEditingSubVal(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveSubLabel(); if (e.key === "Escape") setEditingSub(null); }}
                              onBlur={saveSubLabel}
                            />
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{sub}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                          {subSpend > 0 && <span className="num" style={{ fontSize: 12, color: "var(--ink-2)" }}>{fmtMoney(subSpend, lang, true)}</span>}
                          {subCount > 0 && <span style={{ fontSize: 10, color: "var(--ink-4)" }}>{subCount}</span>}
                          <button
                            className="btn ghost sm"
                            style={{ padding: "2px 4px", opacity: 0.5 }}
                            onClick={() => { setEditingSub({ cat: k, sub }); setEditingSubVal(sub); }}
                            title={lang === "pt" ? "Renomear" : "Rename"}
                          >
                            <Icon name="tag" className="btn-icon" style={{ width: 11, height: 11 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Add subcategory */}
                  {addingSubFor === k ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px 6px 50px" }}>
                      <input
                        ref={newSubInputRef}
                        className="input"
                        style={{ flex: 1, fontSize: 12, padding: "3px 8px" }}
                        placeholder={lang === "pt" ? "Nova subcategoria..." : "New subcategory..."}
                        value={newSubVal}
                        onChange={e => setNewSubVal(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") addSub(k); if (e.key === "Escape") { setAddingSubFor(null); setNewSubVal(""); } }}
                        onBlur={() => addSub(k)}
                      />
                    </div>
                  ) : (
                    <button
                      className="btn ghost sm"
                      style={{ margin: "4px 14px 4px 50px", fontSize: 11, opacity: 0.6 }}
                      onClick={() => setAddingSubFor(k)}
                    >
                      <Icon name="plus" className="btn-icon" style={{ width: 12, height: 12 }} />
                      {lang === "pt" ? "Nova subcategoria" : "New subcategory"}
                    </button>
                  )}
                </div>
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
