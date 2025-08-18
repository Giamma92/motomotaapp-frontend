// src/app/calendar/calendar.component.ts
import { Component, OnInit, ViewChildren, ElementRef, QueryList, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, TimeFormatPipe, TranslatePipe],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'calendar.title' | t }}</h1>
      </header>
      <main class="main-content">
      <mat-card class="dashboard-card">

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
                    {{ getEventDateRange(race.event_date).start | date:'MMM d' }} -
                    {{ getEventDateRange(race.event_date).end | date:'MMM d, y' }}
                  </span>
                </td>
                <td>{{ getDayBefore(race.event_date) | date:'EEE' }} {{ race.qualifications_time ?? '10:00:00' | timeFormat }}</td>
                <td>{{ getDayBefore(race.event_date) | date:'EEE' }} {{ race.sprint_time ?? '15:00:00' | timeFormat }}</td>
                <td>{{ getEventDateRange(race.event_date).end | date:'EEE' }} {{ race.event_time ?? '14:00:00' | timeFormat }}</td>
                <td>
                  <button mat-icon-button color="primary" (click)="goToRaceDetail(race)">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </td>
                <td *ngIf="isAdmin()" class="admin-actions">
                    <button mat-icon-button color="primary" (click)="fetchMotoGPResults(race.id)" aria-label="Fetch MotoGP Results">
                      <mat-icon>get_app</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" (click)="updateStandings(race.id)" aria-label="Update standings">
                      <mat-icon>sync</mat-icon>
                    </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>

      <!-- Modified Mobile Cards - Remove CDK directives -->
      <div class="calendar-mobile-list">
        <mat-card #raceCards class="calendar-race-card" *ngFor="let race of calendar">
          <mat-card-header>
            <mat-card-title-group class="card-header">
              <div class="header-content">
                <div class="round-badge">{{ 'calendar.raceNum' | t:{num: race.race_order} }}</div>
                <mat-card-title>{{ race.race_id.name }}</mat-card-title>
                <mat-card-subtitle>
                  <div class="event-details">
                    <div class="detail-item">
                      <mat-icon>event</mat-icon>
                      <span class="detail-text">
                        {{ getEventDateRange(race.event_date).start | date:'MMM d' }} -
                        {{ getEventDateRange(race.event_date).end | date:'MMM d, y' }}
                      </span>
                    </div>
                    <div class="detail-item">
                      <mat-icon>location_on</mat-icon>
                      <span class="location-text">{{ race.race_id.location }}</span>
                    </div>
                  </div>
                </mat-card-subtitle>
              </div>
            </mat-card-title-group>
          </mat-card-header>

          <mat-card-content>
            <div class="race-content">
              <div class="race-details-vertical">
                <div class="time-detail-container">
                  <div class="time-icon-container">
                    <mat-icon class="time-icon">timer</mat-icon>
                  </div>
                  <div class="time-info">
                    <span class="time-label">{{ 'common.qualifying' | t }}</span>
                    <span class="time-value">
                      {{ getDayBefore(race.event_date) | date:'EEE' }} {{ race.qualifications_time ?? '10:00:00' | timeFormat }}
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
                      {{ getDayBefore(race.event_date) | date:'EEE' }} {{ race.sprint_time ?? '15:00:00' | timeFormat }}
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
                      {{ getEventDateRange(race.event_date).end | date:'EEE' }} {{ race.event_time ?? '14:00:00' | timeFormat }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </mat-card-content>

          <mat-card-actions class="action-buttons">
            <button mat-mini-fab color="accent" *ngIf="isAdmin()" (click)="updateStandings(race.id)" aria-label="Update Standings">
                <mat-icon>sync</mat-icon>
            </button>
            <button mat-mini-fab color="primary" *ngIf="isAdmin()" (click)="fetchMotoGPResults(race.id)" aria-label="Fetch MotoGP Results">
              <mat-icon>get_app</mat-icon>
            </button>
            <button mat-mini-fab color="primary" (click)="goToRaceDetail(race)">
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
      </main>
    </div>
  `,
  styles: [`
    .main-content {
      color: black;
      padding: 0;
      .mat-mdc-card-header {
        padding: 0px;
      }
    }

    @media(max-width: 768px) {
      .main-content {
        padding: 0px 0px 0px 0px;
      }
    }

    /* Unified Dashboard Styling */
    .dashboard-container {
      padding: 2rem;
      background: #f5f5f5;
      min-height: 100vh;
    }

    .dashboard-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;

      h1 {
        color: var(--primary-color);
        font-family: 'MotoGP Bold', sans-serif;
        margin: 0;
        font-size: 2rem;
      }
    }

    .dashboard-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(var(--primary-color), 0.1);
      width: 90%;
      margin-top: 3rem;
    }

    .card-header {
      color: var(--primary-color);
      padding: 1.5rem;

      mat-card-title {
        font-family: 'MotoGP Bold' !important;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .event-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 8px;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;

          mat-icon {
            font-size: 1.1rem;
            width: 1.1rem;
            height: 1.1rem;
          }
        }

        .location-text {
          font-weight: 500;
        }
      }
    }

    /* Desktop Table Styling */
    .desktop-view {
      display: block;
      padding: 1.5rem;
      @media (max-width: 768px) {
        display: none;  // Hide table on mobile
      }

      .dashboard-table {
        width: 100%;
        border-collapse: collapse;

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: rgba(var(--primary-color), 0.1);
          color: var(--primary-color);
          font-family: 'MotoGP Bold', sans-serif;
        }

        tr:hover {
          background: #f8f9fa;
        }

        .round-number {
          font-family: 'MotoGP Bold', sans-serif;
          color: var(--primary-color);
        }

        .event-info {

          .event-name {
            font-weight: 500;
          }

          .event-location {
            color: #666;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
          }
        }
      }
    }

    /* Updated Mobile Card Styling */
    .calendar-mobile-list {
      display: none;
      padding: 0;
      width: 100%;
      background: transparent;
      @media (max-width: 768px) {
        display: block;
      }
    }

    .calendar-race-card {
      width: 100%;
      margin: 1.5rem 0;
      box-sizing: border-box;
      border-radius: 18px;
      box-shadow: 0 4px 16px rgba(74, 20, 140, 0.10), 0 1.5px 4px rgba(74, 20, 140, 0.06);
      overflow: visible;
      background: transparent;
      transition: box-shadow 0.2s, transform 0.2s;
      position: relative;
      padding-bottom: 0.5rem;
      border: 1px solid #2a003f;
      color: #fff;
    }

    .calendar-race-card .card-header {
      background: linear-gradient(90deg, var(--primary-color), #006db3 80%);
      color: #fff;
      padding: 1.2rem 1.5rem 1rem 1.5rem;
      border-top-left-radius: 18px;
      border-top-right-radius: 18px;
      box-shadow: none;
      text-align: center;
    }

    .calendar-race-card .header-content {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .calendar-race-card mat-card-content,
    .calendar-race-card .race-content,
    .calendar-race-card .action-buttons {
      background: #fff;
      color: #222;
    }

    .calendar-race-card .round-badge {
      background: rgba(255,255,255,0.18);
      padding: 4px 16px;
      border-radius: 16px;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      display: inline-block;
      letter-spacing: 0.5px;
      color: #fff;
    }

    .calendar-race-card mat-card-title {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 0.2rem;
      letter-spacing: 0.5px;
      color: #fff;
    }

    .calendar-race-card mat-card-subtitle {
      color: rgba(255,255,255,0.92);
      font-size: 0.98rem;
      margin-top: 0.2rem;
    }

    .calendar-race-card .event-details {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .calendar-race-card .detail-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.98rem;
      color: #fff;
    }

    .calendar-race-card .location-text {
      font-weight: 500;
      color: #fff;
    }

    .calendar-race-card .race-details-grid {
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
      flex-wrap: nowrap;
    }

    .calendar-race-card .race-details-vertical {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .calendar-race-card .time-detail-container {
      background: #f7f9fa;
      border-radius: 8px;
      padding: 0.3rem 0.7rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      min-width: 0;
      flex: 1 1 65px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.03);
      color: #222;
    }

    .calendar-race-card .time-icon-container {
      background: rgba(74, 20, 140, 0.12);
      border-radius: 50%;
      padding: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .calendar-race-card .time-icon {
      color: var(--primary-color);
      width: 22px;
      height: 22px;
      font-size: 22px;
    }

    .calendar-race-card .time-info {
      display: flex;
      flex-direction: column;
      min-width: 0;
      color: #222;
    }

    .calendar-race-card .time-label {
      color: #666;
      font-size: 0.92rem;
      font-weight: 500;
    }

    .calendar-race-card .time-value {
      color: var(--primary-color);
      font-size: 1.08rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      white-space: nowrap;
    }

    .calendar-race-card mat-card-content {
      padding: 0.5rem 1rem;
    }

    .current-race {
      background: rgba(var(--primary-red), 0.1) !important;
      position: relative;

      &::after {
        content: '•';
        color: var(--primary-red);
        position: absolute;
        right: 1rem;
        font-size: 2rem;
      }
    }

    .calendar-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .calendar-title {
      text-align: center;
      color: var(--primary-color);
      margin-bottom: 2rem;
      font-size: 2.5rem;
    }

    .race-cards {
      display: grid;
      gap: 1.5rem;
    }

    .race-card {
      position: relative;
      overflow: hidden;
      border-radius: 20px;
      box-shadow:
        0 0 0 1.5px rgba(0, 0, 0, 0.08),
        0 8px 24px rgba(0, 0, 0, 0.1);
      transition:
        transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.3s ease;
      position: relative;
      background: white;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 20px;
        box-shadow:
          0 4px 12px rgba(0, 0, 0, 0.08),
          0 6px 20px rgba(0, 0, 0, 0.04);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }

      &:hover {
        transform: translateY(-4px) scale(1.02);
        box-shadow:
          0 0 0 2px rgba(var(--primary-color), 0.15),
          0 12px 32px rgba(0, 0, 0, 0.15);

        &::after {
          opacity: 1;
        }
      }

      &:active {
        transform: translateY(-2px) scale(1.01);
      }
    }

    .race-header {
      background: linear-gradient(135deg, var(--primary-color), #0d47a1);
      padding: 1.5rem;
      color: white;

      .round-badge {
        background: rgba(255, 255, 255, 0.15);
        padding: 0.5rem 1.2rem;
        border-radius: 20px;
        font-weight: 500;
        display: inline-block;
        margin-bottom: 1rem;
      }

      .event-title {
        margin: 0 0 1rem;
        font-size: 1.8rem;
      }

      .event-details {
        display: grid;
        gap: 1rem;

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 1.1rem;

          mat-icon {
            color: #ffcc00;
            font-size: 1.6rem;
            width: 1.6rem;
            height: 1.6rem;
          }
        }
      }
    }

    .time-grid-container {
      padding: 1.5rem;
      background: #f8f9fa;

      .time-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));

        .time-item {
          background: white;
          padding: 1.2rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .time-icon-container {
          background: #ffe5e5;
          border-radius: 50%;
          padding: 0.8rem;

          .time-icon {
            color: #d32f2f;
            font-size: 1.8rem;
            width: 1.8rem;
            height: 1.8rem;
          }
        }

        .time-label {
          font-weight: 500;
          color: #666;
          font-size: 0.9rem;
        }

        .time-value {
          font-weight: 600;
          color: var(--primary-color);
          font-size: 1.2rem;
        }
      }
    }

    .race-status {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.9rem;

      &.completed {
        background: #4CAF50;
      }
    }

    .admin-actions {
      display: flex;
      gap: 8px;
      justify-content: center;

      button {
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
    }

    @media (min-width: 768px) {
      .race-cards {
        grid-template-columns: repeat(2, 1fr);
      }

      .event-title {
        font-size: 2rem !important;
      }

      .time-grid {
        grid-template-columns: repeat(3, 1fr) !important;
      }
    }

    @media (min-width: 1200px) {
      .race-cards {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .calendar-race-card .action-buttons {
      border-bottom-left-radius: 18px;
      border-bottom-right-radius: 18px;
    }
  `]
})
export class CalendarComponent implements OnInit, AfterViewInit {

  @ViewChildren('raceCards') raceCards!: QueryList<ElementRef>;
  currentRaceIndex: number = 0;
  calendar: CalendarRace[] = [];
  championshipId: number = 0;

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
      this.championshipId = champId;
      this.dashboardService.getCalendar(champId).subscribe({
        next: (data: CalendarRace[]) => {
          this.calendar = data;
        },
        error: (err) => {
          console.error('Error fetching calendar data:', err);
          this.calendar = [];
        }
      });
    });
  }

  ngAfterViewInit() {
    this.findCurrentRace();
  }

  private findCurrentRace() {
    const now = new Date();
    this.currentRaceIndex = this.calendar.findIndex(race =>
      new Date(race.event_date) >= now
    );
    if (this.currentRaceIndex === -1) {
      this.currentRaceIndex = this.calendar.length - 1; // Show last race if all past
    }
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

  updateStandings(raceId: number) {
    alert('Starting to update Standings!');
    this.dashboardService.updateStandings(this.championshipId, raceId).subscribe({
      next: () => {
        alert('Standings updated successfully!');
      },
      error: (err: any) => {
        console.error('Error updating standings:', err);
        alert('Error updating standings. Please try again.');
      }
    });
  }

  fetchMotoGPResults(calendarId: number) {
    alert('Starting to fetch MotoGP Results! It takes few minutes, please wait');
    this.dashboardService.fetchMotoGPResults(this.championshipId, calendarId).subscribe({
      next: () => {
        alert('Fetching MotoGP results completed! The results could be not loaded if the race is not completed yet.');
      },
      error: (err: any) => {
        console.error('Error fetching MotoGP results:', err);
        alert('Error fetching MotoGP results. Please try again.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);  // Navigates back to the dashboard
  }

  goToRaceDetail(race: CalendarRace): void {
    // Assumes that race.race_id has an 'id' property.
    const calendarRaceId = race.id;
    this.router.navigate(['/race-detail', calendarRaceId]);
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
}
