"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar, Topbar, TweaksPanel, AppState, type DashLayout } from "./components/shell";
import { Dashboard } from "./components/dashboard";
import {
  AccountsPage, CardsPage, InvestPage, ImportPage,
  InsightsPage, ReportsPage, BudgetPage, CategoriesPage, SettingsPage, ComparisonPage,
} from "./components/pages";
import { EditDrawer, Toast, ProjectionPage, RecurringPage, VaultPage } from "./components/edit-drawer";
import { ModalRenderer, ModalState } from "./components/modals";
import { Txn, newId, AppNotification, CardMeta } from "./lib/data";

declare global {
  interface Window {
    __openTxnEdit?: (txn: Txn) => void;
    __toast?: (message: string, kind?: "success" | "warn" | "danger") => void;
  }
}

const DEFAULT_STATE: AppState = {
  palette: "graphite",
  density: "high",
  layout: "command",
  lang: "pt",
  privacy: false,
};

function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const s = localStorage.getItem("fp_state");
    return s ? { ...DEFAULT_STATE, ...JSON.parse(s) } : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function loadRoute(): string {
  if (typeof window === "undefined") return "dashboard";
  return localStorage.getItem("fp_route") ?? "dashboard";
}

/* ─── Vault file helpers (File System Access API + download fallback) ─ */

async function vaultSaveFile(data: object): Promise<FileSystemFileHandle | null> {
  try {
    if (typeof (window as any).showSaveFilePicker !== "function") {
      // Fallback: trigger browser download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vault.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return null;
    }
    const handle: FileSystemFileHandle = await (window as any).showSaveFilePicker({
      suggestedName: "vault.json",
      types: [{ description: "Finance Pro Vault", accept: { "application/json": [".json"] } }],
    });
    const writable = await (handle as any).createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return handle;
  } catch (err: any) {
    if (err?.name !== "AbortError") console.error("vaultSave:", err);
    return null;
  }
}

async function vaultOpenFile(): Promise<{ handle: FileSystemFileHandle; data: any } | null> {
  try {
    if (typeof (window as any).showOpenFilePicker !== "function") {
      // Fallback: hidden file input
      return new Promise(resolve => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) { resolve(null); return; }
          const text = await file.text();
          try { resolve({ handle: null as any, data: JSON.parse(text) }); } catch { resolve(null); }
        };
        input.click();
      });
    }
    const [handle]: [FileSystemFileHandle] = await (window as any).showOpenFilePicker({
      types: [{ description: "Finance Pro Vault", accept: { "application/json": [".json"] } }],
    });
    const file = await handle.getFile();
    const text = await file.text();
    return { handle, data: JSON.parse(text) };
  } catch (err: any) {
    if (err?.name !== "AbortError") console.error("vaultOpen:", err);
    return null;
  }
}

/* ─── Main App ─────────────────────────────────────────────────────── */

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [route, setRoute] = useState("dashboard");
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [editTxn, setEditTxn] = useState<Txn | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "warn" | "danger" } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [cardMeta, setCardMeta] = useState<CardMeta>({});

  // File handle is a ref — changing it doesn't need a re-render
  const fileHandleRef = useRef<FileSystemFileHandle | null>(null);

  const hasData = txns.length > 0;

  useEffect(() => {
    setState(loadState());
    setRoute(loadRoute());
    try {
      const stored = localStorage.getItem("fp_txns");
      if (stored) {
        const parsed: Txn[] = JSON.parse(stored);
        setTxns(parsed.map(t => t.id ? t : { ...t, id: newId() }));
      }
    } catch {}
    try {
      const meta = localStorage.getItem("fp_card_meta");
      if (meta) setCardMeta(JSON.parse(meta));
    } catch {}
    try {
      const notifs = localStorage.getItem("fp_notifications");
      if (notifs) setNotifications(JSON.parse(notifs));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fp_txns", JSON.stringify(txns));
    window.dispatchEvent(new CustomEvent("fp:autosave"));
  }, [txns, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fp_card_meta", JSON.stringify(cardMeta));
  }, [cardMeta, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fp_notifications", JSON.stringify(notifications.slice(0, 80)));
  }, [notifications, hydrated]);

  // Due-date reminders: fire once after hydration when cardMeta has due days
  useEffect(() => {
    if (!hydrated) return;
    const today = new Date();
    const todayDay = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    Object.entries(cardMeta).forEach(([acct, meta]) => {
      if (!meta.dueDay) return;
      const diff = ((meta.dueDay - todayDay + daysInMonth) % daysInMonth);
      const label = state.lang === "pt"
        ? diff === 0 ? `Fatura ${acct} vence hoje!` : `Fatura ${acct} vence em ${diff} dia${diff > 1 ? "s" : ""}`
        : diff === 0 ? `${acct} bill due today!` : `${acct} bill due in ${diff} day${diff > 1 ? "s" : ""}`;
      if (diff <= 4) {
        addNotification(label, diff === 0 ? "danger" : "warn");
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fp_state", JSON.stringify(state));
    const html = document.documentElement;
    html.setAttribute("data-palette", state.palette);
    html.setAttribute("data-density", state.density);
    html.setAttribute("data-privacy", state.privacy ? "on" : "off");
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fp_route", route);
  }, [route, hydrated]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setModal(m => m?.type === "cmdpalette" ? null : { type: "cmdpalette", data: {} });
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Wire all window globals. Re-register whenever txns/state changes so closures are fresh.
  useEffect(() => {
    window.__openTxnEdit = (txn: Txn) => setEditTxn(txn);
    (window as any).__navigate = navigate;

    (window as any).__toast = (message: string, kind: "success" | "warn" | "danger" = "success") => {
      setToast({ message, kind });
      addNotification(message, kind);
    };

    (window as any).__modal = (type: string, data: Record<string, unknown> = {}) =>
      setModal({ type, data });

    (window as any).__togglePrivacy = () =>
      setState(prev => ({ ...prev, privacy: !prev.privacy }));

    // Add a new transaction from any modal
    (window as any).__addTxn = (txn: Omit<Txn, "id">) => {
      const withId: Txn = { ...txn, id: newId() };
      setTxns(prev => [withId, ...prev]);
    };

    // Update an existing transaction in-place (for quick actions like reimburse)
    (window as any).__updateTxn = (txn: Txn) => {
      setTxns(prev => {
        const idx = prev.findIndex(t => t.id === txn.id);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = txn;
        return next;
      });
    };

    // Bulk rename subcategory across all matching transactions
    (window as any).__bulkUpdateSub = (cat: string, oldSub: string, newSub: string) => {
      setTxns(prev => prev.map(t => t.cat === cat && t.sub === oldSub ? { ...t, sub: newSub } : t));
    };

    // Vault file system
    (window as any).__vaultSave = async () => {
      const pt = state.lang === "pt";
      const payload = { version: "1.0", exportedAt: new Date().toISOString(), txns, state };
      if (fileHandleRef.current) {
        // Write to existing handle
        try {
          const writable = await (fileHandleRef.current as any).createWritable();
          await writable.write(JSON.stringify(payload, null, 2));
          await writable.close();
          (window as any).__toast?.(pt ? "💾 Vault salvo" : "💾 Vault saved");
        } catch {
          fileHandleRef.current = null;
          (window as any).__vaultSave();
        }
        return;
      }
      const handle = await vaultSaveFile(payload);
      if (handle) {
        fileHandleRef.current = handle;
        (window as any).__toast?.(pt ? "💾 Vault salvo" : "💾 Vault saved");
      } else if (typeof (window as any).showSaveFilePicker !== "function") {
        // Fallback download succeeded
        (window as any).__toast?.(pt ? "💾 Vault exportado (download)" : "💾 Vault downloaded");
      }
    };

    (window as any).__vaultNew = async () => {
      fileHandleRef.current = null;
      await (window as any).__vaultSave();
    };

    (window as any).__vaultOpen = async () => {
      const pt = state.lang === "pt";
      const result = await vaultOpenFile();
      if (!result) return;
      const { handle, data } = result;
      if (handle) fileHandleRef.current = handle;
      if (Array.isArray(data?.txns)) setTxns(data.txns);
      if (data?.state) setState(prev => ({ ...prev, ...data.state }));
      (window as any).__toast?.(pt ? "✓ Vault carregado" : "✓ Vault loaded");
    };

    return () => {
      delete window.__openTxnEdit;
      delete (window as any).__navigate;
      delete (window as any).__toast;
      delete (window as any).__modal;
      delete (window as any).__togglePrivacy;
      delete (window as any).__addTxn;
      delete (window as any).__updateTxn;
      delete (window as any).__bulkUpdateSub;
      delete (window as any).__vaultSave;
      delete (window as any).__vaultNew;
      delete (window as any).__vaultOpen;
    };
  }, [txns, state]);

  function addNotification(message: string, kind: AppNotification["kind"] = "info") {
    const notif: AppNotification = { id: newId(), message, kind, timestamp: new Date().toISOString(), read: false };
    setNotifications(prev => [notif, ...prev].slice(0, 80));
  }

  function updateState(patch: Partial<AppState>) {
    setState(prev => ({ ...prev, ...patch }));
  }

  function handleSaveTxn(txn: Txn) {
    setTxns(prev => {
      if (txn.id) {
        // Update existing
        const idx = prev.findIndex(t => t.id === txn.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = txn;
          return next;
        }
      }
      // Add as new (EditDrawer opened with a blank txn that had no id)
      return [{ ...txn, id: newId() }, ...prev];
    });
    setEditTxn(null);
    setToast({ message: state.lang === "pt" ? "Transação salva" : "Transaction saved", kind: "success" });
  }

  function handleDeleteBatch(txnIds: string[]) {
    setTxns(prev => prev.filter(t => !txnIds.includes(t.id ?? '')));
  }

  function handleImportComplete(newTxns: Txn[], mode: "merge" | "replace" = "merge") {
    if (mode === "replace") {
      setTxns(newTxns);
    } else {
      setTxns(prev => {
        // Accounts covered by the incoming import
        const newAccts = new Set(newTxns.map(t => t.acct));
        // Index incoming txns by acct+date+amount for paste-match lookup
        const csvByKey = new Map(newTxns.map(t => [`${t.acct}|${t.d}|${t.amt.toFixed(2)}`, t]));

        // Pass 1: filter prev, noting which CSV rows were consumed or blocked
        const consumed = new Set<string>(); // CSV keys replaced by unedited paste txns
        const blocked  = new Set<string>(); // CSV keys blocked by manually-edited txns

        const filteredPrev: Txn[] = [];
        for (const t of prev) {
          const key = `${t.acct}|${t.d}|${t.amt.toFixed(2)}`;
          if (newAccts.has(t.acct) && csvByKey.has(key)) {
            if (t.source === "paste") {
              // Unedited paste → drop it; CSV version will supersede
              consumed.add(key);
              continue;
            } else {
              // Manually edited → keep it; block the CSV row
              blocked.add(key);
            }
          }
          filteredPrev.push(t);
        }

        // Pass 2: add CSV txns that aren't blocked and aren't exact duplicates
        const existingKeys = new Set(filteredPrev.map(t => `${t.d}|${t.merch}|${t.amt}`));
        const fresh = newTxns.filter(t => {
          const key = `${t.acct}|${t.d}|${t.amt.toFixed(2)}`;
          if (blocked.has(key)) return false;                          // keep manual edit
          if (!consumed.has(key) && existingKeys.has(`${t.d}|${t.merch}|${t.amt}`)) return false; // exact dup
          return true;
        });

        return [...fresh, ...filteredPrev].sort((a, b) => b.d.localeCompare(a.d));
      });
    }
    setToast({
      message: state.lang === "pt"
        ? `${newTxns.length} transações importadas com sucesso`
        : `${newTxns.length} transactions imported successfully`,
      kind: "success",
    });
    navigate("cards");
  }

  function navigate(r: string) {
    setRoute(r);
    setTweaksVisible(false);
  }

  if (!hydrated) return null;

  return (
    <div className="app" data-palette={state.palette} data-density={state.density} data-privacy={state.privacy ? "on" : "off"}>
      <Sidebar lang={state.lang} route={route} setRoute={navigate} />

      <Topbar
        lang={state.lang}
        setLang={l => updateState({ lang: l })}
        privacy={state.privacy}
        setPrivacy={p => updateState({ privacy: p })}
        setRoute={navigate}
        onNewTxn={() => setModal({ type: "newtxn", data: {} })}
        notifications={notifications}
        onMarkRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
        onClearNotifications={() => setNotifications([])}
      />

      <main className="main">
        {route === "dashboard" && (
          <Dashboard lang={state.lang} layout={state.layout} setLayout={l => updateState({ layout: l as DashLayout })} hasData={hasData} txns={txns} />
        )}
        {route === "accounts" && (
          <AccountsPage lang={state.lang} onEditTxn={setEditTxn} txns={txns} />
        )}
        {route === "cards" && (
          <CardsPage
            lang={state.lang}
            txns={txns}
            cardMeta={cardMeta}
            onUpdateCardMeta={(acct, meta) => setCardMeta(prev => ({ ...prev, [acct]: { ...prev[acct], ...meta } }))}
          />
        )}
        {route === "invest" && <InvestPage lang={state.lang} txns={txns} />}
        {route === "import" && <ImportPage lang={state.lang} onImportComplete={(txns, mode) => handleImportComplete(txns, mode)} onDeleteBatch={handleDeleteBatch} existingAccts={[...new Set(txns.map(t => t.acct))].sort()} />}
        {route === "insights" && <InsightsPage lang={state.lang} txns={txns} />}
        {route === "reports" && <ReportsPage lang={state.lang} txns={txns} />}
        {route === "budget" && <BudgetPage lang={state.lang} txns={txns} />}
        {route === "categories" && <CategoriesPage lang={state.lang} txns={txns} />}
        {route === "compare" && <ComparisonPage lang={state.lang} txns={txns} />}
        {route === "projection" && <ProjectionPage lang={state.lang} />}
        {route === "recurring" && <RecurringPage lang={state.lang} hasData={hasData} />}
        {route === "settings" && <SettingsPage lang={state.lang} />}
        {route === "vault" && <VaultPage lang={state.lang} />}
      </main>

      <button
        className="icon-btn"
        style={{ position: "fixed", bottom: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", zIndex: 90 }}
        onClick={() => setTweaksVisible(!tweaksVisible)}
        title="Tweaks"
      >
        <svg viewBox="0 0 24 24" style={{ width: 15, height: 15 }} aria-hidden="true">
          <path d="M12 3v3M12 18v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2" />
        </svg>
      </button>

      <TweaksPanel state={state} update={updateState} visible={tweaksVisible} />

      <EditDrawer
        txn={editTxn}
        lang={state.lang}
        onClose={() => setEditTxn(null)}
        onSave={handleSaveTxn}
      />

      {toast && (
        <Toast message={toast.message} kind={toast.kind} onDismiss={() => setToast(null)} />
      )}

      <ModalRenderer
        modal={modal}
        lang={state.lang}
        onClose={() => setModal(null)}
        setRoute={navigate}
      />
    </div>
  );
}
