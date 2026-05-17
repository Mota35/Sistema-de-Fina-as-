import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { UploadHelper } from '../../core/services/upload.helper';
import { API } from '../../core/constants/api.constants';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="settings-layout animate-fade-in">
      <!-- Settings Sidebar Nav -->
      <aside class="settings-nav">
        <h2>Configurações</h2>
        <nav>
          <a class="snav-link" routerLink="../profile"      routerLinkActive="active">👤 Perfil</a>
          <a class="snav-link" routerLink="../preferences"  routerLinkActive="active">🎨 Preferências</a>
          <a class="snav-link" routerLink="../security"     routerLinkActive="active">🔒 Segurança</a>
        </nav>
      </aside>

      <div class="settings-content">
        <h1 class="page-title">Perfil</h1>
        <p class="page-subtitle">Gerir as informações da sua conta</p>

        <!-- Avatar Section -->
        <div class="card avatar-section">
          <div class="avatar-wrap">
            @if (avatarPreview()) {
              <img [src]="avatarPreview()" alt="Avatar" class="avatar-img">
            } @else {
              <div class="avatar-placeholder">{{ auth.user()?.name?.[0]?.toUpperCase() }}</div>
            }
            <label class="avatar-overlay" for="avatar-input">
              📷
              <input id="avatar-input" type="file" accept="image/*" hidden (change)="onAvatarChange($event)">
            </label>
          </div>
          <div class="avatar-info">
            <div class="user-name-big">{{ auth.user()?.name }}</div>
            <div class="user-email">{{ auth.user()?.email }}</div>
            <span class="badge badge-primary">{{ auth.user()?.role }}</span>
          </div>
        </div>

        <!-- Profile Form -->
        <div class="card">
          <h3 class="section-title">Informações Pessoais</h3>
          <form [formGroup]="form" (ngSubmit)="saveProfile()" class="profile-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nome *</label>
                <input class="form-control" formControlName="name" placeholder="Nome completo">
              </div>
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input class="form-control" type="email" formControlName="email" placeholder="seu@email.com">
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="form.invalid || saving()">
                @if (saving()) { <span class="spinner-sm"></span> }
                Guardar Alterações
              </button>
            </div>
          </form>
        </div>

        <!-- Danger Zone -->
        <div class="card danger-zone">
          <h3 class="section-title danger">⚠️ Zona de Perigo</h3>
          <p class="text-secondary">A eliminação da conta é permanente e não pode ser desfeita.</p>
          <button class="btn btn-danger btn-sm" style="margin-top:1rem"
                  (click)="showDeleteConfirm.set(true)">Eliminar Conta</button>
        </div>
      </div>
    </div>

    @if (showDeleteConfirm()) {
      <div class="overlay" (click)="showDeleteConfirm.set(false)"></div>
      <div class="confirm-dialog animate-scale-in">
        <div class="confirm-icon">⚠️</div>
        <h3>Eliminar Conta</h3>
        <p>Esta ação é <strong>irreversível</strong>. Todos os seus dados serão eliminados permanentemente.</p>
        <div class="confirm-btns">
          <button class="btn btn-outline" (click)="showDeleteConfirm.set(false)">Cancelar</button>
          <button class="btn btn-danger" (click)="deleteAccount()">Confirmar Eliminação</button>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings-layout { display:grid; grid-template-columns:220px 1fr; gap:1.5rem; align-items:start; }

    .settings-nav { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.25rem; position:sticky; top:80px; }
    .settings-nav h2 { font-size:.8rem; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:1rem; }
    .snav-link { display:flex; align-items:center; gap:.625rem; padding:.625rem .875rem; border-radius:var(--radius-md); font-size:.875rem; font-weight:500; color:var(--text-secondary); text-decoration:none; transition:all var(--transition); margin-bottom:2px; }
    .snav-link:hover { background:var(--bg-surface2); color:var(--text-primary); }
    .snav-link.active { background:var(--clr-primary-glow); color:var(--clr-primary); }

    .settings-content { display:flex; flex-direction:column; gap:1.25rem; }
    .page-title { font-size:1.5rem; font-weight:700; margin-bottom:.25rem; }
    .page-subtitle { color:var(--text-secondary); font-size:.9rem; margin-bottom:0; }

    .card { background:var(--bg-surface); border:1px solid var(--border); border-radius:var(--radius-xl); padding:1.5rem; }
    .section-title { font-size:1rem; font-weight:700; margin-bottom:1.25rem; }
    .section-title.danger { color:var(--clr-danger); }

    .avatar-section { display:flex; align-items:center; gap:1.5rem; }
    .avatar-wrap { position:relative; flex-shrink:0; }
    .avatar-img { width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid var(--clr-primary); }
    .avatar-placeholder { width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg,var(--clr-primary),#a78bfa); display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:700; color:#fff; }
    .avatar-overlay { position:absolute; inset:0; border-radius:50%; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; font-size:1.25rem; cursor:pointer; opacity:0; transition:opacity var(--transition); }
    .avatar-wrap:hover .avatar-overlay { opacity:1; }
    .avatar-info { display:flex; flex-direction:column; gap:.375rem; }
    .user-name-big { font-size:1.125rem; font-weight:700; }
    .user-email { font-size:.875rem; color:var(--text-secondary); }

    .profile-form { display:flex; flex-direction:column; gap:1rem; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    .form-actions { display:flex; justify-content:flex-end; padding-top:.5rem; }

    .danger-zone { border-color:rgba(239,68,68,.2); }

    .confirm-dialog { position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:var(--bg-surface); border-radius:var(--radius-xl); padding:2rem; width:100%; max-width:380px; text-align:center; box-shadow:var(--shadow-lg); z-index:200; }
    .confirm-icon { font-size:2.5rem; margin-bottom:1rem; }
    .confirm-dialog h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .confirm-dialog p { color:var(--text-secondary); font-size:.9rem; margin-bottom:1.5rem; line-height:1.6; }
    .confirm-btns { display:flex; gap:.75rem; justify-content:center; }

    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }

    @media (max-width:768px) { .settings-layout { grid-template-columns:1fr; } .form-row { grid-template-columns:1fr; } .settings-nav { position:static; } }
  `],
})
export class ProfileComponent implements OnInit {
  auth  = inject(AuthService);
  private http  = inject(HttpClient);
  private toast = inject(ToastService);
  private fb    = inject(FormBuilder);

  saving           = signal(false);
  avatarPreview    = signal<string>('');
  showDeleteConfirm = signal(false);

  form = this.fb.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const u = this.auth.user();
    if (u) { this.form.patchValue({ name: u.name, email: u.email }); }
    if (u?.avatar) { this.avatarPreview.set(u.avatar); }
  }

  onAvatarChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => this.avatarPreview.set(ev.target?.result as string);
    reader.readAsDataURL(file);
    const fd = new FormData();
    fd.append('avatar', file);
    this.http.post<any>(API.USERS.AVATAR, fd).subscribe({
      next: r => { this.toast.success('Avatar atualizado!'); if (r.data?.user) this.auth.updateUser(r.data.user); },
      error: () => this.toast.error('Erro ao atualizar avatar'),
    });
  }

  saveProfile(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.http.put<any>(API.AUTH.ME, this.form.value).subscribe({
      next: r => { this.toast.success('Perfil atualizado!'); if (r.data?.user) this.auth.updateUser(r.data.user); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  deleteAccount(): void {
    this.http.delete<any>(API.USERS.BY_ID(this.auth.user()!.id)).subscribe({
      next: () => { this.auth.logout(); },
      error: () => this.toast.error('Erro ao eliminar conta'),
    });
  }
}
