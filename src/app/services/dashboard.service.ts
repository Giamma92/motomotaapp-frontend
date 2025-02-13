// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { ChampionshipService } from './championship.service';

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
  event_date: string;           // ISO string for the race date
  event_time?: string;          // ISO string for the race start time
  qualifications_time?: string; // ISO string for the qualification start time
  sprint_time?: string;         // ISO string for the sprint start time
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
    private authService: AuthService,
    private championshipService: ChampionshipService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders(this.authService.getAuthHeader());
  }

  getClassification(): Observable<StandingsRow[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<StandingsRow[]>(`${this.apiUrl}/championship/${this.championshipService.selectedChampionshipId}/standings`, { headers });
  }

  getCalendar(): Observable<CalendarRace[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<CalendarRace[]>(`${this.apiUrl}/championship/${this.championshipService.selectedChampionshipId}/calendar`, { headers });
  }

  getNextRace(): Observable<CalendarRace> {
    const headers = this.getAuthHeaders();
    return this.http.get<CalendarRace>(`${this.apiUrl}/championship/${this.championshipService.selectedChampionshipId}/next-race`, { headers });
  }

  getAllFantasyTeams(): Observable<FantasyTeam[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<FantasyTeam[]>(`${this.apiUrl}/championship/${this.championshipService.selectedChampionshipId}/fantasy_teams`, { headers });
  }

  getFantasyTeam(): Observable<FantasyTeam> {
    const headers = this.getAuthHeaders();
    return this.http.get<FantasyTeam>(`${this.apiUrl}/championship/${this.championshipService.selectedChampionshipId}/fantasy_team`, { headers });
  }
}
