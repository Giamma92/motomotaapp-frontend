// src/app/all-teams/all-teams.component.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, FantasyTeam } from '../../services/dashboard.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { ChampionshipService } from '../../services/championship.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { RaceDetailService, RaceDetails } from '../../services/race-detail.service';

@Component({
  selector: 'app-all-teams',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './all-teams.component.scss',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatExpansionModule, TranslatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'teams.title' | t }}</h1>
      </header>
      <main class="main-content">
        <div class="teams-grid">
          <mat-card class="team-card" *ngFor="let team of teams">
            <mat-card-header>
              <div class="team-header">
                <div class="team-image-container" *ngIf="team.team_image">
                  <img [src]="team.team_image" alt="{{ team.name }} Logo">
                </div>
                <div class="team-image-placeholder" *ngIf="!team.team_image">
                  <mat-icon>groups</mat-icon>
                </div>
                <div class="header-content">
                  <div class="team-info">
                    <mat-card-title class="team-name">{{ team.name }}</mat-card-title>
                    <div class="user-details">
                      <span class="username">
                        <mat-icon>person</mat-icon>
                        {{ team.user_id.first_name }} {{ team.user_id.last_name }}
                      </span>
                      <span class="user-id">
                        <mat-icon>fingerprint</mat-icon>
                        {{ team.user_id.id }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="rider-grid">
                <mat-expansion-panel class="rider-panel first-tier app-expansion-panel">
                  <mat-expansion-panel-header class="rider-header">
                    <div class="rider-header-main">
                      <span class="rider-role">{{ 'dashboard.team.firstTierPilot' | t }}</span>
                      <div class="rider-name-row">
                        <span class="rider-name">{{ team.official_rider_1.first_name }} {{ team.official_rider_1.last_name }}</span>
                        <span class="rider-header-number">#{{ team.official_rider_1.number }}</span>
                      </div>
                    </div>
                  </mat-expansion-panel-header>
                  <div class="rider-info">
                    <div class="rider-stats">
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderLineupsCount(team, team.official_rider_1.id) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderQualifyingCount(team, team.official_rider_1.id) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderRaceCount(team, team.official_rider_1.id) }}</span>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>

                <mat-expansion-panel class="rider-panel second-tier app-expansion-panel" *ngIf="team.official_rider_2">
                  <mat-expansion-panel-header class="rider-header">
                    <div class="rider-header-main">
                      <span class="rider-role">{{ 'dashboard.team.secondTierPilot' | t }}</span>
                      <div class="rider-name-row">
                        <span class="rider-name">{{ team.official_rider_2.first_name }} {{ team.official_rider_2.last_name }}</span>
                        <span class="rider-header-number">#{{ team.official_rider_2.number }}</span>
                      </div>
                    </div>
                  </mat-expansion-panel-header>
                  <div class="rider-info">
                    <div class="rider-stats">
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderLineupsCount(team, team.official_rider_2.id) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderQualifyingCount(team, team.official_rider_2.id) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderRaceCount(team, team.official_rider_2.id) }}</span>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>

                <mat-expansion-panel class="rider-panel third-tier app-expansion-panel">
                  <mat-expansion-panel-header class="rider-header">
                    <div class="rider-header-main">
                      <span class="rider-role">{{ 'dashboard.team.thirdTierPilot' | t }}</span>
                      <div class="rider-name-row">
                        <span class="rider-name">{{ team.reserve_rider.first_name }} {{ team.reserve_rider.last_name }}</span>
                        <span class="rider-header-number">#{{ team.reserve_rider.number }}</span>
                      </div>
                    </div>
                  </mat-expansion-panel-header>
                  <div class="rider-info">
                    <div class="rider-stats">
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderLineupsCount(team, team.reserve_rider.id) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderQualifyingCount(team, team.reserve_rider.id) }}</span>
                      </div>
                      <div class="stat-row">
                        <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                        <span class="stat-value">{{ getTeamRiderRaceCount(team, team.reserve_rider.id) }}</span>
                      </div>
                    </div>
                  </div>
                </mat-expansion-panel>
              </div>
            </mat-card-content>
            <mat-card-actions class="team-card-actions">
              <button mat-button color="primary" class="view-button">
                <mat-icon>visibility</mat-icon>
                {{ 'teams.viewTeam' | t }}
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
        <div *ngIf="teams.length === 0" class="no-teams">
          <p>{{ 'teams.empty' | t }}</p>
        </div>
      </main>
    </div>
  `
})
export class AllTeamsComponent implements OnInit {
  teams: FantasyTeam[] = [];
  racesDetails?: RaceDetails;
  private ridersLineupsCount: Map<string, number> = new Map<string, number>();
  private ridersQualifyingCount: Map<string, number> = new Map<string, number>();
  private ridersRaceCount: Map<string, number> = new Map<string, number>();

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;

      this.dashboardService.getAllFantasyTeams(champId).subscribe({
        next: (data: FantasyTeam[]) => {
          this.teams = data;
          this.computeTeamRiderCounts();
        },
        error: (err) => {
          console.error('Error fetching all fantasy teams:', err);
          this.teams = [];
        }
      });

      this.raceDetailService.getRaceDetails(champId, '0', { allCalendar: true, allUsers: true }).subscribe({
        next: (data: RaceDetails) => {
          this.racesDetails = data;
          this.computeTeamRiderCounts();
        },
        error: (err) => {
          console.error('Error fetching race details for all teams:', err);
          this.racesDetails = undefined;
          this.ridersLineupsCount.clear();
          this.ridersQualifyingCount.clear();
          this.ridersRaceCount.clear();
        }
      });
    });
  }

  private getTeamRiderKey(team: FantasyTeam, riderId: number): string {
    return `${String(team.user_id?.id ?? '')}-${String(riderId ?? '')}`;
  }

  private extractId(value: any): string | number | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object' && ('id' in value)) return value.id;
    return undefined;
  }

  private normalizeText(value: any): string {
    return String(value ?? '').trim().toLowerCase();
  }

  private getUserNameKey(user: any): string {
    const firstName = this.normalizeText(user?.first_name);
    const lastName = this.normalizeText(user?.last_name);
    return `${firstName}|${lastName}`;
  }

  private incrementCount(map: Map<string, number>, key: string): void {
    map.set(key, (map.get(key) ?? 0) + 1);
  }

  private computeTeamRiderCounts(): void {
    this.ridersLineupsCount.clear();
    this.ridersQualifyingCount.clear();
    this.ridersRaceCount.clear();

    if (!this.teams.length || !this.racesDetails?.lineups?.length) {
      return;
    }

    const teamByUserId = new Map(this.teams.map(team => [String(team.user_id?.id ?? ''), team]));
    const teamByUserName = new Map(this.teams.map(team => [this.getUserNameKey(team.user_id), team]));

    this.racesDetails.lineups.forEach((lineup) => {
      const userId = this.extractId(lineup.user_id);
      const team = userId
        ? teamByUserId.get(String(userId))
        : teamByUserName.get(this.getUserNameKey(lineup.user_id));

      if (!team) return;

      const riderIds = [
        team.official_rider_1.id,
        team.official_rider_2?.id,
        team.reserve_rider.id
      ].filter((id): id is number => !!id);

      riderIds.forEach((riderId) => {
        const key = this.getTeamRiderKey(team, riderId);
        const qualifyingRiderId = this.extractId(lineup.qualifying_rider_id);
        const raceRiderId = this.extractId(lineup.race_rider_id);

        if (String(qualifyingRiderId ?? '') === String(riderId)) {
          this.incrementCount(this.ridersQualifyingCount, key);
          this.incrementCount(this.ridersLineupsCount, key);
        }

        if (String(raceRiderId ?? '') === String(riderId)) {
          this.incrementCount(this.ridersRaceCount, key);
          this.incrementCount(this.ridersLineupsCount, key);
        }
      });
    });
  }

  getTeamRiderLineupsCount(team: FantasyTeam, riderId: number): number {
    const key = this.getTeamRiderKey(team, riderId);
    return this.ridersLineupsCount.get(key) ?? 0;
  }

  getTeamRiderQualifyingCount(team: FantasyTeam, riderId: number): number {
    const key = this.getTeamRiderKey(team, riderId);
    return this.ridersQualifyingCount.get(key) ?? 0;
  }

  getTeamRiderRaceCount(team: FantasyTeam, riderId: number): number {
    const key = this.getTeamRiderKey(team, riderId);
    return this.ridersRaceCount.get(key) ?? 0;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
