import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private auth = inject(AuthService);

  transform(value: number | null | undefined, forceCurrency?: string): string {
    if (value === null || value === undefined) return '—';
    const currency = forceCurrency ?? this.auth.currentUser()?.currency ?? 'AOA';

    try {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency', currency,
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }
}
