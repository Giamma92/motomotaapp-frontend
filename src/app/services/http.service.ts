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

  genericGet<T>(url: string): Observable<T> {
    const headers = this.authService.getAuthHeader();
    return this.http.get<T>(`${this.apiUrl}/${url}`, { headers });
  }

}
