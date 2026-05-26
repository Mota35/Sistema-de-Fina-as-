import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Account, AccountType } from '../../core/models';

const TYPE_LABELS: Record<AccountType, string> = {
  wallet:'Carteira', bank:'Conta Bancária', savings:'Poupança', credit_card:'Cartão de Crédito', investment:'Investimento'
};
const TYPE_COLORS: Record<AccountType, string> = {
  wallet:'text-amber-500 bg-amber-500/10', bank:'text-blue-400 bg-blue-500/10',
  savings:'text-emerald-400 bg-emerald-500/10', credit_card:'text-purple-400 bg-purple-500/10',
  investment:'text-cyan-400 bg-cyan-500/10'
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">

  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Contas</h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Gerencie todas as suas contas financeiras</p>
    </div>
    <button (click)="openModal()"
            class="inline-flex items-center gap-2 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-all"
            [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
      </svg>
      Nova Conta
    </button>
  </div>

  <!-- Summary -->
  <div class="p-6 rounded-2xl border mb-8 flex flex-col md:flex-row items-center gap-6"
       [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
    <div class="flex-1">
      <span class="label block mb-1">Saldo Total Consolidado</span>
      <p class="text-3xl font-black" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        {{ totalBalance() | money }}
      </p>
    </div>
    <div class="flex flex-wrap gap-3">
      <div *ngFor="let bt of balanceByType()"
           class="text-center px-4 py-2 rounded-xl border"
           [class]="theme.isDark() ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'">
        <p class="text-[10px] font-mono text-slate-500">{{ typeLabel(bt.type) }}</p>
        <p class="text-sm font-black mt-0.5" [class]="theme.isDark() ? 'text-white' : 'text-slate-800'">{{ bt.total | money }}</p>
      </div>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <div *ngFor="let i of [1,2,3]" class="h-44 rounded-2xl animate-pulse"
         [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'"></div>
  </div>

  <!-- Account Cards -->
  <div *ngIf="!loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    <div *ngFor="let acc of accounts()"
         class="p-5 rounded-2xl border transition-all group"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'">
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center" [class]="typeColor(acc.type)">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
            </svg>
          </div>
          <div>
            <h3 class="text-sm font-bold" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ acc.name }}</h3>
            <span class="text-[10px] font-mono" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">{{ typeLabel(acc.type) }}</span>
          </div>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button (click)="editAccount(acc)" class="p-1.5 rounded-lg transition-all"
                  [class]="theme.isDark() ? 'text-slate-500 hover:bg-slate-800 hover:text-amber-400' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          <button (click)="deleteAccount(acc.id)" class="p-1.5 rounded-lg transition-all"
                  [class]="theme.isDark() ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-400 hover:bg-red-50 hover:text-red-500'">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
      <p class="text-2xl font-black font-mono" [class]="acc.balance >= 0 ? (theme.isDark() ? 'text-white' : 'text-slate-900') : 'text-red-400'">
        {{ acc.balance | money }}
      </p>
      <p class="text-[10px] font-mono mt-1" [class]="theme.isDark() ? 'text-slate-600' : 'text-slate-400'">
        Actualizado em {{ acc.created_at | date:'dd/MM/yyyy' }}
      </p>
    </div>

    <!-- Empty -->
    <div *ngIf="accounts().length === 0"
         class="col-span-3 py-16 text-center rounded-2xl border border-dashed"
         [class]="theme.isDark() ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
      <p class="text-sm font-semibold mb-1">Sem contas registadas</p>
      <p class="text-xs">Clique em "Nova Conta" para começar</p>
    </div>
  </div>
</div>

<!-- Modal -->
<div *ngIf="modalOpen()" class="overlay items-center justify-center" (click)="closeModal()">
  <div class="w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-zoom-in"
       [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'"
       (click)="$event.stopPropagation()">
    <h3 class="text-base font-black mb-4" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
      {{ editing() ? 'Editar Conta' : 'Nova Conta' }}
    </h3>

    <div *ngIf="formError()" class="p-3 rounded-xl text-xs mb-4"
         [class]="theme.isDark() ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'">{{ formError() }}</div>

    <form (ngSubmit)="save()" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="label">Nome da Conta</label>
        <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Ex: BFA, Carteira..." class="input-base"/>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Tipo</label>
        <select [(ngModel)]="form.type" name="type" class="input-base">
          <option *ngFor="let t of types" [value]="t.value">{{ t.label }}</option>
        </select>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Saldo Inicial</label>
        <input type="number" [(ngModel)]="form.balance" name="balance" step="0.01" placeholder="0.00" class="input-base"/>
      </div>
      <div class="flex gap-3 pt-2">
        <button type="button" (click)="closeModal()"
                class="flex-1 py-2.5 rounded-xl border text-xs font-semibold transition-all"
                [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
          Cancelar
        </button>
        <button type="submit" [disabled]="saving()"
                class="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
          {{ saving() ? 'A guardar...' : (editing() ? 'Actualizar' : 'Criar Conta') }}
        </button>
      </div>
    </form>
  </div>
</div>
  `
})
export class AccountsComponent implements OnInit {
  theme = inject(ThemeService);
  private svc = inject(AccountService);

  accounts      = signal<Account[]>([]);
  totalBalance  = signal(0);
  balanceByType = signal<{type:string;total:number}[]>([]);
  loading       = signal(true);
  modalOpen     = signal(false);
  saving        = signal(false);
  editing       = signal<Account|null>(null);
  formError     = signal('');

  form = { name:'', type:'bank' as AccountType, balance: 0 };
  types = Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list(1, 100).subscribe(r => {
      if (r.success) this.accounts.set(r.data);
      this.loading.set(false);
    });
    this.svc.summary().subscribe(r => {
      if (r.success) { this.totalBalance.set(r.data.total_balance); this.balanceByType.set(r.data.balance_by_type); }
    });
  }

  typeLabel(t: string): string { return TYPE_LABELS[t as AccountType] ?? t; }
  typeColor(t: AccountType): string { return TYPE_COLORS[t]; }

  openModal(): void { this.form = { name:'', type:'bank', balance:0 }; this.editing.set(null); this.modalOpen.set(true); }
  editAccount(acc: Account): void { this.form = { name: acc.name, type: acc.type, balance: acc.balance }; this.editing.set(acc); this.modalOpen.set(true); }
  closeModal(): void { this.modalOpen.set(false); this.formError.set(''); }

  save(): void {
    this.saving.set(true);
    const obs = this.editing()
      ? this.svc.update(this.editing()!.id, this.form)
      : this.svc.create(this.form);
    obs.subscribe({
      next: r => { if (r.success) { this.closeModal(); this.load(); } else this.formError.set(r.message); this.saving.set(false); },
      error: e => { this.formError.set(e.error?.message ?? 'Erro'); this.saving.set(false); }
    });
  }

  deleteAccount(id: number): void {
    if (!confirm('Eliminar esta conta? Todas as transações associadas serão eliminadas.')) return;
    this.svc.delete(id).subscribe(r => { if (r.success) this.load(); });
  }
}
