// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { HttpService } from './http.service';
import { UserInfo } from './auth.service';

export interface StandingsRow {
  Id: number;
  user_id: UserInfo;
  championship_id: number;
  position: number;
  score: number;
}

export interface Race {
  id: number;
  name: string;
  location: string;
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
  id: number;
  first_name: string;
  last_name: string;
  number: number;
}

export interface Constructor {
  name: string,
  nationality: string
}

export interface FantasyTeam {
  id: number;
  user_id: UserInfo;
  name: string;
  team_image: string;
  championship_id: number;
  official_rider_1: Rider;
  official_rider_2: Rider;
  reserve_rider: Rider;
}

export interface ChampionshipRider {
  id: number,
  rider_id: Rider,
  constructor_id: Constructor
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(
    private httpService: HttpService
  ) {}

  getClassification(championshipId: number): Observable<StandingsRow[]> {
    return this.httpService.genericGet<StandingsRow[]>(`championship/${championshipId}/standings`);
  }

  getCalendar(championshipId: number): Observable<CalendarRace[]> {
    return this.httpService.genericGet<CalendarRace[]>(`championship/${championshipId}/calendar`);
  }

  getNextRace(championshipId: number): Observable<CalendarRace> {
    return this.httpService.genericGet<CalendarRace>(`championship/${championshipId}/next-race`);
  }

  getAllFantasyTeams(championshipId: number): Observable<FantasyTeam[]> {
    return this.httpService.genericGet<FantasyTeam[]>(`championship/${championshipId}/fantasy_teams`);
  }

  getFantasyTeam(championshipId: number): Observable<FantasyTeam> {
    return this.httpService.genericGet<FantasyTeam>(`championship/${championshipId}/fantasy_team`);
  }

  getAllRiders(championshipId: number): Observable<ChampionshipRider[]> {
    return this.httpService.genericGet<ChampionshipRider[]>(`championship/${championshipId}/riders`);
  }

  updateStandings(championshipId: number, calendarId: number): Observable<any> {
    return this.httpService.genericGet<ChampionshipRider[]>(`championship/${championshipId}/calendar/${calendarId}/calc-scores`);
  }

  fetchMotoGPResults(championshipId: number, calendarId: number, upsert: boolean): Observable<any> {
    return this.httpService.genericGet<any>(`championship/${championshipId}/calendar/${calendarId}/motogp-results?upsert=${upsert}`);
  }
}


