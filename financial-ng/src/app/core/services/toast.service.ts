import { Injectable, signal } from '@angular/core';
import { Toast } from '../models';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration = 6000): void {
    this.add({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration = 5000): void {
    this.add({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration = 4000): void {
    this.add({ type: 'info', title, message, duration });
  }

  dismiss(id: string): void {
    this._toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(toast: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID();
    this._toasts.update(list => [...list, { ...toast, id }]);
    setTimeout(() => this.dismiss(id), toast.duration ?? 4000);
  }
}
