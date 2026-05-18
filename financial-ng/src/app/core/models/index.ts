// ─── API Response ────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  status: number;
  message: string;
  data: T;
  timestamp: string;
  meta?: PaginationMeta;
  errors?: Record<string, string[]>;
}

export interface PaginationMeta {
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: 'checking' | 'savings' | 'credit' | 'investment' | 'cash';
  balance: number;
  currency: string;
  bank_name?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  user_id?: number;
  name: string;
  type: 'income' | 'expense' | 'both';
  icon?: string;
  color?: string;
  created_at: string;
}

// ─── Transaction ─────────────────────────────────────────────────────────────

export interface Transaction {
  id: number;
  user_id: number;
  account_id: number;
  category_id?: number;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  date: string;
  notes?: string;
  attachment?: string;
  is_recurring: boolean;
  category_name?: string;
  category_icon?: string;
  account_name?: string;
  account_type?: string;
  created_at: string;
}

export interface TransactionFilters {
  type?: string;
  category_id?: number;
  account_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

// ─── Budget ──────────────────────────────────────────────────────────────────

export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  amount: number;
  month: string;
  spent?: number;
  remaining?: number;
  percentage?: number;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
}

// ─── Goal ────────────────────────────────────────────────────────────────────

export interface Goal {
  id: number;
  user_id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  status: 'active' | 'completed' | 'cancelled';
  progress_percentage?: number;
  created_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  balance: number;
  total_transactions: number;
  total_accounts_balance: number;
  savings_rate?: number;
}

export interface MonthlyEvolution {
  month: string;
  income: number;
  expense: number;
}

export interface CategorySummary {
  name: string;
  icon: string;
  type: string;
  total: number;
  count: number;
}
export interface MarketTicker {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  change_percent?: number;
  market_cap?: number;
  currency?: string;
  updated_at?: string;
  note?: string;
}

export interface MarketSummary {
  indices: MarketTicker[];
  updated_at: string;
}

export interface ExchangeRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
}
// ─── UI ──────────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

export interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
  roles?: string[];
  children?: NavItem[];
}
