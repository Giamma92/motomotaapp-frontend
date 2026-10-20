import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface AdminChampionship {
  id?: number;
  description: string;
  start_date: string;
  year: number;
  is_active?: boolean;
}

export interface AdminRaceMaster {
  id?: number;
  name: string;
  location: string | null;
  country: string | null;
}

export interface AdminCalendarRace {
  id?: number;
  championship_id?: number;
  race_id: any;
  race_order: number;
  event_date: string;
  qualifications_time?: string;
  sprint_time?: string;
  event_time?: string;
  cancelled?: boolean;
}

export interface AdminRider {
  id?: number;
  first_name: string;
  last_name: string;
  number: number;
}

export interface AdminConstructor {
  id?: number;
  name: string;
  nationality: string | null;
}

export interface AdminChampionshipRider {
  id: number;
  championship_id: number;
  rider_id: {
    id: number;
    first_name: string;
    last_name: string;
    number: number;
  };
  constructor_id: {
    id: number;
    name: string;
    nationality?: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_id?: number;
}

export interface AdminFantasyTeam {
  id?: number;
  name: string;
  user_id: any;
  championship_id?: number;
  official_rider_1?: any;
  official_rider_2?: any;
  reserve_rider?: any;
  team_image?: string;
}

export interface ManagerSubmissionStatus {
  userId: string;
  userName: string;
  email?: string;
  teamName: string;
  hasLineup: boolean;
  lineup: any;
  hasSprintBet: boolean;
  sprintBet: any;
  hasRaceBet: boolean;
  raceBet: any;
  isFullySubmitted: boolean;
}

export interface RaceSubmissionStatusResponse {
  totalManagers: number;
  fullySubmitted: number;
  missingLineup: number;
  missingSprintBet: number;
  missingRaceBet: number;
  managers: ManagerSubmissionStatus[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  constructor(private http: HttpService) {}

  // ---- Championships ----
  getChampionships(): Observable<AdminChampionship[]> {
    return this.http.genericGet<AdminChampionship[]>('championships');
  }

  createChampionship(body: AdminChampionship): Observable<AdminChampionship> {
    return this.http.genericPost<AdminChampionship>('championships', body);
  }

  updateChampionship(id: number, body: AdminChampionship): Observable<AdminChampionship> {
    return this.http.genericPut<AdminChampionship>(`championships/${id}`, body);
  }

  deleteChampionship(id: number): Observable<any> {
    return this.http.genericDelete(`championships/${id}`);
  }

  // ---- Master Races (Circuits) ----
  getRaces(): Observable<AdminRaceMaster[]> {
    return this.http.genericGet<AdminRaceMaster[]>('races');
  }

  createRace(body: Partial<AdminRaceMaster>): Observable<AdminRaceMaster> {
    return this.http.genericPost<AdminRaceMaster>('races', body);
  }

  updateRace(id: number, body: Partial<AdminRaceMaster>): Observable<AdminRaceMaster> {
    return this.http.genericPut<AdminRaceMaster>(`races/${id}`, body);
  }

  deleteRace(id: number): Observable<any> {
    return this.http.genericDelete(`races/${id}`);
  }

  // ---- Calendar ----
  getCalendar(championshipId: number): Observable<AdminCalendarRace[]> {
    return this.http.genericGet<AdminCalendarRace[]>(`championship/${championshipId}/calendar`);
  }

  createCalendarRace(championshipId: number, body: any): Observable<AdminCalendarRace> {
    return this.http.genericPost<AdminCalendarRace>(`championship/${championshipId}/calendar`, body);
  }

  updateCalendarRace(championshipId: number, calendarId: number, body: any): Observable<AdminCalendarRace> {
    return this.http.genericPut<AdminCalendarRace>(`championship/${championshipId}/calendar/${calendarId}`, body);
  }

  deleteCalendarRace(championshipId: number, calendarId: number): Observable<any> {
    return this.http.genericDelete(`championship/${championshipId}/calendar/${calendarId}`);
  }

  toggleCancelRace(championshipId: number, calendarId: number, cancelled: boolean): Observable<any> {
    return this.http.genericPatch(`championship/${championshipId}/calendar/${calendarId}/cancelled`, { cancelled });
  }

  // ---- Riders ----
  getRiders(): Observable<AdminRider[]> {
    return this.http.genericGet<AdminRider[]>('riders');
  }

  createRider(body: { first_name: string; last_name: string; number: number }): Observable<AdminRider> {
    return this.http.genericPost<AdminRider>('riders', body);
  }

  updateRider(id: number, body: Partial<AdminRider>): Observable<AdminRider> {
    return this.http.genericPut<AdminRider>(`riders/${id}`, body);
  }

  deleteRider(id: number): Observable<any> {
    return this.http.genericDelete(`riders/${id}`);
  }

  // ---- Constructors ----
  getConstructors(): Observable<AdminConstructor[]> {
    return this.http.genericGet<AdminConstructor[]>('constructors');
  }

  createConstructor(body: { name: string; nationality?: string | null }): Observable<AdminConstructor> {
    return this.http.genericPost<AdminConstructor>('constructors', body);
  }

  updateConstructor(id: number, body: Partial<AdminConstructor>): Observable<AdminConstructor> {
    return this.http.genericPut<AdminConstructor>(`constructors/${id}`, body);
  }

  deleteConstructor(id: number): Observable<any> {
    return this.http.genericDelete(`constructors/${id}`);
  }

  // ---- Championship Riders Grid ----
  getChampionshipRiders(championshipId: number): Observable<AdminChampionshipRider[]> {
    return this.http.genericGet<AdminChampionshipRider[]>(`championship/${championshipId}/riders`);
  }

  assignRiderToChampionship(championshipId: number, body: { rider_id: number; constructor_id: number }): Observable<any> {
    return this.http.genericPost(`championship/${championshipId}/riders`, body);
  }

  updateChampionshipRider(championshipId: number, assocId: number, body: { rider_id?: number; constructor_id?: number }): Observable<any> {
    return this.http.genericPut(`championship/${championshipId}/riders/${assocId}`, body);
  }

  removeRiderFromChampionship(championshipId: number, assocId: number): Observable<any> {
    return this.http.genericDelete(`championship/${championshipId}/riders/${assocId}`);
  }

  // ---- Fantasy Teams ----
  getFantasyTeams(championshipId: number): Observable<AdminFantasyTeam[]> {
    return this.http.genericGet<AdminFantasyTeam[]>(`championship/${championshipId}/fantasy_teams`);
  }

  createFantasyTeam(championshipId: number, body: any): Observable<AdminFantasyTeam> {
    return this.http.genericPost<AdminFantasyTeam>(`championship/${championshipId}/fantasy_teams`, body);
  }

  updateFantasyTeam(championshipId: number, teamId: number, body: any): Observable<AdminFantasyTeam> {
    return this.http.genericPut<AdminFantasyTeam>(`championship/${championshipId}/fantasy_teams/${teamId}`, body);
  }

  deleteFantasyTeam(championshipId: number, teamId: number): Observable<any> {
    return this.http.genericDelete(`championship/${championshipId}/fantasy_teams/${teamId}`);
  }

  getUsers(): Observable<AdminUser[]> {
    return this.http.genericGet<AdminUser[]>('users');
  }

  // ---- Race Operations & Scoring ----
  getSubmissionStatus(championshipId: number, calendarId: number): Observable<RaceSubmissionStatusResponse> {
    return this.http.genericGet<RaceSubmissionStatusResponse>(`championship/${championshipId}/races/${calendarId}/submission-status`);
  }

  fillMissingLineups(championshipId: number, calendarId: number): Observable<any> {
    return this.http.genericPost(`championship/${championshipId}/races/${calendarId}/fill-missing-lineups`, {});
  }

  fillMissingBets(championshipId: number, calendarId: number): Observable<any> {
    return this.http.genericPost(`championship/${championshipId}/races/${calendarId}/fill-missing-bets`, {});
  }

  syncMotoGPResults(championshipId: number, calendarId: number): Observable<any> {
    return this.http.genericGet(`championship/${championshipId}/calendar/${calendarId}/motogp-results?upsert=true`);
  }

  calculateScores(championshipId: number, calendarId: number): Observable<any> {
    return this.http.genericGet(`championship/${championshipId}/calendar/${calendarId}/calc-scores`);
  }

  recalculateScores(championshipId: number, calendarId: number): Observable<any> {
    return this.http.genericPost(`championship/${championshipId}/calendar/${calendarId}/recalculate-scores`, {});
  }

  recalculateAll(championshipId: number): Observable<any> {
    return this.http.genericPost(`championship/${championshipId}/recalculate-all`, {});
  }

  // ---- Automatic Scoring Trigger (Post-Race) ----
  triggerAutoScore(force: boolean = false, calendarId?: number): Observable<any> {
    let url = 'cron/auto-score';
    const params: string[] = [];
    if (force) params.push('force=true');
    if (calendarId) params.push(`calendarId=${calendarId}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return this.http.genericGet(url);
  }

  getAutoScoreStatus(): Observable<any> {
    return this.http.genericGet('cron/auto-score/status');
  }
}
