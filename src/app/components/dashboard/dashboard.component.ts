// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, StandingsRow, CalendarRace } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <header class="header">
        <div class="header-center">
          <h1>MotoMota - Dashboard</h1>
        </div>
        <div class="header-right">
          <button mat-icon-button [matMenuTriggerFor]="menu">
            <mat-icon>more_vert</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="goToProfile()">Profile</button>
            <button mat-menu-item (click)="logout()">Logout</button>
          </mat-menu>
        </div>
      </header>
      <main class="main-content">
        <!-- Standings Card -->
        <mat-card class="standings-card" *ngIf="classificationData && classificationData.length">
          <mat-card-header>
            <mat-card-title>Standings</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <table class="standings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of classificationData" [class.highlight]="row.user_id === loggedUserId">
                  <td>{{ row.position }}</td>
                  <td>{{ row.user_id }}</td>
                  <td>{{ row.score }}</td>
                </tr>
              </tbody>
            </table>
          </mat-card-content>
        </mat-card>
        <!-- Next Race Card (only shown if a next race exists) -->
        <mat-card class="next-race-card" *ngIf="nextRace">
          <mat-card-header>
            <mat-card-title>Next Race</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <h2>{{ nextRace.race_id.name }}</h2>
            <p>Date: <b>{{ nextRace.event_date | date }}</b> Time: <b>{{ nextRace.event_time || 'TBD' }}</b></p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="goToCalendar(nextRace.id)">
              View all races
            </button>
            <button mat-raised-button color="primary" (click)="goToRace(nextRace.id)">
              Place Bet
            </button>
          </mat-card-actions>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    /* Overall container with vibrant gradient background */
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      color: #fff;
      padding-top: 80px; /* space for fixed header */
    }
    /* Fixed header styling: full width, solid background, constant height */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #4a148c, #d81b60); /* fully opaque */
      padding: none;
      z-index: 1000;
    }
    .header-center {
      flex: 1;
      text-align: center;
    }
    .header-center h1 {
      margin: 0;
      font-size: 20px;
    }
    .header-right {
      flex: 0 0 auto;
    }
    .header-right button {
      color: #fff;
    }
    /* Main content area as a responsive grid */
    .main-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    /* Standings card styling */
    .standings-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border: 2px solid #d32f2f;
      display: flex;
      flex-direction: column;
    }
    .standings-card mat-card-header {
      text-align: center;
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
    /* Next race card styling */
    .next-race-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border: 2px solid #d32f2f;
      text-align: center;
      display: flex;
      flex-direction: column;
    }
    .next-race-card mat-card-header {
      text-align: center;
    }
    .next-race-card mat-card-content {
      padding: 16px;
    }
    /* Responsive adjustments for mobile screens */
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
    }
  `]
})
export class DashboardComponent implements OnInit {
  classificationData?: StandingsRow[];
  nextRace?: CalendarRace;
  loggedUserId: string | null;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.dashboardService.getClassification().subscribe({
      next: (data: StandingsRow[]) => {
        this.classificationData = data;
      },
      error: (error: any) =>
        console.error('Error fetching classification data:', error)
    });
    this.dashboardService.getNextRace().subscribe({
      next: (race: CalendarRace) => {
        this.nextRace = race;
      },
      error: (error: any) => {
        console.error('Error fetching next race:', error);
        this.nextRace = undefined;
      }
    });
  }

  goToRace(raceId: number): void {
    this.router.navigate(['/race', raceId]);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToCalendar(raceId: number): void {
    this.router.navigate(['/calendar', raceId]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
