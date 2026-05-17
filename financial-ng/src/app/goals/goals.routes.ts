import { Routes } from '@angular/router';
export const goalRoutes: Routes = [
  { path: '', loadComponent: () => import('./list/goals-list.component').then(m => m.GoalsListComponent) },
];
