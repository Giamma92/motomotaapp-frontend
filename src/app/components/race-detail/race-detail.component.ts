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
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

import { BetResult, LineupsResult, RaceDetailService } from '../../services/race-detail.service';
import { CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';

import { AuthService } from '../../services/auth.service';
import { NotificationServiceService } from '../../services/notification.service';

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
    MatIconModule,
    FormsModule,
    TranslatePipe
  ],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query('.info-card, .results-card, .admin-card', [
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
        <div *ngIf="loading" class="ux-state loading-container">
          <div class="ux-state-card">
            <mat-spinner diameter="34"></mat-spinner>
            <p>{{ 'common.loading' | t }}</p>
          </div>
        </div>

        <div *ngIf="!loading" class="results-container">
          <!-- Info Card -->
          <mat-card class="info-card card-accent-blue" *ngIf="calendarRace">
            <div class="card-header">
              <i class="fa-solid fa-circle-info"></i>
              <span>{{ 'raceDetail.info.title' | t }}</span>
            </div>
            <div class="race-overview">
              <div class="race-overview-main">
                <div class="race-kicker">{{ 'raceDetail.info.raceName' | t }}</div>
                <h2 class="race-title">{{ raceName || ('common.na' | t) }}</h2>
                <div class="race-date-row">
                  <i class="fa-solid fa-calendar-day"></i>
                  <span>{{ calendarRace.event_date | date:'EEE d MMM y' }}</span>
                </div>
              </div>

              <div class="race-times-grid">
                <div class="race-time-item" *ngIf="calendarRace.qualifications_time">
                  <span class="race-time-label">{{ 'raceDetail.info.qualiTime' | t }}</span>
                  <span class="race-time-value">{{ calendarRace.qualifications_time }}</span>
                </div>

                <div class="race-time-item" *ngIf="calendarRace.sprint_time">
                  <span class="race-time-label">{{ 'raceDetail.info.sprintTime' | t }}</span>
                  <span class="race-time-value">{{ calendarRace.sprint_time }}</span>
                </div>

                <div class="race-time-item race-time-item-primary" *ngIf="calendarRace.event_time">
                  <span class="race-time-label">{{ 'raceDetail.info.raceTime' | t }}</span>
                  <span class="race-time-value">{{ calendarRace.event_time }}</span>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Admin Actions (REPLACE the whole previous admin-card) -->
          <mat-card class="admin-card card-accent-red" *ngIf="isAdmin()">
            <div class="card-header">
              <i class="fa-solid fa-shield-halved"></i>
              <span>{{ 'admin.actions.title' | t }}</span>
            </div>

            <mat-card-content>
              <!-- Fill Missing Lineups -->
              <div class="admin-actions-row">
                <!--<span class="action-label">
                  <i class="fa-solid fa-people-group"></i>
                  {{ 'admin.actions.fillMissingLineups' | t }}
                </span>-->
                <button mat-raised-button color="primary" (click)="onFillMissingLineups()" [disabled]="busy">
                  <i class="fa-solid fa-wand-magic-sparkles"></i>
                  {{ 'admin.actions.fillNow' | t }}
                </button>
              </div>

              <!-- Sprint bets -->
              <!--<div class="admin-actions-row">
                <span class="action-label">
                  <i class="fa-solid fa-gauge-high"></i>
                  {{ 'admin.actions.setSprintOutcome' | t }}
                </span>
                <div class="inline-controls">
                  <label class="select-all">
                    <input type="checkbox" [checked]="isAllSprintSelected()" (change)="toggleAllSprint($any($event.target).checked ?? false)" />
                    {{ 'common.selectAll' | t }}
                  </label>
                  <select [(ngModel)]="sprintOutcome" class="native-select">
                    <option [ngValue]="true">{{ 'common.true' | t }}</option>
                    <option [ngValue]="false">{{ 'common.false' | t }}</option>
                  </select>
                  <button mat-raised-button color="accent"
                          (click)="onSetOutcomeSelected('SPR', sprintOutcome)"
                          [disabled]="busy || selectedSprintIds.size===0">
                    <i class="fa-solid fa-check-double"></i>
                    {{ 'admin.actions.apply' | t }}
                  </button>
                </div>
              </div>-->

              <!--<div class="bet-picklist">
                <label class="bet-row" *ngFor="let b of sprints; trackBy: trackByBet">
                  <input type="checkbox"
                        [checked]="selectedSprintIds.has(b.id)"
                        (change)="toggleSprint(b.id, $any($event.target).checked ?? false)" />
                  <span class="bet-user">{{ displayUser(b.user_id) }}</span>
                  <span class="bet-rider">· {{ displayRiderName(b.rider_id) }}</span>
                  <span class="bet-pos">· {{ getPositionDisplay(b.position) }}</span>
                  <span class="bet-outcome">
                    <i [class]="resultIconClass(b.outcome, b.points)"></i>
                  </span>
                </label>
              </div>-->

              <!-- Race bets -->
              <!--<div class="admin-actions-row">
                <span class="action-label">
                  <i class="fa-solid fa-flag-checkered"></i>
                  {{ 'admin.actions.setRaceOutcome' | t }}
                </span>
                <div class="inline-controls">
                  <label class="select-all">
                    <input type="checkbox" [checked]="isAllRaceSelected()" (change)="toggleAllRace($any($event.target).checked ?? false)" />
                    {{ 'common.selectAll' | t }}
                  </label>
                  <select [(ngModel)]="raceOutcome" class="native-select">
                    <option [ngValue]="true">{{ 'common.true' | t }}</option>
                    <option [ngValue]="false">{{ 'common.false' | t }}</option>
                  </select>
                  <button mat-raised-button color="accent"
                          (click)="onSetOutcomeSelected('RAC', raceOutcome)"
                          [disabled]="busy || selectedRaceIds.size===0">
                    <i class="fa-solid fa-check-double"></i>
                    {{ 'admin.actions.apply' | t }}
                  </button>
                </div>
              </div>  -->

              <!--<div class="bet-picklist">
                <label class="bet-row" *ngFor="let b of bets; trackBy: trackByBet">
                  <input type="checkbox"
                        [checked]="selectedRaceIds.has(b.id)"
                        (change)="toggleRace(b.id, $any($event.target).checked ?? false)" />
                  <span class="bet-user">{{ displayUser(b.user_id) }}</span>
                  <span class="bet-rider">· {{ displayRiderName(b.rider_id) }}</span>
                  <span class="bet-pos">· {{ getPositionDisplay(b.position) }}</span>
                  <span class="bet-outcome">
                    <i [class]="resultIconClass(b.outcome, b.points)"></i>
                  </span>
                </label>
              </div>-->
            </mat-card-content>
          </mat-card>

          <!-- Tabs & Tables -->
          <mat-card class="results-card">
            <mat-tab-group class="results-tabs">
              <!-- Lineups Tab -->
              <mat-tab *ngIf="showLineups" label="{{ 'raceDetail.lineups.tab' | t }}">
                <div class="session-results">
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

                  <ng-container *ngIf="isMobile">
                    <div class="mobile-list">
                      <article class="mobile-entry" *ngFor="let e of lineups; trackBy: trackByUser">
                        <header class="entry-head">
                          <span class="entry-user">{{ displayUser(e.user_id) }}</span>
                          <span class="entry-when">{{ e.modified_at | date:'MM/dd HH:mm' }}</span>
                        </header>
                        <section class="entry-body">
                          <div class="kv-row">
                            <span class="kv-key"><i class="fa-solid fa-flag-checkered"></i>{{ 'raceDetail.table.qualifyingRider' | t }}</span>
                            <span class="kv-value">{{ getRiderDisplay(e.qualifying_rider_id) }}</span>
                          </div>
                          <div class="kv-row">
                            <span class="kv-key"><mat-icon aria-hidden="true">sports_motorsports</mat-icon>{{ 'raceDetail.table.raceRider' | t }}</span>
                            <span class="kv-value">{{ getRiderDisplay(e.race_rider_id) }}</span>
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
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                          {{ 'raceDetail.table.rider' | t }}
                        </th>
                        <td mat-cell *matCellDef="let e">{{ displayRiderName(e.rider_id) }}</td>
                      </ng-container>
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.position' | t }}</th>
                        <td mat-cell *matCellDef="let e"><span class="badge badge-neutral">{{ getPositionDisplay(e.position) }}</span></td>
                      </ng-container>
                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.points' | t }}</th>
                        <td mat-cell *matCellDef="let e"><span class="badge points">{{ e.points }}</span></td>
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
                      <article class="mobile-entry" *ngFor="let e of sprints; trackBy: trackByUser">
                        <header class="entry-head">
                          <span class="entry-user">{{ displayUser(e.user_id) }}</span>
                          <span class="entry-when">{{ e.modified_at | date:'MM/dd HH:mm' }}</span>
                        </header>
                        <section class="entry-body">
                          <div class="kv-row">
                            <span class="kv-key"><mat-icon aria-hidden="true">sports_motorsports</mat-icon>{{ 'raceDetail.table.rider' | t }}</span>
                            <span class="kv-value">{{ displayRiderName(e.rider_id) }}</span>
                          </div>
                          <div class="entry-meta">
                            <span class="meta-tag">{{ 'raceDetail.table.position' | t }}: <strong>{{ getPositionDisplay(e.position) }}</strong></span>
                            <span class="meta-tag points">{{ 'raceDetail.table.points' | t }}: <strong>{{ e.points }}</strong></span>
                            <span class="meta-tag result" [class.ok-tag]="e.points > 0" [class.ko-tag]="e.points <= 0">
                              <i [class]="resultIconClass(e.outcome, e.points)"></i> {{ resultText(e.outcome) }}
                            </span>
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
                        <th mat-header-cell *matHeaderCellDef>
                          <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                          {{ 'raceDetail.table.rider' | t }}
                        </th>
                        <td mat-cell *matCellDef="let e">{{ displayRiderName(e.rider_id) }}</td>
                      </ng-container>
                      <ng-container matColumnDef="position">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.position' | t }}</th>
                        <td mat-cell *matCellDef="let e"><span class="badge badge-neutral">{{ getPositionDisplay(e.position) }}</span></td>
                      </ng-container>
                      <ng-container matColumnDef="points">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.points' | t }}</th>
                        <td mat-cell *matCellDef="let e"><span class="badge points">{{ e.points }}</span></td>
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
                      <article class="mobile-entry" *ngFor="let e of bets; trackBy: trackByUser">
                        <header class="entry-head">
                          <span class="entry-user">{{ displayUser(e.user_id) }}</span>
                          <span class="entry-when">{{ e.modified_at | date:'MM/dd HH:mm' }}</span>
                        </header>
                        <section class="entry-body">
                          <div class="kv-row">
                            <span class="kv-key"><mat-icon aria-hidden="true">sports_motorsports</mat-icon>{{ 'raceDetail.table.rider' | t }}</span>
                            <span class="kv-value">{{ displayRiderName(e.rider_id) }}</span>
                          </div>
                          <div class="entry-meta">
                            <span class="meta-tag">{{ 'raceDetail.table.position' | t }}: <strong>{{ getPositionDisplay(e.position) }}</strong></span>
                            <span class="meta-tag points">{{ 'raceDetail.table.points' | t }}: <strong>{{ e.points }}</strong></span>
                            <span class="meta-tag result" [class.ok-tag]="e.points > 0" [class.ko-tag]="e.points <= 0">
                              <i [class]="resultIconClass(e.outcome, e.points)"></i> {{ resultText(e.outcome) }}
                            </span>
                          </div>
                        </section>
                      </article>
                    </div>
                  </ng-container>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card>

          <div *ngIf="!showLineups && !showSprintBet && !showRaceBet" class="no-results">
            <div class="ux-state-card no-results-card">
              <i class="fa-regular fa-hourglass no-results-icon ux-state-icon"></i>
              <p>{{ 'raceDetail.notStarted' | t }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    :host { --accent-blue:#1976d2; --accent-orange:#ef6c00; --accent-red:#d32f2f; }

    .page-container { min-height: 100vh; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: #fff; }
    .header { position: fixed; top: 0; left: 0; width: 100%; height: var(--app-header-height); display: flex; align-items: center; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); box-shadow: 0 8px 22px rgba(0,0,0,0.22); color:#fff; z-index:1000; padding: 0 clamp(10px,2.5vw,20px); }
    .header button i { font-size: 1.1rem; color: #fff; }
    .header h1 { flex: 1; text-align: center; margin: 0; font-size: clamp(1rem,2.8vw,1.5rem); font-family: 'MotoGP Bold', sans-serif; }
    .main-content { display:flex; flex-direction:column; align-items:stretch; gap: 10px; padding:0; max-width:var(--content-max-width); margin:0 auto; width:100%; }

    .loading-container { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:4rem; color:#fff; }
    .results-container { width:100%; display:flex; flex-direction:column; gap:1rem; }

    .info-card, .results-card, .admin-card, .mobile-card { background:#fff; border-radius:14px; overflow:hidden; box-shadow:0 6px 20px rgba(0,0,0,0.14); color: var(--text-dark); border-left:6px solid rgba(0,0,0,.08); }
    .card-accent-blue{ border-left-color:var(--accent-blue); } .card-accent-orange{ border-left-color:var(--accent-orange); } .card-accent-red{ border-left-color:var(--accent-red); }

    .card-header { background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color:#fff; padding:1.1rem 1.25rem; display:flex; align-items:center; gap:.75rem; font-family:'MotoGP Bold', sans-serif; font-size:1.1rem; }
    .event-meta-chips { display:flex; gap:.6rem; padding:0.9rem 1rem 1rem; flex-wrap:wrap; }

    .meta-chip { display:inline-grid; grid-template-columns:20px auto; column-gap:.5rem; align-items:center; padding:.5rem .75rem; background:#fff; color:#333; border:1px solid #eceff1; border-radius:10px; box-shadow:0 1px 2px rgba(0,0,0,.03); position:relative; }
    .meta-chip::before { content:''; position:absolute; left:0; top:0; bottom:0; width:6px; border-radius:10px 0 0 10px; background:#e0e0e0; }
    .meta-chip i { color:#666; }
    .meta-chip .chip-body { display:grid; }
    .meta-chip .val { font-weight:800; color:#222; line-height:1.1; }
    .meta-chip .sub { margin-top:2px; font-size:.75rem; color:#667; }
    .chip-accent-blue::before{ background:var(--accent-blue);} .chip-accent-orange::before{ background:var(--accent-orange);} .chip-accent-red::before{ background:var(--accent-red);}

    .race-overview{
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: .8rem;
      padding: .75rem .9rem .25rem;
      align-items: start;
    }
    .race-overview-main{
      display: flex;
      flex-direction: column;
      gap: .32rem;
      min-width: 0;
    }
    .race-kicker{
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: .38px;
      color: #6c727e;
      font-weight: 700;
    }
    .race-title{
      margin: 0;
      color: #111214;
      font-family: 'MotoGP Bold', sans-serif;
      letter-spacing: .25px;
      text-transform: uppercase;
      line-height: 1.02;
      font-size: clamp(1.12rem, 2.3vw, 1.5rem);
    }
    .race-date-row{
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      color: #353b46;
      font-weight: 600;
      font-size: .88rem;
    }
    .race-date-row i{
      color: #c8102e;
      font-size: .88rem;
    }
    .race-times-grid{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .42rem;
      align-self: stretch;
    }
    .race-time-item{
      border: 1px solid rgba(17, 18, 20, 0.14);
      border-radius: 10px;
      padding: .48rem .55rem;
      background: #fff;
      display: grid;
      gap: .12rem;
      min-height: 52px;
    }
    .race-time-item-primary{
      grid-column: 1 / -1;
      border-color: rgba(200, 16, 46, 0.35);
      background: linear-gradient(180deg, rgba(200, 16, 46, 0.05), rgba(200, 16, 46, 0.02));
    }
    .race-time-label{
      font-size: .68rem;
      text-transform: uppercase;
      letter-spacing: .35px;
      color: #666d79;
      line-height: 1.1;
      font-weight: 700;
    }
    .race-time-value{
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.02rem;
      color: #111214;
      line-height: 1.05;
      letter-spacing: .2px;
    }

    .results-tabs ::ng-deep .mat-mdc-tab-labels { background:#fafafa; }
    .results-tabs ::ng-deep .mat-mdc-tab-label { color:var(--primary-color); font-family:'MotoGP Bold', sans-serif; font-weight:700; text-transform:uppercase; letter-spacing:.4px; }
    .results-tabs ::ng-deep .mdc-tab--active .mdc-tab__text-label{ color:var(--primary-color)!important; }
    .results-tabs ::ng-deep .mat-mdc-ink-bar{ background:var(--primary-color); height:3px; }
    .session-results{ padding:1rem; }

    .result-table{ width:100%; border-radius:10px; overflow:hidden; }
    .result-table ::ng-deep .mat-mdc-header-row{ position:sticky; top:0; z-index:1; background:#f8f9fa; }
    .result-table ::ng-deep .mat-mdc-header-cell{ color:#333; font-weight:800; padding:.9rem 1rem; }
    .result-table ::ng-deep .mat-mdc-cell{ padding:.9rem 1rem; vertical-align:middle; }
    .result-table ::ng-deep .mat-mdc-row:nth-child(even){ background:#fbfbfb; }
    .result-table ::ng-deep .mat-mdc-row:hover{ background:rgba(0,0,0,.03); }

    .badge{ display:inline-block; padding:.25rem .6rem; border-radius:.8rem; font-weight:800; color:#fff; font-size:.9rem; background:var(--primary-color); }
    .badge.points{ background:#7b1fa2; } .badge.badge-neutral{ background:#9e9e9e; color:#fff; }

    .ok{ color:#2e7d32; } .ko{ color:#c62828; } .outcome-text{ color:#333; font-weight:600; }

    .mobile-list{ display:flex; flex-direction:column; gap:12px; }
    .mobile-card{ border:1px solid #eceff1; border-radius:12px; padding:12px; box-shadow:0 4px 12px rgba(0,0,0,.06); background:#fff; }
    .mobile-card-header{ display:flex; align-items:center; gap:10px; margin-bottom:8px; padding-bottom:8px; border-bottom:1px dashed #eceff1; }
    .mobile-card-header .title-wrap{ display:flex; flex-direction:column; gap:2px; }
    .mobile-card-header .title{ font-weight:800; color:#222; }
    .mobile-card-header .when{ font-size:.8rem; color:#667; }

    .grid{ display:grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap:8px; }
    .chip{ position:relative; border:1px solid #e9ecef; background:#fafafa; border-radius:10px; padding:8px 8px 8px 12px; display:grid; grid-template-columns:20px 1fr; column-gap:8px; align-items:center; }
    .chip::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:6px; border-radius:10px 0 0 10px; background:#e0e0e0; }
    .chip i{ color:#d32f2f; }
    .chip .chip-body{ display:grid; grid-template-rows:auto auto; }
    .chip .val{ font-weight:800; color:#222; line-height:1.2; }
    .chip .sub{ margin-top:2px; font-size:.75rem; color:#667; }
    .chip-accent-blue::before{ background:var(--accent-blue);} .chip-accent-orange::before{ background:var(--accent-orange);} .chip-accent-red::before{ background:var(--accent-red);}

    .admin-actions{ display:grid; grid-template-columns: repeat(auto-fit,minmax(260px,1fr)); gap:1rem; padding:1rem; }
    .admin-action-block{ background:#fff; border:1px solid #eceff1; border-radius:10px; padding:1rem; position:relative; }
    .admin-action-block::before{ content:''; position:absolute; left:0; top:0; bottom:0; width:6px; background:var(--accent-red); border-radius:10px 0 0 10px; }
    .action-title{ display:flex; align-items:center; gap:.5rem; font-weight:800; color:#222; margin-bottom:.25rem; }
    .action-desc{ font-size:.9rem; color:#667; margin-bottom:.75rem; }
    .inline-controls{ display:flex; gap:.5rem; align-items:center; flex-wrap:wrap; }
    .native-select{ appearance:auto; padding:.5rem .75rem; border:1px solid #e0e0e0; border-radius:8px; background:#fff; color:#222; }

    .mini-hint{ font-size:.75rem; color:#888; margin-top:.35rem; }

    .no-results{ text-align:center; padding:2.5rem 1.25rem; }
    .no-results-card{ background:#fff; border-radius:18px; padding:2rem; color:var(--text-dark); text-align:center; }
    .no-results-icon{ font-size:3.2rem; color:#ccc; margin-bottom:1rem; }

    .mat-mdc-card{ transition: all .3s cubic-bezier(.4,0,.2,1); }
    .mat-mdc-card:hover{ transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,.18); }

    /* picklist */
    .bet-picklist {
      max-height: 220px;
      overflow: auto;
      border: 1px solid #eceff1;
      border-radius: 10px;
      padding: .5rem .75rem;
      background: #fff;
      margin: .25rem 0 1rem;
    }
    .bet-row {
      display: flex;
      align-items: center;
      gap: .5rem;
      padding: .35rem 0;
      border-bottom: 1px dashed #f0f2f4;
    }
    .bet-row:last-child { border-bottom: 0; }
    .bet-user { font-weight: 700; color: #222; }
    .bet-rider, .bet-pos { color: #555; }
    .bet-outcome { margin-left: auto; }
    .select-all { display: inline-flex; align-items: center; gap: .4rem; font-size: .9rem; color: #333; }


    @media (max-width:768px){
      .header h1{ font-size:20px; }
      .results-container{ gap:1rem; }
      .card-header{ padding:1rem; font-size:1rem; }
      .race-overview{
        grid-template-columns: 1fr;
        gap: .55rem;
        padding: .65rem .72rem .2rem;
      }
      .race-times-grid{
        grid-template-columns: 1fr 1fr;
      }
    }
    @media (max-width:480px){
      .mobile-card{ padding:10px; }
      .grid{ grid-template-columns:1fr 1fr; gap:6px; }
      .chip{ padding:6px 6px 6px 10px; }
      .race-title{
        font-size: 1.14rem;
      }
      .race-time-item{
        min-height: 48px;
        padding: .42rem .5rem;
      }
      .race-time-value{
        font-size: .98rem;
      }
    }

    /* Dashboard-aligned theme override */
    .page-container{
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.14), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(0, 0, 0, 0.05), transparent 34%),
        linear-gradient(158deg, #ffffff 0%, #f8f8f9 48%, #f1f2f4 100%);
      color: #16181d;
    }
    .header{
      background: rgba(17, 18, 20, 0.97);
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
    }
    .header button{
      background: #fff;
      color: #c8102e;
      border-radius: 50%;
      width: 42px;
      height: 42px;
    }
    .header button i{ color: #c8102e; }
    .header h1{
      color: #fff;
      text-transform: uppercase;
      letter-spacing: .3px;
      padding-right: 42px;
    }
    .main-content{
      padding: calc(var(--app-header-height) + 12px) clamp(10px, 2.5vw, 22px) 18px;
      max-width: var(--content-max-width);
      gap: 12px;
    }

    .info-card, .results-card, .admin-card, .mobile-card{
      border-left: 0;
      border: 1px solid rgba(17, 18, 20, 0.12);
      box-shadow: 0 8px 18px rgba(0,0,0,.08);
      border-radius: 14px;
    }
    .card-header{
      background: #111214;
      color: #fff;
      border-radius: 14px 14px 0 0;
    }
    .card-header i{ color: #ff6e84; }

    .results-tabs ::ng-deep .mat-mdc-tab-labels{
      background: #fff;
      border-bottom: 1px solid rgba(17, 18, 20, 0.08);
    }
    .results-tabs ::ng-deep .mat-mdc-tab-label{ color: #111214; }
    .results-tabs ::ng-deep .mdc-tab--active .mdc-tab__text-label{ color: #c8102e !important; }
    .results-tabs ::ng-deep .mat-mdc-ink-bar{ background: #c8102e; }

    .result-table ::ng-deep .mat-mdc-header-row{
      background: #111214;
    }
    .result-table ::ng-deep .mat-mdc-header-cell{
      color: #fff;
      text-transform: uppercase;
      font-size: .76rem;
      letter-spacing: .35px;
    }
    .result-table ::ng-deep .mat-mdc-header-cell i,
    .result-table ::ng-deep .mat-mdc-header-cell mat-icon{
      margin-right: 6px;
      color: #ff6e84;
      font-size: .75rem;
      vertical-align: baseline;
    }
    .result-table ::ng-deep .mat-mdc-row:hover{ background: rgba(200,16,46,.06); }

    .badge.points, .points{
      background: rgba(200,16,46,.12);
      color: #c8102e;
      border: 1px solid rgba(200,16,46,.25);
    }
    .ok{ color: #1f8f43; }
    .ko{ color: #c8102e; }

    @media (max-width:768px){
      .main-content{
        padding: calc(var(--app-header-height) + 10px) 8px 12px;
      }
      .card-header{
        border-radius: 12px 12px 0 0;
      }
    }

    /* Full-page compact layout (no card look) */
    .main-content{
      max-width: none;
      padding: calc(var(--app-header-height) + 10px) 10px 12px;
      gap: 8px;
    }
    .results-container{
      gap: 8px;
    }

    .mat-mdc-card.info-card,
    .mat-mdc-card.admin-card,
    .mat-mdc-card.results-card,
    .mat-mdc-card.mobile-card{
      background: transparent !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      overflow: visible !important;
      margin: 0 !important;
    }

    .info-card .card-header,
    .admin-card .card-header{
      border-radius: 10px;
      padding: .75rem .9rem;
      min-height: 42px;
    }

    .event-meta-chips{
      gap: .4rem;
      padding: .55rem 0 .15rem;
    }
    .meta-chip{
      min-height: 36px;
      border-radius: 10px;
      border-color: rgba(17, 18, 20, 0.14);
      padding: .3rem .55rem;
    }

    .results-tabs{
      border: 1px solid rgba(17, 18, 20, 0.10);
      border-radius: 12px;
      background: #fff;
      overflow: hidden;
    }
    .results-tabs ::ng-deep .mat-mdc-tab-header{
      min-height: 44px;
    }
    .results-tabs ::ng-deep .mdc-tab{
      height: 42px;
      min-width: 84px;
      padding: 0 10px;
    }

    .session-results{
      padding: .55rem .6rem .65rem;
    }
    .result-table{
      border-radius: 10px;
      border: 1px solid rgba(17, 18, 20, 0.08);
    }
    .result-table ::ng-deep .mat-mdc-header-cell,
    .result-table ::ng-deep .mat-mdc-cell{
      padding: .65rem .55rem;
    }

    .mobile-list{
      gap: 6px;
    }
    .mobile-card{
      border: 1px solid rgba(17, 18, 20, 0.10) !important;
      border-radius: 10px !important;
      background: #fff !important;
      box-shadow: none !important;
      padding: 9px !important;
    }
    .mobile-card-header{
      margin-bottom: 6px;
      padding-bottom: 6px;
    }
    .grid{
      gap: 6px;
    }
    .chip{
      border-radius: 9px;
    }

    @media (max-width:768px){
      .main-content{
        padding: calc(var(--app-header-height) + 8px) 8px 10px;
      }
      .event-meta-chips{
        padding-top: .45rem;
      }
      .results-tabs{
        border-radius: 10px;
      }
    }

    /* Extra compact spacing */
    .main-content{ gap: 6px !important; }
    .results-container{ gap: 6px !important; }
    .card-header{
      padding: .62rem .78rem !important;
      min-height: 38px !important;
      font-size: .95rem !important;
      gap: .5rem !important;
    }
    .event-meta-chips{
      gap: .32rem !important;
      padding: .42rem 0 .05rem !important;
    }
    .meta-chip{
      min-height: 32px !important;
      padding: .22rem .48rem !important;
    }
    .results-tabs ::ng-deep .mdc-tab{
      height: 38px !important;
      min-width: 76px !important;
      padding: 0 8px !important;
    }
    .session-results{ padding: .42rem .5rem .5rem !important; }
    .result-table ::ng-deep .mat-mdc-header-cell,
    .result-table ::ng-deep .mat-mdc-cell{
      padding: .52rem .46rem !important;
    }
    .mobile-list{ gap: 5px !important; }
    .mobile-card{
      padding: 8px !important;
      border-radius: 9px !important;
    }
    .mobile-card-header{
      margin-bottom: 5px !important;
      padding-bottom: 5px !important;
    }
    .chip{ padding: 5px 6px 5px 8px !important; }

    /* Tab info redesign: lineups / sprint / race (mobile) */
    .mobile-list {
      gap: 7px !important;
    }
    .mobile-entry {
      border: 1px solid rgba(17, 18, 20, 0.12);
      border-radius: 10px;
      background: #fff;
      padding: 8px 9px;
      display: grid;
      gap: 6px;
    }
    .entry-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 8px;
      border-bottom: 1px solid rgba(17, 18, 20, 0.08);
      padding-bottom: 5px;
    }
    .entry-user {
      min-width: 0;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.84rem;
      color: #111214;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .entry-when {
      flex: 0 0 auto;
      font-size: 0.64rem;
      color: #6a717c;
      white-space: nowrap;
    }
    .entry-body {
      display: grid;
      gap: 6px;
    }
    .kv-row {
      display: grid;
      grid-template-columns: minmax(92px, 1fr) minmax(0, 1.2fr);
      gap: 8px;
      align-items: center;
    }
    .kv-key {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.63rem;
      letter-spacing: 0.25px;
      text-transform: uppercase;
      color: #5e6672;
      font-family: 'MotoGP Bold', sans-serif;
    }
    .kv-key i,
    .kv-key mat-icon {
      color: #c8102e;
      font-size: 0.72rem;
      width: 12px;
      text-align: center;
      flex: 0 0 auto;
    }
    .kv-key mat-icon {
      height: 12px;
      line-height: 12px;
    }
    .kv-value {
      font-size: 0.82rem;
      font-weight: 700;
      color: #16181d;
      line-height: 1.22;
      text-align: right;
      overflow-wrap: anywhere;
    }
    .entry-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      padding-top: 2px;
    }
    .meta-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      border: 1px solid rgba(17, 18, 20, 0.15);
      background: #fff;
      color: #353b46;
      font-size: 0.64rem;
      line-height: 1;
      white-space: nowrap;
    }
    .meta-tag strong {
      font-family: 'MotoGP Bold', sans-serif;
      font-weight: 700;
      color: #111214;
    }
    .meta-tag.points {
      border-color: rgba(200, 16, 46, 0.24);
      color: #8e1128;
      background: rgba(200, 16, 46, 0.06);
    }
    .meta-tag.result {
      font-weight: 700;
    }
    .meta-tag.result i {
      font-size: 0.7rem;
    }
    .meta-tag.ok-tag {
      border-color: rgba(31, 143, 67, 0.32);
      color: #1f8f43;
      background: rgba(31, 143, 67, 0.08);
    }
    .meta-tag.ko-tag {
      border-color: rgba(200, 16, 46, 0.32);
      color: #c8102e;
      background: rgba(200, 16, 46, 0.08);
    }

    @media (max-width: 480px) {
      .mobile-entry {
        padding: 7px 8px;
      }
      .entry-user {
        font-size: 0.8rem;
      }
      .entry-when {
        font-size: 0.6rem;
      }
      .kv-row {
        grid-template-columns: 1fr;
        gap: 2px;
      }
      .kv-value {
        text-align: left;
        font-size: 0.78rem;
      }
      .meta-tag {
        font-size: 0.61rem;
      }
    }
  `]
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  raceName = '';

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
  busy = false;

  sprintOutcome: boolean = true;
  raceOutcome: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private raceScheduleService: RaceScheduleService,
    private authService: AuthService,
    private notificationService: NotificationServiceService
  ) { this.checkScreen(); }

  @HostListener('window:resize') onResize(){ this.checkScreen(); }
  private checkScreen(){ this.isMobile = window.innerWidth <= 768; }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (!champId || !this.raceId) { this.loading = false; return; }

      // Data
      this.raceDetailService.getRaceDetails(champId, this.raceId!, { allUsers: true, allCalendar: false }).subscribe({
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

  // ===== ADMIN actions =====
  isAdmin(): boolean { return this.authService.isCurrentUserAdmin(); }

  onFillMissingLineups(): void {
    if (!this.calendarRace) return;
    this.busy = true;
    this.notificationService.showSuccess('admin.actions.fillStarted');
    this.raceDetailService.fillMissingLineups(this.calendarRace.championship_id, this.calendarRace.id).subscribe({
      next: () => {
        this.notificationService.showSuccess('admin.actions.fillSuccess');
        // refresh
        this.raceDetailService.getRaceDetails(this.calendarRace!.championship_id, String(this.calendarRace!.id)).subscribe({
          next: (data) => { this.lineups = data.lineups ?? []; },
          error: () => {}
        });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('admin.actions.fillFail');
      },
      complete: () => this.busy = false
    });
  }

  onSetOutcome(kind: 'SPR'|'RAC', outcome: boolean): void {
    if (!this.calendarRace) return;
    this.busy = true;
    const msgStartKey = kind === 'SPR' ? 'admin.actions.sprintOutcomeStarted' : 'admin.actions.raceOutcomeStarted';
    const msgOkKey    = kind === 'SPR' ? 'admin.actions.sprintOutcomeSuccess' : 'admin.actions.raceOutcomeSuccess';
    const msgErrKey   = kind === 'SPR' ? 'admin.actions.sprintOutcomeFail'    : 'admin.actions.raceOutcomeFail';
    this.notificationService.showSuccess(msgStartKey);

    this.raceDetailService.setBetOutcomeBulk(this.calendarRace.championship_id, this.calendarRace.id, kind, outcome).subscribe({
      next: () => {
        this.notificationService.showSuccess(msgOkKey);
        // refresh lists
        this.raceDetailService.getRaceDetails(this.calendarRace!.championship_id, String(this.calendarRace!.id)).subscribe({
          next: (data) => {
            this.sprints = data.sprints ?? [];
            this.bets = data.bets ?? [];
          },
          error: () => {}
        });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError(msgErrKey);
      },
      complete: () => this.busy = false
    });
  }

  // ===== Helpers =====
  goBack(): void {
    const prevNavUrl = this.router.lastSuccessfulNavigation?.previousNavigation?.initialUrl;
    if (prevNavUrl) this.router.navigateByUrl(prevNavUrl);
    else this.router.navigate(['/calendar']);
  }

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
  getRiderDisplay(r: any): string {
    if (!r) return 'N/A';
    const name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
    const num = r.number ? ` #${r.number}` : '';
    return (name + num).trim() || 'N/A';
  }
  getPositionDisplay(position: number | undefined | null): string {
    if (typeof position !== 'number' || isNaN(position)) return '—';
    return `${position} / ${position + 1}`;
  }
  resultIconClass(outcome: any, points?: number): string {
    const ok = this.isResultPositive(outcome, points);
    return ok ? 'fa-solid fa-circle-check ok' : 'fa-solid fa-circle-xmark ko';
  }
  resultText(outcome: any): string {
    if (outcome == null) return '—';
    const s = String(outcome).trim();
    return s || '—';
  }
  private isResultPositive(outcome: any, points?: number): boolean {
    const s = (outcome ?? '').toString().toLowerCase();
    const positives = ['ok','true','win','won','hit','success','correct','yes','✓','✔','instnd','finished','complete'];
    const negatives = ['false','loss','lost','miss','fail','wrong','no','✗','✕','x','outstnd','dns','dnf','cancelled','canceled'];
    if (positives.some(p => s.includes(p))) return true;
    if (negatives.some(n => s.includes(n))) return false;
    return typeof points === 'number' ? points > 0 : false;
  }

  // selections
  selectedSprintIds = new Set<string | number>();
  selectedRaceIds = new Set<string | number>();

  trackByBet = (_: number, b: { id: string | number }) => b.id;

  // Sprint helpers
  toggleSprint(id: string | number, checked: boolean | null) {
    if (checked === true) this.selectedSprintIds.add(id); else this.selectedSprintIds.delete(id);
  }
  toggleAllSprint(checked: boolean) {
    this.selectedSprintIds.clear();
    if (checked) this.sprints.forEach(b => this.selectedSprintIds.add(b.id));
  }
  isAllSprintSelected(): boolean {
    return this.sprints.length > 0 && this.selectedSprintIds.size === this.sprints.length;
  }

  // Race helpers
  toggleRace(id: string | number, checked: boolean) {
    if (checked) this.selectedRaceIds.add(id); else this.selectedRaceIds.delete(id);
  }
  toggleAllRace(checked: boolean) {
    this.selectedRaceIds.clear();
    if (checked) this.bets.forEach(b => this.selectedRaceIds.add(b.id));
  }
  isAllRaceSelected(): boolean {
    return this.bets.length > 0 && this.selectedRaceIds.size === this.bets.length;
  }

  // Apply to selected only
  onSetOutcomeSelected(kind: 'SPR'|'RAC', outcome: boolean) {
    if (!this.calendarRace) return;
    this.busy = true;

    const ids = kind === 'SPR'
      ? Array.from(this.selectedSprintIds)
      : Array.from(this.selectedRaceIds);

    const msgStartKey = kind === 'SPR' ? 'admin.actions.sprintOutcomeStarted' : 'admin.actions.raceOutcomeStarted';
    const msgOkKey    = kind === 'SPR' ? 'admin.actions.sprintOutcomeSuccess' : 'admin.actions.raceOutcomeSuccess';
    const msgErrKey   = kind === 'SPR' ? 'admin.actions.sprintOutcomeFail'    : 'admin.actions.raceOutcomeFail';

    this.notificationService.showSuccess(msgStartKey);

    this.raceDetailService
      .setBetOutcomeBulk(this.calendarRace.championship_id, this.calendarRace.id, kind, outcome, ids)
      .subscribe({
        next: () => {
          this.notificationService.showSuccess(msgOkKey);
          // refresh visible lists
          this.raceDetailService.getRaceDetails(this.calendarRace!.championship_id, String(this.calendarRace!.id))
            .subscribe({
              next: (data) => {
                this.sprints = data.sprints ?? [];
                this.bets = data.bets ?? [];
                // clear selections after refresh
                if (kind === 'SPR') this.selectedSprintIds.clear();
                else this.selectedRaceIds.clear();
              }
            });
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError(msgErrKey);
        },
        complete: () => this.busy = false
      });
  }


  trackByUser = (_: number, item: { user_id: any }) => item?.user_id?.id ?? item?.user_id?.email ?? _;
}
