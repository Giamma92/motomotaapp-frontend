// src/app/race-detail/race-detail.component.ts
import { Component, OnInit, HostListener, ViewEncapsulation } from '@angular/core';
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
import { TimeFormatPipe } from '../../pipes/time-format.pipe';

import { BetResult, LineupsResult, MotoGPStoredResult, RaceDetailService } from '../../services/race-detail.service';
import { CalendarRace, DashboardService, StandingsCalculationResponse } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';

import { AuthService } from '../../services/auth.service';
import { NotificationServiceService } from '../../services/notification.service';
import { DateUtils } from '../../utils/date-utils';
import { I18nService } from '../../services/i18n.service';

import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-race-detail',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './race-detail.component.scss',
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
    TranslatePipe,
    TimeFormatPipe
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
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
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
          <section class="page-race-hero" *ngIf="calendarRace">
            <div class="page-race-hero-main">
              <div class="race-kicker">{{ 'raceDetail.info.raceName' | t }}</div>
              <span class="cancelled-race-banner" *ngIf="calendarRace.cancelled">
                <i class="fa-solid fa-ban"></i>
                Gara cancellata
              </span>
              <h2 class="race-title">{{ raceName || ('common.na' | t) }}</h2>
              <div class="race-date-row">
                <i class="fa-solid fa-calendar-day"></i>
                <span>{{ formatRaceDate(calendarRace.event_date) }}</span>
              </div>
              <div class="page-race-hero-meta">
                <span class="hero-meta-pill">
                  <i class="fa-solid fa-stopwatch"></i>
                  {{ 'raceDetail.info.qualiTime' | t }} {{ calendarRace.qualifications_time ? (calendarRace.qualifications_time | timeFormat) : '—' }}
                </span>
                <span class="hero-meta-pill">
                  <i class="fa-solid fa-flag-checkered"></i>
                  {{ 'raceDetail.info.sprintTime' | t }} {{ calendarRace.sprint_time ? (calendarRace.sprint_time | timeFormat) : '—' }}
                </span>
                <span class="hero-meta-pill hero-meta-pill-primary">
                  <i class="fa-solid fa-motorcycle"></i>
                  {{ 'raceDetail.info.raceTime' | t }} {{ calendarRace.event_time ? (calendarRace.event_time | timeFormat) : '—' }}
                </span>
              </div>
            </div>
          </section>

          <mat-card class="info-card card-accent-blue personal-race-card" *ngIf="calendarRace">
            <details class="card-collapsible" open>
              <summary class="card-collapse-toggle">
                <div class="card-header">
                  <i class="fa-solid fa-bolt"></i>
                  <span>Il tuo race hub</span>
                </div>
                <div class="card-collapse-meta">
                  <span class="meta-tag" [class.ok-tag]="!!myLineup" [class.ko-tag]="!myLineup">L {{ myLineup ? 'ok' : 'x' }}</span>
                  <span class="meta-tag" [class.ok-tag]="!!mySprintBet" [class.ko-tag]="!mySprintBet">S {{ mySprintBet ? 'ok' : 'x' }}</span>
                  <span class="meta-tag" [class.ok-tag]="!!myRaceBet" [class.ko-tag]="!myRaceBet">R {{ myRaceBet ? 'ok' : 'x' }}</span>
                  <i class="fa-solid fa-chevron-down card-collapse-chevron"></i>
                </div>
              </summary>
              <div class="card-collapse-body">
                <div class="personal-race-grid">
                  <div class="personal-summary">
                    <span class="summary-kicker">Stato personale</span>
                    <h2>{{ personalCompletionLabel }}</h2>
                    <p>{{ completionDetails }}</p>
                    <div class="personal-tags">
                      <span class="meta-tag" [class.ok-tag]="!!myLineup" [class.ko-tag]="!myLineup">Schieramento {{ myLineup ? 'ok' : 'manca' }}</span>
                      <span class="meta-tag" [class.ok-tag]="!!mySprintBet" [class.ko-tag]="!mySprintBet">Sprint {{ mySprintBet ? 'ok' : 'manca' }}</span>
                      <span class="meta-tag" [class.ok-tag]="!!myRaceBet" [class.ko-tag]="!myRaceBet">Race {{ myRaceBet ? 'ok' : 'manca' }}</span>
                    </div>
                  </div>
                  <div class="personal-actions">
                    <button mat-raised-button color="primary" (click)="goToContextAction('lineups')" [disabled]="!canEditLineup()">
                      {{ myLineup ? 'Modifica schieramento' : 'Completa schieramento' }}
                    </button>
                    <button mat-raised-button color="accent" (click)="goToContextAction('sprint')" [disabled]="!canEditSprintBet()">
                      {{ mySprintBet ? 'Modifica sprint bet' : 'Inserisci sprint bet' }}
                    </button>
                    <button mat-raised-button color="warn" (click)="goToContextAction('race')" [disabled]="!canEditRaceBet()">
                      {{ myRaceBet ? 'Modifica race bet' : 'Inserisci race bet' }}
                    </button>
                  </div>
                </div>
                <div class="personal-breakdown">
                  <details class="hub-section" [attr.open]="!myLineup ? true : null">
                    <summary class="hub-section-summary">
                      <div class="hub-section-main">
                        <span class="summary-label">Schieramento</span>
                        <strong>{{ myLineup ? 'Schieramento salvato' : 'Schieramento mancante' }}</strong>
                      </div>
                      <div class="hub-section-meta">
                        <span class="bet-status-pill" [class.ok-tag]="!!myLineup" [class.ko-tag]="!myLineup">
                          <i [class]="myLineup ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
                          {{ myLineup ? 'Completo' : 'Manca' }}
                        </span>
                        <i class="fa-solid fa-chevron-down hub-chevron"></i>
                      </div>
                    </summary>
                    <div class="hub-section-body">
                      <div class="hub-score-strip">
                        <span class="hub-score-pill" [class.pending-pill]="getLineupQualifyingScore() === null" [class.score-zero]="getLineupQualifyingScore() === 0" [class.score-positive]="(getLineupQualifyingScore() ?? -1) > 0">
                          Qualifica
                          <strong>{{ getLineupQualifyingScore() === null ? 'In attesa' : formatSignedPoints(getLineupQualifyingScore()!) }}</strong>
                        </span>
                        <span class="hub-score-pill" [class.pending-pill]="getLineupRaceScore() === null" [class.score-zero]="getLineupRaceScore() === 0" [class.score-positive]="(getLineupRaceScore() ?? -1) > 0">
                          Gara
                          <strong>{{ getLineupRaceScore() === null ? 'In attesa' : formatSignedPoints(getLineupRaceScore()!) }}</strong>
                        </span>
                        <span class="hub-score-pill hub-score-pill-total" [class.pending-pill]="getLineupTotalScore() === null" [class.score-zero]="getLineupTotalScore() === 0" [class.score-positive]="(getLineupTotalScore() ?? -1) > 0">
                          Totale
                          <strong>{{ getLineupTotalScore() === null ? 'In attesa' : formatSignedPoints(getLineupTotalScore()!) }}</strong>
                        </span>
                      </div>
                      <div class="breakdown-item compact-breakdown-item">
                        <span class="summary-label">Pilota qualifica</span>
                        <strong>{{ myLineup ? getRiderDisplay(myLineup.qualifying_rider_id) : 'Non ancora scelto' }}</strong>
                      </div>
                      <div class="breakdown-item compact-breakdown-item">
                        <span class="summary-label">Pilota gara</span>
                        <strong>{{ myLineup ? getRiderDisplay(myLineup.race_rider_id) : 'Non ancora scelto' }}</strong>
                      </div>
                    </div>
                  </details>

                  <details class="hub-section bet-breakdown" [class.bet-breakdown-pending]="mySprintBet && !hasBetOutcome(mySprintBet)" [class.bet-breakdown-win]="mySprintBet && isBetSuccessful(mySprintBet)" [class.bet-breakdown-loss]="mySprintBet && hasBetOutcome(mySprintBet) && !isBetSuccessful(mySprintBet)">
                    <summary class="hub-section-summary">
                      <div class="hub-section-main">
                        <span class="summary-label">Sprint bet</span>
                        <strong>{{ mySprintBet ? (displayRiderName(mySprintBet.rider_id) + ' · P' + mySprintBet.position) : 'Non ancora inserita' }}</strong>
                      </div>
                      <div class="hub-section-meta">
                        <span class="bet-status-pill" *ngIf="mySprintBet" [class.ok-tag]="isBetSuccessful(mySprintBet)" [class.ko-tag]="hasBetOutcome(mySprintBet) && !isBetSuccessful(mySprintBet)" [class.pending-tag]="!hasBetOutcome(mySprintBet)">
                          <i [class]="getBetStatusIcon(mySprintBet)"></i>
                          {{ getBetStatusLabel(mySprintBet) }}
                        </span>
                        <span class="bet-status-pill" *ngIf="mySprintBet">{{ mySprintBet.points }} pt</span>
                        <span class="bet-status-pill ko-tag" *ngIf="!mySprintBet">
                          <i class="fa-solid fa-circle-xmark"></i>
                          Manca
                        </span>
                        <i class="fa-solid fa-chevron-down hub-chevron"></i>
                      </div>
                    </summary>
                    <div class="hub-section-body" *ngIf="mySprintBet; else emptySprintBet">
                      <div class="bet-points-row">
                        <span class="bet-points-value">{{ getBetStatusLabel(mySprintBet) }}</span>
                        <span class="bet-points-note">{{ getBetDeltaLabel(mySprintBet) }} · {{ displayRiderName(mySprintBet.rider_id) }} · Posizione {{ mySprintBet.position }}</span>
                      </div>
                    </div>
                  </details>

                  <ng-template #emptySprintBet>
                    <div class="hub-section-body">
                      <div class="breakdown-item compact-breakdown-item">
                        <span class="summary-label">Sprint bet</span>
                        <strong>Non ancora inserita</strong>
                      </div>
                    </div>
                  </ng-template>

                  <details class="hub-section bet-breakdown" [class.bet-breakdown-pending]="myRaceBet && !hasBetOutcome(myRaceBet)" [class.bet-breakdown-win]="myRaceBet && isBetSuccessful(myRaceBet)" [class.bet-breakdown-loss]="myRaceBet && hasBetOutcome(myRaceBet) && !isBetSuccessful(myRaceBet)">
                    <summary class="hub-section-summary">
                      <div class="hub-section-main">
                        <span class="summary-label">Race bet</span>
                        <strong>{{ myRaceBet ? (displayRiderName(myRaceBet.rider_id) + ' · P' + myRaceBet.position) : 'Non ancora inserita' }}</strong>
                      </div>
                      <div class="hub-section-meta">
                        <span class="bet-status-pill" *ngIf="myRaceBet" [class.ok-tag]="isBetSuccessful(myRaceBet)" [class.ko-tag]="hasBetOutcome(myRaceBet) && !isBetSuccessful(myRaceBet)" [class.pending-tag]="!hasBetOutcome(myRaceBet)">
                          <i [class]="getBetStatusIcon(myRaceBet)"></i>
                          {{ getBetStatusLabel(myRaceBet) }}
                        </span>
                        <span class="bet-status-pill" *ngIf="myRaceBet">{{ myRaceBet.points }} pt</span>
                        <span class="bet-status-pill ko-tag" *ngIf="!myRaceBet">
                          <i class="fa-solid fa-circle-xmark"></i>
                          Manca
                        </span>
                        <i class="fa-solid fa-chevron-down hub-chevron"></i>
                      </div>
                    </summary>
                    <div class="hub-section-body" *ngIf="myRaceBet; else emptyRaceBet">
                      <div class="bet-points-row">
                        <span class="bet-points-value">{{ getBetStatusLabel(myRaceBet) }}</span>
                        <span class="bet-points-note">{{ getBetDeltaLabel(myRaceBet) }} · {{ displayRiderName(myRaceBet.rider_id) }} · Posizione {{ myRaceBet.position }}</span>
                      </div>
                    </div>
                  </details>

                  <ng-template #emptyRaceBet>
                    <div class="hub-section-body">
                      <div class="breakdown-item compact-breakdown-item">
                        <span class="summary-label">Race bet</span>
                        <strong>Non ancora inserita</strong>
                      </div>
                    </div>
                  </ng-template>
                </div>
              </div>
            </details>
          </mat-card>

          <!-- Admin Actions (REPLACE the whole previous admin-card) -->
          <mat-card class="admin-card card-accent-red" *ngIf="isAdmin()">
            <div class="card-header">
              <i class="fa-solid fa-shield-halved"></i>
              <span>{{ 'admin.actions.title' | t }}</span>
            </div>

            <mat-card-content class="admin-panel">
              <div class="admin-actions-grid">
                <section class="admin-actions-row admin-actions-row-primary">
                  <div class="action-copy">
                    <span class="action-eyebrow">Lineup</span>
                    <strong class="action-heading">{{ 'admin.actions.fillNow' | t }}</strong>
                    <span class="action-note">Completa automaticamente le lineup mancanti della gara corrente.</span>
                  </div>
                  <button mat-raised-button color="primary" class="admin-action-button" (click)="onFillMissingLineups()" [disabled]="busy">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    {{ 'admin.actions.fillNow' | t }}
                  </button>
                </section>

                <section class="admin-actions-row admin-actions-row-accent">
                  <div class="action-copy">
                    <span class="action-eyebrow">Standings</span>
                    <strong class="action-heading">{{ 'motogp.results.updateStandings' | t }}</strong>
                    <span class="action-note">Aggiorna la classifica solo se i dati della gara sono cambiati.</span>
                  </div>
                  <button mat-raised-button color="accent" class="admin-action-button" (click)="onUpdateStandings()" [disabled]="busy || !calendarRace">
                    <i class="fa-solid fa-arrows-rotate"></i>
                    {{ 'motogp.results.updateStandings' | t }}
                  </button>
                </section>

                <section class="admin-actions-row admin-actions-row-warn">
                  <div class="action-copy">
                    <span class="action-eyebrow">Override</span>
                    <strong class="action-heading">Forza ricalcolo classifica</strong>
                    <span class="action-note">Invalida il conteggio della gara e lo ricostruisce esplicitamente.</span>
                  </div>
                  <button mat-raised-button color="warn" class="admin-action-button" (click)="onForceRecalculateStandings()" [disabled]="busy || !calendarRace">
                    <i class="fa-solid fa-rotate-right"></i>
                    Forza ricalcolo classifica
                  </button>
                </section>

                <section class="admin-actions-row admin-actions-row-danger">
                  <div class="action-copy">
                    <span class="action-eyebrow">Calendario</span>
                    <strong class="action-heading">{{ calendarRace?.cancelled ? 'Riattiva gara' : 'Segna gara cancellata' }}</strong>
                    <span class="action-note">Mostra la gara come cancellata e blocca lineup, bet e calcolo classifica.</span>
                  </div>
                  <button mat-raised-button color="warn" class="admin-action-button" (click)="onToggleRaceCancelled()" [disabled]="busy || !calendarRace">
                    <i class="fa-solid" [class.fa-rotate-left]="calendarRace?.cancelled" [class.fa-ban]="!calendarRace?.cancelled"></i>
                    {{ calendarRace?.cancelled ? 'Riattiva gara' : 'Segna cancellata' }}
                  </button>
                </section>
              </div>

              <section class="qualifying-override-panel" *ngIf="motogpResults.length">
                <button type="button" class="override-toggle" (click)="showQualifyingOverride = !showQualifyingOverride">
                  <div class="action-copy">
                    <span class="action-eyebrow">Qualifying scoring</span>
                    <strong class="action-heading">Griglia valida per il punteggio</strong>
                    <span class="action-note">Se DORNA applica penalita di griglia puoi correggere qui la posizione usata nel calcScore.</span>
                  </div>
                  <i class="fa-solid" [class.fa-chevron-down]="!showQualifyingOverride" [class.fa-chevron-up]="showQualifyingOverride"></i>
                </button>

                <div class="override-table" *ngIf="showQualifyingOverride">
                  <div class="override-row override-row-head">
                    <span>Pilota</span>
                    <span>Qualifica</span>
                    <span>Scoring</span>
                    <span>Sorgente</span>
                    <span>Override admin</span>
                  </div>

                  <div class="override-row" *ngFor="let result of motogpResults; trackBy: trackByMotoGPResult">
                    <span class="override-rider">{{ getRiderDisplay(result.rider_id) }}</span>
                    <span>{{ result.qualifying_position ?? '—' }}</span>
                    <span>
                      {{ result.qualifying_scoring_position ?? '—' }}
                      <small class="override-points">({{ result.qualifying_scoring_points ?? 0 }} pt)</small>
                    </span>
                    <span class="override-source">{{ getQualifyingSourceLabel(result.qualifying_scoring_source) }}</span>
                    <span class="override-actions">
                      <input
                        class="native-input"
                        type="number"
                        min="1"
                        [ngModelOptions]="{ standalone: true }"
                        [(ngModel)]="qualifyingScoringDrafts[result.id]"
                      />
                      <button mat-stroked-button color="primary" (click)="onSaveQualifyingScoring(result)" [disabled]="busy">
                        Salva
                      </button>
                      <button mat-button type="button" (click)="onResetQualifyingScoring(result)" [disabled]="busy || result.qualifying_scoring_source !== 'admin_override'">
                        Reset
                      </button>
                    </span>
                  </div>
                </div>
              </section>

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
            <details class="card-collapsible" open>
              <summary class="card-collapse-toggle">
                <div class="card-header">
                  <i class="fa-solid fa-users-viewfinder"></i>
                  <span>Risultati partecipanti</span>
                </div>
                <div class="card-collapse-meta">
                  <span class="meta-tag">{{ getVisibleResultsSummary() }}</span>
                  <i class="fa-solid fa-chevron-down card-collapse-chevron"></i>
                </div>
              </summary>
              <div class="card-collapse-body">
            <mat-tab-group class="results-tabs app-material-tabs">
              <!-- Lineups Tab -->
              <mat-tab *ngIf="showLineups" label="{{ 'raceDetail.lineups.tab' | t }}">
                <div class="session-results">
                  <ng-container *ngIf="!isMobile">
                    <table mat-table [dataSource]="lineups" class="result-table app-material-table">
                      <ng-container matColumnDef="user">
                        <th mat-header-cell *matHeaderCellDef>{{ 'raceDetail.table.user' | t }}</th>
                        <td mat-cell *matCellDef="let e">
                          <div class="user-cell">
                            <span>{{ displayUser(e.user_id) }}</span>
                            <span class="auto-note" *ngIf="e.automatically_inserted">Auto-inserita, non fa punteggio</span>
                          </div>
                        </td>
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
                        <td mat-cell *matCellDef="let e">{{ formatEntryDateTime(e.modified_at) }}</td>
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
                          <span class="entry-when">{{ formatEntryDateTime(e.modified_at) }}</span>
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
                          <div class="entry-meta" *ngIf="e.automatically_inserted">
                            <span class="meta-tag auto-tag">
                              <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-inserita, non fa punteggio
                            </span>
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
                    <table mat-table [dataSource]="sprints" class="result-table app-material-table">
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
                        <td mat-cell *matCellDef="let e">{{ formatEntryDateTime(e.modified_at) }}</td>
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
                          <span class="entry-when">{{ formatEntryDateTime(e.modified_at) }}</span>
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
                    <table mat-table [dataSource]="bets" class="result-table app-material-table">
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
                        <td mat-cell *matCellDef="let e">{{ formatEntryDateTime(e.modified_at) }}</td>
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
                          <span class="entry-when">{{ formatEntryDateTime(e.modified_at) }}</span>
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
              </div>
            </details>
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
  `
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
  motogpResults: MotoGPStoredResult[] = [];
  qualifyingScoringDrafts: Record<number, number | null> = {};
  showQualifyingOverride = false;

  isMobile = false;
  calendarRace: CalendarRace | null = null;
  showLineups = false;
  showSprintBet = false;
  showRaceBet = false;
  loading = true;
  busy = false;
  championshipTimeZone = DateUtils.DEFAULT_CHAMPIONSHIP_TIMEZONE;

  sprintOutcome: boolean = true;
  raceOutcome: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private championshipService: ChampionshipService,
    private dashboardService: DashboardService,
    private raceDetailService: RaceDetailService,
    private raceScheduleService: RaceScheduleService,
    private authService: AuthService,
    private notificationService: NotificationServiceService,
    private i18nService: I18nService
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
          this.setMotoGPResults(data.motogpResults ?? []);
          this.loading = false;
        },
        error: (err) => { console.error('Error fetching race details:', err); this.loading = false; }
      });

      // Schedule logic + race name
      this.raceDetailService.getCalendarRace(champId, this.raceId).subscribe({
        next: (race) => {
          this.calendarRace = race;
          this.raceName = race?.race_id?.name ?? '';
          this.championshipService.getChampionshipConfig(champId).subscribe({
            next: (config) => {
              this.championshipTimeZone = config?.timezone || DateUtils.DEFAULT_CHAMPIONSHIP_TIMEZONE;
              this.showLineups = true;
              this.showSprintBet = this.raceScheduleService.canShowSprintBetResults(race, this.championshipTimeZone);
              this.showRaceBet = this.raceScheduleService.canShowRaceBetResults(race, this.championshipTimeZone);
            },
            error: (err) => console.error('Error fetching championship config:', err)
          });
        },
        error: (err) => console.error('Error fetching race info:', err)
      });
    });
  }

  // ===== ADMIN actions =====
  isAdmin(): boolean { return this.authService.isCurrentUserAdmin(); }

  formatRaceDate(eventDate: string | null | undefined): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    if (!date) return '';

    return new Intl.DateTimeFormat(this.i18nService.locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  formatEntryDateTime(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(this.i18nService.locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  get myLineup(): LineupsResult | null {
    const userId = this.authService.getUserId();
    return this.lineups.find(lineup => lineup?.user_id?.id === userId) ?? null;
  }

  get mySprintBet(): BetResult | null {
    const userId = this.authService.getUserId();
    return this.sprints.find(bet => bet?.user_id?.id === userId) ?? null;
  }

  get myRaceBet(): BetResult | null {
    const userId = this.authService.getUserId();
    return this.bets.find(bet => bet?.user_id?.id === userId) ?? null;
  }

  get personalCompletionLabel(): string {
    const completed = [this.myLineup, this.mySprintBet, this.myRaceBet].filter(Boolean).length;
    if (completed === 3) return 'Hai completato tutto';
    if (completed === 0) return 'Ti manca ancora tutto';
    return `${completed}/3 azioni completate`;
  }

  get completionDetails(): string {
    return 'Controlla qui sotto cosa hai gia salvato e cosa ti manca ancora per questa gara.';
  }

  getVisibleResultsSummary(): string {
    const sections: string[] = [];
    if (this.showLineups) sections.push(`L ${this.lineups.length}`);
    if (this.showSprintBet) sections.push(`S ${this.sprints.length}`);
    if (this.showRaceBet) sections.push(`R ${this.bets.length}`);
    return sections.length ? sections.join(' · ') : 'Nessun risultato disponibile';
  }

  canEditLineup(): boolean {
    return this.calendarRace ? this.raceScheduleService.canShowLineups(this.calendarRace, this.championshipTimeZone) : false;
  }

  canEditSprintBet(): boolean {
    return this.calendarRace ? this.raceScheduleService.canShowSprintBet(this.calendarRace, this.championshipTimeZone) : false;
  }

  canEditRaceBet(): boolean {
    return this.calendarRace ? this.raceScheduleService.canShowRaceBet(this.calendarRace, this.championshipTimeZone) : false;
  }

  goToContextAction(kind: 'lineups' | 'sprint' | 'race'): void {
    if (!this.raceId) return;
    if (kind === 'lineups') this.router.navigate(['/lineups', this.raceId]);
    if (kind === 'sprint') this.router.navigate(['/sprint-bet', this.raceId]);
    if (kind === 'race') this.router.navigate(['/race-bet', this.raceId]);
  }

  onFillMissingLineups(): void {
    if (!this.calendarRace) return;
    this.busy = true;
    this.notificationService.showSuccess('admin.actions.fillStarted');
    this.raceDetailService.fillMissingLineups(this.calendarRace.championship_id, this.calendarRace.id).subscribe({
      next: (result) => {
        const inserted = Number(result?.inserted ?? 0);
        const missingUsers = Number(result?.missingUsers ?? 0);
        const withoutPreviousLineup = Number(result?.withoutPreviousLineup ?? 0);

        if (inserted > 0) {
          this.notificationService.showSuccessMessage(`Inserite ${inserted} lineup automatiche.`);
        } else if (missingUsers === 0) {
          this.notificationService.showSuccessMessage('Tutti gli utenti hanno gia una lineup per questa gara.');
        } else if (withoutPreviousLineup > 0) {
          this.notificationService.showSuccessMessage(`Nessuna lineup inserita: ${withoutPreviousLineup} utenti non hanno lineup precedenti da copiare.`);
        } else {
          this.notificationService.showSuccess('admin.actions.fillSuccess');
        }
        // refresh
        this.raceDetailService.getRaceDetails(this.calendarRace!.championship_id, String(this.calendarRace!.id)).subscribe({
          next: (data) => {
            this.lineups = data.lineups ?? [];
            this.setMotoGPResults(data.motogpResults ?? []);
          },
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

  onUpdateStandings(): void {
    if (!this.calendarRace) return;
    this.runStandingsUpdate(false);
  }

  onForceRecalculateStandings(): void {
    if (!this.calendarRace) return;
    this.runStandingsUpdate(true);
  }

  onToggleRaceCancelled(): void {
    if (!this.calendarRace) return;

    const nextCancelled = !this.calendarRace.cancelled;
    this.busy = true;
    this.dashboardService.setCalendarRaceCancelled(this.calendarRace.championship_id, this.calendarRace.id, nextCancelled).subscribe({
      next: (race) => {
        this.calendarRace = race;
        this.raceName = race?.race_id?.name ?? this.raceName;
        this.notificationService.showSuccessMessage(nextCancelled ? 'Gara segnata come cancellata.' : 'Gara riattivata.');
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showErrorMessage('Errore durante l\'aggiornamento dello stato gara. Verifica che la colonna calendar.cancelled esista nel database.');
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
            this.setMotoGPResults(data.motogpResults ?? []);
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
    if (!s) return '—';
    const normalized = s.toLowerCase();
    if (['true', 'ok', 'win', 'won', 'success', 'correct'].includes(normalized)) return 'Scommessa vinta';
    if (['false', 'loss', 'lost', 'fail', 'wrong'].includes(normalized)) return 'Scommessa persa';
    return s;
  }
  hasBetOutcome(bet: BetResult | null | undefined): boolean {
    if (!bet) return false;
    const outcome = bet.outcome;
    return outcome !== null && outcome !== undefined && String(outcome).trim() !== '';
  }
  isBetSuccessful(bet: BetResult | null | undefined): boolean {
    if (!bet) return false;
    return this.isResultPositive(bet.outcome, bet.points);
  }
  getBetStatusLabel(bet: BetResult | null | undefined): string {
    if (!bet) return 'Non inserita';
    if (!this.hasBetOutcome(bet)) return 'In attesa';
    return this.isBetSuccessful(bet) ? 'Vinta' : 'Persa';
  }
  getBetStatusIcon(bet: BetResult | null | undefined): string {
    if (!bet || !this.hasBetOutcome(bet)) return 'fa-regular fa-clock';
    return this.isBetSuccessful(bet) ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark';
  }
  getBetDelta(bet: BetResult | null | undefined): number | null {
    if (!bet || !this.hasBetOutcome(bet)) return null;
    const stake = Math.abs(Number(bet.points || 0));
    return this.isBetSuccessful(bet) ? stake : -Math.floor(stake / 2);
  }
  getBetDeltaLabel(bet: BetResult | null | undefined): string {
    const delta = this.getBetDelta(bet);
    if (delta === null) return 'In attesa';
    return `${this.getBetStatusLabel(bet)} ${this.formatSignedPoints(delta)}`;
  }
  getLineupQualifyingScore(): number | null {
    const riderId = Number((this.myLineup?.qualifying_rider_id as any)?.id ?? this.myLineup?.qualifying_rider_id);
    if (!riderId) return null;
    const result = this.findMotoGpResultByRider(riderId);
    if (!result) return null;
    return Number(result.qualifying_scoring_points ?? result.qualifying_points ?? 0);
  }
  getLineupRaceScore(): number | null {
    const riderId = Number((this.myLineup?.race_rider_id as any)?.id ?? this.myLineup?.race_rider_id);
    if (!riderId) return null;
    const result = this.findMotoGpResultByRider(riderId);
    if (!result) return null;
    return Number(result.race_points ?? 0);
  }
  getLineupTotalScore(): number | null {
    const qualifyingScore = this.getLineupQualifyingScore();
    const raceScore = this.getLineupRaceScore();
    if (qualifyingScore === null && raceScore === null) return null;
    return Number(qualifyingScore ?? 0) + Number(raceScore ?? 0);
  }
  formatSignedPoints(value: number): string {
    return `${value > 0 ? '+' : ''}${value} pt`;
  }
  private findMotoGpResultByRider(riderId: number): MotoGPStoredResult | null {
    if (!riderId) return null;
    return this.motogpResults.find(result => Number((result.rider_id as any)?.id ?? result.rider_id) === riderId) ?? null;
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
                this.setMotoGPResults(data.motogpResults ?? []);
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

  onSaveQualifyingScoring(result: MotoGPStoredResult): void {
    if (!this.calendarRace) return;

    const nextValue = this.qualifyingScoringDrafts[result.id];
    if (nextValue == null || !Number.isFinite(Number(nextValue)) || Number(nextValue) <= 0) {
      this.notificationService.showErrorMessage('Inserisci una posizione valida maggiore di zero.');
      return;
    }

    this.busy = true;
    this.raceDetailService.updateQualifyingScoring(
      this.calendarRace.championship_id,
      this.calendarRace.id,
      Number((result.rider_id as any)?.id ?? result.rider_id),
      Number(nextValue)
    ).subscribe({
      next: () => {
        this.notificationService.showSuccessMessage('Posizione scoring qualifica aggiornata.');
        this.refreshRaceDetails();
      },
      error: (err) => {
        console.error('Error updating qualifying scoring:', err);
        this.notificationService.showErrorMessage('Errore durante l\'aggiornamento della posizione scoring.');
      },
      complete: () => this.busy = false
    });
  }

  onResetQualifyingScoring(result: MotoGPStoredResult): void {
    if (!this.calendarRace) return;

    this.busy = true;
    this.raceDetailService.updateQualifyingScoring(
      this.calendarRace.championship_id,
      this.calendarRace.id,
      Number((result.rider_id as any)?.id ?? result.rider_id),
      null
    ).subscribe({
      next: () => {
        this.notificationService.showSuccessMessage('Override admin rimosso.');
        this.refreshRaceDetails();
      },
      error: (err) => {
        console.error('Error resetting qualifying scoring:', err);
        this.notificationService.showErrorMessage('Errore durante il reset dell\'override.');
      },
      complete: () => this.busy = false
    });
  }

  getQualifyingSourceLabel(source: MotoGPStoredResult['qualifying_scoring_source']): string {
    switch (source) {
      case 'admin_override':
        return 'Override admin';
      case 'api_grid':
        return 'Griglia API';
      case 'raw_qualifying':
        return 'Qualifica';
      default:
        return '—';
    }
  }

  private refreshRaceDetails(): void {
    if (!this.calendarRace) return;

    this.raceDetailService.getRaceDetails(this.calendarRace.championship_id, String(this.calendarRace.id), {
      allUsers: true,
      allCalendar: false
    }).subscribe({
      next: (data) => {
        this.lineups = data.lineups ?? [];
        this.sprints = data.sprints ?? [];
        this.bets = data.bets ?? [];
        this.setMotoGPResults(data.motogpResults ?? []);
      },
      error: (err) => console.error('Error refreshing race details:', err)
    });
  }

  private runStandingsUpdate(force: boolean): void {
    if (!this.calendarRace) return;

    this.busy = true;
    this.notificationService.showSuccess('motogp.results.fetchMotoGPResults');

    this.dashboardService.fetchMotoGPResults(this.calendarRace.championship_id, this.calendarRace.id, true).subscribe({
      next: () => {
        this.notificationService.showSuccess('motogp.results.fetchMotoGPResultsSuccess');
        this.notificationService.showSuccess('motogp.results.updateStandings');

        const request$ = force
          ? this.dashboardService.recalculateStandings(this.calendarRace!.championship_id, this.calendarRace!.id)
          : this.dashboardService.updateStandings(this.calendarRace!.championship_id, this.calendarRace!.id);

        request$.subscribe({
          next: (response: StandingsCalculationResponse) => {
            this.notificationService.showSuccess('motogp.results.updateStandingsSuccess');
            if (response?.meta?.message) {
              this.notificationService.showSuccessMessage(response.meta.message, response.meta.partial ? 6500 : 5000);
            }
            this.refreshRaceDetails();
          },
          error: (err) => {
            console.error(force ? 'Error force recalculating standings:' : 'Error updating standings:', err);
            this.notificationService.showError('motogp.results.updateStandingsFail');
          },
          complete: () => this.busy = false
        });
      },
      error: (err) => {
        console.error('Error fetching MotoGP results before standings update:', err);
        this.notificationService.showError('motogp.results.fetchMotoGPResultsFail');
        this.busy = false;
      }
    });
  }

  private setMotoGPResults(results: MotoGPStoredResult[]): void {
    this.motogpResults = [...results].sort((a, b) => {
      const posA = a.qualifying_position ?? a.qualifying_scoring_position ?? Number.MAX_SAFE_INTEGER;
      const posB = b.qualifying_position ?? b.qualifying_scoring_position ?? Number.MAX_SAFE_INTEGER;
      return posA - posB;
    });
    this.qualifyingScoringDrafts = this.motogpResults.reduce((acc, result) => {
      acc[result.id] = result.qualifying_scoring_position ?? result.qualifying_position ?? null;
      return acc;
    }, {} as Record<number, number | null>);
  }


  trackByUser = (_: number, item: { user_id: any }) => item?.user_id?.id ?? item?.user_id?.email ?? _;
  trackByMotoGPResult = (_: number, item: MotoGPStoredResult) => item.id;
}
