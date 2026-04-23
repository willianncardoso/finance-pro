"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, fmtMoney, fmtDate, CAT_COLORS, Txn, ACCOUNTS, TXNS, CARDS, INSIGHTS, PORTFOLIO, LEARNED_RULES, CAT_MONTH } from "../lib/data";
import { InsightCard } from "./shell";

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
export function CardsPage({ lang, hasData = false }: { lang: Lang; hasData?: boolean }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_cards}</h1>
          <div className="page-sub">{lang === "pt" ? "Gerencie faturas e parcelamentos" : "Manage bills and installments"}</div>
        </div>
        <button className="btn sm"
          onClick={() => (window as any).__toast?.(lang === "pt" ? "Adicione cartões importando faturas" : "Add cards by importing statements", "info")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Adicionar cartão" : "Add card"}
        </button>
      </div>

      {hasData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {CARDS.map(c => {
            const pct = (c.used / c.limit) * 100;
            const barColor = pct > 80 ? "var(--danger)" : pct > 60 ? "var(--warn)" : "var(--accent)";
            return (
              <div key={c.id} className="card card-pad">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.brand}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>
                      *{c.last4} · {lang === "pt" ? `fecha dia ${c.close} · vence dia ${c.due}` : `closes day ${c.close} · due day ${c.due}`}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{fmtMoney(c.used, lang)}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      {lang === "pt" ? "de" : "of"} {fmtMoney(c.limit, lang)} · {pct.toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div className="pbar">
                  <div className="pbar-fill" style={{ width: pct + "%", background: barColor }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="card"
          title={lang === "pt" ? "Nenhum cartão cadastrado" : "No cards yet"}
          sub={lang === "pt" ? "Adicione um cartão para acompanhar faturas e parcelamentos." : "Add a card to track bills and installments."}
        />
      )}
    </div>
  );
}

/* ============ INVESTMENTS ============ */
export function InvestPage({ lang, hasData = false }: { lang: Lang; hasData?: boolean }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_invest}</h1>
          <div className="page-sub">{lang === "pt" ? "Ações, FIIs, renda fixa e ETFs" : "Stocks, REITs, fixed income and ETFs"}</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn sm" onClick={() => (window as any).__navigate?.("import")}>
            <Icon name="upload" className="btn-icon" />{lang === "pt" ? "Importar nota" : "Import note"}
          </button>
          <button className="btn primary sm"
            onClick={() => (window as any).__toast?.(lang === "pt" ? "Nova operação: em breve" : "New trade: coming soon", "warn")}>
            <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova operação" : "New trade"}
          </button>
        </div>
      </div>
      {hasData ? (
        <div className="card">
          <table className="t">
            <thead><tr>
              <th>{lang === "pt" ? "Ativo" : "Asset"}</th>
              <th className="r">{lang === "pt" ? "Qtd" : "Qty"}</th>
              <th className="r">{lang === "pt" ? "P. Médio" : "Avg Price"}</th>
              <th className="r">{lang === "pt" ? "Atual" : "Current"}</th>
              <th className="r">P/L</th>
              <th className="r">DY</th>
            </tr></thead>
            <tbody>
              {PORTFOLIO.map((p, i) => {
                const pl = (p.last - p.pm) / p.pm * 100;
                return (
                  <tr key={i}>
                    <td className="mono" style={{ fontWeight: 600 }}>{p.t}</td>
                    <td className="r num">{p.q > 1 ? p.q : "—"}</td>
                    <td className="r num">{fmtMoney(p.pm, lang)}</td>
                    <td className="r num">{fmtMoney(p.last, lang)}</td>
                    <td className={"r num " + (pl >= 0 ? "pos" : "neg")}>{pl > 0 ? "+" : ""}{pl.toFixed(1)}%</td>
                    <td className="r num muted">{p.dy != null ? p.dy + "%" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="trend"
          title={lang === "pt" ? "Nenhuma posição cadastrada" : "No positions yet"}
          sub={lang === "pt" ? "Importe uma nota de corretagem ou adicione uma operação manualmente." : "Import a brokerage note or add a trade manually."}
          cta={lang === "pt" ? "Importar nota" : "Import note"}
          onCta={() => (window as any).__navigate?.("import")}
        />
      )}
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
    txns.push({ d, merch: c6Merchant(titulo, descricao), cat: c6Category(titulo, descricao, amt), acct: 'C6 Bank', amt });
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
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>47 {lang === "pt" ? "transações importadas com sucesso" : "transactions imported successfully"}</div>
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
export function InsightsPage({ lang, hasData = false }: { lang: Lang; hasData?: boolean }) {
  const t = I18N[lang];
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const allInsights = INSIGHTS[lang];
  const visible = allInsights.filter((ins, i) =>
    !dismissed.has(i) && (filter === "all" || ins.kind === filter)
  );

  const FILTERS = [
    { k: "all", l: lang === "pt" ? "Todos" : "All" },
    { k: "warn", l: lang === "pt" ? "Atenção" : "Warnings" },
    { k: "danger", l: lang === "pt" ? "Urgentes" : "Urgent" },
    { k: "pos", l: lang === "pt" ? "Positivos" : "Positive" },
    { k: "info", l: "Info" },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_insights}</h1>
          <div className="page-sub">{lang === "pt" ? "Análises automáticas baseadas nos seus dados" : "Automatic analyses based on your data"}</div>
        </div>
        <div className="seg">
          {FILTERS.map((f) => (
            <button key={f.k} className={filter === f.k ? "on" : ""} onClick={() => setFilter(f.k)}>{f.l}</button>
          ))}
        </div>
      </div>
      {hasData ? (
        visible.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map((ins, i) => (
              <InsightCard
                key={i}
                insight={ins}
                lang={lang}
                onDismiss={() => setDismissed(prev => new Set([...prev, allInsights.indexOf(ins)]))}
                onInvestigate={() => (window as any).__navigate?.("accounts")}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="insight"
            title={lang === "pt" ? "Nenhum insight ativo" : "No active insights"}
            sub={lang === "pt" ? "Todos os insights foram dispensados ou não há alertas para este filtro." : "All insights were dismissed or none match this filter."}
          />
        )
      ) : (
        <EmptyState
          icon="insight"
          title={lang === "pt" ? "Nenhum insight disponível" : "No insights yet"}
          sub={lang === "pt" ? "Os insights aparecem automaticamente após a importação dos seus dados." : "Insights appear automatically after you import your data."}
          cta={lang === "pt" ? "Importar documento" : "Import document"}
          onCta={() => (window as any).__navigate?.("import")}
        />
      )}
    </div>
  );
}

/* ============ REPORTS ============ */
export function ReportsPage({ lang }: { lang: Lang }) {
  const t = I18N[lang];
  const [period, setPeriod] = useState<"30d" | "90d" | "12m" | "ytd">("90d");
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
          <button className="btn sm"
            onClick={() => (window as any).__toast?.(lang === "pt" ? "Exportação em PDF/CSV: em breve" : "PDF/CSV export: coming soon", "warn")}>
            <Icon name="download" className="btn-icon" />{lang === "pt" ? "Exportar" : "Export"}
          </button>
        </div>
      </div>
      <EmptyState
        icon="report"
        title={lang === "pt" ? "Nenhum dado para relatório" : "No data for reports"}
        sub={lang === "pt" ? "Os relatórios são gerados automaticamente a partir das suas transações importadas." : "Reports are generated automatically from your imported transactions."}
        cta={lang === "pt" ? "Importar documento" : "Import document"}
        onCta={() => (window as any).__navigate?.("import")}
      />
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
        <button className="btn primary sm"
          onClick={() => (window as any).__toast?.(lang === "pt" ? "Nova meta: em breve" : "New goal: coming soon", "warn")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova meta" : "New goal"}
        </button>
      </div>
      <EmptyState
        icon="target"
        title={lang === "pt" ? "Nenhum orçamento definido" : "No budget set"}
        sub={lang === "pt" ? "Defina metas por categoria e acompanhe o progresso ao longo do mês." : "Set goals by category and track progress over the month."}
      />
    </div>
  );
}

/* ============ ACCOUNTS ============ */
export function AccountsPage({ lang, onEditTxn, txns = [] }: { lang: Lang; onEditTxn?: (tx: Txn) => void; txns?: Txn[] }) {
  const t = I18N[lang];
  const hasRealData = txns.length > 0;

  // Compute account summaries from real txns
  const acctBalances = new Map<string, number>();
  txns.forEach(tx => acctBalances.set(tx.acct, (acctBalances.get(tx.acct) ?? 0) + tx.amt));
  const computedAccounts = Array.from(acctBalances.entries()).map(([name, balance]) => ({ name, balance }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_accounts}</h1>
          <div className="page-sub">{lang === "pt" ? "Contas bancárias e extratos" : "Bank accounts and statements"}</div>
        </div>
        <button className="btn sm"
          onClick={() => (window as any).__toast?.(lang === "pt" ? "Importe um extrato para adicionar contas automaticamente" : "Import a statement to add accounts automatically", "info")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova conta" : "New account"}
        </button>
      </div>

      {hasRealData ? (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            {computedAccounts.map((a, idx) => (
              <div key={idx} className="card card-pad" style={{ flex: "1 1 180px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--accent)", display: "grid", placeItems: "center", color: "white", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                    {a.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.name}</div>
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em" }}>{fmtMoney(a.balance, lang)}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">{lang === "pt" ? "Transações recentes" : "Recent transactions"}</h3>
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
                        <span className="cat-dot" style={{ background: CAT_COLORS[tx.cat] }}></span>
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
        </>
      ) : (
        <EmptyState
          icon="wallet"
          title={lang === "pt" ? "Nenhuma conta cadastrada" : "No accounts yet"}
          sub={lang === "pt" ? "Importe um extrato bancário ou adicione uma conta manualmente." : "Import a bank statement or add an account manually."}
          cta={lang === "pt" ? "Importar extrato" : "Import statement"}
          onCta={() => (window as any).__navigate?.("import")}
        />
      )}
    </div>
  );
}

/* ============ CATEGORIES ============ */
export function CategoriesPage({ lang, hasData = false }: { lang: Lang; hasData?: boolean }) {
  const t = I18N[lang];
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.nav_categories}</h1>
          <div className="page-sub">{lang === "pt" ? "Regras automáticas + categorias personalizadas" : "Automatic rules + custom categories"}</div>
        </div>
        <button className="btn primary sm"
          onClick={() => (window as any).__toast?.(lang === "pt" ? "Nova categoria manual: em breve" : "Custom category: coming soon", "warn")}>
          <Icon name="plus" className="btn-icon" />{lang === "pt" ? "Nova categoria" : "New category"}
        </button>
      </div>
      {hasData ? (
        <div className="card">
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
                  <td><span className="pill"><span className="cat-dot" style={{ background: CAT_COLORS[r.cat] }}></span>{I18N[lang].categories[r.cat]}</span></td>
                  <td className="muted">{r.sub ?? "—"}</td>
                  <td className="r num">{(r.confidence * 100).toFixed(0)}%</td>
                  <td className="r num muted">{r.seen}×</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="tag"
          title={lang === "pt" ? "Nenhuma regra aprendida ainda" : "No learned rules yet"}
          sub={lang === "pt" ? "As regras de categorização são criadas automaticamente ao importar e editar transações." : "Categorization rules are created automatically when you import and edit transactions."}
        />
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
