import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map } from 'rxjs';
import { API, STORAGE_KEYS } from '../constants/api.constants';
import {
  User, AuthTokens, LoginPayload, RegisterPayload, ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http   = inject(HttpClient);
  private router = inject(Router);

  private _user    = signal<User | null>(this.loadUser());
  private _loading = signal(false);

  readonly user    = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._user());
  readonly isAdmin         = computed(() => this._user()?.role === 'admin');

  login(payload: LoginPayload): Observable<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.http.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(API.AUTH.LOGIN, payload).pipe(
      tap(res => {
        if (res.success) {
          this.storeTokens(res.data.tokens);
          this._user.set(res.data.user);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        }
      })
    );
  }

  register(payload: RegisterPayload): Observable<ApiResponse<{ user: User; tokens: AuthTokens }>> {
    return this.http.post<ApiResponse<{ user: User; tokens: AuthTokens }>>(API.AUTH.REGISTER, payload).pipe(
      tap(res => {
        if (res.success) {
          this.storeTokens(res.data.tokens);
          this._user.set(res.data.user);
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user));
        }
      })
    );
  }

  logout(): void {
    this.http.post(API.AUTH.LOGOUT, {}).subscribe({
      complete: () => this.clearSession(),
      error:    () => this.clearSession(),
    });
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(API.AUTH.FORGOT_PASSWORD, { email });
  }

  resetPassword(token: string, password: string, passwordConfirmation: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(API.AUTH.RESET_PASSWORD, {
      token,
      password,
      password_confirmation: passwordConfirmation,
    });
  }

  refreshToken(): Observable<ApiResponse<{ tokens: AuthTokens }>> {
    const refresh = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return this.http.post<ApiResponse<{ tokens: AuthTokens }>>(API.AUTH.REFRESH, { refresh_token: refresh }).pipe(
      tap(res => {
        if (res.success) this.storeTokens(res.data.tokens);
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  updateUser(user: User): void {
    this._user.set(user);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access_token);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh_token);
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
