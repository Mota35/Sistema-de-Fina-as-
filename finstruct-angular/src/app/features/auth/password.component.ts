import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

/* ─── FORGOT PASSWORD ───────────────────────────────────────────────────────── */
@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center p-4 animate-fade-in"
     [class]="theme.isDark() ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'">
  <div class="w-full max-w-md">

    <!-- Logo -->
    <div class="flex justify-center mb-8">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
             [class]="theme.isDark() ? 'bg-amber-500' : 'bg-blue-600'">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <span class="font-extrabold text-lg">FinStruct</span>
      </div>
    </div>

    <!-- Card -->
    <div class="p-8 rounded-3xl border"
         [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200 shadow-sm'">

      <!-- Success State -->
      <div *ngIf="sent()" class="text-center py-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
             [class]="theme.isDark() ? 'bg-amber-500/10' : 'bg-blue-50'">
          <svg class="w-7 h-7" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'"
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
        </div>
        <h2 class="text-lg font-black mb-2">Email Enviado!</h2>
        <p class="text-xs mb-6" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Se o email <strong class="font-bold">{{ email }}</strong> estiver registado, receberá um link de recuperação em breve. Verifique também a pasta de spam.
        </p>
        <a routerLink="/auth/login"
           class="inline-flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
           [class]="theme.isDark() ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'">
          ← Voltar ao login
        </a>
      </div>

      <!-- Form State -->
      <div *ngIf="!sent()">
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
            <p class="text-[11px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Insira o email da sua conta</p>
          </div>
        </div>

        <p class="text-xs mb-6 leading-relaxed" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Enviaremos um link de redefinição de senha para o seu email. O link é válido por <strong>1 hora</strong>.
        </p>

        <div *ngIf="error()" class="p-3 rounded-xl border mb-4 text-xs"
             [class]="theme.isDark() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'">
          {{ error() }}
        </div>

        <form (ngSubmit)="submit()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="label">Email da Conta</label>
            <div class="relative">
              <input type="email" [(ngModel)]="email" name="email" required
                     placeholder="nome@empresa.com" class="input-base pl-9"/>
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
            {{ loading() ? 'A enviar...' : 'Enviar Link de Recuperação' }}
          </button>

          <a routerLink="/auth/login"
             class="text-center text-xs font-semibold transition-colors"
             [class]="theme.isDark() ? 'text-slate-500 hover:text-amber-500' : 'text-slate-400 hover:text-blue-600'">
            ← Voltar ao login
          </a>
        </form>
      </div>
    </div>
  </div>
</div>
  `
})
export class ForgotPasswordComponent {
  theme  = inject(ThemeService);
  private auth = inject(AuthService);

  email   = '';
  loading = signal(false);
  sent    = signal(false);
  error   = signal('');

  submit(): void {
    if (!this.email) { this.error.set('Insira um email válido.'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: () => { this.loading.set(false); this.sent.set(true); } // Always show success
    });
  }
}

/* ─── RESET PASSWORD ─────────────────────────────────────────────────────────── */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center p-4 animate-fade-in"
     [class]="theme.isDark() ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'">
  <div class="w-full max-w-md">

    <div class="flex justify-center mb-8">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl flex items-center justify-center"
             [class]="theme.isDark() ? 'bg-amber-500' : 'bg-blue-600'">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <span class="font-extrabold text-lg">FinStruct</span>
      </div>
    </div>

    <div class="p-8 rounded-3xl border"
         [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200 shadow-sm'">

      <!-- Success -->
      <div *ngIf="done()" class="text-center py-4">
        <div class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-500/10">
          <svg class="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h2 class="text-lg font-black mb-2">Senha Redefinida!</h2>
        <p class="text-xs mb-6" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          A sua senha foi atualizada com sucesso no sistema.
        </p>
        <a routerLink="/auth/login"
           class="inline-flex items-center gap-2 font-bold text-xs px-5 py-3 rounded-xl"
           [class]="theme.isDark() ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'">
          Aceder à Plataforma →
        </a>
      </div>

      <!-- No token -->
      <div *ngIf="!done() && !token" class="text-center py-4">
        <p class="text-sm text-red-400 mb-4">Link inválido ou expirado.</p>
        <a routerLink="/auth/forgot-password"
           class="text-xs font-bold" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">
          Solicitar novo link
        </a>
      </div>

      <!-- Form -->
      <div *ngIf="!done() && token">
        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center"
               [class]="theme.isDark() ? 'bg-amber-500/10' : 'bg-blue-50'">
            <svg class="w-5 h-5" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'"
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
          </div>
          <div>
            <h2 class="text-lg font-black">Nova Senha</h2>
            <p class="text-[11px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Defina a sua nova senha de acesso</p>
          </div>
        </div>

        <div *ngIf="error()" class="p-3 rounded-xl border mb-4 text-xs"
             [class]="theme.isDark() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'">
          {{ error() }}
        </div>

        <form (ngSubmit)="submit()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="label">Nova Senha (mín. 8 caracteres)</label>
            <input type="password" [(ngModel)]="password" name="pwd" required minlength="8"
                   placeholder="••••••••" class="input-base"/>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label">Confirmar Nova Senha</label>
            <input type="password" [(ngModel)]="confirmation" name="conf" required
                   placeholder="••••••••" class="input-base"/>
          </div>
          <button type="submit" [disabled]="loading()"
                  class="w-full font-extrabold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
            <div *ngIf="loading()" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            {{ loading() ? 'A atualizar...' : 'Redefinir Senha' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
  `
})
export class ResetPasswordComponent {
  theme  = inject(ThemeService);
  private auth  = inject(AuthService);
  private route = inject(ActivatedRoute);

  token        = this.route.snapshot.queryParamMap.get('token') ?? '';
  password     = '';
  confirmation = '';
  loading      = signal(false);
  done         = signal(false);
  error        = signal('');

  submit(): void {
    if (this.password !== this.confirmation) { this.error.set('As senhas não coincidem.'); return; }
    if (this.password.length < 8) { this.error.set('A senha deve ter pelo menos 8 caracteres.'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.resetPassword(this.token, this.password, this.confirmation).subscribe({
      next: r => { this.loading.set(false); if (r.success) this.done.set(true); else this.error.set(r.message); },
      error: e => { this.loading.set(false); this.error.set(e.error?.errors?.token?.[0] ?? e.error?.message ?? 'Token inválido ou expirado.'); }
    });
  }
}
