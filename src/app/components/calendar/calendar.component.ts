// src/app/calendar/calendar.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService, CalendarRace } from '../../services/dashboard.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="calendar-container">
      <header class="header">
        <div class="header-left">
          <button mat-button color="accent" (click)="goBack()">Back</button>
        </div>
        <div class="header-center">
          <h1>Championship Calendar</h1>
        </div>
        <div class="header-right">
          <!-- This area is reserved; add items if needed -->
        </div>
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
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let race of calendar">
                  <td>{{ race.race_order }}</td>
                  <td>{{ race.race_id.name }}</td>
                  <td>{{ race.event_date | date:'shortDate' }}</td>
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
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      color: #fff;
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
    .header-left, .header-right {
      width: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .header-center {
      flex: 1;
      text-align: center;
    }
    .header-center h1 {
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
