import { Component, OnInit, HostListener, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DashboardService, StandingsCalculationResponse } from '../../services/dashboard.service';
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
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTabsModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
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
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <h1>{{ 'motogp.results.title' | t }}</h1>
      </header>

      <main class="main-content" @cardAnimation>
        <div *ngIf="loading" class="ux-state loading-container">
          <div class="ux-state-card">
            <mat-spinner diameter="34"></mat-spinner>
            <p>{{ 'common.loading' | t }}</p>
          </div>
        </div>

        <div *ngIf="!loading && results" class="results-container">
          <!-- Event Info Card -->
          <mat-card class="event-info-card">
            <div class="card-header">
              <i class="fa-solid fa-calendar-check"></i>
              <span>{{ 'motogp.results.eventInfo' | t }}</span>
            </div>
            <div class="results-overview">
              <div class="results-overview-main">
                <span class="results-kicker">MotoGP</span>
                <h2 class="results-title">{{ results.meta.eventCode }}</h2>
                <div class="results-meta-inline">
                  <span class="meta-pill">
                    <i class="fa-solid fa-calendar"></i>
                    <span class="meta-label">Year</span>
                    <span class="meta-value">{{ results.meta.year }}</span>
                  </span>
                  <span class="meta-pill">
                    <i class="fa-solid fa-hashtag"></i>
                    <span class="meta-label">Calendar</span>
                    <span class="meta-value">#{{ results.meta.calendarId }}</span>
                  </span>
                </div>
              </div>

              <div class="results-session-strip">
                <span class="session-pill" *ngIf="results.sessions.Q1">{{ 'motogp.results.qualifying1' | t }}</span>
                <span class="session-pill" *ngIf="results.sessions.Q2">{{ 'motogp.results.qualifying2' | t }}</span>
                <span class="session-pill" *ngIf="results.sessions.SPR">{{ 'motogp.results.sprint' | t }}</span>
                <span class="session-pill" *ngIf="results.sessions.RAC">{{ 'motogp.results.race' | t }}</span>
              </div>
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
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                          {{ 'motogp.results.rider' | t }}
                        </th>
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
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                          {{ 'motogp.results.rider' | t }}
                        </th>
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
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                          {{ 'motogp.results.rider' | t }}
                        </th>
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
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                          {{ 'motogp.results.rider' | t }}
                        </th>
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

        <div *ngIf="!loading && !results" class="ux-state no-results">
          <div class="ux-state-card no-results-card">
            <i class="fa-solid fa-trophy no-results-icon ux-state-icon"></i>
            <p>{{ 'motogp.results.noResults' | t }}</p>
          </div>
        </div>
      </main>
    </div>

    <!-- ======= Mobile Card Templates ======= -->
    <ng-template #mobileQualiCard let-r let-sessionKey="sessionKey">
      <article class="mobile-entry-result" [ngClass]="cardAccentClass(r.position)">
        <header class="entry-head">
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

        <section class="entry-body">
          <div class="kv-row">
            <span class="kv-key">
              <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
              {{ 'motogp.results.rider' | t }}
            </span>
            <span class="kv-value">{{ r.team_name }}</span>
          </div>

          <div class="entry-meta">
            <span class="meta-tag" *ngIf="r.best_lap">
              <i class="fa-solid fa-stopwatch"></i>
              {{ r.best_lap.time }}
              <strong *ngIf="isFastestLap(r, sessionKey)">FL</strong>
            </span>
            <span class="meta-tag" *ngIf="r.gap?.first">
              <i class="fa-solid fa-arrows-left-right-to-line"></i>
              +{{ r.gap.first }}
            </span>
            <span class="meta-tag" *ngIf="r.top_speed">
              <i class="fa-solid fa-gauge-high"></i>
              {{ r.top_speed }} km/h
            </span>
          </div>
        </section>
      </article>
    </ng-template>

    <ng-template #mobileRaceCard let-r>
      <article class="mobile-entry-result" [ngClass]="cardAccentClass(r.position)">
        <header class="entry-head">
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

        <section class="entry-body">
          <div class="kv-row">
            <span class="kv-key">
              <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
              {{ 'motogp.results.rider' | t }}
            </span>
            <span class="kv-value">{{ r.team_name }}</span>
          </div>

          <div class="entry-meta">
            <span class="meta-tag" *ngIf="r.time">
              <i class="fa-solid fa-clock"></i>
              {{ r.time }}
            </span>
            <span class="meta-tag" *ngIf="r.gap?.first">
              <i class="fa-solid fa-arrows-left-right-to-line"></i>
              +{{ r.gap.first }}
            </span>
            <span class="meta-tag points" *ngIf="r.points != null">
              <i class="fa-solid fa-star"></i>
              {{ r.points }} pts
            </span>
            <span class="meta-tag result" [class]="getStatusClass(r.status)">
              {{ getStatusText(r.status) }}
            </span>
          </div>
        </section>
      </article>
    </ng-template>
  `,
  styleUrl: './motogp-results.component.scss'
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
    this.notificationService.showSuccess('motogp.results.fetchMotoGPResults');
    this.dashboardService.fetchMotoGPResults(this.championshipId, this.calendarId, true).subscribe({
      next: () => {
        this.notificationService.showSuccess('motogp.results.fetchMotoGPResultsSuccess');
        this.notificationService.showSuccess('motogp.results.updateStandings');

        this.dashboardService.updateStandings(this.championshipId, this.calendarId).subscribe({
          next: (response: StandingsCalculationResponse) => {
            this.notificationService.showSuccess('motogp.results.updateStandingsSuccess');
            if (response?.meta?.message) {
              this.notificationService.showSuccessMessage(response.meta.message, response.meta.partial ? 6500 : 5000);
            }
            this.loadResults();
          },
          error: (err: any) => {
            console.error('Error updating standings:', err);
            this.notificationService.showError('motogp.results.updateStandingsFail');
          }
        });
      },
      error: (err: any) => {
        console.error('Error fetching MotoGP results before standings update:', err);
        this.notificationService.showError('motogp.results.fetchMotoGPResultsFail');
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
