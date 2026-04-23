"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, Txn, SUBCATS, LEARNED_RULES, RECURRING, INSTALLMENTS, fmtMoney } from "../lib/data";

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
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{I18N[lang].nav_projection}</h1>
          <p className="page-sub">{lang === "pt" ? "Projeção dos próximos 6 meses" : "6-month cash flow projection"}</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px", textAlign: "center" }}>
        <Icon name="trend" style={{ width: 44, height: 44, stroke: "var(--ink-3)", strokeWidth: 1.1, marginBottom: 16 }} className="" />
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
          {lang === "pt" ? "Nenhuma projeção disponível" : "No projection available"}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 320, lineHeight: 1.65 }}>
          {lang === "pt" ? "A projeção é calculada automaticamente a partir das suas transações e recorrentes." : "Projections are calculated automatically from your transactions and recurring items."}
        </div>
      </div>
    </div>
  );
}

interface RecurringPageProps {
  lang: Lang;
  hasData?: boolean;
}
export function RecurringPage({ lang, hasData = false }: RecurringPageProps) {
  const [tab, setTab] = useState<"recurring" | "installments">("recurring");
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{I18N[lang].nav_recurring}</h1>
          <p className="page-sub">{lang === "pt" ? "Assinaturas e parcelamentos ativos" : "Active subscriptions and installments"}</p>
        </div>
        <button className="btn primary sm"
          onClick={() => (window as any).__toast?.(lang === "pt" ? "Novo recorrente: em breve" : "New recurring: coming soon", "warn")}>
          <Icon name="plus" className="btn-icon" />
          <span>{lang === "pt" ? "Novo recorrente" : "New recurring"}</span>
        </button>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={"btn sm" + (tab === "recurring" ? " primary" : "")} onClick={() => setTab("recurring")}>
          {lang === "pt" ? "Recorrentes" : "Recurring"}
        </button>
        <button className={"btn sm" + (tab === "installments" ? " primary" : "")} onClick={() => setTab("installments")}>
          {lang === "pt" ? "Parcelamentos" : "Installments"}
        </button>
      </div>
      {hasData ? (
        tab === "recurring" ? (
          <div className="card">
            <table className="t">
              <thead><tr>
                <th>{lang === "pt" ? "Nome" : "Name"}</th>
                <th>{lang === "pt" ? "Categoria" : "Category"}</th>
                <th>{lang === "pt" ? "Conta" : "Account"}</th>
                <th className="r">{lang === "pt" ? "Próximo" : "Next"}</th>
                <th className="r">{lang === "pt" ? "Valor" : "Amount"}</th>
              </tr></thead>
              <tbody>
                {RECURRING.map((r, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td className="muted" style={{ fontSize: 11.5 }}>{I18N[lang].categories[r.cat]}</td>
                    <td className="muted" style={{ fontSize: 11.5 }}>{r.acct}</td>
                    <td className="r num muted" style={{ fontSize: 11.5 }}>{r.next}</td>
                    <td className={"r num " + (r.amt > 0 ? "pos" : "")} style={{ fontWeight: 600 }}>
                      {r.amt > 0 ? "+" : ""}{fmtMoney(r.amt, lang)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card">
            <table className="t">
              <thead><tr>
                <th>{lang === "pt" ? "Nome" : "Name"}</th>
                <th>{lang === "pt" ? "Conta" : "Account"}</th>
                <th className="r">{lang === "pt" ? "Parcelas" : "Installments"}</th>
                <th className="r">{lang === "pt" ? "Valor/mês" : "Monthly"}</th>
              </tr></thead>
              <tbody>
                {INSTALLMENTS.map((ins, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{ins.name}</td>
                    <td className="muted" style={{ fontSize: 11.5 }}>{ins.acct}</td>
                    <td className="r num muted">{ins.current}/{ins.total}</td>
                    <td className="r num" style={{ fontWeight: 600 }}>{fmtMoney(ins.amt, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px", textAlign: "center" }}>
          <Icon name="refresh" style={{ width: 44, height: 44, stroke: "var(--ink-3)", strokeWidth: 1.1, marginBottom: 16 }} className="" />
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-2)", marginBottom: 8 }}>
            {tab === "recurring"
              ? (lang === "pt" ? "Nenhum recorrente cadastrado" : "No recurring items yet")
              : (lang === "pt" ? "Nenhum parcelamento ativo" : "No installments yet")}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", maxWidth: 320, lineHeight: 1.65 }}>
            {tab === "recurring"
              ? (lang === "pt" ? "Recorrentes são detectados automaticamente ao importar transações." : "Recurring items are detected automatically when you import transactions.")
              : (lang === "pt" ? "Parcelamentos são detectados ao importar faturas de cartão." : "Installments are detected when you import credit card bills.")}
          </div>
        </div>
      )}
    </div>
  );
}
