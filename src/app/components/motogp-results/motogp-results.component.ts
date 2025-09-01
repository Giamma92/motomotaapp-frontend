import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DashboardService } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { NotificationServiceService } from '../../services/notification.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

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
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query('.event-info-card, .admin-actions-card, .results-card', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(100, [
            animate('300ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()" aria-label="Back">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1>{{ 'motogp.results.title' | t }}</h1>
      </header>

      <main class="main-content" @cardAnimation>
        <div *ngIf="loading" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>{{ 'common.loading' | t }}</p>
        </div>

        <div *ngIf="!loading && results" class="results-container">
          <!-- Event Info Card -->
          <mat-card class="event-info-card">
            <div class="card-header">
              <i class="fa-solid fa-calendar-check"></i>
              <span>{{ 'motogp.results.eventInfo' | t }}</span>
            </div>
            <div class="event-meta-chips">
              <span class="meta-chip year">
                <i class="fa-solid fa-calendar"></i> {{ results.meta.year }}
              </span>
              <span class="meta-chip code">
                <i class="fa-solid fa-flag-checkered"></i> {{ results.meta.eventCode }}
              </span>
            </div>
          </mat-card>

          <!-- Admin Actions Card -->
          <mat-card *ngIf="isAdmin()" class="admin-actions-card">
            <div class="card-header">
              <i class="fa-solid fa-shield-halved"></i>
              <span>{{ 'motogp.results.adminActions' | t }}</span>
            </div>
            <mat-card-content>
              <div class="admin-buttons">
                <button mat-raised-button color="primary" (click)="updateMotoGPResults()">
                  <i class="fa-solid fa-download"></i>
                  {{ 'motogp.results.updateMotoGPResults' | t }}
                </button>
                <button mat-raised-button color="accent" (click)="updateStandings()">
                  <i class="fa-solid fa-arrows-rotate"></i>
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
                  <!-- Desktop -->
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="results.sessions.Q1" class="result-table">
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.position' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <span class="position-badge" [ngClass]="positionClass(r.position)">
                            <ng-container [ngSwitch]="r.position">
                              <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
                              <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
                              <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
                              <span *ngSwitchDefault>{{ r.position || '-' }}</span>
                            </ng-container>
                          </span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div class="rider-info">
                            <div class="rider-number">#{{ r.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">
                                <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
                                {{ r.rider.full_name }}
                              </div>
                              <div class="team-name">{{ r.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="bestLap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.bestLap' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.best_lap" class="lap-info">
                            <div class="lap-time" [class.fastest]="isFastestLap(r, 'Q1')">
                              {{ r.best_lap.time }}
                              <span class="fl-pill" *ngIf="isFastestLap(r, 'Q1')">FL</span>
                            </div>
                            <div class="lap-number">{{ 'motogp.results.lap' | t }} {{ r.best_lap.number }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.gap" class="gap-info">
                            <div class="gap-first">+{{ r.gap.first }}</div>
                            <div class="gap-prev">+{{ r.gap.prev }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="topSpeed">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.topSpeed' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.top_speed" class="speed-info">{{ r.top_speed }} km/h</div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="q1DisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: q1DisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <!-- Mobile -->
                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <ng-container *ngFor="let r of results.sessions.Q1">
                      <ng-container
                        *ngTemplateOutlet="mobileQualiCard; context: { $implicit: r, sessionKey: 'Q1' }">
                      </ng-container>

                      </ng-container>
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
                        <td mat-cell *matCellDef="let r">
                          <span class="position-badge" [ngClass]="positionClass(r.position)">
                            <ng-container [ngSwitch]="r.position">
                              <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
                              <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
                              <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
                              <span *ngSwitchDefault>{{ r.position || '-' }}</span>
                            </ng-container>
                          </span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div class="rider-info">
                            <div class="rider-number">#{{ r.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">
                                <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
                                {{ r.rider.full_name }}
                              </div>
                              <div class="team-name">{{ r.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="bestLap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.bestLap' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.best_lap" class="lap-info">
                            <div class="lap-time" [class.fastest]="isFastestLap(r, 'Q2')">
                              {{ r.best_lap.time }}
                              <span class="fl-pill" *ngIf="isFastestLap(r, 'Q2')">FL</span>
                            </div>
                            <div class="lap-number">{{ 'motogp.results.lap' | t }} {{ r.best_lap.number }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.gap" class="gap-info">
                            <div class="gap-first">+{{ r.gap.first }}</div>
                            <div class="gap-prev">+{{ r.gap.prev }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="topSpeed">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.topSpeed' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.top_speed" class="speed-info">{{ r.top_speed }} km/h</div>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="q2DisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: q2DisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <ng-container *ngFor="let r of results.sessions.Q2">
                        <ng-container *ngTemplateOutlet="mobileQualiCard; context: { $implicit: r, sessionKey: 'Q2' }"></ng-container>
                      </ng-container>
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
                        <td mat-cell *matCellDef="let r">
                          <span class="position-badge" [ngClass]="positionClass(r.position)">
                            <ng-container [ngSwitch]="r.position">
                              <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
                              <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
                              <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
                              <span *ngSwitchDefault>{{ r.position || '-' }}</span>
                            </ng-container>
                          </span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div class="rider-info">
                            <div class="rider-number">#{{ r.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">
                                <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
                                {{ r.rider.full_name }}
                              </div>
                              <div class="team-name">{{ r.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="time">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.time' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.time" class="time-info">{{ r.time }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.gap" class="gap-info">
                            <div class="gap-first">+{{ r.gap.first }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.points' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.points" class="points-info">{{ r.points }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.status' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <mat-chip [class]="getStatusClass(r.status)">
                            {{ getStatusText(r.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="sprintDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: sprintDisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <ng-container *ngFor="let r of results.sessions.SPR">
                        <ng-container *ngTemplateOutlet="mobileRaceCard; context: { $implicit: r }"></ng-container>
                      </ng-container>
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
                        <td mat-cell *matCellDef="let r">
                          <span class="position-badge" [ngClass]="positionClass(r.position)">
                            <ng-container [ngSwitch]="r.position">
                              <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
                              <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
                              <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
                              <span *ngSwitchDefault>{{ r.position || '-' }}</span>
                            </ng-container>
                          </span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.rider' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div class="rider-info">
                            <div class="rider-number">#{{ r.rider.number }}</div>
                            <div class="rider-details">
                              <div class="rider-name">
                                <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
                                {{ r.rider.full_name }}
                              </div>
                              <div class="team-name">{{ r.team_name }}</div>
                            </div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="time">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.time' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.time" class="time-info">{{ r.time }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="gap">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.gap' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.gap" class="gap-info">
                            <div class="gap-first">+{{ r.gap.first }}</div>
                          </div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.points' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <div *ngIf="r.points" class="points-info">{{ r.points }}</div>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="status">
                        <th mat-header-cell *matHeaderCellDef>{{ 'motogp.results.status' | t }}</th>
                        <td mat-cell *matCellDef="let r">
                          <mat-chip [class]="getStatusClass(r.status)">
                            {{ getStatusText(r.status) }}
                          </mat-chip>
                        </td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="raceDisplayedColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: raceDisplayedColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-results-list">
                      <ng-container *ngFor="let r of results.sessions.RAC">
                        <ng-container *ngTemplateOutlet="mobileRaceCard; context: { $implicit: r }"></ng-container>
                      </ng-container>
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
              <i class="fa-solid fa-trophy no-results-icon"></i>
              <p>{{ 'motogp.results.noResults' | t }}</p>
            </mat-card-content>
          </mat-card>
        </div>
      </main>
    </div>

    <!-- ======= Mobile Card Templates ======= -->
    <ng-template #mobileQualiCard let-r let-sessionKey="sessionKey">
      <article class="mobile-result-card" [ngClass]="cardAccentClass(r.position)">
        <header class="mobile-card-header">
          <span class="pos-medal" [ngClass]="positionClass(r.position)">
            <ng-container [ngSwitch]="r.position">
              <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
              <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
              <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
              <span *ngSwitchDefault>{{ r.position || '-' }}</span>
            </ng-container>
          </span>

          <div class="rider-basic">
            <span class="num">#{{ r.rider.number }}</span>
            <div class="name-wrap">
              <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
              <span class="name">{{ r.rider.full_name }}</span>
            </div>
          </div>
        </header>

        <div class="team-row">
          <i class="fa-solid fa-helmet-safety"></i>
          <span class="team">{{ r.team_name }}</span>
        </div>

        <section class="stats-grid">
          <div class="stat-chip" *ngIf="r.best_lap">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="val">
              {{ r.best_lap.time }}
              <span class="fl-pill" *ngIf="isFastestLap(r, sessionKey)">FL</span>
            </span>
            <span class="sub">{{ 'motogp.results.lap' | t }} {{ r.best_lap.number }}</span>
          </div>

          <div class="stat-chip" *ngIf="r.gap?.first">
            <i class="fa-solid fa-arrows-left-right-to-line"></i>
            <span class="val">+{{ r.gap.first }}</span>
            <span class="sub">{{ 'motogp.results.gap' | t }}</span>
          </div>

          <div class="stat-chip" *ngIf="r.top_speed">
            <i class="fa-solid fa-gauge-high"></i>
            <span class="val">{{ r.top_speed }} km/h</span>
            <span class="sub">{{ 'motogp.results.topSpeed' | t }}</span>
          </div>
        </section>
      </article>
    </ng-template>

    <ng-template #mobileRaceCard let-r>
      <article class="mobile-result-card" [ngClass]="cardAccentClass(r.position)">
        <header class="mobile-card-header">
          <span class="pos-medal" [ngClass]="positionClass(r.position)">
            <ng-container [ngSwitch]="r.position">
              <i *ngSwitchCase="1" class="fa-solid fa-trophy"></i>
              <i *ngSwitchCase="2" class="fa-solid fa-medal"></i>
              <i *ngSwitchCase="3" class="fa-solid fa-medal"></i>
              <span *ngSwitchDefault>{{ r.position || '-' }}</span>
            </ng-container>
          </span>

          <div class="rider-basic">
            <span class="num">#{{ r.rider.number }}</span>
            <div class="name-wrap">
              <span class="flag" *ngIf="r.rider.country?.iso">{{ countryFlag(r.rider.country.iso) }}</span>
              <span class="name">{{ r.rider.full_name }}</span>
            </div>
          </div>
        </header>

        <div class="team-row">
          <i class="fa-solid fa-helmet-safety"></i>
          <span class="team">{{ r.team_name }}</span>
        </div>

        <section class="stats-grid">
          <div class="stat-chip" *ngIf="r.time">
            <i class="fa-solid fa-clock"></i>
            <span class="val">{{ r.time }}</span>
            <span class="sub">{{ 'motogp.results.time' | t }}</span>
          </div>

          <div class="stat-chip" *ngIf="r.gap?.first">
            <i class="fa-solid fa-arrows-left-right-to-line"></i>
            <span class="val">+{{ r.gap.first }}</span>
            <span class="sub">{{ 'motogp.results.gap' | t }}</span>
          </div>

          <div class="stat-chip" *ngIf="r.points != null">
            <i class="fa-solid fa-star"></i>
            <span class="val">{{ r.points }}</span>
            <span class="sub">{{ 'motogp.results.points' | t }}</span>
          </div>

          <div class="stat-chip status-chip">
            <i class="fa-solid fa-info-circle"></i>
            <mat-chip [class]="getStatusClass(r.status)">
              {{ getStatusText(r.status) }}
            </mat-chip>
            <span class="sub">{{ 'motogp.results.status' | t }}</span>
          </div>
        </section>
      </article>
    </ng-template>
  `,
  styles: [`
    .page-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff;
      padding: 20px;
    }

    .header {
      position: fixed; top: 0; left: 0; width: 100%; height: 60px;
      display: flex; align-items: center;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      color: #fff; z-index: 1000; padding: 0 20px;
    }
    .header button i { font-size: 1.1rem; color: #fff; }
    .header h1 { flex: 1; text-align: center; margin: 0; font-size: 24px; font-family: 'MotoGP Bold', sans-serif; }

    .main-content {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 0 0 0; max-width: 1200px; margin: 0 auto; width: 100%;
    }

    .loading-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 4rem; color: #fff; }
    .results-container { width: 100%; display: flex; flex-direction: column; gap: 2rem; }

    .event-info-card, .admin-actions-card, .results-card {
      background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1); color: var(--text-dark);
      border-left: 4px solid var(--accent-red);
    }
    .card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff; padding: 1.25rem; display: flex; align-items: center; gap: .75rem;
      font-family: 'MotoGP Bold', sans-serif; font-size: 1.15rem;
    }
    .event-meta-chips { display: flex; gap: .5rem; padding: .9rem 1rem 1rem; flex-wrap: wrap; }
    .event-meta-chips .meta-chip {
      display: inline-flex; align-items: center; gap: .5rem; padding: .35rem .6rem;
      border-radius: 999px; font-weight: 700; font-size: .9rem; border: 1px solid #e9ecef; background: #fff; color: #333;
    }
    .event-meta-chips .meta-chip.year { border-left: 4px solid #1976d2; }
    .event-meta-chips .meta-chip.code { border-left: 4px solid #d32f2f; }

    .admin-actions-card mat-card-content { padding: 1.5rem; }
    .admin-actions-card .admin-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
    .admin-actions-card .admin-buttons button { display: flex; align-items: center; gap: .5rem; padding: .75rem 1.5rem; font-weight: 500; border-radius: 8px; transition: all .3s ease; }

    .results-tabs ::ng-deep .mat-mdc-tab-labels { background: #fafafa; }
    .results-tabs ::ng-deep .mat-mdc-tab-label { color: var(--primary-color); font-family: 'MotoGP Bold', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
    .results-tabs ::ng-deep .mdc-tab--active .mdc-tab__text-label { color: var(--primary-color) !important; }
    .results-tabs ::ng-deep .mat-mdc-ink-bar { background: var(--primary-color); height: 3px; }

    .session-results { padding: 1.5rem; }

    .result-table { width: 100%; border-radius: 10px; overflow: hidden; }
    .result-table ::ng-deep .mat-mdc-header-row { position: sticky; top: 0; z-index: 1; background: #f8f9fa; }
    .result-table ::ng-deep .mat-mdc-header-cell { color: #333; font-weight: 800; padding: .9rem 1rem; }
    .result-table ::ng-deep .mat-mdc-cell { padding: .9rem 1rem; vertical-align: middle; }
    .result-table ::ng-deep .mat-mdc-row:nth-child(even) { background: #fbfbfb; }
    .result-table ::ng-deep .mat-mdc-row:hover { background: rgba(0,0,0,.03); }

    .rider-info { display: flex; align-items: center; gap: .75rem; }
    .rider-number { background: var(--primary-color); color: #fff; padding: .2rem .5rem; border-radius: 6px; font-weight: 800; min-width: 2rem; text-align: center; font-size: .9rem; }
    .rider-details .rider-name { font-weight: 800; color: #222; display: flex; align-items: center; gap: .4rem; }
    .rider-details .team-name { font-size: .85rem; color: #666; }
    .flag { font-size: 1rem; line-height: 1; }

    .position-badge {
      display: inline-grid; place-items: center; min-width: 2rem; min-height: 2rem; padding: .35rem .55rem;
      border-radius: 999px; font-weight: 900; color: #fff; background: #9e9e9e;
    }
    .position-badge.gold   { background: #FFD700; color: #7a5f00; }
    .position-badge.silver { background: #C0C0C0; color: #484848; }
    .position-badge.bronze { background: #CD7F32; color: #5a2d00; }

    .lap-info, .gap-info, .time-info, .points-info, .speed-info { display: flex; flex-direction: column; gap: .25rem; }
    .lap-time, .time-info { font-weight: 800; color: var(--primary-color); font-family: 'Courier New', monospace; font-size: 1rem; }
    .lap-time.fastest { color: #6a1b9a; }
    .fl-pill { display: inline-flex; align-items: center; justify-content: center; margin-left: .4rem; font-size: .7rem; font-weight: 900; background: #f3e5f5; color: #6a1b9a; border: 1px solid #e1bee7; padding: .05rem .35rem; border-radius: 6px; }
    .lap-number { font-size: .8rem; color: #666; }
    .gap-first { font-weight: 600; color: var(--text-dark); font-size: 1rem; }
    .gap-prev { font-size: .8rem; color: #666; }
    .points-info { font-weight: 600; color: var(--primary-color); font-size: 1.1rem; }
    .speed-info { font-weight: 600; color: var(--text-dark); font-size: 1rem; }

    .status-completed { background: #2e7d32 !important; color: #fff !important; }
    .status-dnf { background: #c62828 !important; color: #fff !important; }
    .status-dns { background: #ef6c00 !important; color: #fff !important; }

    /* ======= MOBILE CARD UPGRADE ======= */
    .mobile-results-list { display: flex; flex-direction: column; gap: 12px; }

    .mobile-result-card {
      --accent: #e0e0e0;
      position: relative;
      background: #fff;
      border: 1px solid #eceff1;
      border-radius: 14px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,.06);
      overflow: hidden;
      transition: transform .2s ease, box-shadow .2s ease;
    }
    .mobile-result-card::before {
      content: '';
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 5px;
      background: var(--accent);
    }
    .mobile-result-card:active { transform: scale(.98); box-shadow: 0 2px 8px rgba(0,0,0,.08); }

    /* Accent by position */
    .mobile-result-card.pos-1 { --accent: linear-gradient(180deg,#ffd700,#ffb300); }
    .mobile-result-card.pos-2 { --accent: linear-gradient(180deg,#c0c0c0,#9e9e9e); }
    .mobile-result-card.pos-3 { --accent: linear-gradient(180deg,#cd7f32,#b76e2a); }
    .mobile-result-card.pos-rest { --accent: linear-gradient(180deg,#d32f2f,#b71c1c); }

    .mobile-card-header {
      display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #eceff1;
    }
    .pos-medal {
      width: 36px; height: 36px; border-radius: 50%;
      display: grid; place-items: center; font-weight: 900; color: #fff; background: #9e9e9e; flex-shrink: 0;
    }
    .pos-medal.gold   { background: #ffd700; color: #7a5f00; }
    .pos-medal.silver { background: #c0c0c0; color: #484848; }
    .pos-medal.bronze { background: #cd7f32; color: #5a2d00; }

    .rider-basic { display: flex; align-items: center; gap: 8px; min-width: 0; }
    .rider-basic .num {
      display: inline-block; min-width: 30px; text-align: center;
      padding: 2px 8px; border-radius: 999px;
      background: var(--primary-color); color: #fff; font-weight: 800; font-size: .9rem;
    }
    .rider-basic .name-wrap { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .rider-basic .name { font-weight: 800; color: #222; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
    .rider-basic .flag { font-size: 1rem; }

    .team-row { display: flex; align-items: center; gap: 8px; color: #666; font-weight: 600; font-size: .9rem; margin-bottom: 10px; }
    .team-row i { color: #d32f2f; }

    .stats-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0,1fr));
      gap: 8px;
    }
    .stat-chip {
      border: 1px solid #e9ecef; background: #fafafa; border-radius: 10px;
      padding: 8px; display: grid; grid-template-columns: 20px 1fr; grid-template-rows: auto auto; column-gap: 8px;
      align-items: center;
    }
    .stat-chip i { grid-row: 1 / span 2; font-size: 16px; color: #d32f2f; }
    .stat-chip .val { font-weight: 800; color: #222; }
    .stat-chip .sub { font-size: .75rem; color: #667; }

    .stat-chip.status-chip { grid-template-columns: 20px auto; }
    .status-chip mat-chip { height: 24px; line-height: 24px; font-size: .8rem; }

    .no-results { text-align: center; padding: 4rem 2rem; }
    .no-results-card { background: #fff; border-radius: 18px; padding: 3rem; color: var(--text-dark); text-align: center; }
    .no-results-icon { font-size: 4rem; color: #ccc; margin-bottom: 1rem; }

    .mat-mdc-card { transition: all .3s cubic-bezier(.4,0,.2,1); }
    .mat-mdc-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.18); }

    /* Responsive */
    @media (max-width: 768px) {
      .page-container { padding: 10px; }
      .header { padding: 0 10px; }
      .header h1 { font-size: 20px; }
      .main-content { padding: 70px 0 0 0; }
      .results-container { gap: 1rem; }
      .session-results { padding: 1rem; }
      .card-header { padding: 1rem; font-size: 1rem; }
      .no-results-icon { font-size: 3.2rem; }
    }

    @media (max-width: 480px) {
      .page-container { padding: 5px; }
      .header { padding: 0 5px; }
      .main-content { padding: 65px 0 0 0; }
      .session-results { padding: .75rem; }
      .mobile-result-card { padding: 10px; }
      .stats-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
      .stat-chip { padding: 6px; }
    }
  `]
})
export class MotoGPResultsComponent implements OnInit {
  results: MotoGPResultsData | null = null;
  loading = true;
  championshipId = 0;
  calendarId = 0;
  isMobile = false;

  q1DisplayedColumns = ['position', 'rider', 'bestLap', 'gap', 'topSpeed'];
  q2DisplayedColumns = ['position', 'rider', 'bestLap', 'gap', 'topSpeed'];
  sprintDisplayedColumns = ['position', 'rider', 'time', 'gap', 'points', 'status'];
  raceDisplayedColumns = ['position', 'rider', 'time', 'gap', 'points', 'status'];

  private fastestLapMs: Record<'Q1'|'Q2'|'SPR'|'RAC', number | null> = { Q1: null, Q2: null, SPR: null, RAC: null };

  constructor(
    private dashboardService: DashboardService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationServiceService
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() { this.checkScreenSize(); }

  private checkScreenSize() { this.isMobile = window.innerWidth <= 768; }

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
        this.computeFastest(this.results.sessions.Q1, 'Q1');
        this.computeFastest(this.results.sessions.Q2, 'Q2');
        this.computeFastest(this.results.sessions.SPR, 'SPR');
        this.computeFastest(this.results.sessions.RAC, 'RAC');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading MotoGP results:', error);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    const prevNavUrl = this.router.lastSuccessfulNavigation?.previousNavigation?.initialUrl;
    if (prevNavUrl) this.router.navigateByUrl(prevNavUrl);
    else this.router.navigate(['/calendar']);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'INSTND': return 'status-completed';
      case 'OUTSTND': return 'status-dnf';
      case 'NOTFINISHFIRST': return 'status-dns';
      default: return '';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'INSTND': return 'Finished';
      case 'OUTSTND': return 'DNF';
      case 'NOTFINISHFIRST': return 'DNS';
      default: return status;
    }
  }

  isAdmin(): boolean { return this.authService.isCurrentUserAdmin(); }

  updateStandings(): void {
    this.notificationService.showSuccess('motogp.results.updateStandings');
    this.dashboardService.updateStandings(this.championshipId, this.calendarId).subscribe({
      next: () => this.notificationService.showSuccess('motogp.results.updateStandingsSuccess'),
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
        this.loadResults();
      },
      error: (err: any) => {
        console.error('Error fetching MotoGP results:', err);
        this.notificationService.showError('motogp.results.fetchMotoGPResultsFail');
      }
    });
  }

  // ===== Helpers =====
  private toMs(lapTime?: string): number | null {
    if (!lapTime) return null;
    const parts = lapTime.split(':');
    let ms = 0;
    if (parts.length === 2) {
      const [m, s] = parts;
      ms += (+m) * 60000;
      ms += Math.round(parseFloat(s) * 1000);
    } else {
      ms += Math.round(parseFloat(parts[0]) * 1000);
    }
    return Number.isFinite(ms) ? ms : null;
  }

  private computeFastest(session: MotoGPResult[] | undefined, key: 'Q1'|'Q2'|'SPR'|'RAC') {
    if (!session?.length) { this.fastestLapMs[key] = null; return; }
    let best: number | null = null;
    for (const r of session) {
      const t = this.toMs(r.best_lap?.time);
      if (t == null) continue;
      if (best == null || t < best) best = t;
    }
    this.fastestLapMs[key] = best;
  }

  isFastestLap(r: MotoGPResult, key: 'Q1'|'Q2'|'SPR'|'RAC'): boolean {
    const ref = this.fastestLapMs[key];
    const t = this.toMs(r.best_lap?.time);
    return ref != null && t != null && t === ref;
  }

  countryFlag(iso?: string): string {
    if (!iso || iso.length !== 2) return '';
    const cc = iso.toUpperCase();
    const base = 0x1F1E6;
    return String.fromCodePoint(base + (cc.charCodeAt(0) - 65), base + (cc.charCodeAt(1) - 65));
  }

  positionClass(pos?: number): 'gold'|'silver'|'bronze'|'' {
    if (pos === 1) return 'gold';
    if (pos === 2) return 'silver';
    if (pos === 3) return 'bronze';
    return '';
  }

  cardAccentClass(pos?: number): 'pos-1'|'pos-2'|'pos-3'|'pos-rest' {
    if (pos === 1) return 'pos-1';
    if (pos === 2) return 'pos-2';
    if (pos === 3) return 'pos-3';
    return 'pos-rest';
  }
}
