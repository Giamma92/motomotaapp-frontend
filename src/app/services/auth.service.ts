import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
}

export interface UserInfo {
  id: string,
  profile_id: string,
  profile_image: string,
  email: string,
  last_access: string,
  first_name: string,
  last_name: string,
  pwd_reset?: number,
  alias?: string
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private cachedUserInfo: UserInfo | null = null;
  private userInfo$?: Observable<UserInfo>;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password });
  }

  // Store/retrieve the token and check authentication state.
  setToken(token: string): void {
    localStorage.setItem('token', token);
    this.cachedUserInfo = null;
    this.userInfo$ = undefined;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    this.cachedUserInfo = null;
    this.userInfo$ = undefined;
  }

  getUserInfo(forceRefresh = false): Observable<UserInfo> {
    if (!forceRefresh && this.cachedUserInfo) {
      return of(this.cachedUserInfo);
    }
    if (!forceRefresh && this.userInfo$) {
      return this.userInfo$;
    }
    this.userInfo$ = this.http.get<UserInfo>(`${this.apiUrl}/user-info`, { headers: this.getAuthHeader() }).pipe(
      tap(user => {
        this.cachedUserInfo = user;
      }),
      shareReplay(1)
    );
    return this.userInfo$;
  }

  updateUserInfo(body: { first_name?: string; last_name?: string; profile_image?: string; alias?: string }): Observable<UserInfo> {
    return this.http.put<UserInfo>(`${this.apiUrl}/user-info`, body, { headers: this.getAuthHeader() }).pipe(
      tap(updated => {
        this.cachedUserInfo = updated;
      })
    );
  }

  getAuthHeader() {
    const token = this.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  getUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const decoded = jwtDecode<any>(token);
      return decoded?.username;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  getUserRoles(): any[] | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    try {
      const decoded = jwtDecode<any>(token);
      return decoded?.roles;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  isCurrentUserAdmin(): boolean {
    const roles = this.getUserRoles();
    return roles?.includes('Admin') || false;
  }

  resetPassword(newPasswordHash: string): Observable<any> {
    const headers = this.getAuthHeader();
    return this.http.put(`${this.apiUrl}/user/password`, { password: newPasswordHash }, { headers });
  }

  refreshToken(): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/refresh-token`, {}, { headers: this.getAuthHeader() }).pipe(
      tap(res => {
        if (res?.token) {
          this.setToken(res.token);
        }
      })
    );
  }

  getTokenExpiration(): number | null {
    const token = this.getToken();
    if (!token) return null;
    try {
      const decoded = jwtDecode<any>(token);
      return decoded?.exp ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  getRemainingSessionSeconds(): number {
    const exp = this.getTokenExpiration();
    if (!exp) return 0;
    return Math.max(0, Math.floor((exp - Date.now()) / 1000));
  }

  formatRemainingTime(totalSeconds: number): string {
    if (totalSeconds <= 0) return '0s';
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }
}
