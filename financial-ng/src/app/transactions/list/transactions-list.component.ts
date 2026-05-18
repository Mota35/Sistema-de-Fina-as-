import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/domain.services';
import { ToastService } from '../../core/services/toast.service';
import { Transaction, Category, TransactionFilters } from '../../core/models';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="animate-fade-in">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Transações</h1>
          <p class="page-subtitle">Gerir todas as suas movimentações financeiras</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="exportCsv()">⬇ Exportar CSV</button>
          <button class="btn btn-primary" (click)="openModal()">+ Nova Transação</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="card filter-card">
        <div class="filter-grid">
          <div class="form-group">
            <label class="form-label">Pesquisar</label>
            <input class="form-control" type="text" placeholder="Descrição..."
                   [(ngModel)]="filters.search" (ngModelChange)="onFilterChange()">
          </div>
          <div class="form-group">
            <label class="form-label">Tipo</label>
            <select class="form-control" [(ngModel)]="filters.type" (ngModelChange)="onFilterChange()">
              <option value="">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="transfer">Transferências</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Categoria</label>
            <select class="form-control" [(ngModel)]="filters.category_id" (ngModelChange)="onFilterChange()">
              <option value="">Todas</option>
              @for (cat of categories(); track cat.id) {
                <option [value]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data início</label>
            <input class="form-control" type="date" [(ngModel)]="filters.date_from" (ngModelChange)="onFilterChange()">
          </div>
          <div class="form-group">
            <label class="form-label">Data fim</label>
            <input class="form-control" type="date" [(ngModel)]="filters.date_to" (ngModelChange)="onFilterChange()">
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end">
            <button class="btn btn-ghost btn-sm" (click)="clearFilters()">↺ Limpar</button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="card" style="padding:0;overflow:hidden">

        @if (loading()) {
          <div style="padding:1.5rem;display:flex;flex-direction:column;gap:.75rem">
            @for (i of [1,2,3,4,5,6,7]; track i) {
              <div class="skeleton" style="height:52px;border-radius:10px"></div>
            }
          </div>
        } @else if (transactions().length === 0) {
          <div class="empty-state">
            <div class="empty-state-icon">💸</div>
            <p class="empty-state-title">Sem transações</p>
            <p class="empty-state-message">Adicione a sua primeira transação para começar</p>
            <button class="btn btn-primary" (click)="openModal()">+ Nova Transação</button>
          </div>
        } @else {
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Conta</th>
                  <th style="text-align:right">Valor</th>
                  <th style="text-align:center">Tipo</th>
                  <th style="text-align:right">Ações</th>
                </tr>
              </thead>
              <tbody>
                @for (tx of transactions(); track tx.id) {
                  <tr class="animate-fade-in">
                    <td class="text-muted" style="font-size:.85rem;white-space:nowrap">
                      {{ tx.date | date:'dd/MM/yyyy' }}
                    </td>
                    <td>
                      <div style="font-weight:500">{{ tx.description }}</div>
                      @if (tx.notes) { <div class="text-muted" style="font-size:.75rem">{{ tx.notes }}</div> }
                    </td>
                    <td>
                      @if (tx.category_name) {
                        <span class="cat-chip">
                          {{ tx.category_icon }} {{ tx.category_name }}
                        </span>
                      } @else { <span class="text-muted">—</span> }
                    </td>
                    <td class="text-secondary" style="font-size:.875rem">{{ tx.account_name }}</td>
                    <td style="text-align:right">
                      <span class="amount font-mono"
                            [class.income]="tx.type==='income'"
                            [class.expense]="tx.type==='expense'">
                        {{ tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄' }}
                        {{ tx.amount | currency:'EUR':'symbol':'1.2-2':'pt' }}
                      </span>
                    </td>
                    <td style="text-align:center">
                      <span [class]="typeBadge(tx.type)">{{ typeLabel(tx.type) }}</span>
                    </td>
                    <td style="text-align:right">
                      <div style="display:flex;gap:.375rem;justify-content:flex-end">
                        <button class="btn btn-ghost btn-sm btn-icon" (click)="editTx(tx)" title="Editar">✏️</button>
                        <button class="btn btn-ghost btn-sm btn-icon" (click)="deleteTx(tx)" title="Eliminar">🗑️</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <span class="text-secondary" style="font-size:.875rem">
              {{ paginationInfo() }}
            </span>
            <div class="page-btns">
              <button class="btn btn-outline btn-sm" [disabled]="filters.page === 1" (click)="prevPage()">← Anterior</button>
              <span class="page-num font-mono">{{ filters.page }}</span>
              <button class="btn btn-outline btn-sm" [disabled]="!hasNextPage()" (click)="nextPage()">Próxima →</button>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- ─── Modal ─── -->
    @if (showModal()) {
      <div class="overlay" (click)="$event.target === $event.currentTarget && closeModal()">
        <div class="modal animate-scale-in">
          <div class="modal-header">
            <h3>{{ editMode() ? 'Editar Transação' : 'Nova Transação' }}</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
          </div>

          <form [formGroup]="txForm" (ngSubmit)="submitTx()">
            <div class="modal-body">
              <div class="modal-grid">
                <div class="form-group span-2">
                  <label class="form-label">Descrição *</label>
                  <input class="form-control" formControlName="description" placeholder="Ex: Supermercado">
                </div>
                <div class="form-group">
                  <label class="form-label">Tipo *</label>
                  <select class="form-control" formControlName="type">
                    <option value="income">💚 Receita</option>
                    <option value="expense">❤️ Despesa</option>
                    <option value="transfer">💙 Transferência</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Valor *</label>
                  <input class="form-control" type="number" step="0.01" min="0" formControlName="amount" placeholder="0.00">
                </div>
                <div class="form-group">
                  <label class="form-label">Data *</label>
                  <input class="form-control" type="date" formControlName="date">
                </div>
                <div class="form-group">
                  <label class="form-label">Categoria</label>
                  <select class="form-control" formControlName="category_id">
                    <option value="">Sem categoria</option>
                    @for (cat of categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.icon }} {{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group span-2">
                  <label class="form-label">Notas</label>
                  <textarea class="form-control" formControlName="notes" rows="2" placeholder="Observações opcionais..."></textarea>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="txForm.invalid || saving()">
                @if (saving()) { <span class="spinner-sm"></span> } 
                {{ editMode() ? 'Guardar' : 'Criar Transação' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Confirm Delete -->
    @if (deleteTarget()) {
      <div class="overlay" (click)="$event.target === $event.currentTarget && deleteTarget.set(null)">
        <div class="confirm-dialog animate-scale-in">
          <div class="confirm-icon">🗑️</div>
          <h3>Eliminar Transação</h3>
          <p>Tem a certeza que quer eliminar <strong>"{{ deleteTarget()?.description }}"</strong>? Esta ação não pode ser desfeita.</p>
          <div class="confirm-btns">
            <button class="btn btn-outline" (click)="deleteTarget.set(null)">Cancelar</button>
            <button class="btn btn-danger" (click)="confirmDelete()" [disabled]="saving()">Eliminar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:1.5rem; }
    .page-title { font-size:1.5rem; font-weight:700; margin-bottom:.25rem; }
    .page-subtitle { color:var(--text-secondary); font-size:.9rem; }
    .header-actions { display:flex; gap:.75rem; }

    .filter-card { margin-bottom:1.25rem; }
    .filter-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:1rem; align-items:end; }

    .cat-chip { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; background:var(--bg-surface2); border-radius:var(--radius-full); font-size:.8rem; }

    .amount { font-size:.9375rem; font-weight:700; }
    .amount.income  { color:var(--clr-success); }
    .amount.expense { color:var(--clr-danger); }

    .pagination { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-top:1px solid var(--border); flex-wrap:wrap; gap:.75rem; }
    .page-btns { display:flex; align-items:center; gap:.75rem; }
    .page-num { min-width:36px; text-align:center; font-size:.875rem; }

    /* Modal */
    .modal {
      position:fixed; top:50%; left:50%;
      transform:translate(-50%,-50%);
      background:var(--bg-surface);
      border-radius:var(--radius-xl);
      width:100%; max-width:560px;
      box-shadow:var(--shadow-lg);
      z-index:200;
      max-height:90vh;
      overflow-y:auto;
    }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); }
    .modal-header h3 { font-size:1.0625rem; font-weight:700; }
    .modal-body { padding:1.5rem; }
    .modal-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .span-2 { grid-column:span 2; }
    .modal-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--border); }

    /* Confirm Dialog */
    .confirm-dialog {
      position:fixed; top:50%; left:50%;
      transform:translate(-50%,-50%);
      background:var(--bg-surface);
      border-radius:var(--radius-xl);
      padding:2rem;
      width:100%; max-width:400px;
      text-align:center;
      box-shadow:var(--shadow-lg);
      z-index:200;
    }
    .confirm-icon { font-size:2.5rem; margin-bottom:1rem; }
    .confirm-dialog h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .confirm-dialog p { color:var(--text-secondary); font-size:.9rem; margin-bottom:1.5rem; line-height:1.6; }
    .confirm-btns { display:flex; gap:.75rem; justify-content:center; }

    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class TransactionsListComponent implements OnInit {
  private txSvc  = inject(TransactionService);
  private catSvc = inject(CategoryService);
  private toast  = inject(ToastService);
  private fb     = inject(FormBuilder);

  transactions = signal<Transaction[]>([]);
  categories   = signal<Category[]>([]);
  total        = signal(0);
  loading      = signal(true);
  saving       = signal(false);
  showModal    = signal(false);
  editMode     = signal(false);
  editId       = signal<number | null>(null);
  deleteTarget = signal<Transaction | null>(null);

  filters: TransactionFilters & { page: number; per_page: number } = {
    search: '', type: '', page: 1, per_page: 15,
  };

  txForm = this.fb.group({
    type:        ['expense'],
    description: ['', []],
    amount:      [null as number | null],
    date:        [new Date().toISOString().split('T')[0]],
    category_id: [''],
    account_id:  [null as number | null],
    notes:       [''],
  });

  ngOnInit(): void {
    this.loadCategories();
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.loading.set(true);
    this.txSvc.list(this.filters).subscribe({
      next: r => {
        this.transactions.set(r.data ?? []);
        this.total.set(r.meta?.pagination?.total ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategories(): void {
    this.catSvc.list().subscribe({ next: r => this.categories.set(r.data) });
  }

  onFilterChange(): void { this.filters.page = 1; this.loadTransactions(); }
  clearFilters(): void { this.filters = { page: 1, per_page: 15 }; this.loadTransactions(); }

  prevPage(): void { if (this.filters.page! > 1) { this.filters.page!--; this.loadTransactions(); } }
  nextPage(): void { if (this.hasNextPage()) { this.filters.page!++; this.loadTransactions(); } }
  hasNextPage(): boolean { return (this.filters.page! * this.filters.per_page!) < this.total(); }
  paginationInfo(): string {
    const from = ((this.filters.page! - 1) * this.filters.per_page!) + 1;
    const to   = Math.min(this.filters.page! * this.filters.per_page!, this.total());
    return `${from}–${to} de ${this.total()} transações`;
  }

  openModal(): void { this.txForm.reset({ type: 'expense', date: new Date().toISOString().split('T')[0] }); this.editMode.set(false); this.editId.set(null); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  editTx(tx: Transaction): void {
    this.editMode.set(true);
    this.editId.set(tx.id);
    this.txForm.patchValue({ ...tx, category_id: tx.category_id?.toString() ?? '' });
    this.showModal.set(true);
  }

  deleteTx(tx: Transaction): void { this.deleteTarget.set(tx); }
  confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.txSvc.delete(id).subscribe({
      next: () => { this.toast.success('Transação eliminada'); this.deleteTarget.set(null); this.saving.set(false); this.loadTransactions(); },
      error: () => this.saving.set(false),
    });
  }

  submitTx(): void {
    if (this.txForm.invalid) return;
    this.saving.set(true);
    const data = this.txForm.value;
    const obs  = this.editMode()
      ? this.txSvc.update(this.editId()!, data as any)
      : this.txSvc.create(data as any);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editMode() ? 'Transação atualizada' : 'Transação criada');
        this.closeModal();
        this.saving.set(false);
        this.loadTransactions();
      },
      error: () => this.saving.set(false),
    });
  }

  exportCsv(): void {
    this.txSvc.exportCsv(this.filters).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = `transacoes-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    });
  }

  typeBadge(type: string): string {
    return { income: 'badge badge-success', expense: 'badge badge-danger', transfer: 'badge badge-info' }[type] ?? 'badge';
  }

  typeLabel(type: string): string {
    return { income: 'Receita', expense: 'Despesa', transfer: 'Transf.' }[type] ?? type;
  }
}
