// categories.routes.ts
import { Routes } from '@angular/router';
export const categoryRoutes: Routes = [
  { path: '', loadComponent: () => import('./list/categories-list.component').then(m => m.CategoriesListComponent) },
];
