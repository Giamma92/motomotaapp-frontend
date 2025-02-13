// src/app/all-teams/all-teams.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, FantasyTeam } from '../../services/dashboard.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-all-teams',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="all-teams-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>All Teams</h1>
      </header>
      <main class="teams-content">
        <div class="teams-grid">
          <mat-card class="team-card" *ngFor="let team of teams">
            <mat-card-header>
              <mat-card-title>{{ team.name }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="team-image-container" *ngIf="team.team_image">
                <img [src]="team.team_image" alt="{{ team.name }} Logo">
              </div>
              <p>
                <strong>Official Rider 1:</strong>
                {{ team.official_rider_1.first_name }} {{ team.official_rider_1.last_name }}
              </p>
              <p>
                <strong>Official Rider 2:</strong>
                {{ team.official_rider_2.first_name }} {{ team.official_rider_2.last_name }}
              </p>
              <p>
                <strong>Reserve Rider:</strong>
                {{ team.reserve_rider.first_name }} {{ team.reserve_rider.last_name }}
              </p>
            </mat-card-content>
          </mat-card>
        </div>
        <div *ngIf="teams.length === 0" class="no-teams">
          <p>No teams found.</p>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .all-teams-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      color: #fff;
      padding: 20px;
    }
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
    .teams-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 70px 20px 20px; /* 60px header + 10px extra */
    }
    .teams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      width: 100%;
    }
    .team-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border: 2px solid #d32f2f;
      display: flex;
      flex-direction: column;
    }
    .team-card mat-card-header {
      text-align: center;
    }
    .team-image-container {
      text-align: center;
      margin: 16px 0;
    }
    .team-image-container img {
      width: 100%;
      max-width: 150px;
      height: auto;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
    .no-teams {
      margin-top: 20px;
      text-align: center;
      font-size: 18px;
    }
  `]
})
export class AllTeamsComponent implements OnInit {
  teams: FantasyTeam[] = [];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.dashboardService.getAllFantasyTeams().subscribe({
      next: (data: FantasyTeam[]) => {
        this.teams = data;
      },
      error: (err) => {
        console.error('Error fetching all fantasy teams:', err);
        this.teams = [];
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
