import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="min-h-screen flex items-center justify-center p-4 animate-fade-in"
     [class]="theme.isDark() ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'">
  <div class="w-full max-w-md">

    <!-- Logo -->
    <div class="flex items-center justify-center gap-3 mb-8">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center"
           [class]="theme.isDark() ? 'bg-amber-500' : 'bg-blue-600'">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
      </div>
      <div>
        <span class="font-extrabold text-lg tracking-tight block">FinStruct</span>
        <span class="text-[10px] font-mono tracking-wider uppercase" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">Intelligence & Wealth</span>
      </div>
    </div>

    <div class="p-8 rounded-3xl border"
         [class]="theme.isDark() ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-slate-200 shadow-sm'">
      <h2 class="text-xl font-black mb-1">Criar Conta</h2>
      <p class="text-xs mb-6" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Junte-se à plataforma de gestão financeira</p>

      <div *ngIf="error()" class="p-3 rounded-xl border mb-4 text-xs"
           [class]="theme.isDark() ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'">
        {{ error() }}
      </div>

      <form (ngSubmit)="submit()" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="label">Nome Completo</label>
          <input type="text" [(ngModel)]="form.name" name="name" required placeholder="Carlos Silveira" class="input-base"/>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label">Email</label>
          <input type="email" [(ngModel)]="form.email" name="email" required placeholder="nome@empresa.com" class="input-base"/>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="label">Idioma</label>
            <select [(ngModel)]="form.language" name="lang" class="input-base">
              <option value="pt">Português</option>
              <option value="en">English</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label">Moeda</label>
            <select [(ngModel)]="form.currency" name="currency" class="input-base">
              <option value="AOA">AOA (Kwanza)</option>
              <option value="USD">USD (Dólar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="BRL">BRL (Real)</option>
            </select>
          </div>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label">Senha (mín. 8 caracteres)</label>
          <input type="password" [(ngModel)]="form.password" name="password" required minlength="8" placeholder="••••••••" class="input-base"/>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="label">Confirmar Senha</label>
          <input type="password" [(ngModel)]="form.password_confirmation" name="pc" required placeholder="••••••••" class="input-base"/>
        </div>

        <button type="submit" [disabled]="loading()"
                class="w-full font-extrabold text-sm py-3 rounded-xl mt-2 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
          <div *ngIf="loading()" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          {{ loading() ? 'A registar...' : 'Criar Conta' }}
        </button>
      </form>

      <p class="text-center text-xs mt-4" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
        Já tem conta?
        <a routerLink="/auth/login" class="font-bold ml-1" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">Entrar</a>
      </p>
    </div>
  </div>
</div>
  `
})
export class RegisterComponent {
  theme  = inject(ThemeService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  form    = { name:'', email:'', password:'', password_confirmation:'', language:'pt', currency:'AOA' };
  loading = signal(false);
  error   = signal('');

  submit(): void {
    if (this.form.password !== this.form.password_confirmation) { this.error.set('As senhas não coincidem.'); return; }
    this.loading.set(true); this.error.set('');
    this.auth.register(this.form).subscribe({
      next: r => { this.loading.set(false); if (r.success) this.router.navigate(['/app/dashboard']); else this.error.set(r.message); },
      error: e => { this.loading.set(false); this.error.set(e.error?.errors ? Object.values(e.error.errors).flat().join(' ') : e.error?.message ?? 'Erro ao registar.'); }
    });
  }
}
