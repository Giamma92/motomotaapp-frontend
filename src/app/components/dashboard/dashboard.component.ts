// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, StandingsRow, CalendarRace, FantasyTeam } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

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
        <!-- Wrap cards in a container with the animation trigger.
            Bind the trigger to "firstLoad ? cardCount : 0" so that if firstLoad is false, no animation runs. -->
        <div class="cards-wrapper">
          <!-- Fantasy Team Card -->
          <mat-card class="fantasy-team-card" *ngIf="fantasyTeam">
            <mat-card-header>
              <mat-card-title class="team-title">{{ fantasyTeam.name }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="team-image-container" *ngIf="fantasyTeam.team_image">
                <img [src]="fantasyTeam.team_image" alt="{{ fantasyTeam.name }} Logo">
              </div>
              <p><strong>Official Rider 1:</strong> {{ fantasyTeam.official_rider_1.first_name }} {{ fantasyTeam.official_rider_1.last_name }}</p>
              <p><strong>Official Rider 2:</strong> {{ fantasyTeam.official_rider_2.first_name }} {{ fantasyTeam.official_rider_2.last_name }}</p>
              <p><strong>Reserve Rider:</strong> {{ fantasyTeam.reserve_rider.first_name }} {{ fantasyTeam.reserve_rider.last_name }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="goToAllTeams()">See All Teams</button>
            </mat-card-actions>
          </mat-card>
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
          <!-- Next Race Card -->
          <mat-card class="next-race-card" *ngIf="nextRace">
            <mat-card-header>
              <mat-card-title>Next Race</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <h2>{{ nextRace.race_id.name }}</h2>
              <p>Date: <b>{{ nextRace.event_date | date }}</b> Time: <b>{{ nextRace.event_time || 'TBD' }}</b></p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="goToCalendar()">View all races</button>
              <button mat-raised-button color="primary" (click)="goToRace(nextRace.id)">Place Bet</button>
            </mat-card-actions>
          </mat-card>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      color: #fff;
      padding-top: 80px; /* space for fixed header */
    }
    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #4a148c, #d81b60);
      padding: 0 16px;
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
    .main-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      padding: 20px;
    }
    .cards-wrapper {
      display: contents;
    }
    .fantasy-team-card,
    .standings-card,
    .next-race-card {
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border: 2px solid #d32f2f;
      display: flex;
      flex-direction: column;
    }
    .fantasy-team-card mat-card-header,
    .standings-card mat-card-header,
    .next-race-card mat-card-header {
      text-align: center;
    }
    .team-title {
      font-size: 24px;
      font-weight: bold;
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
    .next-race-card mat-card-content {
      padding: 16px;
    }
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
  fantasyTeam?: FantasyTeam;
  loggedUserId: string | null;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private authService: AuthService,
    //private dashboardState: DashboardStateService
  ) {
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadFantasyTeam();
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

  private loadFantasyTeam(): void {
    this.dashboardService.getFantasyTeam().subscribe({
      next: (team: FantasyTeam) => {
        this.fantasyTeam = team;
      },
      error: (error: any) =>
        console.error('Error fetching fantasy team:', error)
    });
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToCalendar(): void {
    this.router.navigate(['/calendar']);
  }

  goToRace(raceId: number): void {
    this.router.navigate(['/race', raceId]);
  }

  goToAllTeams(): void {
    this.router.navigate(['/teams']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
