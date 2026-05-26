import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, interval, switchMap, takeUntil, startWith } from 'rxjs';
import { ThemeService } from '../../core/services/theme.service';
import { MarketService, AssetQuote } from '../../core/services/market.service';

// ─── Local asset model (stored in memory/localStorage) ───────────────────────
export interface PortfolioAsset {
  symbol:       string;
  name:         string;
  quantity:     number;
  averagePrice: number;
  currentPrice: number;
  type:         'Acções' | 'FIIs' | 'Crypto' | 'Internacional' | 'Outros';
}

const STORAGE_KEY = 'finstruct_portfolio';

const DEFAULT_ASSETS: PortfolioAsset[] = [
  { symbol:'BTC',    name:'Bitcoin',                quantity:0.5,   averagePrice:55000, currentPrice:0, type:'Crypto' },
  { symbol:'ETH',    name:'Ethereum',               quantity:2,     averagePrice:3000,  currentPrice:0, type:'Crypto' },
  { symbol:'BNB',    name:'Binance Coin',            quantity:5,     averagePrice:420,   currentPrice:0, type:'Crypto' },
  { symbol:'SOL',    name:'Solana',                  quantity:10,    averagePrice:140,   currentPrice:0, type:'Crypto' },
];

const TYPE_COLORS: Record<string, string> = {
  'Crypto':'#f59e0b', 'Acções':'#34d399', 'FIIs':'#60a5fa',
  'Internacional':'#a78bfa', 'Outros':'#64748b',
};

@Component({
  selector: 'app-investments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'bg-black text-slate-100' : 'bg-slate-50 text-slate-900'">

  <!-- Header -->
  <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        Gestão de Investimentos
      </h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Bem-vindo de volta, carteira de custódia com cotação em tempo real via CoinGecko.
      </p>
    </div>
    <div class="flex items-center gap-2">
      <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono"
           [class]="theme.isDark() ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'">
        <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
        Sincronização CoinGecko · 60s
      </div>
      <button (click)="openAddModal()"
              class="inline-flex items-center gap-2 font-bold text-xs px-4 py-3 rounded-xl transition-all"
              [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
        </svg>
        Novo Activo
      </button>
    </div>
  </div>

  <!-- Success alert -->
  <div *ngIf="successMsg()"
       class="p-3 rounded-xl border mb-6 text-xs flex items-center gap-2 bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-fade-in">
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    {{ successMsg() }}
  </div>

  <!-- ─── KPI Cards ──────────────────────────────────────────────────────── -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <!-- Patrimônio Total -->
    <div class="p-6 rounded-2xl border relative overflow-hidden"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-full"></div>
      <div class="flex justify-between items-start">
        <div>
          <span class="label">Patrimônio Global Consolidado</span>
          <h2 class="text-2xl md:text-3xl font-black mt-2" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            $ {{ totalValue() | number:'1.2-2' }}
          </h2>
        </div>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
             [class]="theme.isDark() ? 'bg-amber-500/15 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
      </div>
      <div class="flex items-center gap-1.5 mt-4 text-[10px] font-mono">
        <span class="font-bold" [class]="absoluteReturn() >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ absoluteReturn() >= 0 ? '↑' : '↓' }} {{ returnPercent() | number:'1.2-2' }}%
        </span>
        <span [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
          sobre custo médio ($ {{ totalCost() | number:'1.2-2' }})
        </span>
      </div>
    </div>

    <!-- Rentabilidade -->
    <div class="p-6 rounded-2xl border"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex justify-between items-start">
        <div>
          <span class="label">Resultado Acumulado</span>
          <h2 class="text-2xl md:text-3xl font-black mt-2"
              [class]="absoluteReturn() >= 0 ? 'text-emerald-400' : 'text-red-400'">
            {{ absoluteReturn() >= 0 ? '+' : '' }} $ {{ absoluteReturn() | number:'1.2-2' }}
          </h2>
        </div>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
             [class]="absoluteReturn() >= 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'">
          <svg class="w-4 h-4" [class]="absoluteReturn() >= 0 ? 'text-emerald-400' : 'text-red-400'"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              [attr.d]="absoluteReturn() >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'"/>
          </svg>
        </div>
      </div>
      <p class="text-[10px] font-mono mt-4" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        {{ assets().length }} activos em carteira
      </p>
    </div>

    <!-- Activos -->
    <div class="p-6 rounded-2xl border"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex justify-between items-start">
        <div>
          <span class="label">Activos em Custódia</span>
          <h2 class="text-2xl md:text-3xl font-black mt-2" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            {{ assets().length }}
          </h2>
        </div>
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
             [class]="theme.isDark() ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100 border border-slate-200'">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
          </svg>
        </div>
      </div>
      <p class="text-[10px] font-mono mt-4" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        Crypto · Acções · FIIs
      </p>
    </div>
  </div>

  <!-- ─── Charts Row: Evolução + Alocação ──────────────────────────────── -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

    <!-- Evolução patrimonial SVG -->
    <div class="lg:col-span-2 rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex items-center justify-between pb-3 border-b mb-4"
           [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <div>
          <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            Evolução do Patrimônio Consecutivo
          </h3>
          <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
            Desempenho consolidado do portfólio e derivativos.
          </p>
        </div>
        <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
              [class]="theme.isDark() ? 'text-amber-500 bg-amber-500/5 border-amber-500/10' : 'text-blue-600 bg-blue-50 border-blue-200'">
          Histórico de 6M
        </span>
      </div>
      <div class="h-56 w-full pt-2">
        <svg viewBox="0 0 500 200" class="w-full h-full select-none">
          <defs>
            <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" [attr.stop-color]="theme.isDark() ? '#f59e0b' : '#3b82f6'" stop-opacity="0.15"/>
              <stop offset="100%" [attr.stop-color]="theme.isDark() ? '#f59e0b' : '#3b82f6'" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line x1="0" y1="40"  x2="500" y2="40"  stroke="#1e293b" stroke-width="0.8" stroke-dasharray="3"/>
          <line x1="0" y1="90"  x2="500" y2="90"  stroke="#1e293b" stroke-width="0.8" stroke-dasharray="3"/>
          <line x1="0" y1="140" x2="500" y2="140" stroke="#1e293b" stroke-width="0.8" stroke-dasharray="3"/>
          <!-- Static decorative curve (representative of portfolio growth) -->
          <path d="M 10 160 Q 90 140, 100 135 T 200 110 T 300 120 T 400 85 T 490 50 L 490 190 L 10 190 Z"
                fill="url(#invGrad)"/>
          <path d="M 10 160 Q 90 140, 100 135 T 200 110 T 300 120 T 400 85 T 490 50"
                fill="none"
                [attr.stroke]="theme.isDark() ? '#f59e0b' : '#3b82f6'"
                stroke-width="2.5" stroke-linecap="round"/>
          <!-- Pulsing current point -->
          <circle cx="490" cy="50" r="4.5" [attr.fill]="theme.isDark() ? '#f59e0b' : '#3b82f6'" class="animate-pulse"/>
          <circle cx="200" cy="110" r="3.5" fill="#1e293b"
                  [attr.stroke]="theme.isDark() ? '#f59e0b' : '#3b82f6'" stroke-width="1.5"/>
          <!-- Month labels -->
          <text x="10"  y="195" fill="#64748b" font-size="8" font-family="monospace">Dez</text>
          <text x="100" y="195" fill="#64748b" font-size="8" font-family="monospace">Jan</text>
          <text x="200" y="195" fill="#64748b" font-size="8" font-family="monospace">Fev</text>
          <text x="300" y="195" fill="#64748b" font-size="8" font-family="monospace">Mar</text>
          <text x="400" y="195" fill="#64748b" font-size="8" font-family="monospace">Abr</text>
          <text x="452" y="195" [attr.fill]="theme.isDark() ? '#f59e0b' : '#3b82f6'"
                font-size="8" font-family="monospace" font-weight="bold">Mai (Actual)</text>
        </svg>
      </div>
    </div>

    <!-- Doughnut allocation chart -->
    <div class="rounded-2xl border p-5 flex flex-col"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="pb-3 border-b mb-3" [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Alocação por Classe</h3>
        <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Distribuição percentual do portfólio</p>
      </div>

      <!-- SVG Doughnut -->
      <div class="flex justify-center items-center py-3 relative">
        <svg viewBox="0 0 120 120" class="w-28 h-28">
          <ng-container *ngFor="let seg of doughnutSegments(); let i=index">
            <circle cx="60" cy="60" r="45"
                    fill="transparent" stroke-width="10"
                    [attr.stroke]="seg.color"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                    transform="rotate(-90 60 60)"/>
          </ng-container>
          <!-- Background ring -->
          <circle cx="60" cy="60" r="45" fill="transparent"
                  [class]="theme.isDark() ? 'stroke-slate-800' : 'stroke-slate-200'"
                  stroke-width="10"
                  *ngIf="assets().length === 0"/>
        </svg>
        <div class="absolute flex flex-col items-center">
          <span class="text-[9px] font-mono tracking-widest uppercase" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">Activos</span>
          <span class="text-xs font-extrabold font-mono" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            {{ assets().length }}
          </span>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex flex-col gap-1.5 text-[10px] font-mono">
        <div *ngFor="let alloc of allocation()"
             class="flex justify-between items-center p-1.5 rounded-lg border"
             [class]="theme.isDark() ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-200'">
          <span class="flex items-center gap-1.5" [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-600'">
            <span class="w-2 h-2 rounded-full flex-shrink-0" [style.background]="alloc.color"></span>
            {{ alloc.type }}
          </span>
          <span class="font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            {{ alloc.percent | number:'1.0-0' }}%
          </span>
        </div>
        <div *ngIf="!allocation().length" class="py-4 text-center text-slate-500">
          Sem activos
        </div>
      </div>
    </div>
  </div>

  <!-- ─── Portfolio Table ───────────────────────────────────────────────── -->
  <div class="rounded-2xl border mb-8"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
    <div class="flex items-center justify-between p-5 border-b"
         [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
      <div>
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
          Carteira Activa de Custódia
        </h3>
        <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Activos registados com cotação actualizada em tempo real · CoinGecko API
        </p>
      </div>
      <span class="text-[10px] font-mono italic" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        Clique em Operar para simular aportes
      </span>
    </div>

    <!-- Loading -->
    <div *ngIf="loadingPrices()" class="p-8 flex items-center justify-center gap-2">
      <div class="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
           [class]="theme.isDark() ? 'border-amber-500' : 'border-blue-600'"></div>
      <span class="text-xs text-slate-500">A carregar cotações em tempo real...</span>
    </div>

    <div *ngIf="!loadingPrices()" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="border-b font-semibold"
              [class]="theme.isDark() ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-100'">
            <th class="py-3 px-5">Código</th>
            <th class="px-3">Activo</th>
            <th class="px-3">Quantidade</th>
            <th class="px-3">Custo Médio</th>
            <th class="px-3">Cotação Real</th>
            <th class="px-3">Ponto Crítico</th>
            <th class="px-3 text-right">Total Consolidado</th>
            <th class="px-5 text-right">Acção</th>
          </tr>
        </thead>
        <tbody class="divide-y" [class]="theme.isDark() ? 'divide-slate-800/60' : 'divide-slate-100'">
          <tr *ngFor="let asset of assets()"
              class="transition-all"
              [class]="theme.isDark() ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'">
            <!-- Symbol -->
            <td class="py-3.5 px-5">
              <span class="px-2 py-1 rounded border font-mono text-[10px] font-bold uppercase"
                    [class]="theme.isDark() ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'">
                {{ asset.symbol }}
              </span>
            </td>
            <!-- Name -->
            <td class="px-3 max-w-[140px] truncate"
                [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-600'">
              {{ asset.name }}
            </td>
            <!-- Qty -->
            <td class="px-3 font-mono" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-800'">
              {{ asset.quantity }} cotas
            </td>
            <!-- Avg Price -->
            <td class="px-3 font-mono" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
              $ {{ asset.averagePrice | number:'1.2-2' }}
            </td>
            <!-- Current Price -->
            <td class="px-3 font-mono font-semibold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
              $ {{ asset.currentPrice | number:'1.2-2' }}
            </td>
            <!-- Profit/Loss -->
            <td class="px-3">
              <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold"
                    [class]="profitPct(asset) >= 0
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'">
                {{ profitPct(asset) >= 0 ? '↑' : '↓' }}
                {{ profitPct(asset) >= 0 ? '+' : '' }}{{ profitPct(asset) | number:'1.1-1' }}%
              </span>
            </td>
            <!-- Total -->
            <td class="px-3 text-right font-mono font-black"
                [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-800'">
              $ {{ (asset.quantity * asset.currentPrice) | number:'1.2-2' }}
            </td>
            <!-- Actions -->
            <td class="px-5 text-right">
              <div class="inline-flex gap-1.5 justify-end">
                <button (click)="openTrade(asset, 'buy')"
                        class="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                        [class]="theme.isDark() ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black' : 'bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white'">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
                  </svg>
                  Comprar
                </button>
                <button (click)="openTrade(asset, 'sell')"
                        class="px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all border"
                        [class]="theme.isDark() ? 'bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border-slate-700' : 'bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 border-slate-200'">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20 12H4"/>
                  </svg>
                  Vender
                </button>
                <button (click)="removeAsset(asset.symbol)"
                        class="p-1 rounded transition-all text-slate-600 hover:text-red-400 hover:bg-red-500/10">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div *ngIf="!assets().length"
           class="py-16 text-center border-t"
           [class]="theme.isDark() ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'">
        <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <p class="text-sm font-semibold">Carteira vazia. Adicione activos para começar.</p>
      </div>
    </div>
  </div>
</div>

<!-- ─── Trade Modal ────────────────────────────────────────────────────────── -->
<div *ngIf="tradeAsset()" class="overlay items-center justify-center" (click)="closeTrade()">
  <div class="w-full max-w-sm p-6 rounded-3xl border shadow-2xl animate-zoom-in"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'"
       (click)="$event.stopPropagation()">
    <h3 class="text-base font-bold flex items-center gap-2 mb-2"
        [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
      <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      Negociar: {{ tradeAsset()!.symbol }}
    </h3>
    <p class="text-xs pb-4 border-b mb-4 leading-relaxed"
       [class]="theme.isDark() ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'">
      Aporte e liquidez simulados. Ajuste a quantidade para recalcular o custo médio do seu portfólio.
    </p>

    <!-- Buy/Sell toggle -->
    <div class="flex gap-2 p-1 rounded-xl border mb-4"
         [class]="theme.isDark() ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'">
      <button (click)="tradeType.set('buy')"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
              [class]="tradeType()==='buy'
                ? (theme.isDark() ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white')
                : (theme.isDark() ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')">
        Confirmar Compra
      </button>
      <button (click)="tradeType.set('sell')"
              class="flex-1 py-1.5 text-xs font-bold rounded-lg transition-all"
              [class]="tradeType()==='sell' ? 'bg-red-500 text-white' : (theme.isDark() ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')">
        Liquidar / Venda
      </button>
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="label">Quantidade de Cotas</label>
        <input type="number" [(ngModel)]="tradeQty" min="0.0001" step="0.0001"
               class="input-base font-mono"/>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Cotação Actual ($)</label>
        <input type="number" [(ngModel)]="tradePrice" min="0.01" step="0.01"
               class="input-base font-mono"/>
      </div>
      <!-- Summary -->
      <div class="p-3 rounded-xl border text-xs font-mono"
           [class]="theme.isDark() ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'">
        Total da operação:
        <strong [class]="theme.isDark() ? 'text-white ml-1' : 'text-slate-900 ml-1'">
          $ {{ (tradeQty * tradePrice) | number:'1.2-2' }}
        </strong>
      </div>

      <div class="flex gap-2.5 pt-1">
        <button (click)="closeTrade()"
                class="flex-1 border rounded-xl py-2.5 text-xs font-semibold transition-all"
                [class]="theme.isDark() ? 'border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-500'">
          Cancelar
        </button>
        <button (click)="executeTrade()"
                class="flex-1 rounded-xl py-2.5 text-xs font-bold transition-all"
                [class]="tradeType()==='buy'
                  ? (theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white')
                  : 'bg-red-500 hover:bg-red-400 text-white'">
          Registar Ordem
        </button>
      </div>
    </div>
  </div>
</div>

<!-- ─── Add Asset Modal ────────────────────────────────────────────────────── -->
<div *ngIf="addModal()" class="overlay items-center justify-center" (click)="addModal.set(false)">
  <div class="w-full max-w-sm p-6 rounded-3xl border shadow-2xl animate-zoom-in"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'"
       (click)="$event.stopPropagation()">
    <h3 class="text-base font-bold mb-4" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
      Adicionar Activo
    </h3>

    <div *ngIf="addError()" class="p-3 rounded-xl text-xs mb-4"
         [class]="theme.isDark() ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'">
      {{ addError() }}
    </div>

    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="label">Símbolo (ex: BTC, ETH, SOL)</label>
        <input type="text" [(ngModel)]="newAsset.symbol" placeholder="BTC"
               class="input-base uppercase font-mono"
               (input)="newAsset.symbol = newAsset.symbol.toUpperCase()"/>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Nome</label>
        <input type="text" [(ngModel)]="newAsset.name" placeholder="Bitcoin" class="input-base"/>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div class="flex flex-col gap-1.5">
          <label class="label">Quantidade</label>
          <input type="number" [(ngModel)]="newAsset.quantity" step="0.0001" min="0" class="input-base font-mono"/>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label">Custo Médio ($)</label>
          <input type="number" [(ngModel)]="newAsset.averagePrice" step="0.01" min="0" class="input-base font-mono"/>
        </div>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Tipo</label>
        <select [(ngModel)]="newAsset.type" class="input-base">
          <option value="Crypto">Crypto</option>
          <option value="Acções">Acções</option>
          <option value="FIIs">FIIs</option>
          <option value="Internacional">Internacional</option>
          <option value="Outros">Outros</option>
        </select>
      </div>
      <div class="flex gap-2.5 pt-1">
        <button (click)="addModal.set(false)"
                class="flex-1 border rounded-xl py-2.5 text-xs font-semibold"
                [class]="theme.isDark() ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'">
          Cancelar
        </button>
        <button (click)="addAsset()"
                class="flex-1 rounded-xl py-2.5 text-xs font-bold"
                [class]="theme.isDark() ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'">
          Adicionar
        </button>
      </div>
    </div>
  </div>
</div>
  `
})
export class InvestmentsComponent implements OnInit, OnDestroy {
  theme  = inject(ThemeService);
  market = inject(MarketService);
  private destroy$ = new Subject<void>();

  assets        = signal<PortfolioAsset[]>([]);
  loadingPrices = signal(true);
  tradeAsset    = signal<PortfolioAsset | null>(null);
  tradeType     = signal<'buy'|'sell'>('buy');
  addModal      = signal(false);
  addError      = signal('');
  successMsg    = signal('');

  tradeQty   = 1;
  tradePrice = 0;

  newAsset: PortfolioAsset = { symbol:'', name:'', quantity:1, averagePrice:0, currentPrice:0, type:'Crypto' };

  ngOnInit(): void {
    this.loadFromStorage();
    this.refreshPrices();
    // Auto-refresh every 60s
    interval(60000).pipe(takeUntil(this.destroy$)).subscribe(() => this.refreshPrices());
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.assets.set(raw ? JSON.parse(raw) : DEFAULT_ASSETS);
    } catch { this.assets.set(DEFAULT_ASSETS); }
  }

  private saveToStorage(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.assets()));
  }

  refreshPrices(): void {
    const syms = this.assets().map(a => a.symbol);
    if (!syms.length) { this.loadingPrices.set(false); return; }
    this.market.getCryptoPrices(syms).subscribe(quotes => {
      this.assets.update(list => list.map(a => {
        const q = quotes.find(c => c.symbol === a.symbol);
        return q ? { ...a, currentPrice: q.price } : a;
      }));
      this.saveToStorage();
      this.loadingPrices.set(false);
    });
  }

  // ─── Computed ────────────────────────────────────────────────────────────
  totalValue()    { return this.assets().reduce((s,a) => s + a.quantity * a.currentPrice, 0); }
  totalCost()     { return this.assets().reduce((s,a) => s + a.quantity * a.averagePrice,  0); }
  absoluteReturn(){ return this.totalValue() - this.totalCost(); }
  returnPercent() { const c = this.totalCost(); return c > 0 ? (this.absoluteReturn() / c) * 100 : 0; }
  profitPct(a: PortfolioAsset): number {
    const cost = a.quantity * a.averagePrice;
    return cost > 0 ? ((a.quantity * a.currentPrice - cost) / cost) * 100 : 0;
  }

  allocation(): { type:string; percent:number; color:string }[] {
    const total = this.totalValue() || 1;
    const groups: Record<string, number> = {};
    this.assets().forEach(a => {
      groups[a.type] = (groups[a.type] ?? 0) + a.quantity * a.currentPrice;
    });
    return Object.entries(groups).map(([type, value]) => ({
      type, percent: (value / total) * 100, color: TYPE_COLORS[type] ?? '#64748b'
    }));
  }

  doughnutSegments(): { dash: string; offset: string; color: string }[] {
    const circ   = 2 * Math.PI * 45; // circumference
    const allocs = this.allocation();
    let cumOffset = 0;
    return allocs.map(a => {
      const dash   = (a.percent / 100) * circ;
      const offset = -cumOffset;
      cumOffset   += dash;
      return { dash: `${dash} ${circ}`, offset: `${offset}`, color: a.color };
    });
  }

  // ─── Trade ───────────────────────────────────────────────────────────────
  openTrade(asset: PortfolioAsset, type: 'buy'|'sell'): void {
    this.tradeAsset.set(asset);
    this.tradeType.set(type);
    this.tradeQty   = 1;
    this.tradePrice = asset.currentPrice || asset.averagePrice;
  }

  closeTrade(): void { this.tradeAsset.set(null); }

  executeTrade(): void {
    const asset = this.tradeAsset();
    if (!asset) return;
    this.assets.update(list => list.map(a => {
      if (a.symbol !== asset.symbol) return a;
      if (this.tradeType() === 'buy') {
        const newQty     = a.quantity + this.tradeQty;
        const newAvgPrice = ((a.quantity * a.averagePrice) + (this.tradeQty * this.tradePrice)) / newQty;
        return { ...a, quantity: newQty, averagePrice: +newAvgPrice.toFixed(4) };
      } else {
        return { ...a, quantity: Math.max(0, a.quantity - this.tradeQty) };
      }
    }));
    this.saveToStorage();
    this.closeTrade();
    const msg = this.tradeType() === 'buy' ? 'Compra' : 'Venda';
    this.showSuccess(`Operação concluída: ${msg} de ${this.tradeQty} cotas de ${asset.symbol}!`);
  }

  // ─── Add / Remove ────────────────────────────────────────────────────────
  openAddModal(): void {
    this.newAsset = { symbol:'', name:'', quantity:1, averagePrice:0, currentPrice:0, type:'Crypto' };
    this.addError.set(''); this.addModal.set(true);
  }

  addAsset(): void {
    if (!this.newAsset.symbol || !this.newAsset.name) {
      this.addError.set('Símbolo e nome são obrigatórios.'); return;
    }
    const exists = this.assets().some(a => a.symbol === this.newAsset.symbol.toUpperCase());
    if (exists) { this.addError.set('Este símbolo já está na carteira.'); return; }
    const asset: PortfolioAsset = {
      symbol:       this.newAsset.symbol.toUpperCase(),
      name:         this.newAsset.name,
      quantity:     +this.newAsset.quantity,
      averagePrice: +this.newAsset.averagePrice,
      currentPrice: 0,
      type:         this.newAsset.type,
    };
    this.assets.update(list => [...list, asset]);
    this.saveToStorage();
    this.addModal.set(false);
    this.refreshPrices();
    this.showSuccess(`${asset.symbol} adicionado à carteira com sucesso!`);
  }

  removeAsset(symbol: string): void {
    if (!confirm(`Remover ${symbol} da carteira?`)) return;
    this.assets.update(list => list.filter(a => a.symbol !== symbol));
    this.saveToStorage();
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
