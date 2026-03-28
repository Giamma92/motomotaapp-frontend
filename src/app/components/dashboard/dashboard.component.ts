// src/app/dashboard/dashboard.component.ts
import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { DashboardService, StandingsRow, CalendarRace, FantasyTeam } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ChampionshipConfig, ChampionshipService } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { RaceDetails } from '../../services/race-detail.service';
import { I18nService } from '../../services/i18n.service';
import { DateUtils } from '../../utils/date-utils';

type Tab = 'standings' | 'next' | 'team' | 'config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, MatExpansionModule, TimeFormatPipe, TranslatePipe],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query('.standings-card, .next-race-card, .fantasy-team-card', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('300ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="dashboard-container" @cardAnimation>
      <header class="header dashboard-header">
        <div class="header-brand">
          <span class="brand-kicker">MOTO MOTA</span>
          <h1>{{ 'dashboard.title' | t }}</h1>
        </div>

        <div class="header-actions">
          <button type="button" class="header-quick-link app-nav-chip app-nav-chip--light" (click)="goTo('calendar')" aria-label="Apri calendario">
            <i class="fa-solid fa-calendar-days"></i>
            <span>Calendario</span>
          </button>
          <button type="button" class="header-quick-link app-nav-chip app-nav-chip--light" (click)="goTo('teams')" aria-label="Apri teams">
            <i class="fa-solid fa-people-group"></i>
            <span>Teams</span>
          </button>

          <button mat-icon-button class="header-menu-btn app-nav-icon app-nav-icon--light" [matMenuTriggerFor]="menu" aria-label="Open dashboard menu">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="goTo('profile')">
            <i class="fa-solid fa-user"></i> {{ 'dashboard.menu.profile' | t }}
          </button>
          <button mat-menu-item (click)="goTo('settings')">
            <i class="fa-solid fa-gear"></i> {{ 'dashboard.menu.settings' | t }}
          </button>
          <button mat-menu-item *ngIf="isAdmin()" (click)="goTo('translation')">
            <i class="fa-solid fa-language"></i> {{ 'dashboard.menu.translation' | t }}
          </button>
          <button *ngIf="isAdmin()" mat-menu-item (click)="goTo('admin')">
            <i class="fa-solid fa-shield-halved"></i> {{ 'dashboard.menu.admin' | t }}
          </button>

          <button mat-menu-item (click)="logout()">
            <i class="fa-solid fa-right-from-bracket"></i> {{ 'dashboard.menu.logout' | t }}
          </button>
        </mat-menu>

      </header>
      <main class="grid-content"(pointerdown)="onSwipeStart($event)" (pointerup)="onSwipeEnd($event)">
        <div class="cards-wrapper">
          <mat-card class="standings-card fullbleed-panel"
          *ngIf="classificationData && classificationData.length"
          [class.mobile-hidden]="!isActive('standings')">
            <mat-card-header class="standings-header">
               <mat-card-title class="dashboard-section-title">
                 <i class="fa-solid fa-trophy"></i>
                 {{ 'dashboard.standings.title' | t }}
               </mat-card-title>
             </mat-card-header>
            <mat-card-content>
              <div class="standings-container">
                <!-- Current User Summary -->
                <div class="current-user-summary" *ngIf="currentUserPosition">
                  <div class="summary-compact">
                    <span class="summary-kicker">{{ 'dashboard.standings.yourPosition' | t }}</span>
                    <span class="summary-pill position-pill">
                      #{{ currentUserPosition }} {{ 'dashboard.standings.of' | t:{total: classificationData.length} }}
                    </span>
                    <span class="summary-pill points-pill">
                      {{ currentUserPoints | number:'1.0-0' }} {{ 'dashboard.standings.points' | t }}
                    </span>
                  </div>
                </div>

                <!-- Top 3 Podium Section -->
                <div class="podium-section" *ngIf="classificationData?.length">
                  <div class="podium-intro">
                    <div class="podium-copy">
                      <span class="podium-kicker">Race control</span>
                      <h3>Podio campionato</h3>
                    </div>
                    <div class="podium-flag" aria-hidden="true"></div>
                  </div>
                  <div class="podium-steps">

                    <!-- 2nd place -->
                    <div class="step step-2" *ngIf="classificationData[1] as r2">
                      <div class="step-plate">
                        <span class="step-mark">2</span>
                      </div>
                      <div class="step-corner" aria-hidden="true">
                        <i class="fa-solid fa-crown crown-silver"></i>
                      </div>
                      <div class="step-body">
                        <div class="step-meta">
                          <span class="podium-points">{{ r2?.score | number:'1.0-0' }} pts</span>
                        </div>
                        <div class="name" [title]="(r2?.user_id?.first_name || '') + ' ' + (r2?.user_id?.last_name || '')">
                          {{ (r2?.user_id?.first_name || '') + ' ' + (r2?.user_id?.last_name || '') || ('dashboard.anonymousRider' | t) }}
                        </div>
                      </div>
                      <div class="step-lane" aria-hidden="true"></div>
                    </div>

                    <!-- 1st place -->
                    <div class="step step-1 champion" *ngIf="classificationData[0] as r1">
                      <div class="step-plate">
                        <span class="step-mark">1</span>
                      </div>
                      <div class="step-corner" aria-hidden="true">
                        <i class="fa-solid fa-crown crown-gold"></i>
                      </div>
                      <div class="step-body">
                        <div class="step-meta">
                          <span class="podium-points">{{ r1?.score | number:'1.0-0' }} pts</span>
                        </div>
                        <div class="name" [title]="(r1?.user_id?.first_name || '') + ' ' + (r1?.user_id?.last_name || '')">
                          {{ (r1?.user_id?.first_name || '') + ' ' + (r1?.user_id?.last_name || '') || ('dashboard.anonymousRider' | t) }}
                        </div>
                      </div>
                      <div class="step-lane" aria-hidden="true"></div>
                    </div>

                    <!-- 3rd place -->
                    <div class="step step-3" *ngIf="classificationData[2] as r3">
                      <div class="step-plate">
                        <span class="step-mark">3</span>
                      </div>
                      <div class="step-corner" aria-hidden="true">
                        <i class="fa-solid fa-crown crown-bronze"></i>
                      </div>
                      <div class="step-body">
                        <div class="step-meta">
                          <span class="podium-points">{{ r3?.score | number:'1.0-0' }} pts</span>
                        </div>
                        <div class="name" [title]="(r3?.user_id?.first_name || '') + ' ' + (r3?.user_id?.last_name || '')">
                          {{ (r3?.user_id?.first_name || '') + ' ' + (r3?.user_id?.last_name || '') || ('dashboard.anonymousRider' | t) }}
                        </div>
                      </div>
                      <div class="step-lane" aria-hidden="true"></div>
                    </div>

                  </div>
                </div>


                <!-- Full Standings Table -->
                <div class="table-container">
                  <table class="standings-table">
                    <thead>
                      <tr>
                        <th class="rank-col" [attr.aria-label]="'dashboard.standings.rank' | t">
                          <span class="th-full">{{ 'dashboard.standings.rank' | t }}</span>
                          <span class="th-short">#</span>
                        </th>
                        <th class="user-col" [attr.aria-label]="'dashboard.standings.user' | t">
                          <span class="th-full">{{ 'dashboard.standings.user' | t }}</span>
                          <span class="th-short">Rider</span>
                        </th>
                        <th class="score-col" [attr.aria-label]="'dashboard.standings.score' | t">
                          <span class="th-full">{{ 'dashboard.standings.score' | t }}</span>
                          <span class="th-short">Pts</span>
                        </th>
                        <th class="gap-col" [attr.aria-label]="'dashboard.standings.gap' | t">
                          <span class="th-full">{{ 'dashboard.standings.gap' | t }}</span>
                          <span class="th-short">&Delta;</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of classificationData; let i = index"
                          [class.highlight]="row.user_id.id === loggedUserId"
                          [class.top-three]="i < 3">
                        <td class="rank-col">
                          <div class="position-container">
                            <span class="position" [class.top-position]="i < 3">{{ row.position }}</span>
                            <div class="position-indicator" *ngIf="i < 3">
                              <i *ngIf="i === 0" class="fa-solid fa-crown crown-gold"></i>
                              <i *ngIf="i === 1" class="fa-solid fa-crown crown-silver"></i>
                              <i *ngIf="i === 2" class="fa-solid fa-crown crown-bronze"></i>
                            </div>
                          </div>
                        </td>
                        <td class="user-col">
                          <div class="user-info">
                            <div class="user-avatar-small">
                              <i class="fa-solid fa-user"></i>
                            </div>
                            <div class="user-details">
                              <span class="username">{{ row.user_id.first_name + ' ' + row.user_id.last_name || ('dashboard.anonymousRider' | t) }}</span>
                              <div class="score-progress" *ngIf="classificationData[0]">
                                <div class="progress-bar">
                                  <div class="progress-fill"
                                       [style.width.%]="(row.score / classificationData[0].score) * 100"
                                       [class.current-user]="row.user_id.id === loggedUserId"></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="score-col">
                          <div class="score-display">
                            <span class="score-value">{{ row.score | number:'1.0-0' }}</span>
                            <span class="score-label">pts</span>
                          </div>
                        </td>
                        <td class="gap-col">
                          <div class="gap-display" *ngIf="i < classificationData.length - 1">
                            <span class="gap-value">+{{ Math.abs(row.score - classificationData[i + 1].score) | number:'1.0-0' }}</span>
                            <span class="gap-label">pts</span>
                          </div>
                          <span class="gap-leader" *ngIf="i === 0">Leader</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="no-standings" *ngIf="!classificationData?.length">
                <i class="fa-solid fa-trophy"></i>
                <p>{{ 'dashboard.standings.empty' | t }}</p>
              </div>
            </mat-card-content>
            <mat-card-actions class="standings-actions">
              <button mat-stroked-button class="standings-breakdown-btn" (click)="goTo('standings-breakdown')">
                <i class="fa-solid fa-table-list"></i>
                Dettaglio punteggi
              </button>
            </mat-card-actions>
          </mat-card>

          <mat-card class="next-race-card fullbleed-panel"
          *ngIf="nextCalendarRace"
          [class.mobile-hidden]="!isActive('next')">
             <mat-card-header class="next-race-header">
               <mat-card-title class="dashboard-section-title">
                 <i class="fa-solid fa-flag-checkered"></i>
                 {{ isCurrentRace ? 'Gara in corso' : 'Prossima gara' }}
               </mat-card-title>
             </mat-card-header>
             <mat-card-content>
               <div class="race-content">
                  <section class="race-info-section race-overview">
                    <div class="race-overview-main">
                      <h2 class="grand-prix-name">{{ nextCalendarRace.race_id.name }}</h2>
                      <div class="race-meta-inline" [attr.aria-label]="'Race meta'">
                        <span class="meta-pill meta-pill--compact">
                          <i class="fa-solid fa-calendar-days"></i>
                          <span class="meta-label">Data</span>
                          <span class="meta-value">{{ formatEventRange(nextCalendarRace.event_date) }}</span>
                        </span>
                        <span class="meta-pill meta-pill--compact">
                          <i class="fa-solid fa-hashtag"></i>
                          <span class="meta-label">{{ 'dashboard.nextRace.roundShort' | t }}</span>
                          <span class="meta-value">{{ nextCalendarRace.race_order }}<ng-container *ngIf="totalRaces as tot"> / {{ tot }}</ng-container></span>
                        </span>
                        <span class="meta-pill meta-pill--compact">
                          <i class="fa-solid fa-location-dot"></i>
                          <span class="meta-label">Location</span>
                          <span class="meta-value">{{ nextCalendarRace.race_id.location }}</span>
                        </span>
                      </div>
                    </div>

                    <details class="race-timing-details" open>
                      <summary class="race-timing-toggle">
                        <span class="toggle-copy">
                          <i class="fa-regular fa-clock"></i>
                          <span>Programma weekend</span>
                        </span>
                        <i class="fa-solid fa-angle-down toggle-chevron" aria-hidden="true"></i>
                      </summary>
                      <div class="race-timing-list" role="list" aria-label="Race weekend program">
                        <div class="timing-row" role="listitem">
                          <div class="timing-main">
                            <i class="fa-solid fa-stopwatch"></i>
                            <span class="timing-name">{{ 'common.qualifying' | t }}</span>
                          </div>
                          <span class="timing-day">{{ getQualifyingDay(nextCalendarRace.event_date) | t }}</span>
                          <span class="timing-time">{{ nextCalendarRace.qualifications_time ?? '10:00:00' | timeFormat }}</span>
                        </div>

                        <div class="timing-row" role="listitem">
                          <div class="timing-main">
                            <i class="fa-solid fa-flag-checkered"></i>
                            <span class="timing-name">{{ 'common.sprint' | t }}</span>
                          </div>
                          <span class="timing-day">{{ getSprintDay(nextCalendarRace.event_date) | t }}</span>
                          <span class="timing-time">{{ nextCalendarRace.sprint_time ?? '15:00:00' | timeFormat }}</span>
                        </div>

                        <div class="timing-row timing-row-race" role="listitem">
                          <div class="timing-main">
                            <i class="fa-solid fa-motorcycle"></i>
                            <span class="timing-name">{{ 'common.race' | t }}</span>
                          </div>
                          <span class="timing-day">{{ getRaceDay(nextCalendarRace.event_date) | t }}</span>
                          <span class="timing-time">{{ nextCalendarRace.event_time ?? '14:00:00' | timeFormat }}</span>
                        </div>
                      </div>
                    </details>
                  </section>
               </div>
             </mat-card-content>
             <mat-card-actions>
               <!-- Main Actions -->
               <div class="main-actions">
                 <button mat-raised-button color="primary" class="main-btn main-btn-primary app-nav-chip app-nav-chip--dark" (click)="goTo('race-detail', nextCalendarRace.id)">
                   <i class="fa-solid fa-eye"></i>
                   {{ 'dashboard.actions.viewRaceDetail' | t }}
                 </button>
                 <button mat-raised-button color="accent" class="main-btn main-btn-secondary app-nav-chip app-nav-chip--accent" (click)="goTo('motogp-results', nextCalendarRace.id)">
                   <i class="fa-solid fa-trophy"></i>
                   {{ 'dashboard.actions.viewMotoGPResults' | t }}
                 </button>
                 <button mat-raised-button color="primary" class="main-btn main-btn-ghost app-nav-chip app-nav-chip--light" (click)="goTo('calendar')">
                   <i class="fa-solid fa-calendar"></i>
                   {{ 'dashboard.actions.viewAllRaces' | t }}
                 </button>
               </div>

               <!-- Betting Actions -->
               <div class="betting-actions" *ngIf="showLineupsButton || showSprintBetButton || showPlaceBetButton">
                 <div class="betting-header">
                   <i class="fa-solid fa-dice"></i>
                   <span>{{ 'dashboard.nextRace.placeYourBets' | t }}</span>
                 </div>
                 <div class="betting-buttons">
                   <button mat-raised-button color="warn" class="betting-btn app-nav-chip app-nav-chip--accent" *ngIf="showLineupsButton" (click)="goTo('lineups', nextCalendarRace.id)">
                     <i class="fa-solid fa-users"></i>
                     {{ 'dashboard.actions.placeLineups' | t }}
                   </button>
                   <button mat-raised-button color="warn" class="betting-btn app-nav-chip app-nav-chip--accent" *ngIf="showSprintBetButton" (click)="goTo('sprint-bet', nextCalendarRace.id)">
                     <i class="fa-solid fa-flag-checkered"></i>
                     {{ 'dashboard.actions.placeSprintBet' | t }}
                   </button>
                   <button mat-raised-button color="warn" class="betting-btn app-nav-chip app-nav-chip--accent" *ngIf="showPlaceBetButton" (click)="goTo('race-bet', nextCalendarRace.id)">
                     <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
                     {{ 'dashboard.actions.placeRaceBet' | t }}
                   </button>
                 </div>
               </div>
             </mat-card-actions>
          </mat-card>

          <mat-card class="fantasy-team-card fullbleed-panel"
          *ngIf="fantasyTeam"
          [class.mobile-hidden]="!isActive('team')">
             <mat-card-header>
               <mat-card-title class="team-title dashboard-section-title">
                 <i class="fa-solid fa-users"></i>
                 {{ fantasyTeam.name }}
               </mat-card-title>
             </mat-card-header>
             <mat-card-content>
               <div class="team-image-container" *ngIf="fantasyTeam.team_image">
                 <img [src]="fantasyTeam.team_image" alt="{{ fantasyTeam.name }} Logo">
               </div>

               <!-- Team Riders Section -->
               <div class="team-riders-section">
                 <h3 class="section-title">{{ 'dashboard.team.teamRiders' | t }}</h3>

                                   <div class="rider-grid">
                    <mat-expansion-panel class="rider first-tier">
                      <mat-expansion-panel-header class="rider-header">
                        <div class="rider-header-main">
                          <span class="rider-role">{{ 'dashboard.team.firstTierPilot' | t }}</span>
                          <div class="rider-name-row">
                            <span class="rider-name">{{ fantasyTeam.official_rider_1.first_name }} {{ fantasyTeam.official_rider_1.last_name }}</span>
                            <span class="rider-header-number">#{{ fantasyTeam.official_rider_1.number }}</span>
                          </div>
                        </div>
                      </mat-expansion-panel-header>
                      <div class="rider-info">
                        <div class="rider-stats">
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                            <span class="stat-value">{{ getRiderLineupsCount(fantasyTeam.official_rider_1.id) }}</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                            <span class="stat-value">{{ getRiderQualifyingCount(fantasyTeam.official_rider_1.id) }}</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                            <span class="stat-value">{{ getRiderRaceCount(fantasyTeam.official_rider_1.id) }}</span>
                          </div>
                        </div>
                      </div>
                    </mat-expansion-panel>

                    <mat-expansion-panel class="rider second-tier" *ngIf="fantasyTeam.official_rider_2">
                      <mat-expansion-panel-header class="rider-header">
                        <div class="rider-header-main">
                          <span class="rider-role">{{ 'dashboard.team.secondTierPilot' | t }}</span>
                          <div class="rider-name-row">
                            <span class="rider-name">{{ fantasyTeam.official_rider_2.first_name }} {{ fantasyTeam.official_rider_2.last_name }}</span>
                            <span class="rider-header-number">#{{ fantasyTeam.official_rider_2.number }}</span>
                          </div>
                        </div>
                      </mat-expansion-panel-header>
                      <div class="rider-info">
                        <div class="rider-stats">
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                            <span class="stat-value">{{ getRiderLineupsCount(fantasyTeam.official_rider_2.id) }}</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                            <span class="stat-value">{{ getRiderQualifyingCount(fantasyTeam.official_rider_2.id) }}</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                            <span class="stat-value">{{ getRiderRaceCount(fantasyTeam.official_rider_2.id) }}</span>
                          </div>
                        </div>
                      </div>
                    </mat-expansion-panel>

                    <mat-expansion-panel class="rider third-tier">
                      <mat-expansion-panel-header class="rider-header">
                        <div class="rider-header-main">
                          <span class="rider-role">{{ 'dashboard.team.thirdTierPilot' | t }}</span>
                          <div class="rider-name-row">
                            <span class="rider-name">{{ fantasyTeam.reserve_rider.first_name }} {{ fantasyTeam.reserve_rider.last_name }}</span>
                            <span class="rider-header-number">#{{ fantasyTeam.reserve_rider.number }}</span>
                          </div>
                        </div>
                      </mat-expansion-panel-header>
                      <div class="rider-info">
                        <div class="rider-stats">
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.lineupsUsed' | t }}</span>
                            <span class="stat-value">{{ getRiderLineupsCount(fantasyTeam.reserve_rider.id) }}</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.qualifyingRider' | t }}</span>
                            <span class="stat-value">{{ getRiderQualifyingCount(fantasyTeam.reserve_rider.id) }}</span>
                          </div>
                          <div class="stat-row">
                            <span class="stat-label">{{ 'dashboard.team.raceRider' | t }}</span>
                            <span class="stat-value">{{ getRiderRaceCount(fantasyTeam.reserve_rider.id) }}</span>
                          </div>
                        </div>
                      </div>
                    </mat-expansion-panel>
                  </div>
               </div>

               <!-- Betting Statistics Section -->
               <div class="betting-stats-section" *ngIf="getBettingStats().length > 0">
                 <h3 class="section-title">{{ 'dashboard.team.bettingStatistics' | t }}</h3>

                 <div class="betting-stats-table">
                   <table>
                     <thead>
                       <tr>
                         <th>{{ 'dashboard.team.pilot' | t }}</th>
                         <th>{{ 'dashboard.team.sprintBets' | t }}</th>
                         <th>{{ 'dashboard.team.raceBets' | t }}</th>
                         <th>{{ 'dashboard.team.totalBets' | t }}</th>
                       </tr>
                     </thead>
                     <tbody>
                       <tr *ngFor="let stat of getBettingStats()">
                         <td class="pilot-name">
                           <span class="name">{{ stat.pilotName }}</span>
                           <span class="number">#{{ stat.pilotNumber }}</span>
                         </td>
                         <td class="sprint-bets">{{ stat.sprintBets }}</td>
                         <td class="race-bets">{{ stat.raceBets }}</td>
                         <td class="total-bets">{{ stat.totalBets }}</td>
                       </tr>
                     </tbody>
                   </table>
                 </div>
               </div>
             </mat-card-content>
                           <mat-card-actions>
                <button mat-raised-button color="primary" (click)="goTo('teams')">
                  <i class="fa-solid fa-list"></i> {{ 'dashboard.actions.viewAllTeams' | t }}
                </button>
              </mat-card-actions>
          </mat-card>

          <!-- Championship Configuration Card -->
          <mat-card class="championship-config-card fullbleed-panel"
          *ngIf="championshipConfig"
          [class.mobile-hidden]="!isActive('config')">
            <mat-card-header>
              <mat-card-title class="config-title dashboard-section-title">
                <i class="fa-solid fa-gear"></i>
                {{ 'dashboard.championship.configuration' | t }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="config-content">
                <!-- Championship Info Section -->
                <div class="config-section config-info-section">
                  <h3 class="section-title"><i class="fa-solid fa-circle-info"></i> {{ 'dashboard.championship.info' | t }}</h3>
                  <div class="config-grid">
                    <div class="config-item">
                      <div class="config-icon">
                        <i class="fa-solid fa-trophy"></i>
                      </div>
                      <div class="config-info">
                        <span class="config-label">{{ 'dashboard.championship.name' | t }}</span>
                        <span class="config-value">{{ championshipConfig.name }}</span>
                      </div>
                    </div>
                    <div class="config-item">
                      <div class="config-icon">
                        <i class="fa-solid fa-calendar-days"></i>
                      </div>
                      <div class="config-info">
                        <span class="config-label">{{ 'dashboard.championship.season' | t }}</span>
                        <span class="config-value">{{ championshipConfig.season }}</span>
                      </div>
                    </div>
                    <div class="config-item">
                      <div class="config-icon">
                        <i class="fa-solid fa-flag-checkered"></i>
                      </div>
                      <div class="config-info">
                        <span class="config-label">{{ 'dashboard.championship.status' | t }}</span>
                        <span class="config-value" [class.active]="championshipConfig.is_active" [class.inactive]="!championshipConfig.is_active">
                          {{ championshipConfig.is_active ? ('dashboard.championship.active' | t) : ('dashboard.championship.inactive' | t) }}
                        </span>
                      </div>
                    </div>
                    <div class="config-item">
                      <div class="config-icon">
                        <i class="fa-solid fa-clock"></i>
                      </div>
                      <div class="config-info">
                        <span class="config-label">Timezone</span>
                        <span class="config-value">{{ championshipConfig.timezone || 'Europe/Rome' }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                                    <!-- Scoring System Section -->
                  <div class="config-section config-scoring-section">
                    <h3 class="section-title"><i class="fa-solid fa-chart-line"></i> {{ 'dashboard.championship.scoringSystem' | t }}</h3>
                    <div class="scoring-grid">
                      <mat-expansion-panel class="scoring-item">
                        <mat-expansion-panel-header>
                          <mat-panel-title>
                            <i class="fa-solid fa-motorcycle"></i>
                            <span>{{ 'dashboard.championship.raceScoring' | t }}</span>
                          </mat-panel-title>
                        </mat-expansion-panel-header>
                        <div class="scoring-points">
                          <div class="point-item" *ngFor="let point of getRaceScoringPoints()">
                            <span class="position">{{ point.position }}</span>
                            <span class="points">{{ point.points }} pts</span>
                          </div>
                        </div>
                      </mat-expansion-panel>
                      <mat-expansion-panel class="scoring-item">
                        <mat-expansion-panel-header>
                          <mat-panel-title>
                            <i class="fa-solid fa-flag-checkered"></i>
                            <span>{{ 'dashboard.championship.sprintScoring' | t }}</span>
                          </mat-panel-title>
                        </mat-expansion-panel-header>
                        <div class="scoring-points">
                          <div class="point-item" *ngFor="let point of getSprintScoringPoints()">
                            <span class="position">{{ point.position }}</span>
                            <span class="points">{{ point.points }} pts</span>
                          </div>
                        </div>
                      </mat-expansion-panel>
                    </div>
                  </div>

                <!-- Rules Section -->
                <div class="config-section config-rules-section">
                  <h3 class="section-title"><i class="fa-solid fa-shield-halved"></i> {{ 'dashboard.championship.rules' | t }}</h3>
                  <div class="rules-grid">
                    <div class="rule-item">
                      <div class="rule-icon">
                      <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.betsLimitRace' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.bets_limit_race || 'Unlimited' }}</span>
                      </div>
                    </div>
                    <div class="rule-item">
                      <div class="rule-icon">
                        <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.betsLimitSprintRace' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.bets_limit_sprint_race || 'Unlimited' }}</span>
                      </div>
                    </div>
                    <div class="rule-item">
                      <div class="rule-icon">
                      <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.betsLimitPoints' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.bets_limit_points || 'Unlimited' }}</span>
                      </div>
                    </div>
                    <div class="rule-item">
                      <div class="rule-icon">
                      <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.betsLimitSprintPoints' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.bets_limit_sprint_points || 'Unlimited' }}</span>
                      </div>
                    </div>
                    <div class="rule-item">
                      <div class="rule-icon">
                      <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.betsLimitDriver' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.bets_limit_driver || 'Unlimited' }}</span>
                      </div>
                    </div>
                    <div class="rule-item">
                      <div class="rule-icon">
                      <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.betsLimitSprintDriver' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.bets_limit_sprint_driver || 'Unlimited' }}</span>
                      </div>
                    </div>
                    <div class="rule-item">
                      <div class="rule-icon">
                        <i class="fa-solid fa-circle-exclamation"></i>
                      </div>
                      <div class="rule-info">
                        <span class="rule-label">{{ 'dashboard.championship.formationLimitDriver' | t }}</span>
                        <span class="rule-value">{{ championshipConfig.formation_limit_driver || 'Unlimited' }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </main>
    </div>
    <nav class="bottom-nav" aria-label="Primary">
      <button class="item" [class.active]="isActive('standings')" (click)="setTab('standings')" [attr.aria-label]="'dashboard.standings.title' | t">
        <i class="fa-solid fa-trophy" aria-hidden="true"></i>
        <span class="label">{{ 'dashboard.standings.title' | t }}</span>
      </button>
      <button class="item" [class.active]="isActive('next')" (click)="setTab('next')" [attr.aria-label]="(isCurrentRace ? ('dashboard.nextRace.current' | t) : ('dashboard.nextRace.next' | t))">
        <i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>
        <span class="label">{{ isCurrentRace ? ('dashboard.nextRace.current' | t) : ('dashboard.nextRace.next' | t) }}</span>
      </button>
      <button class="item" [class.active]="isActive('team')" (click)="setTab('team')" [attr.aria-label]="'dashboard.team.teamRiders' | t">
        <i class="fa-solid fa-users" aria-hidden="true"></i>
        <span class="label">{{ 'dashboard.team.teamRiders' | t }}</span>
      </button>
      <button class="item" [class.active]="isActive('config')" (click)="setTab('config')" [attr.aria-label]="'dashboard.championship.configuration' | t">
        <i class="fa-solid fa-gear" aria-hidden="true"></i>
        <span class="label">{{ 'dashboard.championship.configuration' | t }}</span>
      </button>

    </nav>
  `,
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  classificationData?: StandingsRow[];
  nextCalendarRace?: CalendarRace;
  fantasyTeam?: FantasyTeam;
  racesDetails?: RaceDetails;
  championshipConfig?: any;
  loggedUserId: string | null;
  championshipId: number = 0;
  totalRaces?: number

  // New boolean flags for button visibility
  showLineupsButton: boolean = false;
  showSprintBetButton: boolean = false;
  showPlaceBetButton: boolean = false;

  //Map for riders and linups, sprint and races count
  ridersLineupsCount: Map<number, number> = new Map<number, number>();
  ridersQualifyingCount: Map<number, number> = new Map<number, number>();
  ridersRaceCount: Map<number, number> = new Map<number, number>();

  Math = Math;
  // Mobile tab state
  currentTab: Tab = 'standings';
  private swipeX = 0;
  private tracking = false;
  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService,
    private raceScheduleService: RaceScheduleService,
    private i18nService: I18nService
  ) {
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      champId > 0 && this.loadDashboardData(champId);
    });
  }

  private loadDashboardData(champId: number): void {
    this.championshipId = champId;
    this.dashboardService.getClassification(champId).subscribe({
      next: (data: StandingsRow[]) => {
        this.classificationData = data;
      },
      error: (error: any) =>
        console.error('Error fetching classification data:', error)
    });
    this.dashboardService.getNextRace(champId).subscribe({
      next: (race: CalendarRace) => {
        this.nextCalendarRace = race;
        this.computeButtonVisibility();
      },
      error: (error: any) => {
        console.error('Error fetching next race:', error);
        this.nextCalendarRace = undefined;
      }
    });
    this.dashboardService.getCalendar(champId).subscribe({
      next: (races) => this.totalRaces = Array.isArray(races) ? races.length : undefined,
      error: (e) => console.warn('Could not fetch calendar to compute total races:', e)
    });
    this.dashboardService.getFantasyTeam(champId).subscribe({
      next: (team: FantasyTeam) => {
        this.fantasyTeam = team;
      },
      error: (error: any) =>
        console.error('Error fetching fantasy team:', error)
    });
    this.dashboardService.getRaceDetails(champId).subscribe({
      next: (data: RaceDetails) => {
          this.racesDetails = data;
          this.computeRidersQualifyingAndRaceCounts();
      },
      error: (err: any) => console.error('Error fetching race details:', err)
    });

    // Load championship configuration
    this.loadChampionshipConfig(champId);

  }

  public get currentUserPoints() {
    return this.classificationData?.find(row => row.user_id.id === this.loggedUserId)?.score || 0;
  }

  public get currentUserPosition() {
    const userRow = this.classificationData?.find(row => row.user_id.id === this.loggedUserId);
    return userRow?.position || null;
  }

  public get isCurrentRace() {
    const today = new Date();
    const eventDate = DateUtils.parseLocalYyyyMmDd(this.nextCalendarRace?.event_date);
    return eventDate ? today.toDateString() === eventDate.toDateString() : false;
  }

  private computeButtonVisibility(): void {
    if (!this.nextCalendarRace) {
      this.showLineupsButton = false;
      this.showSprintBetButton = false;
      this.showPlaceBetButton = false;
      return;
    }

    const timeZone = this.championshipConfig?.timezone;
    this.showLineupsButton = this.raceScheduleService.canShowLineups(this.nextCalendarRace, timeZone);
    this.showSprintBetButton = this.raceScheduleService.canShowSprintBet(this.nextCalendarRace, timeZone);
    this.showPlaceBetButton = this.raceScheduleService.canShowRaceBet(this.nextCalendarRace, timeZone);
  }

  goTo(path: string, extras: any = {}): void {
    if (path === 'motogp-results') {
      this.router.navigate(['/motogp-results', this.championshipId, extras]);
    } else {
      this.router.navigate([`/${path}`, extras]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  public getEventDateRange(eventDateString: string): { start: Date, end: Date } {
    if (!eventDateString) return { start: new Date(), end: new Date() };

    const eventDate = DateUtils.parseLocalYyyyMmDd(eventDateString);
    if (!eventDate) return { start: new Date(), end: new Date() };
    const startDate = DateUtils.addDays(eventDate, -2);

    return {
      start: startDate,
      end: eventDate
    };
  }

  isAdmin(): boolean {
    return this.authService.isCurrentUserAdmin();
  }

  // Rider statistics methods
  private computeRidersQualifyingAndRaceCounts(): void {
    if (!this.fantasyTeam || !this.racesDetails?.lineups) return;

    const riderIds = [
      this.fantasyTeam.official_rider_1.id,
      this.fantasyTeam.official_rider_2?.id,
      this.fantasyTeam.reserve_rider.id,
    ].filter((id): id is number => !!id);

    const counts = this.racesDetails.lineups.reduce<Record<number, { q: number; r: number }>>(
      (acc, { qualifying_rider_id, race_rider_id }) => {
        riderIds.forEach(riderId => {
          if (qualifying_rider_id?.id === riderId) acc[riderId].q++;
          if (race_rider_id?.id === riderId) acc[riderId].r++;
        });
        return acc;
      },
      Object.fromEntries(riderIds.map(id => [id, { q: 0, r: 0 }]))
    );

    riderIds.forEach(id => {
      const { q, r } = counts[id];
      this.ridersQualifyingCount.set(id, q);
      this.ridersRaceCount.set(id, r);
      this.ridersLineupsCount.set(id, q + r);
    });
  }


  getRiderLineupsCount(riderId: number): number {
    const count = this.ridersLineupsCount.has(riderId) ? this.ridersLineupsCount.get(riderId) : 0;
    return count ?? 0;
  }

  getRiderQualifyingCount(riderId: number): number {
    const count = this.ridersQualifyingCount.has(riderId) ? this.ridersQualifyingCount.get(riderId) : 0;
    return count ?? 0;
  }

  getRiderRaceCount(riderId: number): number {
    const count = this.ridersRaceCount.has(riderId) ? this.ridersRaceCount.get(riderId) : 0;
    return count ?? 0;
  }

  getBettingStats(): Array<{
    pilotName: string;
    pilotNumber: number;
    sprintBets: number;
    raceBets: number;
    totalBets: number;
  }> {
    const rd = this.racesDetails;
    if (!rd) return [];

    // Tag entries so we can reduce in a single pass
    const tagged = [
      ...(rd.sprints ?? []).map(s => ({ rider: s.rider_id, isSprint: true })),
      ...(rd.bets ?? []).map(b => ({ rider: b.rider_id, isSprint: false })),
    ];

    const map = tagged.reduce<Map<number, {
      pilotName: string; pilotNumber: number; sprintBets: number; raceBets: number;
    }>>((acc, { rider, isSprint }) => {
      if (!rider) return acc;

      const curr = acc.get(rider.id) ?? {
        pilotName: `${rider.first_name} ${rider.last_name ?? ''}`.trim(),
        pilotNumber: rider.number,
        sprintBets: 0,
        raceBets: 0,
      };

      if (isSprint) curr.sprintBets++;
      else curr.raceBets++;

      acc.set(rider.id, curr);
      return acc;
    }, new Map());

    // Build final array with totals (optionally sort by totalBets desc)
    return Array.from(map.values())
      .map(s => ({ ...s, totalBets: s.sprintBets + s.raceBets }))
      // .sort((a, b) => b.totalBets - a.totalBets) // <- enable if you want a leaderboard
    ;
  }



  // Day methods for schedule display
  getQualifyingDay(eventDate: string): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(DateUtils.addDays(date, -1)) : '';
  }

  getSprintDay(eventDate: string): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(DateUtils.addDays(date, -1)) : '';
  }

  getRaceDay(eventDate: string): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(date) : '';
  }

  private getDayName(date: Date): string {
    return date.toLocaleDateString(this.locale, { weekday: 'long' });
  }

  get locale(): string {
    return this.i18nService.locale;
  }

  formatEventRange(eventDateString: string): string {
    if (!eventDateString) return '';
    const end = DateUtils.parseLocalYyyyMmDd(eventDateString);
    if (!end) return '';
    const start = DateUtils.addDays(end, -2);

    // Use browser's Intl with the current locale
    const fmt = new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long', year: 'numeric' });
    // @ts-ignore: formatRange is supported in modern browsers
    return typeof fmt.formatRange === 'function'
      ? fmt.formatRange(start, end)
      : `${fmt.format(start)} – ${fmt.format(end)}`;
  }

  // Circuit image methods
  getCircuitImageUrl(raceName: string): string {
    // Map race names to circuit image URLs from MotoGP resources
    const circuitMap: { [key: string]: string } = {
      'Qatar Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/03/08/0c8c8c8c-8c8c-8c8c-8c8c-8c8c8c8c8c8c/2024-03-08T12-00-00.000Z/qatar-circuit.jpg',
      'Portuguese Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/03/22/1d1d1d1d-1d1d-1d1d-1d1d-1d1d1d1d1d1d/2024-03-22T12-00-00.000Z/portugal-circuit.jpg',
      'Spanish Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/04/28/2e2e2e2e-2e2e-2e2e-2e2e-2e2e2e2e2e2e/2024-04-28T12-00-00.000Z/spain-circuit.jpg',
      'French Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/05/12/3f3f3f3f-3f3f-3f3f-3f3f-3f3f3f3f3f3f/2024-05-12T12-00-00.000Z/france-circuit.jpg',
      'Italian Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/06/02/4a4a4a4a-4a4a-4a4a-4a4a-4a4a4a4a4a4a/2024-06-02T12-00-00.000Z/italy-circuit.jpg',
      'Catalan Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/06/16/5b5b5b5b-5b5b-5b5b-5b5b-5b5b5b5b5b5b/2024-06-16T12-00-00.000Z/catalan-circuit.jpg',
      'Dutch Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/06/30/6c6c6c6c-6c6c-6c6c-6c6c-6c6c6c6c6c6c/2024-06-30T12-00-00.000Z/dutch-circuit.jpg',
      'German Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/07/07/7d7d7d7d-7d7d-7d7d-7d7d-7d7d7d7d7d7d/2024-07-07T12-00-00.000Z/germany-circuit.jpg',
      'British Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/08/04/8e8e8e8e-8e8e-8e8e-8e8e-8e8e8e8e8e8e/2024-08-04T12-00-00.000Z/britain-circuit.jpg',
      'Austrian Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/08/18/9f9f9f9f-9f9f-9f9f-9f9f-9f9f9f9f9f9f/2024-08-18T12-00-00.000Z/austria-circuit.jpg',
      'San Marino Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/09/01/a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0/2024-09-01T12-00-00.000Z/sanmarino-circuit.jpg',
      'Indian Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/09/22/b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1/2024-09-22T12-00-00.000Z/india-circuit.jpg',
      'Japanese Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/10/06/c2c2c2c2-c2c2-c2c2-c2c2-c2c2c2c2c2c2/2024-10-06T12-00-00.000Z/japan-circuit.jpg',
      'Indonesian Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/10/20/d3d3d3d3-d3d3-d3d3-d3d3-d3d3d3d3d3d3/2024-10-20T12-00-00.000Z/indonesia-circuit.jpg',
      'Australian Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/10/27/e4e4e4e4-e4e4-e4e4-e4e4-e4e4e4e4e4e4/2024-10-27T12-00-00.000Z/australia-circuit.jpg',
      'Thai Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/11/03/f5f5f5f5-f5f5-f5f5-f5f5-f5f5f5f5f5f5/2024-11-03T12-00-00.000Z/thailand-circuit.jpg',
      'Malaysian Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/11/17/g6g6g6g6-g6g6-g6g6-g6g6-g6g6g6g6g6g6/2024-11-17T12-00-00.000Z/malaysia-circuit.jpg',
      'Valencia Grand Prix': 'https://resources.motogp.pulselive.com/photo-resources/2024/11/24/h7h7h7h7-h7h7-h7h7-h7h7-h7h7h7h7h7h7/2024-11-24T12-00-00.000Z/valencia-circuit.jpg'
    };

    // Return the mapped URL or a default circuit image
    return circuitMap[raceName] || 'https://resources.motogp.pulselive.com/photo-resources/default-circuit.jpg';
  }

  onCircuitImageError(event: any): void {
    // Handle image loading errors by setting a fallback image
    const target = event.target as HTMLImageElement;
    target.src = 'assets/images/default-circuit.jpg'; // Fallback to local asset
    target.style.display = 'none'; // Hide the image if fallback also fails
  }

  // Championship configuration methods
  getRaceScoringPoints(): Array<{position: number, points: number}> {
    // Default MotoGP race scoring system
    return [
      { position: 1, points: 25 },
      { position: 2, points: 20 },
      { position: 3, points: 16 },
      { position: 4, points: 13 },
      { position: 5, points: 11 },
      { position: 6, points: 10 },
      { position: 7, points: 9 },
      { position: 8, points: 8 },
      { position: 9, points: 7 },
      { position: 10, points: 6 },
      { position: 11, points: 5 },
      { position: 12, points: 4 },
      { position: 13, points: 3 },
      { position: 14, points: 2 },
      { position: 15, points: 1 }
    ];
  }

  getSprintScoringPoints(): Array<{position: number, points: number}> {
    // Default MotoGP sprint scoring system
    return [
      { position: 1, points: 12 },
      { position: 2, points: 9 },
      { position: 3, points: 7 },
      { position: 4, points: 6 },
      { position: 5, points: 5 },
      { position: 6, points: 4 },
      { position: 7, points: 3 },
      { position: 8, points: 2 },
      { position: 9, points: 1 }
    ];
  }

  private loadChampionshipConfig(champId: number): void {

    this.championshipService.getChampionshipConfig(champId).subscribe({
      next: (config: ChampionshipConfig) => {
        this.championshipConfig = {
          name: config.championship_id.description,
          season: config.championship_id.year,
          is_active: config.championship_id.is_active,
          bets_limit_points: config.bets_limit_points, // max points per race
          bets_limit_sprint_points: config.bets_limit_sprint_points, // max points per sprint race
          bets_limit_driver: config.bets_limit_driver, // max bets per pilot
          bets_limit_sprint_driver: config.bets_limit_sprint_driver, // max sprint bets per pilot
          bets_limit_race: config.bets_limit_race, // max bets per race
          bets_limit_sprint_race: config.bets_limit_sprint_race, // max bets per sprint race
          formation_limit_driver: config.formation_limit_driver, // max lineups per pilot
          timezone: config.timezone,
          race_scoring: this.getRaceScoringPoints(),
          sprint_scoring: this.getSprintScoringPoints()
        };;
        this.computeButtonVisibility();
      },
      error: (err) => console.error('Failed to load championship configuration', err)
    });

  }

  // --- Mobile bottom nav helpers ---
  setTab(next: Tab) {
    this.currentTab = next;
  }
  isActive(name: Tab) {
    return this.currentTab === name;
  }

  // Optional: keyboard support for convenience
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') this.shift(-1);
    else if (e.key === 'ArrowRight') this.shift(1);
  }

  private shift(direction: -1 | 1) {
    const order: Tab[] = ['standings', 'next', 'team', 'config'];
    const i = order.indexOf(this.currentTab);
    const j = Math.min(order.length - 1, Math.max(0, i + direction));
    if (j !== i) this.currentTab = order[j];
  }

  // --- Simple swipe handling (mobile) ---
  onSwipeStart(ev: PointerEvent) {
    this.swipeX = ev.clientX;
    this.tracking = true;
  }
  onSwipeEnd(ev: PointerEvent) {
    if (!this.tracking) return;
    const dx = ev.clientX - this.swipeX;
    this.tracking = false;
    if (Math.abs(dx) > 60) {
      if (dx < 0) this.shift(1);   // swipe left → next tab
      if (dx > 0) this.shift(-1);  // swipe right → prev tab
    }
  }

}
