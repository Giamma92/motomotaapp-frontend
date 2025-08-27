import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../../services/dashboard.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AuthService } from '../../services/auth.service';
import { NotificationServiceService } from '../../services/notification.service';

interface MotoGPResult {
  id: string;
  position: number;
  rider: {
    id: string;
    full_name: string;
    country: {
      iso: string;
      name: string;
    };
    number: number;
  };
  constructor: {
    id: string;
    name: string;
  };
  team_name: string;
  best_lap?: {
    number: number;
    time: string;
  };
  total_laps?: number;
  top_speed?: number;
  gap?: {
    first: string;
    prev: string;
  };
  average_speed?: number;
  time?: string;
  points?: number;
  status: string;
}

interface MotoGPResultsData {
  meta: {
    championshipId: number;
    calendarId: number;
    year: number;
    eventCode: string;
  };
  sessions: {
    Q1?: MotoGPResult[];
    Q2?: MotoGPResult[];
    SPR?: MotoGPResult[];
    RAC?: MotoGPResult[];
  };
  merged: any[];
}

@Component({
  selector: 'app-motogp-results',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'motogp.results.title' | t }}</h1>
      </header>

      <main class="main-content">
        <div *ngIf="loading" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>{{ 'common.loading' | t }}</p>
        </div>

        <div *ngIf="!loading && results" class="results-container">
          <!-- Event Info Card -->
          <mat-card class="event-info-card">
            <div class="card-header">
              <mat-icon>event</mat-icon>
              <span>{{ 'motogp.results.eventInfo' | t }}</span>
            </div>
            <div class="section-subtitle">{{ results.meta.year }} - {{ results.meta.eventCode }}</div>
            <mat-card-content>
              <div class="event-details">
                <div class="detail-item">
                  <mat-icon>calendar_today</mat-icon>
                  <span>{{ results.meta.year }}</span>
                </div>
                <div class="detail-item">
                  <mat-icon>flag</mat-icon>
                  <span>{{ results.meta.eventCode }}</span>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Admin Actions Card -->
          <mat-card *ngIf="isAdmin()" class="admin-actions-card">
            <div class="card-header">
              <mat-icon>admin_panel_settings</mat-icon>
              <span>{{ 'motogp.results.adminActions' | t }}</span>
            </div>
            <mat-card-content>
              <div class="admin-buttons">
                <button mat-raised-button color="primary" (click)="updateMotoGPResults()">
                  <mat-icon>get_app</mat-icon>
                  {{ 'motogp.results.updateMotoGPResults' | t }}
                </button>
                <button mat-raised-button color="accent" (click)="updateStandings()">
                  <mat-icon>sync</mat-icon>
                  {{ 'motogp.results.updateStandings' | t }}
                </button>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Results Card -->
          <mat-card class="results-card">
            <mat-tab-group class="results-tabs">
              <!-- Q1 Tab -->
              <mat-tab *ngIf="results.sessions.Q1" label="{{ 'motogp.results.qualifying1' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="results.sessions.Q1" class="result-table">
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.position' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <span class="position-badge">{{ result.position }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">{{ result.rider.full_name }}</div>
                              <div class="team-name">{{ result.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="bestLap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.bestLap' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.best_lap" class="lap-info">
                            <div class="lap-time">{{ result.best_lap.time }}</div>
                            <div class="lap-number">Lap {{ result.best_lap.number }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.gap" class="gap-info">
                            <div class="gap-first">+{{ result.gap.first }}</div>
                            <div class="gap-prev">+{{ result.gap.prev }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="topSpeed">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.topSpeed' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.top_speed" class="speed-info">{{ result.top_speed }} km/h</div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="q1DisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: q1DisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <div class="result-card" *ngFor="let result of results.sessions.Q1">
                        <div class="result-header">
                          <span class="position-badge">{{ result.position }}</span>
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-name">{{ result.rider.full_name }}</div>
                          </div>
                        </div>
                        <div class="result-details">
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.bestLap' | t }}:</span>
                            <span class="value" *ngIf="result.best_lap">{{ result.best_lap.time }} (Lap {{ result.best_lap.number }})</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.gap' | t }}:</span>
                            <span class="value" *ngIf="result.gap">+{{ result.gap.first }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.topSpeed' | t }}:</span>
                            <span class="value" *ngIf="result.top_speed">{{ result.top_speed }} km/h</span>
                          </div>
                          <div class="team-name">{{ result.team_name }}</div>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>

              <!-- Q2 Tab -->
              <mat-tab *ngIf="results.sessions.Q2" label="{{ 'motogp.results.qualifying2' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="results.sessions.Q2" class="result-table">
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.position' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <span class="position-badge">{{ result.position }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">{{ result.rider.full_name }}</div>
                              <div class="team-name">{{ result.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="bestLap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.bestLap' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.best_lap" class="lap-info">
                            <div class="lap-time">{{ result.best_lap.time }}</div>
                            <div class="lap-number">Lap {{ result.best_lap.number }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.gap" class="gap-info">
                            <div class="gap-first">+{{ result.gap.first }}</div>
                            <div class="gap-prev">+{{ result.gap.prev }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="topSpeed">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.topSpeed' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.top_speed" class="speed-info">{{ result.top_speed }} km/h</div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="q2DisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: q2DisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <div class="result-card" *ngFor="let result of results.sessions.Q2">
                        <div class="result-header">
                          <span class="position-badge">{{ result.position }}</span>
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-name">{{ result.rider.full_name }}</div>
                          </div>
                        </div>
                        <div class="result-details">
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.bestLap' | t }}:</span>
                            <span class="value" *ngIf="result.best_lap">{{ result.best_lap.time }} (Lap {{ result.best_lap.number }})</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.gap' | t }}:</span>
                            <span class="value" *ngIf="result.gap">+{{ result.gap.first }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.topSpeed' | t }}:</span>
                            <span class="value" *ngIf="result.top_speed">{{ result.top_speed }} km/h</span>
                          </div>
                          <div class="team-name">{{ result.team_name }}</div>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>

              <!-- Sprint Tab -->
              <mat-tab *ngIf="results.sessions.SPR" label="{{ 'motogp.results.sprint' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="results.sessions.SPR" class="result-table">
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.position' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <span class="position-badge">{{ result.position || '-' }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">{{ result.rider.full_name }}</div>
                              <div class="team-name">{{ result.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="time">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.time' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.time" class="time-info">{{ result.time }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.gap" class="gap-info">
                            <div class="gap-first">+{{ result.gap.first }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.points' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.points" class="points-info">{{ result.points }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.status' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <mat-chip [class]="getStatusClass(result.status)">
                            {{ getStatusText(result.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="sprintDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: sprintDisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <div class="result-card" *ngFor="let result of results.sessions.SPR">
                        <div class="result-header">
                          <span class="position-badge">{{ result.position || '-' }}</span>
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-name">{{ result.rider.full_name }}</div>
                          </div>
                        </div>
                        <div class="result-details">
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.time' | t }}:</span>
                            <span class="value" *ngIf="result.time">{{ result.time }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.gap' | t }}:</span>
                            <span class="value" *ngIf="result.gap">+{{ result.gap.first }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.points' | t }}:</span>
                            <span class="value" *ngIf="result.points">{{ result.points }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.status' | t }}:</span>
                            <mat-chip [class]="getStatusClass(result.status)">
                              {{ getStatusText(result.status) }}
                            </mat-chip>
                          </div>
                          <div class="team-name">{{ result.team_name }}</div>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>

              <!-- Race Tab -->
              <mat-tab *ngIf="results.sessions.RAC" label="{{ 'motogp.results.race' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="results.sessions.RAC" class="result-table">
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.position' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <span class="position-badge">{{ result.position || '-' }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">{{ result.rider.full_name }}</div>
                              <div class="team-name">{{ result.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="time">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.time' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.time" class="time-info">{{ result.time }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.gap" class="gap-info">
                            <div class="gap-first">+{{ result.gap.first }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.points' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <div *ngIf="result.points" class="points-info">{{ result.points }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.status' | t }}</th>
                        <td mat-cell *matCellDef="let result">
                          <mat-chip [class]="getStatusClass(result.status)">
                            {{ getStatusText(result.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="raceDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: raceDisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <div class="result-card" *ngFor="let result of results.sessions.RAC">
                        <div class="result-header">
                          <span class="position-badge">{{ result.position || '-' }}</span>
                          <div class="rider-info">
                            <div class="rider-number">#{{ result.rider.number }}</div>
                            <div class="rider-name">{{ result.rider.full_name }}</div>
                          </div>
                        </div>
                        <div class="result-details">
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.time' | t }}:</span>
                            <span class="value" *ngIf="result.time">{{ result.time }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.gap' | t }}:</span>
                            <span class="value" *ngIf="result.gap">+{{ result.gap.first }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.points' | t }}:</span>
                            <span class="value" *ngIf="result.points">{{ result.points }}</span>
                          </div>
                          <div class="detail-row">
                            <span class="label">{{ 'motogp.results.status' | t }}:</span>
                            <mat-chip [class]="getStatusClass(result.status)">
                              {{ getStatusText(result.status) }}
                            </mat-chip>
                          </div>
                          <div class="team-name">{{ result.team_name }}</div>
                        </div>
                      </div>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card>
        </div>

        <div *ngIf="!loading && !results" class="no-results">
          <mat-card class="no-results-card">
            <mat-card-content>
              <mat-icon class="no-results-icon">emoji_events</mat-icon>
              <p>{{ 'motogp.results.noResults' | t }}</p>
            </mat-card-content>
          </mat-card>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff;
      padding: 20px;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      color: #fff;
      margin-bottom: 20px;
      z-index: 1000;
      padding: 0 20px;
    }

    .header button {
      color: #fff;
    }

    .header h1 {
      flex: 1;
      text-align: center;
      margin: 0;
      font-size: 24px;
      font-family: 'MotoGP Bold', sans-serif;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 80px 0 0 0;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      color: #fff;
    }

    .results-container {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .event-info-card {
      background: white;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      color: var(--text-dark);
    }

    .card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.2rem;
    }

    .section-subtitle {
      padding: 1rem 1.5rem 0.5rem;
      color: #666;
      font-size: 1rem;
      font-weight: 500;
    }

    .event-details {
      display: flex;
      gap: 2rem;
      padding: 0 1.5rem 1.5rem;
      flex-wrap: wrap;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-dark);
    }

    .admin-actions-card {
      background: white;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      color: var(--text-dark);

      .card-header {
        background: linear-gradient(135deg, #d32f2f, #f44336);
        color: white;
        padding: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
        font-family: 'MotoGP Bold', sans-serif;
        font-size: 1.2rem;
      }

      mat-card-content {
        padding: 1.5rem;
      }

      .admin-buttons {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;

        button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.3s ease;

          mat-icon {
            font-size: 1.2rem;
            width: 1.2rem;
            height: 1.2rem;
          }
        }

        @media (max-width: 768px) {
          flex-direction: column;

          button {
            width: 100%;
            justify-content: center;
          }
        }
      }
    }

    .results-card {
      background: white;
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      color: var(--text-dark);
    }

    .results-tabs {
      ::ng-deep .mat-mdc-tab-header {
        background: rgba(var(--primary-color), 0.1);
      }

      ::ng-deep .mat-mdc-tab-label {
        color: var(--primary-color);
        font-family: 'MotoGP Bold', sans-serif;
      }

      ::ng-deep .mat-mdc-tab-label-active {
        color: var(--primary-color);
      }

      ::ng-deep .mat-mdc-ink-bar {
        background-color: var(--primary-color);
      }
    }

    .session-results {
      padding: 1.5rem;
    }

    .result-table {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;

      ::ng-deep .mat-mdc-header-cell {
        background: rgba(var(--primary-color), 0.1);
        color: var(--primary-color);
        font-weight: 600;
        font-family: 'MotoGP Bold', sans-serif;
        padding: 1rem;
      }

      ::ng-deep .mat-mdc-row:nth-child(even) {
        background: #f8f9fa;
      }

      ::ng-deep .mat-mdc-row:hover {
        background: rgba(var(--primary-color), 0.05);
      }

      ::ng-deep .mat-mdc-cell {
        padding: 1rem;
        vertical-align: middle;
      }
    }

    .position-badge {
      background: var(--primary-color);
      color: white;
      padding: 0.5rem 0.75rem;
      border-radius: 50%;
      font-weight: 600;
      font-size: 0.9rem;
      min-width: 2rem;
      text-align: center;
      display: inline-block;
    }

    .rider-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .rider-number {
      background: var(--primary-color);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.9rem;
      min-width: 2rem;
      text-align: center;
    }

    .rider-details {
      .rider-name {
        font-weight: 600;
        color: var(--text-dark);
        font-size: 1rem;
      }

      .team-name {
        font-size: 0.9rem;
        color: #666;
        margin-top: 0.25rem;
      }
    }

    .lap-info, .gap-info, .time-info, .points-info, .speed-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .lap-time, .time-info {
      font-weight: 600;
      color: var(--primary-color);
      font-family: 'Courier New', monospace;
      font-size: 1rem;
    }

    .lap-number {
      font-size: 0.8rem;
      color: #666;
    }

    .gap-first {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 1rem;
    }

    .gap-prev {
      font-size: 0.8rem;
      color: #666;
    }

    .points-info {
      font-weight: 600;
      color: var(--primary-color);
      font-size: 1.1rem;
    }

    .speed-info {
      font-weight: 600;
      color: var(--text-dark);
      font-size: 1rem;
    }

    .status-completed {
      background: #4caf50 !important;
      color: white !important;
    }

    .status-dnf {
      background: #f44336 !important;
      color: white !important;
    }

    .status-dns {
      background: #ff9800 !important;
      color: white !important;
    }

    /* Mobile Styles */
    .mobile-results-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .result-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1rem;
      border: 1px solid #e9ecef;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .result-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.25rem 0;
    }

    .detail-row .label {
      font-weight: 600;
      color: #666;
      font-size: 0.9rem;
    }

    .detail-row .value {
      font-weight: 500;
      color: var(--text-dark);
      font-size: 0.9rem;
    }

    .no-results {
      text-align: center;
      padding: 4rem 2rem;
    }

    .no-results-card {
      background: white;
      border-radius: 18px;
      padding: 3rem;
      color: var(--text-dark);
      text-align: center;
    }

    .no-results-icon {
      font-size: 4rem;
      color: #ccc;
      margin-bottom: 1rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .page-container {
        padding: 10px;
      }

      .header {
        padding: 0 10px;
      }

      .header h1 {
        font-size: 20px;
      }

      .main-content {
        padding: 70px 0 0 0;
      }

      .results-container {
        gap: 1rem;
      }

      .event-details {
        flex-direction: column;
        gap: 1rem;
      }

      .session-results {
        padding: 1rem;
      }

      .card-header {
        padding: 1rem;
        font-size: 1rem;
      }

      .section-subtitle {
        padding: 0.5rem 1rem 0.25rem;
      }

      .result-card {
        padding: 0.75rem;
      }

      .result-header {
        margin-bottom: 0.75rem;
      }

      .detail-row {
        padding: 0.2rem 0;
      }

      .detail-row .label,
      .detail-row .value {
        font-size: 0.85rem;
      }

      .rider-number {
        font-size: 0.8rem;
        min-width: 1.5rem;
      }

      .rider-name {
        font-size: 0.9rem;
      }

      .team-name {
        font-size: 0.8rem;
      }

      .position-badge {
        font-size: 0.8rem;
        min-width: 1.5rem;
        padding: 0.4rem 0.6rem;
      }
    }

    @media (max-width: 480px) {
      .page-container {
        padding: 5px;
      }

      .header {
        padding: 0 5px;
      }

      .main-content {
        padding: 65px 0 0 0;
      }

      .session-results {
        padding: 0.75rem;
      }

      .result-card {
        padding: 0.5rem;
      }

      .detail-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .detail-row .label {
        font-size: 0.8rem;
      }

      .detail-row .value {
        font-size: 0.8rem;
      }
    }
  `]
})
export class MotoGPResultsComponent implements OnInit {
  results: MotoGPResultsData | null = null;
  loading = true;
  championshipId: number = 0;
  calendarId: number = 0;
  isMobile = false;

  q1DisplayedColumns = ['position', 'rider', 'bestLap', 'gap', 'topSpeed'];
  q2DisplayedColumns = ['position', 'rider', 'bestLap', 'gap', 'topSpeed'];
  sprintDisplayedColumns = ['position', 'rider', 'time', 'gap', 'points', 'status'];
  raceDisplayedColumns = ['position', 'rider', 'time', 'gap', 'points', 'status'];

  constructor(
    private dashboardService: DashboardService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationServiceService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.championshipId = +params['championshipId'];
      this.calendarId = +params['calendarId'];
      this.loadResults();
    });
  }

  loadResults(): void {
    this.loading = true;
    this.dashboardService.fetchMotoGPResults(this.championshipId, this.calendarId, false).subscribe({
      next: (data: MotoGPResultsData) => {
        this.results = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading MotoGP results:', error);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    let prevNavUrl = this.router.lastSuccessfulNavigation?.previousNavigation?.initialUrl;
    if(!!prevNavUrl)
      this.router.navigateByUrl(prevNavUrl);
    else
      this.router.navigate(['/calendar']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'INSTND':
        return 'status-completed';
      case 'OUTSTND':
        return 'status-dnf';
      case 'NOTFINISHFIRST':
        return 'status-dns';
      default:
        return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'INSTND':
        return 'Finished';
      case 'OUTSTND':
        return 'DNF';
      case 'NOTFINISHFIRST':
        return 'DNS';
      default:
        return status;
    }
  }

  isAdmin(): boolean {
    return this.authService.isCurrentUserAdmin();
  }

  updateStandings(): void {
    this.notificationService.showSuccess('motogp.results.updateStandings');
    this.dashboardService.updateStandings(this.championshipId, this.calendarId).subscribe({
      next: () => {
        this.notificationService.showSuccess('motogp.results.updateStandingsSuccess');
      },
      error: (err: any) => {
        console.error('Error updating standings:', err);
        this.notificationService.showError('motogp.results.updateStandingsFail');
      }
    });
  }

  updateMotoGPResults(): void {
    this.notificationService.showSuccess('motogp.results.fetchMotoGPResults');
    this.dashboardService.fetchMotoGPResults(this.championshipId, this.calendarId, true).subscribe({
      next: () => {
        this.notificationService.showSuccess('motogp.results.fetchMotoGPResultsSuccess');
        this.loadResults(); // Reload the results after updating
      },
      error: (err: any) => {
        console.error('Error fetching MotoGP results:', err);
        this.notificationService.showError('motogp.results.fetchMotoGPResultsFail');
      }
    });
  }
}
