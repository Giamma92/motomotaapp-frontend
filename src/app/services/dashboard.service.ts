// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface StandingsRow {
  Id: number;
  user_id: string;
  championship_id: number;
  position: number;
  score: number;
}

export interface Race {
  id: number;
  date: string; // or Date
  bet?: string;
  // additional fields...
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Helper method to create headers with the Bearer token.
  private getAuthHeaders(): HttpHeaders {
    // Assume authService.getAuthHeader() returns an object like { 'Authorization': 'Bearer <token>' }
    return new HttpHeaders(this.authService.getAuthHeader());
  }

  // Returns an array of standings rows.
  getClassification(): Observable<StandingsRow[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<StandingsRow[]>(`${this.apiUrl}/championship/3/standings`, { headers });
  }

  // Returns the full calendar or you can add other methods as needed.
  getCalendar(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/championship/3/calendar`, { headers });
  }

  // Returns the next race.
  getNextRace(): Observable<Race> {
    const headers = this.getAuthHeaders();
    return this.http.get<Race>(`${this.apiUrl}/championship/3/next-race`, { headers });
  }
}
