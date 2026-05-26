import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { User } from '../../core/models';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-4 md:p-6 max-w-4xl mx-auto animate-fade-in" [class]="theme.isDark() ? 'text-slate-100' : 'text-slate-900'">

  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-black tracking-tight" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">Configurações</h1>
    <p class="text-xs mt-1" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Gerencie o seu perfil e preferências da plataforma</p>
  </div>

  <!-- Success/Error -->
  <div *ngIf="successMsg()" class="p-3 rounded-xl text-xs mb-6 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
    <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    {{ successMsg() }}
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

    <!-- Left: Avatar + quick info -->
    <div class="flex flex-col gap-4">
      <div class="p-5 rounded-2xl border flex flex-col items-center text-center"
           [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
        <!-- Avatar -->
        <div class="relative mb-4">
          <div class="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
               [class]="theme.isDark() ? 'bg-amber-500/15 border-2 border-amber-500/30' : 'bg-blue-50 border-2 border-blue-200'">
            <img *ngIf="avatarUrl()" [src]="avatarUrl()" alt="avatar" class="w-full h-full object-cover"/>
            <span *ngIf="!avatarUrl()" class="text-3xl font-black"
                  [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">
              {{ userInitial() }}
            </span>
          </div>
          <label class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all"
                 [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'"
                 title="Alterar avatar">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <input type="file" class="hidden" accept="image/*" (change)="onAvatarChange($event)"/>
          </label>
        </div>

        <h3 class="font-black text-base" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">{{ profile()?.name }}</h3>
        <p class="text-xs mt-0.5" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">{{ profile()?.email }}</p>
        <span class="mt-2 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
              [class]="theme.isDark() ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-50 text-blue-600'">
          {{ profile()?.role_name | uppercase }}
        </span>

        <div class="w-full mt-4 pt-4 border-t text-left" [class]="theme.isDark() ? 'border-slate-800' : 'border-slate-100'">
          <div class="flex justify-between text-xs mb-2">
            <span [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Membro desde</span>
            <span class="font-mono font-semibold" [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-700'">
              {{ profile()?.created_at | date:'MMM yyyy' }}
            </span>
          </div>
          <div class="flex justify-between text-xs">
            <span [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">Moeda</span>
            <span class="font-mono font-semibold" [class]="theme.isDark() ? 'text-slate-300' : 'text-slate-700'">{{ profile()?.currency }}</span>
          </div>
        </div>
      </div>

      <!-- Theme toggle card -->
      <div class="p-5 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
        <h4 class="text-xs font-bold mb-3" [class]="theme.isDark() ? 'text-slate-200' : 'text-slate-800'">Aparência</h4>
        <div class="grid grid-cols-2 gap-2">
          <button (click)="setTheme('dark')"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                  [class]="theme.isDark()
                    ? 'border-amber-500/50 bg-amber-500/5 text-amber-400'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
            </svg>
            <span class="text-[10px] font-bold">Escuro</span>
          </button>
          <button (click)="setTheme('light')"
                  class="flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all"
                  [class]="!theme.isDark()
                    ? 'border-blue-500/50 bg-blue-500/5 text-blue-500'
                    : 'border-slate-800 text-slate-500 hover:border-slate-700'">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <span class="text-[10px] font-bold">Claro</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Right: Forms -->
    <div class="lg:col-span-2 flex flex-col gap-6">

      <!-- Profile Form -->
      <div class="p-6 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
        <h3 class="text-sm font-black mb-4 flex items-center gap-2" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
          <svg class="w-4 h-4" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          Dados do Perfil
        </h3>

        <div *ngIf="profileError()" class="p-3 rounded-xl text-xs mb-4"
             [class]="theme.isDark() ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'">{{ profileError() }}</div>

        <form (ngSubmit)="saveProfile()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="label">Nome Completo</label>
            <input type="text" [(ngModel)]="profileForm.name" name="name" required class="input-base"/>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label">Email</label>
            <input type="email" [(ngModel)]="profileForm.email" name="email" required class="input-base"/>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label">Idioma</label>
            <select [(ngModel)]="profileForm.language" name="language" class="input-base">
              <option value="pt">Português</option>
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="label">Moeda Padrão</label>
            <select [(ngModel)]="profileForm.currency" name="currency" class="input-base">
              <option value="AOA">AOA — Kwanza Angolano</option>
              <option value="USD">USD — Dólar Americano</option>
              <option value="EUR">EUR — Euro</option>
              <option value="BRL">BRL — Real Brasileiro</option>
              <option value="GBP">GBP — Libra Esterlina</option>
            </select>
          </div>
          <div class="md:col-span-2 flex justify-end">
            <button type="submit" [disabled]="savingProfile()"
                    class="px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                    [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
              {{ savingProfile() ? 'A guardar...' : 'Guardar Perfil' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Password Form -->
      <div class="p-6 rounded-2xl border" [class]="theme.isDark() ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'">
        <h3 class="text-sm font-black mb-4 flex items-center gap-2" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
          <svg class="w-4 h-4" [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          Segurança — Alterar Senha
        </h3>

        <div *ngIf="pwdError()" class="p-3 rounded-xl text-xs mb-4"
             [class]="theme.isDark() ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'">{{ pwdError() }}</div>

        <form (ngSubmit)="savePassword()" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="label">Senha Actual</label>
            <input type="password" [(ngModel)]="pwdForm.current_password" name="cur" required placeholder="••••••••" class="input-base"/>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="label">Nova Senha</label>
              <input type="password" [(ngModel)]="pwdForm.password" name="new" required minlength="8" placeholder="••••••••" class="input-base"/>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="label">Confirmar Nova Senha</label>
              <input type="password" [(ngModel)]="pwdForm.password_confirmation" name="conf" required placeholder="••••••••" class="input-base"/>
            </div>
          </div>
          <div class="flex justify-end">
            <button type="submit" [disabled]="savingPwd()"
                    class="px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                    [class]="theme.isDark() ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-blue-600 hover:bg-blue-700 text-white'">
              {{ savingPwd() ? 'A alterar...' : 'Alterar Senha' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Danger Zone -->
      <div class="p-6 rounded-2xl border border-red-500/20"
           [class]="theme.isDark() ? 'bg-red-500/5' : 'bg-red-50'">
        <h3 class="text-sm font-black text-red-400 mb-1">Zona de Perigo</h3>
        <p class="text-xs mb-4" [class]="theme.isDark() ? 'text-slate-400' : 'text-slate-500'">
          Estas acções são irreversíveis. Proceda com cautela.
        </p>
        <button (click)="auth.logout()"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Terminar Sessão em Todos os Dispositivos
        </button>
      </div>
    </div>
  </div>
</div>
  `
})
export class SettingsComponent implements OnInit {
  theme = inject(ThemeService);
  auth  = inject(AuthService);
  private userSvc = inject(UserService);

  profile       = signal<User|null>(null);
  savingProfile = signal(false);
  savingPwd     = signal(false);
  profileError  = signal('');
  pwdError      = signal('');
  successMsg    = signal('');

  profileForm = { name:'', email:'', language:'pt', currency:'AOA' };
  pwdForm     = { current_password:'', password:'', password_confirmation:'' };

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) { this.profile.set(u); this.fillForm(u); }
    this.userSvc.getProfile().subscribe(r => {
      if (r.success) { this.profile.set(r.data); this.fillForm(r.data); }
    });
  }

  fillForm(u: User): void {
    this.profileForm = { name: u.name, email: u.email, language: u.language, currency: u.currency };
  }

  userInitial(): string { return this.profile()?.name?.charAt(0)?.toUpperCase() ?? 'U'; }

  avatarUrl(): string|null {
    const av = this.profile()?.avatar;
    if (!av) return null;
    return av.startsWith('http') ? av : `${environment.apiUrl.replace('/api','')}/${av}`;
  }

  setTheme(t: 'dark'|'light'): void {
    if ((t==='dark') !== this.theme.isDark()) this.theme.toggle();
    this.userSvc.updateProfile({ theme: t }).subscribe();
  }

  saveProfile(): void {
    this.savingProfile.set(true); this.profileError.set(''); this.successMsg.set('');
    this.userSvc.updateProfile(this.profileForm).subscribe({
      next: r => {
        this.savingProfile.set(false);
        if (r.success) { this.profile.set(r.data); this.showSuccess('Perfil actualizado com sucesso!'); }
        else this.profileError.set(r.message);
      },
      error: e => { this.savingProfile.set(false); this.profileError.set(e.error?.message ?? 'Erro ao actualizar perfil.'); }
    });
  }

  savePassword(): void {
    if (this.pwdForm.password !== this.pwdForm.password_confirmation) {
      this.pwdError.set('As senhas não coincidem.'); return;
    }
    this.savingPwd.set(true); this.pwdError.set(''); this.successMsg.set('');
    this.auth.changePassword(this.pwdForm.current_password, this.pwdForm.password, this.pwdForm.password_confirmation).subscribe({
      next: r => {
        this.savingPwd.set(false);
        if (r.success) { this.pwdForm = { current_password:'', password:'', password_confirmation:'' }; this.showSuccess('Senha alterada com sucesso!'); }
        else this.pwdError.set(r.message);
      },
      error: e => { this.savingPwd.set(false); this.pwdError.set(e.error?.errors?.current_password?.[0] ?? e.error?.message ?? 'Erro ao alterar senha.'); }
    });
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.userSvc.uploadAvatar(file).subscribe(r => {
      if (r.success) { this.profile.set(r.data); this.showSuccess('Avatar actualizado!'); }
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3500);
  }
}
