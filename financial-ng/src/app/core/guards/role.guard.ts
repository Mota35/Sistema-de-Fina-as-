import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const toast  = inject(ToastService);

  const required: string[] = route.data['roles'] ?? [];
  const userRole = auth.user()?.role ?? '';

  if (!required.length || required.includes(userRole)) return true;

  toast.error('Acesso Negado', 'Permissão insuficiente.');
  router.navigate(['/app/dashboard']);
  return false;
};
