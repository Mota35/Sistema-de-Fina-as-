import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'app/dashboard', pathMatch: 'full' },

  // Auth (guest only)
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login',           loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
      { path: 'register',        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password',  loadComponent: () => import('./features/auth/password.component').then(m => m.ResetPasswordComponent) },
    ]
  },

  // App (auth required)
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.AppShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'transactions', loadComponent: () => import('./features/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'accounts',     loadComponent: () => import('./features/accounts/accounts.component').then(m => m.AccountsComponent) },
      { path: 'accounts/:id', loadComponent: () => import('./features/accounts/account-detail.component').then(m => m.AccountDetailComponent) },
      { path: 'budgets',      loadComponent: () => import('./features/budgets/budgets.component').then(m => m.BudgetsComponent) },
      { path: 'goals',        loadComponent: () => import('./features/goals/goals.component').then(m => m.GoalsComponent) },
      { path: 'investments',  loadComponent: () => import('./features/investments/investments.component').then(m => m.InvestmentsComponent) },
      { path: 'reports',      loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'settings',     loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },

  { path: '**', redirectTo: 'app/dashboard' }
];
