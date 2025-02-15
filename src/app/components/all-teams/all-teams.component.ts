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
              <div class="team-header">
                <div class="team-image-container" *ngIf="team.team_image">
                  <img [src]="team.team_image" alt="{{ team.name }} Logo">
                </div>
                <div class="header-content">
                  <div class="team-info">
                    <mat-card-title class="team-name">{{ team.name }}</mat-card-title>
                    <div class="user-details">
                      <span class="username">{{ team.user_id.first_name }} {{ team.user_id.last_name }}</span>
                      <span class="user-id">ID: {{ team.user_id.id }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-header>
            <mat-card-content>
              <div class="content-grid">
                <div class="riders-section">
                  <div class="rider official-1">
                    <h3>Primary Riders</h3>
                    <div class="rider-details">
                      <div class="rider">
                        <span class="number">#{{ team.official_rider_1.number }}</span>
                        <span class="name">{{ team.official_rider_1.first_name }} {{ team.official_rider_1.last_name }}</span>
                      </div>
                      <div class="rider">
                        <span class="number">#{{ team.official_rider_2.number }}</span>
                        <span class="name">{{ team.official_rider_2.first_name }} {{ team.official_rider_2.last_name }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="rider reserve">
                    <h3>Reserve Rider</h3>
                    <div class="rider-details">
                      <div class="rider">
                        <span class="number">#{{ team.reserve_rider.number }}</span>
                        <span class="name">{{ team.reserve_rider.first_name }} {{ team.reserve_rider.last_name }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="stats-section">
                  <div class="stat-item">
                    <mat-icon>emoji_events</mat-icon>
                    <div>
                      <div class="stat-label">Total Points</div>
                      <div class="stat-value">1,450</div>
                    </div>
                  </div>
                  <div class="stat-item">
                    <mat-icon>euro_symbol</mat-icon>
                    <div>
                      <div class="stat-label">Remaining Budget</div>
                      <div class="stat-value">€2.5M</div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" class="view-button">
                <mat-icon>visibility</mat-icon>
                View Team
              </button>
            </mat-card-actions>
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
      grid-template-columns: 1fr;
      gap: 25px;
      max-width: 1400px;
      width: 100%;
    }

    /* Team Cards */
    .mat-mdc-card.team-card {
      background: rgba(255, 255, 255, 0.95) !important;
      color: #333 !important;

      .mat-mdc-card-title {
        color: #4a148c !important;
      }

      .rider {
        &.official-1 {
          background: lighten(#f8d7da, 3%);
          border-color: #dc3545;
        }
        &.reserve {
          background: lighten(#e2e3e5, 3%);
          border-color: #6c757d;
        }
      }

      .stat-item {
        background: #f8f9fa !important;
        color: #4a148c !important;
      }
    }

    .team-card {
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 12px;
      border: 2px solid #d32f2f;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateY(-3px);
      }

      .team-header {
        display: flex;
        gap: 0px;
        padding: 15px;
        background: white;
        border-bottom: 2px solid var(--accent-red);
        align-items: center;
        width: 100%;
        background: whitesmoke;

        .team-image-container {
          flex: 0 0 60px;
          img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid var(--primary-color);
            margin-top: 4px;
          }
        }

        .header-content {
          flex: 1;

          .team-info {
            max-width: 200px;

            mat-card-title.mat-mdc-card-title.team-name {
              padding-top: 0px;
            }
          }

          .team-name-container {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 8px;

            .team-name {
              margin: 0;
              font-size: 1.4rem;
              color: var(--primary-color);
              font-family: 'MotoGP Bold', sans-serif;
              line-height: 1.2;
            }
          }

          .user-info {
            display: flex;
            gap: 12px;
            align-items: center;

            .username {
              font-size: 0.95rem;
              color: #444;
              font-weight: 500;
              position: relative;
              padding-left: 8px;

              &::before {
                content: "•";
                margin-right: 8px;
                color: #ddd;
              }
            }

            .user-id {
              font-size: 0.85rem;
              color: #666;
              background: #f5f5f5;
              padding: 4px 10px;
              border-radius: 12px;
            }
          }
        }
      }

      .main-content {
        padding: 70px 0px 0px 0px;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        padding: 15px;

        .riders-section {
          display: flex;
          flex-direction: column;
          gap: 15px;

          .rider {
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);

            h3 {
              margin: 0 0 10px 0;
              padding-bottom: 8px;
              border-bottom: 1px solid rgba(0,0,0,0.1);
            }

            .rider-details {
              display: flex;
              flex-direction: column;
              gap: 8px;

              .rider {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                border-radius: 4px;

                .number {
                  background: var(--primary-color);
                  color: white;
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 0.9rem;
                }

                .name {
                  font-size: 0.95rem;
                  color: #333;
                }
              }
            }
          }

          .official-1 {
            background: linear-gradient(145deg, #f8d7da, #fff5f6);
            border: 1px solid #f8d7da;
          }

          .reserve {
            background: linear-gradient(145deg, #e2e3e5, #f8f9fa);
            border: 1px solid #e2e3e5;
          }
        }

        .stats-section {
          display: flex;
          flex-direction: column;
          gap: 15px;
          padding-left: 15px;
          border-left: 2px solid #eee;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 10px;

            mat-icon {
              color: var(--accent-red);
              font-size: 1.8rem;
            }

            .stat-label {
              font-size: 0.9rem;
              color: #666;
            }

            .stat-value {
              font-size: 1.1rem;
              color: var(--primary-color);
              font-weight: 500;
            }
          }
        }
      }

      mat-card-actions {
        padding: 10px 15px;
        border-top: 1px solid #eee;

        .view-button {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          padding: 4px 12px;
        }
      }

      @media (max-width: 768px) {
        .content-grid {
          grid-template-columns: 1fr;

          .stats-section {
            border-left: none;
            border-top: 2px solid #eee;
            padding-top: 15px;
            padding-left: 0;
          }
        }

        .team-header {
          flex-direction: column;
          align-items: center;

          .header-content {
            width: 100%;

            .team-name-container {
              justify-content: center;
              text-align: center;
            }

            .user-info {
              justify-content: center;
              flex-wrap: wrap;
            }
          }
        }
      }
    }

    .no-teams {
      margin-top: 20px;
      text-align: center;
      font-size: 18px;
    }

    @media (min-width: 1200px) {
      .teams-grid {
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      }
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
