// src/app/calendar/calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Championship Calendar</h1>
      </header>
      <main class="main-content">
      <mat-card class="dashboard-card">
        <mat-card-header class="card-header">
          <mat-card-title>
            <mat-icon>calendar_month</mat-icon>
            Race Schedule
          </mat-card-title>
        </mat-card-header>

        <!-- Desktop Table -->
        <div class="desktop-view">
          <table class="dashboard-table">
            <thead>
              <tr>
                <th>Round</th>
                <th>Event</th>
                <th>Date</th>
                <th>Qualifying</th>
                <th>Sprint</th>
                <th>Race</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let race of calendar">
                <td class="round-number">{{ race.race_order }}</td>
                <td class="event-info">
                  <div class="event-name">{{ race.race_id.name }}</div>
                  <div class="event-location">
                    <mat-icon>location_on</mat-icon>
                    {{ race.race_id.location }}
                  </div>
                </td>
                <td>{{ race.event_date | date:'mediumDate' }}</td>
                <td>{{ race.qualifications_time || 'TBD' }}</td>
                <td>{{ race.sprint_time || 'TBD' }}</td>
                <td>{{ race.event_time || 'TBD' }}</td>
                <td>
                  <button mat-icon-button color="primary" (click)="goToRaceDetail(race)">
                    <mat-icon>chevron_right</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>

      <!-- Mobile Cards -->
      <div class="mobile-view">
          <mat-card class="race-card" *ngFor="let race of calendar">
            <mat-card-header>
              <mat-card-title-group>
                <mat-card-title>Round {{ race.race_order }}</mat-card-title>
                <mat-card-subtitle>
                  {{ race.event_date | date:'mediumDate' }}
                </mat-card-subtitle>
              </mat-card-title-group>
            </mat-card-header>

            <mat-card-content>
              <div class="race-content">
                <div class="race-name">{{ race.race_id.name }}</div>
                <div class="race-details">
                  <div class="detail-item">
                    <mat-icon>schedule</mat-icon>
                    Race time: {{ race.event_time || 'TBD' }}
                  </div>
                  <div class="detail-item">
                    <mat-icon>flag</mat-icon>
                    Sprint time: {{ race.sprint_time || 'TBD' }}
                  </div>
                  <div class="detail-item">
                    <mat-icon>timer</mat-icon>
                    Qualification time: {{ race.qualifications_time || 'TBD' }}
                  </div>
                </div>
                <div class="race-location">
                  <mat-icon>location_on</mat-icon>
                  {{ race.race_id.location }}
                </div>
              </div>
            </mat-card-content>

            <mat-card-actions>
              <button mat-stroked-button color="primary" (click)="goToRaceDetail(race)">
                View Details
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
      padding: 70px 0px 0px 0px;
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
      border: 2px solid var(--primary-color);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(var(--primary-color), 0.1);
      width: 90%;
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
    }

    /* Desktop Table Styling */
    .desktop-view {
      display: block;
      padding: 1.5rem;

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

    /* Mobile Card Styling */
    .mobile-view {
      display: none;
      padding: 1rem;
      gap: 1rem;
      width: 90%;

      .race-card {
        margin-bottom: 1rem;
        border-left: 4px solid var(--accent-red);
        border-radius: 12px;
        overflow: hidden;

        .race-content {
          padding: 1rem;

          .race-name {
            font-family: 'MotoGP Bold', sans-serif;
            color: var(--primary-color);
            margin-bottom: 1rem;
          }

          .race-details {
            display: grid;
            gap: 1rem;
            margin-bottom: 1rem;

            .detail-item {
              display: flex;
              align-items: center;
              gap: 0.5rem;
              color: #666;
            }
          }

          .race-location {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--primary-color);
            font-weight: 500;
          }
        }

        mat-card-actions {
          padding: 1rem;
          border-top: 1px solid #eee;
        }
      }
    }

    /* Responsive Breakpoints */
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .desktop-view {
        display: none;
      }

      .mobile-view {
        display: block;
      }
    }

    @media (min-width: 769px) {
      .mobile-view {
        display: none;
      }
    }
  `]
})
export class CalendarComponent implements OnInit {
  calendar: CalendarRace[] = [];

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
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

  goBack(): void {
    this.router.navigate(['/']);  // Navigates back to the dashboard
  }

  goToRaceDetail(race: CalendarRace): void {
    // Assumes that race.race_id has an 'id' property.
    const calendarRaceId = race.id;
    this.router.navigate(['/race-detail', calendarRaceId]);
  }
}
