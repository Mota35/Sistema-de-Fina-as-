// transactions.routes.ts
import { Routes } from '@angular/router';
export const transactionRoutes: Routes = [
  { path: '', loadComponent: () => import('./list/transactions-list.component').then(m => m.TransactionsListComponent) },
];
