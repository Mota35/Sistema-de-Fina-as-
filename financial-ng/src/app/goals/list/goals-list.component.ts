import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GoalService } from '../../core/services/domain.services';
import { ToastService } from '../../core/services/toast.service';
import { Goal } from '../../core/models';

const GOAL_ICONS = ['🎯','🏠','🚗','✈️','💍','🎓','💻','🏖️','🏋️','📱','🎸','🐾','💎','🌍','🛳️'];

@Component({
  selector: 'app-goals-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, CurrencyPipe],
  template: `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Metas Financeiras</h1>
          <p class="page-subtitle">Definir e acompanhar os seus objetivos financeiros</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ Nova Meta</button>
      </div>

      @if (loading()) {
        <div class="goals-grid stagger">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton" style="height:280px;border-radius:20px"></div>
          }
        </div>
      } @else if (goals().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🎯</div>
          <p class="empty-state-title">Sem metas definidas</p>
          <p class="empty-state-message">Crie metas financeiras para poupar com propósito e motivação</p>
          <button class="btn btn-primary" (click)="openModal()">+ Criar Meta</button>
        </div>
      } @else {
        <div class="goals-grid stagger animate-fade-in">
          @for (goal of goals(); track goal.id) {
            <div class="goal-card" [class.completed]="goal.status === 'completed'">
              <!-- Radial progress ring -->
              <div class="goal-ring-wrap">
                <svg class="goal-ring" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="var(--bg-surface2)" stroke-width="6"/>
                  <circle cx="40" cy="40" r="34" fill="none"
                          [attr.stroke]="goal.status === 'completed' ? 'var(--clr-success)' : 'var(--clr-primary)'"
                          stroke-width="6" stroke-linecap="round"
                          [attr.stroke-dasharray]="213.6"
                          [attr.stroke-dashoffset]="ringOffset(goal.progress_percentage ?? 0)"
                          transform="rotate(-90 40 40)"/>
                </svg>
                <div class="ring-center">
                  <span class="goal-icon">{{ goal.icon || '🎯' }}</span>
                  <span class="ring-pct">{{ (goal.progress_percentage ?? 0) | number:'1.0-0' }}%</span>
                </div>
              </div>

              <div class="goal-info">
                <div class="goal-name">{{ goal.name }}</div>

                @if (goal.deadline) {
                  <div class="goal-deadline">
                    📅 {{ goal.deadline | date:'dd/MM/yyyy' }}
                    @if (daysLeft(goal.deadline) !== null) {
                      <span [class]="daysLeftClass(goal.deadline)">
                        ({{ daysLeft(goal.deadline) }} dias)
                      </span>
                    }
                  </div>
                }

                <div class="goal-amounts">
                  <span class="goal-current font-mono">{{ goal.current_amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
                  <span class="text-muted"> / </span>
                  <span class="goal-target font-mono">{{ goal.target_amount | currency:'EUR':'symbol':'1.2-2':'pt' }}</span>
                </div>

                <div class="progress-bar" style="height:6px;margin:.375rem 0">
                  <div class="progress-fill"
                       [style.width.%]="Math.min(goal.progress_percentage ?? 0, 100)"
                       [style.background]="goal.status === 'completed' ? 'var(--clr-success)' : 'var(--clr-primary)'"></div>
                </div>

                <div class="goal-remaining text-secondary">
                  Faltam {{ Math.max(0, goal.target_amount - goal.current_amount) | currency:'EUR':'symbol':'1.2-2':'pt' }}
                </div>
              </div>

              <div class="goal-footer">
                <span [class]="statusBadge(goal.status)">{{ statusLabel(goal.status) }}</span>
                <div class="goal-actions">
                  @if (goal.status === 'active') {
                    <button class="btn btn-primary btn-sm" (click)="contributeTarget.set(goal)">+ Poupar</button>
                  }
                  <button class="btn btn-ghost btn-sm btn-icon" (click)="editGoal(goal)">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-icon" (click)="deleteTarget.set(goal)">🗑️</button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="overlay" (click)="$event.target === $event.currentTarget && closeModal()">
        <div class="modal animate-scale-in">
          <div class="modal-header">
            <h3>{{ editMode() ? 'Editar Meta' : 'Nova Meta' }}</h3>
            <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Nome da Meta *</label>
                <input class="form-control" formControlName="name" placeholder="Ex: Fundo de emergência">
              </div>
              <div class="form-group" style="margin-top:1rem">
                <label class="form-label">Valor Alvo (€) *</label>
                <input class="form-control" type="number" step="0.01" min="1"
                       formControlName="target_amount" placeholder="Ex: 10000.00">
              </div>
              <div class="form-group" style="margin-top:1rem">
                <label class="form-label">Valor Atual (€)</label>
                <input class="form-control" type="number" step="0.01" min="0"
                       formControlName="current_amount" placeholder="0.00">
              </div>
              <div class="form-group" style="margin-top:1rem">
                <label class="form-label">Prazo</label>
                <input class="form-control" type="date" formControlName="deadline">
              </div>
              <div class="form-group" style="margin-top:1rem">
                <label class="form-label">Ícone</label>
                <div class="icon-grid">
                  @for (ic of goalIcons; track ic) {
                    <button type="button" class="icon-btn" [class.selected]="form.value.icon === ic"
                            (click)="form.patchValue({icon: ic})">{{ ic }}</button>
                  }
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                @if (saving()) { <span class="spinner-sm"></span> }
                {{ editMode() ? 'Guardar' : 'Criar Meta' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Contribute Modal -->
    @if (contributeTarget()) {
      <div class="overlay" (click)="$event.target === $event.currentTarget && contributeTarget.set(null)">
        <div class="modal animate-scale-in" style="max-width:380px">
          <div class="modal-header">
            <h3>💰 Adicionar Poupança</h3>
            <button class="btn btn-ghost btn-icon" (click)="contributeTarget.set(null)">✕</button>
          </div>
          <div class="modal-body">
            <p class="text-secondary" style="margin-bottom:1rem;font-size:.9rem">
              Meta: <strong>{{ contributeTarget()?.name }}</strong>
            </p>
            <div class="form-group">
              <label class="form-label">Valor a Poupar (€)</label>
              <input class="form-control" type="number" step="0.01" min="0.01"
                     [(ngModel)]="contributeAmount" placeholder="Ex: 100.00">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="contributeTarget.set(null)">Cancelar</button>
            <button class="btn btn-primary" (click)="contribute()" [disabled]="!contributeAmount || saving()">
              @if (saving()) { <span class="spinner-sm"></span> }
              Adicionar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirm -->
    @if (deleteTarget()) {
      <div class="overlay" (click)="$event.target === $event.currentTarget && deleteTarget.set(null)">
        <div class="confirm-dialog animate-scale-in">
          <div class="confirm-icon">🎯</div>
          <h3>Eliminar Meta</h3>
          <p>Tem a certeza que quer eliminar a meta <strong>"{{ deleteTarget()?.name }}"</strong>?</p>
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

    .goals-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:1.25rem; }

    .goal-card {
      background:var(--bg-surface); border:1px solid var(--border);
      border-radius:var(--radius-xl); padding:1.5rem;
      display:flex; flex-direction:column; gap:1rem;
      transition:transform var(--transition),box-shadow var(--transition);
    }
    .goal-card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
    .goal-card.completed { border-color:rgba(34,197,94,.3); background:rgba(34,197,94,.02); }

    .goal-ring-wrap { position:relative; width:80px; height:80px; margin:0 auto; }
    .goal-ring { width:80px; height:80px; }
    .ring-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
    .goal-icon { font-size:1.25rem; line-height:1; }
    .ring-pct { font-size:.65rem; font-weight:700; color:var(--text-secondary); font-family:var(--font-mono); }

    .goal-info { display:flex; flex-direction:column; gap:.25rem; }
    .goal-name { font-size:1.0625rem; font-weight:700; }
    .goal-deadline { font-size:.8rem; color:var(--text-muted); }
    .goal-amounts { display:flex; align-items:baseline; gap:2px; margin-top:.25rem; }
    .goal-current { font-size:1.125rem; font-weight:700; }
    .goal-target  { font-size:.875rem; color:var(--text-secondary); }
    .goal-remaining { font-size:.8rem; }

    .goal-footer { display:flex; align-items:center; justify-content:space-between; padding-top:.75rem; border-top:1px solid var(--border); }
    .goal-actions { display:flex; align-items:center; gap:.25rem; }

    .days-ok      { color:var(--clr-success); font-size:.75rem; }
    .days-warning { color:var(--clr-warning); font-size:.75rem; }
    .days-over    { color:var(--clr-danger); font-size:.75rem; }

    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); width:100%; max-width:460px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg); z-index:200; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--bg-surface); }
    .modal-header h3 { font-size:1.0625rem; font-weight:700; }
    .modal-body { padding:1.5rem; }
    .modal-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--border); }

    .icon-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(36px,1fr)); gap:.375rem; }
    .icon-btn { background:var(--bg-surface2); border:1.5px solid transparent; border-radius:8px; width:36px; height:36px; font-size:1.125rem; cursor:pointer; transition:all var(--transition); }
    .icon-btn.selected { border-color:var(--clr-primary); background:var(--clr-primary-glow); }

    .confirm-dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); padding:2rem; width:100%; max-width:380px; text-align:center; box-shadow:var(--shadow-lg); z-index:200; }
    .confirm-icon { font-size:2.5rem; margin-bottom:1rem; }
    .confirm-dialog h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .confirm-dialog p { color:var(--text-secondary); font-size:.9rem; margin-bottom:1.5rem; }
    .confirm-btns { display:flex; gap:.75rem; justify-content:center; }
    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class GoalsListComponent implements OnInit {
  private svc   = inject(GoalService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  Math = Math;

  goals            = signal<Goal[]>([]);
  loading          = signal(true);
  saving           = signal(false);
  showModal        = signal(false);
  editMode         = signal(false);
  editId           = signal<number | null>(null);
  deleteTarget     = signal<Goal | null>(null);
  contributeTarget = signal<Goal | null>(null);
  contributeAmount = 0;

  goalIcons = GOAL_ICONS;

  form = this.fb.group({
    name:           ['', Validators.required],
    target_amount:  [null as number | null, [Validators.required, Validators.min(1)]],
    current_amount: [0],
    deadline:       [''],
    icon:           ['🎯'],
    color:          ['#6C63FF'],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: r => { this.goals.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  ringOffset(pct: number): number {
    const circumference = 2 * Math.PI * 34;
    return circumference * (1 - Math.min(pct, 100) / 100);
  }

  daysLeft(deadline: string): number | null {
    const d = new Date(deadline);
    const now = new Date();
    if (isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - now.getTime()) / 86400000);
  }

  daysLeftClass(deadline: string): string {
    const d = this.daysLeft(deadline);
    if (d === null) return '';
    if (d < 0)   return 'days-over';
    if (d < 30)  return 'days-warning';
    return 'days-ok';
  }

  statusBadge(s: string): string {
    return { active: 'badge badge-primary', completed: 'badge badge-success', cancelled: 'badge badge-danger' }[s] ?? 'badge';
  }

  statusLabel(s: string): string {
    return { active: '🔵 Ativa', completed: '✅ Concluída', cancelled: '❌ Cancelada' }[s] ?? s;
  }

  openModal(): void { this.form.reset({ icon: '🎯', color: '#6C63FF', current_amount: 0 }); this.editMode.set(false); this.editId.set(null); this.showModal.set(true); }
  closeModal(): void { this.showModal.set(false); }

  editGoal(g: Goal): void {
    this.editMode.set(true); this.editId.set(g.id);
    this.form.patchValue({ ...g, deadline: g.deadline?.split('T')[0] ?? '' });
    this.showModal.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const obs = this.editMode()
      ? this.svc.update(this.editId()!, this.form.value as any)
      : this.svc.create(this.form.value as any);
    obs.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Meta atualizada' : 'Meta criada'); this.closeModal(); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  contribute(): void {
    const id = this.contributeTarget()?.id;
    if (!id || !this.contributeAmount) return;
    this.saving.set(true);
    this.svc.contribute(id, this.contributeAmount).subscribe({
      next: () => { this.toast.success('Poupança adicionada! 🎉'); this.contributeTarget.set(null); this.contributeAmount = 0; this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.svc.delete(id).subscribe({
      next: () => { this.toast.success('Meta eliminada'); this.deleteTarget.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }
}
