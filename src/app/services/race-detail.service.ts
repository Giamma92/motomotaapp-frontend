// src/app/services/race-detail.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { CalendarRace, Rider } from './dashboard.service';
import { UserInfo } from './auth.service';

// Define the interface for standings results
export interface LineupsResult {
  championship_id: number;
  calendar_id: CalendarRace;
  user_id: UserInfo;
  race_rider_id?: Rider;        // Rider ID for qualification
  qualifying_rider_id?: Rider;  // Rider ID for race
  inserted_at?: string;
  modified_at?: string;
}

// Define the interface for bet results
export interface BetResult {
  id: number;
  championship_id: number;
  calendar_id: CalendarRace;
  user_id: UserInfo;
  rider_id: Rider;
  position: number;
  points: number;
  inserted_at?: string;
  modified_at?: string;
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


  getRaceDetails(championshipId: number, raceId: string, opts: { allUsers?: boolean; allCalendar?: boolean } = {}): Observable<RaceDetails> {
    return this.httpService.genericGet<RaceDetails>(
      `championship/${championshipId}/race-details/${raceId}?allCalendar=${opts.allCalendar ?? false}&allUsers=${opts.allUsers ?? true}`
    );
  }

  getCalendarRace(championshipId: number, raceId: string): Observable<CalendarRace> {
    return this.httpService.genericGet<CalendarRace>(
      `championship/${championshipId}/calendar/${raceId}`
    );
  }

  getLineupRace(championshipId: number, raceId: string): Observable<LineupsResult[]> {
    return this.httpService.genericGet<LineupsResult[]>(`championship/${championshipId}/lineups/${raceId}`)
  }

  upsertLineup(championshipId: number, payload: any): Observable<object> {
    return this.httpService.genericPut(`championship/${championshipId}/lineups`, payload);
  }

  // Bulk copy last race lineups for users missing current race lineups
  fillMissingLineups(championshipId: number, calendarId: number) {
    // Supabase Edge Function endpoint URL (adjust base)
    return this.httpService.genericGet(`championship/${championshipId}/races/${calendarId}/fill-missing-lineups`);
  }

  // Bulk set bet outcomes (SPR or RAC) to true/false for current race

  setBetOutcomeBulk(
    championshipId: number,
    calendarId: number,
    kind: 'SPR'|'RAC',
    outcome: boolean,
    betIds?: Array<string | number>
  ) {
    // If you’re using your Express backend:
    const kindPath = kind === 'SPR' ? 'sprint' : 'race';
    return this.httpService.genericPost(
      `championship/${championshipId}/races/${calendarId}/bets/${kindPath}/outcome`,
      { outcome, betIds }   // <-- include selected IDs
    );
  }

}
