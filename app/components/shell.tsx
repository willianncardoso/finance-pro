"use client";

import { useState, useEffect } from "react";
import { Icon } from "./icons";
import { I18N, Lang, Insight } from "../lib/data";

type Route = string;

interface NavItemProps {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: number | string | null;
  warn?: boolean;
}
function NavItem({ icon, label, active, onClick, badge, warn }: NavItemProps) {
  return (
    <div className={"nav-item" + (active ? " active" : "")} onClick={onClick}>
      <Icon name={icon} className="nav-icon" />
      <span>{label}</span>
      {badge != null && <span className={"nav-badge" + (warn ? " warn" : "")}>{badge}</span>}
    </div>
  );
}

interface SidebarProps {
  lang: Lang;
  route: Route;
  setRoute: (r: Route) => void;
}
export function Sidebar({ lang, route, setRoute }: SidebarProps) {
  const t = I18N[lang];
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">₣</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="brand-name">{t.app_name}</div>
            <span style={{ fontSize: 9.5, fontFamily: "var(--font-mono)", color: "var(--ink-4)", background: "var(--bg-3)", borderRadius: 4, padding: "1px 5px", letterSpacing: "0.04em", flexShrink: 0 }}>v0.2.0</span>
          </div>
          <div className="brand-sub">{t.app_tagline}</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-sect">{t.nav_overview}</div>
        <NavItem icon="dashboard" label={t.nav_dashboard} active={route === "dashboard"} onClick={() => setRoute("dashboard")} />
        <NavItem icon="insight" label={t.nav_insights} active={route === "insights"} onClick={() => setRoute("insights")} badge={8} warn />
        <NavItem icon="report" label={t.nav_reports} active={route === "reports"} onClick={() => setRoute("reports")} />

        <div className="nav-sect" style={{ marginTop: 8 }}>{lang === "pt" ? "Meu dinheiro" : "My money"}</div>
        <NavItem icon="wallet" label={t.nav_accounts} active={route === "accounts"} onClick={() => setRoute("accounts")} />
        <NavItem icon="card" label={t.nav_cards} active={route === "cards"} onClick={() => setRoute("cards")} badge={4} />
        <NavItem icon="trend" label={t.nav_invest} active={route === "invest"} onClick={() => setRoute("invest")} />

        <div className="nav-sect" style={{ marginTop: 8 }}>{lang === "pt" ? "Planejamento" : "Planning"}</div>
        <NavItem icon="target" label={t.nav_budget} active={route === "budget"} onClick={() => setRoute("budget")} />
        <NavItem icon="tag" label={t.nav_categories} active={route === "categories"} onClick={() => setRoute("categories")} />

        <div className="nav-sect" style={{ marginTop: 8 }}>{lang === "pt" ? "Análise" : "Analysis"}</div>
        <NavItem icon="refresh" label={lang === "pt" ? "Comparar períodos" : "Compare periods"} active={route === "compare"} onClick={() => setRoute("compare")} />
        <NavItem icon="trend" label={t.nav_projection} active={route === "projection"} onClick={() => setRoute("projection")} />
        <NavItem icon="refresh" label={t.nav_recurring} active={route === "recurring"} onClick={() => setRoute("recurring")} />
        <NavItem icon="upload" label={t.nav_import} active={route === "import"} onClick={() => setRoute("import")} />
        <NavItem icon="lock" label={lang === "pt" ? "Vault & armazenamento" : "Vault & storage"} active={route === "vault"} onClick={() => setRoute("vault")} />
        <NavItem icon="settings" label={t.nav_settings} active={route === "settings"} onClick={() => setRoute("settings")} />
      </nav>
      <div className="sidebar-foot">
        <div className="avatar">WC</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            Will C.
          </div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4 }}>
            <Icon name="shield" style={{ width: 10, height: 10, stroke: "var(--accent)" }} className="" />
            <span className="mono">vault · local</span>
          </div>
        </div>
        <button className="icon-btn" title={lang === "pt" ? "Sincronizar" : "Sync"}
          onClick={() => (window as any).__toast?.(lang === "pt" ? "Sincronização em nuvem disponível em breve" : "Cloud sync coming soon", "info")}>
          <Icon name="refresh" style={{ width: 14, height: 14 }} className="" />
        </button>
      </div>
    </aside>
  );
}

interface TopbarProps {
  lang: Lang;
  setLang: (l: Lang) => void;
  privacy: boolean;
  setPrivacy: (p: boolean) => void;
  setRoute: (r: Route) => void;
  onNewTxn?: () => void;
}
export function Topbar({ lang, setLang, privacy, setPrivacy, setRoute, onNewTxn }: TopbarProps) {
  const t = I18N[lang];
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const h = () => {
      setSavedFlash(true);
      clearTimeout(timer);
      timer = setTimeout(() => setSavedFlash(false), 2200);
    };
    window.addEventListener("fp:autosave", h);
    return () => { window.removeEventListener("fp:autosave", h); clearTimeout(timer); };
  }, []);

  return (
    <header className="topbar">
      <div className="search" style={{ cursor: "pointer" }} onClick={() => (window as any).__modal?.("cmdpalette", {})}>
        <Icon name="search" style={{ width: 14, height: 14 }} className="" />
        <span>{t.search_placeholder}</span>
        <span className="kbd">⌘K</span>
      </div>
      <div className="topbar-actions">
        {savedFlash && (
          <span style={{
            fontSize: 11, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 4,
            opacity: savedFlash ? 1 : 0, transition: "opacity 0.4s",
          }}>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 4L6 11l-3-3" />
            </svg>
            {lang === "pt" ? "Salvo" : "Saved"}
          </span>
        )}
        <div className="seg" style={{ marginRight: 6 }}>
          <button className={lang === "pt" ? "on" : ""} onClick={() => setLang("pt")}>PT</button>
          <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
        </div>
        <button className="icon-btn" onClick={() => setPrivacy(!privacy)} title={lang === "pt" ? "Privacidade" : "Privacy"}>
          <Icon name={privacy ? "eye_off" : "eye"} style={{ width: 15, height: 15 }} className="" />
        </button>
        <button className="icon-btn" onClick={() => setRoute("insights")} title={lang === "pt" ? "Alertas" : "Alerts"}>
          <Icon name="bell" style={{ width: 15, height: 15 }} className="" />
          <span className="dot"></span>
        </button>
        <button className="btn sm" onClick={() => setRoute("import")}>
          <Icon name="upload" className="btn-icon" />
          <span>{t.import_doc}</span>
        </button>
        <button className="btn primary sm" onClick={onNewTxn}>
          <Icon name="plus" className="btn-icon" />
          <span>{t.new_transaction}</span>
        </button>
      </div>
    </header>
  );
}

interface InsightCardProps {
  insight: Insight;
  lang: Lang;
  compact?: boolean;
  onDismiss?: () => void;
  onInvestigate?: () => void;
}
export function InsightCard({ insight, lang, compact = false, onDismiss, onInvestigate }: InsightCardProps) {
  const t = I18N[lang];
  const iconMap: Record<string, string> = { warn: "alert", pos: "trend", info: "sparkle", danger: "alert" };
  return (
    <div className={"insight " + insight.kind}>
      <div className="insight-icon">
        <Icon name={iconMap[insight.kind]} className="" style={{ width: 15, height: 15, stroke: "currentColor", strokeWidth: 1.7, fill: "none" }} />
      </div>
      <div className="insight-body">
        <h4 className="insight-title">{insight.t}</h4>
        {!compact && <p className="insight-text">{insight.x}</p>}
        <div className="insight-meta">
          <span className={"pill " + (insight.kind === "pos" ? "accent" : insight.kind === "danger" ? "danger" : insight.kind === "info" ? "info" : "warn")}>
            {insight.tag}
          </span>
          <span>{insight.when}</span>
          {!compact && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <button className="btn ghost sm" onClick={onDismiss}>{t.dismiss}</button>
              <button className="btn sm" onClick={onInvestigate}>{t.investigate}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type Palette = "graphite" | "forest" | "indigo" | "terracotta";
export type Density = "high" | "medium" | "low";
export type DashLayout = "classic" | "command" | "narrative";

export interface AppState {
  palette: Palette;
  density: Density;
  layout: DashLayout;
  lang: Lang;
  privacy: boolean;
}

interface TweaksPanelProps {
  state: AppState;
  update: (patch: Partial<AppState>) => void;
  visible: boolean;
}
export function TweaksPanel({ state, update, visible }: TweaksPanelProps) {
  if (!visible) return null;
  const palettes: { k: Palette; label: string; color: string }[] = [
    { k: "graphite", label: "Graphite", color: "oklch(0.3 0.01 260)" },
    { k: "forest", label: "Forest", color: "oklch(0.5 0.14 160)" },
    { k: "indigo", label: "Indigo", color: "oklch(0.5 0.17 270)" },
    { k: "terracotta", label: "Terracotta", color: "oklch(0.58 0.14 40)" },
  ];
  const densities: { k: Density; label: string }[] = [
    { k: "high", label: "High" },
    { k: "medium", label: "Med" },
    { k: "low", label: "Low" },
  ];
  const layouts: { k: DashLayout; label: string }[] = [
    { k: "classic", label: I18N[state.lang].layout_classic },
    { k: "command", label: I18N[state.lang].layout_command },
    { k: "narrative", label: I18N[state.lang].layout_narrative },
  ];
  return (
    <div className="tweaks-panel">
      <h4>Tweaks</h4>
      <div className="tweak-row">
        <label>Palette</label>
        <div className="swatches">
          {palettes.map((p) => (
            <div key={p.k} className={"swatch" + (state.palette === p.k ? " on" : "")} style={{ background: p.color }} onClick={() => update({ palette: p.k })} title={p.label} />
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>Density</label>
        <div className="seg">
          {densities.map((d) => (
            <button key={d.k} className={state.density === d.k ? "on" : ""} onClick={() => update({ density: d.k })}>{d.label}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>Dashboard</label>
        <div className="seg">
          {layouts.map((l) => (
            <button key={l.k} className={state.layout === l.k ? "on" : ""} onClick={() => update({ layout: l.k })}>{l.label}</button>
          ))}
        </div>
      </div>
      <div className="tweak-row">
        <label>{state.lang === "pt" ? "Modo privacidade" : "Privacy mode"}</label>
        <button className={"toggle" + (state.privacy ? " on" : "")} onClick={() => update({ privacy: !state.privacy })}></button>
      </div>
      <div className="tweak-row">
        <label>{state.lang === "pt" ? "Idioma" : "Language"}</label>
        <div className="seg">
          <button className={state.lang === "pt" ? "on" : ""} onClick={() => update({ lang: "pt" })}>PT</button>
          <button className={state.lang === "en" ? "on" : ""} onClick={() => update({ lang: "en" })}>EN</button>
        </div>
      </div>
    </div>
  );
}
