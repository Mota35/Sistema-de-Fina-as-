import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, interval, switchMap, takeUntil, startWith } from 'rxjs';
import { DashboardService } from '../../core/services/api.service';
import { MarketService, AssetQuote } from '../../core/services/market.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { DashboardSummary } from '../../core/models';

const DEFAULT_CRYPTOS = ['BTC','ETH','BNB','SOL'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MoneyPipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'bg-black text-slate-100' : 'bg-slate-50 text-slate-900'">

  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        {{ greeting() }}, {{ firstName() }} 👋
      </h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Aqui está o seu resumo financeiro de {{ currentMonth() }}
      </p>
    </div>
    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono"
         [class]="theme.isDark() ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'">
      <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
      Sincronização Activa
    </div>
  </div>

  <!-- Summary Cards skeleton -->
  <div *ngIf="loadingDash()" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div *ngFor="let i of [1,2,3]" class="h-32 rounded-2xl animate-pulse"
         [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'"></div>
  </div>

  <!-- Summary Cards -->
  <div *ngIf="!loadingDash() && dash()" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="p-6 rounded-2xl border relative overflow-hidden"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="label">Saldo Total</span>
          <h2 class="text-2xl md:text-3xl font-black mt-2" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            {{ dash()!.total_balance | money }}
          </h2>
        </div>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
             [class]="theme.isDark() ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
        </div>
      </div>
      <div class="flex items-center gap-1.5 mt-4 text-[10px] font-mono">
        <span class="font-bold" [class]="dash()!.comparison.income_trend==='up' ? 'text-emerald-400' : 'text-red-400'">
          {{ dash()!.comparison.income_trend==='up' ? '↑' : '↓' }}
          {{ dash()!.comparison.income_change_pct | number:'1.1-1' }}%
        </span>
        <span [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">vs. mês anterior</span>
      </div>
    </div>

    <div class="p-6 rounded-2xl border"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex justify-between items-start">
        <div>
          <span class="label">Receitas do Mês</span>
          <h2 class="text-2xl md:text-3xl font-black mt-2 text-emerald-400">
            {{ dash()!.current_month.income | money }}
          </h2>
        </div>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7"/>
          </svg>
        </div>
      </div>
      <p class="text-[10px] font-mono mt-4" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Este mês · {{ currentMonth() }}</p>
    </div>

    <div class="p-6 rounded-2xl border"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex justify-between items-start">
        <div>
          <span class="label">Despesas do Mês</span>
          <h2 class="text-2xl md:text-3xl font-black mt-2 text-red-400">
            {{ dash()!.current_month.expense | money }}
          </h2>
        </div>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20">
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v10h10"/>
          </svg>
        </div>
      </div>
      <p class="text-[10px] font-mono mt-4" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Este mês · {{ currentMonth() }}</p>
    </div>
  </div>

  <!-- Evolution Chart + Balance by type -->
  <div *ngIf="!loadingDash() && dash()" class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
    <div class="lg:col-span-2 rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex items-center justify-between pb-3 border-b mb-4"
           [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <div>
          <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Evolução Patrimonial</h3>
          <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Receitas vs. Despesas — Últimos 6 meses</p>
        </div>
        <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
              [class]="theme.isDark() ? 'text-amber-500 bg-amber-500/5 border-amber-500/10' : 'text-blue-600 bg-blue-50 border-blue-200'">
          Histórico 6M
        </span>
      </div>
      <div class="h-48 relative">
        <svg *ngIf="dash()!.evolution.length" viewBox="0 0 500 160" class="w-full h-full select-none">
          <defs>
            <linearGradient id="dInc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#34d399" stop-opacity="0.18"/>
              <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="dExp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f87171" stop-opacity="0.12"/>
              <stop offset="100%" stop-color="#f87171" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="40" x2="500" y2="40" stroke="#1e293b" stroke-width="0.7" stroke-dasharray="3"/>
          <line x1="0" y1="90" x2="500" y2="90" stroke="#1e293b" stroke-width="0.7" stroke-dasharray="3"/>
          <line x1="0" y1="135" x2="500" y2="135" stroke="#1e293b" stroke-width="0.7" stroke-dasharray="3"/>
          <path [attr.d]="evoPath(dash()!.evolution,'income',500,140,true)" fill="url(#dInc)"/>
          <path [attr.d]="evoPath(dash()!.evolution,'income',500,140,false)" fill="none" stroke="#34d399" stroke-width="2.2" stroke-linecap="round"/>
          <path [attr.d]="evoPath(dash()!.evolution,'expense',500,140,true)" fill="url(#dExp)"/>
          <path [attr.d]="evoPath(dash()!.evolution,'expense',500,140,false)" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 2"/>
          <text *ngFor="let e of dash()!.evolution.slice(-6); let i=index"
                [attr.x]="(i/(dash()!.evolution.slice(-6).length-1||1))*480+10"
                y="156" fill="#475569" font-size="8" font-family="monospace" text-anchor="middle">
            {{ e.month | slice:5:7 }}/{{ e.month | slice:2:4 }}
          </text>
        </svg>
        <div *ngIf="!dash()!.evolution.length"
             class="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
          Sem dados de evolução
        </div>
      </div>
      <div class="flex gap-4 mt-2 text-[10px] font-mono">
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-1.5 rounded-full bg-emerald-400 inline-block"></span>Receitas
        </span>
        <span class="flex items-center gap-1.5">
          <span class="w-3 h-1.5 rounded-full bg-red-400 inline-block"></span>Despesas
        </span>
      </div>
    </div>

    <div class="rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="pb-3 border-b mb-4" [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Saldo por Tipo</h3>
        <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Distribuição das contas</p>
      </div>
      <div class="flex flex-col gap-2">
        <div *ngFor="let bt of dash()!.balance_by_type; let i=index"
             class="flex justify-between items-center p-2.5 rounded-xl border"
             [class]="theme.isDark() ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-200'">
          <div class="flex items-center gap-2 text-[10px] font-mono">
            <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="typeColors[i % typeColors.length]"></span>
            <span [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-600'">{{ accountTypeLabel(bt.type) }}</span>
          </div>
          <span class="text-xs font-bold font-mono" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            {{ bt.total | money }}
          </span>
        </div>
        <div *ngIf="!dash()!.balance_by_type.length" class="py-6 text-center text-xs text-slate-500">
          Sem contas registadas
        </div>
      </div>
    </div>
  </div>

  <!-- ════════════════════════════════════════════════════════════ -->
  <!-- MERCADO DE CRIPTOMOEDAS — CoinGecko API (free, no API key) -->
  <!-- ════════════════════════════════════════════════════════════ -->
  <div class="rounded-2xl border mb-8"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">

    <!-- Header -->
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between p-5 border-b gap-3"
         [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
      <div>
        <h3 class="text-sm font-bold flex items-center gap-2" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          Mercado de Criptomoedas
          <span class="text-[9px] font-mono px-2 py-0.5 rounded-full animate-pulse"
                [class]="theme.isDark() ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'">
            ● Live · CoinGecko
          </span>
        </h3>
        <p class="text-[10px] mt-0.5" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Clique num activo para ver o gráfico em tempo real. Actualiza a cada 60s.
        </p>
      </div>
      <!-- Coin selector -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button *ngFor="let sym of availableCoins"
                (click)="selectCoin(sym)"
                class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all"
                [class]="selectedCoin() === sym
                  ? (theme.isDark() ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white')
                  : (theme.isDark() ? 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900')">
          {{ sym }}
        </button>
      </div>
    </div>

    <div class="p-5">
      <!-- Selected coin detail + real-time chart -->
      <div *ngIf="selectedQuote()" class="mb-5">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                 [class]="theme.isDark() ? 'bg-amber-500/15 text-amber-500' : 'bg-blue-50 text-blue-600'">
              {{ selectedQuote()!.symbol.substring(0,2) }}
            </div>
            <div>
              <h4 class="text-lg font-black" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
                {{ selectedQuote()!.name }}
                <span class="text-sm font-mono ml-1" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
                  {{ selectedQuote()!.symbol }}
                </span>
              </h4>
              <div class="flex items-center gap-2 text-xs font-mono">
                <span class="font-black text-xl" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
                  $ {{ selectedQuote()!.price | number:'1.2-6' }}
                </span>
                <span class="font-bold px-1.5 py-0.5 rounded text-[10px]"
                      [class]="selectedQuote()!.changePercent >= 0
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'">
                  {{ selectedQuote()!.changePercent >= 0 ? '+' : '' }}{{ selectedQuote()!.changePercent | number:'1.2-2' }}%
                </span>
              </div>
            </div>
          </div>
          <!-- Stats row -->
          <div class="flex gap-4 text-[10px] font-mono">
            <div class="text-center">
              <p [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Máx 24h</p>
              <p class="font-bold text-emerald-400">$ {{ selectedQuote()!.high24h | number:'1.2-4' }}</p>
            </div>
            <div class="text-center">
              <p [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Mín 24h</p>
              <p class="font-bold text-red-400">$ {{ selectedQuote()!.low24h | number:'1.2-4' }}</p>
            </div>
            <div class="text-center">
              <p [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Volume</p>
              <p class="font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">$ {{ formatBig(selectedQuote()!.volume) }}</p>
            </div>
            <div class="text-center">
              <p [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Mkt Cap</p>
              <p class="font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">$ {{ formatBig(selectedQuote()!.marketCap ?? 0) }}</p>
            </div>
          </div>
          <!-- Period buttons -->
          <div class="flex gap-1">
            <button *ngFor="let p of chartPeriods" (click)="setChartPeriod(p.days)"
                    class="px-2.5 py-1 rounded text-[10px] font-mono transition-all"
                    [class]="chartDays() === p.days
                      ? (theme.isDark() ? 'bg-amber-500 text-black font-bold' : 'bg-blue-600 text-white font-bold')
                      : (theme.isDark() ? 'bg-slate-950 border border-slate-800 text-slate-500 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-900')">
              {{ p.label }}
            </button>
          </div>
        </div>

        <!-- REAL-TIME CHART via CoinGecko market_chart API -->
        <div class="relative h-52 w-full rounded-xl border overflow-hidden"
             [class]="theme.isDark() ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
          <div *ngIf="loadingChart()" class="absolute inset-0 flex items-center justify-center">
            <div class="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                 [class]="theme.isDark() ? 'border-amber-500' : 'border-blue-600'"></div>
          </div>
          <svg *ngIf="!loadingChart() && chartPrices().length > 1"
               viewBox="0 0 500 170" class="w-full h-full select-none">
            <defs>
              <linearGradient id="cgGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"
                      [attr.stop-color]="selectedQuote()!.changePercent >= 0 ? '#34d399' : '#f87171'"
                      stop-opacity="0.2"/>
                <stop offset="100%"
                      [attr.stop-color]="selectedQuote()!.changePercent >= 0 ? '#34d399' : '#f87171'"
                      stop-opacity="0"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="40"  x2="500" y2="40"  stroke="#1e293b" stroke-width="0.6" stroke-dasharray="3"/>
            <line x1="0" y1="85"  x2="500" y2="85"  stroke="#1e293b" stroke-width="0.6" stroke-dasharray="3"/>
            <line x1="0" y1="130" x2="500" y2="130" stroke="#1e293b" stroke-width="0.6" stroke-dasharray="3"/>
            <path [attr.d]="market.buildChartPath(chartPrices(), 500, 148, true)"
                  fill="url(#cgGrad)"/>
            <path [attr.d]="market.buildChartPath(chartPrices(), 500, 148, false)"
                  fill="none"
                  [attr.stroke]="selectedQuote()!.changePercent >= 0 ? '#34d399' : '#f87171'"
                  stroke-width="2"
                  stroke-linecap="round"/>
            <text *ngFor="let lbl of chartLabelsDisplay(); let i=index"
                  [attr.x]="(i / (chartLabelsDisplay().length - 1 || 1)) * 480 + 10"
                  y="165" fill="#475569" font-size="8" font-family="monospace" text-anchor="middle">
              {{ lbl }}
            </text>
          </svg>
          <div *ngIf="!loadingChart() && chartPrices().length <= 1"
               class="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
            Dados indisponíveis
          </div>
        </div>
      </div>

      <!-- Coin cards grid with sparklines -->
      <div *ngIf="loadingCrypto()" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div *ngFor="let i of [1,2,3,4]" class="h-24 rounded-xl animate-pulse"
             [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'"></div>
      </div>

      <div *ngIf="!loadingCrypto() && cryptos().length" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <button *ngFor="let c of cryptos()"
                (click)="selectCoin(c.symbol)"
                class="p-3 rounded-xl border text-left transition-all w-full cursor-pointer"
                [class]="selectedCoin() === c.symbol
                  ? (theme.isDark() ? 'border-amber-500/50 bg-amber-500/5' : 'border-blue-400/50 bg-blue-50')
                  : (theme.isDark() ? 'border-slate-800 bg-slate-950/40 hover:border-slate-700' : 'border-slate-200 bg-slate-50 hover:border-slate-300')">
          <div class="flex justify-between items-center mb-1">
            <span class="text-[11px] font-mono font-black" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ c.symbol }}</span>
            <span class="text-[9px] font-mono font-bold"
                  [class]="c.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'">
              {{ c.changePercent >= 0 ? '+' : '' }}{{ c.changePercent | number:'1.1-2' }}%
            </span>
          </div>
          <p class="text-xs font-black font-mono mb-1.5" [class]="theme.isDark() ? 'text-slate-200' : 'text-slate-700'">
            $ {{ c.price | number:'1.2-2' }}
          </p>
          <!-- 7-day sparkline from CoinGecko -->
          <svg viewBox="0 0 120 32" class="w-full h-7">
            <path *ngIf="c.chartData.length > 1"
                  [attr.d]="market.buildSparklinePath(c.chartData.slice(-50), 120, 32)"
                  fill="none"
                  [attr.stroke]="c.changePercent >= 0 ? '#34d399' : '#f87171'"
                  stroke-width="1.5"
                  stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Recent Transactions + Goals -->
  <div *ngIf="!loadingDash() && dash()" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent Transactions -->
    <div class="rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex items-center justify-between pb-3 border-b mb-4"
           [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Últimas Transações</h3>
        <a routerLink="/app/transactions"
           class="text-[10px] font-mono font-semibold"
           [class]="theme.isDark() ? 'text-amber-500 hover:text-amber-400' : 'text-blue-600 hover:text-blue-700'">
          Ver todas →
        </a>
      </div>
      <div class="flex flex-col gap-2.5">
        <div *ngFor="let tx of dash()!.recent_transactions"
             class="flex justify-between items-center p-3 rounded-xl border transition-all"
             [class]="theme.isDark() ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' : 'bg-slate-50 border-slate-100 hover:border-slate-200'">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 [class]="tx.type==='income' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  [attr.d]="tx.type==='income' ? 'M7 17l9.2-9.2M17 17V7H7' : 'M17 7l-9.2 9.2M7 7v10h10'"/>
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold truncate max-w-[140px]"
                 [class]="theme.isDark() ? 'text-slate-200' : 'text-slate-800'">
                {{ tx.description || 'Sem descrição' }}
              </p>
              <p class="text-[9px] font-mono" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
                {{ tx.transaction_date }} · {{ tx.category_name }}
              </p>
            </div>
          </div>
          <span class="text-xs font-black font-mono flex-shrink-0"
                [class]="tx.type==='income' ? 'text-emerald-400' : 'text-amber-500'">
            {{ tx.type==='income' ? '+' : '-' }}{{ tx.amount | money }}
          </span>
        </div>
        <div *ngIf="!dash()!.recent_transactions.length"
             class="py-8 text-center text-xs text-slate-500">
          Sem transações recentes
        </div>
      </div>
    </div>

    <!-- Goals -->
    <div class="rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex items-center justify-between pb-3 border-b mb-4"
           [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Progresso das Metas</h3>
        <a routerLink="/app/goals"
           class="text-[10px] font-mono font-semibold"
           [class]="theme.isDark() ? 'text-amber-500 hover:text-amber-400' : 'text-blue-600 hover:text-blue-700'">
          Ver todas →
        </a>
      </div>
      <div class="flex flex-col gap-4">
        <div *ngFor="let g of dash()!.goals">
          <div class="flex justify-between items-center mb-1.5">
            <span class="text-xs font-semibold truncate pr-2"
                  [class]="theme.isDark() ? 'text-slate-200' : 'text-slate-800'">{{ g.title }}</span>
            <span class="text-[10px] font-mono font-bold flex-shrink-0"
                  [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">
              {{ g.progress_pct }}%
            </span>
          </div>
          <div class="h-1.5 rounded-full overflow-hidden"
               [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'">
            <div class="h-full rounded-full transition-all duration-700"
                 [style.width.%]="g.progress_pct"
                 [class]="g.progress_pct >= 100 ? 'bg-emerald-500' : (theme.isDark() ? 'bg-amber-500' : 'bg-blue-600')">
            </div>
          </div>
          <div class="flex justify-between text-[9px] font-mono mt-1"
               [class]="theme.isDark() ? 'text-slate-600' : 'text-slate-400'">
            <span>{{ g.current_amount | money }}</span>
            <span>{{ g.target_amount | money }}</span>
          </div>
        </div>
        <div *ngIf="!dash()!.goals.length" class="py-8 text-center text-xs text-slate-500">
          Sem metas definidas
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class DashboardComponent implements OnInit, OnDestroy {
  auth    = inject(AuthService);
  theme   = inject(ThemeService);
  market  = inject(MarketService);
  private dashSvc  = inject(DashboardService);
  private destroy$ = new Subject<void>();

  dash          = signal<DashboardSummary | null>(null);
  loadingDash   = signal(true);
  cryptos       = signal<AssetQuote[]>([]);
  loadingCrypto = signal(true);
  selectedCoin  = signal('BTC');
  selectedQuote = signal<AssetQuote | null>(null);
  chartPrices   = signal<number[]>([]);
  chartLabels   = signal<string[]>([]);
  loadingChart  = signal(false);
  chartDays     = signal(7);

  typeColors     = ['#f59e0b','#34d399','#60a5fa','#a78bfa','#f87171'];
  availableCoins = DEFAULT_CRYPTOS;
  chartPeriods   = [
    { label:'24h', days:1 },
    { label:'7d',  days:7 },
    { label:'30d', days:30 },
    { label:'90d', days:90 },
  ];

  ngOnInit(): void {
    // Dashboard data from backend
    this.dashSvc.summary().subscribe({
      next: r => { if (r.success) this.dash.set(r.data); this.loadingDash.set(false); },
      error: () => this.loadingDash.set(false)
    });

    // Crypto prices: auto-refresh every 60s via CoinGecko
    interval(60000).pipe(
      startWith(0),
      switchMap(() => this.market.getCryptoPrices(DEFAULT_CRYPTOS)),
      takeUntil(this.destroy$)
    ).subscribe(data => {
      this.cryptos.set(data);
      this.loadingCrypto.set(false);
      const found = data.find(c => c.symbol === this.selectedCoin());
      if (found) this.selectedQuote.set(found);
    });

    this.loadChart();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  selectCoin(sym: string): void {
    this.selectedCoin.set(sym);
    const found = this.cryptos().find(c => c.symbol === sym);
    if (found) this.selectedQuote.set(found);
    this.loadChart();
  }

  setChartPeriod(days: number): void { this.chartDays.set(days); this.loadChart(); }

  loadChart(): void {
    this.loadingChart.set(true);
    this.market.getCryptoChart(this.selectedCoin(), this.chartDays()).subscribe(data => {
      this.chartPrices.set(data.prices);
      this.chartLabels.set(data.labels);
      this.loadingChart.set(false);
    });
  }

  chartLabelsDisplay(): string[] {
    const all = this.chartLabels();
    if (all.length <= 6) return all;
    const step = Math.floor(all.length / 5);
    return [0,1,2,3,4,5].map(i => all[Math.min(i * step, all.length - 1)]);
  }

  evoPath(data: any[], key: 'income'|'expense', w: number, h: number, area: boolean): string {
    if (!data.length) return '';
    const last6 = data.slice(-6);
    const max   = Math.max(...last6.map((d: any) => Math.max(d.income, d.expense)), 1);
    const step  = w / (last6.length - 1 || 1);
    const pts   = last6.map((d: any, i: number) => {
      const x = i * step;
      const y = h - (d[key] / max) * (h - 20);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
    return area ? `${pts} L${w} ${h} L0 ${h} Z` : pts;
  }

  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  }
  firstName(): string { return this.auth.currentUser()?.name?.split(' ')[0] ?? ''; }
  currentMonth(): string { return new Date().toLocaleDateString('pt', { month:'long', year:'numeric' }); }
  accountTypeLabel(t: string): string {
    const m: Record<string,string> = {
      wallet:'Carteira', bank:'Banco', savings:'Poupança',
      credit_card:'Cartão', investment:'Investimento'
    };
    return m[t] ?? t;
  }
  formatBig(n: number): string {
    if (n >= 1e9) return (n/1e9).toFixed(1) + 'B';
    if (n >= 1e6) return (n/1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n/1e3).toFixed(0) + 'K';
    return n.toFixed(0);
  }
}
