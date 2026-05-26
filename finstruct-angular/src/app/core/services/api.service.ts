import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ApiResponse, PaginatedResponse,
  Account, AccountSummary,
  Category, Transaction, TransactionFilters,
  TransactionSummary, CategorySummary, MonthlyEvolution,
  Goal, Budget, DashboardSummary, Forecast,
  ExchangeRates, CurrencyConversion, StockQuote, User
} from '../models';

const API = environment.apiUrl;

// ─── Account Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(private http: HttpClient) {}
  list(page = 1, perPage = 20): Observable<PaginatedResponse<Account>> {
    return this.http.get<PaginatedResponse<Account>>(`${API}/accounts`, { params: { page, per_page: perPage } });
  }
  get(id: number): Observable<ApiResponse<Account>> {
    return this.http.get<ApiResponse<Account>>(`${API}/accounts/${id}`);
  }
  summary(): Observable<ApiResponse<AccountSummary>> {
    return this.http.get<ApiResponse<AccountSummary>>(`${API}/accounts/summary`);
  }
  create(data: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.http.post<ApiResponse<Account>>(`${API}/accounts`, data);
  }
  update(id: number, data: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.http.put<ApiResponse<Account>>(`${API}/accounts/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/accounts/${id}`);
  }
}

// ─── Category Service ─────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private http: HttpClient) {}
  list(type?: 'income'|'expense'): Observable<ApiResponse<Category[]>> {
    const params: any = {};
    if (type) params['type'] = type;
    return this.http.get<ApiResponse<Category[]>>(`${API}/categories`, { params });
  }
  create(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${API}/categories`, data);
  }
  update(id: number, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${API}/categories/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/categories/${id}`);
  }
}

// ─── Transaction Service ──────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private http: HttpClient) {}

  list(filters: TransactionFilters = {}): Observable<PaginatedResponse<Transaction>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params = params.set(k, String(v)); });
    return this.http.get<PaginatedResponse<Transaction>>(`${API}/transactions`, { params });
  }
  get(id: number): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(`${API}/transactions/${id}`);
  }
  summary(year: number, month: number): Observable<ApiResponse<TransactionSummary>> {
    return this.http.get<ApiResponse<TransactionSummary>>(`${API}/transactions/summary`, { params: { year, month } });
  }
  byCategory(type: string, dateFrom?: string, dateTo?: string): Observable<ApiResponse<CategorySummary[]>> {
    let params: any = { type };
    if (dateFrom) params['date_from'] = dateFrom;
    if (dateTo)   params['date_to']   = dateTo;
    return this.http.get<ApiResponse<CategorySummary[]>>(`${API}/transactions/by-category`, { params });
  }
  evolution(months = 12): Observable<ApiResponse<MonthlyEvolution[]>> {
    return this.http.get<ApiResponse<MonthlyEvolution[]>>(`${API}/transactions/evolution`, { params: { months } });
  }
  create(data: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(`${API}/transactions`, data);
  }
  update(id: number, data: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(`${API}/transactions/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/transactions/${id}`);
  }
}

// ─── Goal Service ─────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class GoalService {
  constructor(private http: HttpClient) {}
  list(page = 1, perPage = 20): Observable<PaginatedResponse<Goal>> {
    return this.http.get<PaginatedResponse<Goal>>(`${API}/goals`, { params: { page, per_page: perPage } });
  }
  get(id: number): Observable<ApiResponse<Goal>> {
    return this.http.get<ApiResponse<Goal>>(`${API}/goals/${id}`);
  }
  create(data: Partial<Goal>): Observable<ApiResponse<Goal>> {
    return this.http.post<ApiResponse<Goal>>(`${API}/goals`, data);
  }
  update(id: number, data: Partial<Goal>): Observable<ApiResponse<Goal>> {
    return this.http.put<ApiResponse<Goal>>(`${API}/goals/${id}`, data);
  }
  deposit(id: number, amount: number): Observable<ApiResponse<Goal>> {
    return this.http.post<ApiResponse<Goal>>(`${API}/goals/${id}/deposit`, { amount });
  }
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/goals/${id}`);
  }
}

// ─── Budget Service ───────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class BudgetService {
  constructor(private http: HttpClient) {}
  list(month?: string): Observable<ApiResponse<Budget[]>> {
    const params: any = {};
    if (month) params['month'] = month;
    return this.http.get<ApiResponse<Budget[]>>(`${API}/budgets`, { params });
  }
  create(data: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(`${API}/budgets`, data);
  }
  update(id: number, data: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.put<ApiResponse<Budget>>(`${API}/budgets/${id}`, data);
  }
  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${API}/budgets/${id}`);
  }
}

// ─── Dashboard Service ────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private http: HttpClient) {}
  summary(): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(`${API}/dashboard`);
  }
  forecast(months = 3): Observable<ApiResponse<Forecast>> {
    return this.http.get<ApiResponse<Forecast>>(`${API}/dashboard/forecast`, { params: { months } });
  }
  evolution(months = 12): Observable<ApiResponse<MonthlyEvolution[]>> {
    return this.http.get<ApiResponse<MonthlyEvolution[]>>(`${API}/dashboard/evolution`, { params: { months } });
  }
}

// ─── Finance (External APIs) ──────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class FinanceService {
  constructor(private http: HttpClient) {}
  exchangeRates(base = 'AOA'): Observable<ApiResponse<ExchangeRates>> {
    return this.http.get<ApiResponse<ExchangeRates>>(`${API}/exchange/rates`, { params: { base } });
  }
  convert(from: string, to: string, amount: number): Observable<ApiResponse<CurrencyConversion>> {
    return this.http.get<ApiResponse<CurrencyConversion>>(`${API}/exchange/convert`, { params: { from, to, amount } });
  }
  quotes(symbols: string): Observable<ApiResponse<StockQuote[]>> {
    return this.http.get<ApiResponse<StockQuote[]>>(`${API}/finance/quotes`, { params: { symbols } });
  }
  market(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${API}/finance/market`);
  }
  crypto(symbols = 'BTC,ETH,BNB'): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${API}/finance/crypto`, { params: { symbols } });
  }
}

// ─── User / Profile Service ───────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}
  getProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${API}/profile`);
  }
  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${API}/profile`, data);
  }
  uploadAvatar(file: File): Observable<ApiResponse<User>> {
    const fd = new FormData();
    fd.append('avatar', file);
    return this.http.post<ApiResponse<User>>(`${API}/profile/avatar`, fd);
  }
}
