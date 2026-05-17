// accounts.routes.ts
import { Routes } from '@angular/router';
export const accountRoutes: Routes = [
  { path: '', loadComponent: () => import('./list/accounts-list.component').then(m => m.AccountsListComponent) },
];
