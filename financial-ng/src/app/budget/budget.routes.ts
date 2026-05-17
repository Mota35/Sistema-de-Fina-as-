import { Routes } from '@angular/router';
export const budgetRoutes: Routes = [
  { path: '', loadComponent: () => import('./list/budget-list.component').then(m => m.BudgetListComponent) },
];
