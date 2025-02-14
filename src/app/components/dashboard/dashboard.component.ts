// src/app/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, StandingsRow, CalendarRace, FantasyTeam } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
// import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ChampionshipService } from '../../services/championship.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule],
  template: `
    <div class="dashboard-container">
      <header class="header">
        <h1>MotoMota - Dashboard</h1>


        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>more_vert</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="goTo('profile')">
            <i class="fa-solid fa-user"></i> Profile
          </button>
          <button mat-menu-item (click)="goTo('settings')">
            <i class="fa-solid fa-gear"></i> Settings
          </button>
          <button mat-menu-item (click)="logout()">
            <i class="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </mat-menu>

      </header>
      <main class="grid-content">
        <div class="cards-wrapper">
          <!-- Next Race Card moved to top -->
          <mat-card class="next-race-card" *ngIf="nextCalendarRace">
            <mat-card-header>
              <mat-card-title>{{isCurrentRace ? 'Current Race' : 'Next Race'}}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <h2>{{ nextCalendarRace.race_id.name }}</h2>
              <p>Date: <b>{{ nextCalendarRace.event_date | date }}</b> Time: <b>{{ nextCalendarRace.event_time || 'TBD' }}</b></p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="goTo('calendar')">View all races</button>
              <!-- Conditionally show the three new buttons -->
              <button mat-raised-button color="primary" *ngIf="showLineupsButton" (click)="goTo('lineups', nextCalendarRace.id)">
                Place Lineups
              </button>
              <button mat-raised-button color="primary" *ngIf="showSprintBetButton" (click)="goTo('sprint-bet', nextCalendarRace.id)">
                Place Sprint Bet
              </button>
              <button mat-raised-button color="primary" *ngIf="showPlaceBetButton" (click)="goTo('race-bet', nextCalendarRace.id)">
                Place Race Bet
              </button>
            </mat-card-actions>
          </mat-card>
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

          <!-- Fantasy Team Card moved to bottom -->
          <mat-card class="fantasy-team-card" *ngIf="fantasyTeam">
            <mat-card-header>
              <mat-card-title class="team-title">
                <mat-icon>groups</mat-icon>
                {{ fantasyTeam.name }}
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="team-image-container" *ngIf="fantasyTeam.team_image">
                <img [src]="fantasyTeam.team_image" alt="{{ fantasyTeam.name }} Logo">
              </div>

              <div class="rider-grid">
                <div class="rider official-1">
                  <h3><mat-icon>sports_motorsports</mat-icon> Primary Rider</h3>
                  <div class="rider-details">
                    <span class="rider-name">{{ fantasyTeam.official_rider_1.first_name }} {{ fantasyTeam.official_rider_1.last_name }}</span>
                    <span class="rider-number">#{{ fantasyTeam.official_rider_1.number }}</span>
                  </div>
                </div>

                <div class="rider official-2">
                  <h3><mat-icon>two_wheeler</mat-icon> Secondary Rider</h3>
                  <div class="rider-details">
                    <span class="rider-name">{{ fantasyTeam.official_rider_2.first_name }} {{ fantasyTeam.official_rider_2.last_name }}</span>
                    <span class="rider-number">#{{ fantasyTeam.official_rider_2.number }}</span>
                  </div>
                </div>

                <div class="rider reserve">
                  <h3><mat-icon>engineering</mat-icon> Reserve Rider</h3>
                  <div class="rider-details">
                    <span class="rider-name">{{ fantasyTeam.reserve_rider.first_name }} {{ fantasyTeam.reserve_rider.last_name }}</span>
                    <span class="rider-number">#{{ fantasyTeam.reserve_rider.number }}</span>
                  </div>
                </div>
              </div>

              <div class="team-stats">
                <div class="stat-item">
                  <span class="stat-label">Total Points</span>
                  <span class="stat-value">1,450</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Remaining Budget</span>
                  <span class="stat-value">€2.5M</span>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="primary" (click)="goTo('teams')">
                <mat-icon>list_alt</mat-icon> Team Management
              </button>
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
      padding-top: 80px;
    }
    // .header {
    //   position: fixed;
    //   top: 0;
    //   left: 0;
    //   width: 100%;
    //   height: 80px;
    //   display: flex;
    //   align-items: center;
    //   justify-content: space-between;
    //   background: linear-gradient(135deg, #4a148c, #d81b60);
    //   z-index: 1000;
    // }
    // .header-center {
    //   flex: 1;
    //   text-align: center;
    // }
    // .header-center h1 {
    //   margin: 0;
    //   font-size: 20px;
    // }
    // .header-right {
    //   flex: 0 0 auto;
    // }
    // .header-right button {
    //   color: #fff;
    // }
    .grid-content {
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
    .fantasy-team-card {
      background: rgba(255, 255, 255, 0.95) !important;
      border: 2px solid #d32f2f;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

      .team-title {
        font-size: 1.5rem;
        color: #4a148c;
        display: flex;
        align-items: center;
        gap: 8px;

        mat-icon {
          color: #d32f2f;
        }
      }

      .team-image-container {
        margin: 1rem 0;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 8px;

        img {
          max-width: 200px;
          border: 3px solid #4a148c;
          padding: 4px;
          border-radius: 50%;
        }
      }

      .rider-grid {
        display: grid;
        gap: 1rem;
        margin: 1rem 0;

        .rider {
          padding: 1rem;
          border-radius: 8px;

          h3 {
            margin: 0 0 0.5rem 0;
            display: flex;
            align-items: center;
            gap: 8px;
            color: #4a148c;
          }

          .rider-details {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .rider-name {
              font-weight: 500;
              font-size: 1.1rem;
            }

            .rider-number {
              background: #4a148c;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-weight: bold;
            }
          }
        }

        .official-1 { background: #f8d7da; border-left: 4px solid #dc3545; }
        .official-2 { background: #d1ecf1; border-left: 4px solid #0dcaf0; }
        .reserve { background: #e2e3e5; border-left: 4px solid #6c757d; }
      }

      .team-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        margin-top: 1.5rem;

        .stat-item {
          text-align: center;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;

          .stat-label {
            display: block;
            color: #6c757d;
            font-size: 0.9rem;
          }

          .stat-value {
            display: block;
            font-size: 1.4rem;
            font-weight: bold;
            color: #4a148c;
          }
        }
      }

      mat-card-actions {
        margin-top: auto;
        button {
          mat-icon {
            margin-right: 8px;
          }
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  classificationData?: StandingsRow[];
  nextCalendarRace?: CalendarRace;
  fantasyTeam?: FantasyTeam;
  loggedUserId: string | null;

  // New boolean flags for button visibility
  showLineupsButton: boolean = false;
  showSprintBetButton: boolean = false;
  showPlaceBetButton: boolean = false;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService
  ) {
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      champId > 0 && this.loadDashboardData(champId);
    });
  }

  private loadDashboardData(champId: number): void {
    this.dashboardService.getClassification(champId).subscribe({
      next: (data: StandingsRow[]) => {
        this.classificationData = data;
      },
      error: (error: any) =>
        console.error('Error fetching classification data:', error)
    });
    this.dashboardService.getNextRace(champId).subscribe({
      next: (race: CalendarRace) => {
        this.nextCalendarRace = race;
        this.computeButtonVisibility();
      },
      error: (error: any) => {
        console.error('Error fetching next race:', error);
        this.nextCalendarRace = undefined;
      }
    });
    this.dashboardService.getFantasyTeam(champId).subscribe({
      next: (team: FantasyTeam) => {
        this.fantasyTeam = team;
      },
      error: (error: any) =>
        console.error('Error fetching fantasy team:', error)
    });
  }

  public get isCurrentRace() {
    const today = new Date();
    const eventDate = new Date(this.nextCalendarRace?.event_date || '');
    return today.toDateString() === eventDate.toDateString();
  }

  // Compute visibility conditions for the buttons based on nextRace data and current time.
  private computeButtonVisibility(): void {
    if (!this.nextCalendarRace) {
      this.showLineupsButton = false;
      this.showSprintBetButton = false;
      this.showPlaceBetButton = false;
      return;
    }

    const now = new Date();
    const eventDate = new Date(this.nextCalendarRace.event_date); // event_date as 'YYYY-MM-DD'
    const isEventDay = now.toDateString() === eventDate.toDateString();

    // Calculate diffDays using eventDate's midnight (only valid when not event day)
    const diffDays = (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24);

    // Combine event_date with the time strings to form full Date objects.
    const qualificationsTime = this.nextCalendarRace.qualifications_time
      ? new Date(`${this.nextCalendarRace.event_date}T${this.nextCalendarRace.qualifications_time}`)
      : null;
    const sprintTime = this.nextCalendarRace.sprint_time
      ? new Date(`${this.nextCalendarRace.event_date}T${this.nextCalendarRace.sprint_time}`)
      : null;
    const eventTime = this.nextCalendarRace.event_time
      ? new Date(`${this.nextCalendarRace.event_date}T${this.nextCalendarRace.event_time}`)
      : null;

    // Place Lineups button: Visible only if (when not event day) diffDays is between 1 and 3
    // and before 1 hour prior to qualifications_time.
    this.showLineupsButton = !isEventDay
      && diffDays <= 3 && diffDays >= 1
      && qualificationsTime !== null
      && (now.getTime() < qualificationsTime.getTime() - 3600 * 1000);

    // Place Sprint Bet button: Visible only if (when not event day) diffDays <= 2 and diffDays > 0
    // and before 2 hours prior to sprint_time.
    this.showSprintBetButton = !isEventDay
      && diffDays <= 2 && diffDays > 0
      && sprintTime !== null
      && (now.getTime() < sprintTime.getTime() - 2 * 3600 * 1000);

    // Place Bet button:
    // Option 1 (for one day before event): if not event day, diffDays <= 1 and now is after sprint_time + 1 hour.
    let condition1 = false;
    if (!isEventDay && sprintTime) {
      condition1 = diffDays <= 1 && now.getTime() >= sprintTime.getTime() + 3600 * 1000;
    }
    // Option 2 (for event day): if today is the event date and now is less than or equal to event_time - 2 hours.
    let condition2 = false;
    if (eventTime) {
      condition2 = isEventDay && (now.getTime() <= eventTime.getTime() - 2 * 3600 * 1000);
    }
    this.showPlaceBetButton = condition1 || condition2;
  }

  goTo(path: string, extras: any = {}): void {
    this.router.navigate([`/${path}`, extras]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
