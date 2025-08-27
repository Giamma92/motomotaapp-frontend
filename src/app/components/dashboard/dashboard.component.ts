// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, StandingsRow, CalendarRace, FantasyTeam } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ChampionshipService } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, TimeFormatPipe, TranslatePipe],
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
          <mat-icon>more_vert</mat-icon>
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
      <main class="grid-content">
        <div class="cards-wrapper">
          <mat-card class="standings-card" *ngIf="classificationData && classificationData.length">
            <mat-card-header class="standings-header">
              <mat-card-title>
                <mat-icon>leaderboard</mat-icon>
                {{ 'dashboard.standings.title' | t }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
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
                        [class.highlight]="row.user_id.id === loggedUserId">
                      <td class="rank-col">
                        <span class="position">{{ row.position }}</span>
                      </td>
                      <td class="user-col">
                        <div class="user-info">
                          <span class="username">{{ row.user_id.first_name+ ' '+row.user_id.last_name || ('dashboard.anonymousRider' | t) }}</span>
                        </div>
                      </td>
                      <td class="score-col">{{ row.score | number:'1.0-0' }}</td>
                      <td class="gap-col">
                        {{ i < classificationData.length - 1 ?
                          (Math.abs(row.score - classificationData[i + 1].score) | number:'1.0-0') : '-' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div class="no-standings" *ngIf="!classificationData?.length">
                  <mat-icon>emoji_events</mat-icon>
                  <p>{{ 'dashboard.standings.empty' | t }}</p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="next-race-card" *ngIf="nextCalendarRace">
            <mat-card-header class="next-race-header">
              <mat-card-title>
                <mat-icon>flag</mat-icon>
                {{ isCurrentRace ? ('dashboard.nextRace.current' | t) : ('dashboard.nextRace.next' | t) }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="race-content">
                <div class="race-header">
                  <div class="header-main">
                    <span class="race-round">{{ 'dashboard.nextRace.round' | t:{num: nextCalendarRace.race_order} }}</span>
                    <h2 class="race-name">{{ nextCalendarRace.race_id.name }}</h2>
                  </div>

                  <div class="header-details">
                    <div class="detail-row date-location">
                      <mat-icon class="detail-icon">calendar_today</mat-icon>
                      <span class="detail-text">
                        {{ getEventDateRange(nextCalendarRace.event_date).start | date:'MMM d' }} -
                        {{ getEventDateRange(nextCalendarRace.event_date).end | date:'MMM d, y' }}
                      </span>
                    </div>

                    <div class="detail-row date-location">
                      <mat-icon class="detail-icon">place</mat-icon>
                      <span class="detail-text">{{ nextCalendarRace.race_id.location }}</span>
                    </div>
                  </div>
                </div>

                <div class="time-grid">
                  <div class="time-item">
                    <div class="time-icon-container">
                      <mat-icon class="time-icon">timer</mat-icon>
                    </div>
                    <div class="time-info">
                      <div class="time-label">{{ 'common.qualifying' | t }}</div>
                      <div class="time-value">
                        {{ nextCalendarRace.qualifications_time ?? '10:00:00' | timeFormat }}
                      </div>
                    </div>
                  </div>

                  <div class="time-item">
                    <div class="time-icon-container">
                      <mat-icon class="time-icon">flag</mat-icon>
                    </div>
                    <div class="time-info">
                      <div class="time-label">{{ 'common.sprint' | t }}</div>
                      <div class="time-value">
                        {{ nextCalendarRace.sprint_time ?? '15:00:00' | timeFormat }}
                      </div>
                    </div>
                  </div>

                  <div class="time-item">
                    <div class="time-icon-container">
                      <mat-icon class="time-icon">sports_motorsports</mat-icon>
                    </div>
                    <div class="time-info">
                      <div class="time-label">{{ 'common.race' | t }}</div>
                      <div class="time-value">
                        {{ nextCalendarRace.event_time ?? '14:00:00' | timeFormat }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <div class="button-row first-row">
                <button mat-raised-button color="primary" (click)="goTo('calendar')">{{ 'dashboard.actions.viewAllRaces' | t }}</button>
                <button mat-raised-button color="primary" (click)="goTo('race-detail', nextCalendarRace.id)">{{ 'dashboard.actions.viewRaceDetail' | t }}</button>
                <button mat-raised-button color="accent" (click)="goTo('motogp-results', nextCalendarRace.id)">{{ 'dashboard.actions.viewMotoGPResults' | t }}</button>
              </div>
              <div class="button-row second-row" *ngIf="showLineupsButton || showSprintBetButton || showPlaceBetButton">
                <button mat-raised-button color="accent" *ngIf="showLineupsButton" (click)="goTo('lineups', nextCalendarRace.id)">
                  {{ 'dashboard.actions.placeLineups' | t }}
                </button>
                <button mat-raised-button color="accent" *ngIf="showSprintBetButton" (click)="goTo('sprint-bet', nextCalendarRace.id)">
                  {{ 'dashboard.actions.placeSprintBet' | t }}
                </button>
                <button mat-raised-button color="accent" *ngIf="showPlaceBetButton" (click)="goTo('race-bet', nextCalendarRace.id)">
                  {{ 'dashboard.actions.placeRaceBet' | t }}
                </button>
              </div>
            </mat-card-actions>
          </mat-card>

          <mat-card class="fantasy-team-card" *ngIf="fantasyTeam">
            <mat-card-header>
              <mat-card-title class="team-title">
                <mat-icon>groups</mat-icon>
                {{ fantasyTeam.name }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="team-image-container" *ngIf="fantasyTeam.team_image">
                <img [src]="fantasyTeam.team_image" alt="{{ fantasyTeam.name }} Logo">
              </div>

              <div class="rider-grid">
                <div class="rider official-1">
                  <h3><mat-icon>sports_motorsports</mat-icon> {{ 'dashboard.team.primaryRider' | t }}</h3>
                  <div class="rider-details">
                    <span class="rider-name">{{ fantasyTeam.official_rider_1.first_name }} {{ fantasyTeam.official_rider_1.last_name }}</span>
                    <span class="rider-number">#{{ fantasyTeam.official_rider_1.number }}</span>
                  </div>
                </div>

                <div class="rider official-2">
                  <h3><mat-icon>two_wheeler</mat-icon> {{ 'dashboard.team.secondaryRider' | t }}</h3>
                  <div class="rider-details">
                    <span class="rider-name">{{ fantasyTeam.official_rider_2.first_name }} {{ fantasyTeam.official_rider_2.last_name }}</span>
                    <span class="rider-number">#{{ fantasyTeam.official_rider_2.number }}</span>
                  </div>
                </div>

                <div class="rider reserve">
                  <h3><mat-icon>engineering</mat-icon> {{ 'dashboard.team.reserveRider' | t }}</h3>
                  <div class="rider-details">
                    <span class="rider-name">{{ fantasyTeam.reserve_rider.first_name }} {{ fantasyTeam.reserve_rider.last_name }}</span>
                    <span class="rider-number">#{{ fantasyTeam.reserve_rider.number }}</span>
                  </div>
                </div>
              </div>

              <div class="team-stats">
                <div class="stat-item">
                  <span class="stat-label">{{ 'common.totalPoints' | t }}</span>
                  <span class="stat-value">{{ currentUserPoints }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ 'dashboard.team.remainingBudget' | t }}</span>
                  <span class="stat-value">€2.5M</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="goTo('teams')">
                <mat-icon>list_alt</mat-icon> {{ 'dashboard.actions.viewAllTeams' | t }}
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff;
      padding-top: 80px;
    }

    .grid-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      padding: 20px;

      @media (min-width: 768px) {
        grid-template-columns: 1fr;
        gap: 30px;
        padding: 30px;
      }

      @media (min-width: 1200px) {
        grid-template-columns: 1fr 1fr;
        gap: 40px;

        .fantasy-team-card {
          grid-column: 2;
          grid-row: 1 / span 2;
        }
      }
    }

    .next-race-card {
      @media (min-width: 1200px) {
        grid-column: 1;
      }
    }

    /* Tablet layout: standings full width, others below */
    @media (min-width: 768px) and (max-width: 1199px) {
      .grid-content {
        .standings-card {
          grid-column: 1;
          grid-row: 1;
        }

        .next-race-card {
          grid-column: 1;
          grid-row: 2;
        }

        .fantasy-team-card {
          grid-column: 1;
          grid-row: 3;
        }
      }
    }

    /* Dashboard Cards */
    .mat-mdc-card.fantasy-team-card,
    .mat-mdc-card.next-race-card,
    .mat-mdc-card.standings-card {
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
    .next-race-card {
      margin-bottom: 1rem;
        border-left: 4px solid var(--accent-red);
        border-radius: 12px;
        overflow: hidden;

        .race-content {
          padding: 0 0.5rem;
          display: grid;
          gap: 1rem;
        }

        .race-header {
          display: grid;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #eee;
          margin-bottom: 1rem;

          .header-main {
            display: grid;
            gap: 0.25rem;
          }

          .race-round {
            font-size: clamp(0.85rem, 2vw, 1rem);
            color: #666;
            font-weight: 500;
            letter-spacing: 0.5px;
          }

          .race-name {
            font-family: 'MotoGP Bold', sans-serif;
            color: var(--primary-color);
            font-size: clamp(1rem, 6vw, 2.8rem);
            margin: 0 0 0.5rem 0;
            line-height: 1.2;
            letter-spacing: -0.5px;
          }

          .header-details {
            display: grid;
            gap: 0.75rem;
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

            .detail-text {
              font-size: clamp(0.95rem, 2vw, 1.1rem);
              color: #444;
              font-weight: 500;
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
          }
        }

        @media (max-width: 600px) {
          .race-header {
            gap: 0.75rem;
            padding-bottom: 0.5rem;
            margin-bottom: 0.5rem;

            .race-name {
              font-size: clamp(2rem, 8vw + 0.5rem, 2.4rem);
              line-height: 1.1;
              margin-bottom: 0.25rem;
            }

            .race-round {
              font-size: 0.85rem;
            }

            .detail-row.date-location {
              gap: 0.5rem;

              .detail-icon {
                font-size: 1.2rem;
              }

              .detail-text {
                font-size: 0.95rem;
              }
            }
          }

          .race-content {
            gap: 0.5rem;
            padding: 0;
          }

          .time-grid {
            grid-template-columns: repeat(3, minmax(100px, 1fr));
            gap: 0.5rem;

            .time-item {
              padding: 0.5rem;
              min-width: unset;
              flex-direction: column;
              text-align: center;
              gap: 0.25rem;
            }

            .time-icon-container {
              justify-content: center;

              .time-icon {
                font-size: 1.5rem;
              }
            }

            .time-info {
              gap: 0.1rem;
            }

            .time-label {
              font-size: 0.65rem;
            }

            .time-value {
              font-size: 0.8rem;
            }
          }

          .detail-row.date-location {
            padding: 0.15rem 0;

            .detail-icon {
              font-size: 1rem;
            }

            .detail-text {
              font-size: 0.8rem;
            }
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
        gap: 12px;
        padding: 1rem;
        border-top: 1px solid #eee;

        .button-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          &.second-row {
            padding-top: 12px;
            border-top: 1px solid rgba(0, 0, 0, 0.12);

            button {
              background-color: rgba(255, 64, 129, 0.1);
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

      /* Mobile improvements for standings table */
      .standings-table {
        .rank-col {
          width: 10% !important; /* Make rank column narrower on mobile */
          min-width: 40px;
          font-size: 0.9rem;
        }

        .user-col {
          width: 45%; /* Give more space to user names */
        }

        .score-col {
          width: 25%;
          font-size: 0.9rem;
        }

        .gap-col {
          width: 20%;
          font-size: 0.85rem;
        }

        th, td {
          padding: 8px 4px; /* Reduce padding on mobile */
        }

        .user-info .username {
          font-size: 0.9rem; /* Slightly smaller font for usernames */
          line-height: 1.2;
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

        mat-icon {
          color: #d32f2f;
        }
      }

      .team-image-container {
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;

        img {
          max-width: 200px;
          border: 3px solid var(--primary-color);
          padding: 4px;
          border-radius: 50%;
        }
      }

      .rider-grid {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;

        .rider {
          padding: 1rem;
          border-radius: 8px;

          h3 {
            margin: 0 0 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--primary-color);
          }

          .rider-details {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .rider-name {
              font-weight: 500;
              font-size: 1.1rem;
            }

            .rider-number {
              background: var(--secondary-color);
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-weight: bold;
            }
          }
        }

        .official-1 { background: #f8d7da; border-left: 4px solid #dc3545; }
        .official-2 { background: #d1ecf1; border-left: 4px solid #0dcaf0; }
        .reserve { background: #e2e3e5; border-left: 4px solid #6c757d; }
      }

      .team-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-top: 1.5rem;

        .stat-item {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;

          .stat-label {
            display: block;
            color: #6c757d;
            font-size: 0.9rem;
          }

          .stat-value {
            display: block;
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--primary-color);
          }
        }
      }

      mat-card-actions {
        margin-top: auto;
        button {
          mat-icon {
            margin-right: 8px;
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

    .button-row {
      display: flex;
      gap: 10px;
    }

    .button-row.first-row {
      margin-bottom: 10px;
    }

    .button-row.second-row {
      margin-top: 10px;
    }

    .button-row.second-row button {
      background-color: var(--accent);
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
        padding: 12px 16px;
        font-weight: 500;
        color: #666;
        border-bottom: 2px solid #eee;
        text-transform: none;
        letter-spacing: normal;
        background: transparent;

        &:first-child, &:last-child { border-radius: 0; }
      }

      td {
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
      }

      tr:last-child td { border-bottom: none; }

      tr.highlight {
        background-color: #fff8e1;
        td { font-weight: 500; }
      }

      .rank-col {
        width: 15%;
        text-align: center;
        font-weight: 500;
        color: #444;
      }

      .user-col {
        .user-info {
          .username {
            font-weight: 500;
            color: #333;
          }
        }
      }

      .score-col {
        color: #222;
        font-weight: 600;
      }

      tr:hover {
        background-color: #f8f8f8;
        transition: background-color 0.2s ease;
      }
    }

    .no-standings {
      padding: 2rem;
      text-align: center;
      background: white;
      color: #666;
      mat-icon {
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
  `]
})
export class DashboardComponent implements OnInit {
  classificationData?: StandingsRow[];
  nextCalendarRace?: CalendarRace;
  fantasyTeam?: FantasyTeam;
  loggedUserId: string | null;
  championshipId: number = 0;

  // New boolean flags for button visibility
  showLineupsButton: boolean = false;
  showSprintBetButton: boolean = false;
  showPlaceBetButton: boolean = false;

  Math = Math;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService,
    private raceScheduleService: RaceScheduleService
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
    this.dashboardService.getFantasyTeam(champId).subscribe({
      next: (team: FantasyTeam) => {
        this.fantasyTeam = team;
      },
      error: (error: any) =>
        console.error('Error fetching fantasy team:', error)
    });
  }

  public get currentUserPoints() {
    return this.classificationData?.find(row => row.user_id.id === this.loggedUserId)?.score || 0;
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
}
