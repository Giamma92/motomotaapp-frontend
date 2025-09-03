// src/app/race-detail/race-detail.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { BetResult, LineupsResult, RaceDetailService } from '../../services/race-detail.service';
import { CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-race-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query('.info-card, .results-card', [
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
        <h1>{{ 'raceDetail.title' | t }}</h1>
      </header>

      <main class="main-content" @cardAnimation>
        <!-- Loading -->
        <div *ngIf="loading" class="loading-container">
          <mat-spinner></mat-spinner>
          <p>{{ 'common.loading' | t }}</p>
        </div>

        <!-- Content -->
        <div *ngIf="!loading" class="results-container">
          <!-- Info Card -->
          <mat-card class="info-card card-accent-blue" *ngIf="calendarRace">
            <div class="card-header">
              <i class="fa-solid fa-circle-info"></i>
              <span>{{ 'raceDetail.info.title' | t }}</span>
            </div>
            <div class="event-meta-chips">
              <span class="meta-chip chip-accent-red">
                <i class="fa-solid fa-flag-checkered"></i>
                <span class="chip-body">
                  <span class="val">{{ raceName || ('common.na' | t) }}</span>
                  <span class="sub">{{ 'raceDetail.info.raceName' | t }}</span>
                </span>
              </span>

              <span class="meta-chip chip-accent-blue">
                <i class="fa-solid fa-calendar-day"></i>
                <span class="chip-body">
                  <span class="val">{{ calendarRace.event_date | date:'MMM d, y' }}</span>
                  <span class="sub">{{ 'raceDetail.info.date' | t }}</span>
                </span>
              </span>

              <span class="meta-chip chip-accent-blue" *ngIf="calendarRace.event_time">
                <i class="fa-solid fa-clock"></i>
                <span class="chip-body">
                  <span class="val">{{ calendarRace.event_time }}</span>
                  <span class="sub">{{ 'raceDetail.info.raceTime' | t }}</span>
                </span>
              </span>

              <span class="meta-chip chip-accent-orange" *ngIf="calendarRace.qualifications_time">
                <i class="fa-solid fa-stopwatch"></i>
                <span class="chip-body">
                  <span class="val">{{ calendarRace.qualifications_time }}</span>
                  <span class="sub">{{ 'raceDetail.info.qualiTime' | t }}</span>
                </span>
              </span>

              <span class="meta-chip chip-accent-orange" *ngIf="calendarRace.sprint_time">
                <i class="fa-solid fa-gauge-high"></i>
                <span class="chip-body">
                  <span class="val">{{ calendarRace.sprint_time }}</span>
                  <span class="sub">{{ 'raceDetail.info.sprintTime' | t }}</span>
                </span>
              </span>
            </div>
          </mat-card>

          <!-- Results/Tabs -->
          <mat-card class="results-card">
            <mat-tab-group class="results-tabs">
              <!-- Lineups Tab -->
              <mat-tab *ngIf="showLineups" label="{{ 'raceDetail.lineups.tab' | t }}">
                <div class="session-results">
                  <!-- Desktop Table -->
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="lineups" class="result-table">
                      <ng-container matColumnDef="user">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.user' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ displayUser(e.user_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="qualifying_rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.qualifyingRider' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ getRiderDisplay(e.qualifying_rider_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="race_rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.raceRider' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ getRiderDisplay(e.race_rider_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="modified_at">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.modifiedAt' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ e.modified_at | date:'MM/dd HH:mm' }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="lineupColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: lineupColumns;"></tr>
                    </table>
                  </ng-container>

                  <!-- Mobile Cards -->
                  <ng-container *ngIf="isMobile">
                    <div class="mobile-list">
                      <article class="mobile-card card-accent-blue" *ngFor="let e of lineups; trackBy: trackByUser">
                        <header class="mobile-card-header">
                          <i class="fa-solid fa-user"></i>
                          <div class="title-wrap">
                            <span class="title">{{ displayUser(e.user_id) }}</span>
                            <span class="when">{{ e.modified_at | date:'MM/dd HH:mm' }}</span>
                          </div>
                        </header>

                        <section class="grid">
                          <div class="chip chip-accent-orange">
                            <i class="fa-solid fa-flag-checkered"></i>
                            <div class="chip-body">
                              <span class="val">{{ getRiderDisplay(e.qualifying_rider_id) }}</span>
                              <span class="sub">{{ 'raceDetail.table.qualifyingRider' | t }}</span>
                            </div>
                          </div>
                          <div class="chip chip-accent-red">
                            <i class="fa-solid fa-helmet-safety"></i>
                            <div class="chip-body">
                              <span class="val">{{ getRiderDisplay(e.race_rider_id) }}</span>
                              <span class="sub">{{ 'raceDetail.table.raceRider' | t }}</span>
                            </div>
                          </div>
                        </section>
                      </article>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>

              <!-- Sprint Tab -->
              <mat-tab *ngIf="showSprintBet" label="{{ 'raceDetail.sprint.tab' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="sprints" class="result-table">
                      <ng-container matColumnDef="user">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.user' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ displayUser(e.user_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.rider' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ displayRiderName(e.rider_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.position' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <span class="badge badge-neutral">{{ getPositionDisplay(e.position) }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.points' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <span class="badge points">{{ e.points }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="outcome">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.result' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <i [class]="resultIconClass(e.outcome, e.points)"></i>
                          <span class="outcome-text">&nbsp;{{ resultText(e.outcome) }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="modified_at">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.modifiedAt' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ e.modified_at | date:'MM/dd HH:mm' }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="sprintColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: sprintColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-list">
                      <article class="mobile-card card-accent-orange" *ngFor="let e of sprints; trackBy: trackByUser">
                        <header class="mobile-card-header">
                          <div class="title-wrap">
                            <span class="title">{{ displayUser(e.user_id) }}</span>
                            <span class="when">{{ e.modified_at | date:'MM/dd HH:mm' }}</span>
                          </div>
                        </header>

                        <section class="grid">
                          <!-- Rider -->
                          <div class="chip chip-accent-red">
                            <i class="fa-solid fa-helmet-safety"></i>
                            <div class="chip-body">
                              <span class="val">{{ displayRiderName(e.rider_id) }}</span>
                              <span class="sub">{{ 'raceDetail.table.rider' | t }}</span>
                            </div>
                          </div>

                          <!-- Points -->
                          <div class="chip chip-accent-blue">
                            <i class="fa-solid fa-star"></i>
                            <div class="chip-body">
                              <span class="val">{{ e.points }}</span>
                              <span class="sub">{{ 'raceDetail.table.points' | t }}</span>
                            </div>
                          </div>

                          <!-- Position next to points -->
                          <div class="chip chip-accent-blue">
                            <i class="fa-solid fa-list-ol"></i>
                            <div class="chip-body">
                              <span class="val">{{ getPositionDisplay(e.position) }}</span>
                              <span class="sub">{{ 'raceDetail.table.position' | t }}</span>
                            </div>
                          </div>

                          <!-- Result with icon -->
                          <div class="chip chip-accent-orange">
                            <i [class]="resultIconClass(e.outcome, e.points)"></i>
                            <div class="chip-body">
                              <span class="val">{{ resultText(e.outcome) }}</span>
                              <span class="sub">{{ 'raceDetail.table.result' | t }}</span>
                            </div>
                          </div>
                        </section>
                      </article>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>

              <!-- Race Tab -->
              <mat-tab *ngIf="showRaceBet" label="{{ 'raceDetail.race.tab' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="bets" class="result-table">
                      <ng-container matColumnDef="user">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.user' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ displayUser(e.user_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="rider">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.rider' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ displayRiderName(e.rider_id) }}</td>
                      </ng-container>

                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.position' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <span class="badge badge-neutral">{{ getPositionDisplay(e.position) }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.points' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <span class="badge points">{{ e.points }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="outcome">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.result' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <i [class]="resultIconClass(e.outcome, e.points)"></i>
                          <span class="outcome-text">&nbsp;{{ resultText(e.outcome) }}</span>
                        </td>
                      </ng-container>

                      <ng-container matColumnDef="modified_at">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.modifiedAt' | t }}</th>
                        <td mat-cell *matCellDef="let e">{{ e.modified_at | date:'MM/dd HH:mm' }}</td>
                      </ng-container>

                      <tr mat-header-row *matHeaderRowDef="betColumns"></tr>
                      <tr mat-row *matRowDef="let row; columns: betColumns;"></tr>
                    </table>
                  </ng-container>

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-list">
                      <article class="mobile-card card-accent-red" *ngFor="let e of bets; trackBy: trackByUser">
                        <header class="mobile-card-header">
                          <div class="title-wrap">
                            <span class="title">{{ displayUser(e.user_id) }}</span>
                            <span class="when">{{ e.modified_at | date:'MM/dd HH:mm' }}</span>
                          </div>
                        </header>

                        <section class="grid">
                          <!-- Rider -->
                          <div class="chip chip-accent-red">
                            <i class="fa-solid fa-helmet-safety"></i>
                            <div class="chip-body">
                              <span class="val">{{ displayRiderName(e.rider_id) }}</span>
                              <span class="sub">{{ 'raceDetail.table.rider' | t }}</span>
                            </div>
                          </div>

                          <!-- Points -->
                          <div class="chip chip-accent-blue">
                            <i class="fa-solid fa-star"></i>
                            <div class="chip-body">
                              <span class="val">{{ e.points }}</span>
                              <span class="sub">{{ 'raceDetail.table.points' | t }}</span>
                            </div>
                          </div>

                          <!-- Position next to points -->
                          <div class="chip chip-accent-blue">
                            <i class="fa-solid fa-list-ol"></i>
                            <div class="chip-body">
                              <span class="val">{{ getPositionDisplay(e.position) }}</span>
                              <span class="sub">{{ 'raceDetail.table.position' | t }}</span>
                            </div>
                          </div>

                          <!-- Result with icon -->
                          <div class="chip chip-accent-orange">
                            <i [class]="resultIconClass(e.outcome, e.points)"></i>
                            <div class="chip-body">
                              <span class="val">{{ resultText(e.outcome) }}</span>
                              <span class="sub">{{ 'raceDetail.table.result' | t }}</span>
                            </div>
                          </div>
                        </section>
                      </article>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card>

          <!-- Empty state -->
          <div *ngIf="!showLineups && !showSprintBet && !showRaceBet" class="no-results">
            <mat-card class="no-results-card">
              <mat-card-content>
                <i class="fa-regular fa-hourglass no-results-icon"></i>
                <p>{{ 'raceDetail.notStarted' | t }}</p>
              </mat-card-content>
            </mat-card>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    /* ===== Theme variables you can tweak ===== */
    :host {
      --accent-blue: #1976d2;
      --accent-orange: #ef6c00;
      --accent-red: #d32f2f;
    }

    /* Page & Header (match motogp-results) */
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

    /* Cards with left accent border */
    .info-card, .results-card, .mobile-card {
      background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.1); color: var(--text-dark);
      border-left: 6px solid rgba(0,0,0,.08);
    }
    .card-accent-blue  { border-left-color: var(--accent-blue); }
    .card-accent-orange{ border-left-color: var(--accent-orange); }
    .card-accent-red   { border-left-color: var(--accent-red); }

    .card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff; padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: .75rem;
      font-family: 'MotoGP Bold', sans-serif; font-size: 1.1rem;
    }

    /* Chips with LEFT BORDER color */
    .event-meta-chips { display: flex; gap: .6rem; padding: 1rem; flex-wrap: wrap; }
    .meta-chip {
      display: inline-grid; grid-template-columns: 20px auto; column-gap: .5rem; align-items: center;
      padding: .5rem .75rem; background: #fff; color: #333; border: 1px solid #eceff1; border-radius: 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,.03);
      position: relative;
    }
    .meta-chip::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; border-radius: 10px 0 0 10px; background: #e0e0e0;
    }
    .meta-chip i { color: #666; }
    .meta-chip .chip-body { display: grid; grid-auto-rows: auto; }
    .meta-chip .val { font-weight: 800; color: #222; line-height: 1.1; }
    .meta-chip .sub { margin-top: 2px; font-size: .75rem; color: #667; }

    .chip-accent-blue::before   { background: var(--accent-blue); }
    .chip-accent-orange::before { background: var(--accent-orange); }
    .chip-accent-red::before    { background: var(--accent-red); }

    /* Tabs (like motogp-results) */
    .results-tabs ::ng-deep .mat-mdc-tab-labels { background: #fafafa; }
    .results-tabs ::ng-deep .mat-mdc-tab-label { color: var(--primary-color); font-family: 'MotoGP Bold', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
    .results-tabs ::ng-deep .mdc-tab--active .mdc-tab__text-label { color: var(--primary-color) !important; }
    .results-tabs ::ng-deep .mat-mdc-ink-bar { background: var(--primary-color); height: 3px; }

    .session-results { padding: 1.25rem; }

    /* Tables */
    .result-table { width: 100%; border-radius: 10px; overflow: hidden; }
    .result-table ::ng-deep .mat-mdc-header-row { position: sticky; top: 0; z-index: 1; background: #f8f9fa; }
    .result-table ::ng-deep .mat-mdc-header-cell { color: #333; font-weight: 800; padding: .9rem 1rem; }
    .result-table ::ng-deep .mat-mdc-cell { padding: .9rem 1rem; vertical-align: middle; }
    .result-table ::ng-deep .mat-mdc-row:nth-child(even) { background: #fbfbfb; }
    .result-table ::ng-deep .mat-mdc-row:hover { background: rgba(0,0,0,.03); }

    /* Badges */
    .badge {
      display:inline-block; padding:.25rem .6rem; border-radius:.8rem; font-weight:800; color:#fff; font-size:.9rem;
      background: var(--primary-color);
    }
    .badge.points { background:#7b1fa2; }
    .badge.badge-neutral { background: #9e9e9e; color: #fff; }

    /* Outcome icons */
    .ok { color: #2e7d32; }
    .ko { color: #c62828; }
    .outcome-text { color: #333; font-weight: 600; }

    /* Mobile Cards & chips (with left border accent) */
    .mobile-list { display: flex; flex-direction: column; gap: 12px; }
    .mobile-card {
      border: 1px solid #eceff1;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,.06);
      background: #fff;
    }
    .mobile-card-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px dashed #eceff1; }
    .mobile-card-header .title-wrap { display: flex; flex-direction: column; gap: 2px; }
    .mobile-card-header .title { font-weight: 800; color: #222; }
    .mobile-card-header .when { font-size: .8rem; color: #667; }

    .grid { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 8px; }
    .chip {
      position: relative;
      border: 1px solid #e9ecef; background: #fafafa; border-radius: 10px;
      padding: 8px 8px 8px 12px; display: grid; grid-template-columns: 20px 1fr; column-gap: 8px; align-items: center;
    }
    .chip::before {
      content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 6px; border-radius: 10px 0 0 10px; background: #e0e0e0;
    }
    .chip i { color: #d32f2f; }
    .chip .chip-body { display: grid; grid-template-rows: auto auto; }
    .chip .val { font-weight: 800; color: #222; line-height: 1.2; }
    .chip .sub { margin-top: 2px; font-size: .75rem; color: #667; }

    .chip-accent-blue::before   { background: var(--accent-blue); }
    .chip-accent-orange::before { background: var(--accent-orange); }
    .chip-accent-red::before    { background: var(--accent-red); }

    /* Empty state */
    .no-results { text-align: center; padding: 4rem 2rem; }
    .no-results-card { background: #fff; border-radius: 18px; padding: 3rem; color: var(--text-dark); text-align: center; }
    .no-results-icon { font-size: 3.2rem; color: #ccc; margin-bottom: 1rem; }

    /* Hover lift */
    .mat-mdc-card { transition: all .3s cubic-bezier(.4,0,.2,1); }
    .mat-mdc-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.18); }

    /* Responsive */
    @media (max-width: 768px) {
      .page-container { padding: 10px; }
      .header { padding: 0 10px; }
      .header h1 { font-size: 20px; }
      .main-content { padding: 70px 0 0 0; }
      .results-container { gap: 1rem; }
      .card-header { padding: 1rem; font-size: 1rem; }
    }
    @media (max-width: 480px) {
      .page-container { padding: 5px; }
      .header { padding: 0 5px; }
      .main-content { padding: 65px 0 0 0; }
      .mobile-card { padding: 10px; }
      .grid { grid-template-columns: 1fr 1fr; gap: 6px; }
      .chip { padding: 6px 6px 6px 10px; }
    }
  `]
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  raceName: string = '';

  lineupColumns: string[] = ['user', 'qualifying_rider','race_rider', 'modified_at'];
  sprintColumns: string[] = ['user', 'rider', 'position', 'points', 'outcome', 'modified_at'];
  betColumns: string[] = ['user', 'rider', 'position', 'points', 'outcome', 'modified_at'];

  lineups: LineupsResult[] = [];
  sprints: BetResult[] = [];
  bets: BetResult[] = [];

  isMobile = false;
  calendarRace: CalendarRace | null = null;
  showLineups = false;
  showSprintBet = false;
  showRaceBet = false;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private raceScheduleService: RaceScheduleService
  ) { this.checkScreen(); }

  @HostListener('window:resize')
  onResize() { this.checkScreen(); }
  private checkScreen() { this.isMobile = window.innerWidth <= 768; }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (!champId || !this.raceId) { this.loading = false; return; }

      // Data
      this.raceDetailService.getRaceDetails(champId, this.raceId).subscribe({
        next: (data) => {
          this.lineups = data.lineups ?? [];
          this.sprints = data.sprints ?? [];
          this.bets = data.bets ?? [];
          this.loading = false;
        },
        error: (err) => { console.error('Error fetching race details:', err); this.loading = false; }
      });

      // Schedule logic + race name
      this.raceDetailService.getCalendarRace(champId, this.raceId).subscribe({
        next: (race) => {
          this.calendarRace = race;
          this.raceName = race?.race_id?.name ?? '';

          const now = new Date();
          const raceDate = new Date(race.event_date);
          const dayBeforeRace = new Date(raceDate);
          dayBeforeRace.setDate(dayBeforeRace.getDate() - 1);

          if (now > raceDate) {
            this.showLineups = this.showSprintBet = this.showRaceBet = true;
          } else if (now >= dayBeforeRace) {
            const dayISO = dayBeforeRace.toISOString().split('T')[0];

            const qualifyingTime = new Date(`${dayISO}T${race.qualifications_time || '14:00:00'}`);
            this.showLineups = now > qualifyingTime;

            const sprintTime = new Date(`${dayISO}T${race.sprint_time || '14:00:00'}`);
            this.showSprintBet = now > sprintTime;

            const isRaceDay = now.toDateString() === raceDate.toDateString();
            const eventTime = new Date(`${race.event_date}T${race.event_time || '14:00:00'}`);
            this.showRaceBet = isRaceDay && now > eventTime;
          } else {
            this.showLineups = this.raceScheduleService.canShowLineups(race);
            this.showSprintBet = this.raceScheduleService.canShowSprintBet(race);
            this.showRaceBet = this.raceScheduleService.canShowRaceBet(race);
          }
        },
        error: (err) => console.error('Error fetching race info:', err)
      });
    });
  }

  goBack(): void {
    const prevNavUrl = this.router.lastSuccessfulNavigation?.previousNavigation?.initialUrl;
    if (prevNavUrl) this.router.navigateByUrl(prevNavUrl);
    else this.router.navigate(['/calendar']);
  }

  // ===== Display helpers =====
  displayUser(user: any): string {
    if (!user) return 'Unknown User';
    const first = user.first_name || '';
    const last = user.last_name || '';
    const fallback = user.username || user.email || '';
    const name = `${first} ${last}`.trim();
    return name || fallback || 'Unknown User';
  }

  displayRiderName(r: any): string {
    if (!r) return 'N/A';
    return `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'N/A';
  }

  getRiderDisplay(rider: any): string {
    if (!rider) return 'N/A';
    const name = `${rider.first_name || ''} ${rider.last_name || ''}`.trim();
    const num = rider.number ? ` #${rider.number}` : '';
    return (name + num).trim() || 'N/A';
  }

  /** Always "position / position+1" */
  getPositionDisplay(position: number | undefined | null): string {
    if (typeof position !== 'number' || isNaN(position)) return '—';
    return `${position} / ${position + 1}`;
  }

  // Result icon ✓ / ✗ + label
  resultIconClass(outcome: any, points?: number): string {
    const ok = this.isResultPositive(outcome, points);
    return ok ? 'fa-solid fa-circle-check ok' : 'fa-solid fa-circle-xmark ko';
  }
  resultText(outcome: any): string {
    if (outcome == null) return '—';
    const s = String(outcome).trim();
    if (!s) return '—';
    return s;
  }
  private isResultPositive(outcome: any, points?: number): boolean {
    const s = (outcome ?? '').toString().toLowerCase();
    const positives = ['ok','true','win','won','hit','success','correct','yes','✓','✔','instnd','finished','complete'];
    const negatives = ['false','loss','lost','miss','fail','wrong','no','✗','✕','x','outstnd','dns','dnf','cancelled','canceled'];
    if (positives.some(p => s.includes(p))) return true;
    if (negatives.some(n => s.includes(n))) return false;
    return typeof points === 'number' ? points > 0 : false;
  }

  trackByUser = (_: number, item: { user_id: any }) =>
    item?.user_id?.id ?? item?.user_id?.email ?? _;
}
