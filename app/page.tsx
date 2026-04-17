"use client";

import { useState, useEffect } from "react";

const md3 = {
  background: "#0f0f13",
  surface: "#1c1b1f",
  surfaceContainer: "#211f26",
  surfaceContainerHigh: "#2b2930",
  primary: "#d0bcff",
  primaryContainer: "#4f378b",
  onPrimary: "#381e72",
  secondary: "#ccc2dc",
  tertiary: "#efb8c8",
  error: "#f2b8b5",
  outline: "#938f99",
  onSurface: "#e6e1e5",
  onSurfaceVariant: "#cac4d0",
};

type Transacao = {
  id: string;
  data: string | Date;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  banco: string;
  moeda: string;
};

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [dbStatus, setDbStatus] = useState<"loading" | "ok" | "error">("loading");
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loadingTransacoes, setLoadingTransacoes] = useState(false);

  useEffect(() => {
    fetch("/api/transacoes")
      .then((r) => setDbStatus(r.ok ? "ok" : "error"))
      .catch(() => setDbStatus("error"));
  }, []);

  useEffect(() => {
    if (activePage !== "transacoes") return;
    setLoadingTransacoes(true);
    fetch("/api/transacoes")
      .then((r) => r.json())
      .then((data) => {
        setTransacoes(Array.isArray(data) ? data : []);
        setLoadingTransacoes(false);
      })
      .catch(() => setLoadingTransacoes(false));
  }, [activePage]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "transacoes", label: "Transações", icon: "💳" },
    { id: "investimentos", label: "Investimentos", icon: "📈" },
    { id: "importar", label: "Importar Dados", icon: "📥" },
    { id: "relatorios", label: "Relatórios", icon: "📄" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: md3.background, color: md3.onSurface, fontFamily: "Inter, sans-serif" }}>

      {/* NAVIGATION RAIL - MD3 */}
      <aside style={{
        width: "260px",
        background: md3.surface,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${md3.surfaceContainerHigh}`,
      }}>

        {/* App name */}
        <div style={{ padding: "28px 24px 20px", borderBottom: `1px solid ${md3.surfaceContainerHigh}` }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: md3.primary, letterSpacing: "-0.3px" }}>
            Finance Pro
          </div>
          <div style={{ fontSize: "12px", color: md3.onSurfaceVariant, marginTop: "4px", fontWeight: 400 }}>
            Gestão financeira pessoal
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: "12px 12px" }}>
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  padding: "14px 16px",
                  borderRadius: "28px",
                  border: "none",
                  cursor: "pointer",
                  marginBottom: "4px",
                  background: isActive ? md3.primaryContainer : "transparent",
                  color: isActive ? md3.primary : md3.onSurfaceVariant,
                  fontSize: "14px",
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "Inter, sans-serif",
                  transition: "background 0.2s, color 0.2s",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${md3.surfaceContainerHigh}` }}>
          <div style={{ fontSize: "11px", color: md3.outline, marginBottom: "4px" }}>v1.0 — em construção</div>
          <div style={{ fontSize: "11px", color: dbStatus === "ok" ? "#a8d5a2" : dbStatus === "error" ? md3.error : md3.outline }}>
            {dbStatus === "loading" ? "⏳ conectando..." : dbStatus === "ok" ? "✅ banco conectado" : "❌ erro na conexão"}
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <header style={{
          background: md3.surface,
          borderBottom: `1px solid ${md3.surfaceContainerHigh}`,
          padding: "0 32px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ fontSize: "22px", fontWeight: 600, color: md3.onSurface }}>
            {navItems.find(i => i.id === activePage)?.label}
          </span>
          <div style={{
            background: md3.primaryContainer,
            color: md3.primary,
            borderRadius: "20px",
            padding: "6px 16px",
            fontSize: "13px",
            fontWeight: 500,
          }}>
            Olá, Will 👋
          </div>
        </header>

        {/* Page content */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px" }}>

          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <div>
              <p style={{ color: md3.onSurfaceVariant, marginBottom: "24px", fontSize: "14px" }}>
                Resumo do seu patrimônio e movimentações
              </p>

              {/* Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
                {[
                  { label: "Saldo Total", value: "R$ 0,00", sub: "todas as contas", color: md3.primary },
                  { label: "Gastos do Mês", value: "R$ 0,00", sub: "abril 2026", color: md3.error },
                  { label: "Investimentos", value: "R$ 0,00", sub: "BTG + Avenue", color: md3.tertiary },
                ].map((card) => (
                  <div key={card.label} style={{
                    background: md3.surfaceContainer,
                    borderRadius: "16px",
                    padding: "24px",
                    border: `1px solid ${md3.surfaceContainerHigh}`,
                  }}>
                    <div style={{ fontSize: "13px", color: md3.onSurfaceVariant, marginBottom: "8px", fontWeight: 500 }}>
                      {card.label}
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 700, color: card.color }}>
                      {card.value}
                    </div>
                    <div style={{ fontSize: "11px", color: md3.outline, marginTop: "6px" }}>
                      {card.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Placeholder gráfico */}
              <div style={{
                background: md3.surfaceContainer,
                borderRadius: "16px",
                padding: "24px",
                border: `1px solid ${md3.surfaceContainerHigh}`,
                minHeight: "200px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: "8px",
              }}>
                <span style={{ fontSize: "32px" }}>📊</span>
                <span style={{ color: md3.onSurfaceVariant, fontSize: "14px" }}>
                  Gráficos aparecerão aqui após importar dados
                </span>
              </div>
            </div>
          )}

          {/* TRANSAÇÕES */}
          {activePage === "transacoes" && (
            <div>
              <p style={{ color: md3.onSurfaceVariant, marginBottom: "24px", fontSize: "14px" }}>
                Todas as movimentações das suas contas
              </p>

              {loadingTransacoes ? (
                <div style={{ color: md3.onSurfaceVariant, fontSize: "14px" }}>Carregando...</div>
              ) : transacoes.length === 0 ? (
                <div style={{
                  background: md3.surfaceContainer,
                  borderRadius: "16px",
                  padding: "48px",
                  border: `1px solid ${md3.surfaceContainerHigh}`,
                  textAlign: "center",
                }}>
                  <span style={{ fontSize: "40px" }}>💳</span>
                  <p style={{ color: md3.onSurfaceVariant, marginTop: "16px" }}>
                    Nenhuma transação ainda. Importe seus extratos em Importar Dados.
                  </p>
                </div>
              ) : (
                <div style={{
                  background: md3.surfaceContainer,
                  borderRadius: "16px",
                  border: `1px solid ${md3.surfaceContainerHigh}`,
                  overflow: "hidden",
                }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: md3.surfaceContainerHigh }}>
                        {["Data", "Descrição", "Valor", "Tipo", "Categoria", "Banco", "Moeda"].map((col) => (
                          <th key={col} style={{
                            padding: "14px 16px",
                            textAlign: "left",
                            color: md3.onSurfaceVariant,
                            fontWeight: 600,
                            fontSize: "12px",
                            letterSpacing: "0.3px",
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transacoes.map((t, i) => (
                        <tr key={t.id} style={{
                          borderTop: `1px solid ${md3.surfaceContainerHigh}`,
                          background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                        }}>
                          <td style={{ padding: "12px 16px", color: md3.onSurfaceVariant }}>
                            {new Date(t.data).toLocaleDateString("pt-BR")}
                          </td>
                          <td style={{ padding: "12px 16px", color: md3.onSurface }}>{t.descricao}</td>
                          <td style={{
                            padding: "12px 16px",
                            color: t.tipo === "receita" ? "#a8d5a2" : md3.error,
                            fontWeight: 600,
                          }}>
                            {t.tipo === "receita" ? "+" : "-"}
                            {Number(t.valor).toLocaleString("pt-BR", { style: "currency", currency: t.moeda ?? "BRL" })}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              background: t.tipo === "receita" ? "rgba(168,213,162,0.15)" : "rgba(242,184,181,0.15)",
                              color: t.tipo === "receita" ? "#a8d5a2" : md3.error,
                              borderRadius: "12px",
                              padding: "3px 10px",
                              fontSize: "11px",
                              fontWeight: 500,
                            }}>{t.tipo}</span>
                          </td>
                          <td style={{ padding: "12px 16px", color: md3.onSurfaceVariant }}>{t.categoria}</td>
                          <td style={{ padding: "12px 16px", color: md3.onSurfaceVariant }}>{t.banco}</td>
                          <td style={{ padding: "12px 16px", color: md3.outline }}>{t.moeda}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* INVESTIMENTOS */}
          {activePage === "investimentos" && (
            <div>
              <p style={{ color: md3.onSurfaceVariant, marginBottom: "24px", fontSize: "14px" }}>
                Portfólio BTG Pactual + Avenue
              </p>
              <div style={{
                background: md3.surfaceContainer,
                borderRadius: "16px",
                padding: "48px",
                border: `1px solid ${md3.surfaceContainerHigh}`,
                textAlign: "center",
              }}>
                <span style={{ fontSize: "40px" }}>📈</span>
                <p style={{ color: md3.onSurfaceVariant, marginTop: "16px" }}>
                  Nenhum investimento ainda. Importe seus extratos em Importar Dados.
                </p>
              </div>
            </div>
          )}

          {/* IMPORTAR */}
          {activePage === "importar" && (
            <div>
              <p style={{ color: md3.onSurfaceVariant, marginBottom: "24px", fontSize: "14px" }}>
                Arraste PDFs, CSVs ou prints dos seus bancos
              </p>
              <div style={{
                background: md3.surfaceContainer,
                borderRadius: "16px",
                padding: "64px 48px",
                border: `2px dashed ${md3.outline}`,
                textAlign: "center",
              }}>
                <span style={{ fontSize: "48px" }}>📥</span>
                <p style={{ color: md3.onSurface, marginTop: "16px", fontSize: "16px", fontWeight: 500 }}>
                  Área de importação
                </p>
                <p style={{ color: md3.onSurfaceVariant, marginTop: "8px", fontSize: "13px" }}>
                  Em breve: Claude vai ler seus documentos automaticamente
                </p>
              </div>
            </div>
          )}

          {/* RELATÓRIOS */}
          {activePage === "relatorios" && (
            <div>
              <p style={{ color: md3.onSurfaceVariant, marginBottom: "24px", fontSize: "14px" }}>
                Análises e relatórios mensais
              </p>
              <div style={{
                background: md3.surfaceContainer,
                borderRadius: "16px",
                padding: "48px",
                border: `1px solid ${md3.surfaceContainerHigh}`,
                textAlign: "center",
              }}>
                <span style={{ fontSize: "40px" }}>📄</span>
                <p style={{ color: md3.onSurfaceVariant, marginTop: "16px" }}>
                  Relatórios automáticos disponíveis após importar dados.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}