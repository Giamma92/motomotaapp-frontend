// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ChampionshipService } from './championship.service';
import { HttpService } from './http.service';

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

  constructor(
    private httpService: HttpService,
    private championshipService: ChampionshipService
  ) {}

  private get championshipId(): number {
    return this.championshipService.selectedChampionshipId;
  }

  getClassification(): Observable<StandingsRow[]> {
    return this.httpService.genericGet<StandingsRow[]>(`championship/${this.championshipId}/standings`);
  }

  getCalendar(): Observable<CalendarRace[]> {
    return this.httpService.genericGet<CalendarRace[]>(`championship/${this.championshipId}/calendar`);
  }

  getNextRace(): Observable<CalendarRace> {
    return this.httpService.genericGet<CalendarRace>(`championship/${this.championshipId}/next-race`);
  }

  getAllFantasyTeams(): Observable<FantasyTeam[]> {
    return this.httpService.genericGet<FantasyTeam[]>(`championship/${this.championshipId}/fantasy_teams`);
  }

  getFantasyTeam(): Observable<FantasyTeam> {
    return this.httpService.genericGet<FantasyTeam>(`championship/${this.championshipId}/fantasy_team`);
  }
}
