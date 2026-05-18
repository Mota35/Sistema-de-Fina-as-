import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BudgetService, CategoryService } from '../../core/services/domain.services';
import { ToastService } from '../../core/services/toast.service';
import { Budget, Category } from '../../core/models';
import { format, subMonths } from 'date-fns';
import { pt } from 'date-fns/locale';

@Component({
  selector: 'app-budget-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyPipe],
  template: `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Orçamento</h1>
          <p class="page-subtitle">Definir e acompanhar limites de gastos por categoria</p>
        </div>
        <div class="header-actions">
          <select class="form-control" style="width:180px" [(ngModel)]="selectedMonth" (ngModelChange)="load()">
            @for (m of months; track m.value) { <option [value]="m.value">{{ m.label }}</option> }
          </select>
          <button class="btn btn-primary" (click)="openModal()">+ Novo Orçamento</button>
        </div>
      </div>

      <!-- Summary row -->
      @if (!loading() && budgets().length > 0) {
        <div class="budget-summary animate-fade-in">
          <div class="summary-stat">
            <span class="stat-label">Total Orçamentado</span>
            <span class="stat-value font-mono">{{ totalBudget() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
          <div class="summary-stat">
            <span class="stat-label">Total Gasto</span>
            <span class="stat-value font-mono danger">{{ totalSpent() | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
          </div>
          <div class="summary-stat">
            <span class="stat-label">Disponível</span>
            <span class="stat-value font-mono" [class.success]="totalRemaining() >= 0" [class.danger]="totalRemaining() < 0">
              {{ totalRemaining() | currency:'EUR':'symbol':'1.2-2':'pt' }}
            </span>
          </div>
          <div class="summary-stat">
            <span class="stat-label">Utilização Global</span>
            <span class="stat-value font-mono">{{ globalUsage() | number:'1.0-0' }}%</span>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="budget-list stagger">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton" style="height:120px;border-radius:18px"></div>
          }
        </div>
      } @else if (budgets().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p class="empty-state-title">Sem orçamentos definidos</p>
          <p class="empty-state-message">Crie orçamentos por categoria para controlar melhor os seus gastos</p>
          <button class="btn btn-primary" (click)="openModal()">+ Criar Orçamento</button>
        </div>
      } @else {
        <div class="budget-list stagger animate-fade-in">
          @for (b of budgets(); track b.id) {
            <div class="budget-card" [class.over-budget]="(b.percentage ?? 0) > 100">
              <div class="budget-header">
                <div class="budget-cat">
                  <span class="cat-icon">{{ b.category_icon || '📦' }}</span>
                  <div>
                    <div class="cat-name">{{ b.category_name }}</div>
                    <div class="cat-month text-muted">{{ monthLabel(b.month) }}</div>
                  </div>
                </div>
                <div class="budget-actions">
                  @if ((b.percentage ?? 0) > 100) {
                    <span class="badge badge-danger">Excedido!</span>
                  } @else if ((b.percentage ?? 0) >= 80) {
                    <span class="badge badge-warning">Atenção</span>
                  }
                  <button class="btn btn-ghost btn-sm btn-icon" (click)="editBudget(b)">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-icon" (click)="deleteTarget.set(b)">🗑️</button>
                </div>
              </div>

              <div class="budget-amounts">
                <span class="spent font-mono">{{ (b.spent ?? 0) | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
                <span class="text-muted">de</span>
                <span class="total font-mono">{{ b.amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
              </div>

              <div class="progress-bar" style="height:8px;margin:.625rem 0">
                <div class="progress-fill"
                     [style.width.%]="Math.min(b.percentage ?? 0, 100)"
                     [style.background]="progressColor(b.percentage ?? 0)"></div>
              </div>

              <div class="budget-footer">
                <span class="pct" [class.over]="(b.percentage ?? 0) > 100">
                  {{ (b.percentage ?? 0) | number:'1.0-1' }}% utilizado
                </span>
                <span class="remaining font-mono" [class.danger]="(b.remaining ?? 0) < 0">
                  {{ (b.remaining ?? 0) >= 0 ? 'Restam' : 'Excedido em' }}
                  {{ Math.abs(b.remaining ?? 0) | currency:'EUR':'symbol':'1.2-2':'pt' }}
                </span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="closeModal()"></div>
      <div class="modal animate-scale-in">
        <div class="modal-header">
          <h3>{{ editMode() ? 'Editar Orçamento' : 'Novo Orçamento' }}</h3>
          <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()" class="modal-body">
          <div class="form-group">
            <label class="form-label">Categoria *</label>
            <select class="form-control" formControlName="category_id">
              <option value="">Selecionar categoria</option>
              @for (cat of expenseCategories(); track cat.id) {
                <option [value]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
              }
            </select>
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Limite (€) *</label>
            <input class="form-control" type="number" step="0.01" min="1"
                   formControlName="amount" placeholder="Ex: 500.00">
          </div>
          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Mês</label>
            <input class="form-control" type="month" formControlName="month">
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner-sm"></span> }
              {{ editMode() ? 'Guardar' : 'Criar Orçamento' }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Delete Confirm -->
    @if (deleteTarget()) {
      <div class="overlay" (click)="deleteTarget.set(null)"></div>
      <div class="confirm-dialog animate-scale-in">
        <div class="confirm-icon">📋</div>
        <h3>Eliminar Orçamento</h3>
        <p>Tem a certeza que quer eliminar o orçamento de <strong>{{ deleteTarget()?.category_name }}</strong>?</p>
        <div class="confirm-btns">
          <button class="btn btn-outline" (click)="deleteTarget.set(null)">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="saving()">Eliminar</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .page-title { font-size:1.5rem; font-weight:700; margin-bottom:.25rem; }
    .page-subtitle { color:var(--text-secondary); font-size:.9rem; }
    .header-actions { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }

    .budget-summary {
      display:grid; grid-template-columns:repeat(4,1fr); gap:1rem;
      background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl);
      padding:1.5rem; margin-bottom:1.5rem;
    }
    .summary-stat { display:flex; flex-direction:column; gap:.25rem; text-align:center; }
    .stat-label { font-size:.7rem; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
    .stat-value { font-size:1.25rem; font-weight:700; }
    .stat-value.danger  { color:var(--clr-danger); }
    .stat-value.success { color:var(--clr-success); }

    .budget-list { display:flex; flex-direction:column; gap:1rem; }

    .budget-card {
      background:var(--bg-surface); border:1px solid var(--border);
      border-radius:var(--radius-xl); padding:1.25rem;
      transition:box-shadow var(--transition);
    }
    .budget-card:hover { box-shadow:var(--shadow-md); }
    .budget-card.over-budget { border-color:rgba(239,68,68,.3); background:rgba(239,68,68,.02); }

    .budget-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:.75rem; }
    .budget-cat { display:flex; align-items:center; gap:.75rem; }
    .cat-icon { font-size:1.5rem; }
    .cat-name { font-weight:600; font-size:.9375rem; }
    .cat-month { font-size:.75rem; }
    .budget-actions { display:flex; align-items:center; gap:.375rem; }

    .budget-amounts { display:flex; align-items:baseline; gap:.5rem; }
    .spent { font-size:1.25rem; font-weight:700; color:var(--text-primary); }
    .total { font-size:.9375rem; color:var(--text-secondary); }

    .budget-footer { display:flex; justify-content:space-between; align-items:center; }
    .pct { font-size:.8rem; color:var(--text-secondary); }
    .pct.over { color:var(--clr-danger); font-weight:600; }
    .remaining { font-size:.8rem; font-weight:600; }
    .remaining.danger { color:var(--clr-danger); }

    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); width:100%; max-width:440px; max-height:calc(100vh - 48px); box-shadow:var(--shadow-lg); z-index:200; overflow-y:auto; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); }
    .modal-header h3 { font-size:1.0625rem; font-weight:700; }
    .modal-body { padding:1.5rem; }
    .modal-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--border); }

    .confirm-dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); padding:2rem; width:100%; max-width:380px; text-align:center; box-shadow:var(--shadow-lg); z-index:200; }
    .confirm-icon { font-size:2.5rem; margin-bottom:1rem; }
    .confirm-dialog h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .confirm-dialog p { color:var(--text-secondary); font-size:.9rem; margin-bottom:1.5rem; }
    .confirm-btns { display:flex; gap:.75rem; justify-content:center; }
    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    @media (max-width:768px) {
      .budget-summary { grid-template-columns:1fr 1fr; }
    }
  `],
})
export class BudgetListComponent implements OnInit {
  private svc   = inject(BudgetService);
  private catSvc = inject(CategoryService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  Math = Math;

  budgets      = signal<Budget[]>([]);
  categories   = signal<Category[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  showModal    = signal(false);
  editMode     = signal(false);
  editId       = signal<number | null>(null);
  deleteTarget = signal<Budget | null>(null);

  selectedMonth = format(new Date(), 'yyyy-MM');
  months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(), i);
    return { value: format(d, 'yyyy-MM'), label: format(d, 'MMM yyyy', { locale: pt }) };
  });

  expenseCategories = computed(() => this.categories().filter(c => c.type === 'expense' || c.type === 'both'));
  totalBudget   = computed(() => this.budgets().reduce((s, b) => s + b.amount, 0));
  totalSpent    = computed(() => this.budgets().reduce((s, b) => s + (b.spent ?? 0), 0));
  totalRemaining = computed(() => this.totalBudget() - this.totalSpent());
  globalUsage   = computed(() => this.totalBudget() ? (this.totalSpent() / this.totalBudget()) * 100 : 0);

  form = this.fb.group({
    category_id: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    month: [this.selectedMonth],
  });

  ngOnInit(): void {
    this.catSvc.list().subscribe({ next: r => this.categories.set(r.data) });
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.svc.list(this.selectedMonth).subscribe({
      next: r => { this.budgets.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  monthLabel(m: string): string {
    const found = this.months.find(mo => mo.value === m);
    return found?.label ?? m;
  }

  progressColor(pct: number): string {
    if (pct >= 100) return 'var(--clr-danger)';
    if (pct >= 80)  return 'var(--clr-warning)';
    return 'var(--clr-primary)';
  }

  openModal(): void {
    this.form.reset({ month: this.selectedMonth });
    this.editMode.set(false); this.editId.set(null); this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); }

  editBudget(b: Budget): void {
    this.editMode.set(true); this.editId.set(b.id);
    this.form.patchValue({ category_id: String(b.category_id), amount: b.amount, month: b.month });
    this.showModal.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const obs = this.editMode()
      ? this.svc.update(this.editId()!, this.form.value as any)
      : this.svc.create(this.form.value as any);
    obs.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Orçamento atualizado' : 'Orçamento criado'); this.closeModal(); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.svc.delete(id).subscribe({
      next: () => { this.toast.success('Orçamento eliminado'); this.deleteTarget.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }
}
