// src/app/services/trophy.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export type TrophyCode = 'season_champion' | 'season_runner_up' | 'season_third' | 'special';

export interface TrophyUser {
  id: string;
  first_name: string;
  last_name: string;
  alias: string | null;
  profile_image: string | null;
}

export interface PodiumEntry {
  id?: number;
  trophy_code?: TrophyCode;
  position: number;
  score: number;
  user: TrophyUser;
}

export interface SeasonHistory {
  championship: { id: number; year: number; description: string; completed_at: string };
  participants: number;
  podium: PodiumEntry[];
  specials: { id: number; title: string; user: TrophyUser }[];
  standings: { position: number; score: number; user: TrophyUser }[];
}

export interface MedalRow {
  user: TrophyUser;
  gold: number;
  silver: number;
  bronze: number;
  specials: number;
  total: number;
  seasons: number;
  bestPosition: number | null;
}

export interface CurrentSeason {
  championship: { id: number; year: number; description: string };
  participants: number;
  racesTotal: number;
  racesCompleted: number;
  seasonFinished: boolean;
  podium: PodiumEntry[];
}

export interface TrophyHistory {
  firstYear: number;
  seasons: SeasonHistory[];
  medalTable: MedalRow[];
  current: CurrentSeason | null;
}

export interface UserTrophy {
  id: number;
  trophy_code: TrophyCode;
  title: string | null;
  position: number | null;
  score: number | null;
  championship_id: number;
  year: number | null;
  awarded_at: string;
}

export interface UserSeason {
  championship_id: number;
  year: number;
  description: string;
  completed: boolean;
  position: number;
  score: number;
  participants: number;
}

export interface Badge {
  code: string;
  icon: string;
  value: number;
  level: number; // 0 = locked, 1 bronze, 2 silver, 3 gold
  thresholds: number[];
  next: number | null;
}

export interface Achievements {
  user: TrophyUser;
  counts: { gold: number; silver: number; bronze: number; specials: number };
  trophies: UserTrophy[];
  seasons: UserSeason[];
  badges: Badge[];
  stats: {
    seasons: number;
    racesPlayed: number;
    totalPoints: number;
    avgPoints: number;
    bestRace: { score: number; calendar_id: number; name: string | null; country: string | null; year: number | null } | null;
    bestPosition: number | null;
  };
}

export interface FinalizePreview {
  championship: { id: number; year: number; description: string; completed_at: string | null };
  completed: boolean;
  countsForHistory: boolean;
  racesTotal: number;
  racesCompleted: number;
  seasonFinished: boolean;
  participants: number;
  podium: PodiumEntry[];
}

export const TROPHY_IMAGES: Record<Exclude<TrophyCode, 'special'>, string> = {
  season_champion: '/assets/images/trophies/champion-gold.webp',
  season_runner_up: '/assets/images/trophies/runner-up-silver.webp',
  season_third: '/assets/images/trophies/third-bronze.webp'
};

export const TROPHY_LABELS: Record<TrophyCode, string> = {
  season_champion: 'Campione',
  season_runner_up: '2° classificato',
  season_third: '3° classificato',
  special: 'Premio speciale'
};

export function trophyCodeForPosition(position: number | null | undefined): Exclude<TrophyCode, 'special'> | null {
  if (position === 1) return 'season_champion';
  if (position === 2) return 'season_runner_up';
  if (position === 3) return 'season_third';
  return null;
}

export function displayName(user: TrophyUser | null | undefined): string {
  if (!user) return '';
  return user.alias || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.id;
}

@Injectable({ providedIn: 'root' })
export class TrophyService {
  constructor(private http: HttpService) {}

  getHistory(): Observable<TrophyHistory> {
    return this.http.genericGet<TrophyHistory>('trophies/history');
  }

  getAchievements(userId: string = 'me'): Observable<Achievements> {
    return this.http.genericGet<Achievements>(`achievements/${encodeURIComponent(userId)}`);
  }

  // ---- Admin ----
  getFinalizePreview(championshipId: number): Observable<FinalizePreview> {
    return this.http.genericGet<FinalizePreview>(`championships/${championshipId}/finalize`);
  }

  finalizeChampionship(championshipId: number, notify = true): Observable<unknown> {
    return this.http.genericPost(`championships/${championshipId}/finalize`, { notify });
  }

  reopenChampionship(championshipId: number): Observable<unknown> {
    return this.http.genericDelete(`championships/${championshipId}/finalize`);
  }

  awardSpecial(body: { user_id: string; championship_id: number; title: string }): Observable<unknown> {
    return this.http.genericPost('trophies/special', body);
  }

  deleteTrophy(id: number): Observable<unknown> {
    return this.http.genericDelete(`trophies/${id}`);
  }
}
