import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/domain.services';
import { ToastService } from '../../core/services/toast.service';
import { Account } from '../../core/models';

const ACCOUNT_META: Record<string, { icon: string; label: string; color: string }> = {
  checking:   { icon: '🏦', label: 'Conta Corrente',   color: '#6C63FF' },
  savings:    { icon: '🏛️', label: 'Poupança',          color: '#22C55E' },
  credit:     { icon: '💳', label: 'Crédito',           color: '#EF4444' },
  investment: { icon: '📈', label: 'Investimento',      color: '#F59E0B' },
  cash:       { icon: '💵', label: 'Dinheiro',          color: '#3B82F6' },
};

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Contas</h1>
          <p class="page-subtitle">Gerir contas bancárias e carteiras</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ Nova Conta</button>
      </div>

      <!-- Total Balance Banner -->
      @if (!loading()) {
        <div class="balance-banner animate-fade-in">
          <div class="balance-label">Saldo total de todas as contas</div>
          <div class="balance-value font-mono">
            {{ totalBalance() | currency:'EUR':'symbol':'1.2-2':'pt' }}
          </div>
          <div class="balance-sub">{{ accounts().length }} conta(s) ativa(s)</div>
        </div>
      }

      <!-- Account Cards Grid -->
      @if (loading()) {
        <div class="accounts-grid stagger">
          @for (i of [1,2,3,4]; track i) {
            <div class="skeleton" style="height:180px;border-radius:18px"></div>
          }
        </div>
      } @else if (accounts().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🏦</div>
          <p class="empty-state-title">Nenhuma conta criada</p>
          <p class="empty-state-message">Adicione a sua primeira conta para começar a gerir as suas finanças</p>
          <button class="btn btn-primary" (click)="openModal()">+ Adicionar Conta</button>
        </div>
      } @else {
        <div class="accounts-grid stagger animate-fade-in">
          @for (acc of accounts(); track acc.id) {
            <div class="account-card card-hover" [style.--accent]="getMeta(acc.type).color">
              <div class="acc-header">
                <div class="acc-type-icon">{{ getMeta(acc.type).icon }}</div>
                <div class="acc-actions">
                  <button class="acc-action-btn" (click)="editAccount(acc)" title="Editar">✏️</button>
                  <button class="acc-action-btn danger" (click)="deleteTarget.set(acc)" title="Eliminar">🗑️</button>
                </div>
              </div>

              <div class="acc-name">{{ acc.name }}</div>
              <div class="acc-type-label">{{ getMeta(acc.type).label }}</div>
              @if (acc.bank_name) { <div class="acc-bank">{{ acc.bank_name }}</div> }

              <div class="acc-divider"></div>

              <div class="acc-balance-row">
                <span class="acc-balance-label">Saldo</span>
                <span class="acc-balance font-mono" [class.negative]="acc.balance < 0">
                  {{ acc.balance | currency:'EUR':'symbol':'1.2-2':'pt' }}
                </span>
              </div>

              <div class="acc-status" [class.active]="acc.is_active">
                {{ acc.is_active ? '● Ativa' : '○ Inativa' }}
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
          <h3>{{ editMode() ? 'Editar Conta' : 'Nova Conta' }}</h3>
          <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="modal-body">
          <div class="form-grid">
            <div class="form-group span-2">
              <label class="form-label">Nome da Conta *</label>
              <input class="form-control" [class.error]="hasError('name')"
                     formControlName="name" placeholder="Ex: Conta Principal BCP">
              @if (hasError('name')) { <span class="form-error">⚠ Campo obrigatório</span> }
            </div>

            <div class="form-group">
              <label class="form-label">Tipo *</label>
              <select class="form-control" formControlName="type">
                @for (t of accountTypes; track t.value) {
                  <option [value]="t.value">{{ t.icon }} {{ t.label }}</option>
                }
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Saldo Inicial (€)</label>
              <input class="form-control" type="number" step="0.01"
                     formControlName="balance" placeholder="0.00">
            </div>

            <div class="form-group span-2">
              <label class="form-label">Banco / Instituição</label>
              <input class="form-control" formControlName="bank_name"
                     placeholder="Ex: Caixa Geral de Depósitos">
            </div>

            <div class="form-group span-2">
              <label class="checkbox-row">
                <input type="checkbox" formControlName="is_active">
                <span>Conta ativa</span>
              </label>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner-sm"></span> }
              {{ editMode() ? 'Guardar' : 'Criar Conta' }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Confirm Delete -->
    @if (deleteTarget()) {
      <div class="overlay" (click)="deleteTarget.set(null)"></div>
      <div class="confirm-dialog animate-scale-in">
        <div class="confirm-icon">🏦</div>
        <h3>Eliminar Conta</h3>
        <p>Tem a certeza que quer eliminar a conta <strong>"{{ deleteTarget()?.name }}"</strong>?<br>
           Esta ação pode afetar transações existentes.</p>
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

    .balance-banner {
      background:linear-gradient(135deg,#1E1B4B,#4338CA);
      border-radius:var(--radius-xl);
      padding:2rem;
      text-align:center;
      margin-bottom:1.5rem;
      color:#fff;
    }
    .balance-label { font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.6); margin-bottom:.5rem; }
    .balance-value { font-size:2.25rem; font-weight:700; margin-bottom:.25rem; }
    .balance-sub { font-size:.85rem; color:rgba(255,255,255,.5); }

    .accounts-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:1.25rem; }

    .account-card {
      background:var(--bg-surface);
      border:1px solid var(--border);
      border-top:3px solid var(--accent,var(--clr-primary));
      border-radius:var(--radius-xl);
      padding:1.5rem;
      display:flex;
      flex-direction:column;
      gap:.375rem;
      transition:transform var(--transition),box-shadow var(--transition);
      cursor:default;
    }
    .account-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }

    .acc-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem; }
    .acc-type-icon { font-size:1.75rem; }
    .acc-actions { display:flex; gap:.25rem; opacity:0; transition:opacity var(--transition); }
    .account-card:hover .acc-actions { opacity:1; }
    .acc-action-btn { background:none; border:none; cursor:pointer; font-size:.9rem; padding:4px 6px; border-radius:6px; transition:background var(--transition); }
    .acc-action-btn:hover { background:var(--bg-surface2); }
    .acc-action-btn.danger:hover { background:rgba(239,68,68,.08); }

    .acc-name { font-size:1.0625rem; font-weight:700; color:var(--text-primary); }
    .acc-type-label { font-size:.8rem; color:var(--text-secondary); }
    .acc-bank { font-size:.8rem; color:var(--text-muted); }

    .acc-divider { height:1px; background:var(--border); margin:.75rem 0; }
    .acc-balance-row { display:flex; justify-content:space-between; align-items:center; }
    .acc-balance-label { font-size:.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
    .acc-balance { font-size:1.25rem; font-weight:700; color:var(--text-primary); }
    .acc-balance.negative { color:var(--clr-danger); }

    .acc-status { font-size:.75rem; margin-top:.25rem; color:var(--text-muted); }
    .acc-status.active { color:var(--clr-success); }

    /* Modal */
    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); width:100%; max-width:520px; max-height:calc(100vh - 48px); box-shadow:var(--shadow-lg); z-index:200; overflow-y:auto; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); }
    .modal-header h3 { font-size:1.0625rem; font-weight:700; }
    .modal-body { padding:1.5rem; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .span-2 { grid-column:span 2; }
    .modal-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--border); }
    .checkbox-row { display:flex; align-items:center; gap:.5rem; cursor:pointer; font-size:.9rem; }

    .confirm-dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); padding:2rem; width:100%; max-width:400px; text-align:center; box-shadow:var(--shadow-lg); z-index:200; }
    .confirm-icon { font-size:2.5rem; margin-bottom:1rem; }
    .confirm-dialog h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .confirm-dialog p { color:var(--text-secondary); font-size:.9rem; margin-bottom:1.5rem; line-height:1.7; }
    .confirm-btns { display:flex; gap:.75rem; justify-content:center; }

    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class AccountsListComponent implements OnInit {
  private svc   = inject(AccountService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  accounts     = signal<Account[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  showModal    = signal(false);
  editMode     = signal(false);
  editId       = signal<number | null>(null);
  deleteTarget = signal<Account | null>(null);

  totalBalance = computed(() => this.accounts().reduce((s, a) => s + a.balance, 0));

  accountTypes = Object.entries(ACCOUNT_META).map(([value, m]) => ({ value, ...m }));

  form = this.fb.group({
    name:      ['', Validators.required],
    type:      ['checking', Validators.required],
    balance:   [0],
    bank_name: [''],
    is_active: [true],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({ next: r => { this.accounts.set(r.data); this.loading.set(false); }, error: () => this.loading.set(false) });
  }

  getMeta(type: string) { return ACCOUNT_META[type] ?? { icon: '💰', label: type, color: '#6C63FF' }; }
  hasError(f: string): boolean { const c = this.form.get(f)!; return c.invalid && (c.dirty || c.touched); }

  openModal(): void { this.form.reset({ type: 'checking', balance: 0, is_active: true }); this.editMode.set(false); this.editId.set(null); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  editAccount(acc: Account): void {
    this.editMode.set(true); this.editId.set(acc.id);
    this.form.patchValue(acc);
    this.showModal.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const obs = this.editMode()
      ? this.svc.update(this.editId()!, this.form.value as any)
      : this.svc.create(this.form.value as any);
    obs.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Conta atualizada' : 'Conta criada'); this.closeModal(); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.svc.delete(id).subscribe({
      next: () => { this.toast.success('Conta eliminada'); this.deleteTarget.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }
}
