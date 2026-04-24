/* Data, i18n, formatters for Finance Pro */

export type Lang = "pt" | "en";

export interface I18NDict {
  app_name: string;
  app_tagline: string;
  nav_overview: string;
  nav_dashboard: string;
  nav_insights: string;
  nav_accounts: string;
  nav_cards: string;
  nav_invest: string;
  nav_reports: string;
  nav_budget: string;
  nav_categories: string;
  nav_import: string;
  nav_tools: string;
  nav_projection: string;
  nav_recurring: string;
  nav_settings: string;
  search_placeholder: string;
  kpi_networth: string;
  kpi_cash: string;
  kpi_invest: string;
  kpi_debt: string;
  kpi_month_income: string;
  kpi_month_expense: string;
  kpi_savings_rate: string;
  kpi_runway: string;
  vs_last_month: string;
  this_month: string;
  last_12m: string;
  last_30d: string;
  ytd: string;
  section_insights: string;
  section_cashflow: string;
  section_accounts: string;
  section_cards: string;
  section_upcoming: string;
  section_recent: string;
  section_categories: string;
  section_portfolio: string;
  section_goals: string;
  section_budget: string;
  section_narrative: string;
  view_all: string;
  import_doc: string;
  new_transaction: string;
  dismiss: string;
  investigate: string;
  apply: string;
  snooze: string;
  categories: Record<string, string>;
  months: string[];
  narrative_title: string;
  goal_emergency: string;
  goal_trip: string;
  goal_macbook: string;
  goal_apt: string;
  layout_classic: string;
  layout_command: string;
  layout_narrative: string;
}

export const I18N: Record<Lang, I18NDict> = {
  pt: {
    app_name: "Finance Pro",
    app_tagline: "local-first · encrypted",
    nav_overview: "Geral",
    nav_dashboard: "Dashboard",
    nav_insights: "Insights & alertas",
    nav_accounts: "Contas & extratos",
    nav_cards: "Cartões de crédito",
    nav_invest: "Investimentos",
    nav_reports: "Relatórios",
    nav_budget: "Orçamento & metas",
    nav_categories: "Categorias",
    nav_import: "Importar documentos",
    nav_tools: "Ferramentas",
    nav_projection: "Projeção futura",
    nav_recurring: "Recorrentes & parcelas",
    nav_settings: "Ajustes",
    search_placeholder: "Buscar transações, ativos, documentos…",
    kpi_networth: "Patrimônio líquido",
    kpi_cash: "Caixa disponível",
    kpi_invest: "Investimentos",
    kpi_debt: "Dívidas & faturas",
    kpi_month_income: "Receitas do mês",
    kpi_month_expense: "Gastos do mês",
    kpi_savings_rate: "Taxa de poupança",
    kpi_runway: "Runway de caixa",
    vs_last_month: "vs mês anterior",
    this_month: "Este mês",
    last_12m: "12 meses",
    last_30d: "30 dias",
    ytd: "No ano",
    section_insights: "Insights proativos",
    section_cashflow: "Fluxo de caixa",
    section_accounts: "Suas contas",
    section_cards: "Cartões",
    section_upcoming: "Próximos vencimentos",
    section_recent: "Atividade recente",
    section_categories: "Por categoria",
    section_portfolio: "Portfólio",
    section_goals: "Metas ativas",
    section_budget: "Orçamento do mês",
    section_narrative: "Análise do mês",
    view_all: "Ver tudo",
    import_doc: "Importar documento",
    new_transaction: "Nova transação",
    dismiss: "Dispensar",
    investigate: "Investigar",
    apply: "Aplicar",
    snooze: "Adiar",
    categories: {
      food: "Alimentação", rest: "Restaurantes", transport: "Transporte",
      subs: "Assinaturas", housing: "Moradia", health: "Saúde",
      shopping: "Compras", leisure: "Lazer", education: "Educação",
      income: "Receitas", transfer: "Transferências", tax: "Impostos",
      invest: "Investimentos",
    },
    months: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
    narrative_title: "Seu mês em uma linha",
    goal_emergency: "Reserva de emergência",
    goal_trip: "Viagem Japão 2026",
    goal_macbook: "MacBook Pro M5",
    goal_apt: "Entrada apartamento",
    layout_classic: "Cards & Charts",
    layout_command: "Comando / Denso",
    layout_narrative: "Narrativa",
  },
  en: {
    app_name: "Finance Pro",
    app_tagline: "local-first · encrypted",
    nav_overview: "Overview",
    nav_dashboard: "Dashboard",
    nav_insights: "Insights & alerts",
    nav_accounts: "Accounts & statements",
    nav_cards: "Credit cards",
    nav_invest: "Investments",
    nav_reports: "Reports",
    nav_budget: "Budget & goals",
    nav_categories: "Categories",
    nav_import: "Import documents",
    nav_tools: "Tools",
    nav_projection: "Future projection",
    nav_recurring: "Recurring & installments",
    nav_settings: "Settings",
    search_placeholder: "Search transactions, assets, documents…",
    kpi_networth: "Net worth",
    kpi_cash: "Cash available",
    kpi_invest: "Investments",
    kpi_debt: "Debt & bills",
    kpi_month_income: "Income this month",
    kpi_month_expense: "Spend this month",
    kpi_savings_rate: "Savings rate",
    kpi_runway: "Cash runway",
    vs_last_month: "vs last month",
    this_month: "This month",
    last_12m: "12 months",
    last_30d: "30 days",
    ytd: "YTD",
    section_insights: "Proactive insights",
    section_cashflow: "Cash flow",
    section_accounts: "Your accounts",
    section_cards: "Cards",
    section_upcoming: "Upcoming bills",
    section_recent: "Recent activity",
    section_categories: "By category",
    section_portfolio: "Portfolio",
    section_goals: "Active goals",
    section_budget: "Monthly budget",
    section_narrative: "This month's analysis",
    view_all: "See all",
    import_doc: "Import document",
    new_transaction: "New transaction",
    dismiss: "Dismiss",
    investigate: "Investigate",
    apply: "Apply",
    snooze: "Snooze",
    categories: {
      food: "Groceries", rest: "Restaurants", transport: "Transport",
      subs: "Subscriptions", housing: "Housing", health: "Health",
      shopping: "Shopping", leisure: "Leisure", education: "Education",
      income: "Income", transfer: "Transfers", tax: "Taxes",
      invest: "Investments",
    },
    months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    narrative_title: "Your month in one line",
    goal_emergency: "Emergency fund",
    goal_trip: "Japan trip 2026",
    goal_macbook: "MacBook Pro M5",
    goal_apt: "Apartment down-payment",
    layout_classic: "Cards & Charts",
    layout_command: "Command / Dense",
    layout_narrative: "Narrative",
  },
};

/* Formatters */
export function fmtBRL(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1e6) return `R$ ${(n / 1e6).toFixed(2)}M`;
    return `R$ ${(n / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(n);
}
export function fmtUSD(n: number, compact = false): string {
  if (compact && Math.abs(n) >= 1000) {
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    return `$${(n / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}
export function fmtMoney(n: number, lang: Lang, compact = false): string {
  return lang === "pt" ? fmtBRL(n, compact) : fmtUSD(n, compact);
}
export function fmtPct(n: number, signed = false): string {
  return (signed && n > 0 ? "+" : "") + n.toFixed(1) + "%";
}
export function fmtDate(d: string | Date, lang: Lang = "pt"): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (lang === "pt") return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

/* Category palette */
export const CAT_COLORS: Record<string, string> = {
  food: "oklch(0.7 0.13 80)",
  rest: "oklch(0.65 0.17 30)",
  transport: "oklch(0.6 0.13 240)",
  subs: "oklch(0.6 0.15 300)",
  housing: "oklch(0.55 0.1 200)",
  health: "oklch(0.7 0.13 155)",
  shopping: "oklch(0.65 0.15 340)",
  leisure: "oklch(0.68 0.15 60)",
  education: "oklch(0.6 0.13 270)",
  income: "oklch(0.55 0.14 155)",
  transfer: "oklch(0.6 0.02 260)",
  tax: "oklch(0.5 0.14 15)",
  invest: "oklch(0.55 0.14 220)",
};

/* FX rates */
export const FX = { USD: 5.12, EUR: 5.54, GBP: 6.48 };

/* Data types */
export interface CashflowMonth { m: number; income: number; expense: number; }
export interface Account {
  id: string; name: string; type: string; number: string; color: string; flag?: string; sub?: string;
  balance?: number;
  currency?: string;
  balances?: Record<string, number>;
  balanceBRL?: number;
}
export function acctBRL(a: Account): number {
  if (a.balanceBRL !== undefined) return a.balanceBRL;
  return a.balance ?? 0;
}
export interface Card { id: string; brand: string; last4: string; limit: number; used: number; close: number; due: number; variant: string; color: string; }
export interface Txn { id?: string; d: string; merch: string; cat: string; acct: string; amt: number; sub?: string; recurring?: boolean; exclude?: boolean; reimbursable?: boolean; reimburseReceived?: boolean; reimbAmt?: number; notes?: string; installment?: string | null; kind?: 'card' | 'account'; }
export function newId(): string { return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
export interface Insight { kind: "warn" | "danger" | "pos" | "info"; t: string; x: string; tag: string; when: string; }
export interface CatMonth { k: string; cur: number; prev: number; budget: number; }
export interface PortfolioItem { t: string; q: number; pm: number; last: number; dy: number | null; }
export interface Goal { key: string; target: number; current: number; when: string; }
export interface Upcoming { d: string; merch: string; cat: string; amt: number; warn?: boolean; }
export interface RecurringItem { name: string; cat: string; sub: string; amt: number; day: number; acct: string; next: string; kind: string; until?: string; }
export interface AppNotification { id: string; message: string; kind: 'success' | 'warn' | 'danger' | 'info'; timestamp: string; read: boolean; }
export type CardMeta = Record<string, { dueDay?: number }>;
export interface InstallmentItem { name: string; cat: string; sub: string; amt: number; start: string; total: number; current: number; acct: string; }

/* ===== Mock data ===== */

export const CASHFLOW_12M: CashflowMonth[] = [
  { m: 0, income: 18500, expense: 12400 },
  { m: 1, income: 18500, expense: 14100 },
  { m: 2, income: 19200, expense: 13800 },
  { m: 3, income: 18500, expense: 12900 },
  { m: 4, income: 21800, expense: 15200 },
  { m: 5, income: 18500, expense: 13400 },
  { m: 6, income: 18500, expense: 16100 },
  { m: 7, income: 19200, expense: 14200 },
  { m: 8, income: 18500, expense: 13100 },
  { m: 9, income: 18500, expense: 15800 },
  { m: 10, income: 20500, expense: 14400 },
  { m: 11, income: 18500, expense: 17240 },
];

export const ACCOUNTS: Account[] = [
  { id: "a1", name: "Nubank", type: "checking", balance: 14820.55, number: "*3391", color: "oklch(0.42 0.18 295)", currency: "BRL", flag: "🇧🇷", sub: "Conta corrente" },
  { id: "a2", name: "C6 Bank", type: "checking", balance: 8440.20, number: "*7712", color: "oklch(0.22 0.02 260)", currency: "BRL", flag: "🇧🇷", sub: "Conta corrente" },
  { id: "a3", name: "BTG Pactual", type: "broker", balance: 284510.42, number: "*0042", color: "oklch(0.28 0.03 230)", currency: "BRL", flag: "🇧🇷", sub: "Investimentos" },
  { id: "a4", name: "Wise", type: "multi", number: "*8821", color: "oklch(0.62 0.16 155)", currency: "multi", flag: "🌍", sub: "Multi-moeda",
    balances: { BRL: 1240.00, USD: 820.45, EUR: 340.10, GBP: 180.20 },
    balanceBRL: 1240 + 820.45 * 5.12 + 340.10 * 5.54 + 180.20 * 6.48 },
  { id: "a5", name: "Revolut", type: "multi", number: "*4490", color: "oklch(0.38 0.14 270)", currency: "multi", flag: "🌍", sub: "Multi-moeda",
    balances: { BRL: 0, USD: 1245.80, EUR: 892.40, GBP: 0 },
    balanceBRL: 1245.80 * 5.12 + 892.40 * 5.54 },
  { id: "a6", name: "Swile", type: "voucher", balance: 1842.00, number: "*2210", color: "oklch(0.6 0.18 25)", currency: "BRL", flag: "🇧🇷", sub: "Vale refeição/alimentação" },
  { id: "a7", name: "Avenue", type: "broker", number: "*9910", color: "oklch(0.35 0.12 230)", currency: "USD", flag: "🇺🇸", sub: "US stocks & ETFs",
    balances: { USD: 12480.30 }, balanceBRL: 12480.30 * 5.12 },
];

export const CARDS: Card[] = [
  { id: "c1", brand: "Nubank Ultravioleta", last4: "3391", limit: 35000, used: 8420.55, close: 22, due: 1, variant: "alt1", color: "oklch(0.38 0.16 292)" },
  { id: "c2", brand: "C6 Carbon Black", last4: "7712", limit: 42000, used: 11203.87, close: 15, due: 22, variant: "", color: "oklch(0.18 0.02 260)" },
  { id: "c3", brand: "Wise · Mastercard", last4: "8821", limit: 0, used: 1840.30, close: 0, due: 0, variant: "alt2", color: "oklch(0.58 0.16 155)" },
  { id: "c4", brand: "Revolut · Virtual", last4: "4490", limit: 0, used: 2100.00, close: 0, due: 0, variant: "alt1", color: "oklch(0.34 0.14 270)" },
  { id: "c5", brand: "Swile · Refeição", last4: "2210", limit: 0, used: 580.00, close: 0, due: 0, variant: "alt3", color: "oklch(0.58 0.18 25)" },
];

export interface AvenuePosition { t: string; q: number; pm: number; last: number; currency: string; }
export const AVENUE_PORTFOLIO: AvenuePosition[] = [
  { t: "AAPL", q: 8, pm: 168.40, last: 174.20, currency: "USD" },
  { t: "MSFT", q: 5, pm: 385.20, last: 412.80, currency: "USD" },
  { t: "VOO",  q: 12, pm: 472.10, last: 505.30, currency: "USD" },
  { t: "QQQ",  q: 6, pm: 430.50, last: 448.90, currency: "USD" },
  { t: "NVDA", q: 3, pm: 820.00, last: 876.40, currency: "USD" },
];

export const TXNS: Txn[] = [
  { d: "2026-04-16", merch: "iFood · Sushi House", cat: "rest", acct: "Nubank UV", amt: -142.80 },
  { d: "2026-04-16", merch: "Uber · Corrida", cat: "transport", acct: "Nubank UV", amt: -38.50 },
  { d: "2026-04-15", merch: "Salário · Acme Corp", cat: "income", acct: "Itaú CC", amt: 18500.00 },
  { d: "2026-04-15", merch: "Netflix Premium", cat: "subs", acct: "C6 Black", amt: -55.90 },
  { d: "2026-04-14", merch: "Aluguel · Apto 402", cat: "housing", acct: "Nubank PJ", amt: -4200.00 },
  { d: "2026-04-14", merch: "Pão de Açúcar", cat: "food", acct: "Itaú Click", amt: -312.45 },
  { d: "2026-04-13", merch: "Amazon · Monitor LG", cat: "shopping", acct: "C6 Black", amt: -2890.00 },
  { d: "2026-04-13", merch: "Spotify Family", cat: "subs", acct: "C6 Black", amt: -34.90 },
  { d: "2026-04-12", merch: "Farmácia São João", cat: "health", acct: "Inter Black", amt: -184.20 },
  { d: "2026-04-12", merch: "Dividendo · ITSA4", cat: "income", acct: "XP Invest", amt: 427.80 },
  { d: "2026-04-11", merch: "Starbucks", cat: "rest", acct: "Nubank UV", amt: -28.50 },
  { d: "2026-04-10", merch: "Shell · Combustível", cat: "transport", acct: "Itaú Click", amt: -245.00 },
  { d: "2026-04-10", merch: "Cinemark", cat: "leisure", acct: "Nubank UV", amt: -72.00 },
  { d: "2026-04-09", merch: "Coursera · Curso ML", cat: "education", acct: "C6 Black", amt: -189.00 },
];

export const INSIGHTS: Record<Lang, Insight[]> = {
  pt: [
    { kind: "warn", t: "Gasto em restaurantes 34% acima", x: "Você já gastou R$ 1.842 em restaurantes este mês — 34% acima da média dos últimos 6 meses. No ritmo atual, fechará em R$ 2.450.", tag: "Trend · Restaurantes", when: "há 2h" },
    { kind: "danger", t: "Fatura do Itaú Click estourará o limite", x: "Sua fatura atual está em 74.7% do limite. Há 8 dias ainda até o fechamento (15/04). Considere adiantar um pagamento de R$ 2.500.", tag: "Alerta · Cartão", when: "há 3h" },
    { kind: "pos", t: "CDB do BTG rendeu acima do CDI", x: "Seu CDB BTG 2027 rendeu 102.4% do CDI nos últimos 3 meses — acima da meta de 100%. Posição atual: R$ 45.210.", tag: "Análise · Renda fixa", when: "há 6h" },
    { kind: "info", t: "Assinatura duplicada detectada", x: "Detectei cobranças mensais de Netflix em 2 cartões diferentes (Nubank UV e C6). Possível duplicidade: R$ 55,90/mês.", tag: "Economia sugerida", when: "ontem" },
    { kind: "warn", t: "Concentração em ITSA4 alta", x: "ITSA4 representa 28% da sua carteira de ações. Recomendação: manter abaixo de 15% para reduzir risco idiossincrático.", tag: "Rebalanceamento", when: "ontem" },
    { kind: "pos", t: "Meta de poupança ultrapassada", x: "Você poupou 38% da renda em março — meta era 30%. Parabéns! Mantido esse ritmo, atinge reserva de 6 meses em ago/2026.", tag: "Metas", when: "2 dias" },
    { kind: "info", t: "IR 2026 · documentos faltando", x: "3 notas de negociação de jan/2026 não foram importadas. Posso buscar automaticamente no e-mail conectado.", tag: "Imposto de renda", when: "2 dias" },
    { kind: "warn", t: "Preço médio de PETR4 cruzou stop-loss", x: "PETR4 caiu 8.3% desde sua última compra. Stop mental estava em R$ 32,40. Avaliar posição.", tag: "Renda variável", when: "3 dias" },
  ],
  en: [
    { kind: "warn", t: "Restaurant spend 34% above average", x: "You've spent $1,842 on restaurants this month — 34% above your 6-month average. At this pace you'll close at $2,450.", tag: "Trend · Restaurants", when: "2h ago" },
    { kind: "danger", t: "Itaú Click bill will blow past limit", x: "Current bill at 74.7% of limit with 8 days until close (Apr 15). Consider advancing a $2,500 payment.", tag: "Alert · Card", when: "3h ago" },
    { kind: "pos", t: "BTG CDB beat CDI benchmark", x: "Your BTG 2027 CDB returned 102.4% of CDI over the last 3 months — above the 100% target. Current position: $45,210.", tag: "Fixed income", when: "6h ago" },
    { kind: "info", t: "Duplicate subscription detected", x: "I found monthly Netflix charges on 2 different cards (Nubank UV and C6). Possible duplicate: $55.90/mo.", tag: "Savings suggestion", when: "yesterday" },
    { kind: "warn", t: "ITSA4 concentration too high", x: "ITSA4 is 28% of your equity portfolio. Recommend below 15% to reduce idiosyncratic risk.", tag: "Rebalancing", when: "yesterday" },
    { kind: "pos", t: "Savings goal exceeded", x: "You saved 38% of income in March — goal was 30%. At this pace, you hit 6-month reserve by Aug 2026.", tag: "Goals", when: "2d" },
    { kind: "info", t: "Tax 2026 · missing documents", x: "3 brokerage notes from Jan 2026 were not imported. I can fetch automatically from connected email.", tag: "Tax", when: "2d" },
    { kind: "warn", t: "PETR4 crossed your stop-loss", x: "PETR4 down 8.3% since last buy. Your mental stop was at $32.40. Review position.", tag: "Equities", when: "3d" },
  ],
};

export const CAT_MONTH: CatMonth[] = [
  { k: "housing", cur: 4200, prev: 4200, budget: 4500 },
  { k: "food", cur: 1420, prev: 1180, budget: 1500 },
  { k: "rest", cur: 1842, prev: 1372, budget: 1400 },
  { k: "transport", cur: 820, prev: 940, budget: 1000 },
  { k: "subs", cur: 348, prev: 309, budget: 400 },
  { k: "shopping", cur: 3120, prev: 1450, budget: 2000 },
  { k: "health", cur: 484, prev: 220, budget: 600 },
  { k: "leisure", cur: 672, prev: 540, budget: 800 },
  { k: "education", cur: 189, prev: 189, budget: 400 },
];

export const PORTFOLIO: PortfolioItem[] = [
  { t: "ITSA4", q: 1400, pm: 9.82, last: 11.45, dy: 7.8 },
  { t: "PETR4", q: 300, pm: 34.20, last: 31.35, dy: 12.1 },
  { t: "BBAS3", q: 180, pm: 48.10, last: 54.92, dy: 9.4 },
  { t: "VALE3", q: 200, pm: 62.40, last: 58.80, dy: 11.2 },
  { t: "BOVA11", q: 150, pm: 118.40, last: 132.55, dy: 6.1 },
  { t: "IVVB11", q: 220, pm: 285.50, last: 318.40, dy: 1.4 },
  { t: "CDB BTG 27", q: 1, pm: 42000, last: 45210, dy: null },
  { t: "Tesouro IPCA 29", q: 1, pm: 18500, last: 20480, dy: null },
];

export const GOALS: Goal[] = [
  { key: "emergency", target: 108000, current: 72400, when: "2026-08" },
  { key: "trip", target: 22000, current: 8400, when: "2026-11" },
  { key: "macbook", target: 18500, current: 14200, when: "2026-06" },
  { key: "apt", target: 180000, current: 54200, when: "2028-02" },
];

export const UPCOMING: Upcoming[] = [
  { d: "2026-04-22", merch: "Fatura Itaú Click", cat: "rest", amt: -11203.87, warn: true },
  { d: "2026-04-25", merch: "Aluguel apto", cat: "housing", amt: -4200.00 },
  { d: "2026-05-01", merch: "Fatura Nubank UV", cat: "shopping", amt: -7842.30 },
  { d: "2026-05-05", merch: "Condomínio", cat: "housing", amt: -680.00 },
  { d: "2026-05-07", merch: "Fatura C6 Black", cat: "subs", amt: -3120.55 },
  { d: "2026-05-10", merch: "Fatura Inter Black", cat: "shopping", amt: -6845.00 },
];

export const DAILY_30D = [
  220,140,95,0,310,185,420,90,205,60,0,150,890,310,185,250,125,0,420,380,
  210,150,95,280,510,184,0,325,245,542,
];

export const NARRATIVE: Record<Lang, string> = {
  pt: `Abril está sendo um mês **acima da média** em gastos: R$ 17.240 até agora, vs R$ 14.100 no mesmo período do mês passado (+22.3%).

O que puxou pra cima:
• **Restaurantes** +34% vs média de 6m — jantares de quinta-feira viraram hábito
• **Shopping** com compra única de R$ 2.890 (monitor LG) — não recorrente
• **Assinaturas** estáveis, mas detectei cobrança duplicada de Netflix

O que está indo bem:
• **Receita de dividendos** 18% acima do trimestre anterior (ITSA4, BBAS3 pagaram mais)
• **Taxa de poupança** do mês mesmo assim fechará em 27% — dentro da meta
• **CDB BTG** rendeu 102.4% do CDI nos últimos 90 dias

Recomendações automáticas:
1. Adiantar R$ 2.500 da fatura Itaú (estourará limite dia 22)
2. Cancelar Netflix duplicado (economia R$ 671/ano)
3. Rebalancear ITSA4 (28% da carteira) para abaixo de 15%`,
  en: `April is running **above average** on spending: $17,240 so far vs $14,100 at the same point last month (+22.3%).

What drove it up:
• **Restaurants** +34% vs 6-month average — Thursday dinners became a habit
• **Shopping** with one-off $2,890 purchase (LG monitor) — non-recurring
• **Subscriptions** stable, but I detected a duplicate Netflix charge

What's going well:
• **Dividend income** 18% above last quarter (ITSA4, BBAS3 paid more)
• **Savings rate** will still close at 27% — within goal
• **BTG CDB** returned 102.4% of CDI over last 90 days

Auto-recommendations:
1. Advance $2,500 on Itaú bill (will exceed limit on the 22nd)
2. Cancel duplicate Netflix ($671/year saved)
3. Rebalance ITSA4 (28% of portfolio) below 15%`,
};

export const SUBCATS: Record<string, string[]> = {
  food: ["Supermercado", "Feira", "Padaria", "Conveniência", "Delivery mercado"],
  rest: ["Almoço", "Jantar", "Café", "Bar", "Fast food", "Delivery"],
  transport: ["Uber/99", "Combustível", "Estacionamento", "Pedágio", "Transporte público", "Manutenção"],
  subs: ["Streaming", "Software", "Cloud", "Jornal/revista", "Academia"],
  housing: ["Aluguel", "Condomínio", "Energia", "Água", "Internet", "IPTU", "Manutenção"],
  health: ["Farmácia", "Consulta", "Exame", "Plano de saúde", "Terapia", "Academia"],
  shopping: ["Eletrônicos", "Roupas", "Casa", "Livros", "Presentes"],
  leisure: ["Viagem", "Cinema/show", "Restaurante especial", "Hobby", "Streaming+"],
  education: ["Curso", "Livros", "Certificação", "Escola"],
  income: ["Salário", "Freela", "Dividendos", "Juros", "Reembolso", "Venda"],
  transfer: ["Entre contas", "Pix enviado", "Pix recebido"],
  tax: ["IR", "IOF", "DARF", "IPTU", "IPVA"],
  invest: ["Aporte", "Resgate", "Corretagem"],
};

export interface LearnedRule { pattern: string; cat: string; sub: string | null; confidence: number; seen: number; }
export const LEARNED_RULES: LearnedRule[] = [
  { pattern: "iFood*", cat: "rest", sub: "Delivery", confidence: 0.98, seen: 42 },
  { pattern: "UBER*", cat: "transport", sub: "Uber/99", confidence: 0.99, seen: 67 },
  { pattern: "PAO DE ACUCAR", cat: "food", sub: "Supermercado", confidence: 0.97, seen: 18 },
  { pattern: "NETFLIX.COM", cat: "subs", sub: "Streaming", confidence: 1.0, seen: 12 },
  { pattern: "SHELL*", cat: "transport", sub: "Combustível", confidence: 0.95, seen: 9 },
  { pattern: "AMAZON.COM.BR", cat: "shopping", sub: null, confidence: 0.72, seen: 24 },
  { pattern: "AMZ*KINDLE", cat: "education", sub: "Livros", confidence: 0.88, seen: 6 },
  { pattern: "APPLE.COM/BILL", cat: "subs", sub: "Cloud", confidence: 0.91, seen: 11 },
];

export const RECURRING: RecurringItem[] = [
  { name: "Aluguel · Apto 402", cat: "housing", sub: "Aluguel", amt: -4200, day: 5, acct: "Nubank PJ", next: "2026-05-05", kind: "monthly" },
  { name: "Condomínio", cat: "housing", sub: "Condomínio", amt: -680, day: 10, acct: "Nubank PJ", next: "2026-05-10", kind: "monthly" },
  { name: "Energia Enel", cat: "housing", sub: "Energia", amt: -280, day: 12, acct: "Itaú CC", next: "2026-05-12", kind: "monthly" },
  { name: "Internet Vivo Fibra", cat: "housing", sub: "Internet", amt: -149.9, day: 15, acct: "Itaú CC", next: "2026-05-15", kind: "monthly" },
  { name: "Netflix Premium", cat: "subs", sub: "Streaming", amt: -55.9, day: 15, acct: "C6 Black", next: "2026-05-15", kind: "monthly" },
  { name: "Spotify Family", cat: "subs", sub: "Streaming", amt: -34.9, day: 15, acct: "C6 Black", next: "2026-05-15", kind: "monthly" },
  { name: "iCloud 2TB", cat: "subs", sub: "Cloud", amt: -49.9, day: 20, acct: "C6 Black", next: "2026-05-20", kind: "monthly" },
  { name: "Academia Smart", cat: "health", sub: "Academia", amt: -129.9, day: 5, acct: "Inter Black", next: "2026-05-05", kind: "monthly" },
  { name: "Salário · Acme Corp", cat: "income", sub: "Salário", amt: 18500, day: 15, acct: "Itaú CC", next: "2026-05-15", kind: "monthly" },
  { name: "IPTU · parcela", cat: "tax", sub: "IPTU", amt: -340, day: 25, acct: "Nubank PJ", next: "2026-05-25", kind: "monthly", until: "2026-11" },
];

export const INSTALLMENTS: InstallmentItem[] = [
  { name: "Decolar · Passagem Japão", cat: "leisure", sub: "Viagem", amt: -1840, start: "2026-04", total: 6, current: 1, acct: "Itaú Click" },
  { name: "Apple iPad Pro", cat: "shopping", sub: "Eletrônicos", amt: -499, start: "2026-01", total: 12, current: 4, acct: "Itaú Click" },
  { name: "Curso Machine Learning", cat: "education", sub: "Curso", amt: -389, start: "2026-03", total: 8, current: 2, acct: "C6 Black" },
  { name: "Dentista · Invisalign", cat: "health", sub: "Consulta", amt: -780, start: "2026-02", total: 10, current: 3, acct: "Inter Black" },
  { name: "Sofá novo", cat: "shopping", sub: "Casa", amt: -620, start: "2026-04", total: 5, current: 1, acct: "Itaú Click" },
];

export interface ProjectionMonth {
  ym: string;
  label: string;
  items: Array<RecurringItem & { d: string; _kind: string }>;
  income: number;
  expense: number;
  net: number;
}

export function buildProjection(monthsAhead = 6): ProjectionMonth[] {
  const now = new Date("2026-04-17");
  const months: ProjectionMonth[] = [];
  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: any[] = [];
    let income = 0, expense = 0;

    RECURRING.forEach((r) => {
      if (r.until && ym > r.until) return;
      items.push({ ...r, d: `${ym}-${String(r.day).padStart(2, "0")}`, _kind: "recurring" });
      if (r.amt > 0) income += r.amt; else expense += Math.abs(r.amt);
    });

    INSTALLMENTS.forEach((ins) => {
      const startM = new Date(ins.start + "-01");
      const offset = (d.getFullYear() - startM.getFullYear()) * 12 + (d.getMonth() - startM.getMonth());
      if (offset >= 0 && offset < ins.total) {
        items.push({
          name: `${ins.name} · ${offset + 1}/${ins.total}`,
          cat: ins.cat, sub: ins.sub, amt: ins.amt, acct: ins.acct,
          d: `${ym}-15`, _kind: "installment",
        });
        expense += Math.abs(ins.amt);
      }
    });

    const variable = 5800 + ((i * 397 + 113) % 800);
    expense += variable;
    items.push({ name: "Gastos variáveis (estimado)", cat: "food", amt: -variable, d: `${ym}-28`, _kind: "estimated" });

    months.push({ ym, label: monthLabel, items, income, expense, net: income - expense });
  }
  return months;
}

export interface PeriodPreset { id: string; label: string; months: number[]; }
export const PERIOD_PRESETS: Record<Lang, PeriodPreset[]> = {
  pt: [
    { id: "jan", label: "Jan 26", months: [0] }, { id: "feb", label: "Fev 26", months: [1] },
    { id: "mar", label: "Mar 26", months: [2] }, { id: "apr", label: "Abr 26", months: [3] },
    { id: "q1", label: "Q1 26", months: [0,1,2] }, { id: "h1", label: "1S 26", months: [0,1,2,3,4,5] },
    { id: "ytd", label: "YTD 26", months: [0,1,2,3] }, { id: "12m", label: "12 meses", months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  ],
  en: [
    { id: "jan", label: "Jan 26", months: [0] }, { id: "feb", label: "Feb 26", months: [1] },
    { id: "mar", label: "Mar 26", months: [2] }, { id: "apr", label: "Apr 26", months: [3] },
    { id: "q1", label: "Q1 26", months: [0,1,2] }, { id: "h1", label: "1H 26", months: [0,1,2,3,4,5] },
    { id: "ytd", label: "YTD 26", months: [0,1,2,3] }, { id: "12m", label: "12 months", months: [0,1,2,3,4,5,6,7,8,9,10,11] },
  ],
};

export interface PeriodData { label: string; income: number; expense: number; net: number; bycat: Record<string, number>; }
export function buildPeriodData(presets: PeriodPreset[]): PeriodData[] {
  return presets.map(p => {
    const ms = p.months.map(m => CASHFLOW_12M[m] || CASHFLOW_12M[m % 12]);
    const income = ms.reduce((s, x) => s + x.income, 0);
    const expense = ms.reduce((s, x) => s + x.expense, 0);
    const bycat: Record<string, number> = {};
    CAT_MONTH.forEach(c => { bycat[c.k] = c.cur * p.months.length; });
    return { label: p.label, income, expense, net: income - expense, bycat };
  });
}
