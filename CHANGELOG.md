# Changelog — Finance Pro

All notable changes to this project are documented here.  
Format: `## [version] — YYYY-MM-DD` → categorias → itens.

---

## [0.2.0] — 2026-04-24

### Corrigido
- **Duplicação ao editar transação** — transações carregadas do `localStorage` sem campo `id` recebiam um novo `id` ao salvar, gerando duplicata. Corrigido: ao carregar, qualquer transação sem `id` recebe um `newId()` imediatamente.
- **Estado de edição não persistia** — `handleSaveTxn` não encontrava a transação pelo `id` e criava uma nova ao invés de atualizar.

### Adicionado
- **Indicador de autosave** — badge "✓ Salvo / Saved" aparece brevemente na topbar após cada salvamento automático no `localStorage`, via evento `fp:autosave`.
- **Versão no sidebar** — badge `v0.2.0` exibido ao lado do nome do app na barra lateral.
- **CHANGELOG.md** — este arquivo, para rastrear mudanças por versão.

### Removido / Substituído (dados mock → empty states)
- **CardsPage** — empty state quando sem dados; com dados mostra transações reais.
- **InvestPage** — substituída por empty state (dados de portfólio não deriváveis de extratos bancários).
- **AccountsPage** — contas agora derivadas de `txns` reais (agrupadas por `acct`); fallback mock `TXNS` / `ACCOUNTS` removido.
- **BudgetPage** — seção de metas (`GOALS` mock) removida; substituída por empty state.
- **CategoriesPage** — tabela "Regras aprendidas" (`LEARNED_RULES` mock) removida; `Math.random()` removido; `CAT_MONTH` mock removido; exibe gastos reais do mês ou "sem dados".
- **ComparisonPage** — empty state quando sem dados; usa `buildRealPeriodData` com txns reais; gráfico de fluxo usa `computeStats(txns).cashflow`.
- **RecurringPage** — always shows empty state (mock `RECURRING` / `INSTALLMENTS` removidos).
- Constante local `CARD_TXNS` removida.
- Imports não utilizados removidos: `ACCOUNTS`, `TXNS`, `CARDS`, `INSIGHTS`, `PORTFOLIO`, `LEARNED_RULES`, `CAT_MONTH`, `CASHFLOW_12M`, `GOALS`, `AVENUE_PORTFOLIO`, `FX`, `acctBRL`, `buildPeriodData`, `AllocBar`, `FXBar`, `RECURRING`, `INSTALLMENTS`.

---

## [0.1.0] — 2026-04-23

### Adicionado
- Layout base com sidebar, topbar e sistema de rotas por estado.
- Dashboard com layouts `classic` / `command` / `narrative`.
- Páginas: Accounts, Cards, Invest, Import, Insights, Reports, Budget, Categories, Comparison, Projection, Recurring, Settings.
- Sistema de vault com File System Access API + fallback download.
- Modal system com 9 tipos: `newtxn`, `cmdpalette`, `filter`, `export`, `goal`, `category`, `addcard`, `newtrade`, `budgetedit`.
- CommandPalette (⌘K) acessível via atalho de teclado e barra de busca.
- EditDrawer para edição de transações.
- VaultPage com wizard multi-step.
- Persistência via `localStorage` (`fp_txns`, `fp_state`, `fp_route`).
- Importação de CSV no formato C6 Bank.
- `computeStats(txns)` — helper que deriva receita, despesa, cashflow e resumo por categoria de dados reais.
- Modo privacidade (mascara valores).
- Suporte PT / EN.
- Paletas de cores: graphite, forest, indigo, terracotta.
- Densidades: high, medium, low.
