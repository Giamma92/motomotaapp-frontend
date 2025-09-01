// src/app/services/championship.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface Championship {
  id: number;
  description: string;
  start_date: string;
  year: number;
}

export interface ChampionshipConfig {
  id: number;
  championship_id: {
    description: string;
    start_date: string;
    year: number;
    is_active: boolean;
  };
  session_timeout: number;
  bets_limit_points: number; // max points per race
  bets_limit_sprint_points: number; // max points per sprint race
  bets_limit_driver: number; // max bets per pilot
  bets_limit_sprint_driver: number; // max sprint bets per pilot
  bets_limit_race: number; // max bets per race
  bets_limit_sprint_race: number; // max bets per sprint race
  formation_limit_driver: number; // max lineups per pilot
}

@Injectable({
  providedIn: 'root'
})
export class ChampionshipService {

  private subjChampObs: Observable<number> = new Observable<number>();
  public subjChampId: BehaviorSubject<number>;

  private _selectedChampionshipId: number;
  public set selectedChampionshipId(champId: number) {
    this._selectedChampionshipId = champId;
    champId > 0 && this.subjChampId.next(champId);
  }

  constructor(
    private httpService: HttpService
  ) {
    this._selectedChampionshipId = 0;
    this.getDefaultChampionship().subscribe({
      next: (champ: Championship) => {
        this.selectedChampionshipId = champ.id;
      }
    });
    this.subjChampId = new BehaviorSubject<number>(this._selectedChampionshipId);
    this.subjChampObs = this.subjChampId.asObservable();
  }

  getChampIdObs(): Observable<number> {
    return this.subjChampObs;
  }

  // Fetch default championship (current year)
  getDefaultChampionship(): Observable<Championship> {
    return this.httpService.genericGet<Championship>(`championship/default`);
  }

  // Fetch all championships
  getChampionships(): Observable<Championship[]> {
    return this.httpService.genericGet<Championship[]>(`championships`);
  }

  getChampionshipConfig(championshipId: number): Observable<ChampionshipConfig> {
    return this.httpService.genericGet<ChampionshipConfig>(`championship/${championshipId}/config`);
  }

  /** Create a new championship */
  addChampionship(champ: Omit<Championship, 'id'>): Observable<Championship> {
    return this.httpService.genericPost<Championship>('championships', champ);
  }

  /** Update an existing championship */
  updateChampionship(id: number, champ: Partial<Championship>): Observable<Championship> {
    return this.httpService.genericPut<Championship>(`championships/${id}`, champ);
  }

  /** Delete a championship */
  deleteChampionship(id: number): Observable<void> {
    return this.httpService.genericDelete<void>(`championships/${id}`);
  }
}
