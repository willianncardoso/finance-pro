"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "./icons";
import {
  I18N, Lang, fmtMoney, fmtDate,
  CAT_COLORS, ACCOUNTS, CARDS, SUBCATS, CAT_MONTH, TXNS,
  Goal,
} from "../lib/data";

/* ─── Shared primitives ──────────────────────────────────────────── */

function ModalBase({ onClose, children, width = 540 }: { onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width, background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function MHead({ title, sub, onClose, icon }: { title: string; sub?: string; onClose: () => void; icon?: string }) {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
      {icon && (
        <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--bg-2)", display: "grid", placeItems: "center", flexShrink: 0 }}>
          <Icon name={icon} style={{ width: 15, height: 15 }} className="" />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{sub}</div>}
      </div>
      <button className="icon-btn" onClick={onClose}><Icon name="x" style={{ width: 14, height: 14 }} className="" /></button>
    </div>
  );
}

function MBody({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ padding: 20, overflowY: "auto", flex: 1, ...style }}>{children}</div>;
}

function MFoot({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--bg-2)", flexShrink: 0 }}>{children}</div>;
}

function FRow({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 5 }}>{label}</label>}
      {children}
    </div>
  );
}

function FInput({ value, onChange, placeholder, type = "text", mono = false, style = {}, disabled }: {
  value: string | number; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; mono?: boolean; style?: React.CSSProperties; disabled?: boolean;
}) {
  return (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} disabled={disabled}
      style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 13, fontFamily: mono ? "var(--font-mono)" : "var(--font-body)", background: "var(--bg-2)", color: "var(--ink)", ...style }} />
  );
}

function FSelect({ value, onChange, children, style = {} }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <select value={value} onChange={onChange} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 13, background: "var(--bg-2)", color: "var(--ink)", ...style }}>
      {children}
    </select>
  );
}

/* ─── 1. New Transaction Modal ───────────────────────────────────── */

function NewTransactionModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const pt = lang === "pt";
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    merch: "",
    cat: "food",
    sub: "",
    amt: "",
    acct: ACCOUNTS[0].id,
    notes: "",
    recurring: false,
    reimbursable: false,
    type: "expense",
    currency: "BRL",
  });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    const txn = {
      d: form.date,
      merch: form.merch || (pt ? "Sem título" : "Untitled"),
      cat: form.cat,
      sub: form.sub || undefined,
      acct: form.acct,
      amt: form.type === "expense" ? -Math.abs(Number(form.amt) || 0) : Math.abs(Number(form.amt) || 0),
      notes: form.notes || undefined,
      recurring: form.recurring || undefined,
      reimbursable: form.reimbursable || undefined,
    };
    (window as any).__addTxn?.(txn);
    (window as any).__toast?.(pt ? `✓ Transação "${txn.merch}" adicionada` : `✓ Transaction "${txn.merch}" added`);
    onClose();
  };

  return (
    <ModalBase onClose={onClose} width={560}>
      <MHead title={pt ? "Nova transação" : "New transaction"} sub={pt ? "Insira os dados manualmente" : "Enter manually"} icon="plus" onClose={onClose} />
      <MBody>
        <div className="seg" style={{ marginBottom: 16, width: "100%" }}>
          {[{ k: "expense", l: pt ? "Gasto" : "Expense" }, { k: "income", l: pt ? "Receita" : "Income" }, { k: "transfer", l: pt ? "Transferência" : "Transfer" }].map(t => (
            <button key={t.k} className={form.type === t.k ? "on" : ""} onClick={() => set("type", t.k)} style={{ flex: 1 }}>{t.l}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Data" : "Date"}><FInput type="date" value={form.date} onChange={e => set("date", e.target.value)} /></FRow>
          <FRow label={pt ? "Valor" : "Amount"}>
            <div style={{ display: "flex", gap: 6 }}>
              <select value={form.currency} onChange={e => set("currency", e.target.value)}
                style={{ padding: "8px 6px", border: "1px solid var(--border-2)", borderRadius: 8, background: "var(--bg-2)", fontSize: 12, width: 66 }}>
                {["BRL", "USD", "EUR", "GBP"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <FInput type="number" value={form.amt} onChange={e => set("amt", e.target.value)} placeholder="0,00" mono style={{ textAlign: "right" }} />
            </div>
          </FRow>
        </div>
        <FRow label={pt ? "Descrição / Estabelecimento" : "Description / Merchant"}>
          <FInput value={form.merch} onChange={e => set("merch", e.target.value)} placeholder={pt ? "Ex: iFood · Sushi, Salário Acme…" : "e.g. Netflix, Rent, Salary…"} />
        </FRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Categoria" : "Category"}>
            <FSelect value={form.cat} onChange={e => { set("cat", e.target.value); set("sub", ""); }}>
              {Object.entries(I18N[lang].categories).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </FSelect>
          </FRow>
          <FRow label={pt ? "Subcategoria" : "Subcategory"}>
            <FSelect value={form.sub} onChange={e => set("sub", e.target.value)}>
              <option value="">—</option>
              {(SUBCATS[form.cat] || []).map(s => <option key={s} value={s}>{s}</option>)}
            </FSelect>
          </FRow>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Conta / Cartão" : "Account / Card"}>
            <FSelect value={form.acct} onChange={e => set("acct", e.target.value)}>
              {ACCOUNTS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              <optgroup label={pt ? "Cartões" : "Cards"}>
                {CARDS.map(c => <option key={c.id} value={c.id}>{c.brand} *{c.last4}</option>)}
              </optgroup>
            </FSelect>
          </FRow>
          <FRow label={pt ? "Parcelas" : "Installments"}>
            <div style={{ display: "flex", gap: 6 }}>
              <FInput type="number" value="" placeholder="1" style={{ textAlign: "center" }} />
              <span style={{ alignSelf: "center", color: "var(--ink-3)" }}>/</span>
              <FInput type="number" value="" placeholder="1" style={{ textAlign: "center" }} />
            </div>
          </FRow>
        </div>
        <FRow label={pt ? "Notas" : "Notes"}>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder={pt ? "Observações, tags, contexto…" : "Observations, tags, context…"}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border-2)", borderRadius: 8, fontSize: 12.5, fontFamily: "var(--font-body)", minHeight: 56, resize: "vertical", background: "var(--bg-2)" }} />
        </FRow>
        <div style={{ display: "flex", gap: 20, padding: "10px 0" }}>
          {[
            { k: "recurring" as const, l: pt ? "Recorrente" : "Recurring" },
            { k: "reimbursable" as const, l: pt ? "Reembolsável" : "Reimbursable" },
          ].map(opt => (
            <label key={opt.k} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, cursor: "pointer" }}>
              <button className={"toggle" + (form[opt.k] ? " on" : "")} onClick={() => set(opt.k, !form[opt.k])} style={{ flexShrink: 0 }} />
              {opt.l}
            </label>
          ))}
        </div>
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn sm" onClick={() => { save(); (window as any).__modal?.("newtxn", {}); }}>
          {pt ? "Salvar e nova" : "Save & new"}
        </button>
        <button className="btn primary sm" onClick={save}>{pt ? "Salvar" : "Save"}</button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 2. Command Palette ⌘K ─────────────────────────────────────── */

interface CmdAction {
  icon: string;
  l: string;
  sub?: string;
  action: () => void;
}

export function CommandPalette({ lang, onClose, setRoute }: { lang: Lang; onClose: () => void; setRoute: (r: string) => void }) {
  const pt = lang === "pt";
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 50); }, []);

  const ACTIONS: CmdAction[] = [
    { icon: "dashboard", l: pt ? "Ir para Dashboard" : "Go to Dashboard", action: () => { setRoute("dashboard"); onClose(); } },
    { icon: "card", l: pt ? "Ir para Cartões" : "Go to Cards", action: () => { setRoute("cards"); onClose(); } },
    { icon: "trend", l: pt ? "Ir para Investimentos" : "Go to Investments", action: () => { setRoute("invest"); onClose(); } },
    { icon: "wallet", l: pt ? "Ir para Contas" : "Go to Accounts", action: () => { setRoute("accounts"); onClose(); } },
    { icon: "insight", l: pt ? "Ver Insights" : "View Insights", action: () => { setRoute("insights"); onClose(); } },
    { icon: "chart", l: pt ? "Comparar períodos" : "Compare periods", action: () => { setRoute("compare"); onClose(); } },
    { icon: "target", l: pt ? "Orçamento & Metas" : "Budget & Goals", action: () => { setRoute("budget"); onClose(); } },
    { icon: "upload", l: pt ? "Importar documento" : "Import document", action: () => { setRoute("import"); onClose(); } },
    { icon: "lock", l: pt ? "Vault & Armazenamento" : "Vault & Storage", action: () => { setRoute("vault"); onClose(); } },
    { icon: "plus", l: pt ? "Nova transação" : "New transaction", action: () => { onClose(); (window as any).__modal?.("newtxn", {}); } },
    { icon: "download", l: pt ? "Exportar dados" : "Export data", action: () => { onClose(); (window as any).__modal?.("export", {}); } },
    { icon: "eye_off", l: pt ? "Alternar modo privacidade" : "Toggle privacy mode", action: () => { (window as any).__togglePrivacy?.(); onClose(); } },
    { icon: "refresh", l: pt ? "Salvar vault agora" : "Save vault now", action: () => { (window as any).__toast?.(pt ? "💾 Vault salvo" : "💾 Vault saved"); onClose(); } },
    ...TXNS.slice(0, 6).map(tx => ({
      icon: tx.amt > 0 ? "arrow_up" : "arrow_down",
      l: tx.merch,
      sub: fmtMoney(tx.amt, lang) + " · " + fmtDate(tx.d, lang),
      action: () => { (window as any).__openTxnEdit?.(tx); onClose(); },
    })),
  ];

  const filtered = q.trim()
    ? ACTIONS.filter(a => a.l.toLowerCase().includes(q.toLowerCase()) || (a.sub ?? "").toLowerCase().includes(q.toLowerCase()))
    : ACTIONS;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(s => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSel(s => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && filtered[sel]) filtered[sel].action();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 600, background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
          <Icon name="search" style={{ width: 16, height: 16, stroke: "var(--ink-3)", flexShrink: 0 }} className="" />
          <input ref={inputRef} value={q} onChange={e => { setQ(e.target.value); setSel(0); }} onKeyDown={handleKey}
            placeholder={pt ? "Buscar ação, transação, conta…" : "Search action, transaction, account…"}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 15, fontFamily: "var(--font-body)", background: "transparent", color: "var(--ink)" }} />
          <span className="kbd">Esc</span>
        </div>
        <div style={{ maxHeight: 380, overflowY: "auto" }}>
          {q === "" && (
            <div style={{ padding: "8px 16px 4px", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-4)", fontWeight: 600 }}>
              {pt ? "Ações" : "Actions"}
            </div>
          )}
          {filtered.map((a, i) => (
            <div key={i} onClick={a.action}
              style={{ padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", background: sel === i ? "var(--bg-2)" : "transparent" }}
              onMouseEnter={() => setSel(i)}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--bg-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={a.icon} style={{ width: 13, height: 13 }} className="" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{a.l}</div>
                {a.sub && <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>{a.sub}</div>}
              </div>
              {sel === i && <span className="kbd">↵</span>}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
              {pt ? "Nenhum resultado" : "No results"}
            </div>
          )}
        </div>
        <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 16, fontSize: 11, color: "var(--ink-4)" }}>
          <span><span className="kbd">↑↓</span> {pt ? "navegar" : "navigate"}</span>
          <span><span className="kbd">↵</span> {pt ? "abrir" : "open"}</span>
          <span><span className="kbd">Esc</span> {pt ? "fechar" : "close"}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── 3. Filter Modal ────────────────────────────────────────────── */

function FilterModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const pt = lang === "pt";
  const [f, setF] = useState({ dateFrom: "2026-04-01", dateTo: "2026-04-30", cats: [] as string[], accts: [] as string[], amtMin: "", amtMax: "", type: "all" });
  const setFk = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(x => ({ ...x, [k]: v }));
  const toggleCat = (k: string) => setFk("cats", f.cats.includes(k) ? f.cats.filter(c => c !== k) : [...f.cats, k]);
  const toggleAcct = (id: string) => setFk("accts", f.accts.includes(id) ? f.accts.filter(a => a !== id) : [...f.accts, id]);
  const apply = () => { (window as any).__toast?.(pt ? "✓ Filtro aplicado" : "✓ Filter applied"); onClose(); };

  return (
    <ModalBase onClose={onClose} width={500}>
      <MHead title={pt ? "Filtrar transações" : "Filter transactions"} icon="filter" onClose={onClose} />
      <MBody>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <FRow label={pt ? "Data início" : "From"}><FInput type="date" value={f.dateFrom} onChange={e => setFk("dateFrom", e.target.value)} /></FRow>
          <FRow label={pt ? "Data fim" : "To"}><FInput type="date" value={f.dateTo} onChange={e => setFk("dateTo", e.target.value)} /></FRow>
        </div>
        <FRow label={pt ? "Tipo" : "Type"}>
          <div className="seg">
            {[{ k: "all", l: pt ? "Todos" : "All" }, { k: "income", l: pt ? "Receitas" : "Income" }, { k: "expense", l: pt ? "Gastos" : "Expense" }].map(t => (
              <button key={t.k} className={f.type === t.k ? "on" : ""} onClick={() => setFk("type", t.k)}>{t.l}</button>
            ))}
          </div>
        </FRow>
        <FRow label={pt ? "Categorias" : "Categories"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {Object.entries(I18N[lang].categories).map(([k, v]) => (
              <button key={k} onClick={() => toggleCat(k)}
                className={"pill" + (f.cats.includes(k) ? " accent" : "")}
                style={{ cursor: "pointer", border: f.cats.includes(k) ? "1px solid var(--accent-fg)" : "1px solid var(--border)", background: f.cats.includes(k) ? "var(--accent-bg)" : "transparent" }}>
                <span className="cat-dot" style={{ background: CAT_COLORS[k] }} />{v}
              </button>
            ))}
          </div>
        </FRow>
        <FRow label={pt ? "Contas" : "Accounts"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {ACCOUNTS.map(a => (
              <button key={a.id} onClick={() => toggleAcct(a.id)} className="pill"
                style={{ cursor: "pointer", border: f.accts.includes(a.id) ? "1px solid var(--ink)" : "1px solid var(--border)", background: f.accts.includes(a.id) ? "var(--bg-3)" : "transparent", fontWeight: f.accts.includes(a.id) ? 600 : 400 }}>
                {a.name}
              </button>
            ))}
          </div>
        </FRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Valor mínimo" : "Min amount"}><FInput type="number" value={f.amtMin} onChange={e => setFk("amtMin", e.target.value)} placeholder="0" mono /></FRow>
          <FRow label={pt ? "Valor máximo" : "Max amount"}><FInput type="number" value={f.amtMax} onChange={e => setFk("amtMax", e.target.value)} placeholder="∞" mono /></FRow>
        </div>
        <button className="btn ghost sm" onClick={() => setF({ dateFrom: "2026-04-01", dateTo: "2026-04-30", cats: [], accts: [], amtMin: "", amtMax: "", type: "all" })}>
          {pt ? "Limpar filtros" : "Clear filters"}
        </button>
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={apply}>{pt ? "Aplicar filtro" : "Apply filter"}</button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 4. Export Modal ────────────────────────────────────────────── */

function ExportModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const pt = lang === "pt";
  const [fmt, setFmt] = useState("csv");
  const [range, setRange] = useState("month");
  const [incl, setIncl] = useState({ txns: true, invest: false, goals: false, reports: true });
  const [exporting, setExporting] = useState(false);

  const doExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      (window as any).__toast?.(pt ? `✓ Arquivo finance-pro-export.${fmt} gerado` : `✓ finance-pro-export.${fmt} ready`);
      onClose();
    }, 1400);
  };

  return (
    <ModalBase onClose={onClose} width={480}>
      <MHead title={pt ? "Exportar dados" : "Export data"} icon="download" onClose={onClose} />
      <MBody>
        <FRow label={pt ? "Formato" : "Format"}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {["csv", "json", "pdf", "xlsx"].map(f => (
              <div key={f} onClick={() => setFmt(f)} style={{ padding: "10px 8px", border: `1.5px solid ${fmt === f ? "var(--ink)" : "var(--border)"}`, borderRadius: 8, cursor: "pointer", textAlign: "center", background: fmt === f ? "var(--bg-2)" : "transparent" }}>
                <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{f.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: "var(--ink-3)", marginTop: 2 }}>
                  {f === "csv" ? "Planilha" : f === "json" ? "Dev/API" : f === "pdf" ? "Relatório" : "Excel"}
                </div>
              </div>
            ))}
          </div>
        </FRow>
        <FRow label={pt ? "Período" : "Period"}>
          <div className="seg">
            {[{ k: "month", l: pt ? "Este mês" : "This month" }, { k: "quarter", l: "Q1" }, { k: "year", l: pt ? "Este ano" : "This year" }, { k: "all", l: pt ? "Tudo" : "All" }].map(r => (
              <button key={r.k} className={range === r.k ? "on" : ""} onClick={() => setRange(r.k)}>{r.l}</button>
            ))}
          </div>
        </FRow>
        <FRow label={pt ? "Incluir" : "Include"}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { k: "txns" as const, l: pt ? "Transações" : "Transactions" },
              { k: "invest" as const, l: pt ? "Portfólio / Investimentos" : "Portfolio / Investments" },
              { k: "goals" as const, l: pt ? "Metas e orçamento" : "Goals & budget" },
              { k: "reports" as const, l: pt ? "Relatórios & análises" : "Reports & analytics" },
            ].map(opt => (
              <label key={opt.k} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer" }}>
                <button className={"toggle" + (incl[opt.k] ? " on" : "")} onClick={() => setIncl(i => ({ ...i, [opt.k]: !i[opt.k] }))} />
                {opt.l}
              </label>
            ))}
          </div>
        </FRow>
        {fmt === "pdf" && (
          <div style={{ padding: "10px 12px", background: "var(--accent-bg)", borderRadius: 8, fontSize: 11.5, color: "var(--accent-fg)" }}>
            {pt ? "O PDF será gerado com layout de relatório financeiro, incluindo gráficos." : "PDF will be generated with financial report layout including charts."}
          </div>
        )}
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={doExport} disabled={exporting}>
          {exporting ? (pt ? "Gerando…" : "Generating…") : (pt ? "Exportar" : "Export")}
        </button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 5. Goal Modal ──────────────────────────────────────────────── */

function GoalModal({ lang, onClose, goal }: { lang: Lang; onClose: () => void; goal?: Goal }) {
  const pt = lang === "pt";
  const isEdit = !!goal;
  const [form, setForm] = useState({
    name: goal ? (I18N[lang] as any)[`goal_${goal.key}`] ?? "" : "",
    target: goal ? String(goal.target) : "",
    current: goal ? String(goal.current) : "",
    deadline: goal ? goal.when : "2027-01",
    autoContrib: "",
  });
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }));
  const target = Number(form.target);
  const current = Number(form.current);
  const pct = target > 0 ? (current / target * 100) : 0;
  const save = () => { (window as any).__toast?.(pt ? `✓ Meta "${form.name}" ${isEdit ? "atualizada" : "criada"}` : `✓ Goal "${form.name}" ${isEdit ? "updated" : "created"}`); onClose(); };

  return (
    <ModalBase onClose={onClose} width={500}>
      <MHead title={isEdit ? (pt ? "Editar meta" : "Edit goal") : (pt ? "Nova meta" : "New goal")} icon="target" onClose={onClose} />
      <MBody>
        <FRow label={pt ? "Nome da meta" : "Goal name"}>
          <FInput value={form.name} onChange={e => set("name", e.target.value)} placeholder={pt ? "Ex: Reserva de emergência, Viagem, MacBook…" : "e.g. Emergency fund, Trip, MacBook…"} />
        </FRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Valor alvo" : "Target"}><FInput type="number" value={form.target} onChange={e => set("target", e.target.value)} placeholder="0" mono /></FRow>
          <FRow label={pt ? "Valor atual" : "Current"}><FInput type="number" value={form.current} onChange={e => set("current", e.target.value)} placeholder="0" mono /></FRow>
        </div>
        {target > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div className="pbar" style={{ height: 8 }}>
              <div className="pbar-fill" style={{ width: Math.min(100, pct) + "%", background: "var(--accent)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              <span>{pct.toFixed(1)}%</span>
              <span>{pt ? "faltam" : "remaining"} {fmtMoney(target - current, lang, true)}</span>
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Prazo (mês/ano)" : "Deadline (month/year)"}><FInput type="month" value={form.deadline} onChange={e => set("deadline", e.target.value)} /></FRow>
          <FRow label={pt ? "Aporte mensal automático" : "Monthly auto-contribution"}><FInput type="number" value={form.autoContrib} onChange={e => set("autoContrib", e.target.value)} placeholder={pt ? "Opcional" : "Optional"} mono /></FRow>
        </div>
        {target > 0 && form.deadline && (
          <div style={{ padding: "10px 12px", background: "var(--accent-bg)", borderRadius: 8, fontSize: 12, color: "var(--accent-fg)" }}>
            <Icon name="sparkle" style={{ width: 12, height: 12, verticalAlign: "middle", marginRight: 6 }} className="" />
            {pt
              ? `Para atingir ${fmtMoney(target, lang, true)} em ${form.deadline}, você precisa de ~${fmtMoney(Math.ceil((target - current) / 12), lang, true)}/mês`
              : `To reach ${fmtMoney(target, lang, true)} by ${form.deadline}, you need ~${fmtMoney(Math.ceil((target - current) / 12), lang, true)}/mo`}
          </div>
        )}
      </MBody>
      <MFoot>
        {isEdit && <button className="btn sm" style={{ marginRight: "auto", color: "var(--danger-fg)", borderColor: "var(--danger)" }}>{pt ? "Excluir" : "Delete"}</button>}
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={save}>{pt ? "Salvar meta" : "Save goal"}</button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 6. Category Modal ──────────────────────────────────────────── */

function CategoryModal({ lang, onClose, catKey }: { lang: Lang; onClose: () => void; catKey?: string }) {
  const pt = lang === "pt";
  const [form, setForm] = useState({ name: catKey ? (I18N[lang].categories[catKey] ?? catKey) : "", color: CAT_COLORS.food, budget: "", rules: [""] });
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm(f => ({ ...f, [k]: v }));
  const addRule = () => set("rules", [...form.rules, ""]);
  const setRule = (i: number, v: string) => set("rules", form.rules.map((r, j) => j === i ? v : r));
  const PALETTE = Object.values(CAT_COLORS).slice(0, 10);

  return (
    <ModalBase onClose={onClose} width={480}>
      <MHead title={catKey ? (pt ? "Editar categoria" : "Edit category") : (pt ? "Nova categoria" : "New category")} icon="tag" onClose={onClose} />
      <MBody>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, background: form.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <FInput value={form.name} onChange={e => set("name", e.target.value)} placeholder={pt ? "Nome da categoria…" : "Category name…"} />
            <div style={{ display: "flex", gap: 5, marginTop: 7, flexWrap: "wrap" }}>
              {PALETTE.map((c, i) => (
                <div key={i} onClick={() => set("color", c)}
                  style={{ width: 20, height: 20, borderRadius: "50%", background: c, cursor: "pointer", outline: form.color === c ? "2px solid var(--ink)" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        </div>
        <FRow label={pt ? "Limite mensal (orçamento)" : "Monthly budget limit"}>
          <FInput type="number" value={form.budget} onChange={e => set("budget", e.target.value)} placeholder="0" mono />
        </FRow>
        <FRow label={pt ? "Regras de categorização automática" : "Auto-categorization rules"}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 8 }}>
            {pt ? "Padrões de texto que identificam transações nesta categoria. Usar * como curinga." : "Text patterns that identify transactions in this category. Use * as wildcard."}
          </div>
          {form.rules.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <FInput value={r} onChange={e => setRule(i, e.target.value)} placeholder={pt ? "Ex: IFOOD*, PAO DE ACUCAR" : "e.g. NETFLIX*, AMAZON*"} mono style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
              {form.rules.length > 1 && (
                <button className="icon-btn" onClick={() => set("rules", form.rules.filter((_, j) => j !== i))} style={{ width: 28, height: 34 }}>
                  <Icon name="x" style={{ width: 12, height: 12 }} className="" />
                </button>
              )}
            </div>
          ))}
          <button className="btn ghost sm" onClick={addRule}><Icon name="plus" className="btn-icon" />{pt ? "Adicionar regra" : "Add rule"}</button>
        </FRow>
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={() => { (window as any).__toast?.(pt ? `✓ Categoria "${form.name}" salva` : `✓ Category "${form.name}" saved`); onClose(); }}>
          {pt ? "Salvar" : "Save"}
        </button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 7. Add Card Modal ──────────────────────────────────────────── */

function AddCardModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const pt = lang === "pt";
  const BANKS = ["Nubank", "C6 Bank", "Itaú", "Bradesco", "Santander", "BTG", "Inter", "XP", pt ? "Outro" : "Other"];
  const [form, setForm] = useState({ bank: "Nubank", name: "", last4: "", limit: "", close: "", due: "", currency: "BRL" });
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <ModalBase onClose={onClose} width={480}>
      <MHead title={pt ? "Adicionar cartão" : "Add card"} icon="card" onClose={onClose} />
      <MBody>
        <FRow label={pt ? "Banco / Emissor" : "Bank / Issuer"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
            {BANKS.map(b => (
              <button key={b} className={"pill" + (form.bank === b ? " accent" : "")}
                onClick={() => set("bank", b)} style={{ cursor: "pointer", border: form.bank === b ? "1px solid var(--accent-fg)" : "1px solid var(--border)" }}>
                {b}
              </button>
            ))}
          </div>
        </FRow>
        <FRow label={pt ? "Nome do cartão" : "Card name"}>
          <FInput value={form.name} onChange={e => set("name", e.target.value)} placeholder={pt ? "Ex: Nubank Ultravioleta, C6 Carbon…" : "e.g. Nubank Ultravioleta, C6 Carbon…"} />
        </FRow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Últimos 4 dígitos" : "Last 4 digits"}>
            <FInput value={form.last4} onChange={e => set("last4", e.target.value.slice(0, 4))} placeholder="0000" mono style={{ letterSpacing: "0.15em", textAlign: "center" }} />
          </FRow>
          <FRow label={pt ? "Limite (BRL)" : "Limit (BRL)"}>
            <FInput type="number" value={form.limit} onChange={e => set("limit", e.target.value)} placeholder="0" mono />
          </FRow>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Dia de fechamento" : "Close day"}>
            <FInput type="number" value={form.close} onChange={e => set("close", e.target.value)} placeholder="1–31" mono />
          </FRow>
          <FRow label={pt ? "Dia de vencimento" : "Due day"}>
            <FInput type="number" value={form.due} onChange={e => set("due", e.target.value)} placeholder="1–31" mono />
          </FRow>
        </div>
        <FRow label={pt ? "Moeda principal" : "Primary currency"}>
          <div className="seg">
            {["BRL", "USD", "EUR"].map(c => <button key={c} className={form.currency === c ? "on" : ""} onClick={() => set("currency", c)}>{c}</button>)}
          </div>
        </FRow>
        {(form.bank || form.name) && (
          <div style={{ padding: "12px 14px", borderRadius: 10, background: "var(--ink)", color: "white", marginTop: 4, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
            <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>{form.bank} {form.name}</div>
            <div className="mono" style={{ fontSize: 13, opacity: 0.65, letterSpacing: "0.1em" }}>•••• •••• •••• {form.last4 || "0000"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, opacity: 0.7 }}>
              <span>{pt ? "fecha" : "close"} d{form.close || "?"}</span>
              <span>{pt ? "vence" : "due"} d{form.due || "?"}</span>
              <span>{form.limit ? fmtMoney(Number(form.limit), lang, true) : "—"}</span>
            </div>
          </div>
        )}
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={() => { (window as any).__toast?.(pt ? "✓ Cartão adicionado" : "✓ Card added"); onClose(); }}>
          {pt ? "Adicionar cartão" : "Add card"}
        </button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 8. New Trade Modal ─────────────────────────────────────────── */

function NewTradeModal({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const pt = lang === "pt";
  const [form, setForm] = useState({ type: "buy", ticker: "", qty: "", price: "", date: new Date().toISOString().slice(0, 10), broker: "BTG Pactual", currency: "BRL", fees: "" });
  const set = <K extends keyof typeof form>(k: K, v: string) => setForm(f => ({ ...f, [k]: v }));
  const total = form.qty && form.price ? Number(form.qty) * Number(form.price) + Number(form.fees || 0) : 0;

  return (
    <ModalBase onClose={onClose} width={500}>
      <MHead title={pt ? "Nova operação" : "New trade"} icon="trend" onClose={onClose} />
      <MBody>
        <div className="seg" style={{ marginBottom: 16, width: "100%" }}>
          {[{ k: "buy", l: pt ? "Compra" : "Buy" }, { k: "sell", l: pt ? "Venda" : "Sell" }, { k: "dividend", l: pt ? "Provento" : "Dividend" }, { k: "split", l: "Split" }].map(t => (
            <button key={t.k} className={form.type === t.k ? "on" : ""} onClick={() => set("type", t.k)} style={{ flex: 1 }}>{t.l}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
          <FRow label="Ticker">
            <FInput value={form.ticker} onChange={e => set("ticker", e.target.value.toUpperCase())} placeholder="BOVA11, AAPL, PETR4…" mono />
          </FRow>
          <FRow label={pt ? "Mercado" : "Market"}>
            <div className="seg">
              <button className={form.currency === "BRL" ? "on" : ""} onClick={() => set("currency", "BRL")}>BR</button>
              <button className={form.currency === "USD" ? "on" : ""} onClick={() => set("currency", "USD")}>US</button>
            </div>
          </FRow>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Quantidade" : "Qty"}><FInput type="number" value={form.qty} onChange={e => set("qty", e.target.value)} placeholder="0" mono /></FRow>
          <FRow label={pt ? "Preço unitário" : "Unit price"}><FInput type="number" value={form.price} onChange={e => set("price", e.target.value)} placeholder="0.00" mono /></FRow>
          <FRow label={pt ? "Corretagem" : "Fees"}><FInput type="number" value={form.fees} onChange={e => set("fees", e.target.value)} placeholder="0.00" mono /></FRow>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <FRow label={pt ? "Data" : "Date"}><FInput type="date" value={form.date} onChange={e => set("date", e.target.value)} /></FRow>
          <FRow label={pt ? "Corretora" : "Broker"}>
            <FSelect value={form.broker} onChange={e => set("broker", e.target.value)}>
              {["BTG Pactual", "Avenue", "XP Investimentos", "Clear"].map(b => <option key={b}>{b}</option>)}
            </FSelect>
          </FRow>
        </div>
        {total > 0 && (
          <div style={{ padding: "10px 14px", background: form.type === "buy" ? "var(--danger-bg)" : "var(--accent-bg)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{pt ? "Total da operação" : "Trade total"}</span>
            <span className="num" style={{ fontSize: 16, fontWeight: 700, color: form.type === "buy" ? "var(--danger-fg)" : "var(--accent-fg)" }}>
              {form.type === "buy" ? "−" : "+"}{fmtMoney(total, lang)}
            </span>
          </div>
        )}
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={() => { (window as any).__toast?.(pt ? `✓ Operação ${form.ticker} registrada` : `✓ ${form.ticker} trade registered`); onClose(); }}>
          {pt ? "Registrar operação" : "Register trade"}
        </button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── 9. Budget Edit Modal ───────────────────────────────────────── */

function BudgetEditModal({ lang, onClose, catKey }: { lang: Lang; onClose: () => void; catKey?: string }) {
  const pt = lang === "pt";
  const item = CAT_MONTH.find(c => c.k === catKey) ?? { k: catKey ?? "", cur: 0, prev: 0, budget: 0 };
  const [budget, setBudget] = useState(item.budget);

  return (
    <ModalBase onClose={onClose} width={400}>
      <MHead title={pt ? "Editar limite de orçamento" : "Edit budget limit"} icon="target" onClose={onClose} />
      <MBody>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: 14, background: "var(--bg-2)", borderRadius: 10 }}>
          <span className="cat-dot" style={{ background: CAT_COLORS[catKey ?? ""] ?? "var(--ink-3)", width: 14, height: 14 }} />
          <span style={{ fontWeight: 600, fontSize: 14 }}>{catKey ? (I18N[lang].categories[catKey] ?? catKey) : ""}</span>
          <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>{pt ? "atual:" : "current:"} {fmtMoney(item.cur, lang, true)}</span>
        </div>
        <FRow label={pt ? "Limite mensal" : "Monthly limit"}>
          <FInput type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} mono />
        </FRow>
        {budget > 0 && item.cur > 0 && (
          <div style={{ marginTop: 8 }}>
            <div className="pbar" style={{ height: 8 }}>
              <div className="pbar-fill" style={{ width: Math.min(100, item.cur / budget * 100) + "%", background: item.cur > budget ? "var(--danger)" : "var(--accent)" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-3)", marginTop: 4, fontFamily: "var(--font-mono)" }}>
              <span>{(item.cur / budget * 100).toFixed(1)}% {pt ? "usado" : "used"}</span>
              <span>{item.cur > budget ? (pt ? "Estourado" : "Over budget") : `${fmtMoney(budget - item.cur, lang, true)} ${pt ? "restante" : "left"}`}</span>
            </div>
          </div>
        )}
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          {[item.cur, item.prev, Math.round(item.cur * 1.1)].map((v, i) => (
            <button key={i} className="btn sm" onClick={() => setBudget(v)} style={{ flex: 1 }}>
              {fmtMoney(v, lang, true)} <span className="muted" style={{ fontSize: 10 }}>{[pt ? "atual" : "current", pt ? "ant." : "prev.", "+10%"][i]}</span>
            </button>
          ))}
        </div>
      </MBody>
      <MFoot>
        <button className="btn sm" onClick={onClose}>{pt ? "Cancelar" : "Cancel"}</button>
        <button className="btn primary sm" onClick={() => {
          (window as any).__toast?.(pt ? `✓ Limite de ${catKey ? I18N[lang].categories[catKey] : ""} atualizado` : `✓ ${catKey ? I18N[lang].categories[catKey] : ""} limit updated`);
          onClose();
        }}>
          {pt ? "Salvar limite" : "Save limit"}
        </button>
      </MFoot>
    </ModalBase>
  );
}

/* ─── Modal Renderer ─────────────────────────────────────────────── */

export interface ModalState {
  type: string;
  data: Record<string, any>;
}

interface ModalRendererProps {
  modal: ModalState | null;
  lang: Lang;
  onClose: () => void;
  setRoute: (r: string) => void;
}

export function ModalRenderer({ modal, lang, onClose, setRoute }: ModalRendererProps) {
  if (!modal) return null;
  const props = { lang, onClose, setRoute, ...modal.data };
  switch (modal.type) {
    case "newtxn":     return <NewTransactionModal {...props} />;
    case "cmdpalette": return <CommandPalette {...props} />;
    case "filter":     return <FilterModal {...props} />;
    case "export":     return <ExportModal {...props} />;
    case "goal":       return <GoalModal {...props} />;
    case "category":   return <CategoryModal {...props} />;
    case "addcard":    return <AddCardModal {...props} />;
    case "newtrade":   return <NewTradeModal {...props} />;
    case "budgetedit": return <BudgetEditModal {...props} />;
    default:           return null;
  }
}
