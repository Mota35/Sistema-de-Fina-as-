import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API } from '../constants/api.constants';
import { ApiResponse, Transaction, TransactionFilters, DashboardSummary, CategorySummary, MonthlyEvolution } from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private http = inject(HttpClient);

  list(filters: TransactionFilters = {}): Observable<ApiResponse<Transaction[]>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<ApiResponse<Transaction[]>>(API.TRANSACTIONS.BASE, { params });
  }

  getById(id: number): Observable<ApiResponse<Transaction>> {
    return this.http.get<ApiResponse<Transaction>>(API.TRANSACTIONS.BY_ID(id));
  }

  create(data: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.post<ApiResponse<Transaction>>(API.TRANSACTIONS.BASE, data);
  }

  update(id: number, data: Partial<Transaction>): Observable<ApiResponse<Transaction>> {
    return this.http.put<ApiResponse<Transaction>>(API.TRANSACTIONS.BY_ID(id), data);
  }

  delete(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(API.TRANSACTIONS.BY_ID(id));
  }

  summary(month: string): Observable<ApiResponse<DashboardSummary>> {
    return this.http.get<ApiResponse<DashboardSummary>>(API.TRANSACTIONS.SUMMARY, {
      params: { month },
    });
  }

  uploadAttachment(id: number, file: File): Observable<ApiResponse<{ path: string }>> {
    const formData = new FormData();
    formData.append('attachment', file);
    return this.http.post<ApiResponse<{ path: string }>>(`${API.TRANSACTIONS.BY_ID(id)}/attachment`, formData);
  }

  exportCsv(filters: TransactionFilters = {}): Observable<Blob> {
    let params = new HttpParams().set('format', 'csv');
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get(API.TRANSACTIONS.EXPORT, { params, responseType: 'blob' });
  }
}
