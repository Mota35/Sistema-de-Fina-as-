import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _requests = signal(0);
  readonly isLoading = () => this._requests() > 0;

  show(): void { this._requests.update(n => n + 1); }
  hide(): void { this._requests.update(n => Math.max(0, n - 1)); }
  reset(): void { this._requests.set(0); }
}
