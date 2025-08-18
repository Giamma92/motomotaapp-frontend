import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  pwd_reset?: number
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { username, password });
  }

  // Optionally add methods to store/retrieve the token and check authentication state.
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(`${this.apiUrl}/user-info`, { headers: this.getAuthHeader() });
  }

  getAuthHeader() {
    const token = this.getToken();
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // This method decodes the JWT and returns the userId from the token payload.
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
    return roles?.includes('Administrator') || false;
  }

  resetPassword(newPasswordHash: string): Observable<any> {
    const headers = this.getAuthHeader();
    return this.http.put(`${this.apiUrl}/user/password`, { password: newPasswordHash }, { headers });
  }
}
