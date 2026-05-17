import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

function passwordMatch(ctrl: AbstractControl) {
  const pw  = ctrl.get('password')?.value;
  const pwc = ctrl.get('password_confirmation')?.value;
  return pw === pwc ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-box animate-scale-in">
      <div class="auth-head">
        <h2>Criar conta</h2>
        <p>Comece a gerir as suas finanças hoje</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

        <div class="form-group">
          <label class="form-label">Nome completo</label>
          <input class="form-control" [class.error]="hasError('name')"
                 formControlName="name" placeholder="João Silva">
        </div>

        <div class="form-group" style="margin-top:.875rem">
          <label class="form-label">Email</label>
          <input class="form-control" [class.error]="hasError('email')"
                 type="email" formControlName="email" placeholder="seu@email.com">
        </div>

        <div class="form-group" style="margin-top:.875rem">
          <label class="form-label">Senha</label>
          <input class="form-control" [class.error]="hasError('password')"
                 type="password" formControlName="password" placeholder="Mínimo 8 caracteres">
        </div>

        <div class="form-group" style="margin-top:.875rem">
          <label class="form-label">Confirmar senha</label>
          <input class="form-control" [class.error]="hasError('password_confirmation')"
                 type="password" formControlName="password_confirmation" placeholder="Repita a senha">
          @if (form.hasError('mismatch') && form.get('password_confirmation')?.touched) {
            <span class="form-error">⚠ As senhas não coincidem</span>
          }
        </div>

        <div class="terms-row">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="terms">
            Aceito os <a href="#" class="link">Termos de Serviço</a> e <a href="#" class="link">Política de Privacidade</a>
          </label>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full"
                [disabled]="loading() || form.invalid">
          @if (loading()) { <span class="spinner"></span> Criando conta... }
          @else { Criar conta grátis }
        </button>

        @if (serverError()) {
          <div class="server-error animate-fade-in">❌ {{ serverError() }}</div>
        }
      </form>

      <p class="auth-footer">
        Já tem conta? <a routerLink="/login" class="link">Entrar</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-box { width: 100%; max-width: 420px; }
    .auth-head { margin-bottom: 2rem; text-align: center; }
    .auth-head h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: .375rem; }
    .auth-head p { color: var(--text-secondary); }
    .terms-row { margin: 1rem 0; }
    .checkbox-label { display: flex; align-items: flex-start; gap: .5rem; font-size: .875rem; color: var(--text-secondary); cursor: pointer; line-height: 1.5; }
    .link { color: var(--clr-primary); font-size: inherit; font-weight: 500; text-decoration: none; }
    .link:hover { text-decoration: underline; }
    .w-full { width: 100%; }
    .server-error { margin-top: .75rem; padding: .75rem 1rem; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: var(--radius-md); color: var(--clr-danger); font-size: .875rem; text-align: center; }
    .auth-footer { text-align: center; margin-top: 2rem; color: var(--text-secondary); font-size: .9rem; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class RegisterComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private toast  = inject(ToastService);

  loading     = signal(false);
  serverError = signal('');

  form = this.fb.group({
    name:                  ['', [Validators.required, Validators.minLength(3)]],
    email:                 ['', [Validators.required, Validators.email]],
    password:              ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
    terms:                 [false, Validators.requiredTrue],
  }, { validators: passwordMatch });

  hasError(f: string): boolean {
    const c = this.form.get(f)!;
    return c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    const { name, email, password, password_confirmation } = this.form.value;

    this.auth.register({ name: name!, email: email!, password: password!, password_confirmation: password_confirmation! }).subscribe({
      next: () => {
        this.toast.success('Conta criada!', 'Bem-vindo ao FinancePro.');
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.serverError.set(err.error?.message ?? 'Erro ao criar conta.');
        this.loading.set(false);
      },
    });
  }
}
