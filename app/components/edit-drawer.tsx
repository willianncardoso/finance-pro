"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, Txn, SUBCATS, LEARNED_RULES, RECURRING, INSTALLMENTS, fmtMoney, buildProjection, ProjectionMonth, RecurringItem, InstallmentItem } from "../lib/data";
import { ProjectionChart } from "./charts";

interface EditDrawerProps {
  txn: Txn | null;
  lang: Lang;
  onClose: () => void;
  onSave: (txn: Txn) => void;
}

export function EditDrawer({ txn, lang, onClose, onSave }: EditDrawerProps) {
  const t = I18N[lang];
  const [cat, setCat] = useState(txn?.cat ?? "");
  const [sub, setSub] = useState(txn?.sub ?? "");
  const [merch, setMerch] = useState(txn?.merch ?? "");
  const [amt, setAmt] = useState(txn ? Math.abs(txn.amt).toString() : "");
  const [notes, setNotes] = useState(txn?.notes ?? "");
  const [recurring, setRecurring] = useState(txn?.recurring ?? false);
  const [exclude, setExclude] = useState(txn?.exclude ?? false);
  const [reimbursable, setReimbursable] = useState(txn?.reimbursable ?? false);
  const [learnRule, setLearnRule] = useState(true);
  const [split, setSplit] = useState(false);
  const [splitAmt, setSplitAmt] = useState("");
  const [splitCatA, setSplitCatA] = useState("");
  const [splitCatB, setSplitCatB] = useState("");

  useEffect(() => {
    if (txn) {
      setCat(txn.cat ?? "");
      setSub(txn.sub ?? "");
      setMerch(txn.merch ?? "");
      setAmt(Math.abs(txn.amt).toString());
      setNotes(txn.notes ?? "");
      setRecurring(txn.recurring ?? false);
      setExclude(txn.exclude ?? false);
      setReimbursable(txn.reimbursable ?? false);
      setLearnRule(true);
      setSplit(false);
    }
  }, [txn?.d, txn?.merch]);

  const subcatOptions = cat && SUBCATS[cat] ? SUBCATS[cat] : [];
  const suggestions = LEARNED_RULES.filter(
    (r) => txn && txn.merch && txn.merch.toLowerCase().includes(r.pattern.replace("*", "").toLowerCase())
  ).slice(0, 3);

  const cats = Object.keys(SUBCATS);

  if (!txn) return null;

  function handleSave() {
    onSave({ ...txn!, cat, sub, merch, amt: txn!.amt < 0 ? -parseFloat(amt) : parseFloat(amt), notes, recurring, exclude, reimbursable });
    onClose();
  }

  const isExpense = txn.amt < 0;

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{lang === "pt" ? "Editar transação" : "Edit transaction"}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }} className="mono">{txn.d} · {txn.acct}</div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="x" style={{ width: 16, height: 16 }} className="" />
          </button>
        </div>

        <div className="drawer-body">
          <div className="drawer-section">
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">{lang === "pt" ? "Descrição" : "Description"}</label>
                <input className="field" value={merch} onChange={e => setMerch(e.target.value)} />
              </div>
              <div style={{ width: 120 }}>
                <label className="field-label">{lang === "pt" ? "Valor" : "Amount"}</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--ink-3)" }}>
                    {isExpense ? "−" : "+"}
                  </span>
                  <input className="field mono" style={{ paddingLeft: 20 }} value={amt} onChange={e => setAmt(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="drawer-section">
              <label className="field-label">{lang === "pt" ? "Sugestões aprendidas" : "Learned suggestions"}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {suggestions.map((s, i) => (
                  <button key={i} className="pill info" style={{ cursor: "pointer", border: "none" }}
                    onClick={() => { setCat(s.cat); setSub(s.sub ?? ""); }}>
                    {I18N[lang].categories[s.cat] ?? s.cat}{s.sub ? ` / ${s.sub}` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="drawer-section">
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="field-label">{lang === "pt" ? "Categoria" : "Category"}</label>
                <select className="field" value={cat} onChange={e => { setCat(e.target.value); setSub(""); }}>
                  <option value="">—</option>
                  {cats.map(c => (
                    <option key={c} value={c}>{I18N[lang].categories[c] ?? c}</option>
                  ))}
                </select>
              </div>
              {subcatOptions.length > 0 && (
                <div style={{ flex: 1 }}>
                  <label className="field-label">{lang === "pt" ? "Subcategoria" : "Subcategory"}</label>
                  <select className="field" value={sub} onChange={e => setSub(e.target.value)}>
                    <option value="">—</option>
                    {subcatOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="drawer-section">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: split ? 10 : 0 }}>
              <label className="field-label" style={{ margin: 0 }}>{lang === "pt" ? "Dividir transação" : "Split transaction"}</label>
              <button className={"toggle" + (split ? " on" : "")} onClick={() => setSplit(!split)} />
            </div>
            {split && (
              <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                <div style={{ flex: 1 }}>
                  <label className="field-label">{lang === "pt" ? "Parte A" : "Part A"}</label>
                  <select className="field" value={splitCatA} onChange={e => setSplitCatA(e.target.value)} style={{ marginBottom: 6 }}>
                    <option value="">—</option>
                    {cats.map(c => <option key={c} value={c}>{I18N[lang].categories[c] ?? c}</option>)}
                  </select>
                  <input className="field mono" placeholder="0,00" value={splitAmt} onChange={e => setSplitAmt(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="field-label">{lang === "pt" ? "Parte B" : "Part B"}</label>
                  <select className="field" value={splitCatB} onChange={e => setSplitCatB(e.target.value)} style={{ marginBottom: 6 }}>
                    <option value="">—</option>
                    {cats.map(c => <option key={c} value={c}>{I18N[lang].categories[c] ?? c}</option>)}
                  </select>
                  <input className="field mono" placeholder="0,00" readOnly
                    value={splitAmt && !isNaN(parseFloat(splitAmt)) ? (parseFloat(amt) - parseFloat(splitAmt)).toFixed(2) : ""} />
                </div>
              </div>
            )}
          </div>

          <div className="drawer-section">
            <label className="field-label">{lang === "pt" ? "Notas" : "Notes"}</label>
            <textarea className="field" rows={2} style={{ resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder={lang === "pt" ? "Observações opcionais…" : "Optional notes…"} />
          </div>

          <div className="drawer-section">
            <label className="field-label" style={{ marginBottom: 8 }}>{lang === "pt" ? "Marcadores" : "Flags"}</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {([
                { key: "recurring", val: recurring, set: setRecurring, label: lang === "pt" ? "Recorrente" : "Recurring", sub: lang === "pt" ? "Adicionar à lista de recorrentes" : "Add to recurring list" },
                { key: "exclude", val: exclude, set: setExclude, label: lang === "pt" ? "Excluir de relatórios" : "Exclude from reports", sub: lang === "pt" ? "Não contar nas estatísticas" : "Don't count in statistics" },
                { key: "reimbursable", val: reimbursable, set: setReimbursable, label: lang === "pt" ? "Reembolsável" : "Reimbursable", sub: lang === "pt" ? "Aguardando devolução" : "Awaiting reimbursement" },
              ] as const).map(f => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{f.sub}</div>
                  </div>
                  <button className={"toggle" + (f.val ? " on" : "")} onClick={() => (f.set as (v: boolean) => void)(!f.val)} />
                </div>
              ))}
            </div>
          </div>

          <div className="drawer-section" style={{ background: "var(--bg-2)", borderRadius: 8, padding: "10px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Icon name="sparkle" style={{ width: 13, height: 13 }} className="" />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{lang === "pt" ? "Aprender com esta edição" : "Learn from this edit"}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{lang === "pt" ? "Categorizar automaticamente no futuro" : "Auto-categorize in the future"}</div>
                </div>
              </div>
              <button className={"toggle" + (learnRule ? " on" : "")} onClick={() => setLearnRule(!learnRule)} />
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn ghost" onClick={onClose}>{lang === "pt" ? "Cancelar" : "Cancel"}</button>
          <button className="btn primary" onClick={handleSave}>{lang === "pt" ? "Salvar" : "Save"}</button>
        </div>
      </div>
    </>
  );
}

interface ToastProps {
  message: string;
  kind?: "success" | "warn" | "danger";
  onDismiss: () => void;
}
export function Toast({ message, kind = "success", onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  const iconMap = { success: "check", warn: "alert", danger: "alert" };
  return (
    <div className={"toast " + kind}>
      <Icon name={iconMap[kind]} style={{ width: 14, height: 14 }} className="" />
      <span>{message}</span>
      <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={onDismiss}>
        <Icon name="x" style={{ width: 12, height: 12 }} className="" />
      </button>
    </div>
  );
}

interface ProjectionPageProps {
  lang: Lang;
}
export function ProjectionPage({ lang }: ProjectionPageProps) {
  const months = buildProjection(6);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [scenarioDelta, setScenarioDelta] = useState(0);

  const totalExpected = months.reduce((s, m) => s + m.income, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expense, 0);
  const avgMonthly = totalExpenses / months.length;

  let runningBalance = 73510.67;
  const adjustedMonths = months.map(m => {
    runningBalance += m.net + scenarioDelta;
    return { ...m, balance: runningBalance };
  });
  const finalBalance = adjustedMonths[adjustedMonths.length - 1]?.balance ?? 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{I18N[lang].nav_projection}</h1>
          <p className="page-sub">{lang === "pt" ? "Projeção dos próximos 6 meses" : "6-month cash flow projection"}</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: lang === "pt" ? "Receita esperada" : "Expected income", value: fmtMoney(totalExpected, lang), color: "var(--accent)" },
          { label: lang === "pt" ? "Despesas previstas" : "Projected expenses", value: fmtMoney(totalExpenses, lang), color: "var(--danger)" },
          { label: lang === "pt" ? "Saldo final projetado" : "Projected final balance", value: fmtMoney(finalBalance, lang), color: "var(--ink)" },
          { label: lang === "pt" ? "Média mensal" : "Monthly average", value: fmtMoney(avgMonthly, lang), color: "var(--ink-2)" },
        ].map((k, i) => (
          <div key={i} className="card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }} className="mono">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="card-title">{lang === "pt" ? "Trajetória do saldo" : "Balance trajectory"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{lang === "pt" ? "Ajuste de cenário:" : "Scenario adjust:"}</span>
            <input type="range" min={-5000} max={5000} step={500} value={scenarioDelta}
              onChange={e => setScenarioDelta(Number(e.target.value))} style={{ width: 100 }} />
            <span className="mono" style={{ fontSize: 11, minWidth: 64, textAlign: "right", color: scenarioDelta >= 0 ? "var(--accent)" : "var(--danger)" }}>
              {scenarioDelta >= 0 ? "+" : ""}{fmtMoney(scenarioDelta, lang, true)}
            </span>
          </div>
        </div>
        <ProjectionChart months={adjustedMonths} balances={adjustedMonths.map(m => m.balance)} lang={lang} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {months.map((m, i) => {
          const net = m.net;
          const isSelected = selectedMonth === i;
          const balance = adjustedMonths[i].balance;
          return (
            <div key={i} className="card"
              style={{ padding: "12px 14px", cursor: "pointer", borderColor: isSelected ? "var(--accent)" : undefined, borderWidth: isSelected ? 2 : undefined }}
              onClick={() => setSelectedMonth(isSelected ? null : i)}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{m.label}</span>
                <span className={"pill " + (net >= 0 ? "accent" : "danger")}>
                  {net >= 0 ? "+" : ""}{fmtMoney(net, lang, true)}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)" }}>
                <span>{lang === "pt" ? "Receita" : "In"}: <span className="mono" style={{ color: "var(--accent)" }}>{fmtMoney(m.income, lang, true)}</span></span>
                <span>{lang === "pt" ? "Saída" : "Out"}: <span className="mono" style={{ color: "var(--danger)" }}>{fmtMoney(m.expense, lang, true)}</span></span>
              </div>
              <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-2)" }} className="mono">
                {lang === "pt" ? "Saldo" : "Balance"}: {fmtMoney(balance, lang, true)}
              </div>
              {isSelected && m.items?.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  {m.items.slice(0, 8).map((it, j) => (
                    <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
                      <span style={{ color: "var(--ink-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{it.name}</span>
                      <span className="mono" style={{ color: it.amt < 0 ? "var(--danger)" : "var(--accent)" }}>
                        {fmtMoney(it.amt, lang, true)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>{lang === "pt" ? "Recorrentes incluídos" : "Included recurring"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {RECURRING.slice(0, 6).map((r: RecurringItem, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--ink-2)" }}>{r.name}</span>
                <span className="mono" style={{ color: r.amt < 0 ? "var(--danger)" : "var(--accent)" }}>{fmtMoney(r.amt, lang, true)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 10 }}>{lang === "pt" ? "Parcelas futuras" : "Future installments"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {INSTALLMENTS.map((inst: InstallmentItem, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--ink-2)" }}>{inst.name}</span>
                <span style={{ color: "var(--ink-3)", marginRight: 8, fontSize: 11 }}>{inst.total - inst.current}×</span>
                <span className="mono" style={{ color: "var(--danger)" }}>{fmtMoney(inst.amt, lang, true)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface RecurringPageProps {
  lang: Lang;
}
export function RecurringPage({ lang }: RecurringPageProps) {
  const [tab, setTab] = useState<"recurring" | "installments">("recurring");

  const totalRecurring = RECURRING.reduce((s, r) => s + r.amt, 0);
  const totalInstallments = INSTALLMENTS.reduce((s, r) => s + r.amt, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{I18N[lang].nav_recurring}</h1>
          <p className="page-sub">{lang === "pt" ? "Assinaturas e parcelamentos ativos" : "Active subscriptions and installments"}</p>
        </div>
        <button className="btn primary sm">
          <Icon name="plus" className="btn-icon" />
          <span>{lang === "pt" ? "Novo recorrente" : "New recurring"}</span>
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>{lang === "pt" ? "Saída mensal recorrente" : "Monthly recurring out"}</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--danger)" }}>{fmtMoney(Math.abs(totalRecurring + totalInstallments), lang)}</div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>{lang === "pt" ? "Assinaturas" : "Subscriptions"}</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{RECURRING.filter(r => r.kind === "monthly").length}</div>
        </div>
        <div className="card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }}>{lang === "pt" ? "Parcelamentos" : "Installments"}</div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{INSTALLMENTS.length}</div>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={"tab" + (tab === "recurring" ? " on" : "")} onClick={() => setTab("recurring")}>
          {lang === "pt" ? "Recorrentes" : "Recurring"} <span className="nav-badge">{RECURRING.length}</span>
        </button>
        <button className={"tab" + (tab === "installments" ? " on" : "")} onClick={() => setTab("installments")}>
          {lang === "pt" ? "Parcelamentos" : "Installments"} <span className="nav-badge">{INSTALLMENTS.length}</span>
        </button>
      </div>

      {tab === "recurring" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="t" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>{lang === "pt" ? "Nome" : "Name"}</th>
                <th>{lang === "pt" ? "Categoria" : "Category"}</th>
                <th>{lang === "pt" ? "Dia" : "Day"}</th>
                <th>{lang === "pt" ? "Conta" : "Account"}</th>
                <th>{lang === "pt" ? "Próximo" : "Next"}</th>
                <th style={{ textAlign: "right" }}>{lang === "pt" ? "Valor" : "Amount"}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {RECURRING.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{r.name}</td>
                  <td><span className="pill info">{I18N[lang].categories[r.cat] ?? r.cat}</span></td>
                  <td className="mono" style={{ color: "var(--ink-3)" }}>{r.day}</td>
                  <td style={{ color: "var(--ink-3)", fontSize: 11 }}>{r.acct}</td>
                  <td className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.next}</td>
                  <td className="mono r" style={{ textAlign: "right", color: r.amt < 0 ? "var(--danger)" : "var(--accent)" }}>
                    {fmtMoney(r.amt, lang, true)}
                  </td>
                  <td>
                    <button className="icon-btn"><Icon name="more" style={{ width: 14, height: 14 }} className="" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "installments" && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="t" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th>{lang === "pt" ? "Descrição" : "Description"}</th>
                <th>{lang === "pt" ? "Início" : "Start"}</th>
                <th>{lang === "pt" ? "Progresso" : "Progress"}</th>
                <th>{lang === "pt" ? "Parcelas rest." : "Remaining"}</th>
                <th>{lang === "pt" ? "Conta" : "Account"}</th>
                <th style={{ textAlign: "right" }}>{lang === "pt" ? "Valor/mês" : "Monthly"}</th>
              </tr>
            </thead>
            <tbody>
              {INSTALLMENTS.map((inst, i) => {
                const pct = (inst.current / inst.total) * 100;
                return (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{inst.name}</td>
                    <td className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{inst.start}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 60, height: 4, background: "var(--bg-3)", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", borderRadius: 2 }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{inst.current}/{inst.total}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ color: "var(--ink-3)" }}>{inst.total - inst.current}</td>
                    <td style={{ fontSize: 11, color: "var(--ink-3)" }}>{inst.acct}</td>
                    <td className="mono r" style={{ textAlign: "right", color: "var(--danger)" }}>{fmtMoney(inst.amt, lang, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
