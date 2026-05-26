import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/* ─── FORGOT PASSWORD ───────────────────────────────────────────────────────── */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  template: `
<div class="min-h-screen flex items-center justify-center p-4 animate-fade-in"
     [class]="theme.isDark() ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'">
  <div class="w-full max-w-md">

    <!-- Logo -->
    <div class="flex justify-center mb-8">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
             [class]="theme.isDark() ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <span class="font-extrabold text-lg tracking-tight">FinStruct</span>
      </div>
    </div>

    <!-- Card -->
    <div class="p-8 rounded-3xl border transition-all duration-300"
         [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200 shadow-sm'">

      <!-- Step 1: Request Code -->
      <div *ngIf="step() === 1">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               [class]="theme.isDark() ? 'bg-amber-500/10' : 'bg-blue-50'">
            <svg class="w-5 h-5" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-black">Recuperar Senha</h2>
            <p class="text-[11px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Insira o e-mail cadastrado</p>
          </div>
        </div>

        <p class="text-xs mb-6 leading-relaxed" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Enviaremos um <strong>código de 6 dígitos</strong> para o seu e-mail para validar a sua identidade.
        </p>

        <div *ngIf="error()" class="p-3 rounded-xl border mb-4 text-xs"
             [class]="theme.isDark() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'">
          {{ error() }}
        </div>

        <form (ngSubmit)="requestCode()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="label">E-mail da Conta</label>
            <div class="relative">
              <input type="email" [(ngModel)]="email" name="email" required
                     placeholder="nome@exemplo.com" class="input-base pl-9"/>
              <svg class="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>

          <button type="submit" [disabled]="loading()"
                  class="w-full font-extrabold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
            <div *ngIf="loading()" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            {{ loading() ? 'A enviar...' : 'Enviar Código' }}
          </button>

          <a routerLink="/auth/login"
             class="text-center text-xs font-semibold transition-colors mt-2"
             [class]="theme.isDark() ? 'text-slate-500 hover:text-amber-500' : 'text-slate-400 hover:text-blue-600'">
            ← Voltar ao login
          </a>
        </form>
      </div>

      <!-- Step 2: Enter Code & New Password -->
      <div *ngIf="step() === 2">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               [class]="theme.isDark() ? 'bg-amber-500/10' : 'bg-blue-50'">
            <svg class="w-5 h-5" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-black">Validar Acesso</h2>
            <p class="text-[11px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Código enviado para {{ email }}</p>
          </div>
        </div>

        <div *ngIf="error()" class="p-3 rounded-xl border mb-4 text-xs"
             [class]="theme.isDark() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'">
          {{ error() }}
        </div>

        <form (ngSubmit)="resetPassword()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="label">Código de 6 dígitos</label>
            <input type="text" [(ngModel)]="code" name="code" required maxlength="6"
                   placeholder="000000" class="input-base text-center text-xl tracking-[0.5em] font-black"/>
          </div>

          <div class="grid grid-cols-1 gap-4 mt-2">
            <div class="flex flex-col gap-1.5">
              <label class="label">Nova Senha</label>
              <input type="password" [(ngModel)]="password" name="pwd" required minlength="8"
                     placeholder="••••••••" class="input-base"/>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="label">Confirmar Nova Senha</label>
              <input type="password" [(ngModel)]="confirmation" name="conf" required
                     placeholder="••••••••" class="input-base"/>
            </div>
          </div>

          <button type="submit" [disabled]="loading()"
                  class="w-full font-extrabold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60"
                  [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
            <div *ngIf="loading()" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            {{ loading() ? 'A atualizar...' : 'Redefinir Senha' }}
          </button>
          
          <button type="button" (click)="step.set(1)"
                  class="text-center text-xs font-semibold text-slate-500 hover:text-slate-400 transition-colors">
            Reenviar código
          </button>
        </form>
      </div>

      <!-- Step 3: Success -->
      <div *ngIf="step() === 3" class="text-center py-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-500/10">
          <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-lg font-black mb-2">Tudo pronto!</h2>
        <p class="text-xs mb-6" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          A sua senha foi atualizada com sucesso. Pode agora aceder à plataforma com as novas credenciais.
        </p>
        <a routerLink="/auth/login"
           class="inline-flex items-center gap-2 font-bold text-xs px-6 py-3 rounded-xl shadow-lg transition-all"
           [class]="theme.isDark() ? 'bg-amber-500 text-black shadow-amber-500/20' : 'bg-blue-600 text-white shadow-blue-500/20'">
          Aceder à Plataforma →
        </a>
      </div>

    </div>
  </div>
</div>
  `
})
export class ForgotPasswordComponent {
  theme  = inject(ThemeService);
  private auth = inject(AuthService);

  step    = signal(1); // 1: Request, 2: Reset, 3: Success
  email   = '';
  code    = '';
  password     = '';
  confirmation = '';
  loading = signal(false);
  error   = signal('');

  requestCode(): void {
    if (!this.email) { this.error.set('Insira um e-mail válido.'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.step.set(2); },
      error: () => { this.loading.set(false); this.step.set(2); } // Silence for security
    });
  }

  resetPassword(): void {
    if (!this.code || this.code.length < 6) { this.error.set('Insira o código de 6 dígitos.'); return; }
    if (this.password !== this.confirmation) { this.error.set('As senhas não coincidem.'); return; }
    if (this.password.length < 8) { this.error.set('A senha deve ter pelo menos 8 caracteres.'); return; }

    this.loading.set(true); this.error.set('');
    this.auth.resetPassword(this.code, this.password, this.confirmation).subscribe({
      next: r => { 
        this.loading.set(false); 
        if (r.success) this.step.set(3); 
        else this.error.set(r.message); 
      },
      error: e => { 
        this.loading.set(false); 
        this.error.set(e.error?.message ?? 'Código inválido ou expirado.'); 
      }
    });
  }
}

// Keep the ResetPasswordComponent but it's now mostly redundant if we use the step-based flow above.
// For compatibility with routes, we can just leave it or redirect it.
@Component({
  selector: 'app-reset-password-legacy',
  standalone: true,
  template: ''
})
export class ResetPasswordComponent {
  private router = inject(Router);
  constructor() { this.router.navigate(['/auth/forgot-password']); }
}
