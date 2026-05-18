import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../constants/api.constants';
import { ApiResponse, Account, Category, Budget, Goal, DashboardSummary, MonthlyEvolution, CategorySummary, MarketTicker, MarketSummary, ExchangeRates, StockQuote } from '../models';

// ─── Dashboard Service ────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  summary(month: string): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(API.DASHBOARD.SUMMARY, { params: { month } });
  }

  evolution(months = 12): Observable<ApiResponse<MonthlyEvolution[]>> {
    return this.http.get<ApiResponse<MonthlyEvolution[]>>(API.DASHBOARD.EVOLUTION, { params: { months } });
  }

  byCategory(month: string): Observable<ApiResponse<CategorySummary[]>> {
    return this.http.get<ApiResponse<CategorySummary[]>>(API.DASHBOARD.CATEGORY, { params: { month } });
  }
}

// ─── Account Service ─────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);

  list(): Observable<ApiResponse<Account[]>> {
    return this.http.get<ApiResponse<Account[]>>(API.ACCOUNTS.BASE);
  }

  getById(id: number): Observable<ApiResponse<Account>> {
    return this.http.get<ApiResponse<Account>>(API.ACCOUNTS.BY_ID(id));
  }

  create(data: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.http.post<ApiResponse<Account>>(API.ACCOUNTS.BASE, data);
  }

  update(id: number, data: Partial<Account>): Observable<ApiResponse<Account>> {
    return this.http.put<ApiResponse<Account>>(API.ACCOUNTS.BY_ID(id), data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API.ACCOUNTS.BY_ID(id));
  }
}

// ─── Category Service ─────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);

  list(type?: string): Observable<ApiResponse<Category[]>> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<ApiResponse<Category[]>>(API.CATEGORIES.BASE, { params });
  }

  create(data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(API.CATEGORIES.BASE, data);
  }

  update(id: number, data: Partial<Category>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(API.CATEGORIES.BY_ID(id), data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API.CATEGORIES.BY_ID(id));
  }
}

// ─── Budget Service ──────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class BudgetService {
  private readonly http = inject(HttpClient);

  list(month: string): Observable<ApiResponse<Budget[]>> {
    return this.http.get<ApiResponse<Budget[]>>(API.BUDGETS.BASE, { params: { month } });
  }

  create(data: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.post<ApiResponse<Budget>>(API.BUDGETS.BASE, data);
  }

  update(id: number, data: Partial<Budget>): Observable<ApiResponse<Budget>> {
    return this.http.put<ApiResponse<Budget>>(API.BUDGETS.BY_ID(id), data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API.BUDGETS.BY_ID(id));
  }
}

// ─── Goal Service ────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class GoalService {
  private readonly http = inject(HttpClient);

  list(): Observable<ApiResponse<Goal[]>> {
    return this.http.get<ApiResponse<Goal[]>>(API.GOALS.BASE);
  }

  create(data: Partial<Goal>): Observable<ApiResponse<Goal>> {
    return this.http.post<ApiResponse<Goal>>(API.GOALS.BASE, data);
  }

  update(id: number, data: Partial<Goal>): Observable<ApiResponse<Goal>> {
    return this.http.put<ApiResponse<Goal>>(API.GOALS.BY_ID(id), data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API.GOALS.BY_ID(id));
  }

  contribute(id: number, amount: number): Observable<ApiResponse<Goal>> {
    return this.http.post<ApiResponse<Goal>>(API.GOALS.CONTRIBUTE(id), { amount });
  }
}

// ─── Finance Service ─────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);

  getExchangeRates(base: string = 'AOA'): Observable<ApiResponse<ExchangeRates>> {
    return this.http.get<ApiResponse<ExchangeRates>>(API.EXCHANGE.RATES, { params: { base } });
  }

  getMarketSummary(): Observable<ApiResponse<MarketSummary>> {
    return this.http.get<ApiResponse<MarketSummary>>(API.FINANCE.MARKET);
  }

  getStockQuotes(symbols: string[] = ['AAPL', 'MSFT', 'GOOGL']): Observable<ApiResponse<MarketTicker[]>> {
    const params = new HttpParams().set('symbols', symbols.join(','));
    return this.http.get<ApiResponse<MarketTicker[]>>(API.FINANCE.QUOTES, { params });
  }

  cryptoPrices(symbols: string[] = ['BTC', 'ETH', 'BNB']): Observable<ApiResponse<MarketTicker[]>> {
    const params = new HttpParams().set('symbols', symbols.join(','));
    return this.http.get<ApiResponse<MarketTicker[]>>(API.FINANCE.CRYPTO, { params });
  }
}
