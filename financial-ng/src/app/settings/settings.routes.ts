import { Routes } from '@angular/router';
export const settingsRoutes: Routes = [
  { path: '', redirectTo: 'profile', pathMatch: 'full' },
  { path: 'profile',      loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'preferences',  loadComponent: () => import('./preferences/preferences.component').then(m => m.PreferencesComponent) },
  { path: 'security',     loadComponent: () => import('./security/security.component').then(m => m.SecurityComponent) },
];
