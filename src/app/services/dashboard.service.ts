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
  name: string;
}

export interface CalendarRace {
  id: number;
  race_id: Race;
  championship_id: number;
  event_date: string;
  event_time?: string;
  race_order: number;
}

export interface Rider {
  first_name: string;
  last_name: string;
}

export interface FantasyTeam {
  id: number;
  user_id: string;
  name: string;
  team_image: string;
  championship_id: number;
  official_rider_1: Rider;
  official_rider_2: Rider;
  reserve_rider: Rider;
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

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders(this.authService.getAuthHeader());
  }

  getClassification(): Observable<StandingsRow[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<StandingsRow[]>(`${this.apiUrl}/championship/3/standings`, { headers });
  }

  getCalendar(): Observable<CalendarRace[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<CalendarRace[]>(`${this.apiUrl}/championship/3/calendar`, { headers });
  }

  getNextRace(): Observable<CalendarRace> {
    const headers = this.getAuthHeaders();
    return this.http.get<CalendarRace>(`${this.apiUrl}/championship/3/next-race`, { headers });
  }

  // New method to fetch the fantasy team for the given championship
  getFantasyTeam(): Observable<FantasyTeam> {
    const headers = this.getAuthHeaders();
    // Adjust the endpoint as needed.
    return this.http.get<FantasyTeam>(`${this.apiUrl}/championship/3/fantasy_team`, { headers });
  }
}
