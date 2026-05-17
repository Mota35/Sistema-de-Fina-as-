import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ToastService } from '../../core/services/toast.service';
import { LoadingService } from '../../core/services/loading.service';
import { STORAGE_KEYS } from '../../core/constants/api.constants';

interface NavItem {
  label: string; icon: string; route: string; badge?: number;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <!-- Global Progress Bar -->
    @if (loading.isLoading()) {
      <div class="global-progress">
        <div class="global-progress-fill"></div>
      </div>
    }

    <!-- Toast Container -->
    <div class="toast-stack">
      @for (t of toastSvc.toasts(); track t.id) {
        <div class="toast toast-{{ t.type }} animate-fade-in-right">
          <span class="toast-icon">{{ toastIcon(t.type) }}</span>
          <div class="toast-body">
            <strong>{{ t.title }}</strong>
            @if (t.message) { <p>{{ t.message }}</p> }
          </div>
          <button class="toast-close" (click)="toastSvc.dismiss(t.id)">✕</button>
        </div>
      }
    </div>

    <div class="app-shell" [class.sidebar-collapsed]="collapsed()">

      <!-- ─── Sidebar ─── -->
      <aside class="sidebar" [class.mobile-open]="mobileOpen()">
        <div class="sidebar-header">
          <div class="sidebar-brand">
            <span class="brand-icon">💰</span>
            @if (!collapsed()) {
              <span class="brand-name animate-fade-in">FinancePro</span>
            }
          </div>
          <button class="collapse-btn hide-mobile" (click)="toggleCollapse()" [title]="collapsed() ? 'Expandir' : 'Recolher'">
            {{ collapsed() ? '›' : '‹' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of navItems; track item.route) {
            <a class="nav-link" [routerLink]="item.route" routerLinkActive="active"
               (click)="closeMobile()" [title]="item.label">
              <span class="nav-icon">{{ item.icon }}</span>
              @if (!collapsed()) {
                <span class="nav-label animate-fade-in">{{ item.label }}</span>
              }
              @if (item.badge && !collapsed()) {
                <span class="nav-badge">{{ item.badge }}</span>
              }
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <div class="user-card" [title]="auth.user()?.email ?? ''">
            <div class="user-avatar">
              {{ auth.user()?.name?.[0]?.toUpperCase() ?? 'U' }}
            </div>
            @if (!collapsed()) {
              <div class="user-info animate-fade-in">
                <span class="user-name">{{ auth.user()?.name }}</span>
                <span class="user-role">{{ auth.user()?.role }}</span>
              </div>
            }
          </div>
        </div>
      </aside>

      <!-- Mobile Overlay -->
      @if (mobileOpen()) {
        <div class="overlay" (click)="closeMobile()"></div>
      }

      <!-- ─── Main Content ─── -->
      <div class="main-wrapper">

        <!-- Topbar -->
        <header class="topbar">
          <button class="btn btn-ghost btn-icon hide-desktop" (click)="toggleMobile()">☰</button>

          <div class="topbar-left">
            <!-- Page title rendered by route data or left empty -->
          </div>

          <div class="topbar-right">
            <button class="btn btn-ghost btn-icon" (click)="theme.toggle()" [title]="theme.isDark() ? 'Modo claro' : 'Modo escuro'">
              {{ theme.isDark() ? '☀️' : '🌙' }}
            </button>

            <button class="btn btn-ghost btn-icon notification-btn" title="Notificações">
              🔔
              <span class="notif-dot"></span>
            </button>

            <div class="topbar-user" (click)="userMenuOpen.set(!userMenuOpen())">
              <div class="user-avatar sm">{{ auth.user()?.name?.[0]?.toUpperCase() }}</div>
              <span class="hide-mobile">{{ auth.user()?.name }}</span>
              <span>▾</span>

              @if (userMenuOpen()) {
                <div class="user-dropdown animate-scale-in">
                  <a [routerLink]="['/app/settings/profile']" class="dropdown-item" (click)="userMenuOpen.set(false)">
                    👤 Perfil
                  </a>
                  <a [routerLink]="['/app/settings/preferences']" class="dropdown-item" (click)="userMenuOpen.set(false)">
                    ⚙️ Preferências
                  </a>
                  <div class="divider" style="margin:.25rem 0"></div>
                  <button class="dropdown-item danger" (click)="logout()">
                    🚪 Terminar Sessão
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Progress bar ─── */
    .global-progress {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 3px;
      z-index: 9999;
      background: var(--bg-surface2);
    }
    .global-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--clr-primary), #a78bfa);
      animation: progress 1.5s ease-in-out infinite;
    }
    @keyframes progress {
      0%   { width: 0%; margin-left: 0; }
      50%  { width: 70%; margin-left: 15%; }
      100% { width: 0%; margin-left: 100%; }
    }

    /* ─── Toast ─── */
    .toast-stack {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 9998;
      display: flex;
      flex-direction: column;
      gap: .75rem;
      max-width: 360px;
      width: 100%;
    }
    .toast {
      display: flex;
      align-items: flex-start;
      gap: .75rem;
      padding: .875rem 1rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border-left: 4px solid;
      box-shadow: var(--shadow-lg);
      font-size: .9rem;
    }
    .toast-success { border-color: var(--clr-success); }
    .toast-error   { border-color: var(--clr-danger); }
    .toast-warning { border-color: var(--clr-warning); }
    .toast-info    { border-color: var(--clr-info); }
    .toast-icon { font-size: 1.125rem; flex-shrink: 0; }
    .toast-body { flex: 1; }
    .toast-body strong { display: block; margin-bottom: 2px; }
    .toast-body p { color: var(--text-secondary); font-size: .85rem; margin: 0; }
    .toast-close {
      background: none; border: none;
      color: var(--text-muted); font-size: .85rem;
      cursor: pointer; padding: 0; line-height: 1;
    }

    /* ─── Shell ─── */
    .app-shell {
      display: flex;
      min-height: 100vh;
    }

    /* ─── Sidebar ─── */
    .sidebar {
      width: var(--sidebar-width);
      background: var(--bg-sidebar);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width var(--transition-slow);
      z-index: 200;
    }
    .app-shell.sidebar-collapsed .sidebar { width: var(--sidebar-collapsed-width); }

    .sidebar-header {
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,.07);
      min-height: 65px;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: .75rem;
      overflow: hidden;
    }
    .brand-icon { font-size: 1.5rem; flex-shrink: 0; }
    .brand-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
    }

    .collapse-btn {
      background: rgba(255,255,255,.08);
      border: none;
      color: rgba(255,255,255,.6);
      width: 28px; height: 28px;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      transition: all var(--transition);
    }
    .collapse-btn:hover { background: rgba(255,255,255,.15); color: #fff; }

    .sidebar-nav {
      flex: 1;
      padding: 1rem .75rem;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .625rem .875rem;
      border-radius: var(--radius-md);
      color: rgba(255,255,255,.55);
      font-size: .9rem;
      font-weight: 500;
      transition: all var(--transition);
      cursor: pointer;
      white-space: nowrap;
      overflow: hidden;
      text-decoration: none;
    }
    .nav-link:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.9); }
    .nav-link.active {
      background: var(--clr-primary);
      color: #fff;
      box-shadow: 0 4px 14px rgba(108,99,255,.35);
    }
    .nav-icon { font-size: 1.125rem; flex-shrink: 0; }
    .nav-label { flex: 1; }
    .nav-badge {
      background: var(--clr-danger);
      color: #fff;
      font-size: .7rem;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 99px;
    }

    .sidebar-footer {
      padding: 1rem .75rem;
      border-top: 1px solid rgba(255,255,255,.07);
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: .75rem;
      padding: .5rem .75rem;
      border-radius: var(--radius-md);
      cursor: pointer;
      overflow: hidden;
    }
    .user-card:hover { background: rgba(255,255,255,.06); }

    .user-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, var(--clr-primary), #a78bfa);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: .875rem; font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .user-avatar.sm { width: 32px; height: 32px; font-size: .8rem; }

    .user-info { display: flex; flex-direction: column; overflow: hidden; }
    .user-name {
      font-size: .875rem;
      font-weight: 600;
      color: rgba(255,255,255,.9);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .user-role {
      font-size: .7rem;
      color: rgba(255,255,255,.4);
      text-transform: capitalize;
    }

    /* ─── Main Wrapper ─── */
    .main-wrapper {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    /* ─── Topbar ─── */
    .topbar {
      height: 65px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      gap: 1rem;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: .5rem;
    }

    .notification-btn { position: relative; }
    .notif-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 7px; height: 7px;
      background: var(--clr-danger);
      border-radius: 50%;
      border: 1.5px solid var(--bg-surface);
    }

    .topbar-user {
      display: flex;
      align-items: center;
      gap: .5rem;
      cursor: pointer;
      padding: .375rem .75rem;
      border-radius: var(--radius-md);
      font-size: .875rem;
      font-weight: 500;
      position: relative;
      transition: background var(--transition);
    }
    .topbar-user:hover { background: var(--bg-surface2); }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      min-width: 200px;
      overflow: hidden;
      z-index: 300;
      padding: .375rem;
    }
    .dropdown-item {
      display: flex;
      align-items: center;
      gap: .625rem;
      padding: .625rem .875rem;
      border-radius: var(--radius-sm);
      font-size: .875rem;
      width: 100%;
      border: none;
      background: none;
      color: var(--text-primary);
      cursor: pointer;
      transition: background var(--transition);
      text-decoration: none;
    }
    .dropdown-item:hover { background: var(--bg-surface2); }
    .dropdown-item.danger { color: var(--clr-danger); }
    .dropdown-item.danger:hover { background: rgba(239,68,68,.08); }

    /* ─── Page Content ─── */
    .page-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }

    /* ─── Mobile ─── */
    @media (max-width: 768px) {
      .sidebar {
        position: fixed;
        top: 0; left: 0;
        height: 100%;
        transform: translateX(-100%);
        transition: transform var(--transition-slow);
        width: var(--sidebar-width) !important;
      }
      .sidebar.mobile-open { transform: translateX(0); }
      .page-content { padding: 1rem; }
    }
  `],
})
export class MainLayoutComponent {
  auth     = inject(AuthService);
  theme    = inject(ThemeService);
  toastSvc = inject(ToastService);
  loading  = inject(LoadingService);

  collapsed   = signal(localStorage.getItem(STORAGE_KEYS.SIDEBAR) === 'true');
  mobileOpen  = signal(false);
  userMenuOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard',    icon: '📊', route: '/app/dashboard' },
    { label: 'Transações',   icon: '💸', route: '/app/transactions' },
    { label: 'Contas',       icon: '🏦', route: '/app/accounts' },
    { label: 'Categorias',   icon: '🏷️', route: '/app/categories' },
    { label: 'Orçamento',    icon: '📋', route: '/app/budget' },
    { label: 'Metas',        icon: '🎯', route: '/app/goals' },
    { label: 'Relatórios',   icon: '📈', route: '/app/reports' },
    { label: 'Configurações',icon: '⚙️', route: '/app/settings' },
  ];

  toastIcon(type: string): string {
    return { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type] ?? 'ℹ️';
  }

  toggleCollapse(): void {
    this.collapsed.update(v => !v);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR, String(this.collapsed()));
  }

  toggleMobile(): void { this.mobileOpen.update(v => !v); }
  closeMobile(): void  { this.mobileOpen.set(false); }

  logout(): void {
    this.userMenuOpen.set(false);
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.topbar-user')) {
      this.userMenuOpen.set(false);
    }
  }
}
