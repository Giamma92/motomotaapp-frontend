// src/app/calendar/calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';
import { MatIcon, MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="calendar-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Championship Calendar</h1>
      </header>
      <main class="main-content">
        <mat-card class="calendar-card">
          <mat-card-content>
            <table class="calendar-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Race Name</th>
                  <th>Date</th>
                  <th>Qualifications time</th>
                  <th>Sprint Race time</th>
                  <th>Race Time</th>
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
                </tr>
              </tbody>
            </table>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    /* Container without extra margin */
    .calendar-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      color: #fff;
      padding: 20px;
    }
    /* Header with fixed full width and constant height */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 60px;
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .header button {
      color: #fff;
    }
    .header h1 {
      flex: 1;
      text-align: center;
      margin: 0;
      font-size: 24px;
    }
    /* Main content area: add top padding to account for fixed header */
    .main-content {
      padding: 70px 20px 20px; /* 60px header + 10px extra */
    }
    /* Calendar card styling */
    .calendar-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border: 2px solid #d32f2f;
      max-width: 800px;
      margin: 0 auto;
    }
    .calendar-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    .calendar-table th,
    .calendar-table td {
      padding: 12px;
      border-bottom: 1px solid #ccc;
      text-align: left;
      font-size: 14px;
    }
    /* Responsive adjustments for mobile screens */
    @media (max-width: 600px) {
      .calendar-card {
        margin: 0 10px;
        width: 100%;
      }
      .header-left, .header-right {
        width: 60px;
      }
      .header-center h1 {
        font-size: 20px;
      }
    }
  `]
})
export class CalendarComponent implements OnInit {
  calendar: CalendarRace[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getCalendar().subscribe({
      next: (data: CalendarRace[]) => {
        this.calendar = data;
      },
      error: (err) => {
        console.error('Error fetching calendar data:', err);
        this.calendar = [];
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);  // Navigates back to the dashboard
  }
}
