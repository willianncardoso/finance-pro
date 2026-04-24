"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, Txn, SUBCATS, fmtMoney } from "../lib/data";

/* ─── Vault & Storage Page ─────────────────────────────────────────── */

interface VaultData {
  path: string;
  size: number;
  lastSave: Date;
  lastBackup: Date;
  records: number;
  txns: number;
  attachments: number;
  encrypted: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  backupPath: string;
  backupFreq: string;
  version: string;
}

interface RecentVault {
  path: string;
  label: string;
  lastOpen: string;
  active: boolean;
}

const VAULT_MOCK: VaultData = {
  path: "~/Library/Application Support/FinancePro/vault.db",
  size: 4.2,
  lastSave: new Date(Date.now() - 4 * 60000),
  lastBackup: new Date(Date.now() - 3600000 * 14),
  records: 3847,
  txns: 1243,
  attachments: 84,
  encrypted: true,
  autoSave: true,
  autoSaveInterval: 5,
  backupPath: "~/Dropbox/Backups/FinancePro/",
  backupFreq: "daily",
  version: "1.4.2",
};

const RECENT_VAULTS: RecentVault[] = [
  { path: "~/Library/Application Support/FinancePro/vault.db", label: "Principal", lastOpen: "Agora", active: true },
  { path: "~/Documents/financas_backup_2025.db", label: "Backup 2025", lastOpen: "3 dias atrás", active: false },
  { path: "/Volumes/SSD Externo/FinancePro/vault_old.db", label: "SSD Externo", lastOpen: "12 dias atrás", active: false },
];

interface VaultWizardProps {
  mode: "new" | "open" | "switch";
  lang: Lang;
  recentVaults: RecentVault[];
  currentPath: string;
  onClose: () => void;
  onConfirm: (path: string) => void;
}
function VaultWizard({ mode, lang, recentVaults, onClose, onConfirm }: VaultWizardProps) {
  const pt = lang === "pt";
  const [step, setStep] = useState(0);
  const [selectedPath, setSelectedPath] = useState("");
  const [vaultName, setVaultName] = useState("Meu Vault");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [selectedRecent, setSelectedRecent] = useState<string | null>(null);

  const SUGGESTED_PATHS = [
    "~/Library/Application Support/FinancePro/",
    "~/Documents/FinancePro/",
    "~/Dropbox/FinancePro/",
    "~/OneDrive/FinancePro/",
    pt ? "Outro caminho…" : "Custom path…",
  ];

  const titles: Record<string, string[]> = {
    new: [pt ? "Criar novo vault" : "Create new vault", pt ? "Escolher local" : "Choose location", pt ? "Definir senha" : "Set password", pt ? "Confirmar" : "Confirm"],
    open: [pt ? "Abrir vault existente" : "Open existing vault", pt ? "Autenticar" : "Authenticate"],
    switch: [pt ? "Trocar vault" : "Switch vault", pt ? "Autenticar" : "Authenticate"],
  };
  const steps = titles[mode] ?? [];
  const pwStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const pwMatch = password === confirmPw && password.length > 0;
  const pwColors = ["", "var(--danger)", "var(--warn)", "var(--accent)"];
  const pwLabels = pt ? ["", "Fraca", "Razoável", "Forte"] : ["", "Weak", "Fair", "Strong"];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: 520, background: "var(--surface)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: "var(--ink)", display: "grid", placeItems: "center" }}>
            <Icon name="shield" style={{ width: 15, height: 15, stroke: "var(--bg)" }} className="" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{steps[step]}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 1 }}>{pt ? `Passo ${step + 1} de ${steps.length}` : `Step ${step + 1} of ${steps.length}`}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" style={{ width: 14, height: 14 }} className="" /></button>
        </div>

        <div style={{ display: "flex", gap: 4, padding: "12px 20px 0" }}>
          {steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? "var(--ink)" : "var(--bg-3)", transition: "background 0.2s" }} />
          ))}
        </div>

        <div style={{ padding: 20, minHeight: 280 }}>
          {mode === "new" && step === 0 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16, lineHeight: 1.6 }}>
                {pt ? "Um vault é um banco de dados SQLite criptografado com AES-256 onde todos os seus dados financeiros ficam armazenados localmente. Você tem controle total sobre o arquivo." : "A vault is an AES-256-encrypted SQLite database where all your financial data is stored locally. You have full control over the file."}
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", display: "block", marginBottom: 5 }}>{pt ? "Nome do vault" : "Vault name"}</label>
                <input value={vaultName} onChange={e => setVaultName(e.target.value)}
                  className="field" style={{ width: "100%" }} />
              </div>
              {[
                { icon: "shield", t: pt ? "Criptografia local" : "Local encryption", d: pt ? "Seus dados nunca saem do dispositivo" : "Your data never leaves the device" },
                { icon: "file", t: "SQLite + AES-256", d: pt ? "Formato padrão, portável e compatível" : "Standard, portable, compatible format" },
                { icon: "refresh", t: pt ? "Backup automático" : "Auto-backup", d: pt ? "Configurável para Dropbox, pasta local etc." : "Configurable for Dropbox, local folder, etc." },
              ].map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
                  <Icon name={f.icon} style={{ width: 16, height: 16, stroke: "var(--ink-3)", flexShrink: 0, marginTop: 1 }} className="" />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 500 }}>{f.t}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{f.d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mode === "new" && step === 1 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 14 }}>
                {pt ? "Escolha onde o arquivo vault.db será criado:" : "Choose where vault.db will be created:"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {SUGGESTED_PATHS.map((p, i) => (
                  <div key={i} onClick={() => setSelectedPath(p)}
                    style={{ padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${selectedPath === p ? "var(--ink)" : "var(--border)"}`, background: selectedPath === p ? "var(--bg-2)" : "transparent", display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon name={i === SUGGESTED_PATHS.length - 1 ? "more" : "file"} style={{ width: 14, height: 14, stroke: "var(--ink-3)" }} className="" />
                    <span className="mono" style={{ fontSize: 12 }}>{p}</span>
                    {selectedPath === p && <Icon name="check" style={{ width: 14, height: 14, stroke: "var(--accent)", marginLeft: "auto" }} className="" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "new" && step === 2 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16, lineHeight: 1.55 }}>
                {pt ? "Defina uma senha mestra forte. Ela criptografa todo o vault — sem ela não há recuperação." : "Set a strong master password. It encrypts the entire vault — without it there is no recovery."}
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="field-label">{pt ? "Senha mestra" : "Master password"}</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="field" style={{ width: "100%" }} />
                <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= pwStrength ? pwColors[pwStrength] : "var(--bg-3)" }} />
                  ))}
                  <span style={{ fontSize: 10.5, color: "var(--ink-3)", marginLeft: 6 }}>{pwLabels[pwStrength]}</span>
                </div>
              </div>
              <div>
                <label className="field-label">{pt ? "Confirmar senha" : "Confirm password"}</label>
                <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                  className="field" style={{ width: "100%", borderColor: confirmPw && !pwMatch ? "var(--danger)" : undefined }} />
                {confirmPw && !pwMatch && <div style={{ fontSize: 11, color: "var(--danger-fg)", marginTop: 4 }}>{pt ? "As senhas não coincidem" : "Passwords do not match"}</div>}
              </div>
              <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--warn-bg)", borderRadius: 8, fontSize: 11.5, color: "var(--warn-fg)", lineHeight: 1.5 }}>
                <strong>{pt ? "Atenção:" : "Warning:"}</strong> {pt ? "Anote sua senha em local seguro. Se esquecida, os dados não podem ser recuperados." : "Write down your password in a safe place. If forgotten, data cannot be recovered."}
              </div>
            </div>
          )}

          {mode === "new" && step === 3 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>{pt ? "Confirmar criação do vault" : "Confirm vault creation"}</div>
              {[
                { l: pt ? "Nome" : "Name", v: vaultName },
                { l: pt ? "Local" : "Location", v: selectedPath || SUGGESTED_PATHS[0] },
                { l: pt ? "Arquivo" : "File", v: "vault.db" },
                { l: pt ? "Criptografia" : "Encryption", v: "AES-256-GCM" },
                { l: pt ? "Senha" : "Password", v: "••••••••" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--ink-2)" }}>{r.l}</span>
                  <span className="mono" style={{ fontWeight: 500, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>{r.v}</span>
                </div>
              ))}
            </div>
          )}

          {mode === "open" && step === 0 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 16 }}>
                {pt ? "Navegue até um arquivo .db existente do Finance Pro:" : "Browse to an existing Finance Pro .db file:"}
              </div>
              <div className="dz" style={{ marginBottom: 14, padding: 28 }} onClick={() => setSelectedPath("~/Downloads/vault.db")}>
                <Icon name="file" style={{ width: 30, height: 30, stroke: "var(--ink-3)" }} className="" />
                <div style={{ fontSize: 14, fontWeight: 600, margin: "8px 0 4px" }}>{pt ? "Clique para escolher arquivo" : "Click to choose file"}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{pt ? "Arquivos .db ou .sqlite" : ".db or .sqlite files"}</div>
              </div>
              {selectedPath && (
                <div style={{ padding: "10px 12px", background: "var(--accent-bg)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <Icon name="check" style={{ width: 14, height: 14, stroke: "var(--accent-fg)" }} className="" />
                  <span className="mono" style={{ fontSize: 11.5, color: "var(--accent-fg)" }}>{selectedPath}</span>
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-3)", marginBottom: 8 }}>{pt ? "Ou escolha dos vaults recentes:" : "Or pick from recent vaults:"}</div>
                {recentVaults.filter(v => !v.active).map((v, i) => (
                  <div key={i} onClick={() => setSelectedPath(v.path)}
                    style={{ padding: "8px 10px", borderRadius: 7, cursor: "pointer", border: `1px solid ${selectedPath === v.path ? "var(--ink)" : "var(--border)"}`, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="file" style={{ width: 13, height: 13, stroke: "var(--ink-3)" }} className="" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{v.label}</div>
                      <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)" }}>{v.path}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{v.lastOpen}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(mode === "open" && step === 1) || (mode === "switch" && step === 1) ? (
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 14 }}>
                {pt ? "Digite a senha mestra do vault selecionado:" : "Enter the master password for the selected vault:"}
              </div>
              <div className="mono muted" style={{ fontSize: 11, marginBottom: 14, padding: "6px 10px", background: "var(--bg-2)", borderRadius: 6 }}>
                {selectedPath || selectedRecent || recentVaults[1]?.path}
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={pt ? "Senha mestra…" : "Master password…"} className="field" style={{ width: "100%" }} />
            </div>
          ) : null}

          {mode === "switch" && step === 0 && (
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-2)", marginBottom: 14 }}>
                {pt ? "Selecione um vault para abrir:" : "Select a vault to open:"}
              </div>
              {recentVaults.map((v, i) => (
                <div key={i} onClick={() => !v.active && setSelectedRecent(v.path)}
                  style={{ padding: "12px 14px", borderRadius: 9, cursor: v.active ? "default" : "pointer", border: `1px solid ${selectedRecent === v.path ? "var(--ink)" : "var(--border)"}`, background: v.active || selectedRecent === v.path ? "var(--bg-2)" : "transparent", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon name={v.active ? "shield" : "file"} style={{ width: 16, height: 16, stroke: v.active ? "var(--accent)" : "var(--ink-3)" }} className="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {v.label} {v.active && <span className="pill accent" style={{ fontSize: 10 }}>{pt ? "Ativo" : "Active"}</span>}
                    </div>
                    <div className="mono muted" style={{ fontSize: 10.5 }}>{v.path}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{v.lastOpen}</div>
                  </div>
                  {selectedRecent === v.path && <Icon name="check" style={{ width: 14, height: 14, stroke: "var(--ink)" }} className="" />}
                </div>
              ))}
              <button className="btn ghost sm" style={{ width: "100%", justifyContent: "center", marginTop: 4 }} onClick={() => (window as any).__vaultOpen?.()}>
                <Icon name="plus" className="btn-icon" />{pt ? "Outro vault…" : "Other vault…"}
              </button>
            </div>
          )}
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end", gap: 8, background: "var(--bg-2)" }}>
          <button className="btn sm" onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}>
            {step > 0 ? (pt ? "← Voltar" : "← Back") : (pt ? "Cancelar" : "Cancel")}
          </button>
          {step < steps.length - 1 ? (
            <button className="btn primary sm" onClick={() => setStep(s => s + 1)}
              disabled={mode === "new" && step === 2 && !pwMatch}>
              {pt ? "Continuar →" : "Continue →"}
            </button>
          ) : (
            <button className="btn primary sm" onClick={() => onConfirm(selectedPath || selectedRecent || recentVaults[1]?.path || "")}>
              {mode === "new" ? (pt ? "Criar vault" : "Create vault") : mode === "open" ? (pt ? "Abrir" : "Open") : (pt ? "Trocar" : "Switch")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export interface VaultPageProps { lang: Lang; }
export function VaultPage({ lang }: VaultPageProps) {
  const pt = lang === "pt";
  const [vault, setVault] = useState<VaultData>(VAULT_MOCK);
  const [recentVaults] = useState<RecentVault[]>(RECENT_VAULTS);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardMode, setWizardMode] = useState<"new" | "open" | "switch">("new");
  const [saveFlash, setSaveFlash] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const lastSaveLabel = () => {
    const mins = Math.floor((Date.now() - vault.lastSave.getTime()) / 60000) + elapsed;
    if (mins < 1) return pt ? "agora mesmo" : "just now";
    if (mins < 60) return pt ? `${mins} min atrás` : `${mins}m ago`;
    return pt ? `${Math.floor(mins / 60)}h atrás` : `${Math.floor(mins / 60)}h ago`;
  };

  const handleManualSave = () => {
    setSaveFlash(true);
    setVault(v => ({ ...v, lastSave: new Date() }));
    setElapsed(0);
    setTimeout(() => setSaveFlash(false), 1800);
    (window as any).__vaultSave?.();
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{pt ? "Vault & armazenamento" : "Vault & storage"}</h1>
          <p className="page-sub">{pt ? "Banco de dados local · criptografado · controle total" : "Local database · encrypted · full control"}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn sm" onClick={() => (window as any).__vaultOpen?.()}>
            <Icon name="link" className="btn-icon" />{pt ? "Abrir vault" : "Open vault"}
          </button>
          <button className="btn sm" onClick={() => (window as any).__vaultNew?.()}>
            <Icon name="plus" className="btn-icon" />{pt ? "Novo vault" : "New vault"}
          </button>
        </div>
      </div>

      {/* Status hero */}
      <div className="card" style={{ marginBottom: 14, background: "var(--ink)", color: "var(--bg)", border: "none", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: "var(--accent)", opacity: 0.12 }} />
        <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr auto", gap: 20, alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "grid", placeItems: "center" }}>
                <Icon name="shield" style={{ width: 16, height: 16 }} className="" />
              </div>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{pt ? "Vault ativo" : "Active vault"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "oklch(0.6 0.14 155)" }} />
                  <span className="mono" style={{ fontSize: 10.5, opacity: 0.7 }}>
                    {saveFlash ? (pt ? "Salvo!" : "Saved!") : (pt ? `salvo ${lastSaveLabel()}` : `saved ${lastSaveLabel()}`)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.07)", borderRadius: 8, cursor: "pointer" }}
              onClick={() => navigator.clipboard?.writeText(vault.path)}>
              <Icon name="file" style={{ width: 13, height: 13, opacity: 0.6, flexShrink: 0 }} className="" />
              <span className="mono" style={{ fontSize: 11.5, opacity: 0.85, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vault.path}</span>
              <Icon name="external" style={{ width: 12, height: 12, opacity: 0.4, flexShrink: 0 }} className="" />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button onClick={handleManualSave} style={{
              padding: "10px 20px", background: saveFlash ? "oklch(0.55 0.14 155)" : "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.15)", borderRadius: 9,
              color: "white", fontFamily: "var(--font-body)", fontWeight: 600, fontSize: 13,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s",
            }}>
              <Icon name={saveFlash ? "check" : "download"} style={{ width: 14, height: 14 }} className="" />
              {saveFlash ? (pt ? "Salvo ✓" : "Saved ✓") : (pt ? "Salvar agora" : "Save now")}
            </button>
            <div style={{ fontSize: 10.5, opacity: 0.5, fontFamily: "var(--font-mono)" }}>⌘S {pt ? "também funciona" : "also works"}</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 22px", display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
          {[
            { l: pt ? "Tamanho" : "Size", v: vault.size + " MB" },
            { l: pt ? "Registros" : "Records", v: vault.records.toLocaleString() },
            { l: pt ? "Transações" : "Transactions", v: vault.txns.toLocaleString() },
            { l: pt ? "Anexos" : "Attachments", v: String(vault.attachments) },
            { l: pt ? "Criptografia" : "Encryption", v: "AES-256" },
            { l: "Version", v: vault.version },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.5 }}>{s.l}</div>
              <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Auto-save */}
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{pt ? "Salvamento automático" : "Auto-save"}</h3>
            <button className={"toggle" + (vault.autoSave ? " on" : "")} onClick={() => setVault(v => ({ ...v, autoSave: !v.autoSave }))} />
          </div>
          <div className="card-pad">
            <div style={{ opacity: vault.autoSave ? 1 : 0.4, transition: "opacity 0.2s" }}>
              <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 14, lineHeight: 1.5 }}>
                {pt ? "Salva automaticamente no disco local. Não requer conexão com internet." : "Saves automatically to local disk. No internet connection required."}
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }}>{pt ? "Intervalo" : "Interval"}</div>
                <div className="seg">
                  {[1, 5, 15, 30].map(n => (
                    <button key={n} className={vault.autoSaveInterval === n ? "on" : ""} onClick={() => setVault(v => ({ ...v, autoSaveInterval: n }))}>
                      {n}{pt ? "min" : "m"}
                    </button>
                  ))}
                  <button className={vault.autoSaveInterval === 0 ? "on" : ""} onClick={() => setVault(v => ({ ...v, autoSaveInterval: 0 }))}>
                    {pt ? "Ao editar" : "On edit"}
                  </button>
                </div>
              </div>
              {vault.autoSaveInterval === 0 && (
                <div style={{ padding: "8px 10px", background: "var(--warn-bg)", borderRadius: 6, fontSize: 11.5, color: "var(--warn-fg)" }}>
                  <Icon name="alert" style={{ width: 12, height: 12, verticalAlign: "middle", marginRight: 4 }} className="" />
                  {pt ? "Pode impactar performance em edições frequentes." : "May impact performance with frequent edits."}
                </div>
              )}
              <div style={{ marginTop: 14, padding: "8px 10px", background: "var(--accent-bg)", borderRadius: 6, display: "flex", gap: 8, alignItems: "center" }}>
                <Icon name="clock" style={{ width: 13, height: 13, stroke: "var(--accent-fg)" }} className="" />
                <div style={{ fontSize: 11.5, color: "var(--accent-fg)" }}>
                  {pt ? "Próximo salvamento automático em " : "Next auto-save in "}<strong>{vault.autoSaveInterval || 1} min</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backup */}
        <div className="card">
          <div className="card-head">
            <h3 className="card-title">{pt ? "Backup automático" : "Auto backup"}</h3>
            <span className="pill accent">{pt ? "Ativo" : "Active"}</span>
          </div>
          <div className="card-pad">
            <div style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 12 }}>
              {pt ? "Copia o vault para outra pasta periodicamente." : "Copies vault to another folder periodically."}
            </div>
            <div style={{ padding: "9px 11px", background: "var(--bg-2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="file" style={{ width: 13, height: 13, stroke: "var(--ink-3)" }} className="" />
              <span className="mono" style={{ fontSize: 11, color: "var(--ink-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vault.backupPath}</span>
              <button className="btn ghost sm" onClick={() => (window as any).__toast?.(pt ? "Backup em nuvem em breve" : "Cloud backup coming soon", "info")}>{pt ? "Alterar" : "Change"}</button>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-2)", marginBottom: 6 }}>{pt ? "Frequência" : "Frequency"}</div>
              <div className="seg">
                {[
                  { k: "hourly", l: pt ? "Hora" : "Hourly" },
                  { k: "daily", l: pt ? "Diário" : "Daily" },
                  { k: "weekly", l: pt ? "Semanal" : "Weekly" },
                ].map(f => (
                  <button key={f.k} className={vault.backupFreq === f.k ? "on" : ""} onClick={() => setVault(v => ({ ...v, backupFreq: f.k }))}>{f.l}</button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--font-mono)" }}>
              {pt ? "Último backup: " : "Last backup: "}
              {vault.lastBackup.toLocaleString(lang === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </div>
            <button className="btn sm" style={{ marginTop: 10 }} onClick={() => (window as any).__vaultSave?.()}>
              <Icon name="refresh" className="btn-icon" />{pt ? "Fazer backup agora" : "Backup now"}
            </button>
          </div>
        </div>
      </div>

      {/* Recent vaults */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-head">
          <h3 className="card-title">{pt ? "Vaults recentes" : "Recent vaults"}</h3>
          <button className="btn sm" onClick={() => (window as any).__vaultOpen?.()}>
            <Icon name="refresh" className="btn-icon" />{pt ? "Trocar vault" : "Switch vault"}
          </button>
        </div>
        <div>
          {recentVaults.map((v, i) => (
            <div key={i} style={{
              padding: "12px 16px", borderBottom: i < recentVaults.length - 1 ? "1px solid var(--border)" : "none",
              display: "flex", alignItems: "center", gap: 12,
              background: v.active ? "var(--accent-bg)" : "transparent",
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, background: v.active ? "var(--accent)" : "var(--bg-3)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                <Icon name={v.active ? "shield" : "file"} style={{ width: 15, height: 15, stroke: v.active ? "white" : "var(--ink-3)" }} className="" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                  {v.label}
                  {v.active && <span className="pill accent" style={{ fontSize: 10 }}>{pt ? "Ativo" : "Active"}</span>}
                </div>
                <div className="mono muted" style={{ fontSize: 10.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{v.path}</div>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-3)", whiteSpace: "nowrap" }}>{v.lastOpen}</div>
              {!v.active && (
                <button className="btn sm" onClick={() => { setWizardMode("switch"); setWizardOpen(true); }}>{pt ? "Abrir" : "Open"}</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: "var(--danger)" }}>
        <div className="card-head">
          <h3 className="card-title" style={{ color: "var(--danger-fg)" }}>{pt ? "Zona de perigo" : "Danger zone"}</h3>
        </div>
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            {
              l: pt ? "Mover vault para outro local" : "Move vault to another location",
              d: pt ? "Copia e move o arquivo .db para outro caminho" : "Copies and moves the .db file to a new path",
              icon: "external", btn: pt ? "Mover" : "Move", danger: false,
              action: () => (window as any).__toast?.(pt ? "Em breve" : "Coming soon", "info"),
            },
            {
              l: pt ? "Alterar senha mestra" : "Change master password",
              d: pt ? "Re-criptografa todo o banco com a nova senha" : "Re-encrypts the entire database with a new password",
              icon: "lock", btn: pt ? "Alterar" : "Change", danger: false,
              action: () => (window as any).__toast?.(pt ? "Em breve" : "Coming soon", "info"),
            },
            {
              l: pt ? "Exportar dados brutos" : "Export raw data",
              d: pt ? "Exporta CSV/JSON sem criptografia — cuidado" : "Exports CSV/JSON unencrypted — be careful",
              icon: "download", btn: pt ? "Exportar" : "Export", danger: false,
              action: () => (window as any).__vaultSave?.(),
            },
            {
              l: pt ? "Apagar vault" : "Delete vault",
              d: pt ? "Remove permanentemente todos os dados. Irreversível." : "Permanently removes all data. Irreversible.",
              icon: "x", btn: pt ? "Apagar" : "Delete", danger: true,
              action: () => {
                if (confirm(pt ? "Apagar todos os dados? Esta ação é irreversível." : "Delete all data? This action is irreversible.")) {
                  localStorage.removeItem("fp_txns");
                  localStorage.removeItem("fp_state");
                  localStorage.removeItem("fp_route");
                  localStorage.removeItem("fp_imports");
                  window.location.reload();
                }
              },
            },
          ].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.l}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{a.d}</div>
              </div>
              <button className="btn sm" style={a.danger ? { borderColor: "var(--danger)", color: "var(--danger-fg)" } : {}} onClick={a.action}>
                <Icon name={a.icon} className="btn-icon" />{a.btn}
              </button>
            </div>
          ))}
        </div>
      </div>

      {wizardOpen && (
        <VaultWizard
          mode={wizardMode}
          lang={lang}
          recentVaults={recentVaults}
          currentPath={vault.path}
          onClose={() => setWizardOpen(false)}
          onConfirm={(path) => { setVault(v => ({ ...v, path })); setWizardOpen(false); }}
        />
      )}
    </div>
  );
}

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
  const [reimbStage, setReimbStage] = useState<'none' | 'pending' | 'received'>(
    txn?.reimburseReceived ? 'received' : txn?.reimbursable ? 'pending' : 'none'
  );
  const [reimbAmt, setReimbAmt] = useState(txn?.reimbAmt ? String(txn.reimbAmt) : "");
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
      setReimbStage(txn.reimburseReceived ? 'received' : txn.reimbursable ? 'pending' : 'none');
      setReimbAmt(txn.reimbAmt ? String(txn.reimbAmt) : "");
      setLearnRule(true);
      setSplit(false);
    }
  }, [txn?.d, txn?.merch]);

  const subcatOptions = cat && SUBCATS[cat] ? SUBCATS[cat] : [];
  const suggestions: { cat: string; sub?: string }[] = [];

  const cats = Object.keys(SUBCATS);

  if (!txn) return null;

  function handleSave() {
    const reimbAmt_ = parseFloat(reimbAmt);
    onSave({
      ...txn!, cat, sub, merch,
      amt: txn!.amt < 0 ? -parseFloat(amt) : parseFloat(amt),
      notes, recurring, exclude,
      reimbursable: reimbStage === 'pending' || undefined,
      reimburseReceived: reimbStage === 'received' || undefined,
      reimbAmt: reimbStage !== 'none' && !isNaN(reimbAmt_) && reimbAmt_ > 0 ? reimbAmt_ : undefined,
    });
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
              ] as const).map(f => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{f.sub}</div>
                  </div>
                  <button className={"toggle" + (f.val ? " on" : "")} onClick={() => (f.set as (v: boolean) => void)(!f.val)} />
                </div>
              ))}

              {/* Reimbursable — 3-stage */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: reimbStage !== 'none' ? 8 : 0 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{lang === "pt" ? "Reembolsável" : "Reimbursable"}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
                      {reimbStage === 'none' && (lang === "pt" ? "Nenhum" : "None")}
                      {reimbStage === 'pending' && (lang === "pt" ? "Aguardando devolução" : "Awaiting reimbursement")}
                      {reimbStage === 'received' && (lang === "pt" ? "Reembolso recebido" : "Reimbursement received")}
                    </div>
                  </div>
                  <div className="seg" style={{ fontSize: 11 }}>
                    {([
                      { k: 'none', l: lang === 'pt' ? 'Nenhum' : 'None' },
                      { k: 'pending', l: lang === 'pt' ? 'A receber' : 'Pending' },
                      { k: 'received', l: lang === 'pt' ? 'Recebido' : 'Received' },
                    ] as const).map(o => (
                      <button key={o.k} className={reimbStage === o.k ? 'on' : ''} onClick={() => setReimbStage(o.k)}>{o.l}</button>
                    ))}
                  </div>
                </div>
                {reimbStage !== 'none' && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <label className="field-label">{lang === "pt" ? "Valor a reembolsar (opcional)" : "Amount to reimburse (optional)"}</label>
                      <input className="field mono" placeholder={`${Math.abs(parseFloat(amt) || 0).toFixed(2)}`}
                        value={reimbAmt} onChange={e => setReimbAmt(e.target.value)} />
                    </div>
                    {reimbStage === 'pending' && (
                      <button className="btn sm" style={{ marginTop: 18, flexShrink: 0 }}
                        onClick={() => {
                          const ra = parseFloat(reimbAmt) || Math.abs(parseFloat(amt) || txn!.amt);
                          (window as any).__addTxn?.({
                            d: new Date().toISOString().slice(0, 10),
                            merch: (lang === 'pt' ? 'Reembolso · ' : 'Reimbursement · ') + merch,
                            cat: 'income', sub: 'Reembolso',
                            acct: txn!.acct, amt: ra,
                          });
                          setReimbStage('received');
                          (window as any).__toast?.(lang === 'pt' ? `✓ Reembolso de ${fmtMoney(ra, lang)} registrado` : `✓ Reimbursement of ${fmtMoney(ra, lang)} recorded`);
                        }}>
                        {lang === 'pt' ? '+ Adicionar receita' : '+ Add income'}
                      </button>
                    )}
                  </div>
                )}
              </div>
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
    </div>
  );
}
