import { Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-box animate-scale-in">
      <div class="auth-head">
        <h2>Bem-vindo de volta</h2>
        <p>Entre na sua conta para continuar</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-control" [class.error]="hasError('email')"
                 type="email" formControlName="email"
                 placeholder="seu@email.com" autocomplete="email">
          @if (hasError('email')) {
            <span class="form-error">⚠ Email inválido</span>
          }
        </div>

        <div class="form-group" style="margin-top:1rem">
          <label class="form-label">Senha</label>
          <div class="input-wrapper">
            <input class="form-control" [class.error]="hasError('password')"
                   [type]="showPass() ? 'text' : 'password'"
                   formControlName="password"
                   placeholder="••••••••" autocomplete="current-password">
            <button type="button" class="input-addon" (click)="showPass.set(!showPass())">
              {{ showPass() ? '🙈' : '👁️' }}
            </button>
          </div>
          @if (hasError('password')) {
            <span class="form-error">⚠ Senha obrigatória</span>
          }
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" formControlName="remember">
            Lembrar-me
          </label>
          <a routerLink="/forgot-password" class="link">Esqueci a senha</a>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-full"
                [disabled]="loading() || form.invalid">
          @if (loading()) {
            <span class="spinner"></span> Entrando...
          } @else {
            Entrar
          }
        </button>

        @if (serverError()) {
          <div class="server-error animate-fade-in">
            ❌ {{ serverError() }}
          </div>
        }
      </form>

      <p class="auth-footer">
        Não tem conta? <a routerLink="/register" class="link">Criar conta grátis</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-box {
      width: 100%;
      max-width: 420px;
    }
    .auth-head {
      margin-bottom: 2rem;
      text-align: center;
    }
    .auth-head h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: .375rem;
    }
    .auth-head p {
      color: var(--text-secondary);
    }
    .input-wrapper { position: relative; }
    .input-addon {
      position: absolute;
      right: .75rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      cursor: pointer; font-size: 1rem;
    }
    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 1rem 0;
    }
    .checkbox-label {
      display: flex; align-items: center; gap: .5rem;
      font-size: .875rem; color: var(--text-secondary); cursor: pointer;
    }
    .link {
      color: var(--clr-primary);
      font-size: .875rem;
      font-weight: 500;
      text-decoration: none;
    }
    .link:hover { text-decoration: underline; }
    .w-full { width: 100%; }
    .server-error {
      margin-top: .75rem;
      padding: .75rem 1rem;
      background: rgba(239,68,68,.08);
      border: 1px solid rgba(239,68,68,.2);
      border-radius: var(--radius-md);
      color: var(--clr-danger);
      font-size: .875rem;
      text-align: center;
    }
    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      color: var(--text-secondary);
      font-size: .9rem;
    }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoginComponent {
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private toast  = inject(ToastService);

  loading     = signal(false);
  showPass    = signal(false);
  serverError = signal('');

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    remember: [false],
  });

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && (c.dirty || c.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.serverError.set('');

    const { email, password } = this.form.value;

    this.auth.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.toast.success('Bem-vindo de volta!');
        this.router.navigate(['/app/dashboard']);
      },
      error: err => {
        this.serverError.set(err.error?.message ?? 'Credenciais inválidas.');
        this.loading.set(false);
      },
    });
  }
}
