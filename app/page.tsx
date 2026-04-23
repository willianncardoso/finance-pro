"use client";

import { useState, useEffect } from "react";
import { Sidebar, Topbar, TweaksPanel, AppState, type DashLayout } from "./components/shell";
import { Dashboard } from "./components/dashboard";
import {
  AccountsPage, CardsPage, InvestPage, ImportPage,
  InsightsPage, ReportsPage, BudgetPage, CategoriesPage, SettingsPage, ComparisonPage,
} from "./components/pages";
import { EditDrawer, Toast, ProjectionPage, RecurringPage } from "./components/edit-drawer";
import { Txn } from "./lib/data";

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

export default function Home() {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [route, setRoute] = useState("dashboard");
  const [tweaksVisible, setTweaksVisible] = useState(false);
  const [editTxn, setEditTxn] = useState<Txn | null>(null);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "warn" | "danger" } | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [txns, setTxns] = useState<Txn[]>([]);

  const hasData = txns.length > 0;

  useEffect(() => {
    setState(loadState());
    setRoute(loadRoute());
    try {
      const stored = localStorage.getItem("fp_txns");
      if (stored) setTxns(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("fp_txns", JSON.stringify(txns));
  }, [txns, hydrated]);

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
    window.__openTxnEdit = (txn: Txn) => setEditTxn(txn);
    (window as any).__navigate = navigate;
    (window as any).__toast = (message: string, kind: "success" | "warn" | "danger" = "success") =>
      setToast({ message, kind });
    return () => {
      delete window.__openTxnEdit;
      delete (window as any).__navigate;
      delete (window as any).__toast;
    };
  }, []);

  function updateState(patch: Partial<AppState>) {
    setState(prev => ({ ...prev, ...patch }));
  }

  function handleSaveTxn(txn: Txn) {
    setEditTxn(null);
    setToast({ message: state.lang === "pt" ? "Transação atualizada" : "Transaction updated", kind: "success" });
  }

  function handleImportComplete(newTxns: Txn[]) {
    setTxns(newTxns);
    setToast({
      message: state.lang === "pt"
        ? `${newTxns.length} transações importadas com sucesso`
        : `${newTxns.length} transactions imported successfully`,
      kind: "success",
    });
    navigate("accounts");
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
        onNewTxn={() => setEditTxn({ d: new Date().toISOString().slice(0, 10), merch: "", cat: "", acct: "", amt: 0 })}
      />

      <main className="main">
        {route === "dashboard" && (
          <Dashboard lang={state.lang} layout={state.layout} setLayout={l => updateState({ layout: l as DashLayout })} hasData={hasData} />
        )}
        {route === "accounts" && (
          <AccountsPage lang={state.lang} onEditTxn={setEditTxn} txns={txns} />
        )}
        {route === "cards" && <CardsPage lang={state.lang} />}
        {route === "invest" && <InvestPage lang={state.lang} />}
        {route === "import" && <ImportPage lang={state.lang} onImportComplete={handleImportComplete} />}
        {route === "insights" && <InsightsPage lang={state.lang} />}
        {route === "reports" && <ReportsPage lang={state.lang} />}
        {route === "budget" && <BudgetPage lang={state.lang} />}
        {route === "categories" && <CategoriesPage lang={state.lang} />}
        {route === "compare" && <ComparisonPage lang={state.lang} />}
        {route === "projection" && <ProjectionPage lang={state.lang} />}
        {route === "recurring" && <RecurringPage lang={state.lang} hasData={hasData} />}
        {route === "settings" && <SettingsPage lang={state.lang} />}
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
    </div>
  );
}
