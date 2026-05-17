import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Auth layout routes
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
        title: 'Login | FinancePro',
      },
      {
        path: 'register',
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
        title: 'Criar Conta | FinancePro',
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Recuperar Senha | FinancePro',
      },
      {
        path: 'reset-password/:token',
        loadComponent: () => import('./auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'Nova Senha | FinancePro',
      },
    ],
  },

  // Main layout routes (protected)
  {
    path: 'app',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard | FinancePro',
      },
      {
        path: 'transactions',
        loadChildren: () => import('./transactions/transactions.routes').then(m => m.transactionRoutes),
        title: 'Transações | FinancePro',
      },
      {
        path: 'accounts',
        loadChildren: () => import('./accounts/accounts.routes').then(m => m.accountRoutes),
        title: 'Contas | FinancePro',
      },
      {
        path: 'categories',
        loadChildren: () => import('./categories/categories.routes').then(m => m.categoryRoutes),
        title: 'Categorias | FinancePro',
      },
      {
        path: 'budget',
        loadChildren: () => import('./budget/budget.routes').then(m => m.budgetRoutes),
        title: 'Orçamento | FinancePro',
      },
      {
        path: 'goals',
        loadChildren: () => import('./goals/goals.routes').then(m => m.goalRoutes),
        title: 'Metas | FinancePro',
      },
      {
        path: 'reports',
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
        title: 'Relatórios | FinancePro',
      },
      {
        path: 'settings',
        loadChildren: () => import('./settings/settings.routes').then(m => m.settingsRoutes),
        title: 'Configurações | FinancePro',
      },
    ],
  },

  { path: '**', redirectTo: '/login' },
];
