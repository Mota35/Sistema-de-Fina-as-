import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, User } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;
  readonly currentUser = signal<User | null>(this.loadUser());
  readonly isLoggedIn  = signal<boolean>(!!this.loadToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.api}/auth/login`, req).pipe(
      tap(res => { if (res.success) this.saveSession(res.data); })
    );
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.api}/auth/register`, req).pipe(
      tap(res => { if (res.success) this.saveSession(res.data); })
    );
  }

  logout(): void {
    this.http.post(`${this.api}/auth/logout`, {}).subscribe();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.api}/auth/forgot-password`, { email });
  }

  resetPassword(code: string, password: string, password_confirmation: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.api}/auth/reset-password`, { code, password, password_confirmation });
  }

  changePassword(current_password: string, password: string, password_confirmation: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.api}/auth/change-password`, { current_password, password, password_confirmation });
  }

  me(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.api}/auth/me`).pipe(
      tap(res => { if (res.success) { this.currentUser.set(res.data); localStorage.setItem('user', JSON.stringify(res.data)); } })
    );
  }

  getToken(): string | null  { return localStorage.getItem('access_token'); }
  getRefreshToken(): string | null { return localStorage.getItem('refresh_token'); }

  private saveSession(data: AuthResponse): void {
    localStorage.setItem('access_token',  data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.currentUser.set(data.user);
    this.isLoggedIn.set(true);
  }

  updateCurrentUser(user: User): void {
    const accessToken = this.getToken();
    const refreshToken = this.getRefreshToken();
    if (accessToken) localStorage.setItem('access_token', accessToken);
    if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private loadToken(): string | null { return localStorage.getItem('access_token'); }
  private loadUser(): User | null {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  }
}
