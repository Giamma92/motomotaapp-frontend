// src/app/services/championship.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';

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
  private apiUrl = environment.apiUrl;

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
    private http: HttpClient,
    private authService: AuthService,
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

  private getAuthHeaders(): HttpHeaders {
    return new HttpHeaders(this.authService.getAuthHeader());
  }

  // Fetch default championship (current year)
  getDefaultChampionship(): Observable<Championship> {
    return this.http.get<Championship>(`${this.apiUrl}/championship/default`, { headers: this.getAuthHeaders() });
  }

  // Fetch all championships
  getChampionships(): Observable<Championship[]> {
    return this.http.get<Championship[]>(`${this.apiUrl}/championships`, { headers: this.getAuthHeaders() });
  }
}
