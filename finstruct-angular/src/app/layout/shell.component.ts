import { Component, OnInit, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import { TranslationService } from '../core/services/translation.service';
import { TranslatePipe } from '../shared/pipes/translate.pipe';

interface NavItem { label: string; route: string; iconPath: string; }

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  template: `
<div class="flex h-screen overflow-hidden" [class]="theme.isDark() ? 'bg-black' : 'bg-slate-50'">

  <!-- Mobile overlay -->
  <div *ngIf="sidebarOpen() && isMobile()"
       class="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm"
       (click)="sidebarOpen.set(false)"></div>

  <!-- Sidebar -->
  <aside [class]="'flex flex-col justify-between border-r transition-all duration-300 z-30 flex-shrink-0 '
    + (sidebarOpen() ? 'w-64 xl:w-72' : 'w-0 md:w-16 overflow-hidden')
    + (isMobile() ? ' fixed inset-y-0 left-0' : ' relative')
    + (theme.isDark() ? ' bg-[#0a0a0a] border-slate-800/60' : ' bg-white border-slate-200')">

    <!-- Brand -->
    <div>
      <div class="p-4 border-b flex items-center justify-between h-16 flex-shrink-0"
           [class]="theme.isDark() ? 'border-slate-800/60' : 'border-slate-200'">
        <div class="flex items-center gap-2.5 overflow-hidden min-w-0">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
               [class]="theme.isDark() ? 'bg-amber-500 shadow-amber-500/20' : 'bg-blue-600 shadow-blue-500/20'">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <div *ngIf="sidebarOpen()" class="overflow-hidden min-w-0">
            <span class="font-extrabold text-base tracking-tight block truncate"
                  [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">FinStruct</span>
            <span class="text-[10px] font-mono tracking-wider uppercase font-semibold block"
                  [class]="theme.isDark() ? 'text-amber-500' : 'text-blue-600'">{{ 'nav.wealth_intell' | translate }}</span>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="p-3 flex flex-col gap-0.5 mt-1">
        <p *ngIf="sidebarOpen()" class="text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-1 mb-1"
           [class]="theme.isDark() ? 'text-slate-600' : 'text-slate-400'">
          {{ 'nav.navigation' | translate }}
        </p>
        <a *ngFor="let item of navItems"
           [routerLink]="item.route"
           routerLinkActive="nav-active"
           class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
           [class]="theme.isDark()
             ? 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
             : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'"
           [title]="item.label | translate">
          <svg class="w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110"
               fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path [attr.d]="item.iconPath"/>
          </svg>
          <span *ngIf="sidebarOpen()" class="truncate text-xs font-semibold">{{ item.label | translate }}</span>
        </a>
      </nav>
    </div>

    <!-- User footer -->
    <div class="p-3 border-t flex-shrink-0" [class]="theme.isDark() ? 'border-slate-800/60' : 'border-slate-200'">
      <div *ngIf="sidebarOpen()" class="flex items-center gap-2.5 p-2 rounded-xl mb-2"
           [class]="theme.isDark() ? 'bg-black/40' : 'bg-slate-50'">
        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
             [class]="theme.isDark() ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-100 text-blue-600'">
          {{ userInitial() }}
        </div>
        <div class="overflow-hidden flex-1 min-w-0">
          <p class="text-xs font-bold truncate" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
            {{ auth.currentUser()?.name }}
          </p>
          <p class="text-[10px] truncate" [class]="theme.isDark() ? 'text-slate-500' : 'text-slate-400'">
            {{ auth.currentUser()?.email }}
          </p>
        </div>
      </div>
      <button (click)="auth.logout()"
              class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              [class]="theme.isDark()
                ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'
                : 'text-slate-400 hover:bg-red-50 hover:text-red-500'"
              [title]="'nav.logout' | translate">
        <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
        </svg>
        <span *ngIf="sidebarOpen()">{{ 'nav.logout' | translate }}</span>
      </button>
    </div>
  </aside>

  <!-- Main area -->
  <div class="flex-1 flex flex-col overflow-hidden min-w-0">

    <!-- Topbar -->
    <header class="h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0 border-b z-10"
            [class]="theme.isDark() ? 'bg-black border-slate-800/60' : 'bg-white border-slate-200'">
      <button (click)="sidebarOpen.set(!sidebarOpen())"
              class="p-2 rounded-xl transition-all"
              [class]="theme.isDark() ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-900'">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <!-- Page title (mobile) -->
      <span class="text-sm font-black md:hidden" [class]="theme.isDark() ? 'text-white' : 'text-slate-900'">
        FinStruct
      </span>

      <div class="flex items-center gap-2">
        <!-- Theme toggle -->
        <button (click)="theme.toggle()"
                class="p-2 rounded-xl transition-all"
                [class]="theme.isDark()
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'
                  : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path *ngIf="theme.isDark()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
            <path *ngIf="!theme.isDark()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
        </button>

        <!-- Avatar -->
        <a routerLink="/app/settings"
           class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm cursor-pointer transition-all"
           [class]="theme.isDark() ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'">
          {{ userInitial() }}
        </a>
      </div>
    </header>

    <!-- Page content -->
    <main class="flex-1 overflow-y-auto" [class]="theme.isDark() ? 'bg-black' : 'bg-slate-50'">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .nav-active {
      background-color: #f59e0b !important;
      color: #000000 !important;
      font-weight: 700;
    }
    .nav-active svg { color: #000000 !important; }
    :host-context(body:not(.light-mode)) .nav-active { background-color: #f59e0b !important; }
    body:not(.light-mode) .nav-active { color: #000 !important; }
    .light-mode .nav-active {
      background-color: #2563eb !important;
      color: #ffffff !important;
    }
    .light-mode .nav-active svg { color: #ffffff !important; }
  `]
})
export class AppShellComponent implements OnInit {
  auth  = inject(AuthService);
  theme = inject(ThemeService);
  trans = inject(TranslationService);
  sidebarOpen = signal(true);

  navItems: NavItem[] = [
    { label: 'nav.dashboard',      route: '/app/dashboard',    iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { label: 'nav.transactions',     route: '/app/transactions', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    { label: 'nav.accounts',         route: '/app/accounts',     iconPath: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { label: 'nav.budgets',      route: '/app/budgets',      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'nav.goals',          route: '/app/goals',        iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { label: 'nav.investments',  route: '/app/investments',  iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { label: 'nav.reports',     route: '/app/reports',      iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { label: 'nav.settings',  route: '/app/settings',     iconPath: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  ];

  ngOnInit(): void {
    this.theme.init();
    // Auto-collapse on mobile
    if (window.innerWidth < 768) this.sidebarOpen.set(false);
  }

  isMobile(): boolean { return window.innerWidth < 768; }
  userInitial(): string { return this.auth.currentUser()?.name?.charAt(0)?.toUpperCase() ?? 'U'; }
}
