// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService, StandingsRow, Race } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule],
  template: `
    <div class="dashboard-container">
      <header class="header">
        <div class="header-logo">
          <img src="assets/images/motomotaGPLogo512x512.png" alt="MotoMota Logo">
        </div>
        <nav class="header-nav">
          <button mat-button (click)="goToProfile()">Profile</button>
          <button mat-button (click)="logout()">Logout</button>
        </nav>
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
            <p>Date: {{ nextRace.date | date }}</p>
            <p>Your Bet: {{ nextRace.bet ? nextRace.bet : 'No bet placed' }}</p>
          </mat-card-content>
          <mat-card-actions>
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
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      color: #fff;
    }
    /* Reduced header styling */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;  /* Reduced padding */
      background: rgba(0, 0, 0, 0.3);
    }
    .header-logo img {
      width: 60px;  /* Smaller logo */
      height: auto;
    }
    .header-nav button {
      color: #fff;
      margin-left: 8px;
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
    .standings-card mat-card-title {
      text-align: center;
    }
    .standings-table {
      width: 100%;
      border-collapse: collapse;
    }
    .standings-table th, .standings-table td {
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
    .next-race-card mat-card-title {
      text-align: center;
    }
    /* For smaller screens, grid automatically stacks items full width */
  `]
})
export class DashboardComponent implements OnInit {
  classificationData?: StandingsRow[];
  nextRace?: Race;
  loggedUserId: string | null;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService
  ) {
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.dashboardService.getClassification().subscribe({
      next: (data: StandingsRow[]) => {
        this.classificationData = data;
      },
      error: (err) => console.error('Error fetching classification', err)
    });

    this.dashboardService.getNextRace().subscribe({
      next: (data: Race) => {
        this.nextRace = data;
      },
      error: (err) => {
        console.error('Error fetching next race', err);
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
