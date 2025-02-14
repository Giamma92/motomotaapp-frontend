// src/app/all-teams/all-teams.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService, FantasyTeam } from '../../services/dashboard.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChampionshipService } from '../../services/championship.service';

@Component({
  selector: 'app-all-teams',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>All Teams</h1>
      </header>
      <main class="main-content">
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
    private championshipService: ChampionshipService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
      this.dashboardService.getAllFantasyTeams(champId).subscribe({
        next: (data: FantasyTeam[]) => {
          this.teams = data;
        },
        error: (err) => {
          console.error('Error fetching all fantasy teams:', err);
          this.teams = [];
        }
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
