// src/app/calendar/calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationServiceService } from '../../services/notification.service';
import { I18nService } from '../../services/i18n.service';
import { DateUtils } from '../../utils/date-utils';
import { RaceDetails } from '../../services/race-detail.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TimeFormatPipe, TranslatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button class="app-nav-back app-back-arrow page-back-button" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'calendar.title' | t }}</h1>
      </header>
      <main class="main-content">
      <section class="calendar-desktop-shell">

        <!-- Desktop Table -->
        <div class="desktop-view">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>{{ 'calendar.table.round' | t }}</th>
                <th>{{ 'calendar.table.event' | t }}</th>
                <th>{{ 'calendar.table.date' | t }}</th>
                <th>{{ 'calendar.table.qualifying' | t }}</th>
                <th>{{ 'calendar.table.sprint' | t }}</th>
                <th>{{ 'calendar.table.race' | t }}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let race of calendar" [class.current-race]="race === calendar[currentRaceIndex]" [class.cancelled-race]="race.cancelled">
                <td class="round-number">{{ race.race_order }}</td>
                <td class="event-info">
                  <div class="event-name">
                    {{ race.race_id.name }}
                    <span class="cancelled-pill" *ngIf="race.cancelled">Cancellata</span>
                  </div>
                  <div class="event-location">
                    <mat-icon>location_on</mat-icon>
                    {{ race.race_id.location }}
                  </div>
                </td>
                <td><span class="detail-text">
                  {{ formatEventRange(race.event_date) }}
                  </span>
                </td>
                <td>{{ getQualifyingDay(race.event_date) | t }} {{ race.qualifications_time ?? '10:00:00' | timeFormat }}</td>
                <td>{{ getSprintDay(race.event_date) | t }} {{ race.sprint_time ?? '15:00:00' | timeFormat }}</td>
                <td>{{ getRaceDay(race.event_date) | t }} {{ race.event_time ?? '14:00:00' | timeFormat }}</td>
                <td>
                  <button mat-icon-button class="calendar-action-btn app-nav-icon" color="primary" (click)="goToRaceDetail(race)" aria-label="Apri dettagli gara">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                  <button mat-icon-button class="calendar-action-btn app-nav-icon app-nav-icon--accent" color="accent" (click)="goToMotoGPResults(race)" aria-label="View MotoGP Results">
                    <mat-icon>emoji_events</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Mobile: timeline list -->
      <div class="calendar-mobile-list" *ngIf="calendar.length > 0">
        <section class="calendar-mobile-hero" *ngIf="featuredMobileRace as race">
          <div class="mobile-hero-copy">
              <span class="mobile-hero-kicker">{{ getMobileRaceStateLabel(race) }}</span>
              <span class="cancelled-pill cancelled-pill-mobile" *ngIf="race.cancelled">Gara cancellata</span>
              <h2>{{ race.race_id.name }}</h2>
            <p>{{ formatEventRange(race.event_date) }} · {{ race.race_id.location }}</p>
            <div class="mobile-hero-status">
              <span class="status-pill" [class.status-pill-complete]="hasCompletedLineup(race)" [class.status-pill-missing]="!hasCompletedLineup(race)">L {{ hasCompletedLineup(race) ? 'ok' : 'x' }}</span>
              <span class="status-pill" [class.status-pill-complete]="hasCompletedSprintBet(race)" [class.status-pill-missing]="!hasCompletedSprintBet(race)">S {{ hasCompletedSprintBet(race) ? 'ok' : 'x' }}</span>
              <span class="status-pill" [class.status-pill-complete]="hasCompletedRaceBet(race)" [class.status-pill-missing]="!hasCompletedRaceBet(race)">R {{ hasCompletedRaceBet(race) ? 'ok' : 'x' }}</span>
              <span class="status-summary-pill">{{ getRaceCompletionLabel(race) }}</span>
            </div>
          </div>
          <div class="mobile-hero-sessions">
            <div class="hero-session-pill">
              <mat-icon>schedule</mat-icon>
              <span>{{ 'common.qualifying' | t }}</span>
              <strong>{{ getQualifyingDay(race.event_date) | t }} {{ race.qualifications_time ?? '10:00:00' | timeFormat }}</strong>
            </div>
            <div class="hero-session-pill">
              <mat-icon>bolt</mat-icon>
              <span>{{ 'common.sprint' | t }}</span>
              <strong>{{ getSprintDay(race.event_date) | t }} {{ race.sprint_time ?? '15:00:00' | timeFormat }}</strong>
            </div>
            <div class="hero-session-pill hero-session-pill-primary">
              <mat-icon>sports_motorsports</mat-icon>
              <span>{{ 'common.race' | t }}</span>
              <strong>{{ getRaceDay(race.event_date) | t }} {{ race.event_time ?? '14:00:00' | timeFormat }}</strong>
            </div>
          </div>
          <div class="mobile-hero-actions">
            <button
              mat-flat-button
              class="hero-action hero-action-primary"
              (click)="goToRaceDetail(race)">
              <mat-icon>arrow_forward</mat-icon>
              <span>Apri gara</span>
            </button>
            <button
              mat-stroked-button
              class="hero-action hero-action-secondary"
              (click)="goToMotoGPResults(race)"
              aria-label="View MotoGP Results">
              <mat-icon>emoji_events</mat-icon>
              <span>Risultati</span>
            </button>
          </div>
        </section>

        <section class="mobile-timeline">
          <details
            class="calendar-race-panel"
            *ngFor="let race of calendar; let i = index"
            [attr.open]="isRacePanelInitiallyOpen(i) ? true : null"
            [class.calendar-race-panel--featured]="i === currentRaceIndex"
            [class.calendar-race-panel--past]="i < currentRaceIndex"
            [class.calendar-race-panel--future]="i > currentRaceIndex"
            [class.calendar-race-panel--cancelled]="race.cancelled">
            <summary class="card-header race-panel-toggle">
              <div class="header-content">
                <div class="header-topline">
                  <div class="round-badge">{{ 'calendar.raceNum' | t:{num: race.race_order} }}</div>
                  <div class="header-topline-right">
                    <span class="race-state-pill" [class.race-state-pill--current]="i === currentRaceIndex" [class.race-state-pill--past]="i < currentRaceIndex" [class.race-state-pill--future]="i > currentRaceIndex">
                      {{ getMobileRaceStateLabel(race, i) }}
                    </span>
                    <span class="cancelled-pill" *ngIf="race.cancelled">Cancellata</span>
                    <span class="panel-chevron" aria-hidden="true">
                      <mat-icon>expand_more</mat-icon>
                    </span>
                  </div>
                </div>
                <h2 class="race-title">{{ race.race_id.name }}</h2>
                <div class="race-subtitle">
                  <div class="event-details">
                    <div class="detail-item">
                      <mat-icon>event</mat-icon>
                      <span class="detail-text">{{ formatEventRange(race.event_date) }}</span>
                    </div>
                    <div class="detail-item">
                      <mat-icon>location_on</mat-icon>
                      <span class="location-text">{{ race.race_id.location }}</span>
                    </div>
                  </div>
                </div>
                <div class="race-personal-status">
                  <span class="status-pill" [class.status-pill-complete]="hasCompletedLineup(race)" [class.status-pill-missing]="!hasCompletedLineup(race)">Schieramento {{ hasCompletedLineup(race) ? 'ok' : 'manca' }}</span>
                  <span class="status-pill" [class.status-pill-complete]="hasCompletedSprintBet(race)" [class.status-pill-missing]="!hasCompletedSprintBet(race)">Sprint {{ hasCompletedSprintBet(race) ? 'ok' : 'manca' }}</span>
                  <span class="status-pill" [class.status-pill-complete]="hasCompletedRaceBet(race)" [class.status-pill-missing]="!hasCompletedRaceBet(race)">Race {{ hasCompletedRaceBet(race) ? 'ok' : 'manca' }}</span>
                </div>
              </div>
            </summary>

            <div class="race-main">
              <div class="race-content">
                <div class="race-details-vertical">
                  <div class="time-detail-container">
                    <div class="time-icon-container">
                      <mat-icon class="time-icon">timer</mat-icon>
                    </div>
                    <div class="time-info">
                      <span class="time-label">{{ 'common.qualifying' | t }}</span>
                      <span class="time-value">{{ getQualifyingDay(race.event_date) | t }} {{ race.qualifications_time ?? '10:00:00' | timeFormat }}</span>
                    </div>
                  </div>
                  <div class="time-detail-container">
                    <div class="time-icon-container">
                      <mat-icon class="time-icon">flag</mat-icon>
                    </div>
                    <div class="time-info">
                      <span class="time-label">{{ 'common.sprint' | t }}</span>
                      <span class="time-value">{{ getSprintDay(race.event_date) | t }} {{ race.sprint_time ?? '15:00:00' | timeFormat }}</span>
                    </div>
                  </div>
                  <div class="time-detail-container">
                    <div class="time-icon-container">
                      <mat-icon class="time-icon">sports_motorsports</mat-icon>
                    </div>
                    <div class="time-info">
                      <span class="time-label">{{ 'common.race' | t }}</span>
                      <span class="time-value">{{ getRaceDay(race.event_date) | t }} {{ race.event_time ?? '14:00:00' | timeFormat }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="action-buttons">
              <button
                mat-flat-button
                class="race-action race-action-details"
                (click)="goToRaceDetail(race)">
                <mat-icon>arrow_forward</mat-icon>
                <span>Dettagli</span>
              </button>
              <button
                mat-flat-button
                class="race-action race-action-results"
                (click)="goToMotoGPResults(race)"
                aria-label="View MotoGP Results">
                <mat-icon>emoji_events</mat-icon>
                <span>Risultati</span>
              </button>
            </div>
          </details>
        </section>
      </div>
      </main>
    </div>
  `,
  styles: [`
    :host {
      --mm-red: #c8102e;
      --mm-black: #111214;
      --mm-white: #ffffff;
      --mm-text: #17181a;
      --mm-muted: #5f6670;
      --mm-border: rgba(17, 18, 20, 0.14);
      --mm-soft-red: rgba(200, 16, 46, 0.08);
    }

    .page-container {
      min-height: 100vh;
      padding: 0;
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.14), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(0, 0, 0, 0.05), transparent 34%),
        linear-gradient(158deg, #ffffff 0%, #f8f8f9 48%, #f1f2f4 100%);
      color: var(--mm-text);
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--app-header-height);
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 0 clamp(10px, 2.4vw, 20px);
      background: rgba(17, 18, 20, 0.97);
      color: var(--mm-white);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
      z-index: 1000;
    }

    .page-back-button {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: linear-gradient(180deg, #17191f 0%, #111214 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--mm-white);
      flex: 0 0 auto;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    }

    .header h1 {
      margin: 0;
      flex: 1;
      text-align: center;
      font-family: 'MotoGP Bold', sans-serif;
      letter-spacing: 0.3px;
      font-size: clamp(1.02rem, 2.9vw, 1.45rem);
      color: var(--mm-white);
      text-transform: uppercase;
      padding-right: 42px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .main-content {
      width: 100%;
      max-width: none;
      margin: 0 auto;
      padding: calc(var(--app-header-height) + 2px) clamp(10px, 2.5vw, 22px) 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .calendar-desktop-shell {
      width: 100%;
      border-radius: 0;
      background: transparent;
      border: 0;
      box-shadow: none;
      overflow: hidden;
      margin: 0;
    }

    .desktop-view {
      display: block;
      padding: 0;
    }

    .dashboard-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 0.93rem;
    }

    .dashboard-table th,
    .dashboard-table td {
      padding: 0.68rem 0.55rem;
      border-bottom: 1px solid rgba(17, 18, 20, 0.08);
      text-align: left;
      vertical-align: middle;
    }

    .dashboard-table th {
      background: var(--mm-black);
      color: var(--mm-white);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.42px;
      line-height: 1.2;
    }

    .dashboard-table tbody tr:hover {
      background: rgba(17, 18, 20, 0.03);
    }

    .dashboard-table tr.current-race {
      background: linear-gradient(90deg, rgba(200, 16, 46, 0.1), rgba(200, 16, 46, 0.02));
    }

    .dashboard-table tr.cancelled-race {
      background: repeating-linear-gradient(135deg, rgba(17, 18, 20, 0.05) 0 8px, rgba(17, 18, 20, 0.02) 8px 16px);
      opacity: 0.74;
    }

    .dashboard-table td.round-number {
      width: 72px;
      text-align: center;
      font-family: 'MotoGP Bold', sans-serif;
      color: var(--mm-red);
      font-size: 0.98rem;
    }

    .event-name {
      font-weight: 700;
      color: var(--mm-black);
      line-height: 1.24;
      margin-bottom: 2px;
    }

    .cancelled-pill {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      margin-left: 0.4rem;
      padding: 0.18rem 0.48rem;
      border-radius: 999px;
      background: #111214;
      color: #fff;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.62rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      vertical-align: middle;
    }

    .cancelled-pill-mobile {
      margin-left: 0;
      margin-bottom: 0.15rem;
    }

    .event-location {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--mm-muted);
      font-size: 0.82rem;
      line-height: 1.2;
    }

    .event-location mat-icon {
      color: var(--mm-red);
      width: 16px;
      height: 16px;
      font-size: 16px;
    }

    .detail-text {
      color: #353941;
      font-weight: 600;
      font-size: 0.86rem;
      line-height: 1.25;
    }

    .dashboard-table td:last-child {
      width: 84px;
      text-align: right;
      white-space: nowrap;
    }

    .dashboard-table td .calendar-action-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      margin-left: 6px;
    }

    .dashboard-table td .calendar-action-btn[color='primary'] {
      background: linear-gradient(180deg, #17191f 0%, #0f1015 100%);
      color: var(--mm-white);
      border-color: rgba(255, 255, 255, 0.08);
    }

    .dashboard-table td .calendar-action-btn[color='accent'] {
      background: linear-gradient(180deg, #d91a3a 0%, #b10f2b 100%);
      color: var(--mm-white);
      border-color: rgba(133, 5, 28, 0.42);
    }

    .calendar-mobile-list {
      display: none;
      width: 100%;
      gap: 10px;
      flex-direction: column;
    }

    .calendar-mobile-hero {
      position: relative;
      display: grid;
      gap: 12px;
      padding: 1rem;
      border-radius: 22px;
      overflow: hidden;
      background:
        radial-gradient(circle at top right, rgba(200, 16, 46, 0.2), transparent 34%),
        linear-gradient(155deg, rgba(17, 18, 20, 0.98), rgba(35, 39, 46, 0.94));
      color: var(--mm-white);
      box-shadow: 0 18px 34px rgba(8, 11, 18, 0.16);
    }

    .calendar-mobile-hero::after {
      content: '';
      position: absolute;
      inset: auto -20% -34% auto;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent 68%);
      pointer-events: none;
    }

    .mobile-hero-copy,
    .mobile-hero-sessions,
    .mobile-hero-actions {
      position: relative;
      z-index: 1;
    }

    .mobile-hero-copy {
      display: grid;
      gap: 6px;
    }

    .mobile-hero-kicker {
      display: inline-flex;
      align-items: center;
      width: fit-content;
      min-height: 28px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.72rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }

    .mobile-hero-copy h2 {
      margin: 0;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: clamp(1.32rem, 4.8vw, 1.9rem);
      line-height: 0.98;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }

    .mobile-hero-copy p {
      margin: 0;
      color: rgba(255, 255, 255, 0.82);
      font-size: 0.88rem;
      line-height: 1.35;
    }

    .mobile-hero-status,
    .race-personal-status {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }

    .status-pill,
    .status-summary-pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 9px;
      border-radius: 999px;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.62rem;
      letter-spacing: 0.08em;
      line-height: 1;
      white-space: nowrap;
    }

    .status-pill {
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.88);
    }

    .status-pill-complete {
      background: rgba(31, 143, 67, 0.18);
      border-color: rgba(120, 214, 151, 0.26);
      color: #dbfae7;
    }

    .status-pill-missing {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.76);
    }

    .status-summary-pill {
      background: rgba(255, 110, 132, 0.12);
      border: 1px solid rgba(255, 110, 132, 0.24);
      color: #ffd9e0;
    }

    .mobile-hero-sessions {
      display: grid;
      gap: 8px;
    }

    .hero-session-pill {
      display: grid;
      grid-template-columns: 28px minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
      min-height: 42px;
      padding: 0 10px;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.76rem;
    }

    .hero-session-pill mat-icon {
      width: 28px;
      height: 28px;
      font-size: 15px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #ff8ca0;
    }

    .hero-session-pill span {
      grid-column: 2;
      min-width: 0;
      color: rgba(255, 255, 255, 0.94);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.8rem;
      line-height: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hero-session-pill strong {
      grid-column: 3;
      justify-self: end;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.76rem;
      text-align: right;
      line-height: 1;
      white-space: nowrap;
      padding: 5px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .hero-session-pill-primary {
      background: rgba(255, 110, 132, 0.12);
      border-color: rgba(255, 110, 132, 0.24);
    }

    .hero-session-pill-primary mat-icon {
      background: rgba(255, 110, 132, 0.14);
      border-color: rgba(255, 110, 132, 0.2);
      color: #ffd9e0;
    }

    .hero-session-pill-primary strong {
      background: rgba(255, 110, 132, 0.14);
      border-color: rgba(255, 110, 132, 0.22);
      color: #fff0f3;
    }

    .mobile-hero-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .hero-action {
      min-height: 44px;
      border-radius: 16px;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.78rem;
      letter-spacing: 0.18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      white-space: nowrap;
    }

    .hero-action-primary {
      background: linear-gradient(180deg, #d91a3a 0%, #b10f2b 100%) !important;
      color: var(--mm-white) !important;
    }

    .hero-action-secondary {
      border-color: rgba(255, 255, 255, 0.18) !important;
      color: var(--mm-white) !important;
      background: rgba(255, 255, 255, 0.04) !important;
    }

    .mobile-timeline {
      display: grid;
      gap: 10px;
    }

    .calendar-race-panel {
      width: 100%;
      margin: 0;
      border-radius: 18px;
      border: 1px solid rgba(17, 18, 20, 0.08);
      box-shadow: 0 12px 26px rgba(8, 11, 18, 0.06);
      overflow: hidden;
      background: var(--mm-white);
      position: relative;
    }

    .calendar-race-panel[open] {
      box-shadow: 0 16px 34px rgba(8, 11, 18, 0.1);
    }

    .calendar-race-panel::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      background: rgba(17, 18, 20, 0.1);
    }

    .calendar-race-panel--featured::before {
      background: linear-gradient(180deg, #ff6e84 0%, var(--mm-red) 100%);
    }

    .calendar-race-panel--past {
      opacity: 0.9;
    }

    .calendar-race-panel--past .card-header {
      background: linear-gradient(145deg, #2a2e36, #1f232a);
    }

    .calendar-race-panel--featured {
      transform: translateY(-1px);
      box-shadow: 0 16px 34px rgba(8, 11, 18, 0.1);
    }

    .calendar-race-panel .card-header {
      background: linear-gradient(145deg, #17191f, #111214);
      color: var(--mm-white);
      padding: 0.95rem 1rem 0.88rem;
      width: 100%;
      border-radius: 0;
    }

    .calendar-race-panel .race-panel-toggle {
      display: block;
      cursor: pointer;
      list-style: none;
    }

    .calendar-race-panel .race-panel-toggle::-webkit-details-marker {
      display: none;
    }

    .calendar-race-panel .header-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .calendar-race-panel .header-topline {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .calendar-race-panel .header-topline-right {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .calendar-race-panel .round-badge {
      align-self: flex-start;
      background: var(--mm-red);
      color: var(--mm-white);
      border-radius: 999px;
      padding: 2px 10px;
      font-size: 0.75rem;
      font-family: 'MotoGP Bold', sans-serif;
      letter-spacing: 0.25px;
      text-transform: uppercase;
    }

    .calendar-race-panel .race-state-pill {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 9px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.92);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.62rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .calendar-race-panel .race-state-pill--current {
      background: rgba(255, 110, 132, 0.16);
      border-color: rgba(255, 110, 132, 0.28);
      color: #ffd9e0;
    }

    .calendar-race-panel .race-state-pill--past {
      color: rgba(255, 255, 255, 0.74);
    }

    .calendar-race-panel--cancelled {
      opacity: 0.78;
      filter: grayscale(0.25);
    }

    .calendar-race-panel .panel-chevron {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.86);
      border: 1px solid rgba(255, 255, 255, 0.12);
      transition: transform 0.2s ease;
      flex: 0 0 auto;
    }

    .calendar-race-panel .panel-chevron mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
    }

    .calendar-race-panel[open] .panel-chevron {
      transform: rotate(180deg);
    }

    .calendar-race-panel .race-title {
      margin: 0;
      color: var(--mm-white);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.1rem;
      line-height: 1.12;
      padding: 0;
      text-transform: uppercase;
    }

    .calendar-race-panel .race-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.92);
    }

    .calendar-race-panel .race-personal-status {
      margin-top: 2px;
    }

    .calendar-race-panel .race-personal-status .status-pill {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .calendar-race-panel .race-personal-status .status-pill-complete {
      background: rgba(31, 143, 67, 0.18);
      border-color: rgba(120, 214, 151, 0.26);
      color: #dbfae7;
    }

    .calendar-race-panel .race-personal-status .status-pill-missing {
      color: rgba(255, 255, 255, 0.74);
    }

    .calendar-race-panel .event-details {
      display: grid;
      gap: 4px;
    }

    .calendar-race-panel .detail-item {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: rgba(255, 255, 255, 0.92);
      font-size: 0.84rem;
      line-height: 1.25;
    }

    .calendar-race-panel .detail-item mat-icon {
      width: 15px;
      height: 15px;
      font-size: 15px;
      color: #ff8ca0;
    }

    .calendar-race-panel .race-main {
      padding: 0.76rem 0.85rem 0.68rem;
      background: var(--mm-white);
    }

    .calendar-race-panel:not([open]) .race-main,
    .calendar-race-panel:not([open]) .action-buttons {
      display: none;
    }

    .calendar-race-panel .race-content,
    .calendar-race-panel .race-details-vertical {
      display: grid;
      gap: 8px;
    }

    .calendar-race-panel .time-detail-container {
      display: flex;
      align-items: center;
      gap: 9px;
      padding: 9px 10px;
      border-radius: 12px;
      border: 1px solid rgba(17, 18, 20, 0.1);
      background: linear-gradient(180deg, rgba(247, 248, 250, 0.96), rgba(255, 255, 255, 1));
    }

    .calendar-race-panel .time-icon-container {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--mm-black);
      color: var(--mm-white);
      flex: 0 0 auto;
    }

    .calendar-race-panel .time-icon {
      width: 15px;
      height: 15px;
      font-size: 15px;
      color: var(--mm-white);
    }

    .calendar-race-panel .time-info {
      min-width: 0;
      display: grid;
      gap: 1px;
    }

    .calendar-race-panel .time-label {
      color: var(--mm-muted);
      font-size: 0.67rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      line-height: 1.1;
    }

    .calendar-race-panel .time-value {
      color: #20242b;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.9rem;
      line-height: 1.15;
      letter-spacing: 0.2px;
      word-break: break-word;
    }

    .calendar-race-panel .action-buttons {
      padding: 0.2rem 0.85rem 0.82rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      background: var(--mm-white);
    }

    .calendar-race-panel .action-buttons .race-action {
      min-height: 40px;
      border-radius: 10px;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.76rem;
      letter-spacing: 0.18px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 10px;
      box-shadow: none;
      border: 1px solid transparent;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .calendar-race-panel .action-buttons .race-action mat-icon {
      width: 16px;
      height: 16px;
      font-size: 16px;
      flex: 0 0 auto;
    }

    .calendar-race-panel .action-buttons .race-action-results {
      background: linear-gradient(180deg, #fff1f4, #ffe4ea);
      color: #aa1029;
      border-color: rgba(200, 16, 46, 0.18);
    }

    .calendar-race-panel .action-buttons .race-action-details {
      background: var(--mm-black);
      color: var(--mm-white);
    }

    .calendar-race-panel .action-buttons .race-action:disabled {
      opacity: 0.45;
    }

    @media (max-width: 1024px) {
      .dashboard-table {
        font-size: 0.88rem;
      }

      .dashboard-table th,
      .dashboard-table td {
        padding: 0.62rem 0.46rem;
      }
    }

    @media (max-width: 768px) {
      .main-content {
        padding: calc(var(--app-header-height) + 2px) 10px 10px;
      }

      .calendar-desktop-shell {
        display: none;
      }

      .calendar-mobile-list {
        display: flex;
        gap: 10px;
      }

      .header {
        padding: 0 8px;
      }

      .header h1 {
        font-size: 0.98rem;
        padding-right: 40px;
      }

      .page-back-button {
        width: 40px;
        height: 40px;
      }

      .mobile-hero-actions {
        grid-template-columns: 1fr;
      }

      .hero-session-pill {
        grid-template-columns: 28px minmax(0, 1fr) auto;
        align-items: center;
        min-height: 40px;
        padding: 0 10px;
      }

      .calendar-race-panel .card-header {
        padding: 0.88rem 0.9rem 0.8rem;
      }

      .calendar-race-panel .header-topline {
        align-items: flex-start;
      }

      .calendar-race-panel .header-topline-right {
        gap: 6px;
      }

      .calendar-race-panel .panel-chevron {
        width: 28px;
        height: 28px;
      }
    }

    @media (min-width: 769px) {
      .calendar-mobile-list {
        display: none;
      }
    }
  `]
})
export class CalendarComponent implements OnInit {
  currentRaceIndex: number = 0;
  calendar: CalendarRace[] = [];
  championshipId: number = 0;
  raceDetails: RaceDetails | null = null;

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
      this.championshipId = champId;
      this.dashboardService.getCalendar(champId).subscribe({
        next: (data: CalendarRace[]) => {
          this.calendar = data ?? [];
          this.findCurrentRace();
        },
        error: (err) => {
          console.error('Error fetching calendar data:', err);
          this.calendar = [];
          this.currentRaceIndex = 0;
        }
      });

      this.dashboardService.getRaceDetails(champId).subscribe({
        next: (data: RaceDetails) => {
          this.raceDetails = data;
        },
        error: (err) => {
          console.error('Error fetching user race details:', err);
          this.raceDetails = null;
        }
      });
    });
  }

  private findCurrentRace() {
    if (!this.calendar.length) {
      this.currentRaceIndex = 0;
      return;
    }

    const now = new Date();
    const nextRaceIndex = this.calendar.findIndex(race =>
      (() => {
        if (race.cancelled) return false;
        const eventDate = DateUtils.parseLocalYyyyMmDd(race.event_date);
        return eventDate ? eventDate >= now : false;
      })()
    );

    this.currentRaceIndex = nextRaceIndex === -1 ? this.calendar.length - 1 : nextRaceIndex;
  }

  get featuredMobileRace(): CalendarRace | null {
    return this.calendar[this.currentRaceIndex] ?? this.calendar[0] ?? null;
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



  goBack(): void {
    this.router.navigate(['/']);  // Navigates back to the dashboard
  }

  goToRaceDetail(race: CalendarRace): void {
    // Assumes that race.race_id has an 'id' property.
    const calendarRaceId = race.id;
    this.router.navigate(['/race-detail', calendarRaceId]);
  }

  goToMotoGPResults(race: CalendarRace): void {
    this.router.navigate(['/motogp-results', this.championshipId, race.id]);
  }

  isAdmin() {
    return this.authService.isCurrentUserAdmin();
  }

  getDayBefore(eventDateString: string): Date {
    if (!eventDateString) return new Date();
    const eventDate = DateUtils.parseLocalYyyyMmDd(eventDateString);
    return eventDate ? DateUtils.addDays(eventDate, -1) : new Date();
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
    const fmt = new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' });
    // @ts-ignore: formatRange is supported in modern browsers
    return typeof fmt.formatRange === 'function'
      ? fmt.formatRange(start, end)
      : `${fmt.format(start)} – ${fmt.format(end)}`;
  }

    hasCompletedLineup(race: CalendarRace): boolean {
      return Boolean(this.raceDetails?.lineups?.some(lineup => this.matchesCalendarRefToRace(lineup.calendar_id, race)));
    }

    hasCompletedSprintBet(race: CalendarRace): boolean {
      return Boolean(this.raceDetails?.sprints?.some(bet => this.matchesCalendarRefToRace(bet.calendar_id, race)));
    }

    hasCompletedRaceBet(race: CalendarRace): boolean {
      return Boolean(this.raceDetails?.bets?.some(bet => this.matchesCalendarRefToRace(bet.calendar_id, race)));
    }

    getRaceCompletionLabel(race: CalendarRace): string {
      if (race.cancelled) return 'Cancellata';

      const completed = [
        this.hasCompletedLineup(race),
        this.hasCompletedSprintBet(race),
        this.hasCompletedRaceBet(race)
      ].filter(Boolean).length;

      if (completed === 3) return 'Completa';
      if (completed === 0) return 'Da completare';
      return `${completed}/3 ok`;
    }

    getMobileRaceStateLabel(race: CalendarRace, index?: number): string {
      if (race.cancelled) return 'Cancellata';

      const safeIndex = index ?? this.calendar.findIndex(item => item.id === race.id);
      if (safeIndex === this.currentRaceIndex) {
        return this.isRaceInPast(race) ? 'Ultima gara' : 'Prossima gara';
      }
      if (safeIndex !== -1 && safeIndex < this.currentRaceIndex) {
        return 'Conclusa';
      }
      return 'In calendario';
    }

    isRacePanelInitiallyOpen(index: number): boolean {
      return Math.abs(index - this.currentRaceIndex) <= 1;
    }

    private isRaceInPast(race: CalendarRace): boolean {
      const eventDate = DateUtils.parseLocalYyyyMmDd(race.event_date);
      if (!eventDate) return false;
      const today = new Date();
      const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
      return eventDate < endOfToday;
    }

    private extractCalendarId(value: any): number | null {
      if (value == null) {
        return null;
      }

      if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
      }

      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }

      if (typeof value === 'object') {
        const directId = this.extractCalendarId(value.id);
        if (directId != null) {
          return directId;
        }

        const nestedCalendarId = this.extractCalendarId(value.calendar_id);
        if (nestedCalendarId != null) {
          return nestedCalendarId;
        }
      }

      return null;
    }

    private matchesCalendarRefToRace(reference: any, race: CalendarRace): boolean {
      if (!reference || !race) {
        return false;
      }

      const referenceId = this.extractCalendarId(reference);
      if (referenceId != null && referenceId === race.id) {
        return true;
      }

      const referenceRaceOrder = Number(reference?.race_order ?? reference?.calendar_id?.race_order);
      if (Number.isFinite(referenceRaceOrder) && referenceRaceOrder === race.race_order) {
        return true;
      }

      const referenceEventDate = this.extractComparableString(reference?.event_date ?? reference?.calendar_id?.event_date);
      if (referenceEventDate && referenceEventDate === this.extractComparableString(race.event_date)) {
        return true;
      }

      const referenceName = this.extractComparableString(reference?.race_id?.name ?? reference?.calendar_id?.race_id?.name);
      const referenceLocation = this.extractComparableString(reference?.race_id?.location ?? reference?.calendar_id?.race_id?.location);
      const raceName = this.extractComparableString(race.race_id?.name);
      const raceLocation = this.extractComparableString(race.race_id?.location);

      return Boolean(referenceName && raceName && referenceName === raceName && referenceLocation && raceLocation && referenceLocation === raceLocation);
    }

    private extractComparableString(value: any): string {
      return typeof value === 'string' ? value.trim().toLowerCase() : '';
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
}



