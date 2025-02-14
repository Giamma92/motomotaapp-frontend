// src/app/services/championship.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { HttpService } from './http.service';

export interface Championship {
  id: number;
  description: string;
  start_date: string;
  year: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChampionshipService {

  private subjChampObs: Observable<number> = new Observable<number>();
  private subjChampId: BehaviorSubject<number>;

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
}
