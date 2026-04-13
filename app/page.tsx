"use client";

import { useState } from "react";

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">Finance Pro</h1>
          <p className="text-xs text-gray-400 mt-1">Gestão financeira pessoal</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: "dashboard", label: "Dashboard", emoji: "📊" },
            { id: "transacoes", label: "Transações", emoji: "💳" },
            { id: "investimentos", label: "Investimentos", emoji: "📈" },
            { id: "importar", label: "Importar Dados", emoji: "📥" },
            { id: "relatorios", label: "Relatórios", emoji: "📄" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                activePage === item.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {item.emoji} {item.label}
            </button>
          ))}
        </nav>

        {/* Footer da sidebar */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-xs text-gray-500">v1.0 — em construção</p>
        </div>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 overflow-auto">
        
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">{activePage}</h2>
          <span className="text-sm text-gray-400">Bem-vindo, Will</span>
        </header>

        {/* Conteúdo */}
        <div className="p-8">

          {activePage === "dashboard" && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Visão Geral</h3>
              <div className="grid grid-cols-3 gap-6">
                {[
                  { label: "Saldo Total", value: "R$ 0,00", color: "blue" },
                  { label: "Gastos do Mês", value: "R$ 0,00", color: "red" },
                  { label: "Investimentos", value: "R$ 0,00", color: "green" },
                ].map((card) => (
                  <div key={card.label} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <p className="text-3xl font-bold mt-2">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activePage === "transacoes" && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Transações</h3>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <p className="text-gray-400">Nenhuma transação ainda. Importe seus extratos.</p>
              </div>
            </div>
          )}

          {activePage === "investimentos" && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Investimentos</h3>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <p className="text-gray-400">Nenhum investimento ainda. Importe seus extratos.</p>
              </div>
            </div>
          )}

          {activePage === "importar" && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Importar Dados</h3>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
                <p className="text-4xl mb-4">📥</p>
                <p className="text-gray-400">Em breve: arraste PDFs, CSVs e prints aqui.</p>
              </div>
            </div>
          )}

          {activePage === "relatorios" && (
            <div>
              <h3 className="text-2xl font-bold mb-6">Relatórios</h3>
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <p className="text-gray-400">Em breve: relatórios mensais automáticos.</p>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}