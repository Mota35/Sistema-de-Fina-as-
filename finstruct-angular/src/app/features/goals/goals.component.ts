import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoalService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Goal } from '../../core/models';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule, MoneyPipe],
  template: `
<div class="p-4 md:p-6 animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">

  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Metas & Advisor</h1>
      <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Acompanhe o progresso das suas metas financeiras</p>
    </div>
    <button (click)="openModal()"
            class="inline-flex items-center gap-2 font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition-all"
            [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/>
      </svg>
      Nova Meta
    </button>
  </div>

  <!-- Stats row -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
    <div *ngFor="let stat of stats()" class="p-4 rounded-2xl border text-center"
         [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
      <p class="text-2xl font-black" [class]="stat.color">{{ stat.value }}</p>
      <p class="text-[10px] font-mono mt-1" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">{{ stat.label }}</p>
    </div>
  </div>

  <!-- Loading -->
  <div *ngIf="loading()" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    <div *ngFor="let i of [1,2,3]" class="h-52 rounded-2xl animate-pulse"
         [class]="theme.isDark() ? 'bg-slate-800' : 'bg-slate-200'"></div>
  </div>

  <!-- Goal Cards -->
  <div *ngIf="!loading()" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
    <div *ngFor="let goal of goals()"
         class="p-5 rounded-2xl border transition-all group"
         [class]="goal.progress_pct >= 100
           ? (theme.isDark() ? 'bg-slate-900 border-emerald-500/30' : 'bg-white border-emerald-300 shadow-sm')
           : (theme.isDark() ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md')">

      <!-- Header -->
      <div class="flex items-start justify-between mb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               [class]="goal.progress_pct >= 100
                 ? 'bg-emerald-500/10 text-emerald-400'
                 : (theme.isDark() ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-50 text-blue-600')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                [attr.d]="goal.progress_pct >= 100
                  ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                  : 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-bold truncate" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ goal.title }}</h3>
            <p class="text-[10px] font-mono" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
              {{ goal.deadline ? 'Prazo: ' + (goal.deadline | date:'dd/MM/yyyy') : 'Sem prazo' }}
            </p>
          </div>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button (click)="deleteGoal(goal.id)"
                  class="p-1.5 rounded-lg transition-all text-slate-500 hover:text-red-400 hover:bg-red-500/10">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Amounts -->
      <div class="flex justify-between items-baseline mb-3">
        <span class="text-xl font-black font-mono" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
          {{ goal.current_amount | money }}
        </span>
        <span class="text-xs font-mono" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          / {{ goal.target_amount | money }}
        </span>
      </div>

      <!-- Progress bar -->
      <div class="mb-4">
        <div class="flex justify-between text-[9px] font-mono mb-1"
             [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
          <span>Progresso</span>
          <span [class]="goal.progress_pct >= 100 ? 'text-emerald-400' : (theme.isDark() ? 'text-amber-400' : 'text-blue-600')">
            {{ goal.progress_pct | number:'1.1-1' }}%
          </span>
        </div>
        <div class="h-2 rounded-full overflow-hidden" [class]="theme.isDark() ? 'bg-slate-950' : 'bg-slate-100'">
          <div class="h-full rounded-full transition-all duration-700"
               [style.width.%]="min100(goal.progress_pct)"
               [class]="goal.progress_pct >= 100 ? 'bg-emerald-500' : (theme.isDark() ? 'bg-amber-500' : 'bg-blue-600')"></div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button (click)="openDeposit(goal)"
                class="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                [class]="theme.isDark() ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-black border border-amber-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'">
          + Depositar
        </button>
        <button (click)="openEdit(goal)"
                class="px-3 py-2 rounded-xl text-xs transition-all border"
                [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">
          Editar
        </button>
      </div>
    </div>

    <div *ngIf="goals().length === 0"
         class="col-span-3 py-16 text-center rounded-2xl border border-dashed"
         [class]="theme.isDark() ? 'border-slate-800 text-slate-500' : 'border-slate-300 text-slate-400'">
      <svg class="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      <p class="text-sm font-semibold">Sem metas definidas</p>
    </div>
  </div>
</div>

<!-- Create/Edit Modal -->
<div *ngIf="modalOpen()" class="overlay items-center justify-center" (click)="closeModal()">
  <div class="w-full max-w-md p-6 rounded-3xl border shadow-2xl animate-zoom-in"
       [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'"
       (click)="$event.stopPropagation()">
    <h3 class="text-base font-black mb-4" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
      {{ editing() ? 'Editar Meta' : 'Nova Meta' }}
    </h3>
    <form (ngSubmit)="saveGoal()" class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="label">Título da Meta</label>
        <input type="text" [(ngModel)]="form.title" name="title" required placeholder="Ex: Fundo de Emergência" class="input-base"/>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Valor Alvo</label>
        <input type="number" [(ngModel)]="form.target_amount" name="target" required step="0.01" min="1" placeholder="0.00" class="input-base"/>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Valor Actual</label>
        <input type="number" [(ngModel)]="form.current_amount" name="current" step="0.01" min="0" placeholder="0.00" class="input-base"/>
      </div>
      <div class="flex flex-col gap-1.5">
        <label class="label">Prazo (opcional)</label>
        <input type="date" [(ngModel)]="form.deadline" name="deadline" class="input-base"/>
      </div>
      <div *ngIf="formError()" class="p-3 rounded-xl text-xs" [class]="theme.isDark() ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'">{{ formError() }}</div>
      <div class="flex gap-3 pt-2">
        <button type="button" (click)="closeModal()" class="flex-1 py-2.5 rounded-xl border text-xs font-semibold"
                [class]="theme.isDark() ? 'border-slate-800 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'">Cancelar</button>
        <button type="submit" [disabled]="saving()" class="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
                [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
          {{ saving() ? 'A guardar...' : (editing() ? 'Actualizar' : 'Criar Meta') }}
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Deposit Modal -->
<div *ngIf="depositModal()" class="overlay items-center justify-center" (click)="depositModal.set(false)">
  <div class="w-full max-w-sm p-6 rounded-3xl border shadow-2xl animate-zoom-in"
       [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200'"
       (click)="$event.stopPropagation()">
    <h3 class="text-base font-black mb-1" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Depositar na Meta</h3>
    <p class="text-xs mb-4" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ selectedGoal()?.title }}</p>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="label">Valor a Depositar</label>
        <input type="number" [(ngModel)]="depositAmount" step="0.01" min="1" placeholder="0.00" class="input-base"/>
      </div>
      <div class="flex gap-3">
        <button (click)="depositModal.set(false)" class="flex-1 py-2.5 rounded-xl border text-xs font-semibold"
                [class]="theme.isDark() ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'">Cancelar</button>
        <button (click)="doDeposit()" [disabled]="saving()" class="flex-1 py-2.5 rounded-xl text-xs font-bold disabled:opacity-60"
                [class]="theme.isDark() ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'">Depositar</button>
      </div>
    </div>
  </div>
</div>
  `
})
export class GoalsComponent implements OnInit {
  theme = inject(ThemeService);
  private svc = inject(GoalService);

  goals        = signal<Goal[]>([]);
  loading      = signal(true);
  modalOpen    = signal(false);
  depositModal = signal(false);
  saving       = signal(false);
  editing      = signal<Goal|null>(null);
  selectedGoal = signal<Goal|null>(null);
  formError    = signal('');

  form          = { title:'', target_amount:0, current_amount:0, deadline:'' };
  depositAmount = 0;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list(1,50).subscribe(r => { if (r.success) this.goals.set(r.data); this.loading.set(false); });
  }

  stats(): {value:string;label:string;color:string}[] {
    const gs = this.goals();
    const completed = gs.filter(g => g.progress_pct >= 100).length;
    const total = gs.reduce((s,g) => s + g.target_amount, 0);
    const saved = gs.reduce((s,g) => s + g.current_amount, 0);
    return [
      { value: String(gs.length), label: 'Total Metas', color: this.theme.isDark() ? 'text-white' : 'text-slate-900' },
      { value: String(completed), label: 'Concluídas', color: 'text-emerald-400' },
      { value: String(gs.length - completed), label: 'Em Progresso', color: 'text-amber-500' },
      { value: gs.length > 0 ? (saved/total*100).toFixed(0)+'%' : '0%', label: 'Progresso Médio', color: this.theme.isDark() ? 'text-amber-400' : 'text-blue-600' }
    ];
  }

  min100(v:number):number { return Math.min(100,v); }

  openModal(): void { this.form = { title:'', target_amount:0, current_amount:0, deadline:'' }; this.editing.set(null); this.modalOpen.set(true); }
  openEdit(g:Goal): void { this.form = { title:g.title, target_amount:g.target_amount, current_amount:g.current_amount, deadline:g.deadline??'' }; this.editing.set(g); this.modalOpen.set(true); }
  closeModal(): void { this.modalOpen.set(false); this.formError.set(''); }
  openDeposit(g:Goal): void { this.selectedGoal.set(g); this.depositAmount=0; this.depositModal.set(true); }

  saveGoal(): void {
    this.saving.set(true);
    const obs = this.editing() ? this.svc.update(this.editing()!.id, this.form) : this.svc.create(this.form);
    obs.subscribe({
      next: r => { if (r.success) { this.closeModal(); this.load(); } else this.formError.set(r.message); this.saving.set(false); },
      error: e => { this.formError.set(e.error?.message??'Erro'); this.saving.set(false); }
    });
  }

  doDeposit(): void {
    if (!this.depositAmount || this.depositAmount <= 0) return;
    this.saving.set(true);
    this.svc.deposit(this.selectedGoal()!.id, this.depositAmount).subscribe({
      next: r => { if (r.success) { this.depositModal.set(false); this.load(); } this.saving.set(false); },
      error: () => this.saving.set(false)
    });
  }

  deleteGoal(id:number): void {
    if (!confirm('Eliminar esta meta?')) return;
    this.svc.delete(id).subscribe(r => { if (r.success) this.load(); });
  }
}
