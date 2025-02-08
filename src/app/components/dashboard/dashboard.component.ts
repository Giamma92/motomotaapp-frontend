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
    <div class="dashboard">
      <!-- Navigation button to go to the profile page -->
      <div class="nav-button">
        <button mat-raised-button color="accent" (click)="goToProfile()">Profile</button>
      </div>

      <!-- Standings Card -->
      <mat-card class="standings-card" *ngIf="classificationData && classificationData.length">
        <mat-card-title>Standings</mat-card-title>
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
      <div class="race-cards" *ngIf="nextRace">
        <mat-card class="race-card">
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
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
    }
    .nav-button {
      display: flex;
      justify-content: flex-end;
    }
    .standings-card {
      max-width: 600px;
      margin: 0 auto;
    }
    .standings-table {
      width: 100%;
      border-collapse: collapse;
    }
    .standings-table th, .standings-table td {
      padding: 8px 12px;
      border-bottom: 1px solid #ccc;
      text-align: left;
    }
    .standings-table tr.highlight {
      background-color: #e0f7fa;
      font-weight: bold;
    }
    .race-cards {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
    }
    .race-card {
      flex: 1;
      min-width: 280px;
    }
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
    // Assume AuthService has a method getUserId() that returns the logged-in user's id.
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    // Fetch classification (standings) data.
    this.dashboardService.getClassification().subscribe({
      next: (data: StandingsRow[]) => {
        this.classificationData = data;
      },
      error: (err) => console.error('Error fetching classification', err)
    });

    // Fetch the next race.
    this.dashboardService.getNextRace().subscribe({
      next: (data: Race) => {
        this.nextRace = data;
      },
      error: (err) => {
        console.error('Error fetching next race', err);
        // In case of an error or no race, clear nextRace.
        this.nextRace = undefined;
      }
    });
  }

  goToRace(raceId: number): void {
    this.router.navigate(['/race', raceId]);
  }

  // Navigate to the profile page.
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
