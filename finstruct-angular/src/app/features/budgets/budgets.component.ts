import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetService, CategoryService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Budget, Category } from '../../core/models';

@Component({
  selector: 'app-budgets',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">

  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Gestão de Orçamentos</h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Defina limites mensais de gastos por categoria</p>
    </div>
    <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-mono"
         [class]="theme.isDark() ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-blue-50 border-blue-200 text-blue-600'">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
      </svg>
      Alertas de 85% Activos
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">Orçamento Total Alocado</span>
      <div class="flex items-center justify-between mt-3">
        <span class="text-xl font-bold font-mono" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ totalLimit() | money }}</span>
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
             [class]="theme.isDark() ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100'">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">Gasto no Mês</span>
      <div class="flex items-center justify-between mt-3">
        <span class="text-xl font-bold font-mono" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ totalSpent() | money }}</span>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-md font-bold"
              [class]="totalProgress() > 100 ? 'bg-red-500/10 text-red-400' : (theme.isDark() ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-50 text-blue-600')">
          {{ totalProgress() | number:'1.1-1' }}% Usado
        </span>
      </div>
    </div>
    <div class="p-5 rounded-2xl border"
         [class]="remaining() < 0 ? 'border-red-500/30 shadow-lg shadow-red-500/5 ' + (theme.isDark() ? 'bg-slate-900' : 'bg-white')
                                  : (theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm')">
      <span class="label block">Saldo Restante</span>
      <span class="text-xl font-bold font-mono mt-3 block" [class]="remaining() < 0 ? 'text-red-400' : 'text-emerald-400'">
        {{ remaining() | money }}
      </span>
    </div>
  </div>

  <!-- Month selector -->
  <div class="flex items-center gap-3 mb-6">
    <label class="label">Mês:</label>
    <input type="month" [(ngModel)]="selectedMonth" (change)="loadBudgets()"
           class="input-base w-auto px-3 py-1.5"/>
  </div>

  <!-- Main Grid -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Budget Cards -->
    <div class="lg:col-span-2">
      <h3 class="text-sm font-bold border-b pb-2 mb-4"
          [class]="theme.isDark() ? 'text-white border-slate-800' : 'text-slate-900 border-slate-200'">
        Consumo por Categoria
      </h3>

      <div *ngIf="loading()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let i of [1,2,3,4]" class="h-40 rounded-2xl animate-pulse"
             [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'"></div>
      </div>

      <div *ngIf="!loading()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let b of budgets()"
             class="p-5 rounded-2xl border transition-all"
             [class]="b.over_budget
               ? (theme.isDark() ? 'bg-slate-900 border-red-500/30' : 'bg-white border-red-300 shadow-sm')
               : b.percentage >= 85
               ? (theme.isDark() ? 'bg-slate-900 border-amber-500/30' : 'bg-white border-amber-300 shadow-sm')
               : (theme.isDark() ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md')">

          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                   [class]="theme.isDark() ? 'bg-slate-950 border border-slate-800' : 'bg-slate-100'">
                <span class="text-amber-500">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </span>
              </div>
              <span class="text-xs font-bold" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-800'">{{ b.category_name }}</span>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
                    [class]="b.over_budget ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : b.percentage >= 85 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'">
                {{ b.over_budget ? 'Estourado!' : b.percentage >= 85 ? 'Alerta' : 'Regular' }}
              </span>
              <button (click)="deleteBudget(b.id)"
                      class="p-1 rounded transition-all text-slate-600 hover:text-red-400">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="mb-3">
            <div class="flex justify-between text-[10px] font-mono mb-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
              <span>Consumido</span><span>Limite</span>
            </div>
            <div class="flex justify-between font-mono">
              <span class="text-xs font-black" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-800'">{{ b.spent | money }}</span>
              <span class="text-[11px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ b.limit_amount | money }}</span>
            </div>
          </div>

          <div>
            <div class="flex justify-between text-[9px] font-mono mb-1" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
              <span>Proporção</span>
              <span [class]="b.over_budget ? 'text-red-400' : b.percentage >= 85 ? 'text-amber-400' : 'text-emerald-400'">
                {{ b.percentage | number:'1.0-0' }}%
              </span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden" [class]="theme.isDark() ? 'bg-slate-950 border border-slate-900' : 'bg-slate-100'">
              <div class="h-full rounded-full transition-all duration-500"
                   [style.width.%]="min100(b.percentage)"
                   [class]="b.over_budget ? 'bg-red-500' : b.percentage >= 85 ? 'bg-amber-500' : 'bg-emerald-500'"></div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading() && budgets().length === 0"
             class="col-span-2 py-12 text-center rounded-2xl border border-dashed"
             [class]="theme.isDark() ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'">
          <p class="text-sm">Sem orçamentos para este mês</p>
        </div>
      </div>
    </div>

    <!-- Right sidebar -->
    <div class="flex flex-col gap-6">
      <!-- Create Form -->
      <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
        <h3 class="text-xs font-bold uppercase tracking-wide mb-2 flex items-center gap-1.5"
            [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-700'">
          <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Novo Limite
        </h3>
        <p class="text-[10px] mb-4 leading-relaxed" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Associe limites mensais de consumo a categorias
        </p>

        <div *ngIf="formError()" class="p-2.5 rounded-lg text-[10px] mb-3 flex items-center gap-1"
             [class]="theme.isDark() ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 text-red-600'">
          {{ formError() }}
        </div>

        <form (ngSubmit)="createBudget()" class="flex flex-col gap-3">
          <div>
            <label class="label block mb-1">Categoria</label>
            <select [(ngModel)]="newForm.category_id" name="cat" required class="input-base">
              <option value="">Seleccione...</option>
              <option *ngFor="let c of expenseCategories()" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="label block mb-1">Limite Mensal</label>
            <input type="number" [(ngModel)]="newForm.limit_amount" name="limit" required step="0.01" min="1"
                   placeholder="0.00" class="input-base"/>
          </div>
          <button type="submit" [disabled]="saving()"
                  class="w-full font-bold text-xs py-2.5 rounded-xl transition-all mt-1 disabled:opacity-60"
                  [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/10 shadow-md' : 'bg-blue-600 hover:bg-blue-700 text-white'">
            Definir Limite
          </button>
        </form>
      </div>

      <!-- Alerts -->
      <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
        <h3 class="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5"
            [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-700'">
          <svg class="w-4 h-4 text-amber-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          Em Alerta Crítico
        </h3>
        <div *ngIf="criticalAlerts().length === 0"
             class="p-4 text-center text-[10px] border border-dashed rounded-xl"
             [class]="theme.isDark() ? 'border-slate-800 text-slate-500 bg-slate-950/20' : 'border-slate-200 text-slate-400'">
          Sem categorias em alerta. Ótima disciplina!
        </div>
        <div class="flex flex-col gap-2">
          <div *ngFor="let b of criticalAlerts()"
               class="p-3 rounded-xl border"
               [class]="theme.isDark() ? 'bg-slate-950 border-red-500/20' : 'bg-red-50 border-red-200'">
            <div class="flex justify-between items-center text-[10px]">
              <strong [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-800'">{{ b.category_name }}</strong>
              <span class="text-red-400 font-mono font-bold">{{ b.percentage | number:'1.0-0' }}%</span>
            </div>
            <p class="text-[9px] mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
              Gasto: <strong>{{ b.spent | money }}</strong> /
              <span [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-600'">{{ b.limit_amount | money }}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
  `
})
export class BudgetsComponent implements OnInit {
  theme   = inject(ThemeService);
  private budgetSvc  = inject(BudgetService);
  private categorySvc= inject(CategoryService);

  budgets    = signal<Budget[]>([]);
  categories = signal<Category[]>([]);
  loading    = signal(true);
  saving     = signal(false);
  formError  = signal('');

  selectedMonth = new Date().toISOString().substring(0,7);
  newForm = { category_id: '', limit_amount: 0 };

  ngOnInit(): void {
    this.loadBudgets();
    this.categorySvc.list('expense').subscribe(r => { if (r.success) this.categories.set(r.data); });
  }

  loadBudgets(): void {
    this.loading.set(true);
    this.budgetSvc.list(this.selectedMonth).subscribe(r => {
      if (r.success) this.budgets.set(r.data as Budget[]);
      this.loading.set(false);
    });
  }

  expenseCategories(): Category[] { return this.categories().filter(c => c.type === 'expense'); }
  totalLimit(): number  { return this.budgets().reduce((s,b) => s + b.limit_amount, 0); }
  totalSpent(): number  { return this.budgets().reduce((s,b) => s + b.spent, 0); }
  remaining(): number   { return this.totalLimit() - this.totalSpent(); }
  totalProgress(): number { return this.totalLimit() > 0 ? (this.totalSpent() / this.totalLimit()) * 100 : 0; }
  criticalAlerts(): Budget[] { return this.budgets().filter(b => b.percentage >= 85); }
  min100(v: number): number { return Math.min(100, v); }

  createBudget(): void {
    if (!this.newForm.category_id || !this.newForm.limit_amount) { this.formError.set('Preencha todos os campos.'); return; }
    this.saving.set(true); this.formError.set('');
    this.budgetSvc.create({ category_id: Number(this.newForm.category_id), limit_amount: this.newForm.limit_amount, month: this.selectedMonth }).subscribe({
      next: r => { if (r.success) { this.newForm = { category_id:'', limit_amount:0 }; this.loadBudgets(); } else this.formError.set(r.message); this.saving.set(false); },
      error: e => { this.formError.set(e.error?.errors ? Object.values(e.error.errors).flat().join(' ') : e.error?.message ?? 'Erro'); this.saving.set(false); }
    });
  }

  deleteBudget(id: number): void {
    if (!confirm('Eliminar este orçamento?')) return;
    this.budgetSvc.delete(id).subscribe(r => { if (r.success) this.loadBudgets(); });
  }
}
