import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-box animate-scale-in">
      <div class="auth-head">
        <div class="auth-icon">🔐</div>
        <h2>Recuperar senha</h2>
        <p>Introduza o seu email e enviaremos um link para redefinir a sua senha.</p>
      </div>

      @if (sent()) {
        <div class="success-box animate-fade-in">
          <div class="success-icon">✅</div>
          <h3>Email enviado!</h3>
          <p>Verifique a sua caixa de entrada em <strong>{{ form.value.email }}</strong> e siga as instruções.</p>
          <a routerLink="/login" class="btn btn-primary" style="margin-top:1rem;width:100%">Voltar ao login</a>
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input class="form-control" [class.error]="hasError('email')"
                   type="email" formControlName="email"
                   placeholder="seu@email.com" autocomplete="email">
            @if (hasError('email')) {
              <span class="form-error">⚠ Introduza um email válido</span>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-lg w-full"
                  style="margin-top:1.5rem" [disabled]="loading() || form.invalid">
            @if (loading()) { <span class="spinner"></span> A enviar... }
            @else { Enviar link de recuperação }
          </button>

          @if (serverError()) {
            <div class="server-error animate-fade-in">❌ {{ serverError() }}</div>
          }
        </form>

        <p class="auth-footer">
          <a routerLink="/login" class="link">← Voltar ao login</a>
        </p>
      }
    </div>
  `,
  styles: [`
    .auth-box { width:100%; max-width:420px; }
    .auth-head { margin-bottom:2rem; text-align:center; }
    .auth-icon { font-size:2.5rem; margin-bottom:1rem; }
    .auth-head h2 { font-size:1.75rem; font-weight:700; margin-bottom:.375rem; }
    .auth-head p { color:var(--text-secondary); font-size:.9rem; line-height:1.6; }
    .w-full { width:100%; }
    .link { color:var(--clr-primary); font-weight:500; text-decoration:none; font-size:.875rem; }
    .link:hover { text-decoration:underline; }
    .auth-footer { text-align:center; margin-top:1.5rem; }
    .server-error { margin-top:.75rem; padding:.75rem 1rem; background:rgba(239,68,68,.08); border:1px solid rgba(239,68,68,.2); border-radius:var(--radius-md); color:var(--clr-danger); font-size:.875rem; text-align:center; }
    .success-box { text-align:center; padding:1.5rem; background:rgba(34,197,94,.06); border:1px solid rgba(34,197,94,.2); border-radius:var(--radius-lg); }
    .success-icon { font-size:2.5rem; margin-bottom:.75rem; }
    .success-box h3 { font-size:1.125rem; font-weight:700; margin-bottom:.5rem; }
    .success-box p { color:var(--text-secondary); font-size:.9rem; line-height:1.6; }
    .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .6s linear infinite; display:inline-block; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ForgotPasswordComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  loading     = signal(false);
  sent        = signal(false);
  serverError = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  hasError(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.serverError.set('');
    this.auth.forgotPassword(this.form.value.email!).subscribe({
      next:  () => { this.sent.set(true); this.loading.set(false); },
      error: err => { this.serverError.set(err.error?.message ?? 'Erro ao enviar email.'); this.loading.set(false); },
    });
  }
}
