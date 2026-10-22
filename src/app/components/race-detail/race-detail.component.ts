// src/app/race-detail/race-detail.component.ts
import { Component, OnInit, HostListener, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { NavigationService } from '../../services/navigation.service';
import { ThemeService } from '../../services/theme.service';
import { MotoGPAssetService } from '../../services/motogp-asset.service';

import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

export interface ParticipantCard {
  userId: number | string;
  userName: string;
  userAvatar?: string | null;
  isMe: boolean;
  lineup: LineupsResult | null;
  sprintBet: BetResult | null;
  raceBet: BetResult | null;
  completedCount: number;
  totalPointsDelta: number | null;
  lineupScore: number | null;
  qualifyingRiderName?: string;
  raceRiderName?: string;
  sprintBetRiderName?: string;
  raceBetRiderName?: string;
  qualifyingRiderNumber?: string | number;
  raceRiderNumber?: string | number;
  sprintBetRiderNumber?: string | number;
  raceBetRiderNumber?: string | number;
  qualifyingScore?: number | null;
  raceScore?: number | null;
}

@Component({
  selector: 'app-race-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
        query('.info-card, .results-card, .admin-card, .personal-hub-card, .manager-matrix-row', [
          style({ opacity: 0, transform: 'translateY(14px)' }),
          stagger(60, [
            animate('260ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
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
          <!-- ═══════════ RACE HERO ═══════════ -->
          <section class="page-race-hero relative overflow-hidden" *ngIf="calendarRace">
            <!-- Ambient Circuit Track Layout Watermark -->
            <div
              *ngIf="assetService.getCircuitLayoutUrl(calendarRace.race_id.country, calendarRace.race_id.name) as trackUrl"
              class="hero-circuit-wrap">
              <img
                [src]="trackUrl"
                [alt]="calendarRace.race_id.name"
                class="hero-circuit-img"
                [class.filter-invert]="theme.mode() === 'light'"
                (error)="assetService.handleImageError($event, '/assets/images/circuit-placeholder.svg')">
            </div>

            <div class="page-race-hero-main relative z-10">
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

              <!-- Action Hub: Cosa puoi fare adesso (se finestra attiva o azione richiesta) -->
              <div class="race-action-hub" [ngClass]="'action-hub--' + actionHubState.statusType" *ngIf="actionHubState as hub">
                <div class="action-hub-body">
                  <div class="action-hub-topline">
                    <span class="action-hub-kicker">Cosa puoi fare adesso</span>
                    <span class="action-hub-badge">
                      <mat-icon>{{ hub.statusType === 'urgent' ? 'alarm' : (hub.statusType === 'done' ? 'check_circle' : 'info') }}</mat-icon>
                      {{ hub.statusBadge }}
                    </span>
                  </div>
                  <h3 class="action-hub-title">{{ hub.title }}</h3>
                  <p class="action-hub-subtitle">{{ hub.subtitle }}</p>
                </div>
                <div class="action-hub-cta-wrap" *ngIf="hub.buttonLabel && hub.actionKind">
                  <button mat-flat-button class="action-hub-btn" (click)="goToContextAction(hub.actionKind)">
                    <mat-icon *ngIf="hub.buttonIcon">{{ hub.buttonIcon }}</mat-icon>
                    <span>{{ hub.buttonLabel }}</span>
                    <mat-icon class="btn-arrow">arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ═══════════ IL TUO WEEKEND (PERSONAL HUB COMPATTO) ═══════════ -->
          <section class="personal-hub-card" id="section-hub" *ngIf="calendarRace">
            <header class="personal-hub-header">
              <div class="personal-hub-title-wrap">
                <div class="personal-hub-icon-badge">
                  <i class="fa-solid fa-bolt"></i>
                </div>
                <div>
                  <span class="personal-hub-kicker">Il Tuo Weekend</span>
                  <h3 class="personal-hub-title">Stato delle Tue Giocate</h3>
                </div>
              </div>

              <div class="personal-hub-badges">
                <span class="hub-completion-badge" [class.badge--complete]="personalCompletionPercent === 100">
                  <i class="fa-solid" [class.fa-check-double]="personalCompletionPercent === 100" [class.fa-clock]="personalCompletionPercent < 100"></i>
                  {{ personalCompletionPercent === 100 ? 'Completato 3/3' : personalCompletionPercent + '% inserito' }}
                </span>
                <span class="hub-delta-badge" *ngIf="myTotalDelta !== null" [class.delta-pos]="myTotalDelta > 0" [class.delta-neg]="myTotalDelta < 0">
                  {{ formatSignedPoints(myTotalDelta) }}
                </span>
              </div>
            </header>

            <div class="personal-hub-grid">
              <!-- 1. Schieramento Rosa -->
              <div class="hub-slot-card slot-lineup" [class.slot-done]="!!myLineup" [class.slot-missing]="!myLineup">
                <div class="slot-head">
                  <div class="slot-badge">
                    <div class="slot-icon-box slot-icon--lineup">
                      <i class="fa-solid fa-flag-checkered"></i>
                    </div>
                    <span class="slot-name">Schieramento Rosa</span>
                  </div>

                  <div class="slot-head-actions">
                    <span class="slot-score-pill" *ngIf="getLineupTotalScore() !== null"
                          [class.score--pos]="getLineupTotalScore()! > 0"
                          [class.score--neg]="getLineupTotalScore()! < 0">
                      {{ formatSignedPoints(getLineupTotalScore()!) }}
                    </span>
                    <span class="slot-status-pill" *ngIf="getLineupTotalScore() === null"
                          [class.status-ok]="!!myLineup" [class.status-ko]="!myLineup">
                      <i class="fa-solid" [class.fa-circle-check]="!!myLineup" [class.fa-clock]="!myLineup"></i>
                      {{ myLineup ? 'Salvato' : 'Manca' }}
                    </span>
                    <span *ngIf="!canEditLineup()" class="slot-lock-indicator" title="Finestra modifiche chiusa">
                      <i class="fa-solid fa-lock"></i>
                    </span>
                  </div>
                </div>

                <div class="slot-content" *ngIf="myLineup; else myLineupMissing">
                  <div class="slot-riders-row">
                    <div class="slot-rider-chip chip--quali">
                      <div class="chip-header">
                        <span class="chip-type"><i class="fa-solid fa-stopwatch text-sky-400"></i> Qualifica</span>
                        <span class="chip-pts" *ngIf="getLineupQualifyingScore() !== null"
                              [class.pts--pos]="getLineupQualifyingScore()! > 0">
                          {{ formatSignedPoints(getLineupQualifyingScore()!) }}
                        </span>
                      </div>
                      <strong class="chip-name truncate">{{ getRiderDisplay(myLineup.qualifying_rider_id) }}</strong>
                    </div>

                    <div class="slot-rider-chip chip--race">
                      <div class="chip-header">
                        <span class="chip-type"><i class="fa-solid fa-flag-checkered text-red-500"></i> Gara</span>
                        <span class="chip-pts" *ngIf="getLineupRaceScore() !== null"
                              [class.pts--pos]="getLineupRaceScore()! > 0">
                          {{ formatSignedPoints(getLineupRaceScore()!) }}
                        </span>
                      </div>
                      <strong class="chip-name truncate">{{ getRiderDisplay(myLineup.race_rider_id) }}</strong>
                    </div>
                  </div>
                </div>
                <ng-template #myLineupMissing>
                  <div class="slot-empty-notice">
                    <i class="fa-regular fa-calendar-xmark text-zinc-500"></i>
                    <span>Non hai ancora schierato i piloti per questa gara.</span>
                  </div>
                </ng-template>

                <div class="slot-actions" *ngIf="canEditLineup()">
                  <button
                    mat-button
                    class="slot-action-btn"
                    (click)="goToContextAction('lineups')">
                    <mat-icon>edit</mat-icon>
                    <span>{{ myLineup ? 'Modifica schieramento' : 'Schiera ora' }}</span>
                  </button>
                </div>
              </div>

              <!-- 2. Sprint Bet -->
              <div class="hub-slot-card slot-sprint" [class.slot-done]="!!mySprintBet" [class.slot-missing]="!mySprintBet">
                <div class="slot-head">
                  <div class="slot-badge">
                    <div class="slot-icon-box slot-icon--sprint">
                      <i class="fa-solid fa-bolt"></i>
                    </div>
                    <span class="slot-name">Sprint Bet</span>
                  </div>

                  <div class="slot-head-actions">
                    <span class="slot-status-pill" *ngIf="mySprintBet"
                          [class.status-ok]="isBetSuccessful(mySprintBet)"
                          [class.status-ko]="hasBetOutcome(mySprintBet) && !isBetSuccessful(mySprintBet)"
                          [class.status-pending]="!hasBetOutcome(mySprintBet)">
                      <i [class]="getBetStatusIcon(mySprintBet)"></i>
                      {{ getBetStatusLabel(mySprintBet) }}
                    </span>
                    <span class="slot-status-pill status-ko" *ngIf="!mySprintBet">
                      <i class="fa-solid fa-circle-xmark"></i> Manca
                    </span>
                    <span *ngIf="!canEditSprintBet()" class="slot-lock-indicator" title="Finestra scommesse chiusa">
                      <i class="fa-solid fa-lock"></i>
                    </span>
                  </div>
                </div>

                <div class="slot-content" *ngIf="mySprintBet; else mySprintMissing">
                  <div class="slot-bet-detail">
                    <div class="bet-pick-row">
                      <div class="bet-rider-info min-w-0">
                        <strong class="bet-rider-name truncate">{{ displayRiderName(mySprintBet.rider_id) }}</strong>
                      </div>
                      <span class="bet-target-badge">
                        <i class="fa-solid fa-bullseye text-amber-500"></i>
                        {{ getPositionDisplay(mySprintBet.position) }}
                      </span>
                    </div>

                    <div class="bet-stats-row">
                      <span class="bet-stake-pill">
                        Posta: <strong>{{ mySprintBet.points }} pt</strong>
                      </span>
                      <span class="bet-outcome-pill" *ngIf="hasBetOutcome(mySprintBet)"
                            [class.outcome--won]="isBetSuccessful(mySprintBet)"
                            [class.outcome--lost]="!isBetSuccessful(mySprintBet)">
                        Esito: <strong>{{ formatSignedPoints(getBetDelta(mySprintBet)!) }}</strong>
                      </span>
                      <span class="bet-outcome-pill outcome--pending" *ngIf="!hasBetOutcome(mySprintBet)">
                        <i class="fa-regular fa-clock"></i> In attesa
                      </span>
                    </div>
                  </div>
                </div>
                <ng-template #mySprintMissing>
                  <div class="slot-empty-notice">
                    <i class="fa-solid fa-bolt text-zinc-500"></i>
                    <span>Nessun pronostico inserito per la Sprint.</span>
                  </div>
                </ng-template>

                <div class="slot-actions" *ngIf="canEditSprintBet()">
                  <button
                    mat-button
                    class="slot-action-btn"
                    (click)="goToContextAction('sprint')">
                    <mat-icon>edit</mat-icon>
                    <span>{{ mySprintBet ? 'Modifica sprint bet' : 'Gioca sprint' }}</span>
                  </button>
                </div>
              </div>

              <!-- 3. Race Bet -->
              <div class="hub-slot-card slot-race" [class.slot-done]="!!myRaceBet" [class.slot-missing]="!myRaceBet">
                <div class="slot-head">
                  <div class="slot-badge">
                    <div class="slot-icon-box slot-icon--race">
                      <i class="fa-solid fa-motorcycle"></i>
                    </div>
                    <span class="slot-name">Race Bet</span>
                  </div>

                  <div class="slot-head-actions">
                    <span class="slot-status-pill" *ngIf="myRaceBet"
                          [class.status-ok]="isBetSuccessful(myRaceBet)"
                          [class.status-ko]="hasBetOutcome(myRaceBet) && !isBetSuccessful(myRaceBet)"
                          [class.status-pending]="!hasBetOutcome(myRaceBet)">
                      <i [class]="getBetStatusIcon(myRaceBet)"></i>
                      {{ getBetStatusLabel(myRaceBet) }}
                    </span>
                    <span class="slot-status-pill status-ko" *ngIf="!myRaceBet">
                      <i class="fa-solid fa-circle-xmark"></i> Manca
                    </span>
                    <span *ngIf="!canEditRaceBet()" class="slot-lock-indicator" title="Finestra scommesse chiusa">
                      <i class="fa-solid fa-lock"></i>
                    </span>
                  </div>
                </div>

                <div class="slot-content" *ngIf="myRaceBet; else myRaceMissing">
                  <div class="slot-bet-detail">
                    <div class="bet-pick-row">
                      <div class="bet-rider-info min-w-0">
                        <strong class="bet-rider-name truncate">{{ displayRiderName(myRaceBet.rider_id) }}</strong>
                      </div>
                      <span class="bet-target-badge">
                        <i class="fa-solid fa-bullseye text-rose-500"></i>
                        {{ getPositionDisplay(myRaceBet.position) }}
                      </span>
                    </div>

                    <div class="bet-stats-row">
                      <span class="bet-stake-pill">
                        Posta: <strong>{{ myRaceBet.points }} pt</strong>
                      </span>
                      <span class="bet-outcome-pill" *ngIf="hasBetOutcome(myRaceBet)"
                            [class.outcome--won]="isBetSuccessful(myRaceBet)"
                            [class.outcome--lost]="!isBetSuccessful(myRaceBet)">
                        Esito: <strong>{{ formatSignedPoints(getBetDelta(myRaceBet)!) }}</strong>
                      </span>
                      <span class="bet-outcome-pill outcome--pending" *ngIf="!hasBetOutcome(myRaceBet)">
                        <i class="fa-regular fa-clock"></i> In attesa
                      </span>
                    </div>
                  </div>
                </div>
                <ng-template #myRaceMissing>
                  <div class="slot-empty-notice">
                    <i class="fa-solid fa-motorcycle text-zinc-500"></i>
                    <span>Nessun pronostico inserito per il Gran Premio.</span>
                  </div>
                </ng-template>

                <div class="slot-actions" *ngIf="canEditRaceBet()">
                  <button
                    mat-button
                    class="slot-action-btn"
                    (click)="goToContextAction('race')">
                    <mat-icon>edit</mat-icon>
                    <span>{{ myRaceBet ? 'Modifica race bet' : 'Gioca gara' }}</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- ═══════════ STICKY SECTION ANCHOR BAR ═══════════ -->
          <nav class="sticky-section-nav" aria-label="Navigazione sezioni gara">
            <div class="nav-pills-row">
              <button
                type="button"
                class="nav-pill-btn"
                [class.nav-pill-btn--active]="sectionFilter === 'all'"
                (click)="setSectionFilter('all')">
                <i class="fa-solid fa-layer-group"></i>
                <span>Tutto il Weekend</span>
              </button>

              <button
                type="button"
                class="nav-pill-btn"
                [class.nav-pill-btn--active]="sectionFilter === 'participants'"
                (click)="setSectionFilter('participants')">
                <i class="fa-solid fa-users"></i>
                <span>Fanta-Manager</span>
                <span class="pill-counter" *ngIf="participantCards.length">{{ participantCards.length }}</span>
              </button>

              <button
                type="button"
                class="nav-pill-btn"
                [class.nav-pill-btn--active]="sectionFilter === 'motogp'"
                (click)="setSectionFilter('motogp')">
                <i class="fa-solid fa-trophy"></i>
                <span>Risultati MotoGP</span>
                <span class="pill-counter pill-counter--accent" *ngIf="motogpResults.length">{{ motogpResults.length }}</span>
              </button>

              <!-- Admin actions moved to /admin -->
            </div>
          </nav>

          <!-- ═══════════ SEZIONE 1: FANTA-MANAGER (SCHIERAMENTI & SCOMMESSE) ═══════════ -->
          <section
            class="section-participants"
            id="section-participants"
            *ngIf="sectionFilter === 'all' || sectionFilter === 'participants'">

            <div class="section-title-bar">
              <div class="section-title-left">
                <div class="section-title-icon">
                  <i class="fa-solid fa-users"></i>
                </div>
                <div>
                  <h3 class="section-heading">Tutti i Fanta-Manager</h3>
                  <p class="section-subheading">Confronta schieramenti piloti e scommesse di tutti i partecipanti</p>
                </div>
              </div>

              <!-- View Switcher (Compatta vs Schede) -->
              <div class="view-mode-toggle" aria-label="Modalita di visualizzazione">
                <button
                  type="button"
                  class="view-mode-btn"
                  [class.view-mode-btn--active]="managerViewMode === 'compact'"
                  (click)="managerViewMode = 'compact'; cdr.markForCheck()"
                  title="Vista Tabellare Compatta (Confronto rapido)">
                  <i class="fa-solid fa-table-list"></i>
                  <span>Compatta</span>
                </button>
                <button
                  type="button"
                  class="view-mode-btn"
                  [class.view-mode-btn--active]="managerViewMode === 'cards'"
                  (click)="managerViewMode = 'cards'; cdr.markForCheck()"
                  title="Vista Schede Dettagliate">
                  <i class="fa-solid fa-grip"></i>
                  <span>Schede</span>
                </button>
              </div>
            </div>

            <!-- Controls: Search & Filter Chips -->
            <div class="manager-controls-bar">
              <div class="manager-search-box relative flex items-center">
                <i class="fa-solid fa-magnifying-glass search-icon text-zinc-400 absolute left-3.5 z-10 pointer-events-none"></i>
                <input
                  type="text"
                  [(ngModel)]="managerSearch"
                  placeholder="Cerca per manager o pilota..."
                  aria-label="Cerca manager o pilota"
                  style="padding-left: 2.5rem !important; padding-right: 2.5rem !important;"
                  (input)="cdr.markForCheck()">
                <button
                  type="button"
                  *ngIf="managerSearch"
                  class="search-clear-btn"
                  (click)="managerSearch = ''; cdr.markForCheck()"
                  aria-label="Cancella ricerca">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="manager-filter-chips">
                <button
                  type="button"
                  class="filter-pill"
                  [class.filter-pill--active]="managerFilter === 'all'"
                  (click)="managerFilter = 'all'; cdr.markForCheck()">
                  Tutti ({{ participantCards.length }})
                </button>
                <button
                  type="button"
                  class="filter-pill"
                  [class.filter-pill--active]="managerFilter === 'complete'"
                  (click)="managerFilter = 'complete'; cdr.markForCheck()">
                  <i class="fa-solid fa-check text-emerald-500"></i> Completi 3/3
                </button>
                <button
                  type="button"
                  class="filter-pill"
                  [class.filter-pill--active]="managerFilter === 'incomplete'"
                  (click)="managerFilter = 'incomplete'; cdr.markForCheck()">
                  <i class="fa-solid fa-clock text-amber-500"></i> Incompleti
                </button>
              </div>
            </div>

            <!-- Popular Picks Strip ("Chi ha scelto chi?") -->
            <div class="popular-picks-wrap" *ngIf="popularPicks.length > 0">
              <span class="popular-picks-label">
                <i class="fa-solid fa-fire text-amber-500"></i> Piloti più scelti:
              </span>
              <div class="popular-picks-scroll">
                <button
                  type="button"
                  class="popular-pick-chip"
                  *ngFor="let pick of popularPicks"
                  [class.popular-pick-chip--active]="selectedRiderFilter === pick.riderName"
                  (click)="toggleRiderFilter(pick.riderName)">
                  <span class="pick-num" *ngIf="pick.number">#{{ pick.number }}</span>
                  <span class="pick-name">{{ pick.riderName }}</span>
                  <span class="pick-count">{{ pick.count }}</span>
                </button>
                <button
                  type="button"
                  class="popular-pick-chip popular-pick-chip--clear"
                  *ngIf="selectedRiderFilter"
                  (click)="selectedRiderFilter = null; cdr.markForCheck()">
                  <i class="fa-solid fa-xmark"></i> Reset
                </button>
              </div>
            </div>

            <!-- Availability Note if bets not yet visible -->
            <div class="availability-note" *ngIf="!showSprintBet || !showRaceBet">
              <i class="fa-solid fa-user-shield text-amber-400"></i>
              <div class="availability-copy">
                <strong>Riservatezza dei Pronostici</strong>
                <span *ngIf="!showSprintBet">Le scommesse sprint dei partecipanti diventano visibili 30 minuti prima della Sprint. </span>
                <span *ngIf="!showRaceBet">Le scommesse gara diventano visibili la domenica, alla chiusura ufficiale.</span>
              </div>
            </div>

            <!-- Empty filtered state -->
            <div class="empty-managers-card" *ngIf="filteredParticipantCards.length === 0">
              <i class="fa-solid fa-user-slash"></i>
              <p>Nessun manager corrisponde ai filtri di ricerca.</p>
              <button mat-stroked-button (click)="managerSearch = ''; managerFilter = 'all'; selectedRiderFilter = null; cdr.markForCheck()">
                Reimposta filtri
              </button>
            </div>

            <!-- ═════ VISTA A: MATRICE COMPATTA (CONFRONTO DIRETTO AD ALTA DENSITÀ) ═════ -->
            <div class="manager-matrix-list" *ngIf="filteredParticipantCards.length > 0 && managerViewMode === 'compact'">
              <article
                class="matrix-row-card"
                *ngFor="let card of filteredParticipantCards; trackBy: trackByParticipantId"
                [class.matrix-row-card--me]="card.isMe">

                <!-- Row Header: Manager Identity + Total Points -->
                <div class="matrix-row-head">
                  <div class="matrix-manager-info">
                    <div class="matrix-avatar">
                      <img *ngIf="card.userAvatar" [src]="card.userAvatar" alt="{{ card.userName }}" (error)="assetService.handleManagerError($event)">
                      <span *ngIf="!card.userAvatar">{{ card.userName.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="matrix-manager-text">
                      <div class="matrix-name-row">
                        <strong class="matrix-name">{{ card.userName }}</strong>
                        <span class="matrix-me-tag" *ngIf="card.isMe">Tu</span>
                      </div>
                      <span class="matrix-status-text">
                        <i class="fa-solid" [class.fa-check]="card.completedCount === 3" [class.fa-clock]="card.completedCount < 3"></i>
                        {{ card.completedCount === 3 ? '3/3 completato' : card.completedCount + '/3 giocate' }}
                      </span>
                    </div>
                  </div>

                  <div class="matrix-head-score">
                    <span
                      class="matrix-score-pill"
                      *ngIf="card.totalPointsDelta !== null"
                      [class.score-pos]="card.totalPointsDelta > 0"
                      [class.score-neg]="card.totalPointsDelta < 0"
                      [class.score-zero]="card.totalPointsDelta === 0">
                      {{ formatSignedPoints(card.totalPointsDelta) }}
                    </span>
                  </div>
                </div>

                <!-- Row Columns: 3 High-Density Comparative Slots -->
                <div class="matrix-picks-grid">
                  <!-- Col 1: Rosa Piloti -->
                  <div class="matrix-pick-col">
                    <div class="col-kicker">
                      <i class="fa-solid fa-flag-checkered text-red-500"></i>
                      <span>Rosa</span>
                      <strong class="col-points" *ngIf="card.lineupScore !== null">{{ formatSignedPoints(card.lineupScore) }}</strong>
                    </div>

                    <div class="col-content" *ngIf="card.lineup; else matrixLineupEmpty">
                      <div class="matrix-rider-pill">
                        <span class="matrix-tag-prefix">Q</span>
                        <span class="matrix-rider-name truncate">{{ card.qualifyingRiderName || getRiderDisplay(card.lineup.qualifying_rider_id) }}</span>
                        <span class="matrix-rider-pts" *ngIf="card.qualifyingScore !== null && card.qualifyingScore !== undefined">({{ formatSignedPoints(card.qualifyingScore) }})</span>
                      </div>
                      <div class="matrix-rider-pill">
                        <span class="matrix-tag-prefix">R</span>
                        <span class="matrix-rider-name truncate">{{ card.raceRiderName || getRiderDisplay(card.lineup.race_rider_id) }}</span>
                        <span class="matrix-rider-pts" *ngIf="card.raceScore !== null && card.raceScore !== undefined">({{ formatSignedPoints(card.raceScore) }})</span>
                      </div>
                      <div class="auto-note" *ngIf="card.lineup.automatically_inserted">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Auto
                      </div>
                    </div>
                    <ng-template #matrixLineupEmpty>
                      <span class="matrix-empty-pill">— Non schierato</span>
                    </ng-template>
                  </div>

                  <!-- Col 2: Sprint Bet -->
                  <div class="matrix-pick-col">
                    <div class="col-kicker">
                      <i class="fa-solid fa-bolt text-amber-500"></i>
                      <span>Sprint</span>
                    </div>

                    <div class="col-content" *ngIf="showSprintBet; else matrixSprintLocked">
                      <div class="matrix-bet-cell" *ngIf="card.sprintBet; else matrixSprintEmpty">
                        <div class="matrix-bet-pick">
                          <strong class="truncate">{{ card.sprintBetRiderName || displayRiderName(card.sprintBet.rider_id) }}</strong>
                          <span class="bet-pos-mini">{{ getPositionDisplay(card.sprintBet.position) }}</span>
                        </div>
                        <div class="matrix-bet-result" [ngClass]="getOutcomeTagClass(card.sprintBet)">
                          <i [class]="getBetStatusIcon(card.sprintBet)"></i>
                          <span>{{ getBetDeltaLabel(card.sprintBet) }}</span>
                        </div>
                      </div>
                      <ng-template #matrixSprintEmpty>
                        <span class="matrix-empty-pill">— Assente</span>
                      </ng-template>
                    </div>
                    <ng-template #matrixSprintLocked>
                      <span class="matrix-locked-pill"><i class="fa-solid fa-lock"></i> Riservata</span>
                    </ng-template>
                  </div>

                  <!-- Col 3: Race Bet -->
                  <div class="matrix-pick-col">
                    <div class="col-kicker">
                      <i class="fa-solid fa-motorcycle text-red-500"></i>
                      <span>Gara</span>
                    </div>

                    <div class="col-content" *ngIf="showRaceBet; else matrixRaceLocked">
                      <div class="matrix-bet-cell" *ngIf="card.raceBet; else matrixRaceEmpty">
                        <div class="matrix-bet-pick">
                          <strong class="truncate">{{ card.raceBetRiderName || displayRiderName(card.raceBet.rider_id) }}</strong>
                          <span class="bet-pos-mini">{{ getPositionDisplay(card.raceBet.position) }}</span>
                        </div>
                        <div class="matrix-bet-result" [ngClass]="getOutcomeTagClass(card.raceBet)">
                          <i [class]="getBetStatusIcon(card.raceBet)"></i>
                          <span>{{ getBetDeltaLabel(card.raceBet) }}</span>
                        </div>
                      </div>
                      <ng-template #matrixRaceEmpty>
                        <span class="matrix-empty-pill">— Assente</span>
                      </ng-template>
                    </div>
                    <ng-template #matrixRaceLocked>
                      <span class="matrix-locked-pill"><i class="fa-solid fa-lock"></i> Riservata</span>
                    </ng-template>
                  </div>
                </div>
              </article>
            </div>

            <!-- ═════ VISTA B: SCHEDE DETTAGLIATE ═════ -->
            <div class="manager-cards-grid" *ngIf="filteredParticipantCards.length > 0 && managerViewMode === 'cards'">
              <article
                class="manager-card"
                *ngFor="let card of filteredParticipantCards; trackBy: trackByParticipantId"
                [class.manager-card--me]="card.isMe">
                <header class="manager-card-head">
                  <div class="manager-ident">
                    <div class="manager-avatar-wrap">
                      <img *ngIf="card.userAvatar" [src]="card.userAvatar" alt="{{ card.userName }}" class="manager-avatar-img" (error)="assetService.handleManagerError($event)">
                      <span *ngIf="!card.userAvatar" class="manager-avatar-initial">{{ card.userName.charAt(0).toUpperCase() }}</span>
                    </div>
                    <div class="manager-name-wrap">
                      <div class="manager-name-row">
                        <strong class="manager-name">{{ card.userName }}</strong>
                        <span class="me-badge" *ngIf="card.isMe">Tu</span>
                      </div>
                      <span class="manager-completion-text">
                        {{ card.completedCount }}/3 giocate completate
                      </span>
                    </div>
                  </div>

                  <div class="manager-head-meta">
                    <span
                      class="manager-score-pill"
                      *ngIf="card.totalPointsDelta !== null"
                      [class.score-positive]="card.totalPointsDelta > 0"
                      [class.score-negative]="card.totalPointsDelta < 0"
                      [class.score-neutral]="card.totalPointsDelta === 0">
                      {{ formatSignedPoints(card.totalPointsDelta) }}
                    </span>
                    <span class="manager-status-pill" [class.status-pill--done]="card.completedCount === 3">
                      <i class="fa-solid" [class.fa-circle-check]="card.completedCount === 3" [class.fa-clock]="card.completedCount < 3"></i>
                      {{ card.completedCount === 3 ? 'Completo' : card.completedCount + '/3' }}
                    </span>
                  </div>
                </header>

                <div class="manager-card-body">
                  <!-- 1. Schieramento Rosa -->
                  <div class="manager-section-block">
                    <div class="section-block-label">
                      <span><i class="fa-solid fa-flag-checkered text-red-500"></i> Schieramento Rosa</span>
                      <span class="block-score" *ngIf="card.lineupScore !== null">{{ formatSignedPoints(card.lineupScore) }}</span>
                    </div>
                    <div class="section-block-content" *ngIf="card.lineup; else lineupMissing">
                      <div class="rider-line-pair">
                        <div class="rider-pill-item">
                          <span class="pill-kicker">Qualifica</span>
                          <span class="pill-value truncate">{{ card.qualifyingRiderName || getRiderDisplay(card.lineup.qualifying_rider_id) }}</span>
                        </div>
                        <div class="rider-pill-item">
                          <span class="pill-kicker">Gara</span>
                          <span class="pill-value truncate">{{ card.raceRiderName || getRiderDisplay(card.lineup.race_rider_id) }}</span>
                        </div>
                      </div>
                      <div class="auto-inserted-note" *ngIf="card.lineup.automatically_inserted">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> Auto-inserita (non fa punteggio)
                      </div>
                    </div>
                    <ng-template #lineupMissing>
                      <div class="section-empty-msg"><i class="fa-regular fa-circle-xmark"></i> Non schierato</div>
                    </ng-template>
                  </div>

                  <!-- 2. Sprint Bet -->
                  <div class="manager-section-block">
                    <div class="section-block-label">
                      <span><i class="fa-solid fa-gauge-high text-amber-500"></i> Sprint Bet</span>
                    </div>
                    <div class="section-block-content" *ngIf="showSprintBet; else sprintHidden">
                      <div class="bet-info-row" *ngIf="card.sprintBet; else sprintMissing">
                        <div class="bet-pick-main">
                          <span class="bet-rider truncate">
                            <mat-icon>sports_motorsports</mat-icon>
                            {{ card.sprintBetRiderName || displayRiderName(card.sprintBet.rider_id) }}
                          </span>
                          <span class="bet-pos-badge">{{ getPositionDisplay(card.sprintBet.position) }}</span>
                          <span class="bet-stake-pill">{{ card.sprintBet.points }} pt</span>
                        </div>
                        <div class="bet-outcome-tag" [ngClass]="getOutcomeTagClass(card.sprintBet)">
                          <i [class]="getBetStatusIcon(card.sprintBet)"></i>
                          <span>{{ getBetDeltaLabel(card.sprintBet) }}</span>
                        </div>
                      </div>
                      <ng-template #sprintMissing>
                        <div class="section-empty-msg"><i class="fa-regular fa-circle-xmark"></i> Nessun pronostico</div>
                      </ng-template>
                    </div>
                    <ng-template #sprintHidden>
                      <div class="section-locked-msg"><i class="fa-solid fa-lock"></i> Riservata fino a 30m prima</div>
                    </ng-template>
                  </div>

                  <!-- 3. Race Bet -->
                  <div class="manager-section-block">
                    <div class="section-block-label">
                      <span><i class="fa-solid fa-motorcycle text-red-500"></i> Race Bet</span>
                    </div>
                    <div class="section-block-content" *ngIf="showRaceBet; else raceHidden">
                      <div class="bet-info-row" *ngIf="card.raceBet; else raceMissing">
                        <div class="bet-pick-main">
                          <span class="bet-rider truncate">
                            <mat-icon>sports_motorsports</mat-icon>
                            {{ card.raceBetRiderName || displayRiderName(card.raceBet.rider_id) }}
                          </span>
                          <span class="bet-pos-badge">{{ getPositionDisplay(card.raceBet.position) }}</span>
                          <span class="bet-stake-pill">{{ card.raceBet.points }} pt</span>
                        </div>
                        <div class="bet-outcome-tag" [ngClass]="getOutcomeTagClass(card.raceBet)">
                          <i [class]="getBetStatusIcon(card.raceBet)"></i>
                          <span>{{ getBetDeltaLabel(card.raceBet) }}</span>
                        </div>
                      </div>
                      <ng-template #raceMissing>
                        <div class="section-empty-msg"><i class="fa-regular fa-circle-xmark"></i> Nessun pronostico</div>
                      </ng-template>
                    </div>
                    <ng-template #raceHidden>
                      <div class="section-locked-msg"><i class="fa-solid fa-lock"></i> Riservata fino a chiusura scommesse</div>
                    </ng-template>
                  </div>
                </div>
              </article>
            </div>
          </section>

          <!-- ═══════════ SEZIONE 2: RISULTATI MOTOGP REALI ═══════════ -->
          <section
            class="motogp-section"
            id="section-motogp"
            *ngIf="sectionFilter === 'all' || sectionFilter === 'motogp'">

            <div class="motogp-top-strip">
              <div>
                <span class="strip-kicker">Classifiche Ufficiali DORNA</span>
                <h3 class="strip-title">Risultati Reali del Gran Premio</h3>
              </div>
              <button mat-stroked-button class="motogp-hub-btn" (click)="goToMotoGPResults()">
                <i class="fa-solid fa-gauge-high"></i>
                <span>Centro Risultati Completo</span>
                <i class="fa-solid fa-arrow-right"></i>
              </button>
            </div>

            <!-- Empty state if no motogp results stored yet -->
            <div class="empty-motogp-card" *ngIf="motogpResults.length === 0">
              <i class="fa-solid fa-flag-checkered empty-motogp-icon"></i>
              <h4>Risultati MotoGP non ancora disponibili</h4>
              <p>I risultati ufficiali di Qualifiche, Sprint e Gara appariranno qui al termine delle sessioni in pista.</p>
              
            </div>

            <!-- Session filter switcher (Gara, Sprint, Qualifiche) -->
            <div class="session-filter-strip" *ngIf="motogpResults.length > 0">
              <button
                type="button"
                class="session-filter-btn"
                [class.session-filter-btn--active]="motogpSessionFilter === 'race'"
                (click)="setMotoGPSessionFilter('race')">
                <i class="fa-solid fa-flag-checkered text-red-500"></i>
                <span>Gara Gran Premio</span>
              </button>
              <button
                type="button"
                class="session-filter-btn"
                [class.session-filter-btn--active]="motogpSessionFilter === 'sprint'"
                (click)="setMotoGPSessionFilter('sprint')">
                <i class="fa-solid fa-bolt text-amber-400"></i>
                <span>Sprint Race</span>
              </button>
              <button
                type="button"
                class="session-filter-btn"
                [class.session-filter-btn--active]="motogpSessionFilter === 'qualifying'"
                (click)="setMotoGPSessionFilter('qualifying')">
                <i class="fa-solid fa-stopwatch text-sky-400"></i>
                <span>Griglia Qualifiche</span>
              </button>
            </div>

            <!-- PODIUM (Top 3) -->
            <div class="motogp-podium-grid" *ngIf="topThreeMotoGP.length > 0">
              <div
                class="podium-item"
                *ngFor="let res of topThreeMotoGP; let idx = index"
                [ngClass]="'podium-item--' + (idx + 1)">
                <div class="podium-rank-badge">
                  <span>P{{ motogpSessionFilter === 'race' ? (res.race_position || (idx + 1)) : (motogpSessionFilter === 'sprint' ? (res.sprint_position || (idx + 1)) : (res.qualifying_scoring_position || res.qualifying_position || (idx + 1))) }}</span>
                </div>
                <div class="podium-rider-photo">
                  <img
                    [src]="assetService.getRiderPhotoUrl(res.rider_id.number, res.rider_id.first_name + ' ' + res.rider_id.last_name)"
                    [alt]="getRiderDisplay(res.rider_id)"
                    (error)="assetService.handleImageError($event)">
                </div>
                <div class="podium-rider-info">
                  <span class="podium-number">#{{ res.rider_id.number }}</span>
                  <strong class="podium-name">{{ getRiderDisplay(res.rider_id) }}</strong>
                  <span class="podium-team" *ngIf="getRiderTeamName(res.rider_id)">{{ getRiderTeamName(res.rider_id) }}</span>
                </div>
                <div class="podium-points-badge" *ngIf="motogpSessionFilter === 'race' && res.race_points !== null && res.race_points !== undefined">
                  <strong>+{{ res.race_points }}</strong> <span>pt</span>
                </div>
                <div class="podium-points-badge" *ngIf="motogpSessionFilter === 'sprint' && res.sprint_points !== null && res.sprint_points !== undefined">
                  <strong>+{{ res.sprint_points }}</strong> <span>pt</span>
                </div>
                <div class="podium-points-badge" *ngIf="motogpSessionFilter === 'qualifying'">
                  <strong>Grid</strong>
                </div>
              </div>
            </div>

            <!-- FULL CLASSIFICATION TABLE / LIST -->
            <div class="motogp-classification-card" *ngIf="sortedMotoGPResults.length > 0">
              <div class="class-head">
                <div class="class-head-col col-pos">Pos</div>
                <div class="class-head-col col-rider">Pilota & Team</div>
                <div class="class-head-col col-quali">Qualifica</div>
                <div class="class-head-col col-sprint">Sprint</div>
                <div class="class-head-col col-race">Gara</div>
              </div>

              <div class="class-rows">
                <div
                  class="class-row"
                  *ngFor="let res of sortedMotoGPResults; trackBy: trackByMotoGPResult"
                  [class.is-podium]="(res.race_position ?? 99) <= 3">
                  <div class="class-col col-pos">
                    <span class="pos-badge" [class.pos-p1]="res.race_position === 1" [class.pos-p2]="res.race_position === 2" [class.pos-p3]="res.race_position === 3">
                      {{ res.race_position ? 'P' + res.race_position : '—' }}
                    </span>
                  </div>

                  <div class="class-col col-rider">
                    <div class="class-rider-thumb">
                      <img
                        [src]="assetService.getRiderPhotoUrl(res.rider_id.number, res.rider_id.first_name + ' ' + res.rider_id.last_name)"
                        [alt]="getRiderDisplay(res.rider_id)"
                        (error)="assetService.handleImageError($event)">
                    </div>
                    <div class="class-rider-meta truncate">
                      <span class="rider-full-name truncate">
                        <strong class="rider-num">#{{ res.rider_id.number }}</strong> {{ getRiderDisplay(res.rider_id) }}
                      </span>
                      <span class="rider-team-name truncate" *ngIf="getRiderTeamName(res.rider_id)">
                        {{ getRiderTeamName(res.rider_id) }}
                      </span>
                    </div>
                  </div>

                  <div class="class-col col-quali">
                    <span class="session-val">
                      {{ res.qualifying_position ? 'P' + res.qualifying_position : '—' }}
                    </span>
                    <span class="session-scoring-sub" *ngIf="res.qualifying_scoring_position">
                      Scoring P{{ res.qualifying_scoring_position }}
                    </span>
                  </div>

                  <div class="class-col col-sprint">
                    <span class="session-val" *ngIf="res.sprint_position">P{{ res.sprint_position }}</span>
                    <span class="session-pts" *ngIf="res.sprint_points">+{{ res.sprint_points }} pt</span>
                    <span class="session-none" *ngIf="!res.sprint_position">—</span>
                  </div>

                  <div class="class-col col-race">
                    <span class="session-val" *ngIf="res.race_position">P{{ res.race_position }}</span>
                    <span class="session-pts session-pts--race" *ngIf="res.race_points">+{{ res.race_points }} pt</span>
                    <span class="session-none" *ngIf="!res.race_position">—</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Admin section moved to /admin -->
        </div>
      </main>

      <!-- ═══════════ FLOATING SCROLL TO TOP ACTION ═══════════ -->
      <button
        type="button"
        class="floating-scroll-top"
        *ngIf="showScrollTop"
        (click)="scrollToTop()"
        aria-label="Torna in cima alla pagina">
        <i class="fa-solid fa-arrow-up"></i>
        <span>Torna su</span>
      </button>
    </div>
  `
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  raceName = '';

  sectionFilter: 'all' | 'participants' | 'motogp' | 'admin' = 'all';
  managerViewMode: 'compact' | 'cards' = 'compact';
  managerSearch = '';
  managerFilter: 'all' | 'complete' | 'incomplete' = 'all';
  selectedRiderFilter: string | null = null;
  showScrollTop = false;

  get activeTab(): 'hub' | 'participants' | 'motogp' | 'admin' {
    if (this.sectionFilter === 'participants') return 'participants';
    if (this.sectionFilter === 'motogp') return 'motogp';
    if (this.sectionFilter === 'admin') return 'admin';
    return 'hub';
  }
  set activeTab(tab: 'hub' | 'participants' | 'motogp' | 'admin') {
    if (tab === 'hub') this.sectionFilter = 'all';
    else this.sectionFilter = tab;
  }

  lineupColumns: string[] = ['user', 'qualifying_rider','race_rider', 'modified_at'];
  sprintColumns: string[] = ['user', 'rider', 'position', 'points', 'outcome', 'modified_at'];
  betColumns: string[] = ['user', 'rider', 'position', 'points', 'outcome', 'modified_at'];

  lineups: LineupsResult[] = [];
  sprints: BetResult[] = [];
  bets: BetResult[] = [];
  motogpResults: MotoGPStoredResult[] = [];
  motogpSessionFilter: 'race' | 'sprint' | 'qualifying' = 'race';
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
    private i18nService: I18nService,
    private navService: NavigationService,
    public theme: ThemeService,
    public assetService: MotoGPAssetService,
    public cdr: ChangeDetectorRef
  ) { this.checkScreen(); }

  private resizeTimer: any = null;
  @HostListener('window:resize') onResize() {
    if (this.resizeTimer) return;
    this.resizeTimer = setTimeout(() => {
      this.checkScreen();
      this.resizeTimer = null;
    }, 150);
  }
  private checkScreen() { this.isMobile = window.innerWidth <= 820; }

  @HostListener('window:scroll') onWindowScroll() {
    this.showScrollTop = window.scrollY > 480;
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    const requestedTab = this.route.snapshot.queryParamMap.get('tab') as any;
    if (['hub', 'participants', 'motogp', 'admin'].includes(requestedTab)) {
      this.activeTab = requestedTab;
    }
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (!champId || !this.raceId) { this.loading = false; this.cdr.markForCheck(); return; }

      // Data
      this.raceDetailService.getRaceDetails(champId, this.raceId!, { allUsers: true, allCalendar: false }).subscribe({
        next: (data) => {
          this.lineups = data.lineups ?? [];
          this.sprints = data.sprints ?? [];
          this.bets = data.bets ?? [];
          this.setMotoGPResults(data.motogpResults ?? []);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => { console.error('Error fetching race details:', err); this.loading = false; this.cdr.markForCheck(); }
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
              this.cdr.markForCheck();
            },
            error: (err) => { console.error('Error fetching championship config:', err); this.cdr.markForCheck(); }
          });
        },
        error: (err) => { console.error('Error fetching race info:', err); this.cdr.markForCheck(); }
      });
    });
  }

  // Navigation & section jumping
  setSectionFilter(filter: 'all' | 'participants' | 'motogp' | 'admin'): void {
    this.sectionFilter = filter;
    if (filter !== 'all') {
      setTimeout(() => {
        this.scrollToSection(`section-${filter}`);
      }, 50);
    }
    this.cdr.markForCheck();
  }

  scrollToSection(sectionId: string): void {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleRiderFilter(riderName: string): void {
    if (this.selectedRiderFilter === riderName) {
      this.selectedRiderFilter = null;
    } else {
      this.selectedRiderFilter = riderName;
    }
    this.cdr.markForCheck();
  }

  get popularPicks(): { riderName: string; number?: string | number; count: number }[] {
    const map = new Map<string, { riderName: string; number?: string | number; count: number }>();

    for (const card of this.participantCards) {
      if (card.lineup?.qualifying_rider_id) {
        const r = card.lineup.qualifying_rider_id as any;
        const name = this.displayRiderName(r);
        if (name && name !== 'N/A') {
          const item = map.get(name) || { riderName: name, number: r?.number, count: 0 };
          item.count++;
          map.set(name, item);
        }
      }
      if (card.lineup?.race_rider_id) {
        const r = card.lineup.race_rider_id as any;
        const name = this.displayRiderName(r);
        if (name && name !== 'N/A') {
          const item = map.get(name) || { riderName: name, number: r?.number, count: 0 };
          item.count++;
          map.set(name, item);
        }
      }
      if (this.showSprintBet && card.sprintBet?.rider_id) {
        const r = card.sprintBet.rider_id as any;
        const name = this.displayRiderName(r);
        if (name && name !== 'N/A') {
          const item = map.get(name) || { riderName: name, number: r?.number, count: 0 };
          item.count++;
          map.set(name, item);
        }
      }
      if (this.showRaceBet && card.raceBet?.rider_id) {
        const r = card.raceBet.rider_id as any;
        const name = this.displayRiderName(r);
        if (name && name !== 'N/A') {
          const item = map.get(name) || { riderName: name, number: r?.number, count: 0 };
          item.count++;
          map.set(name, item);
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
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

  get myTotalDelta(): number | null {
    const sDelta = this.getBetDelta(this.mySprintBet);
    const rDelta = this.getBetDelta(this.myRaceBet);
    const lScore = this.getLineupTotalScore();

    if (sDelta === null && rDelta === null && lScore === null) return null;
    return (sDelta ?? 0) + (rDelta ?? 0) + (lScore ?? 0);
  }

  get personalCompletionLabel(): string {
    const completed = [this.myLineup, this.mySprintBet, this.myRaceBet].filter(Boolean).length;
    if (completed === 3) return 'Hai completato tutto';
    if (completed === 0) return 'Ti manca ancora tutto';
    return `${completed}/3 azioni completate`;
  }

  get personalCompletionPercent(): number {
    const completed = [this.myLineup, this.mySprintBet, this.myRaceBet].filter(Boolean).length;
    return Math.round((completed / 3) * 100);
  }

  isMe(user: any): boolean {
    return !!user && user.id === this.authService.getUserId();
  }

  getVisibleResultsSummary(): string {
    const sections: string[] = [];
    if (this.showLineups) sections.push(`L ${this.lineups.length}`);
    if (this.showSprintBet) sections.push(`S ${this.sprints.length}`);
    if (this.showRaceBet) sections.push(`R ${this.bets.length}`);
    return sections.length ? sections.join(' · ') : 'Nessun risultato disponibile';
  }

  setActiveTab(tab: 'hub' | 'participants' | 'motogp' | 'admin'): void {
    this.activeTab = tab;
    this.cdr.markForCheck();
  }

  goToMotoGPResults(): void {
    if (this.calendarRace) {
      const targetRound = this.calendarRace.race_order || this.calendarRace.race_id?.id || this.calendarRace.id;
      this.router.navigate(['/motogp-results'], { queryParams: { round: targetRound } });
    } else {
      this.router.navigate(['/motogp-results']);
    }
  }

  getOutcomeTagClass(bet: BetResult | null | undefined): string {
    if (!bet || !this.hasBetOutcome(bet)) return 'outcome-tag--pending';
    return this.isBetSuccessful(bet) ? 'outcome-tag--win' : 'outcome-tag--loss';
  }

  getParticipantLineupTotalScore(lineup: LineupsResult | null): number | null {
    if (!lineup) return null;
    const qRiderId = Number((lineup.qualifying_rider_id as any)?.id ?? lineup.qualifying_rider_id);
    const rRiderId = Number((lineup.race_rider_id as any)?.id ?? lineup.race_rider_id);

    let qScore: number | null = null;
    let rScore: number | null = null;
    if (qRiderId) {
      const qRes = this.findMotoGpResultByRider(qRiderId);
      if (qRes) qScore = Number(qRes.qualifying_scoring_points ?? qRes.qualifying_points ?? 0);
    }
    if (rRiderId) {
      const rRes = this.findMotoGpResultByRider(rRiderId);
      if (rRes) rScore = Number(rRes.race_points ?? 0);
    }
    if (qScore === null && rScore === null) return null;
    return (qScore ?? 0) + (rScore ?? 0);
  }

  get participantCards(): ParticipantCard[] {
    const userMap = new Map<string | number, { id: string | number; name: string; avatar?: string | null }>();

    const recordUser = (user: any) => {
      if (!user) return;
      const id = user.id ?? user.email;
      if (id == null) return;
      if (!userMap.has(id)) {
        userMap.set(id, {
          id,
          name: this.displayUser(user),
          avatar: user.profile_image || user.avatar_url || user.avatar || null
        });
      }
    };

    this.lineups.forEach(l => recordUser(l?.user_id));
    this.sprints.forEach(s => recordUser(s?.user_id));
    this.bets.forEach(b => recordUser(b?.user_id));

    const currentUserId = this.authService.getUserId();

    const cards: ParticipantCard[] = Array.from(userMap.values()).map(u => {
      const lineup = this.lineups.find(l => (l?.user_id?.id ?? l?.user_id?.email) === u.id) ?? null;
      const sprintBet = this.sprints.find(s => (s?.user_id?.id ?? s?.user_id?.email) === u.id) ?? null;
      const raceBet = this.bets.find(b => (b?.user_id?.id ?? b?.user_id?.email) === u.id) ?? null;

      const completedCount = [lineup, sprintBet, raceBet].filter(Boolean).length;

      const sDelta = this.getBetDelta(sprintBet);
      const rDelta = this.getBetDelta(raceBet);
      const lineupScore = this.getParticipantLineupTotalScore(lineup);

      let totalPointsDelta: number | null = null;
      if (sDelta !== null || rDelta !== null || lineupScore !== null) {
        totalPointsDelta = (sDelta ?? 0) + (rDelta ?? 0) + (lineupScore ?? 0);
      }

      const qRider = lineup?.qualifying_rider_id as any;
      const rRider = lineup?.race_rider_id as any;
      const sRider = sprintBet?.rider_id as any;
      const raceBetRider = raceBet?.rider_id as any;

      const qualifyingRiderName = qRider ? this.displayRiderName(qRider) : undefined;
      const raceRiderName = rRider ? this.displayRiderName(rRider) : undefined;
      const sprintBetRiderName = sRider ? this.displayRiderName(sRider) : undefined;
      const raceBetRiderName = raceBetRider ? this.displayRiderName(raceBetRider) : undefined;

      const qualifyingRiderNumber = qRider?.number;
      const raceRiderNumber = rRider?.number;
      const sprintBetRiderNumber = sRider?.number;
      const raceBetRiderNumber = raceBetRider?.number;

      let qualifyingScore: number | null = null;
      let raceScore: number | null = null;
      if (qRider) {
        const qId = Number(qRider.id ?? qRider);
        const qRes = this.findMotoGpResultByRider(qId);
        if (qRes) qualifyingScore = Number(qRes.qualifying_scoring_points ?? qRes.qualifying_points ?? 0);
      }
      if (rRider) {
        const rId = Number(rRider.id ?? rRider);
        const rRes = this.findMotoGpResultByRider(rId);
        if (rRes) raceScore = Number(rRes.race_points ?? 0);
      }

      return {
        userId: u.id,
        userName: u.name,
        userAvatar: u.avatar,
        isMe: u.id === currentUserId,
        lineup,
        sprintBet,
        raceBet,
        completedCount,
        totalPointsDelta,
        lineupScore,
        qualifyingRiderName,
        raceRiderName,
        sprintBetRiderName,
        raceBetRiderName,
        qualifyingRiderNumber,
        raceRiderNumber,
        sprintBetRiderNumber,
        raceBetRiderNumber,
        qualifyingScore,
        raceScore
      };
    });

    return cards.sort((a, b) => {
      if (a.isMe) return -1;
      if (b.isMe) return 1;
      return a.userName.localeCompare(b.userName);
    });
  }

  get filteredParticipantCards(): ParticipantCard[] {
    const list = this.participantCards;
    const term = (this.managerSearch || '').trim().toLowerCase();
    const riderFilter = (this.selectedRiderFilter || '').trim().toLowerCase();

    return list.filter(card => {
      // Rider filter from popular picks
      if (riderFilter) {
        const matchQuali = (card.qualifyingRiderName || '').toLowerCase().includes(riderFilter);
        const matchRace = (card.raceRiderName || '').toLowerCase().includes(riderFilter);
        const matchSprint = this.showSprintBet && (card.sprintBetRiderName || '').toLowerCase().includes(riderFilter);
        const matchRaceBet = this.showRaceBet && (card.raceBetRiderName || '').toLowerCase().includes(riderFilter);
        if (!matchQuali && !matchRace && !matchSprint && !matchRaceBet) {
          return false;
        }
      }

      // Search term
      if (term) {
        const matchUser = card.userName.toLowerCase().includes(term);
        const matchQuali = (card.qualifyingRiderName || '').toLowerCase().includes(term);
        const matchRace = (card.raceRiderName || '').toLowerCase().includes(term);
        const matchSprint = this.showSprintBet && (card.sprintBetRiderName || '').toLowerCase().includes(term);
        const matchRaceBet = this.showRaceBet && (card.raceBetRiderName || '').toLowerCase().includes(term);
        if (!matchUser && !matchQuali && !matchRace && !matchSprint && !matchRaceBet) {
          return false;
        }
      }

      if (this.managerFilter === 'complete' && card.completedCount < 3) {
        return false;
      }
      if (this.managerFilter === 'incomplete' && card.completedCount === 3) {
        return false;
      }
      return true;
    });
  }

  setMotoGPSessionFilter(filter: 'race' | 'sprint' | 'qualifying'): void {
    this.motogpSessionFilter = filter;
    this.cdr.markForCheck();
  }

  get topThreeMotoGP(): MotoGPStoredResult[] {
    if (!this.motogpResults || !this.motogpResults.length) return [];
    if (this.motogpSessionFilter === 'sprint') {
      const withSprintPos = this.motogpResults.filter(r => r.sprint_position != null && r.sprint_position > 0);
      return [...withSprintPos].sort((a, b) => (a.sprint_position ?? 99) - (b.sprint_position ?? 99)).slice(0, 3);
    }
    if (this.motogpSessionFilter === 'qualifying') {
      const withQualPos = this.motogpResults.filter(r => (r.qualifying_scoring_position ?? r.qualifying_position) != null && (r.qualifying_scoring_position ?? r.qualifying_position ?? 0) > 0);
      return [...withQualPos].sort((a, b) => {
        const qA = a.qualifying_scoring_position ?? a.qualifying_position ?? 999;
        const qB = b.qualifying_scoring_position ?? b.qualifying_position ?? 999;
        return qA - qB;
      }).slice(0, 3);
    }
    const withRacePos = this.motogpResults.filter(r => r.race_position != null && r.race_position > 0);
    if (withRacePos.length >= 3) {
      return [...withRacePos].sort((a, b) => (a.race_position ?? 99) - (b.race_position ?? 99)).slice(0, 3);
    }
    return [...this.motogpResults].sort((a, b) => {
      const rA = a.race_position ?? 999;
      const rB = b.race_position ?? 999;
      if (rA !== rB) return rA - rB;
      const qA = a.qualifying_scoring_position ?? a.qualifying_position ?? 999;
      const qB = b.qualifying_scoring_position ?? b.qualifying_position ?? 999;
      return qA - qB;
    }).slice(0, 3);
  }

  get sortedMotoGPResults(): MotoGPStoredResult[] {
    if (!this.motogpResults || !this.motogpResults.length) return [];
    if (this.motogpSessionFilter === 'sprint') {
      return [...this.motogpResults].sort((a, b) => {
        const sA = a.sprint_position ?? 999;
        const sB = b.sprint_position ?? 999;
        if (sA !== sB) return sA - sB;
        return (a.race_position ?? 999) - (b.race_position ?? 999);
      });
    }
    if (this.motogpSessionFilter === 'qualifying') {
      return [...this.motogpResults].sort((a, b) => {
        const qA = a.qualifying_scoring_position ?? a.qualifying_position ?? 999;
        const qB = b.qualifying_scoring_position ?? b.qualifying_position ?? 999;
        return qA - qB;
      });
    }
    return [...this.motogpResults].sort((a, b) => {
      const rA = a.race_position ?? 999;
      const rB = b.race_position ?? 999;
      if (rA !== rB) return rA - rB;
      const qA = a.qualifying_scoring_position ?? a.qualifying_position ?? 999;
      const qB = b.qualifying_scoring_position ?? b.qualifying_position ?? 999;
      return qA - qB;
    });
  }

  trackByParticipantId = (_: number, card: ParticipantCard) => card.userId;

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

  get actionHubState(): {
    title: string;
    subtitle: string;
    statusBadge: string;
    statusType: 'urgent' | 'active' | 'done' | 'closed';
    buttonLabel?: string;
    buttonIcon?: string;
    actionKind?: 'lineups' | 'sprint' | 'race';
  } {
    if (this.calendarRace?.cancelled) {
      return {
        title: 'Gara Cancellata',
        subtitle: 'Questo Gran Premio è stato annullato dal calendario ufficiale.',
        statusBadge: 'Cancellata',
        statusType: 'closed'
      };
    }

    const canLineup = this.canEditLineup();
    const canSprint = this.canEditSprintBet();
    const canRace = this.canEditRaceBet();

    // 1. Lineup window is open
    if (canLineup) {
      if (!this.myLineup) {
        return {
          title: 'Schieramento Piloti Aperto',
          subtitle: 'Scegli il pilota per la qualifica e per la gara prima della chiusura.',
          statusBadge: 'Azione richiesta',
          statusType: 'urgent',
          buttonLabel: 'Schiera i tuoi piloti',
          buttonIcon: 'sports_motorsports',
          actionKind: 'lineups'
        };
      }
      if (canSprint && !this.mySprintBet) {
        return {
          title: 'Piazza la Scommessa Sprint',
          subtitle: 'Piloti salvati! Ora fai il tuo pronostico per la Sprint.',
          statusBadge: 'Aperto ora',
          statusType: 'urgent',
          buttonLabel: 'Gioca la Sprint Bet',
          buttonIcon: 'flag',
          actionKind: 'sprint'
        };
      }
      if (canRace && !this.myRaceBet) {
        return {
          title: 'Piazza la Scommessa Gara',
          subtitle: 'Pronostica pilota e posizione per il Gran Premio domenicale!',
          statusBadge: 'Aperto ora',
          statusType: 'urgent',
          buttonLabel: 'Gioca la Race Bet',
          buttonIcon: 'sports_motorsports',
          actionKind: 'race'
        };
      }
      return {
        title: 'Schieramento Inviato ✓',
        subtitle: 'I tuoi piloti sono registrati. Puoi modificarli finché la finestra rimane aperta.',
        statusBadge: 'Modificabile',
        statusType: 'active',
        buttonLabel: 'Modifica Schieramento',
        buttonIcon: 'edit',
        actionKind: 'lineups'
      };
    }

    // 2. Sprint window open (lineup closed)
    if (canSprint) {
      if (!this.mySprintBet) {
        return {
          title: 'Scommessa Sprint Aperta',
          subtitle: 'Finestra attiva: indovina chi farà punti nella Sprint di oggi!',
          statusBadge: 'Azione richiesta',
          statusType: 'urgent',
          buttonLabel: 'Gioca la Sprint Bet',
          buttonIcon: 'flag',
          actionKind: 'sprint'
        };
      }
      return {
        title: 'Sprint Bet Inviata ✓',
        subtitle: 'Pronostico registrato con successo. Puoi modificarlo fino a inizio sessione.',
        statusBadge: 'Sprint Ok',
        statusType: 'active',
        buttonLabel: 'Modifica Scommessa Sprint',
        buttonIcon: 'edit',
        actionKind: 'sprint'
      };
    }

    // 3. Race bet open
    if (canRace) {
      if (!this.myRaceBet) {
        return {
          title: 'Scommessa Gara Aperta',
          subtitle: 'Ultima giocata del weekend: scegli pilota e piazzamento per il GP!',
          statusBadge: 'Azione richiesta',
          statusType: 'urgent',
          buttonLabel: 'Gioca la Race Bet',
          buttonIcon: 'sports_motorsports',
          actionKind: 'race'
        };
      }
      return {
        title: 'Scommessa Gara Inviata ✓',
        subtitle: 'Pronostico GP registrato. Buona visione del Gran Premio!',
        statusBadge: 'Gara Ok',
        statusType: 'active',
        buttonLabel: 'Modifica Scommessa Gara',
        buttonIcon: 'edit',
        actionKind: 'race'
      };
    }

    // 4. Completed everything
    if (this.personalCompletionPercent === 100) {
      return {
        title: 'Weekend completato al 100%!',
        subtitle: 'Hai inserito tutte le giocate previste per questo Gran Premio.',
        statusBadge: 'Tutto Inviato',
        statusType: 'done'
      };
    }

    return {
      title: 'Finestre di gioco chiuse',
      subtitle: 'Tutte le scommesse per questo weekend sono chiuse. Consulta i risultati.',
      statusBadge: 'Chiuso',
      statusType: 'closed'
    };
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
            this.cdr.markForCheck();
          },
          error: () => {}
        });
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showError('admin.actions.fillFail');
      },
      complete: () => { this.busy = false; this.cdr.markForCheck(); }
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
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error(err);
        this.notificationService.showErrorMessage('Errore durante l\'aggiornamento dello stato gara. Verifica che la colonna calendar.cancelled esista nel database.');
      },
      complete: () => { this.busy = false; this.cdr.markForCheck(); }
    });
  }

  // ===== Helpers =====
  goBack(): void {
    this.navService.back('/calendar');
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
  getRiderTeamName(rider: any): string {
    return rider?.team?.name || '';
  }
  getPositionDisplay(position: number | undefined | null): string {
    if (typeof position !== 'number' || isNaN(position)) return '—';
    return `Pos. ${position}°-${position + 1}°`;
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
        this.cdr.markForCheck();
      },
      error: (err) => { console.error('Error refreshing race details:', err); this.cdr.markForCheck(); }
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
