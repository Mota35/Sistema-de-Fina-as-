import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen flex flex-col md:flex-row font-sans animate-fade-in"
     [class]="theme.isDark() ? 'bg-black text-white' : 'bg-white text-slate-900'">

  <!-- Left Panel -->
  <div class="w-full md:w-[45%] flex flex-col justify-between p-8 md:p-12 lg:p-16 relative overflow-hidden"
       [class]="theme.isDark() ? 'bg-[#0a0a0a] border-r border-white/5' : 'bg-slate-50 border-r border-slate-200'">
    <!-- Glow blobs -->
    <div class="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full blur-3xl pointer-events-none"
         [class]="theme.isDark() ? 'bg-amber-500/5' : 'bg-blue-500/5'"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-3xl pointer-events-none"
         [class]="theme.isDark() ? 'bg-amber-400/3' : 'bg-blue-400/5'"></div>

    <!-- Brand -->
    <div class="flex items-center gap-3 z-10">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
           [class]="theme.isDark() ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <div>
        <span class="font-extrabold text-lg tracking-tight block"
              [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">FinStruct</span>
        <span class="text-[10px] font-mono tracking-wider uppercase font-semibold"
              [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">Intelligence & Wealth</span>
      </div>
    </div>

    <!-- Hero text -->
    <div class="my-auto py-12 z-10 max-w-sm">
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono mb-6"
           [class]="theme.isDark() ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-blue-50 border-blue-200 text-blue-700'">
        <svg class="w-3.5 h-3.5" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'"
             fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        PLATAFORMA CERTIFICADA SEC/CVM
      </div>
      <h1 class="text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight"
          [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        Inteligência Estratégica para o seu Patrimônio.
      </h1>
      <p class="text-sm mt-4 leading-relaxed" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Desenhado para investidores que exigem sofisticação absoluta e estruturação de alta performance.
      </p>

      <!-- Mini chart decoration -->
      <div class="mt-8 p-4 rounded-2xl border"
           [class]="theme.isDark() ? 'bg-black/60 border-white/5' : 'bg-white border-slate-200 shadow-sm'">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-mono" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">PATRIMÔNIO SOB GESTÃO</span>
          <span class="text-[10px] font-mono font-bold" [class]="theme.isDark() ? 'text-amber-400' : 'text-blue-600'">+14.2% A.A.</span>
        </div>
        <div class="h-14 flex items-end gap-1.5">
          <div *ngFor="let h of [20,35,30,55,45,70,95]; let i=index" class="flex-1 rounded-sm transition-all duration-300"
               [style.height.%]="h"
               [class]="i === 6 ? (theme.isDark() ? 'bg-amber-500/30 border-t border-amber-500' : 'bg-blue-500/20 border-t border-blue-500')
                                : (theme.isDark() ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-200 hover:bg-slate-300')"></div>
        </div>
      </div>
    </div>

    <!-- Social proof -->
    <div class="z-10 flex items-center gap-4 border-t pt-6"
         [class]="theme.isDark() ? 'border-white/5' : 'border-slate-200'">
      <div class="flex -space-x-2">
        <div *ngFor="let c of ['#f59e0b','#3b82f6','#34d399']"
             class="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
             [style.background]="c + '20'"
             [style.borderColor]="theme.isDark() ? '#0a0a0a' : '#fff'">
          <span [style.color]="c">U</span>
        </div>
      </div>
      <p class="text-[10px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        <strong [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">+2.400</strong> investidores ativos na plataforma
      </p>
    </div>
  </div>

  <!-- Right Panel - Login Form -->
  <div class="flex-1 flex items-center justify-center p-8 md:p-12">
    <div class="w-full max-w-md">
      <!-- Theme toggle -->
      <div class="flex justify-end mb-6">
        <button (click)="theme.toggle()"
                class="p-2 rounded-xl border transition-all"
                [class]="theme.isDark() ? 'border-white/10 text-slate-400 hover:bg-white/5 hover:text-amber-400' : 'border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-blue-600'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path *ngIf="theme.isDark()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            <path *ngIf="!theme.isDark()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </button>
      </div>

      <h2 class="text-2xl font-black tracking-tight mb-1"
          [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Acesso à Plataforma</h2>
      <p class="text-xs mb-8" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
        Entre com as suas credenciais corporativas
      </p>

      <!-- Error -->
      <div *ngIf="error()" class="p-3 rounded-xl border mb-6 text-xs flex items-center gap-2"
           [class]="theme.isDark() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ error() }}
      </div>

      <form (ngSubmit)="submit()" class="flex flex-col gap-4">
        <!-- Email -->
        <div class="flex flex-col gap-1.5">
          <label class="label">Email Corporativo</label>
          <div class="relative">
            <input type="email" [(ngModel)]="email" name="email" required
                   placeholder="nome@empresa.com"
                   class="input-base pl-9"/>
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
        </div>

        <!-- Password -->
        <div class="flex flex-col gap-1.5">
          <label class="label">Senha de Acesso</label>
          <div class="relative">
            <input [type]="showPwd ? 'text' : 'password'" [(ngModel)]="password" name="password" required
                   placeholder="••••••••" class="input-base pl-9 pr-10"/>
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
            <button type="button" (click)="showPwd=!showPwd"
                    class="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  [attr.d]="showPwd
                    ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18'
                    : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Remember + Forgot -->
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="remember" name="remember" class="w-3.5 h-3.5 rounded"/>
            <span class="text-[11px]" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Lembrar acesso</span>
          </label>
          <a routerLink="/auth/forgot-password"
             class="text-[11px] font-semibold transition-colors"
             [class]="theme.isDark() ? 'text-amber-500 hover:text-amber-400' : 'text-blue-600 hover:text-blue-700'">
            Esqueceu a senha?
          </a>
        </div>

        <button type="submit" [disabled]="loading()"
                class="w-full font-extrabold text-sm py-3 rounded-xl mt-2 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'">
          <div *ngIf="loading()" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>{{ loading() ? 'A entrar...' : 'Aceder à Plataforma' }}</span>
          <svg *ngIf="!loading()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
          </svg>
        </button>
      </form>

      <p class="text-center text-xs mt-6" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        Não tem conta?
        <a routerLink="/auth/register"
           class="font-bold ml-1"
           [class]="theme.isDark() ? 'text-amber-500 hover:text-amber-400' : 'text-blue-600 hover:text-blue-700'">
          Criar conta grátis
        </a>
      </p>
    </div>
  </div>
</div>
  `
})
export class LoginComponent {
  theme = inject(ThemeService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = '';
  password = '';
  remember = true;
  showPwd  = false;
  loading  = signal(false);
  error    = signal('');

  submit(): void {
    if (!this.email || !this.password) { this.error.set('Preencha todos os campos.'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: r => {
        this.loading.set(false);
        if (r.success) this.router.navigate(['/app/dashboard']);
        else this.error.set(r.message);
      },
      error: e => { this.loading.set(false); this.error.set(e.error?.message ?? 'Credenciais inválidas.'); }
    });
  }
}
