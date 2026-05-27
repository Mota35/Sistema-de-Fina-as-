import { Pipe, PipeTransform, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Pipe({ name: 'money', standalone: true, pure: false })
export class MoneyPipe implements PipeTransform {
  private auth = inject(AuthService);

  transform(value: number | string | null | undefined, forceCurrency?: string): string {
    if (value === null || value === undefined || value === '') return '—';
    
    // Convert string to number if needed
    const numValue = typeof value === 'string' ? Number(value) : value;
    
    // Handle NaN and invalid numbers
    if (isNaN(numValue)) return '—';
    
    const currency = forceCurrency ?? this.auth.currentUser()?.currency ?? 'AOA';

    try {
      return new Intl.NumberFormat('pt-AO', {
        style: 'currency', currency,
        minimumFractionDigits: 2, maximumFractionDigits: 2,
      }).format(numValue);
    } catch {
      return `${currency} ${numValue.toFixed(2)}`;
    }
  }
}
