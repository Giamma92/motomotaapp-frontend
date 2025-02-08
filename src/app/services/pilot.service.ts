import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Pilot {
  id?: number;
  first_name: string;
  last_name: string;
}

@Injectable({
  providedIn: 'root',
})
export class PilotService {
  private apiUrl = `${environment.apiUrl}/riders`;

  constructor(private http: HttpClient) {}

  // Get all pilots
  getPilots(): Observable<Pilot[]> {
    return this.http.get<Pilot[]>(this.apiUrl);
  }

  // Add a new pilot
  addPilot(pilot: Pilot): Observable<Pilot> {
    return this.http.post<Pilot>(this.apiUrl, pilot);
  }
}
