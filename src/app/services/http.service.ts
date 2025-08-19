// src/app/services/race-detail.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient,
              private authService: AuthService) {}

  /**
   * Generic GET request
   * @param url - The URL to make the request to
   * @returns An Observable of the response
   */
  genericGet<T>(url: string): Observable<T> {
    const headers = this.authService.getAuthHeader();
    return this.http.get<T>(`${this.apiUrl}/${url}`, { headers });
  }

  /**
   * Generic PUT request
   * @param url - The URL to make the request to
   * @param payload - The payload to send with the request
   * @returns An Observable of the response
   */
  genericPut<T>(url: string, payload: any): Observable<T>{
    const headers = this.authService.getAuthHeader();
    return this.http.put<T>(`${this.apiUrl}/${url}`, payload, { headers });
  }

  /**
   * Generic POST request
   * @param url - The URL to make the request to
   * @param payload - The payload to send with the request
   * @returns An Observable of the response
   */
  genericPost<T>(url: string, payload: any): Observable<T> {
    const headers = this.authService.getAuthHeader();
    return this.http.post<T>(`${this.apiUrl}/${url}`, payload, { headers });
  }

  /**
   * Generic DELETE request
   * @param url - The URL to make the request to
   * @returns An Observable of the response
   */
  genericDelete<T>(url: string): Observable<T> {
    const headers = this.authService.getAuthHeader();
    return this.http.delete<T>(`${this.apiUrl}/${url}`, { headers });
  }

}
