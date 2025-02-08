import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  token: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  // Add any additional fields as needed.
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
    return { 'Authorization': `Bearer ${token}` };
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
}
