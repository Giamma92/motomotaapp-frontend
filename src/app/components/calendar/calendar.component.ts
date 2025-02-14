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
        <mat-card class="calendar-card">
          <mat-card-content>

            <!-- TABLE for Desktop (Hidden on Mobile) -->
            <div class="table-wrapper desktop-only">
              <table class="calendar-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Race Name</th>
                    <th>Date</th>
                    <th>Qualifications</th>
                    <th>Sprint Race</th>
                    <th>Race Time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let race of calendar">
                    <td>{{ race.race_order }}</td>
                    <td>{{ race.race_id.name }}</td>
                    <td>{{ race.event_date | date:'shortDate' }}</td>
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

            <!-- LIST for Mobile (Hidden on Desktop) -->
            <div class="mobile-only">
              <mat-card class="race-card" *ngFor="let race of calendar">
                <mat-card-header>
                  <mat-card-title>{{ race.race_id.name }}</mat-card-title>
                  <mat-card-subtitle>#{{ race.race_order }} - {{ race.event_date | date:'shortDate' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p><strong>Qualifications:</strong> {{ race.qualifications_time || 'TBD' }}</p>
                  <p><strong>Sprint Race:</strong> {{ race.sprint_time || 'TBD' }}</p>
                  <p><strong>Race Time:</strong> {{ race.event_time || 'TBD' }}</p>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="goToRaceDetail(race)">
                    View Details
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    /* General Styles */
    .table-wrapper {
      overflow-x: auto;
      width: 100%;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling for mobile */
    }
    .calendar-table {
      width: 100%;
      min-width: 600px; /* Prevents table shrinking */
      border-collapse: collapse;
    }
    .calendar-table th,
    .calendar-table td {
      padding: 12px;
      border-bottom: 1px solid #ccc;
      text-align: left;
      font-size: 14px;
    }
    /* Race Card for Mobile */
    .race-card {
      margin-bottom: 12px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border-left: 5px solid #d32f2f;
      padding: 10px;
    }
    .race-card p {
      margin: 5px 0;
      font-size: 14px;
    }
    /* Toggle Views: Hide Table on Mobile, Show List */
    @media (max-width: 600px) {
      .desktop-only {
        display: none;
      }
      mat-card.mat-mdc-card.mdc-card.calendar-card {
          background: transparent !important;
      }
    }
    /* Toggle Views: Show Table on Desktop, Hide List */
    @media (min-width: 601px) {
      .mobile-only {
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
