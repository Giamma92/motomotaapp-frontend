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

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, TimeFormatPipe, TranslatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
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
              <tr *ngFor="let race of calendar" [class.current-race]="race === calendar[currentRaceIndex]">
                <td class="round-number">{{ race.race_order }}</td>
                <td class="event-info">
                  <div class="event-name">{{ race.race_id.name }}</div>
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
                  <button mat-icon-button color="primary" (click)="goToRaceDetail(race)">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                  <button mat-icon-button color="accent" (click)="goToMotoGPResults(race)" aria-label="View MotoGP Results">
                    <mat-icon>emoji_events</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Mobile: single-race carousel -->
      <div class="calendar-mobile-list" *ngIf="calendar.length > 0">
        <div class="mobile-race-nav">
          <button
            mat-icon-button
            class="nav-arrow"
            (click)="goToPreviousRace()"
            [disabled]="mobileRaceIndex === 0"
            aria-label="Previous race">
            <mat-icon>chevron_left</mat-icon>
          </button>
          <div class="mobile-race-meta">
            <span class="mobile-race-index">{{ mobileRaceIndex + 1 }} / {{ calendar.length }}</span>
            <button
              mat-stroked-button
              class="current-race-btn"
              (click)="goToCurrentRace()"
              [disabled]="mobileRaceIndex === currentRaceIndex">
              Gara attuale
            </button>
          </div>
          <button
            mat-icon-button
            class="nav-arrow"
            (click)="goToNextRace()"
            [disabled]="mobileRaceIndex >= calendar.length - 1"
            aria-label="Next race">
            <mat-icon>chevron_right</mat-icon>
          </button>
        </div>

        <article class="calendar-race-panel" *ngIf="activeMobileRace as race">
          <div class="card-header">
            <div class="header-content">
              <div class="round-badge">{{ 'calendar.raceNum' | t:{num: race.race_order} }}</div>
              <h2 class="race-title">{{ race.race_id.name }}</h2>
              <div class="race-subtitle">
                <div class="event-details">
                  <div class="detail-item">
                    <mat-icon>event</mat-icon>
                    <span class="detail-text">
                    {{ formatEventRange(race.event_date) }}
                    </span>
                  </div>
                  <div class="detail-item">
                    <mat-icon>location_on</mat-icon>
                    <span class="location-text">{{ race.race_id.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="race-main">
            <div class="race-content">
              <div class="race-details-vertical">
                <div class="time-detail-container">
                  <div class="time-icon-container">
                    <mat-icon class="time-icon">timer</mat-icon>
                  </div>
                  <div class="time-info">
                    <span class="time-label">{{ 'common.qualifying' | t }}</span>
                    <span class="time-value">
                      {{ getQualifyingDay(race.event_date) | t }} {{ race.qualifications_time ?? '10:00:00' | timeFormat }}
                    </span>
                  </div>
                </div>
                <div class="time-detail-container">
                  <div class="time-icon-container">
                    <mat-icon class="time-icon">flag</mat-icon>
                  </div>
                  <div class="time-info">
                    <span class="time-label">{{ 'common.sprint' | t }}</span>
                    <span class="time-value">
                    {{ getSprintDay(race.event_date) | t }} {{ race.sprint_time ?? '15:00:00' | timeFormat }}
                    </span>
                  </div>
                </div>
                <div class="time-detail-container">
                  <div class="time-icon-container">
                    <mat-icon class="time-icon">sports_motorsports</mat-icon>
                  </div>
                  <div class="time-info">
                    <span class="time-label">{{ 'common.race' | t }}</span>
                    <span class="time-value">
                      {{ getRaceDay(race.event_date) | t }} {{ race.event_time ?? '14:00:00' | timeFormat }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="action-buttons">
            <button
              mat-flat-button
              class="race-action race-action-results"
              (click)="goToMotoGPResults(race)"
              aria-label="View MotoGP Results">
              <mat-icon>emoji_events</mat-icon>
              <span>Risultati</span>
            </button>
            <button
              mat-flat-button
              class="race-action race-action-details"
              (click)="goToRaceDetail(race)">
              <mat-icon>arrow_forward</mat-icon>
              <span>Dettagli</span>
            </button>
          </div>
        </article>
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

    .header button {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: var(--mm-white);
      color: var(--mm-red);
      flex: 0 0 auto;
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
      padding: calc(var(--app-header-height) + 12px) clamp(10px, 2.5vw, 22px) 18px;
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

    .dashboard-table td button[mat-icon-button] {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      margin-left: 4px;
    }

    .dashboard-table td button[mat-icon-button][color='primary'] {
      background: var(--mm-black);
      color: var(--mm-white);
    }

    .dashboard-table td button[mat-icon-button][color='accent'] {
      background: var(--mm-red);
      color: var(--mm-white);
    }

    .calendar-mobile-list {
      display: none;
      width: 100%;
      gap: 10px;
      flex-direction: column;
    }

    .mobile-race-nav {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 2px 2px 6px;
    }

    .mobile-race-meta {
      min-width: 0;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .mobile-race-index {
      color: var(--mm-black);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.82rem;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }

    .nav-arrow {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--mm-black);
      color: var(--mm-white);
      border: 1px solid rgba(255, 255, 255, 0.14);
    }

    .nav-arrow[disabled] {
      opacity: 0.38;
      background: rgba(17, 18, 20, 0.28);
      color: rgba(255, 255, 255, 0.9);
    }

    .current-race-btn {
      min-height: 36px;
      border-radius: 10px;
      border-color: rgba(200, 16, 46, 0.55) !important;
      color: var(--mm-red) !important;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.74rem;
      letter-spacing: 0.2px;
      padding: 0 12px;
      line-height: 1;
      white-space: nowrap;
      background: rgba(255, 255, 255, 0.9) !important;
    }

    .current-race-btn[disabled] {
      opacity: 0.55;
    }

    .calendar-race-panel {
      width: 100%;
      margin: 0;
      border-radius: 0;
      border: 0;
      box-shadow: none;
      overflow: hidden;
      background: var(--mm-white);
    }

    .calendar-race-panel .card-header {
      background: var(--mm-black);
      color: var(--mm-white);
      padding: 0.95rem 1rem 0.85rem;
      width: 100%;
      border-radius: 14px;
    }

    .calendar-race-panel .header-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
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

    .calendar-race-panel .race-title {
      margin: 0;
      color: var(--mm-white);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.06rem;
      line-height: 1.22;
      padding: 0;
    }

    .calendar-race-panel .race-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.92);
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
      padding: 0.8rem 0.85rem 0.7rem;
      background: var(--mm-white);
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
      padding: 8px 9px;
      border-radius: 10px;
      border: 1px solid rgba(17, 18, 20, 0.1);
      border-left: 3px solid var(--mm-red);
      background: #fff;
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
      color: var(--mm-red);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.96rem;
      line-height: 1.15;
      letter-spacing: 0.2px;
      word-break: break-word;
    }

    .calendar-race-panel .action-buttons {
      padding: 0.62rem 0.85rem 0.82rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      border-top: 1px solid rgba(17, 18, 20, 0.08);
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
      background: var(--mm-red);
      color: var(--mm-white);
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
        padding: calc(var(--app-header-height) + 10px) 0 10px;
      }

      .calendar-desktop-shell {
        display: none;
      }

      .calendar-mobile-list {
        display: flex;
        gap: 6px;
      }

      .mobile-race-nav,
      .calendar-race-panel .card-header,
      .calendar-race-panel .race-main,
      .calendar-race-panel .action-buttons {
        padding-left: 10px;
        padding-right: 10px;
      }

      .header {
        padding: 0 8px;
      }

      .header h1 {
        font-size: 0.98rem;
        padding-right: 40px;
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
  mobileRaceIndex: number = 0;
  calendar: CalendarRace[] = [];
  championshipId: number = 0;

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
          this.mobileRaceIndex = this.currentRaceIndex;
        },
        error: (err) => {
          console.error('Error fetching calendar data:', err);
          this.calendar = [];
          this.currentRaceIndex = 0;
          this.mobileRaceIndex = 0;
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
      new Date(race.event_date) >= now
    );

    this.currentRaceIndex = nextRaceIndex === -1 ? this.calendar.length - 1 : nextRaceIndex;
  }

  get activeMobileRace(): CalendarRace | null {
    return this.calendar[this.mobileRaceIndex] ?? null;
  }

  goToPreviousRace(): void {
    if (this.mobileRaceIndex > 0) {
      this.mobileRaceIndex -= 1;
    }
  }

  goToNextRace(): void {
    if (this.mobileRaceIndex < this.calendar.length - 1) {
      this.mobileRaceIndex += 1;
    }
  }

  goToCurrentRace(): void {
    this.mobileRaceIndex = this.currentRaceIndex;
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
    const eventDate = new Date(eventDateString);
    const dayBefore = new Date(eventDate);
    dayBefore.setDate(eventDate.getDate() - 1);
    return dayBefore;
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
    const fmt = new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' });
    // @ts-ignore: formatRange is supported in modern browsers
    return typeof fmt.formatRange === 'function'
      ? fmt.formatRange(start, end)
      : `${fmt.format(start)} – ${fmt.format(end)}`;
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
}



