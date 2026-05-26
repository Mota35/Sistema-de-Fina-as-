import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService, AccountService, CategoryService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Transaction, Account, Category, TransactionFilters } from '../../core/models';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe, TranslatePipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">

  <!-- Header -->
  <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ 'tx.title' | translate }}</h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ 'tx.subtitle' | translate }}</p>
    </div>
    <button (click)="openDrawer()"
            class="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-amber-500/15 transition-all">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
      </svg>
      {{ 'tx.new' | translate }}
    </button>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">{{ 'tx.income_total' | translate }}</span>
      <div class="flex items-center justify-between mt-3">
        <span class="text-xl font-bold font-mono text-white">{{ incomeTotal() | money }}</span>
        <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 17l9.2-9.2M17 17V7H7"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <span class="label block">{{ 'tx.expense_total' | translate }}</span>
      <div class="flex items-center justify-between mt-3">
        <span class="text-xl font-bold font-mono text-white">{{ expenseTotal() | money }}</span>
        <div class="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
          <svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 7l-9.2 9.2M7 7v10h10"/>
          </svg>
        </div>
      </div>
    </div>
    <div class="p-5 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/5"
         [class]="theme.isDark() ? 'bg-slate-900' : 'bg-white'">
      <span class="label block">{{ 'tx.net_balance' | translate }}</span>
      <div class="flex items-center justify-between mt-3">
        <span class="text-xl font-bold font-mono" [class]="netBalance() >= 0 ? 'text-emerald-400' : 'text-red-400'">
          {{ netBalance() | money }}
        </span>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
    <div class="relative w-full md:w-80">
      <input type="text" [placeholder]="'tx.filter_placeholder' | translate" [(ngModel)]="filters.search"
             (input)="loadTransactions()"
             class="w-full rounded-xl px-3.5 py-2 pl-9 text-xs focus:outline-none transition-all"
             [class]="theme.isDark() ? 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:border-amber-500/80' : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'"/>
      <svg class="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
      </svg>
    </div>
    <div class="flex gap-2 flex-wrap">
      <button *ngFor="let t of ['all','income','expense']"
              (click)="setTypeFilter(t)"
              class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              [class]="typeFilter === t
                ? 'bg-amber-500 text-slate-950 font-bold'
                : (theme.isDark() ? 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600')">
        {{ (t === 'all' ? 'tx.all' : t === 'income' ? 'tx.income' : 'tx.expense') | translate }}
      </button>
    </div>
  </div>

  <!-- Table -->
  <div class="rounded-2xl border overflow-hidden shadow-2xl"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'">
    <div class="p-4 border-b flex justify-between items-center"
         [class]="theme.isDark() ? 'border-slate-800 bg-slate-950/20' : 'border-slate-100 bg-slate-50'">
      <span class="text-xs font-bold" [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-700'">{{ 'tx.ledger' | translate }}</span>
      <span class="text-[10px] font-mono text-slate-500">{{ transactions().length }} {{ 'tx.count' | translate }}</span>
    </div>

    <div *ngIf="loading()" class="p-8 flex justify-center">
      <div class="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div *ngIf="!loading() && transactions().length === 0" class="p-12 text-center text-slate-500">
      <svg class="w-10 h-10 mx-auto text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
      </svg>
      <p class="text-xs">{{ 'tx.no_found' | translate }}</p>
    </div>

    <div *ngIf="!loading() && transactions().length > 0" class="overflow-x-auto">
      <table class="w-full text-left text-xs">
        <thead>
          <tr class="font-semibold border-b"
              [class]="theme.isDark() ? 'text-slate-500 border-slate-800 bg-slate-950/10' : 'text-slate-400 border-slate-100 bg-slate-50'">
            <th class="py-3 px-4">{{ 'tx.date' | translate }}</th>
            <th class="px-3">{{ 'tx.description' | translate }}</th>
            <th class="px-3">{{ 'tx.category' | translate }}</th>
            <th class="px-3">{{ 'tx.account' | translate }}</th>
            <th class="px-3 text-right">{{ 'tx.value' | translate }}</th>
            <th class="px-3 text-right">{{ 'tx.actions' | translate }}</th>
          </tr>
        </thead>
        <tbody class="divide-y" [class]="theme.isDark() ? 'divide-slate-800/50' : 'divide-slate-100'">
          <tr *ngFor="let tx of transactions()"
              class="transition-all hover:bg-opacity-5"
              [class]="theme.isDark() ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'">
            <td class="py-3.5 px-4 font-mono" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ tx.transaction_date }}</td>
            <td class="px-3 font-semibold" [class]="theme.isDark() ? 'text-white' : 'text-slate-800'">{{ tx.description || '—' }}</td>
            <td class="px-3">
              <span class="px-2 py-0.5 rounded-md border font-mono text-[9px]"
                    [class]="theme.isDark() ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-600 border-slate-200'">
                {{ tx.category_name }}
              </span>
            </td>
            <td class="px-3 text-[10px]" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">{{ tx.account_name }}</td>
            <td class="px-4 py-3.5 text-right font-mono font-bold"
                [class]="tx.type === 'income' ? 'text-emerald-400' : 'text-amber-500'">
              {{ tx.type === 'income' ? '+' : '-' }}{{ tx.amount | money }}
            </td>
            <td class="px-3 text-right">
              <button (click)="deleteTx(tx.id)"
                      class="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div *ngIf="totalPages() > 1" class="p-4 border-t flex items-center justify-between"
         [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
      <button (click)="prevPage()" [disabled]="currentPage() <= 1"
              class="px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-40"
              [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'">
        ← {{ 'tx.prev' | translate }}
      </button>
      <span class="text-[10px] font-mono text-slate-500">{{ currentPage() }} / {{ totalPages() }}</span>
      <button (click)="nextPage()" [disabled]="currentPage() >= totalPages()"
              class="px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-40"
              [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-100'">
        {{ 'tx.next' | translate }} →
      </button>
    </div>
  </div>
</div>

<!-- Drawer -->
<div *ngIf="drawerOpen()" class="overlay" (click)="closeDrawer()">
  <div class="flex-1"></div>
  <div class="w-full max-w-md h-full border-l p-6 shadow-2xl overflow-y-auto flex flex-col animate-slide-right"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'"
       (click)="$event.stopPropagation()">
    <div class="flex justify-between items-center pb-4 border-b mb-6"
         [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-200'">
      <div>
        <h3 class="text-base font-black flex items-center gap-2">
          <svg class="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          {{ 'tx.drawer_title' | translate }}
        </h3>
        <p class="text-[10px] mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ 'tx.drawer_subtitle' | translate }}</p>
      </div>
      <button (click)="closeDrawer()" class="p-1.5 rounded-lg transition-all"
              [class]="theme.isDark() ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100'">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>

    <form (ngSubmit)="saveTransaction()" class="flex flex-col gap-4 flex-1">
      <!-- Type -->
      <div class="flex flex-col gap-1.5">
        <span class="label">{{ 'tx.nature' | translate }}</span>
        <div class="grid grid-cols-2 gap-2 p-1 rounded-xl border"
             [class]="theme.isDark() ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'">
          <button type="button" (click)="form.type='income'"
                  class="py-1.5 text-xs font-bold rounded-lg transition-all"
                  [class]="form.type==='income' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (theme.isDark() ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')">
            {{ 'tx.income_plus' | translate }}
          </button>
          <button type="button" (click)="form.type='expense'"
                  class="py-1.5 text-xs font-bold rounded-lg transition-all"
                  [class]="form.type==='expense' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : (theme.isDark() ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900')">
            {{ 'tx.expense_minus' | translate }}
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'tx.description' | translate }}</label>
        <input type="text" [(ngModel)]="form.description" name="desc" required
               placeholder="Ex: Salário, Supermercado..."
               class="input-base"/>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'tx.amount' | translate }} ({{ auth.currentUser()?.currency ?? 'AOA' }})</label>
        <input type="number" [(ngModel)]="form.amount" name="amount" required step="0.01" min="0.01"
               placeholder="0.00" class="input-base"/>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'tx.account' | translate }}</label>
        <select [(ngModel)]="form.account_id" name="account" required class="input-base">
          <option value="">{{ 'tx.select_account' | translate }}</option>
          <option *ngFor="let acc of accounts()" [value]="acc.id">{{ acc.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'tx.category' | translate }}</label>
        <select [(ngModel)]="form.category_id" name="category" required class="input-base">
          <option value="">{{ 'tx.select_category' | translate }}</option>
          <option *ngFor="let cat of filteredCategories()" [value]="cat.id">{{ cat.name }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'tx.date' | translate }}</label>
        <input type="date" [(ngModel)]="form.transaction_date" name="date" required class="input-base"/>
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="label">{{ 'tx.notes' | translate }}</label>
        <textarea [(ngModel)]="form.notes" name="notes" rows="2"
                  [placeholder]="'tx.notes_placeholder' | translate" class="input-base resize-none"></textarea>
      </div>

      <div *ngIf="formError()" class="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl">
        {{ formError() | translate }}
      </div>

      <button type="submit" [disabled]="saving()"
              class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl transition-all h-12 mt-2 flex items-center justify-center gap-1.5 disabled:opacity-50">
        <div *ngIf="saving()" class="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
        <span *ngIf="!saving()">{{ (saving() ? 'tx.saving' : 'tx.save') | translate }}</span>
      </button>
    </form>
  </div>
</div>
  `
})
export class TransactionsComponent implements OnInit {
  theme = inject(ThemeService);
  auth  = inject(AuthService);
  trans = inject(TranslationService);
  private txSvc  = inject(TransactionService);
  private accSvc = inject(AccountService);
  private catSvc = inject(CategoryService);


  transactions = signal<Transaction[]>([]);
  accounts     = signal<Account[]>([]);
  categories   = signal<Category[]>([]);
  loading      = signal(true);
  drawerOpen   = signal(false);
  saving       = signal(false);
  formError    = signal('');

  currentPage  = signal(1);
  totalPages   = signal(1);
  typeFilter   = 'all';
  filters: TransactionFilters = { per_page: 15, page: 1 };

  form = { type: 'expense' as 'income'|'expense', description: '', amount: 0,
           account_id: '', category_id: '', transaction_date: new Date().toISOString().substring(0,10), notes: '' };

  ngOnInit(): void {
    this.loadTransactions();
    this.accSvc.list(1, 100).subscribe(r => { if (r.success) this.accounts.set(r.data); });
    this.catSvc.list().subscribe(r => { if (r.success) this.categories.set(r.data); });
  }

  filteredCategories(): Category[] {
    return this.categories().filter(c => c.type === this.form.type);
  }

  loadTransactions(): void {
    this.loading.set(true);
    const f: TransactionFilters = { ...this.filters, page: this.currentPage() };
    if (this.typeFilter !== 'all') f.type = this.typeFilter;
    this.txSvc.list(f).subscribe({
      next: r => {
        if (r.success) {
          this.transactions.set(r.data);
          this.totalPages.set(r.meta.last_page);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  incomeTotal(): number   { return this.transactions().filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0); }
  expenseTotal(): number  { return this.transactions().filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0); }
  netBalance(): number    { return this.incomeTotal() - this.expenseTotal(); }

  setTypeFilter(t: string): void { this.typeFilter = t; this.currentPage.set(1); this.loadTransactions(); }
  prevPage(): void { this.currentPage.update(p => p-1); this.loadTransactions(); }
  nextPage(): void { this.currentPage.update(p => p+1); this.loadTransactions(); }

  openDrawer(): void { this.drawerOpen.set(true); }
  closeDrawer(): void { this.drawerOpen.set(false); this.formError.set(''); }

  saveTransaction(): void {
    if (!this.form.description || !this.form.amount || !this.form.account_id || !this.form.category_id) {
      this.formError.set('tx.error_fields');
      return;
    }
    this.saving.set(true);
    this.txSvc.create({
      type: this.form.type, description: this.form.description,
      amount: Math.abs(Number(this.form.amount)),
      account_id: Number(this.form.account_id), category_id: Number(this.form.category_id),
      transaction_date: this.form.transaction_date,
    }).subscribe({
      next: r => {
        if (r.success) { this.closeDrawer(); this.loadTransactions(); }
        else this.formError.set(r.message);
        this.saving.set(false);
      },
      error: e => { this.formError.set(e.error?.message ?? 'tx.error_save'); this.saving.set(false); }
    });
  }

  deleteTx(id: number): void {
    if (!confirm(this.trans.translate('tx.confirm_delete'))) return;
    this.txSvc.delete(id).subscribe(r => { if (r.success) this.loadTransactions(); });
  }
}
