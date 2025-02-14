// src/app/services/race-detail.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { CalendarRace } from './dashboard.service';

// Define the interface for standings results
export interface LineupsResult {
  championship_id: number;
  calendar_id: CalendarRace;
  user_id: string;
  race_rider_id?: number;        // Rider ID for qualification
  qualifying_rider_id?: number;  // Rider ID for race
  inserted_at?: string;
}

// Define the interface for bet results
export interface BetResult {
  championship_id: number;
  calendar_id: CalendarRace;
  user_id: string;
  rider_id: string;
  position: number;
  points: number;
  inserted_at?: string;
  outcome?: string;
}

// Combined interface for race details
export interface RaceDetails {
  lineups: LineupsResult[];
  sprints: BetResult[];
  bets: BetResult[];
}

@Injectable({
  providedIn: 'root'
})
export class RaceDetailService {

  constructor(private httpService: HttpService) {}


  getRaceDetails(championshipId: number, raceId: string): Observable<RaceDetails> {
    // Calls the backend API using the generic GET method, providing the championship ID and race ID
    return this.httpService.genericGet<RaceDetails>(
      `championship/${championshipId}/race-details/${raceId}`
    );
  }

  getCalendarRace(championshipId: number, raceId: string): Observable<CalendarRace[]> {
      return this.httpService.genericGet<CalendarRace[]>(`championship/${championshipId}/calendar/${raceId}`);
    }
}
