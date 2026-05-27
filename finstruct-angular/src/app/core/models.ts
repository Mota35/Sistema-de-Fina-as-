// ─── API Responses ──────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  code: number;
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginRequest  { email: string; password: string; }
export interface RegisterRequest {
  name: string; email: string;
  password: string; password_confirmation: string;
  language?: string; currency?: string;
}
export interface AuthResponse {
  access_token: string; refresh_token: string;
  token_type: string; expires_in: number;
  user: User;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: number; id_conta: string; name: string; email: string;
  role_name: string; language: string;
  theme: 'light' | 'dark'; currency: string;
  status: string; avatar: string | null;
  created_at: string; role_id?: number;
}

// ─── Account ────────────────────────────────────────────────────────────────
export type AccountType = 'wallet'|'bank'|'savings'|'credit_card'|'investment';
export interface Account {
  id: number; user_id: number; name: string;
  type: AccountType; balance: number; created_at: string;
  is_default_receiving?: boolean;
}
export interface AccountSummary {
  total_balance: number;
  balance_by_type: { type: string; total: number }[];
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: number; user_id: number | null;
  name: string; type: 'income'|'expense';
  color: string; icon: string | null;
}

// ─── Transaction ─────────────────────────────────────────────────────────────
export interface Transaction {
  id: number; user_id: number;
  account_id: number; category_id: number;
  type: 'income'|'expense'; amount: number;
  description: string | null; transaction_date: string;
  recurring: boolean; created_at: string;
  account_name?: string; category_name?: string;
  category_color?: string; category_icon?: string;
}
export interface TransactionFilters {
  account_id?: number; category_id?: number;
  type?: string; date_from?: string;
  date_to?: string; search?: string;
  page?: number; per_page?: number;
}
export interface TransactionSummary {
  year: number; month: number;
  income: number; expense: number; balance: number;
}
export interface CategorySummary {
  id: number; name: string; color: string; icon: string;
  total: number; count: number;
}
export interface MonthlyEvolution {
  month: string; income: number; expense: number; balance: number;
}

// ─── Goal ────────────────────────────────────────────────────────────────────
export interface Goal {
  id: number; user_id: number; title: string;
  target_amount: number; current_amount: number;
  deadline: string | null; progress_pct: number;
}

// ─── Budget ──────────────────────────────────────────────────────────────────
export interface Budget {
  id: number; user_id: number; category_id: number;
  limit_amount: number; month: string; created_at: string;
  category_name?: string; category_color?: string; category_icon?: string;
  spent: number; percentage: number; remaining: number; over_budget: boolean;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface DashboardSummary {
  total_balance: number;
  current_month: TransactionSummary;
  last_month: TransactionSummary;
  comparison: { income_change_pct: number; expense_change_pct: number; income_trend: string; expense_trend: string; };
  recent_transactions: Transaction[];
  goals: Goal[];
  balance_by_type: { type: string; total: number }[];
  evolution: MonthlyEvolution[];
  generated_at: string;
}
export interface Forecast {
  forecast: { month: string; projected_income: number; projected_expense: number; projected_balance: number; trend_income: string; trend_expense: string; }[];
  avg_income: number; avg_expense: number; avg_balance: number;
  income_trend: number; expense_trend: number; generated_at: string;
}

// ─── Finance External ────────────────────────────────────────────────────────
export interface ExchangeRates {
  base: string; date: string; rates: Record<string, number>; next_update?: string;
}
export interface CurrencyConversion {
  from: string; to: string; amount: number;
  rate: number; converted: number; formatted: string;
}
export interface StockQuote {
  symbol: string; name: string; price: number;
  change: number; change_percent: number; volume: number; market_cap: number;
}
