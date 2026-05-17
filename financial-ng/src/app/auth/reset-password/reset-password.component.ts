import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

function passwordMatch(ctrl: AbstractControl) {
  return ctrl.get('password')?.value === ctrl.get('password_confirmation')?.value
    ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-box animate-scale-in">
      <div class="auth-head">
        <div class="auth-icon">🔑</div>
        <h2>Nova senha</h2>
        <p>Escolha uma nova senha segura para a sua conta.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="form-group">
          <label class="form-label">Nova senha</label>
          <div class="input-wrapper">
            <input class="form-control" [class.error]="hasError('password')"
                   [type]="showPass() ? 'text' : 'password'"
                   formControlName="password" placeholder="Mínimo 8 caracteres">
            <button type="button" class="input-addon" (click)="showPass.set(!showPass())">
              {{ showPass() ? '🙈' : '👁️' }}
            </button>
          </div>
          @if (hasError('password')) {
            <span class="form-error">⚠ Mínimo 8 caracteres</span>
          }
        </div>

        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">Confirmar nova senha</label>
          <input class="form-control" [class.error]="hasError('password_confirmation')"
                 type="password" formControlName="password_confirmation" placeholder="Repita a senha">
          @if (form.hasError('mismatch') && form.get('password_confirmation')?.touched) {
            <span class="form-error">⚠ As senhas não coincidem</span>
          }
        </div>

        <!-- Password strength -->
        @if (form.get('password')?.value) {
          <div class="strength-bar animate-fade-in">
            <div class="strength-fill" [class]="strengthClass()" [style.width]="strengthWidth()"></div>
          </div>
          <span class="strength-label" [class]="strengthClass()">{{ strengthLabel() }}</span>
        }

        <button type="submit" class="btn btn-primary btn-lg w-full"
                style="margin-top:1.5rem" [disabled]="loading() || form.invalid">
          @if (loading()) { <span class="spinner"></span> A guardar... }
          @else { Redefinir senha }
        </button>

        @if (serverError()) {
          <div class="server-error animate-fade-in">❌ {{ serverError() }}</div>
        }
      </form>
    </div>
  `,
  styles: [`
    .auth-box { width:100%; max-width:420px; }
    .auth-head { margin-bottom:2rem; text-align:center; }
    .auth-icon { font-size:2.5rem; margin-bottom:1rem; }
    .auth-head h2 { font-size:1.75rem; font-weight:700; margin-bottom:.375rem; }
    .auth-head p { color:var(--text-secondary); font-size:.9rem; }
    .input-wrapper { position:relative; }
    .input-addon { position:absolute; right:.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; font-size:1rem; }
    .w-full { width:100%; }
    .server-error { margin-top:.75rem; padding:.75rem 1rem; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:var(--radius-md); color:var(--clr-danger); font-size:.875rem; text-align:center; }
    .strength-bar { height:5px; background:var(--bg-surface2); border-radius:99px; overflow:hidden; margin-top:.75rem; }
    .strength-fill { height:100%; border-radius:99px; transition:width .4s,background .4s; }
    .strength-fill.weak   { background:var(--clr-danger); }
    .strength-fill.medium { background:var(--clr-warning); }
    .strength-fill.strong { background:var(--clr-success); }
    .strength-label { font-size:.75rem; font-weight:600; margin-top:4px; display:block; }
    .strength-label.weak   { color:var(--clr-danger); }
    .strength-label.medium { color:var(--clr-warning); }
    .strength-label.strong { color:var(--clr-success); }
    .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  private toast  = inject(ToastService);

  loading     = signal(false);
  showPass    = signal(false);
  serverError = signal('');
  token       = '';

  form = this.fb.group({
    password:              ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  }, { validators: passwordMatch });

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
  }

  hasError(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  strengthScore(): number {
    const pw = this.form.get('password')?.value ?? '';
    let score = 0;
    if (pw.length >= 8)  score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    return score;
  }

  strengthClass(): string { return ['', 'weak', 'medium', 'medium', 'strong'][this.strengthScore()]; }
  strengthWidth(): string { return ['0%', '25%', '50%', '75%', '100%'][this.strengthScore()]; }
  strengthLabel(): string { return ['', 'Fraca', 'Razoável', 'Boa', 'Forte'][this.strengthScore()]; }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    const { password, password_confirmation } = this.form.value;
    this.auth.resetPassword(this.token, password!, password_confirmation!).subscribe({
      next: () => {
        this.toast.success('Senha redefinida!', 'Pode agora fazer login com a nova senha.');
        this.router.navigate(['/login']);
      },
      error: err => { this.serverError.set(err.error?.message ?? 'Token inválido ou expirado.'); this.loading.set(false); },
    });
  }
}
