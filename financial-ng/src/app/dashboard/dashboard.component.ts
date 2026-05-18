import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService, AccountService, FinanceService } from '../core/services/domain.services';
import { AuthService } from '../core/services/auth.service';
import { DashboardSummary, MonthlyEvolution, CategorySummary, Account, Transaction, MarketTicker, ExchangeRates, MarketSummary, StockQuote } from '../core/models';
import { TransactionService } from '../core/services/transaction.service';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, CurrencyPipe, DecimalPipe],
  template: `
    <div class="dashboard animate-fade-in">

      <!-- ─── Header ─── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ greeting() }}, {{ firstName() }} 👋</h1>
          <p class="page-subtitle">Aqui está o seu resumo financeiro de {{ currentMonthLabel() }}</p>
        </div>
        <div class="header-actions">
          <select class="form-control" style="width:180px" [(ngModel)]="selectedMonth" (ngModelChange)="loadData()">
            @for (m of months; track m.value) {
              <option [value]="m.value">{{ m.label }}</option>
            }
          </select>
          <a routerLink="/app/transactions" [queryParams]="{new:1}" class="btn btn-primary">
            + Nova Transação
          </a>
        </div>
      </div>

      <!-- ─── KPI Cards ─── -->
      @if (loadingSummary()) {
        <div class="kpi-grid stagger">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton" style="height:130px;border-radius:18px"></div>
          }
        </div>
      } @else {
        <div class="kpi-grid stagger animate-fade-in">
          <div class="kpi-card kpi-balance">
            <div class="kpi-top">
              <span class="kpi-label">Saldo Total</span>
              <span class="kpi-icon">💼</span>
            </div>
            <div class="kpi-value font-mono">
              {{ summary()?.total_accounts_balance | currency:'EUR':'symbol':'1.2-2':'pt' }}
            </div>
            <div class="kpi-trend">
              <span class="badge badge-success">Todas as contas</span>
            </div>
          </div>

          <div class="kpi-card kpi-income">
            <div class="kpi-top">
              <span class="kpi-label">Receitas</span>
              <span class="kpi-icon">📥</span>
            </div>
            <div class="kpi-value font-mono">
              {{ summary()?.total_income | currency:'EUR':'symbol':'1.2-2':'pt' }}
            </div>
            <div class="kpi-trend">
              <span class="badge badge-success">↑ Este mês</span>
            </div>
          </div>

          <div class="kpi-card kpi-expense">
            <div class="kpi-top">
              <span class="kpi-label">Despesas</span>
              <span class="kpi-icon">📤</span>
            </div>
            <div class="kpi-value font-mono">
              {{ summary()?.total_expense | currency:'EUR':'symbol':'1.2-2':'pt' }}
            </div>
            <div class="kpi-trend">
              <span [class]="expenseRateBadgeClass()">{{ expenseRateLabel() }}</span>
            </div>
          </div>

          <div class="kpi-card kpi-savings">
            <div class="kpi-top">
              <span class="kpi-label">Taxa de Poupança</span>
              <span class="kpi-icon">🏦</span>
            </div>
            <div class="kpi-value font-mono">{{ savingsRate() | number:'1.0-1':'pt' }}%</div>
            <div class="kpi-trend">
              <div class="progress-bar" style="width:100%;margin-top:4px">
                <div class="progress-fill" [style.width.%]="savingsRate()"
                     [style.background]="savingsRate() > 20 ? 'var(--clr-success)' : 'var(--clr-warning)'"></div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ─── Market & Crypto Row ─── -->
      <div class="market-row animate-fade-in">
        <!-- Market Indices -->
        <div class="card market-card">
          <div class="card-head">
            <div class="head-info">
              <h3>🌍 Mercado Global</h3>
              <span class="text-muted" style="font-size:.7rem">Atualizado: {{ marketUpdatedAt() || '---' }}</span>
            </div>
          </div>
          @if (loadingMarket()) {
            <div class="skeleton" style="height:60px;border-radius:12px"></div>
          } @else {
            <div class="market-tickers">
              @for (idx of marketIndices(); track idx.symbol) {
                <div class="ticker-item">
                  <span class="ticker-sym">{{ idx.symbol }}</span>
                  <span class="ticker-price">{{ idx.price | number:'1.2-2' }}</span>
                  <span class="ticker-change" [class.up]="idx.change > 0" [class.down]="idx.change < 0">
                    {{ idx.change > 0 ? '+' : '' }}{{ idx.change_percent | number:'1.2-2' }}%
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Crypto Prices -->
        <div class="card market-card">
          <div class="card-head">
            <h3>🪙 Criptomoedas (USD)</h3>
          </div>
          @if (loadingCrypto()) {
            <div class="skeleton" style="height:60px;border-radius:12px"></div>
          } @else {
            <div class="market-tickers">
              @for (coin of cryptoPrices(); track coin.symbol) {
                <div class="ticker-item">
                  <span class="ticker-sym">{{ coin.symbol }}</span>
                  <span class="ticker-price">{{ coin.price | currency:'USD':'symbol':'1.0-0' }}</span>
                  <span class="ticker-change" [class.up]="coin.change > 0" [class.down]="coin.change < 0">
                    {{ coin.change > 0 ? '+' : '' }}{{ coin.change_percent | number:'1.1-1' }}%
                  </span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- ─── Exchange Rates Widget ─── -->
      @if (exchangeRates()) {
        <div class="card exchange-card animate-fade-in">
          <div class="exchange-grid">
            <div class="exch-item">
              <span class="exch-label">💵 USD/AOA</span>
              <span class="exch-value">{{ exchangeRates()?.rates?.['AOA'] | number:'1.2-2' }}</span>
            </div>
            <div class="exch-item">
              <span class="exch-label">💶 EUR/AOA</span>
              <span class="exch-value">{{ (exchangeRates()?.rates?.['AOA'] ?? 0) / (exchangeRates()?.rates?.['EUR'] ?? 1) | number:'1.2-2' }}</span>
            </div>
            <div class="exch-item">
              <span class="exch-label">💹 EUR/USD</span>
              <span class="exch-value">{{ exchangeRates()?.rates?.['USD'] | number:'1.3-3' }}</span>
            </div>
          </div>
        </div>
      }

      <!-- ─── Charts Row ─── -->
      <div class="charts-row">

        <!-- Evolution Chart -->
        <div class="card chart-card">
          <div class="card-head">
            <h3>Evolução Mensal</h3>
            <span class="text-secondary" style="font-size:.8rem">Últimos 12 meses</span>
          </div>

          @if (loadingEvolution()) {
            <div class="skeleton" style="height:220px;border-radius:12px"></div>
          } @else {
            <div class="chart-bars">
              @for (item of evolution(); track item.month) {
                <div class="bar-group" [title]="item.month">
                  <div class="bar-pair">
                    <div class="bar bar-income"
                         [style.height.%]="barHeight(item.income)"
                         [title]="'Receita: ' + item.income"></div>
                    <div class="bar bar-expense"
                         [style.height.%]="barHeight(item.expense)"
                         [title]="'Despesa: ' + item.expense"></div>
                  </div>
                  <span class="bar-label">{{ item.month | slice:5:7 }}/{{ item.month | slice:2:4 }}</span>
                </div>
              }
            </div>
            <div class="chart-legend">
              <span class="legend-item"><span class="legend-dot income"></span>Receitas</span>
              <span class="legend-item"><span class="legend-dot expense"></span>Despesas</span>
            </div>
          }
        </div>

        <!-- Category Breakdown -->
        <div class="card chart-card">
          <div class="card-head">
            <h3>Por Categoria</h3>
            <span class="badge badge-primary">Despesas</span>
          </div>

          @if (loadingCategory()) {
            <div class="skeleton" style="height:220px;border-radius:12px"></div>
          } @else if (expenseCategories().length) {
            <div class="category-list">
              @for (cat of expenseCategories(); track cat.name) {
                <div class="category-row">
                  <span class="cat-icon">{{ cat.icon || '📦' }}</span>
                  <div class="cat-info">
                    <div class="cat-header">
                      <span class="cat-name">{{ cat.name }}</span>
                      <span class="cat-amount font-mono">{{ cat.total | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill"
                           [style.width.%]="categoryPercent(cat.total)"
                           style="background:var(--clr-danger)"></div>
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state" style="padding:3rem 1rem">
              <div class="empty-state-icon">📊</div>
              <p class="empty-state-message">Sem dados para este mês</p>
            </div>
          }
        </div>
      </div>

      <div class="market-row">
        <div class="card market-card">
          <div class="card-head">
            <h3>Índices de Mercado</h3>
            <span class="text-secondary" style="font-size:.8rem">
              @if (marketUpdatedAt()) { Atualizado em {{ marketUpdatedAt() | date:'dd/MM HH:mm':'pt' }} }
            </span>
          </div>

          @if (loadingMarket()) {
            <div style="display:grid;gap:.75rem">
              @for (i of [1,2,3,4]; track i) {
                <div class="skeleton" style="height:70px;border-radius:16px"></div>
              }
            </div>
          } @else if (marketIndices().length) {
            <div class="market-list">
              @for (idx of marketIndices(); track idx.symbol) {
                <div class="market-item">
                  <div>
                    <div class="market-symbol">{{ idx.symbol }}</div>
                    <div class="market-name">{{ idx.name || 'Índice' }}</div>
                  </div>
                  <div class="market-values">
                    <div class="market-price">{{ idx.price | number:'1.2-2':'pt' }} {{ idx.currency || 'USD' }}</div>
                    <div class="market-change" [class.positive]="idx.change >= 0" [class.negative]="idx.change < 0">
                      {{ idx.change >= 0 ? '+' : '' }}{{ idx.change | number:'1.2-2':'pt' }}
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state" style="padding:1.5rem">
              <div class="empty-state-icon">📉</div>
              <p class="empty-state-message">Não foi possível carregar índices de mercado.</p>
              <p class="text-muted">Verifique a ligação ao backend ou as chaves API.</p>
            </div>
          }
        </div>

        <div class="card market-card">
          <div class="card-head">
            <h3>Criptomoedas</h3>
            <span class="text-secondary" style="font-size:.8rem">Principais cotações</span>
          </div>

          @if (loadingCrypto()) {
            <div style="display:grid;gap:.75rem">
              @for (i of [1,2,3]; track i) {
                <div class="skeleton" style="height:70px;border-radius:16px"></div>
              }
            </div>
          } @else if (cryptoPrices().length) {
            <div class="market-list">
              @for (crypto of cryptoPrices(); track crypto.symbol) {
                <div class="market-item">
                  <div>
                    <div class="market-symbol">{{ crypto.symbol }}</div>
                    <div class="market-name">{{ crypto.name || 'Cripto' }}</div>
                  </div>
                  <div class="market-values">
                    <div class="market-price">{{ crypto.price | number:'1.2-2':'pt' }} {{ crypto.currency || 'USD' }}</div>
                    <div class="market-change" [class.positive]="crypto.change >= 0" [class.negative]="crypto.change < 0">
                      {{ crypto.change >= 0 ? '+' : '' }}{{ crypto.change | number:'1.2-2':'pt' }}
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state" style="padding:1.5rem">
              <div class="empty-state-icon">💱</div>
              <p class="empty-state-message">Não foi possível carregar as criptomoedas.</p>
              <p class="text-muted">Certifique-se de que está autenticado e que o backend está acessível.</p>
            </div>
          }
        </div>
      </div>

      <!-- ─── Bottom Row ─── -->
      <div class="bottom-row">

        <!-- Recent Transactions -->
        <div class="card flex-1">
          <div class="card-head">
            <h3>Últimas Transações</h3>
            <a routerLink="/app/transactions" class="link-btn">Ver todas →</a>
          </div>

          @if (loadingTx()) {
            <div style="display:flex;flex-direction:column;gap:.75rem;padding-top:.5rem">
              @for (i of [1,2,3,4,5]; track i) {
                <div class="skeleton" style="height:52px;border-radius:12px"></div>
              }
            </div>
          } @else if (recentTx().length) {
            <div class="tx-list">
              @for (tx of recentTx(); track tx.id) {
                <div class="tx-row animate-fade-in">
                  <div class="tx-icon">{{ tx.category_icon || (tx.type === 'income' ? '📥' : '📤') }}</div>
                  <div class="tx-info">
                    <span class="tx-desc">{{ tx.description }}</span>
                    <span class="tx-meta">{{ tx.category_name || 'Sem categoria' }} · {{ tx.date | date:'dd/MM':'pt' }}</span>
                  </div>
                  <div class="tx-amount" [class.income]="tx.type === 'income'" [class.expense]="tx.type === 'expense'">
                    {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | currency:'EUR':'symbol':'1.2-2':'pt' }}
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state" style="padding:2rem">
              <div class="empty-state-icon">💸</div>
              <p class="empty-state-message">Nenhuma transação este mês</p>
            </div>
          }
        </div>

        <!-- Accounts -->
        <div class="card" style="width:320px;flex-shrink:0">
          <div class="card-head">
            <h3>Contas</h3>
            <a routerLink="/app/accounts" class="link-btn">Gerir →</a>
          </div>

          @if (loadingAccounts()) {
            <div style="display:flex;flex-direction:column;gap:.5rem">
              @for (i of [1,2,3]; track i) {
                <div class="skeleton" style="height:64px;border-radius:12px"></div>
              }
            </div>
          } @else if (accounts().length) {
            <div style="display:flex;flex-direction:column;gap:.625rem">
              @for (acc of accounts(); track acc.id) {
                <div class="account-card">
                  <div class="account-icon">{{ accountIcon(acc.type) }}</div>
                  <div class="account-info">
                    <span class="account-name">{{ acc.name }}</span>
                    <span class="account-type">{{ accountTypeLabel(acc.type) }}</span>
                  </div>
                  <span class="account-balance font-mono"
                        [class.negative]="acc.balance < 0">
                    {{ acc.balance | currency:'EUR':'symbol':'1.2-2':'pt' }}
                  </span>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state" style="padding:2rem">
              <div class="empty-state-icon">🏦</div>
              <p class="empty-state-message">Nenhuma conta criada</p>
              <a routerLink="/app/accounts" class="btn btn-primary btn-sm">Adicionar conta</a>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { display: flex; flex-direction: column; gap: 1.75rem; }

    /* Header */
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .page-title { font-size: 1.625rem; font-weight: 700; margin-bottom: .25rem; }
    .page-subtitle { color: var(--text-secondary); font-size: .9rem; }
    .header-actions { display: flex; gap: .75rem; align-items: center; flex-wrap: wrap; }

    /* KPI Grid */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }

    .kpi-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 1.5rem;
      position: relative;
      overflow: hidden;
      transition: transform var(--transition), box-shadow var(--transition);
    }
    .kpi-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
    }
    .kpi-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
    .kpi-balance::before { background: linear-gradient(90deg, #6C63FF, #a78bfa); }
    .kpi-income::before  { background: linear-gradient(90deg, #22C55E, #86efac); }
    .kpi-expense::before { background: linear-gradient(90deg, #EF4444, #fca5a5); }
    .kpi-savings::before { background: linear-gradient(90deg, #F59E0B, #fcd34d); }

    .kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; }
    .kpi-label { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--text-secondary); }
    .kpi-icon { font-size: 1.375rem; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: .5rem; }
    .kpi-trend { font-size: .8rem; }

    /* Market Row */
    .market-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .market-card { padding: 1rem 1.25rem !important; }
    .market-tickers { display: flex; gap: 1.5rem; overflow-x: auto; padding-bottom: .25rem; scrollbar-width: none; }
    .market-tickers::-webkit-scrollbar { display: none; }
    .ticker-item { display: flex; flex-direction: column; gap: 2px; min-width: 80px; }
    .ticker-sym { font-size: .7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .ticker-price { font-size: .9rem; font-weight: 700; font-family: var(--font-mono); }
    .ticker-change { font-size: .75rem; font-weight: 600; }
    .ticker-change.up { color: var(--clr-success); }
    .ticker-change.down { color: var(--clr-danger); }

    /* Exchange Card */
    .exchange-card { background: linear-gradient(90deg, #1e293b, #334155); border: none; color: #fff; padding: .75rem 1.5rem !important; }
    .exchange-grid { display: flex; justify-content: space-around; gap: 1rem; }
    .exch-item { display: flex; flex-direction: column; align-items: center; }
    .exch-label { font-size: .65rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
    .exch-value { font-size: 1.125rem; font-weight: 700; font-family: var(--font-mono); color: #f8fafc; }

    /* Charts */
    .charts-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 1.25rem; }
    .chart-card { display: flex; flex-direction: column; }
    .card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .card-head h3 { font-size: 1rem; font-weight: 700; }

    /* Bar Chart */
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 200px;
      flex: 1;
    }
    .bar-group { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; height: 100%; justify-content: flex-end; }
    .bar-pair { display: flex; gap: 3px; align-items: flex-end; flex: 1; width: 100%; }
    .bar { flex: 1; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 600ms var(--ease); }
    .bar-income  { background: var(--clr-success); opacity: .85; }
    .bar-expense { background: var(--clr-danger);  opacity: .75; }
    .bar-label { font-size: .65rem; color: var(--text-muted); white-space: nowrap; }

    .chart-legend { display: flex; gap: 1.25rem; margin-top: 1rem; padding-top: .75rem; border-top: 1px solid var(--border); }
    .legend-item { display: flex; align-items: center; gap: .375rem; font-size: .8rem; color: var(--text-secondary); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }
    .legend-dot.income  { background: var(--clr-success); }
    .legend-dot.expense { background: var(--clr-danger); }

    .market-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .market-card { display: flex; flex-direction: column; }
    .market-list { display: grid; gap: .75rem; }
    .market-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem;
      background: var(--bg-surface2);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }
    .market-symbol { font-size: .95rem; font-weight: 700; }
    .market-name { font-size: .8rem; color: var(--text-secondary); margin-top: .2rem; }
    .market-values { display: flex; flex-direction: column; align-items: flex-end; gap: .2rem; text-align: right; }
    .market-price { font-size: .95rem; font-weight: 700; }
    .market-change { font-size: .8rem; }
    .market-change.positive { color: var(--clr-success); }
    .market-change.negative { color: var(--clr-danger); }

    /* Category list */
    .category-list { display: flex; flex-direction: column; gap: .875rem; }
    .category-row { display: flex; align-items: center; gap: .75rem; }
    .cat-icon { font-size: 1.25rem; flex-shrink: 0; }
    .cat-info { flex: 1; min-width: 0; }
    .cat-header { display: flex; justify-content: space-between; margin-bottom: .25rem; }
    .cat-name { font-size: .875rem; font-weight: 500; }
    .cat-amount { font-size: .8rem; color: var(--text-secondary); }

    /* Bottom row */
    .bottom-row { display: flex; gap: 1.25rem; align-items: flex-start; }

    /* Transaction list */
    .tx-list { display: flex; flex-direction: column; }
    .tx-row {
      display: flex; align-items: center; gap: .875rem;
      padding: .75rem .25rem;
      border-bottom: 1px solid var(--border);
      transition: background var(--transition);
      border-radius: var(--radius-sm);
    }
    .tx-row:last-child { border-bottom: none; }
    .tx-row:hover { background: var(--bg-surface2); padding-left: .75rem; padding-right: .5rem; }
    .tx-icon { font-size: 1.25rem; }
    .tx-info { flex: 1; min-width: 0; }
    .tx-desc { display: block; font-size: .9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tx-meta { font-size: .75rem; color: var(--text-muted); }
    .tx-amount { font-size: .9375rem; font-weight: 700; font-family: var(--font-mono); white-space: nowrap; }
    .tx-amount.income  { color: var(--clr-success); }
    .tx-amount.expense { color: var(--clr-danger); }

    /* Account cards */
    .account-card {
      display: flex; align-items: center; gap: .75rem;
      padding: .75rem;
      background: var(--bg-surface2);
      border-radius: var(--radius-md);
      transition: background var(--transition);
    }
    .account-card:hover { background: var(--border); }
    .account-icon { font-size: 1.5rem; }
    .account-info { flex: 1; }
    .account-name { display: block; font-size: .875rem; font-weight: 600; }
    .account-type { font-size: .75rem; color: var(--text-muted); text-transform: capitalize; }
    .account-balance { font-size: .9375rem; font-weight: 700; }
    .account-balance.negative { color: var(--clr-danger); }

    .link-btn { font-size: .8rem; color: var(--clr-primary); font-weight: 600; text-decoration: none; }
    .link-btn:hover { text-decoration: underline; }

    /* Responsive */
    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 900px) {
      .charts-row { grid-template-columns: 1fr; }
      .bottom-row { flex-direction: column; }
      .bottom-row .card { width: 100% !important; }
    }
    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private dashSvc = inject(DashboardService);
  private accSvc  = inject(AccountService);
  private txSvc   = inject(TransactionService);
  private finSvc  = inject(FinanceService);
  private auth    = inject(AuthService);

  summary          = signal<DashboardSummary | null>(null);
  evolution        = signal<MonthlyEvolution[]>([]);
  categoryData     = signal<CategorySummary[]>([]);
  accounts         = signal<Account[]>([]);
  recentTx         = signal<Transaction[]>([]);
  marketIndices    = signal<MarketTicker[]>([]);
  cryptoPrices     = signal<MarketTicker[]>([]);
  marketUpdatedAt  = signal<string>('');
  exchangeRates    = signal<ExchangeRates | null>(null);

  loadingSummary   = signal(true);
  loadingEvolution = signal(true);
  loadingCategory  = signal(true);
  loadingAccounts  = signal(true);
  loadingTx        = signal(true);
  loadingMarket    = signal(true);
  loadingCrypto    = signal(true);
  loadingFinance   = signal(true);

  selectedMonth     = format(new Date(), 'yyyy-MM');

  months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: pt }) };
  });

  firstName    = computed(() => this.auth.user()?.name?.split(' ')[0] ?? 'utilizador');
  savingsRate  = computed(() => {
    const s = this.summary();
    if (!s?.total_income) return 0;
    return Math.max(0, ((s.total_income - s.total_expense) / s.total_income) * 100);
  });
  expenseCategories = computed(() => this.categoryData().filter(c => c.type === 'expense').slice(0, 5));
  maxEvolution = computed(() => Math.max(...this.evolution().flatMap(e => [e.income, e.expense]), 1));

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  currentMonthLabel(): string {
    const m = this.months.find(m => m.value === this.selectedMonth);
    return m?.label ?? this.selectedMonth;
  }

  barHeight(val: number): number {
    return Math.max(4, (val / this.maxEvolution()) * 100);
  }

  categoryPercent(total: number): number {
    const maxCat = Math.max(...this.expenseCategories().map(c => c.total), 1);
    return (total / maxCat) * 100;
  }

  expenseRateLabel(): string {
    const totalIncome = this.summary()?.total_income;
    if (!totalIncome) return 'Sem receita';
    const pct = Math.round((this.summary()!.total_expense / totalIncome) * 100);
    return `${pct}% da receita`;
  }

  expenseRateBadgeClass(): string {
    const summary = this.summary();
    const totalIncome = summary?.total_income;
    if (!totalIncome) return 'badge badge-info';

    const pct = (summary.total_expense / totalIncome) * 100;
    if (pct > 80) return 'badge badge-danger';
    if (pct > 60) return 'badge badge-warning';
    return 'badge badge-success';
  }

  accountIcon(type: string): string {
    return { checking: '🏦', savings: '🏛️', credit: '💳', investment: '📈', cash: '💵' }[type] ?? '💰';
  }

  accountTypeLabel(type: string): string {
    return { checking: 'Conta corrente', savings: 'Poupança', credit: 'Crédito', investment: 'Investimento', cash: 'Dinheiro' }[type] ?? type;
  }

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loadingSummary.set(true);
    this.dashSvc.summary(this.selectedMonth).subscribe({
      next: r => { this.summary.set(r.data); this.loadingSummary.set(false); },
      error: () => this.loadingSummary.set(false),
    });

    this.loadingEvolution.set(true);
    this.dashSvc.evolution(12).subscribe({
      next: r => { this.evolution.set(r.data); this.loadingEvolution.set(false); },
      error: () => this.loadingEvolution.set(false),
    });

    this.loadingCategory.set(true);
    this.dashSvc.byCategory(this.selectedMonth).subscribe({
      next: r => { this.categoryData.set(r.data ?? []); this.loadingCategory.set(false); },
      error: () => this.loadingCategory.set(false),
    });

    this.loadingAccounts.set(true);
    this.accSvc.list().subscribe({
      next: r => { this.accounts.set(r.data); this.loadingAccounts.set(false); },
      error: () => this.loadingAccounts.set(false),
    });

    this.loadingTx.set(true);
    this.txSvc.list({ per_page: 7, page: 1 }).subscribe({
      next: r => { this.recentTx.set(r.data); this.loadingTx.set(false); },
      error: () => this.loadingTx.set(false),
    });

    // Câmbio e Mercado
    this.loadingFinance.set(true);
    this.finSvc.getExchangeRates().subscribe({
      next: r => this.exchangeRates.set(r.data),
    });

    this.loadingMarket.set(true);
    this.finSvc.getMarketSummary().subscribe({
      next: r => {
        this.marketIndices.set(r.data?.indices ?? []);
        this.marketUpdatedAt.set(r.data?.updated_at ?? '');
        this.loadingMarket.set(false);
        this.loadingFinance.set(false);
      },
      error: () => {
        this.loadingMarket.set(false);
        this.loadingFinance.set(false);
      },
    });

    this.loadingCrypto.set(true);
    this.finSvc.cryptoPrices().subscribe({
      next: r => { this.cryptoPrices.set(r.data ?? []); this.loadingCrypto.set(false); },
      error: () => this.loadingCrypto.set(false),
    });
  }
}
