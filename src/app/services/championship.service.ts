// src/app/services/championship.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  private _selectedChampionshipId: number = Number(localStorage.getItem('selectedChampionshipId')) || 0;
  public get selectedChampionshipId(): number {
    return this._selectedChampionshipId;
  }

  public set selectedChampionshipId(champId: number) {
    this._selectedChampionshipId = champId;
    localStorage.setItem('selectedChampionshipId', champId.toString());
    this.router.navigate(['/']);
  }

  constructor(
    private httpService: HttpService,
    private router: Router
  ) {
    if(this._selectedChampionshipId === 0) {
      this.getDefaultChampionship().subscribe({
        next: (champ: Championship) => {
          this.selectedChampionshipId = champ.id;
        }
      });
    }
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
