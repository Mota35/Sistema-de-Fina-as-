import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/domain.services';
import { ToastService } from '../../core/services/toast.service';
import { Category } from '../../core/models';
import { FormsModule } from '@angular/forms';

const ICONS = ['🍔','🛒','🏠','🚗','💊','👕','📱','✈️','🎬','📚','💪','🐶','🎮','☕','🍺','💐','🎁','🏋️','🎓','💼','📈','🏦','💰','⚡','🌊'];
const COLORS = ['#6C63FF','#22C55E','#EF4444','#F59E0B','#3B82F6','#EC4899','#8B5CF6','#14B8A6','#F97316','#6366F1'];

@Component({
  selector: 'app-categories-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Categorias</h1>
          <p class="page-subtitle">Organizar receitas e despesas por categorias</p>
        </div>
        <button class="btn btn-primary" (click)="openModal()">+ Nova Categoria</button>
      </div>

      <!-- Filter Tabs -->
      <div class="type-tabs">
        @for (tab of tabs; track tab.value) {
          <button class="tab-btn" [class.active]="activeType() === tab.value"
                  (click)="activeType.set(tab.value); filterCats()">
            {{ tab.label }} <span class="tab-count">{{ countByType(tab.value) }}</span>
          </button>
        }
      </div>

      @if (loading()) {
        <div class="cat-grid stagger">
          @for (i of [1,2,3,4,5,6]; track i) {
            <div class="skeleton" style="height:96px;border-radius:16px"></div>
          }
        </div>
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🏷️</div>
          <p class="empty-state-title">Sem categorias</p>
          <p class="empty-state-message">Crie categorias para organizar melhor as suas transações</p>
          <button class="btn btn-primary" (click)="openModal()">+ Criar Categoria</button>
        </div>
      } @else {
        <div class="cat-grid stagger animate-fade-in">
          @for (cat of filtered(); track cat.id) {
            <div class="cat-card" [style.--cat-color]="cat.color || '#6C63FF'">
              <div class="cat-card-top">
                <div class="cat-icon-wrap"><span>{{ cat.icon || '📦' }}</span></div>
                @if (cat.user_id) {
                  <div class="cat-menu">
                    <button class="cat-btn" (click)="editCat(cat)">✏️</button>
                    <button class="cat-btn danger" (click)="deleteTarget.set(cat)">🗑️</button>
                  </div>
                }
              </div>
              <div class="cat-name">{{ cat.name }}</div>
              <div class="cat-type-badge" [class]="'type-' + cat.type">{{ typeLabel(cat.type) }}</div>
              @if (!cat.user_id) {
                <div class="cat-system">Sistema</div>
              }
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
          <h3>{{ editMode() ? 'Editar Categoria' : 'Nova Categoria' }}</h3>
          <button class="btn btn-ghost btn-icon" (click)="closeModal()">✕</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="modal-body">
          <!-- Preview -->
          <div class="preview-card" [style.background]="form.value.color + '18'" [style.border-color]="form.value.color + '40'">
            <span class="preview-icon">{{ form.value.icon || '📦' }}</span>
            <span class="preview-name">{{ form.value.name || 'Nome da Categoria' }}</span>
          </div>

          <div class="form-group" style="margin-top:1.25rem">
            <label class="form-label">Nome *</label>
            <input class="form-control" [class.error]="hasError('name')"
                   formControlName="name" placeholder="Ex: Alimentação">
          </div>

          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Tipo *</label>
            <div class="type-selector">
              @for (t of typeOptions; track t.value) {
                <label class="type-option" [class.selected]="form.value.type === t.value">
                  <input type="radio" formControlName="type" [value]="t.value" hidden>
                  {{ t.label }}
                </label>
              }
            </div>
          </div>

          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Ícone</label>
            <div class="icon-grid">
              @for (ic of icons; track ic) {
                <button type="button" class="icon-btn" [class.selected]="form.value.icon === ic"
                        (click)="form.patchValue({icon: ic})">{{ ic }}</button>
              }
            </div>
          </div>

          <div class="form-group" style="margin-top:1rem">
            <label class="form-label">Cor</label>
            <div class="color-grid">
              @for (c of colors; track c) {
                <button type="button" class="color-btn" [class.selected]="form.value.color === c"
                        [style.background]="c" (click)="form.patchValue({color: c})"></button>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
              @if (saving()) { <span class="spinner-sm"></span> }
              {{ editMode() ? 'Guardar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    }

    <!-- Confirm Delete -->
    @if (deleteTarget()) {
      <div class="overlay" (click)="deleteTarget.set(null)"></div>
      <div class="confirm-dialog animate-scale-in">
        <div class="confirm-icon">{{ deleteTarget()?.icon || '🏷️' }}</div>
        <h3>Eliminar Categoria</h3>
        <p>Tem a certeza que quer eliminar <strong>"{{ deleteTarget()?.name }}"</strong>?</p>
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

    .type-tabs { display:flex; gap:.5rem; margin-bottom:1.5rem; border-bottom:1px solid var(--border); padding-bottom:0; }
    .tab-btn { background:none; border:none; cursor:pointer; font-size:.875rem; font-weight:500; color:var(--text-secondary); padding:.625rem 1rem; border-bottom:2px solid transparent; margin-bottom:-1px; transition:all var(--transition); display:flex; align-items:center; gap:.375rem; }
    .tab-btn:hover { color:var(--text-primary); }
    .tab-btn.active { color:var(--clr-primary); border-bottom-color:var(--clr-primary); }
    .tab-count { background:var(--bg-surface2); border-radius:99px; padding:0 7px; font-size:.7rem; font-weight:700; }

    .cat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:1rem; }

    .cat-card {
      background:var(--bg-surface);
      border:1px solid var(--border);
      border-radius:var(--radius-lg);
      padding:1.125rem;
      display:flex; flex-direction:column; gap:.375rem;
      transition:transform var(--transition),box-shadow var(--transition);
      position:relative;
    }
    .cat-card:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); }
    .cat-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:.375rem; }
    .cat-icon-wrap { width:44px; height:44px; border-radius:12px; background:color-mix(in srgb,var(--cat-color) 15%,transparent); display:flex; align-items:center; justify-content:center; font-size:1.375rem; }
    .cat-menu { display:flex; gap:2px; opacity:0; transition:opacity var(--transition); }
    .cat-card:hover .cat-menu { opacity:1; }
    .cat-btn { background:none; border:none; cursor:pointer; font-size:.85rem; padding:3px 5px; border-radius:5px; transition:background var(--transition); }
    .cat-btn:hover { background:var(--bg-surface2); }
    .cat-btn.danger:hover { background:rgba(239,68,68,.08); }
    .cat-name { font-size:.9rem; font-weight:600; color:var(--text-primary); }
    .cat-type-badge { display:inline-flex; align-items:center; font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:99px; }
    .type-income  { background:rgba(34,197,94,.12);  color:var(--clr-success); }
    .type-expense { background:rgba(239,68,68,.12);  color:var(--clr-danger); }
    .type-both    { background:rgba(108,99,255,.12); color:var(--clr-primary); }
    .cat-system { font-size:.7rem; color:var(--text-muted); margin-top:2px; }

    /* Modal */
    .modal { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); width:100%; max-width:480px; max-height:90vh; overflow-y:auto; box-shadow:var(--shadow-lg); z-index:200; }
    .modal-header { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--bg-surface); z-index:1; }
    .modal-header h3 { font-size:1.0625rem; font-weight:700; }
    .modal-body { padding:1.5rem; }

    .preview-card { display:flex; align-items:center; gap:.75rem; padding:.875rem 1.25rem; border-radius:var(--radius-lg); border:1.5px dashed; transition:all .3s; }
    .preview-icon { font-size:1.5rem; }
    .preview-name { font-size:1rem; font-weight:600; }

    .type-selector { display:flex; gap:.5rem; }
    .type-option { flex:1; text-align:center; padding:.5rem; border:1.5px solid var(--border); border-radius:var(--radius-md); cursor:pointer; font-size:.875rem; font-weight:500; transition:all var(--transition); }
    .type-option.selected { border-color:var(--clr-primary); background:var(--clr-primary-glow); color:var(--clr-primary); }

    .icon-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(36px,1fr)); gap:.375rem; }
    .icon-btn { background:var(--bg-surface2); border:1.5px solid transparent; border-radius:8px; width:36px; height:36px; font-size:1.125rem; cursor:pointer; transition:all var(--transition); }
    .icon-btn:hover { border-color:var(--border); }
    .icon-btn.selected { border-color:var(--clr-primary); background:var(--clr-primary-glow); }

    .color-grid { display:flex; flex-wrap:wrap; gap:.5rem; }
    .color-btn { width:28px; height:28px; border-radius:50%; border:2.5px solid transparent; cursor:pointer; transition:transform var(--transition); }
    .color-btn:hover { transform:scale(1.15); }
    .color-btn.selected { border-color:var(--text-primary); transform:scale(1.15); }

    .modal-footer { display:flex; justify-content:flex-end; gap:.75rem; margin-top:1.5rem; padding-top:1.25rem; border-top:1px solid var(--border); }

    .confirm-dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); padding:2rem; width:100%; max-width:380px; text-align:center; box-shadow:var(--shadow-lg); z-index:200; }
    .confirm-icon { font-size:2.5rem; margin-bottom:1rem; }
    .confirm-dialog h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .confirm-dialog p { color:var(--text-secondary); font-size:.9rem; margin-bottom:1.5rem; }
    .confirm-btns { display:flex; gap:.75rem; justify-content:center; }
    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class CategoriesListComponent implements OnInit {
  private svc   = inject(CategoryService);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  allCats      = signal<Category[]>([]);
  filtered     = signal<Category[]>([]);
  loading      = signal(true);
  saving       = signal(false);
  showModal    = signal(false);
  editMode     = signal(false);
  editId       = signal<number | null>(null);
  deleteTarget = signal<Category | null>(null);
  activeType   = signal<string>('all');

  icons  = ICONS;
  colors = COLORS;

  tabs = [
    { value: 'all',     label: 'Todas' },
    { value: 'expense', label: '📤 Despesa' },
    { value: 'income',  label: '📥 Receita' },
    { value: 'both',    label: '↔ Ambas' },
  ];

  typeOptions = [
    { value: 'expense', label: '📤 Despesa' },
    { value: 'income',  label: '📥 Receita' },
    { value: 'both',    label: '↔ Ambas' },
  ];

  form = this.fb.group({
    name:  ['', Validators.required],
    type:  ['expense', Validators.required],
    icon:  ['📦'],
    color: [COLORS[0]],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: r => { this.allCats.set(r.data); this.filterCats(); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filterCats(): void {
    const t = this.activeType();
    this.filtered.set(t === 'all' ? this.allCats() : this.allCats().filter(c => c.type === t));
  }

  countByType(type: string): number {
    return type === 'all' ? this.allCats().length : this.allCats().filter(c => c.type === type).length;
  }

  typeLabel(t: string): string { return { income: 'Receita', expense: 'Despesa', both: 'Ambas' }[t] ?? t; }
  hasError(f: string): boolean { const c = this.form.get(f)!; return c.invalid && (c.dirty || c.touched); }

  openModal(): void {
    this.form.reset({ type: 'expense', icon: '📦', color: COLORS[0] });
    this.editMode.set(false); this.editId.set(null); this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); }

  editCat(cat: Category): void {
    this.editMode.set(true); this.editId.set(cat.id);
    this.form.patchValue(cat);
    this.showModal.set(true);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    const obs = this.editMode()
      ? this.svc.update(this.editId()!, this.form.value as any)
      : this.svc.create(this.form.value as any);
    obs.subscribe({
      next: () => { this.toast.success(this.editMode() ? 'Categoria atualizada' : 'Categoria criada'); this.closeModal(); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(): void {
    const id = this.deleteTarget()?.id;
    if (!id) return;
    this.saving.set(true);
    this.svc.delete(id).subscribe({
      next: () => { this.toast.success('Categoria eliminada'); this.deleteTarget.set(null); this.saving.set(false); this.load(); },
      error: () => this.saving.set(false),
    });
  }
}
