import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, BudgetService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CategorySummary, MonthlyEvolution, Budget } from '../../core/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe, DecimalPipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">

  <!-- Header -->
  <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Relatórios Analíticos</h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Relatórios de progresso em formato de auditoria financeira.
      </p>
    </div>
    <button (click)="exportCSV()"
            class="inline-flex items-center gap-2 border text-xs font-bold px-4 py-3 rounded-xl transition-all"
            [class]="theme.isDark() ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'">
      <svg class="w-4 h-4 text-amber-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
      </svg>
      Exportar CSV
    </button>
  </div>

  <!-- Period selector -->
  <div class="flex items-center gap-3 mb-6 flex-wrap">
    <label class="label">Período:</label>
    <div class="flex gap-2">
      <button *ngFor="let m of periodOptions" (click)="setPeriod(m.months)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              [class]="selectedMonths === m.months
                ? (theme.isDark() ? 'bg-amber-500 text-black font-bold' : 'bg-blue-600 text-white font-bold')
                : (theme.isDark() ? 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-900')">
        {{ m.label }}
      </button>
    </div>
  </div>

  <!-- KPI Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="p-5 rounded-2xl border relative overflow-hidden"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">Margem de Lucro Nominal</span>
      <h2 class="text-2xl font-black mt-3 text-emerald-400">
        +{{ profitMargin() | number:'1.1-1' }}%
      </h2>
      <p class="text-[10px] font-mono mt-3 flex items-center gap-1"
         [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Renda excedeu despesas em
        <span class="font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
          {{ totalIncome() - totalExpense() | money }}
        </span>
      </p>
    </div>

    <div class="p-5 rounded-2xl border"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">Despesa Consolidada</span>
      <h2 class="text-2xl font-black mt-3" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        {{ totalExpense() | money }}
      </h2>
      <p class="text-[10px] font-mono mt-3" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Últimos {{ selectedMonths }} meses
      </p>
    </div>

    <div class="p-5 rounded-2xl border"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">Taxa de Poupança</span>
      <div class="flex justify-between items-baseline mt-3">
        <h2 class="text-2xl font-black text-amber-500">{{ savingsRate() | number:'1.1-1' }}%</h2>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded border font-bold"
              [class]="savingsRate() >= 20 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'">
          {{ savingsRate() >= 20 ? 'Excelente' : 'Atenção' }}
        </span>
      </div>
      <p class="text-[9px] mt-3 leading-normal" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        Meta recomendada: 20% da renda
      </p>
    </div>
  </div>

  <!-- Evolution Chart -->
  <div class="rounded-2xl border p-6 mb-8"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b mb-6 gap-3"
         [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
      <div>
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Receita Bruta vs. Despesas</h3>
        <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Evolução do faturamento versus obrigações</p>
      </div>
      <div class="flex items-center gap-4 text-[10px] font-mono font-semibold">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 bg-emerald-400 rounded-full"></span>
          <span [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-600'">Receitas</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
          <span [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-600'">Despesas</span>
        </div>
      </div>
    </div>

    <div class="h-56 w-full relative">
      <svg *ngIf="evolution().length > 0" viewBox="0 0 550 200" class="w-full h-full select-none">
        <defs>
          <linearGradient id="rIncGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#34d399" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#34d399" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="rExpGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.1"/>
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="40"  x2="550" y2="40"  stroke="#1e293b" stroke-width="0.8" stroke-dasharray="3"/>
        <line x1="0" y1="100" x2="550" y2="100" stroke="#1e293b" stroke-width="0.8" stroke-dasharray="3"/>
        <line x1="0" y1="160" x2="550" y2="160" stroke="#1e293b" stroke-width="0.8" stroke-dasharray="3"/>

        <path [attr.d]="areaPath('income', 550, 180)" fill="url(#rIncGrad)"/>
        <path [attr.d]="linePath('income', 550, 180)" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round"/>

        <path [attr.d]="areaPath('expense', 550, 180)" fill="url(#rExpGrad)"/>
        <path [attr.d]="linePath('expense', 550, 180)" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>

        <!-- Month labels -->
        <text *ngFor="let e of evolution(); let i=index"
              [attr.x]="getX(i, evolution().length, 550)"
              y="196" fill="#475569" font-size="8" font-family="monospace" text-anchor="middle">
          {{ e.month | slice:5:7 }}/{{ e.month | slice:2:4 }}
        </text>
      </svg>

      <div *ngIf="evolution().length === 0"
           class="absolute inset-0 flex flex-col items-center justify-center text-slate-600 gap-2">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
        </svg>
        <p class="text-xs">Sem dados de evolução disponíveis</p>
      </div>
    </div>
  </div>

  <!-- Bottom two columns -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <!-- Budget distribution bars -->
    <div class="rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <h3 class="text-sm font-bold border-b pb-2 mb-4"
          [class]="theme.isDark() ? 'text-white border-slate-800' : 'text-slate-900 border-slate-100'">
        Distribuição de Despesas por Rubrica
      </h3>
      <p class="text-[10px] mb-5" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Visão da distribuição de gastos em relação ao limite alocado.
      </p>

      <div *ngIf="budgets().length > 0" class="flex flex-col gap-4">
        <div *ngFor="let b of budgets()" class="flex flex-col gap-1.5 text-xs font-mono">
          <div class="flex justify-between items-center">
            <span [class]="theme.isDark() ? 'text-slate-300 font-semibold' : 'text-slate-700 font-semibold'">{{ b.category_name }}</span>
            <span [class]="theme.isDark() ? 'text-white font-bold' : 'text-slate-900 font-bold'">{{ b.percentage | number:'1.0-0' }}% Utilizado</span>
          </div>
          <div class="h-2 w-full rounded-full overflow-hidden border"
               [class]="theme.isDark() ? 'bg-slate-950 border-slate-900' : 'bg-slate-100 border-slate-200'">
            <div class="h-full rounded-full transition-all duration-500"
                 [style.width.%]="min100(b.percentage)"
                 [class]="b.percentage > 100 ? 'bg-red-500' : b.percentage > 85 ? 'bg-amber-500' : 'bg-emerald-400'"></div>
          </div>
        </div>
      </div>

      <div *ngIf="budgets().length === 0 && !loading()"
           class="py-8 text-center text-xs" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        Sem orçamentos definidos para este mês
      </div>

      <div *ngIf="loading()" class="flex flex-col gap-3">
        <div *ngFor="let i of [1,2,3]" class="h-8 rounded animate-pulse"
             [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'"></div>
      </div>
    </div>

    <!-- Monthly audit table -->
    <div class="rounded-2xl border p-5"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <div class="flex justify-between items-center border-b pb-2 mb-4"
           [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
        <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Relação Analítica de Competências</h3>
        <span class="text-[10px] font-mono" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">{{ currentYear() }}</span>
      </div>

      <div class="flex flex-col gap-3 text-xs font-mono">
        <div *ngFor="let row of monthlyAudit()"
             class="flex justify-between items-center p-3 rounded-xl border transition-all"
             [class]="theme.isDark() ? 'bg-slate-950/40 border-slate-900 hover:border-slate-800' : 'bg-slate-50 border-slate-100 hover:border-slate-200'">
          <div>
            <h4 class="font-bold" [class]="theme.isDark() ? 'text-slate-200' : 'text-slate-800'">{{ row.month }}</h4>
            <span class="text-[9px]" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
              Status: <strong [class]="row.closed ? (theme.isDark() ? 'text-slate-400' : 'text-slate-600') : 'text-emerald-400'">
                {{ row.closed ? 'Fechado' : 'Aberto' }}
              </strong>
            </span>
          </div>
          <div class="text-right">
            <div class="text-emerald-400 font-extrabold">{{ row.income | money }}</div>
            <div class="text-[10px] font-semibold" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
              Custo: {{ row.expense | money }}
            </div>
          </div>
        </div>

        <div *ngIf="evolution().length === 0 && !loading()"
             class="py-8 text-center" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
          Sem dados disponíveis
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class ReportsComponent implements OnInit {
  theme = inject(ThemeService);
  private txSvc     = inject(TransactionService);
  private budgetSvc = inject(BudgetService);

  evolution  = signal<MonthlyEvolution[]>([]);
  budgets    = signal<Budget[]>([]);
  loading    = signal(true);
  selectedMonths = 12;

  periodOptions = [
    { label: '3M',  months: 3  },
    { label: '6M',  months: 6  },
    { label: '12M', months: 12 },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.txSvc.evolution(this.selectedMonths).subscribe(r => {
      if (r.success) this.evolution.set(r.data);
      this.loading.set(false);
    });
    this.budgetSvc.list(new Date().toISOString().substring(0,7)).subscribe(r => {
      if (r.success) this.budgets.set(r.data as Budget[]);
    });
  }

  setPeriod(m: number): void { this.selectedMonths = m; this.load(); }

  totalIncome(): number  { return this.evolution().reduce((s,e) => s + e.income, 0); }
  totalExpense(): number { return this.evolution().reduce((s,e) => s + e.expense, 0); }
  profitMargin(): number {
    const i = this.totalIncome();
    return i > 0 ? ((i - this.totalExpense()) / i) * 100 : 0;
  }
  savingsRate(): number {
    const i = this.totalIncome();
    return i > 0 ? ((i - this.totalExpense()) / i) * 100 : 0;
  }
  currentYear(): string { return new Date().getFullYear().toString(); }
  min100(v:number):number { return Math.min(100, v); }

  monthlyAudit(): {month:string;income:number;expense:number;closed:boolean}[] {
    const now = new Date();
    return this.evolution().slice().reverse().map(e => ({
      month: this.formatMonth(e.month),
      income: e.income,
      expense: e.expense,
      closed: e.month < now.toISOString().substring(0,7)
    }));
  }

  formatMonth(ym: string): string {
    const [y,m] = ym.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${months[parseInt(m)-1]} ${y}`;
  }

  getX(i:number, total:number, w:number): number {
    if (total <= 1) return w/2;
    return (i / (total-1)) * (w - 20) + 10;
  }

  linePath(key:'income'|'expense', w:number, h:number): string {
    const data = this.evolution();
    if (!data.length) return '';
    const max = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
    return data.map((d,i) => {
      const x = this.getX(i, data.length, w);
      const y = h - (d[key] / max) * (h - 30);
      return (i===0?'M':'L') + `${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }

  areaPath(key:'income'|'expense', w:number, h:number): string {
    const line = this.linePath(key, w, h);
    if (!line) return '';
    return `${line} L${w-10} ${h} L10 ${h} Z`;
  }

  exportCSV(): void {
    const data = this.evolution();
    if (!data.length) return;
    const rows = [['Mês','Receitas','Despesas','Saldo']];
    data.forEach(e => rows.push([e.month, e.income.toString(), e.expense.toString(), (e.income-e.expense).toString()]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `relatorio_${new Date().toISOString().substring(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }
}
