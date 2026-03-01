// src/app/all-teams/all-teams.component.ts
import { Component, OnInit } from '@angular/core';
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
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatExpansionModule, TranslatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
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
                <mat-expansion-panel class="rider-panel first-tier">
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

                <mat-expansion-panel class="rider-panel second-tier" *ngIf="team.official_rider_2">
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

                <mat-expansion-panel class="rider-panel third-tier">
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
            <mat-card-actions>
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
  `,
  styles: [`
    .teams-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 25px;
      max-width: 1400px;
      width: 100%;
    }

    /* Team Cards */
    .mat-mdc-card.team-card {
      background: rgba(255, 255, 255, 0.95) !important;
      color: #333 !important;

      .mat-mdc-card-title {
        color: var(--primary-color) !important;
      }

    }

    .team-card {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      border: 2px solid #d32f2f;
      transition: transform 0.2s ease;
      overflow: hidden;

      &:hover {
        transform: translateY(-3px);
      }

      .team-header {
        display: flex;
        gap: 12px;
        padding: 16px;
        background: linear-gradient(120deg, #ffffff 0%, #fff5f6 100%);
        border-bottom: 2px solid var(--accent-red);
        align-items: center;
        width: 100%;

        .team-image-container {
          flex: 0 0 60px;
          img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid var(--primary-color);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          }
        }

        .team-image-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;

          mat-icon {
            color: var(--primary-color);
          }
        }

        .header-content {
          flex: 1;

          .team-info {
            width: 100%;

            mat-card-title.mat-mdc-card-title.team-name {
              margin: 0;
              padding: 0;
              font-size: 1.12rem;
              color: var(--primary-color);
              font-family: 'MotoGP Bold', sans-serif;
              line-height: 1.2;
              letter-spacing: 0.2px;
            }
          }

          .user-details {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-top: 8px;
            flex-wrap: wrap;

            .username {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 0.84rem;
              color: #222;
              font-weight: 500;
              background: #ffffff;
              border: 1px solid #ececec;
              border-radius: 999px;
              padding: 3px 9px;

              mat-icon {
                font-size: 14px;
                width: 14px;
                height: 14px;
                color: var(--accent-red);
              }
            }

            .user-id {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              font-size: 0.78rem;
              color: #555;
              background: #f5f5f5;
              padding: 3px 9px;
              border-radius: 999px;

              mat-icon {
                font-size: 13px;
                width: 13px;
                height: 13px;
                color: #666;
              }
            }
          }
        }
      }

      .main-content {
        padding: 70px 0px 0px 0px;
      }

      .rider-grid {
        display: grid;
        gap: 12px;
        padding: 15px;

        .rider-panel {
          border-radius: 10px;
          border: 1px solid #ececec;

          ::ng-deep .mat-expansion-panel-header {
            min-height: 68px;
            height: auto;
            padding: 8px 10px;
          }

          .rider-header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 0;

            .rider-header-main {
              min-width: 0;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: flex-start;
              gap: 2px;

              .rider-role {
                font-size: 0.72rem;
                line-height: 1.05;
                text-transform: uppercase;
                letter-spacing: 0.35px;
                color: #6b7280;
                font-weight: 700;
                font-family: 'MotoGP Bold', sans-serif;
              }

              .rider-name-row {
                display: flex;
                align-items: baseline;
                gap: 8px;
                min-width: 0;
              }

              .rider-name {
                color: #111827;
                font-size: 1.02rem;
                line-height: 1.15;
                font-weight: 700;
                font-family: 'MotoGP Bold', sans-serif;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
            }

            .rider-header-number {
              color: var(--primary-color);
              border-left: 1px solid #d1d5db;
              padding-left: 8px;
              font-size: 0.76rem;
              letter-spacing: 0.15px;
              font-weight: 600;
              font-family: 'MotoGP Bold', sans-serif;
              white-space: nowrap;
              flex: 0 0 auto;
            }
          }

          .rider-info {
            display: grid;
            gap: 10px;

            .rider-stats {
              display: grid;
              gap: 6px;

              .stat-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #fafafa;
                border: 1px solid #ededed;
                border-radius: 8px;
                padding: 7px 10px;

                .stat-label {
                  font-size: 0.8rem;
                  color: #5b5b5b;
                }

                .stat-value {
                  font-size: 0.86rem;
                  font-weight: 700;
                  color: var(--primary-color);
                }
              }
            }
          }
        }

        .first-tier {
          background: linear-gradient(145deg, #fff5f6, #ffffff);
          border-left: 4px solid #d32f2f;
        }

        .second-tier {
          background: linear-gradient(145deg, #f7f8ff, #ffffff);
          border-left: 4px solid #5c6bc0;
        }

        .third-tier {
          background: linear-gradient(145deg, #f8f9fa, #ffffff);
          border-left: 4px solid #6c757d;
        }
      }

      mat-card-actions {
        padding: 10px 15px;
        border-top: 1px solid #eee;

        .view-button {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          padding: 4px 12px;
        }
      }

      @media (max-width: 768px) {
        .team-header {
          flex-direction: column;
          align-items: center;

          .header-content {
            width: 100%;

            .team-name-container {
              justify-content: center;
              text-align: center;
            }

            .user-info {
              justify-content: center;
              flex-wrap: wrap;
            }
          }
        }
      }
    }

    .no-teams {
      margin-top: 20px;
      text-align: center;
      font-size: 18px;
    }

    @media (min-width: 1200px) {
      .teams-grid {
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      }
    }

    /* Dashboard-aligned compact full-page override */
    .page-container {
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.14), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(0, 0, 0, 0.05), transparent 34%),
        linear-gradient(158deg, #ffffff 0%, #f8f8f9 48%, #f1f2f4 100%);
      color: #16181d;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--app-header-height);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 0 8px;
      background: rgba(17, 18, 20, 0.97);
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
      z-index: 1000;
    }

    .header button {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #fff;
      color: #c8102e;
    }

    .header h1 {
      margin: 0;
      flex: 1;
      text-align: center;
      color: #fff;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: clamp(1rem, 2.7vw, 1.3rem);
      text-transform: uppercase;
      letter-spacing: .3px;
      padding-right: 42px;
    }

    .main-content {
      padding: calc(var(--app-header-height) + 10px) 10px 12px;
      width: 100%;
      max-width: none;
    }

    .teams-grid {
      max-width: none;
      gap: 8px;
    }

    .mat-mdc-card.team-card,
    .team-card {
      border: 1px solid rgba(17, 18, 20, 0.12) !important;
      border-radius: 16px !important;
      box-shadow: none !important;
      overflow: hidden;
      background: #fff !important;
      transition: none;
    }

    .team-card:hover {
      transform: none;
    }

    .team-card .team-header {
      padding: 10px;
      gap: 10px;
      border-bottom: 1px solid rgba(17, 18, 20, 0.10);
      background: #111214;
      color: #fff;
    }

    .team-card .team-header .team-image-container,
    .team-card .team-header .team-image-placeholder {
      flex: 0 0 48px;
      width: 48px;
      height: 48px;
    }

    .team-card .team-header .team-image-container img {
      width: 48px;
      height: 48px;
      border-width: 2px;
      border-color: #fff;
      box-shadow: none;
    }

    .team-card .team-header .team-image-placeholder {
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.12);
    }

    .team-card .team-header .team-image-placeholder mat-icon {
      color: #fff;
    }

    .team-card .team-header .header-content .team-info mat-card-title.mat-mdc-card-title.team-name {
      color: #fff !important;
      font-size: 1rem;
    }

    .team-card .team-header .header-content .user-details {
      gap: 6px;
      margin-top: 5px;
    }

    .team-card .team-header .header-content .user-details .username,
    .team-card .team-header .header-content .user-details .user-id {
      padding: 2px 8px;
      font-size: .74rem;
      border-color: rgba(255, 255, 255, 0.25);
      color: #fff;
      background: rgba(255, 255, 255, 0.12);
    }

    .team-card .team-header .header-content .user-details .username mat-icon,
    .team-card .team-header .header-content .user-details .user-id mat-icon {
      color: #ff8ca0;
    }

    .team-card .rider-grid {
      padding: 8px;
      gap: 6px;
    }

    .team-card .rider-grid .rider-panel {
      border-radius: 12px;
      box-shadow: none !important;
    }

    .team-card .rider-grid .rider-panel ::ng-deep .mat-expansion-panel-header {
      min-height: 58px;
      padding: 6px 8px;
    }

    .team-card .rider-grid .rider-panel .rider-header .rider-header-main .rider-name {
      font-size: .95rem;
    }

    .team-card .rider-grid .rider-panel .rider-info .rider-stats .stat-row {
      padding: 6px 8px;
      border-radius: 10px;
    }

    .team-card .rider-grid .first-tier {
      border-left-color: #c8102e;
      background: linear-gradient(145deg, #fff8f9, #ffffff);
    }

    .team-card .rider-grid .second-tier {
      border-left-color: #111214;
      background: linear-gradient(145deg, #f8f9fa, #ffffff);
    }

    .team-card .rider-grid .third-tier {
      border-left-color: #666b74;
      background: linear-gradient(145deg, #f8f9fa, #ffffff);
    }

    .team-card mat-card-actions {
      padding: 6px 8px 8px;
      border-top: 1px solid rgba(17, 18, 20, 0.10);
    }

    .team-card mat-card-actions .view-button {
      min-height: 34px;
      border-radius: 12px;
      padding: 0 10px;
      font-size: .8rem;
      color: #111214;
    }

    .no-teams {
      margin-top: 8px;
      font-size: .95rem;
      color: #4b4f57;
    }

    @media (max-width: 768px) {
      .main-content {
        padding: calc(var(--app-header-height) + 8px) 8px 10px;
      }

      .teams-grid {
        gap: 6px;
      }
    }
  `]
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
