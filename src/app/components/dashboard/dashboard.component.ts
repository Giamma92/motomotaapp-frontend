// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
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
import { HostListener } from '@angular/core';

type Tab = 'standings' | 'next' | 'team' | 'config';

@Component({
  selector: 'app-dashboard',
  standalone: true,
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
      <header class="header">
        <h1>{{ 'dashboard.title' | t }}</h1>

        <button mat-icon-button [matMenuTriggerFor]="menu">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
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
               <mat-card-title>
                 <i class="fa-solid fa-trophy"></i>
                 {{ 'dashboard.standings.title' | t }}
               </mat-card-title>
             </mat-card-header>
            <mat-card-content>
              <div class="standings-container">
                <!-- Top 3 Podium Section -->
                <div class="podium-section" *ngIf="classificationData?.length">
                  <div class="podium-steps">

                    <!-- 2nd place -->
                    <div class="step step-2" *ngIf="classificationData[1] as r2">
                      <div class="step-top">
                        <i class="fa-solid fa-crown crown-silver"></i>
                      </div>
                      <div class="step-body">
                        <div class="pos-badge silver">
                          <i class="fa-solid fa-2"></i>
                        </div>
                        <div class="name">
                          {{ (r2?.user_id?.first_name || '') + ' ' + (r2?.user_id?.last_name || '') || ('dashboard.anonymousRider' | t) }}
                        </div>
                        <div class="pts">{{ r2?.score | number:'1.0-0' }} pts</div>
                      </div>
                    </div>

                    <!-- 1st place -->
                    <div class="step step-1 champion" *ngIf="classificationData[0] as r1">
                      <div class="step-top">
                        <i class="fa-solid fa-crown crown-gold"></i>
                      </div>
                      <div class="step-body">
                        <div class="pos-badge gold">
                          <i class="fa-solid fa-1"></i>
                        </div>
                        <div class="name">
                          {{ (r1?.user_id?.first_name || '') + ' ' + (r1?.user_id?.last_name || '') || ('dashboard.anonymousRider' | t) }}
                        </div>
                        <div class="pts">{{ r1?.score | number:'1.0-0' }} pts</div>
                      </div>
                    </div>

                    <!-- 3rd place -->
                    <div class="step step-3" *ngIf="classificationData[2] as r3">
                      <div class="step-top">
                        <i class="fa-solid fa-crown crown-bronze"></i>
                      </div>
                      <div class="step-body">
                        <div class="pos-badge bronze">
                          <i class="fa-solid fa-3"></i>
                        </div>
                        <div class="name">
                          {{ (r3?.user_id?.first_name || '') + ' ' + (r3?.user_id?.last_name || '') || ('dashboard.anonymousRider' | t) }}
                        </div>
                        <div class="pts">{{ r3?.score | number:'1.0-0' }} pts</div>
                      </div>
                    </div>

                  </div>
                </div>


                <!-- Full Standings Table -->
                <div class="table-container">
                  <table class="standings-table">
                    <thead>
                      <tr>
                        <th class="rank-col">{{ 'dashboard.standings.rank' | t }}</th>
                        <th class="user-col">{{ 'dashboard.standings.user' | t }}</th>
                        <th class="score-col">{{ 'dashboard.standings.score' | t }}</th>
                        <th class="gap-col">{{ 'dashboard.standings.gap' | t }}</th>
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

                <!-- Current User Summary -->
                <div class="current-user-summary" *ngIf="currentUserPosition">
                  <div class="summary-card">
                    <div class="summary-header">
                      <i class="fa-solid fa-user-circle"></i>
                      <span>{{ 'dashboard.standings.yourPosition' | t }}</span>
                    </div>
                    <div class="summary-content">
                      <div class="position-info">
                        <span class="position-number">{{ currentUserPosition }}</span>
                        <span class="position-label">{{ 'dashboard.standings.of' | t:{total: classificationData.length} }}</span>
                      </div>
                      <div class="points-info">
                        <span class="points-value">{{ currentUserPoints | number:'1.0-0' }}</span>
                        <span class="points-label">{{ 'dashboard.standings.points' | t }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="no-standings" *ngIf="!classificationData?.length">
                <i class="fa-solid fa-trophy"></i>
                <p>{{ 'dashboard.standings.empty' | t }}</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="next-race-card fullbleed-panel"
          *ngIf="nextCalendarRace"
          [class.mobile-hidden]="!isActive('next')">
             <mat-card-header class="next-race-header">
               <mat-card-title>
                 <i class="fa-solid fa-flag-checkered"></i>
                 {{ isCurrentRace ? ('dashboard.nextRace.current' | t) : ('dashboard.nextRace.next' | t) }}
               </mat-card-title>
             </mat-card-header>
             <mat-card-content>
               <div class="race-content">
                 <!-- Race Information Section -->
                  <div class="race-info-section">
                    <div class="race-basic-info">

                      <div class="race-round-badge">
                        <i class="fa-solid fa-hashtag"></i>
                        <span>
                          {{ 'dashboard.nextRace.roundShort' | t }}
                          {{ nextCalendarRace.race_order }}
                          <ng-container *ngIf="totalRaces as tot">
                            / {{ tot }}
                          </ng-container>
                        </span>
                      </div>

                      <h2 class="grand-prix-name">{{ nextCalendarRace.race_id.name }}</h2>

                      <div class="location-chip">
                        <i class="fa-solid fa-location-dot"></i>
                        <span>{{ nextCalendarRace.race_id.location }}</span>
                      </div>
                    </div>

                    <div class="race-dates">
                      <div class="date-pill" [attr.aria-label]="'Event dates'">
                        <i class="fa-solid fa-calendar-days"></i>
                        <div class="date-lines">
                          <span class="date-strong">
                            {{ formatEventRange(nextCalendarRace.event_date) }}
                          </span>
                          <!--<span class="date-sub">
                            {{ 'dashboard.nextRace.weekend' | t }} •
                            {{ getQualifyingDay(nextCalendarRace.event_date) | t | titlecase }}
                            / {{ getSprintDay(nextCalendarRace.event_date) | t | titlecase }}
                            / {{ getRaceDay(nextCalendarRace.event_date)   | t | titlecase }}
                          </span>-->
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Circuit Image Section -->
                  <!--<div class="circuit-image-section">
                    <div class="circuit-image-container">
                      <img [src]="getCircuitImageUrl(nextCalendarRace.race_id.name)"
                           [alt]="nextCalendarRace.race_id.name + ' Circuit'"
                           (error)="onCircuitImageError($event)"
                           class="circuit-image">
                      <div class="circuit-overlay">
                        <i class="fa-solid fa-motorcycle"></i>
                        <span>{{ 'dashboard.nextRace.circuit' | t }}</span>
                      </div>
                    </div>
                  </div>-->

                 <!-- Schedule Section -->
                 <div class="schedule-section">
                   <h3 class="section-title">{{ 'dashboard.nextRace.schedule' | t }}</h3>
                   <div class="schedule-grid">
                     <div class="schedule-item qualifying">
                       <div class="schedule-icon">
                         <i class="fa-solid fa-clock"></i>
                       </div>
                       <div class="schedule-info">
                         <div class="schedule-label">{{ 'common.qualifying' | t }}</div>
                         <div class="schedule-time">
                           <span class="day">{{ getQualifyingDay(nextCalendarRace.event_date) | t }}</span>
                           <span class="time">{{ nextCalendarRace.qualifications_time ?? '10:00:00' | timeFormat }}</span>
                         </div>
                       </div>
                     </div>

                     <div class="schedule-item sprint">
                       <div class="schedule-icon">
                         <i class="fa-solid fa-flag-checkered"></i>
                       </div>
                       <div class="schedule-info">
                         <div class="schedule-label">{{ 'common.sprint' | t }}</div>
                         <div class="schedule-time">
                           <span class="day">{{ getSprintDay(nextCalendarRace.event_date) | t }}</span>
                           <span class="time">{{ nextCalendarRace.sprint_time ?? '15:00:00' | timeFormat }}</span>
                         </div>
                       </div>
                     </div>

                     <div class="schedule-item race">
                       <div class="schedule-icon">
                         <i class="fa-solid fa-motorcycle"></i>
                       </div>
                       <div class="schedule-info">
                         <div class="schedule-label">{{ 'common.race' | t }}</div>
                         <div class="schedule-time">
                           <span class="day">{{ getRaceDay(nextCalendarRace.event_date) | t }}</span>
                           <span class="time">{{ nextCalendarRace.event_time ?? '14:00:00' | timeFormat }}</span>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </mat-card-content>
             <mat-card-actions>
               <!-- Main Actions -->
               <div class="main-actions">
                 <button mat-raised-button color="primary" class="main-btn" (click)="goTo('race-detail', nextCalendarRace.id)">
                   <i class="fa-solid fa-eye"></i>
                   {{ 'dashboard.actions.viewRaceDetail' | t }}
                 </button>
                 <button mat-raised-button color="accent" class="main-btn" (click)="goTo('motogp-results', nextCalendarRace.id)">
                   <i class="fa-solid fa-trophy"></i>
                   {{ 'dashboard.actions.viewMotoGPResults' | t }}
                 </button>
                 <button mat-raised-button color="primary" class="main-btn" (click)="goTo('calendar')">
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
                   <button mat-raised-button color="warn" class="betting-btn" *ngIf="showLineupsButton" (click)="goTo('lineups', nextCalendarRace.id)">
                     <i class="fa-solid fa-users"></i>
                     {{ 'dashboard.actions.placeLineups' | t }}
                   </button>
                   <button mat-raised-button color="warn" class="betting-btn" *ngIf="showSprintBetButton" (click)="goTo('sprint-bet', nextCalendarRace.id)">
                     <i class="fa-solid fa-flag-checkered"></i>
                     {{ 'dashboard.actions.placeSprintBet' | t }}
                   </button>
                   <button mat-raised-button color="warn" class="betting-btn" *ngIf="showPlaceBetButton" (click)="goTo('race-bet', nextCalendarRace.id)">
                     <i class="fa-solid fa-motorcycle"></i>
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
               <mat-card-title class="team-title">
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
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <i class="fa-solid fa-crown"></i>
                          <h4>{{ 'dashboard.team.firstTierPilot' | t }}</h4>
                        </mat-panel-title>
                      </mat-expansion-panel-header>
                      <div class="rider-info">
                        <div class="rider-basic">
                          <span class="rider-name">{{ fantasyTeam.official_rider_1.first_name }} {{ fantasyTeam.official_rider_1.last_name }}</span>
                          <span class="rider-number">#{{ fantasyTeam.official_rider_1.number }}</span>
                        </div>
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
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <i class="fa-solid fa-medal"></i>
                          <h4>{{ 'dashboard.team.secondTierPilot' | t }}</h4>
                        </mat-panel-title>
                      </mat-expansion-panel-header>
                      <div class="rider-info">
                        <div class="rider-basic">
                          <span class="rider-name">{{ fantasyTeam.official_rider_2.first_name }} {{ fantasyTeam.official_rider_2.last_name }}</span>
                          <span class="rider-number">#{{ fantasyTeam.official_rider_2.number }}</span>
                        </div>
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
                      <mat-expansion-panel-header>
                        <mat-panel-title>
                          <i class="fa-solid fa-user-shield"></i>
                          <h4>{{ 'dashboard.team.thirdTierPilot' | t }}</h4>
                        </mat-panel-title>
                      </mat-expansion-panel-header>
                      <div class="rider-info">
                        <div class="rider-basic">
                          <span class="rider-name">{{ fantasyTeam.reserve_rider.first_name }} {{ fantasyTeam.reserve_rider.last_name }}</span>
                          <span class="rider-number">#{{ fantasyTeam.reserve_rider.number }}</span>
                        </div>
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
              <mat-card-title class="config-title">
                <i class="fa-solid fa-gear"></i>
                {{ 'dashboard.championship.configuration' | t }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="config-content">
                <!-- Championship Info Section -->
                <div class="config-section">
                  <h3 class="section-title">{{ 'dashboard.championship.info' | t }}</h3>
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
                  </div>
                </div>

                                    <!-- Scoring System Section -->
                  <div class="config-section">
                    <h3 class="section-title">{{ 'dashboard.championship.scoringSystem' | t }}</h3>
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
                <div class="config-section">
                  <h3 class="section-title">{{ 'dashboard.championship.rules' | t }}</h3>
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

      <!-- Animated pill to show active tab -->
      <!-- <div class="active-pill" [attr.data-route]="
        isActive('standings') ? 'standings' :
        isActive('next') ? 'next' :
        isActive('team') ? 'team' : 'config'
      "></div> -->
    </nav>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff;
      padding-top: calc(var(--app-header-height) + 8px);
    }

    .grid-content {
        display: grid;
        grid-template-columns: 1fr;
        width: min(100%, var(--content-max-width));
        margin-inline: auto;
        padding: 8px;
        gap: 12px;

        @media (min-width: 768px) {
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          padding: 30px;
        }

        @media (min-width: 1200px) {
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          padding: 40px;
        }
     }
    /* Dashboard Cards */
    .mat-mdc-card.fantasy-team-card,
    .mat-mdc-card.next-race-card,
    .mat-mdc-card.standings-card,
    .mat-mdc-card.championship-config-card {
      color: #333 !important;

      .mat-mdc-card-title {
        color: var(--primary-color) !important;
        display: flex;
        gap: 10px;
        align-items: center;
        font-family: 'MotoGP Bold' !important;
        font-size: 24px;
        padding: 10px;
      }
    }

    .cards-wrapper {
      display: contents;
    }
    .fantasy-team-card,
    .standings-card,
    .next-race-card,
    .championship-config-card {
      margin-bottom: 1rem;
        border-left: 4px solid var(--accent-red);
        border-radius: 12px;
        overflow: hidden;

                 .race-content {
           padding: 0 0.5rem;
           display: grid;
           gap: 1.5rem;
         }

         .race-info-section {
           display: grid;
           gap: 1rem;
           padding: 1rem 0;
           border-bottom: 1px solid #eee;
           margin-bottom: 1rem;

           .race-basic-info {
             display: grid;
             gap: 0.5rem;

             .race-round-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: linear-gradient(135deg, #d32f2f, #b71c1c);
              color: #fff;
              padding: 0.45rem 0.9rem;
              border-radius: 999px;
              font-size: 0.95rem;
              font-weight: 800;
              letter-spacing: .2px;
              box-shadow: 0 2px 10px rgba(211,47,47,.35);
              max-width: 150px;

              i { font-size: 1rem; }
             }

             .location-chip {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-top: .25rem;
                background: #fff;
                color: #222;
                border: 1px solid #e5e7eb;
                border-left: 4px solid #d32f2f;
                padding: 0.4rem 0.7rem 0.4rem 0.6rem;
                border-radius: 10px;
                font-weight: 600;
                box-shadow: 0 2px 8px rgba(0,0,0,.06);

                i { color: #d32f2f; }
              }

             .grand-prix-name {
               font-family: 'MotoGP Bold', sans-serif;
               color: var(--primary-color);
               font-size: clamp(1.5rem, 4vw, 2.5rem);
               margin: 0;
               line-height: 1.2;
               letter-spacing: -0.5px;
             }

             .circuit-location {
               display: flex;
               align-items: center;
               gap: 0.5rem;
               color: #666;
               font-size: 1.1rem;
               font-weight: 500;

               i {
                 color: #d32f2f;
                 font-size: 1.2rem;
               }
             }
           }

           .race-dates {
             .date-range {
               display: flex;
               align-items: center;
               gap: 0.5rem;
               color: #444;
               font-size: 1rem;
               font-weight: 500;

               i {
                 color: #d32f2f;
                 font-size: 1.2rem;
               }
             }

             .date-pill {
                display: flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(135deg, #fff8e1, #ffe3b3);
                border: 1px solid #ffd27a;
                border-left: 6px solid #ff9800;
                padding: 0.75rem 1rem;
                border-radius: 14px;
                box-shadow: 0 6px 16px rgba(255,152,0,.2);

                i { font-size: 1.2rem; color: #ff9800; }

                .date-lines {
                  display: grid;
                  gap: 2px;
                }
                .date-strong {
                  font-size: clamp(1rem, 2.6vw, 1.2rem);
                  font-weight: 800;
                  color: #543b00;
                  letter-spacing: .2px;
                }
                .date-sub {
                  font-size: .85rem;
                  font-weight: 600;
                  color: #6b4e00;
                  opacity: .9;
                }
              }
           }
         }

         .schedule-section {
           .section-title {
             font-size: 1.2rem;
             color: var(--primary-color);
             margin: 0 0 1rem 0;
             padding-bottom: 0.5rem;
             border-bottom: 2px solid #eee;
             font-weight: 600;
           }

           .schedule-grid {
             display: grid;
             gap: 1rem;

             .schedule-item {
               display: flex;
               align-items: center;
               gap: 1rem;
               padding: 1rem;
               border-radius: 12px;
               border: 1px solid #e9ecef;
               background: #fafafa;
               transition: all 0.3s ease;

               &:hover {
                 transform: translateY(-2px);
                 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
               }

               .schedule-icon {
                 display: flex;
                 align-items: center;
                 justify-content: center;
                 width: 50px;
                 height: 50px;
                 border-radius: 50%;
                 flex-shrink: 0;

                 i {
                   font-size: 1.5rem;
                   color: white;
                 }
               }

               .schedule-info {
                 flex: 1;

                 .schedule-label {
                   font-size: 0.9rem;
                   color: #666;
                   font-weight: 500;
                   margin-bottom: 0.25rem;
                 }

                 .schedule-time {
                   display: flex;
                   flex-direction: column;
                   gap: 0.25rem;

                   .day {
                     font-size: 0.8rem;
                     color: #999;
                     text-transform: uppercase;
                     letter-spacing: 0.5px;
                     font-weight: 500;
                   }

                   .time {
                     font-size: 1.1rem;
                     font-weight: 600;
                     color: var(--primary-color);
                   }
                 }
               }

               &.qualifying {
                 background: linear-gradient(135deg, #fff8e1, #fff3cd);
                 border-left: 4px solid #ff9800;

                 .schedule-icon {
                   background: linear-gradient(135deg, #ff9800, #f57c00);
                 }
               }

               &.sprint {
                 background: linear-gradient(135deg, #fce4ec, #f8bbd9);
                 border-left: 4px solid #e91e63;

                 .schedule-icon {
                   background: linear-gradient(135deg, #e91e63, #c2185b);
                 }
               }

               &.race {
                 background: linear-gradient(135deg, #ffebee, #ffcdd2);
                 border-left: 4px solid #d32f2f;

                 .schedule-icon {
                   background: linear-gradient(135deg, #d32f2f, #b71c1c);
                 }
               }
                         }
          }
        }

        /* Circuit Image Section */
        .circuit-image-section {
          margin: 1rem 0;

          .circuit-image-container {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);

            .circuit-image {
              width: 100%;
              height: 200px;
              object-fit: cover;
              transition: transform 0.3s ease;

              &:hover {
                transform: scale(1.05);
              }
            }

            .circuit-overlay {
              position: absolute;
              bottom: 0;
              left: 0;
              right: 0;
              background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
              color: white;
              padding: 1rem;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              font-weight: 600;
              font-size: 0.9rem;

              i {
                font-size: 1.2rem;
                color: #ffc107;
              }
            }
          }
        }

        .compact-details {
          display: grid;
          gap: 1.5rem;
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 0.5rem;

          .time-item {
            padding: 0.75rem;
            min-width: 120px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(245, 245, 245, 0.5);
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.05);
            transition: all 0.3s ease;
            position: relative;

            &:hover {
              background: rgba(245, 245, 245, 0.8);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            /* Add subtle border accent based on event type */
            &:nth-child(1) {
              border-left: 3px solid #ff9800; /* Orange for qualifying */
            }

            &:nth-child(2) {
              border-left: 3px solid #e91e63; /* Pink for sprint */
            }

            &:nth-child(3) {
              border-left: 3px solid #d32f2f; /* Red for race */
            }
          }

          .time-icon-container {
            display: flex;
            align-items: center;
            flex-shrink: 0;
            width: 2rem;

            .time-icon {
              font-size: clamp(1.5rem, 3vw, 2rem);
              color: #d32f2f;
              vertical-align: bottom;
            }
          }

          .time-info {
            display: grid;
            gap: 0.25rem;
          }

          .time-label {
            font-size: clamp(0.75rem, 2vw, 0.85rem);
            color: #666;
          }

          .time-value {
            font-weight: 600;
            color: var(--primary-color);
            font-size: clamp(0.9rem, 2.5vw, 1.1rem);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            position: relative;

            /* Style for day information */
            &::before {
              content: attr(data-day);
              font-size: 0.75em;
              font-weight: 500;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              background: rgba(102, 102, 102, 0.1);
              padding: 2px 6px;
              border-radius: 4px;
              margin-bottom: 2px;
            }
          }
        }

                 @media (max-width: 600px) {
           .race-content {
             gap: 1rem;
             padding: 0;
           }

           .race-info-section {
             gap: 0.8rem;
             padding: 0.75rem 0;

             .race-basic-info {
               gap: 0.4rem;

               .race-round-badge {
                 padding: 0.4rem 0.8rem;
                 font-size: 0.8rem;
               }

               .grand-prix-name {
                 font-size: clamp(1.5rem, 6vw, 2rem);
                 line-height: 1.1;
                 margin-top: .2rem;
                 margin-bottom: .3rem;
               }

               .circuit-location {
                 font-size: 1rem;
                 gap: 0.4rem;

                 i {
                   font-size: 1.1rem;
                 }
               }
             }

             .race-dates {
               .date-range {
                 font-size: 0.9rem;
                 gap: 0.4rem;

                 i {
                   font-size: 1.1rem;
                 }
               }
             }
           }

                       .schedule-section {
              .section-title {
                font-size: 1.1rem;
                margin-bottom: 0.75rem;
              }

              .schedule-grid {
                gap: 0.75rem;

                .schedule-item {
                  padding: 0.75rem;
                  gap: 0.75rem;

                  .schedule-icon {
                    width: 40px;
                    height: 40px;

                    i {
                      font-size: 1.2rem;
                    }
                  }

                  .schedule-info {
                    .schedule-label {
                      font-size: 0.85rem;
                      margin-bottom: 0.2rem;
                    }

                    .schedule-time {
                      gap: 0.2rem;

                      .day {
                        font-size: 0.75rem;
                      }

                      .time {
                        font-size: 1rem;
                      }
                    }
                  }
                }
              }
            }

            .circuit-image-section {
              margin: 0.75rem 0;

              .circuit-image-container {
                .circuit-image {
                  height: 150px;
                }

                .circuit-overlay {
                  padding: 0.75rem;
                  font-size: 0.8rem;

                  i {
                    font-size: 1rem;
                  }
                }
              }
            }
          }

          @media (max-width: 600px) {
          .location-chip {
            font-size: .95rem;
            padding: 0.35rem 0.6rem;
          }
          .date-pill {
            padding: 0.65rem 0.8rem;
            .date-strong { font-size: 1rem; }
            .date-sub    { font-size: .8rem; }
          }
        }

        @media (min-width: 768px) {
          .detail-row.date-location .detail-icon {
            font-size: 1.6rem;
            width: 1.6rem;
          }

          .time-icon-container {
            width: 2.5rem;
            justify-content: center;
          }
        }
      }

      mat-card-actions {
         display: flex;
         flex-direction: column;
         gap: 20px;
         padding: 1.5rem;
         border-top: 1px solid #eee;
         background: #fafafa;

         .main-actions {
          display: flex;
          flex-direction: column;
          gap: 7px !important;
          flex-wrap: wrap;
          justify-content: space-around;

           .main-btn {
             min-width: 160px;
             height: 48px;
             font-weight: 600;
             font-size: 0.95rem;
             border-radius: 8px;
             transition: all 0.3s ease;

             &:hover {
               transform: translateY(-2px);
               box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
             }

             .mdc-button__label {
               display: flex;
               align-items: center;
               justify-content: flex-start;
             }

             i {
               margin-right: 6px;
               font-size: 16px;
             }
           }
         }

         .betting-actions {
           border-top: 1px solid #e0e0e0;
           padding-top: 20px;

           .betting-header {
             display: flex;
             align-items: center;
             justify-content: center;
             gap: 8px;
             margin: 0 0 16px 0;
             color: #d32f2f;
             font-size: 1.1rem;
             font-weight: 600;
             padding: 12px 20px;
             background: linear-gradient(135deg, rgba(211, 47, 47, 0.1), rgba(211, 47, 47, 0.05));
             border-radius: 12px;
             border: 1px solid rgba(211, 47, 47, 0.2);

             i {
               font-size: 20px;
             }
           }

           .betting-buttons {
             display: flex;
             gap: 12px;
             flex-wrap: wrap;
             justify-content: center;

             .betting-btn {
               min-width: 150px;
               height: 44px;
               font-size: 0.9rem;
               font-weight: 600;
               border-radius: 8px;
               transition: all 0.3s ease;

               &:hover {
                 transform: translateY(-2px);
                 box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
               }

               .mdc-button__label {
                 display: flex;
                 align-items: center;
                 justify-content: flex-start;
               }

               i {
                 margin-right: 6px;
                 font-size: 14px;
               }
             }
           }
         }

        @media (max-width: 600px) {
           padding: 1rem;
           gap: 16px;

           .main-actions {
             gap: 8px;

             .main-btn {
               min-width: 140px;
               height: 44px;
               font-size: 0.9rem;

               .mdc-button__label {
                 display: flex;
                 align-items: center;
                 justify-content: flex-start;
               }

               i {
                 font-size: 14px;
                 margin-right: 5px;
               }
             }
           }

           .betting-actions {
             padding-top: 16px;

             .betting-header {
               font-size: 1rem;
               padding: 8px 16px;
               margin-bottom: 12px;
             }

             .betting-buttons {
               gap: 8px;

               .betting-btn {
                 min-width: 120px;
                 height: 40px;
                 font-size: 0.85rem;

                 .mdc-button__label {
                   display: flex;
                   align-items: center;
                   justify-content: flex-start;
                 }

                 i {
                   font-size: 12px;
                   margin-right: 4px;
                 }
               }
             }
         }
       }
     }

     span.mdc-button__label {
          display: flex !important;
          gap: 5px !important;
      }

     /* Championship Configuration Card */
     .championship-config-card {
       background: rgba(255, 255, 255, 0.95) !important;
       border: 2px solid #2196f3;
       border-radius: 12px;
       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

       .config-title {
         font-size: 1.5rem;
         color: var(--primary-color);
         display: flex;
         align-items: center;
         gap: 8px;

         i {
           color: #2196f3;
         }
       }

       .config-content {
         display: flex;
         flex-direction: column;
         gap: 1.5rem;
       }

       .config-section {
         .section-title {
           font-size: 1.1rem;
           color: var(--primary-color);
           margin: 0 0 1rem 0;
           padding-bottom: 0.5rem;
           border-bottom: 2px solid #eee;
           font-weight: 600;
         }

         .config-grid {
           display: grid;
           gap: 1rem;

           .config-item {
             display: flex;
             align-items: center;
             gap: 1rem;
             padding: 1rem;
             background: #f8f9fa;
             border-radius: 8px;
             border: 1px solid #e9ecef;
             transition: all 0.3s ease;

             &:hover {
               transform: translateY(-2px);
               box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
             }

             .config-icon {
               display: flex;
               align-items: center;
               justify-content: center;
               width: 40px;
               height: 40px;
               border-radius: 50%;
               background: linear-gradient(135deg, #2196f3, #1976f2);
               flex-shrink: 0;

               i {
                 font-size: 1.2rem;
                 color: white;
               }
             }

             .config-info {
               display: flex;
               flex-direction: column;
               gap: 0.25rem;
               flex: 1;

               .config-label {
                 font-size: 0.85rem;
                 color: #666;
                 font-weight: 500;
               }

               .config-value {
                 font-size: 1.1rem;
                 font-weight: 600;
                 color: #333;

                 &.active {
                   color: #28a745;
                 }
                 &.inactive {
                   color: #dc3545;
                 }
               }
             }
           }
         }

                   .scoring-grid {
            display: grid;
            gap: 1rem;

            .scoring-item {
              background: white;
              border-radius: 8px;
              border: 1px solid #e9ecef;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

              ::ng-deep .mat-expansion-panel-header {
                padding: 1rem;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-bottom: 1px solid #e9ecef;

                .mat-expansion-panel-header-title {
                  display: flex;
                  align-items: center;
                  gap: 0.5rem;
                  font-weight: 600;
                  color: #333;

                  i {
                    color: #2196f3;
                  }
                }
              }

              ::ng-deep .mat-expansion-panel-body {
                padding: 1rem;
              }

              .scoring-points {
                display: grid;
                gap: 0.5rem;

                .point-item {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 0.5rem;
                  background: #f8f9fa;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;

                  .position {
                    font-weight: 600;
                    color: #333;
                    background: #2196f3;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    min-width: 20px;
                    text-align: center;
                  }

                  .points {
                    font-weight: 600;
                    color: #28a745;
                  }
                }
              }
            }
          }

         .rules-grid {
           display: grid;
           gap: 1rem;

           .rule-item {
             display: flex;
             align-items: center;
             gap: 1rem;
             padding: 1rem;
             background: #f8f9fa;
             border-radius: 8px;
             border: 1px solid #e9ecef;
             transition: all 0.3s ease;

             &:hover {
               transform: translateY(-2px);
               box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
             }

             .rule-icon {
               display: flex;
               align-items: center;
               justify-content: center;
               width: 40px;
               height: 40px;
               border-radius: 50%;
               background: linear-gradient(135deg, #ff9800, #f57c00);
               flex-shrink: 0;

               i {
                 font-size: 1.2rem;
                 color: white;
               }
             }

             .rule-info {
               display: flex;
               flex-direction: column;
               gap: 0.25rem;
               flex: 1;

               .rule-label {
                 font-size: 0.85rem;
                 color: #666;
                 font-weight: 500;
               }

               .rule-value {
                 font-size: 1.1rem;
                 font-weight: 600;
                 color: #333;
               }
             }
           }
         }
       }

       mat-card-actions {
         display: flex;
         gap: 12px;
         justify-content: center;
         padding: 1rem;

         button {
           min-width: 160px;
           height: 44px;
           font-weight: 600;
           border-radius: 8px;
           transition: all 0.3s ease;

           &:hover {
             transform: translateY(-2px);
             box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
           }

           i {
             margin-right: 8px;
             font-size: 18px;
           }
         }
       }

       @media (max-width: 768px) {
         .config-content {
           gap: 1rem;
         }

         .config-section {
           .section-title {
             font-size: 1rem;
             margin-bottom: 0.75rem;
           }

           .config-grid,
           .scoring-grid,
           .rules-grid {
             gap: 0.75rem;

             .config-item,
             .rule-item {
               padding: 0.75rem;
               gap: 0.75rem;

               .config-icon,
               .rule-icon {
                 width: 35px;
                 height: 35px;

                 i {
                   font-size: 1rem;
                 }
               }

               .config-info,
               .rule-info {
                 .config-label,
                 .rule-label {
                   font-size: 0.8rem;
                 }

                 .config-value,
                 .rule-value {
                   font-size: 1rem;
                 }
               }
             }

                           .scoring-item {
                ::ng-deep .mat-expansion-panel-header {
                  padding: 0.75rem;

                  .mat-expansion-panel-header-title {
                    font-size: 0.9rem;
                  }
                }

                ::ng-deep .mat-expansion-panel-body {
                  padding: 0.75rem;
                }

                .scoring-points {
                  gap: 0.4rem;

                 .point-item {
                   padding: 0.4rem;

                   .position {
                     font-size: 0.75rem;
                     padding: 0.2rem 0.4rem;
                   }

                   .points {
                     font-size: 0.9rem;
                   }
                 }
               }
             }
           }
         }

         mat-card-actions {
           flex-direction: column;
           gap: 8px;

           button {
             min-width: 140px;
             height: 40px;
             font-size: 0.9rem;
           }
         }
       }
     }

     .fantasy-team-card mat-card-header,
    .standings-card mat-card-header,
    .next-race-card mat-card-header {
      text-align: center;
    }
    .team-title {
      font-size: 24px;
      font-weight: bold;
    }
    .team-image-container {
      text-align: center;
      margin: 16px 0;
    }
    .team-image-container img {
      width: 100%;
      max-width: 150px;
      height: auto;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
    .standings-table {
      width: 100%;
      border-collapse: collapse;
    }
    .standings-table th,
    .standings-table td {
      padding: 12px;
      border-bottom: 1px solid #ccc;
      text-align: left;
    }
    .standings-table tr.highlight {
      background-color: #ffecb3;
      font-weight: bold;
    }
    .next-race-card mat-card-content {
      padding: 16px;
    }
    @media (max-width: 600px) {
      .dashboard-container {
        padding-top: 70px;
      }
      .header {
        height: 70px;
      }
      .header-center h1 {
        font-size: 18px;
      }

      /* Mobile improvements for standings */
       .podium-section {
         padding: 0.75rem;

         .podium-row {
           height: 80px;
           gap: 0.4rem;

           .podium-item {
             .podium-rank {
               padding: 0.2rem 0.4rem;
               font-size: 0.8rem;

               i {
                 font-size: 0.9rem;
               }
             }

             .podium-user {
               .user-avatar {
                 width: 32px;
                 height: 32px;

                 i {
                   font-size: 1rem;
                 }
               }

               .user-details {
                 .username {
                   font-size: 0.7rem;
                 }

                 .score {
                   font-size: 0.6rem;
                 }
               }
             }
           }
         }
       }

      .standings-table {
        .rank-col {
          width: 5% !important;
          //min-width: 10px;
          max-width: 40px;

          .position-container {
            .position {
              font-size: 1rem;

              &.top-position {
                font-size: 1.2rem;
              }
            }

            .position-indicator i {
              font-size: 0.8rem;
            }
          }
        }

        .user-col {
          width: 70%;

          .user-info {
            gap: 0.5rem;

            .user-avatar-small {
              width: 28px;
              height: 28px;

              i {
                font-size: 0.9rem;
              }
            }

            .user-details {
              .username {
                font-size: 0.85rem;
              }

              .score-progress {
                max-width: 120px;
              }
            }
          }
        }

        .score-col {
          width: 15%;

          .score-display {
            .score-value {
              font-size: 1rem;
            }

            .score-label {
              font-size: 0.6rem;
            }
          }
        }

        .gap-col {
          width: 10%;

          .gap-display {
            .gap-value {
              font-size: 0.8rem;
            }

            .gap-label {
              font-size: 0.6rem;
            }
          }

          .gap-leader {
            font-size: 0.7rem;
            padding: 0.2rem 0.4rem;
          }
        }

        th, td {
          padding: 8px 4px;
        }
      }

      .current-user-summary {
        .summary-card {
          padding: 1rem;

          .summary-content {
            flex-direction: column;
            gap: 0.5rem;

            .position-info .position-number {
              font-size: 1.5rem;
            }

            .points-info .points-value {
              font-size: 1.2rem;
            }
          }
        }
      }
    }
         .fantasy-team-card {
       background: rgba(255, 255, 255, 0.95) !important;
       border: 2px solid #d32f2f;
       border-radius: 12px;
       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

       .team-title {
         font-size: 1.5rem;
         color: var(--primary-color);
         display: flex;
         align-items: center;
         gap: 8px;

         i {
           color: #d32f2f;
         }
       }

               .team-image-container {
          margin: 0.5rem 0;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;

          img {
            max-width: 80px;
            border: 2px solid var(--primary-color);
            padding: 2px;
            border-radius: 50%;
          }
        }

               .section-title {
          font-size: 1.1rem;
          color: var(--primary-color);
          margin: 1rem 0 0.75rem 0;
          padding-bottom: 0.4rem;
          border-bottom: 1px solid #eee;
          font-weight: 600;
        }

               .team-riders-section {
          margin-bottom: 1.5rem;
        }

                               .rider-grid {
           display: grid;
           gap: 1rem;
           margin: 0.75rem 0;

                    .rider {
             border-radius: 12px;
             border: 1px solid #e9ecef;
             background: #fafafa;
             transition: all 0.3s ease;
             overflow: hidden;

            &:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }

            ::ng-deep .mat-expansion-panel-header {
              padding: 1rem;
              background: transparent;
              border-bottom: 1px solid #e9ecef;

              .mat-expansion-panel-header-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--primary-color);
                font-size: 1.1rem;
                font-weight: 600;

                i {
                  color: var(--primary-color);
                  font-size: 1.2rem;
                }

                h4 {
                  margin: 0;
                  color: var(--primary-color);
                  font-size: 1.1rem;
                  font-weight: 600;
                }
              }
            }

            ::ng-deep .mat-expansion-panel-body {
              padding: 1rem;
            }

           .rider-info {
                           .rider-basic {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;

               .rider-name {
                 font-weight: 600;
                 font-size: 1.1rem;
                 color: #333;
               }

               .rider-number {
                 background: var(--secondary-color);
                 color: white;
                 padding: 4px 12px;
                 border-radius: 20px;
                 font-weight: bold;
                 font-size: 0.9rem;
               }
             }

                           .rider-stats {
                display: grid;
                gap: 0.4rem;

                               .stat-row {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  padding: 0.4rem;
                  background: white;
                  border-radius: 6px;
                  border: 1px solid #e9ecef;

                 .stat-label {
                   color: #666;
                   font-size: 0.9rem;
                   font-weight: 500;
                 }

                 .stat-value {
                   color: var(--primary-color);
                   font-weight: 600;
                   font-size: 1rem;
                   background: rgba(211, 47, 47, 0.1);
                   padding: 2px 8px;
                   border-radius: 12px;
                   min-width: 30px;
                   text-align: center;
                 }
               }
             }
           }
         }

         .first-tier {
           background: linear-gradient(135deg, #fff8e1, #fff3cd);
           border-left: 4px solid #ffc107;

           .rider-header i {
             color: #ffc107;
           }
         }

         .second-tier {
           background: linear-gradient(135deg, #e3f2fd, #bbdefb);
           border-left: 4px solid #2196f3;

           .rider-header i {
             color: #2196f3;
           }
         }

         .third-tier {
           background: linear-gradient(135deg, #f3e5f5, #e1bee7);
           border-left: 4px solid #9c27b0;

           .rider-header i {
             color: #9c27b0;
           }
         }
       }

               .betting-stats-section {
          margin-top: 1.5rem;

         .betting-stats-table {
           background: white;
           border-radius: 8px;
           overflow: hidden;
           box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

           table {
             width: 100%;
             border-collapse: collapse;

                           th {
                background: #f8f9fa;
                padding: 8px 12px;
                text-align: left;
                font-weight: 600;
                color: #333;
                font-size: 0.85rem;
                border-bottom: 2px solid #e9ecef;
              }

              td {
                padding: 8px 12px;
                border-bottom: 1px solid #f0f0f0;
                vertical-align: middle;

               &.pilot-name {
                                   .name {
                    display: block;
                    font-weight: 600;
                    color: #333;
                    font-size: 0.9rem;
                  }

                  .number {
                    display: block;
                    color: #666;
                    font-size: 0.75rem;
                    margin-top: 1px;
                  }
               }

                               &.sprint-bets,
                &.race-bets,
                &.total-bets {
                  text-align: center;
                  font-weight: 600;
                  font-size: 0.9rem;

                 &.sprint-bets {
                   color: #e91e63;
                 }

                 &.race-bets {
                   color: #d32f2f;
                 }

                 &.total-bets {
                   color: var(--primary-color);
                   background: rgba(211, 47, 47, 0.1);
                   border-radius: 4px;
                 }
               }
             }

             tr:hover {
               background-color: #f8f9fa;
             }
           }
         }
       }

       mat-card-actions {
         margin-top: auto;
         button {
           i {
             margin-right: 8px;
           }
         }
       }

               @media (max-width: 768px) {
          .team-image-container {
            margin: 0.25rem 0;
            padding: 0.25rem;

            img {
              max-width: 60px;
            }
          }

                     .rider-grid {
             gap: 0.75rem;

             .rider {
               ::ng-deep .mat-expansion-panel-header {
                 padding: 0.75rem;

                 .mat-expansion-panel-header-title {
                   font-size: 1rem;

                   i {
                     font-size: 1.1rem;
                   }

                   h4 {
                     font-size: 1rem;
                   }
                 }
               }

               ::ng-deep .mat-expansion-panel-body {
                 padding: 0.75rem;
               }

              .rider-info .rider-basic {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.4rem;
                margin-bottom: 0.5rem;
              }

              .rider-stats {
                gap: 0.3rem;

                .stat-row {
                  padding: 0.3rem;
                }
              }
            }
          }

          .betting-stats-table {
            table {
              th, td {
                padding: 6px 8px;
                font-size: 0.8rem;
              }
            }
          }
        }
     }

    /* Add these new animation-related styles */
    .mat-mdc-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      }

      &.standings-card,
      &.next-race-card,
      &.fantasy-team-card {
        animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    mat-card-actions button {
      transition: transform 0.2s ease-in-out;

      &:active {
        transform: scale(0.95);
      }
    }

    .rider-grid .rider {
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateX(5px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .time-item {
      transition: background 0.3s, transform 0.3s;

      &:hover {
        background: rgba(245, 245, 245, 0.8) !important;
        transform: scale(1.02);
      }
    }



    .standings-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Podium Section */
    .podium-section {
      background: linear-gradient(135deg,#f7f9fc,#eef2f6);
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,.06);
    }

    /* Grid layout for steps */
    .podium-steps {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      align-items: end;
      gap: 0.9rem;
      max-width: 820px;
      margin: 0 auto;
    }

    /* Base step style */
    .step {
      --h: 10rem;
      position: relative;
      height: var(--h);
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,.95), rgba(245,247,250,.98));
      border: 1px solid rgba(0,0,0,.06);
      box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 8px 20px rgba(0,0,0,.08);
      display: flex;
      align-items: end;
      justify-content: center;
      transition: transform .25s ease, box-shadow .25s ease;
    }
    .step:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 26px rgba(0,0,0,.12);
    }

    /* Heights per position */
    .step-1 { --h: clamp(8.5rem, 20vw, 11rem); }
    .step-2 { --h: clamp(7.2rem, 18vw, 9.5rem); }
    .step-3 { --h: clamp(6.2rem, 16vw, 8.5rem); }

    /* Crown bubble */
    .step-top {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #fff;
      border: 1px solid rgba(0,0,0,.08);
      box-shadow: 0 6px 16px rgba(0,0,0,.16);
    }
    .step-top i { font-size: 1rem; }

    /* Content inside each step */
    .step-body {
      width: 100%;
      text-align: center;
      display: grid;
      padding: 0.5rem 0.4rem 0.7rem;  /* was ~0.85–1rem */
      gap: 0.25rem;
    }
    .step .name {
      font-weight: 700;
      color: #333;
      font-size: .95rem;
      line-height: 1.2;
      word-break: break-word;
    }
    .step .pts {
      font-weight: 700;
      font-size: .9rem;
      color: #28a745;
    }

    /* Champion crown pulse */
    .champion .step-top i {
      animation: crownPulse 2.4s ease-in-out infinite;
    }
    @keyframes crownPulse {
      0%,100% { transform: scale(1); }
      50%     { transform: scale(1.12); }
    }

    /* Accents per step */
    .step-1 { box-shadow: inset 0 -4px 0 #ffd700, 0 8px 20px rgba(0,0,0,.08); }
    .step-2 { box-shadow: inset 0 -4px 0 #c0c0c0, 0 8px 20px rgba(0,0,0,.08); }
    .step-3 { box-shadow: inset 0 -4px 0 #cd7f32, 0 8px 20px rgba(0,0,0,.08); }

    .pos-badge {
      font-weight: 900;
      font-size: 1.1rem;
      display: inline-block;
      margin-bottom: 0.3rem;
    }

    .pos-badge i {
      font-weight: 900;
    }

    /* Colors match crowns */
    .pos-badge.gold   { color: #FFD700; }  /* gold */
    .pos-badge.silver { color: #C0C0C0; }  /* silver */
    .pos-badge.bronze { color: #CD7F32; }  /* bronze */


    /* Mobile adjustments */
    @media (max-width:600px) {
      .podium-steps { gap: .6rem; }
      .step-top { width: 36px; height: 36px; top: -16px; }
      .step .name { font-size: .82rem; }
      .step .pts { font-size: .8rem; }
      .pos-badge {display: none;}
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .table-container {
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .standings-table {
      width: 100%;
      border-collapse: collapse;
      background: white;
      font-size: 0.95em;

      th {
        padding: 0.15rem 1rem;
        font-weight: 600;
        color: #333;
        border-bottom: 2px solid #eee;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        background: #f8f9fa;
        font-size: 0.8rem;

        &:first-child, &:last-child { border-radius: 0; }
      }

      td {
        padding: 0.15rem;
        border-bottom: 1px solid #f0f0f0;
        vertical-align: middle;
      }

      tr:last-child td { border-bottom: none; }

      tr.highlight {
        background: linear-gradient(135deg, #fff8e1, #fff3cd);
        border-left: 4px solid #ffc107;
        td {
          font-weight: 600;
          color: #333;
        }
      }

      tr.top-three {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border-left: 4px solid #28a745;
      }

      .rank-col {
        width: 12%;
        text-align: center;
        font-weight: 600;
        color: #333;

        .position-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;

          .position {
            font-size: 1.2rem;
            font-weight: 700;
            color: #666;

            &.top-position {
              color: #28a745;
              font-size: 1.4rem;
            }
          }

          .position-indicator {
            i {
              font-size: 1rem;
              color: #ffc107;
            }
          }
        }
      }

      .user-col {
        width: 45%;

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .user-avatar-small {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #007bff, #0056b3);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            i {
              font-size: 1rem;
              color: white;
            }
          }

          .user-details {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            flex: 1;

            .username {
              font-weight: 600;
              color: #333;
              font-size: 0.95rem;
            }

            .score-progress {
              width: 100%;
              max-width: 200px;

              .progress-bar {
                width: 100%;
                height: 4px;
                background: #e9ecef;
                border-radius: 2px;
                overflow: hidden;

                .progress-fill {
                  height: 100%;
                  background: linear-gradient(90deg, #28a745, #20c997);
                  border-radius: 2px;
                  transition: width 0.3s ease;

                  &.current-user {
                    background: linear-gradient(90deg, #ffc107, #fd7e14);
                  }
                }
              }
            }
          }
        }
      }

      .score-col {
        width: 20%;
        text-align: center;

        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;

          .score-value {
            font-size: 1.1rem;
            font-weight: 700;
            color: #28a745;
          }

          .score-label {
            font-size: 0.7rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
      }

      .gap-col {
        width: 23%;
        text-align: center;

        .gap-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.1rem;

          .gap-value {
            font-size: 0.9rem;
            font-weight: 600;
            color: #dc3545;
          }

          .gap-label {
            font-size: 0.7rem;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }

        .gap-leader {
          font-size: 0.8rem;
          font-weight: 600;
          color: #28a745;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: rgba(40, 167, 69, 0.1);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
        }
      }

      tr:hover {
        background-color: #f8f9fa;
        transition: background-color 0.2s ease;
        transform: translateX(2px);
      }
    }

    /* Current User Summary */
    .current-user-summary {
      margin-top: 1rem;

      .summary-card {
        background: linear-gradient(135deg, #fff8e1, #fff3cd);
        border: 2px solid #ffc107;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.2);

        .summary-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
          color: #856404;
          font-weight: 600;
          font-size: 1rem;

          i {
            color: #ffc107;
          }
        }

        .summary-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;

          .position-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;

            .position-number {
              font-size: 2rem;
              font-weight: 700;
              color: #856404;
            }

            .position-label {
              font-size: 0.8rem;
              color: #856404;
              opacity: 0.8;
            }
          }

          .points-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;

            .points-value {
              font-size: 1.5rem;
              font-weight: 700;
              color: #28a745;
            }

            .points-label {
              font-size: 0.8rem;
              color: #28a745;
              opacity: 0.8;
            }
          }
        }
      }
    }

    .no-standings {
      padding: 2rem;
      text-align: center;
      background: white;
      color: #666;
      i {
        font-size: 2.5em;
        margin-bottom: 1rem;
        color: var(--primary-color);
      }
      p {
        margin: 0;
        font-size: 1.1em;
      }
    }

    .detail-row.date-location {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.25rem 0;

      .detail-icon {
        font-size: 1.4rem;
        color: #d32f2f;
        flex-shrink: 0;
        vertical-align: middle;
      }

      @media (min-width: 768px) {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;

        .detail-icon {
          font-size: 2rem;
          margin-right: 1rem;
          background: #ffe5e5;
          padding: 8px;
          border-radius: 50%;
        }

        .detail-text {
          font-size: 1.1rem;
          font-weight: 600;
        }
      }

      @media (min-width: 1200px) {
        flex-direction: row;
        align-items: center;
        gap: 1.5rem;

        .detail-icon {
          font-size: 2.5rem;
          padding: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      }
    }

    .time-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.5rem;

      @media (min-width: 768px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 1.5rem;

        .time-item {
          flex-direction: column;
          padding: 1.5rem;
          background: white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);

          .time-icon-container {
            width: auto;
            margin-bottom: 1rem;

            .time-icon {
              font-size: 1.4rem;
              padding: 12px;
              background: #fff0f0;
              border-radius: 50%;
            }
          }

          .time-label {
            font-size: 1rem;
            font-weight: 500;
          }

          .time-value {
            font-size: 1.4rem;
          }
        }
      }

      @media (min-width: 1200px) {
        grid-template-columns: repeat(3, 1fr);
        gap: 2rem;

        .time-item {
          padding: 2rem;
          border-radius: 16px;

          .time-icon {
            font-size: 3rem;
            padding: 16px;
          }

          .time-label {
            font-size: 1.1rem;
          }

          .time-value {
            font-size: 1.6rem;
          }
        }
      }
    }

    /* Font Awesome Icon Styles */
    .fa-solid {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    /* Ensure proper icon sizing and alignment */
    i.fa-solid {
      width: 1em;
      height: 1em;
      line-height: 1;
    }

    /* Icon container styles */
    .schedule-icon i,
    .config-icon i,
    .rule-icon i,
    .user-avatar i,
    .user-avatar-small i {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    /* Podium rank icons */
    .podium-rank i {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Position indicator icons */
    .position-indicator i {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Card title icons */
    .mat-mdc-card-title i {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
    }

    /* Button icons */
    button i {
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
    }

    /* Menu icons */
    .mat-menu-item i {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.5rem;
    }

    /* Crown color styles for podium positions */
    .crown-gold {
      color: #FFD700 !important; /* Gold color for 1st place */
    }

    .crown-silver {
      color: #C0C0C0 !important; /* Silver color for 2nd place */
    }

    .crown-bronze {
      color: #CD7F32 !important; /* Bronze color for 3rd place */
    }

    /* Reserve bottom space on mobile so content isn't hidden behind nav */
    @media (max-width: 768px) {
      .dashboard-container {
        padding-bottom: 90px;
      }
      /* Hide non-active cards on mobile */
      .mobile-hidden {
        display: none !important;
      }
    }

    /* Bottom nav (mobile only) */
    .bottom-nav {
      position: fixed;
      left: 0; right: 0; bottom: 0;
      z-index: 60;
      height: 72px;
      display: none; /* hidden by default; enabled by media query */
      grid-template-columns: repeat(4, 1fr);
      align-items: center;
      gap: .25rem;
      padding: .4rem .5rem max(.4rem, env(safe-area-inset-bottom));
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border-radius: 18px;
      width: min(560px, calc(100% - 18px));
      margin: 0 auto 10px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(74, 20, 140, 0.12);

    }
    .bottom-nav .item {
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .12rem;
      min-height: 56px;
      padding: .35rem 0;
      text-decoration: none;
      color: #2f2f2f;
      background: transparent;
      border: 0;
      border-radius: 12px;
      font-size: .7rem;
      line-height: 1;
      font-weight: 600;
      text-align: center;
    }
    .bottom-nav .item i { font-size: 1.05rem; }
    .bottom-nav .item .label {
      display: block;
      max-width: 72px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bottom-nav .item.active {
      color: var(--primary-color);
      background: rgba(74, 20, 140, 0.1);

      i {
        margin: 0;
        font-size: 1.18rem;
      }
    }

    /* Animated pill under active item */
    .bottom-nav .active-pill {
      position: absolute; bottom: .35rem; left: 0; right: 0;
      width: 10%; height: .25rem; border-radius: 999px;
      margin-left: 5%;
      background: #415aee; opacity: .9;
      transition: transform .22s ease;
      transform: translateX(0);
    }
    .bottom-nav .active-pill[data-route="standings"] { transform: translateX(calc(0 * 100%)); }
    .bottom-nav .active-pill[data-route="next"]      { transform: translateX(calc(1 * 100%)); }
    .bottom-nav .active-pill[data-route="team"]      { transform: translateX(calc(2 * 100%)); }
    .bottom-nav .active-pill[data-route="config"]    { transform: translateX(calc(3 * 100%)); }

    /* Show bottom nav only on mobile */
    @media (max-width: 768px) {
      .bottom-nav { display: grid; }
    }

    @media (max-width: 420px) {
      .bottom-nav .item .label {
        display: none;
      }

      .bottom-nav {
        height: 64px;
      }
    }

    /* On desktop: show all cards; bottom nav hidden by default above */
    @media (min-width: 769px) {
      /* ensure mobile-hidden has no effect on desktop */
      .mobile-hidden { display: initial !important; }
    }

  `]
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
    const eventDate = new Date(this.nextCalendarRace?.event_date || '');
    return today.toDateString() === eventDate.toDateString();
  }

  private computeButtonVisibility(): void {
    if (!this.nextCalendarRace) {
      this.showLineupsButton = false;
      this.showSprintBetButton = false;
      this.showPlaceBetButton = false;
      return;
    }

    this.showLineupsButton = this.raceScheduleService.canShowLineups(this.nextCalendarRace);
    this.showSprintBetButton = this.raceScheduleService.canShowSprintBet(this.nextCalendarRace);
    this.showPlaceBetButton = this.raceScheduleService.canShowRaceBet(this.nextCalendarRace);
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

    const eventDate = new Date(eventDateString);
    const startDate = new Date(eventDate);
    startDate.setDate(eventDate.getDate() - 2);

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
    const date = new Date(eventDate);
    date.setDate(date.getDate() - 1); // Qualifying is typically on Saturday
    return this.getDayName(date);
  }

  getSprintDay(eventDate: string): string {
    const date = new Date(eventDate);
    date.setDate(date.getDate() - 1); // Sprint is typically on Saturday
    return this.getDayName(date);
  }

  getRaceDay(eventDate: string): string {
    const date = new Date(eventDate);
    return this.getDayName(date); // Race is on Sunday
  }

  private getDayName(date: Date): string {
    return date.toLocaleDateString(this.locale, { weekday: 'long' });
  }

  get locale(): string {
    return this.i18nService.locale;
  }

  formatEventRange(eventDateString: string): string {
    if (!eventDateString) return '';
    const end = new Date(eventDateString);
    const start = new Date(end);
    start.setDate(end.getDate() - 2);

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
          race_scoring: this.getRaceScoringPoints(),
          sprint_scoring: this.getSprintScoringPoints()
        };;
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
