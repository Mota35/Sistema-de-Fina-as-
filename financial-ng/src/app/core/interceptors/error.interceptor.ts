import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs/operators';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const msg = error.error?.message ?? error.message ?? 'Ocorreu um erro inesperado.';

      switch (error.status) {
        case 0:
          toast.error('Sem conexão', 'Verifique sua conexão com a internet.');
          break;
        case 403:
          toast.error('Acesso Negado', 'Você não tem permissão para esta ação.');
          break;
        case 404:
          toast.error('Não Encontrado', msg);
          break;
        case 422:
          // Validation errors — handled individually in components
          break;
        case 500:
          toast.error('Erro no Servidor', 'Tente novamente em instantes.');
          break;
        default:
          if (error.status !== 401) {
            toast.error('Erro', msg);
          }
      }

      return throwError(() => error);
    })
  );
};

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(finalize(() => loading.hide()));
};
