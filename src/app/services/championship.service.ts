// src/app/services/championship.service.ts
import { Injectable, effect, untracked } from '@angular/core';
import { BehaviorSubject, Observable, shareReplay } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';

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
  timezone?: string;
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

  private lastToken: string | null | undefined = undefined;

  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) {
    this._selectedChampionshipId = 0;
    this.subjChampId = new BehaviorSubject<number>(this._selectedChampionshipId);
    this.subjChampObs = this.subjChampId.asObservable();

    // React to authentication changes: this service can be instantiated before the
    // user logs in (e.g. by app-level nav components rendered on the login page).
    // In that case the initial default-championship request fails with 401 and the
    // dashboard would wait forever for a championship id. Re-fetch whenever the token
    // changes so that the dashboard loads right after login.
    this.onTokenChanged(this.authService.getToken());
    effect(() => {
      const token = this.authService.tokenSignal();
      untracked(() => this.onTokenChanged(token));
    });
  }

  private onTokenChanged(token: string | null): void {
    if (token === this.lastToken) return;
    this.lastToken = token;

    // Drop any cached request built with a previous (or missing) token
    this.defaultChamp$ = undefined;
    this.configCache.clear();

    if (!token) {
      this._selectedChampionshipId = 0;
      return;
    }

    this.getDefaultChampionship(true).subscribe({
      next: (champ: Championship) => {
        if (champ?.id) {
          this.selectedChampionshipId = champ.id;
        }
      },
      error: (err) => console.warn('Unable to load default championship', err)
    });
  }

  private defaultChamp$?: Observable<Championship>;
  private configCache = new Map<number, Observable<ChampionshipConfig>>();

  getChampIdObs(): Observable<number> {
    return this.subjChampObs;
  }

  // Fetch default championship (current year) with caching
  getDefaultChampionship(forceRefresh = false): Observable<Championship> {
    if (forceRefresh || !this.defaultChamp$) {
      this.defaultChamp$ = this.httpService.genericGet<Championship>(`championship/default`).pipe(
        shareReplay(1)
      );
    }
    return this.defaultChamp$;
  }

  // Fetch all championships
  getChampionships(): Observable<Championship[]> {
    return this.httpService.genericGet<Championship[]>(`championships`);
  }

  getChampionshipConfig(championshipId: number, forceRefresh = false): Observable<ChampionshipConfig> {
    if (forceRefresh || !this.configCache.has(championshipId)) {
      this.configCache.set(
        championshipId,
        this.httpService.genericGet<ChampionshipConfig>(`championship/${championshipId}/config`).pipe(
          shareReplay(1)
        )
      );
    }
    return this.configCache.get(championshipId)!;
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
