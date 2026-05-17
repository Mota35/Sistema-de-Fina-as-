import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { API } from '../../core/constants/api.constants';

function passwordMatch(ctrl: AbstractControl) {
  return ctrl.get('new_password')?.value === ctrl.get('new_password_confirmation')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive],
  template: `
    <div class="settings-layout animate-fade-in">
      <aside class="settings-nav">
        <h2>Configurações</h2>
        <nav>
          <a class="snav-link" routerLink="../profile"     routerLinkActive="active">👤 Perfil</a>
          <a class="snav-link" routerLink="../preferences" routerLinkActive="active">🎨 Preferências</a>
          <a class="snav-link" routerLink="../security"    routerLinkActive="active">🔒 Segurança</a>
        </nav>
      </aside>

      <div class="settings-content">
        <h1 class="page-title">Segurança</h1>
        <p class="page-subtitle">Gerir a segurança e acesso à sua conta</p>

        <!-- Change Password -->
        <div class="card">
          <h3 class="section-title">🔑 Alterar Senha</h3>
          <form [formGroup]="pwForm" (ngSubmit)="changePassword()" class="pw-form">
            <div class="form-group">
              <label class="form-label">Senha atual *</label>
              <div class="input-wrap">
                <input class="form-control" [class.error]="hasErr('current_password')"
                       [type]="show['current'] ? 'text' : 'password'"
                       formControlName="current_password" placeholder="A sua senha atual">
                <button type="button" class="eye-btn" (click)="show['current'] = !show['current']">
                  {{ show['current'] ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Nova senha *</label>
              <div class="input-wrap">
                <input class="form-control" [class.error]="hasErr('new_password')"
                       [type]="show['new'] ? 'text' : 'password'"
                       formControlName="new_password" placeholder="Mínimo 8 caracteres">
                <button type="button" class="eye-btn" (click)="show['new'] = !show['new']">
                  {{ show['new'] ? '🙈' : '👁️' }}
                </button>
              </div>

              <!-- Strength -->
              @if (pwForm.get('new_password')?.value) {
                <div class="strength-bar">
                  <div class="strength-fill" [class]="strengthClass()" [style.width]="strengthWidth()"></div>
                </div>
                <span class="strength-lbl" [class]="strengthClass()">Força: {{ strengthLabel() }}</span>
              }
            </div>
            <div class="form-group">
              <label class="form-label">Confirmar nova senha *</label>
              <input class="form-control"
                     [class.error]="pwForm.hasError('mismatch') && pwForm.get('new_password_confirmation')?.touched"
                     type="password" formControlName="new_password_confirmation" placeholder="Repita a nova senha">
              @if (pwForm.hasError('mismatch') && pwForm.get('new_password_confirmation')?.touched) {
                <span class="form-error">⚠ As senhas não coincidem</span>
              }
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="pwForm.invalid || saving()">
                @if (saving()) { <span class="spinner-sm"></span> }
                Alterar Senha
              </button>
            </div>
          </form>
        </div>

        <!-- Security Info -->
        <div class="card">
          <h3 class="section-title">🛡️ Informação de Segurança</h3>
          <div class="security-list">
            <div class="security-item">
              <div class="sec-icon ok">✅</div>
              <div>
                <div class="sec-label">Autenticação JWT ativa</div>
                <div class="sec-desc text-secondary">Os seus dados são protegidos com tokens seguros</div>
              </div>
            </div>
            <div class="security-item">
              <div class="sec-icon ok">✅</div>
              <div>
                <div class="sec-label">Ligação encriptada (HTTPS)</div>
                <div class="sec-desc text-secondary">Toda a comunicação com o servidor é encriptada</div>
              </div>
            </div>
            <div class="security-item">
              <div class="sec-icon warn">⚠️</div>
              <div>
                <div class="sec-label">Autenticação de dois fatores</div>
                <div class="sec-desc text-secondary">2FA não está configurado — recomendamos ativar</div>
              </div>
              <button class="btn btn-outline btn-sm" style="margin-left:auto" disabled>Em breve</button>
            </div>
          </div>
        </div>

        <!-- Active Sessions -->
        <div class="card">
          <h3 class="section-title">📱 Sessões Ativas</h3>
          <div class="session-list">
            @for (s of sessions; track s.id) {
              <div class="session-item">
                <div class="session-icon">{{ s.icon }}</div>
                <div class="session-info">
                  <div class="session-name">{{ s.device }}</div>
                  <div class="session-meta text-secondary">{{ s.location }} · {{ s.lastSeen }}</div>
                </div>
                @if (s.current) {
                  <span class="badge badge-success">Atual</span>
                } @else {
                  <button class="btn btn-ghost btn-sm" (click)="revokeSession(s.id)">Revogar</button>
                }
              </div>
            }
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top:1rem" (click)="revokeAll()">
            Terminar todas as outras sessões
          </button>
        </div>

        <!-- Danger Zone -->
        <div class="card danger-zone">
          <h3 class="section-title danger">☠️ Ações Irreversíveis</h3>
          <div class="danger-actions">
            <div>
              <div class="pref-label">Terminar Sessão em Todos os Dispositivos</div>
              <div class="text-secondary" style="font-size:.85rem">Irá ser desconectado imediatamente</div>
            </div>
            <button class="btn btn-danger btn-sm" (click)="logoutAll()">Terminar Todas as Sessões</button>
          </div>
        </div>
      </div>
    </div>
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

    .pw-form { display:flex; flex-direction:column; gap:1rem; }
    .input-wrap { position:relative; }
    .eye-btn { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1rem; }
    .form-actions { display:flex; justify-content:flex-end; }

    .strength-bar { height:5px; background:var(--bg-surface2); border-radius:99px; margin-top:.5rem; overflow:hidden; }
    .strength-fill { height:100%; border-radius:99px; transition:width .4s,background .4s; }
    .strength-fill.weak   { background:var(--clr-danger); }
    .strength-fill.medium { background:var(--clr-warning); }
    .strength-fill.strong { background:var(--clr-success); }
    .strength-lbl { font-size:.75rem; font-weight:600; display:block; margin-top:3px; }
    .strength-lbl.weak   { color:var(--clr-danger); }
    .strength-lbl.medium { color:var(--clr-warning); }
    .strength-lbl.strong { color:var(--clr-success); }

    .security-list { display:flex; flex-direction:column; gap:.875rem; }
    .security-item { display:flex; align-items:center; gap:.875rem; padding:.75rem; background:var(--bg-surface2); border-radius:var(--radius-md); }
    .sec-icon { font-size:1.25rem; flex-shrink:0; }
    .sec-label { font-size:.9rem; font-weight:500; }
    .sec-desc { font-size:.8rem; margin-top:2px; }

    .session-list { display:flex; flex-direction:column; gap:.625rem; }
    .session-item { display:flex; align-items:center; gap:.875rem; padding:.75rem; border:1px solid var(--border); border-radius:var(--radius-md); }
    .session-icon { font-size:1.5rem; }
    .session-info { flex:1; }
    .session-name { font-size:.9rem; font-weight:500; }
    .session-meta { font-size:.8rem; margin-top:2px; }

    .danger-zone { border-color:rgba(239,68,68,.2); }
    .danger-actions { display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
    .pref-label { font-size:.9375rem; font-weight:500; }

    .spinner-sm { width:14px; height:14px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    @media (max-width:768px) { .settings-layout { grid-template-columns:1fr; } .settings-nav { position:static; } }
  `],
})
export class SecurityComponent {
  private fb    = inject(FormBuilder);
  private http  = inject(HttpClient);
  private toast = inject(ToastService);
  private auth  = inject(AuthService);

  saving = signal(false);
  show: Record<string, boolean> = { current: false, new: false };

  sessions = [
    { id: 1, icon: '💻', device: 'Chrome — Windows 11',    location: 'Lisboa, PT',  lastSeen: 'Agora',     current: true },
    { id: 2, icon: '📱', device: 'Safari — iPhone 15',     location: 'Porto, PT',   lastSeen: 'Há 2 horas', current: false },
    { id: 3, icon: '🖥️', device: 'Firefox — macOS',        location: 'Londres, UK', lastSeen: 'Há 3 dias',  current: false },
  ];

  pwForm = this.fb.group({
    current_password:          ['', Validators.required],
    new_password:              ['', [Validators.required, Validators.minLength(8)]],
    new_password_confirmation: ['', Validators.required],
  }, { validators: passwordMatch });

  hasErr(f: string): boolean {
    const c = this.pwForm.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  strengthScore(): number {
    const pw = this.pwForm.get('new_password')?.value ?? '';
    let s = 0;
    if (pw.length >= 8)           s++;
    if (/[A-Z]/.test(pw))        s++;
    if (/[0-9]/.test(pw))        s++;
    if (/[^a-zA-Z0-9]/.test(pw)) s++;
    return s;
  }
  strengthClass(): string { return ['', 'weak', 'medium', 'medium', 'strong'][this.strengthScore()]; }
  strengthWidth(): string { return ['0%', '25%', '50%', '75%', '100%'][this.strengthScore()]; }
  strengthLabel(): string { return ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][this.strengthScore()]; }

  changePassword(): void {
    if (this.pwForm.invalid) { this.pwForm.markAllAsTouched(); return; }
    this.saving.set(true);
    this.http.post<any>(`${API.AUTH.ME}/password`, this.pwForm.value).subscribe({
      next: () => { this.toast.success('Senha alterada com sucesso!'); this.pwForm.reset(); this.saving.set(false); },
      error: err => { this.toast.error(err.error?.message ?? 'Senha atual incorreta'); this.saving.set(false); },
    });
  }

  revokeSession(id: number): void {
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.toast.info('Sessão revogada');
  }

  revokeAll(): void {
    this.sessions = this.sessions.filter(s => s.current);
    this.toast.success('Todas as outras sessões foram terminadas');
  }

  logoutAll(): void { this.auth.logout(); }
}
