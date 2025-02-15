import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { BetResult, LineupsResult, RaceDetailService } from '../../services/race-detail.service';
import { CalendarRace, Race } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';

@Component({
  selector: 'app-race-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="page-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Race Details - {{ raceName }}</h1>
      </header>

      <main class="main-content">
        <!-- Lineups Section -->
        <mat-card>
          <mat-card-title>
            <mat-icon>group</mat-icon>
            Rider Lineups ({{ lineups.length }})
          </mat-card-title>
          <mat-card-content>
            <table mat-table [dataSource]="lineups" class="result-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let element">{{ element.user_id }}</td>
              </ng-container>
              <ng-container matColumnDef="qualifying_rider">
                <th mat-header-cell *matHeaderCellDef>Qualifying Rider</th>
                <td mat-cell *matCellDef="let element">{{ element.qualifying_rider_id || 'N/A' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineupColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineupColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Sprint Results Section -->
        <mat-card>
          <mat-card-title>
            <mat-icon>speed</mat-icon>
            Sprint Bets ({{ sprints.length }})
          </mat-card-title>
          <mat-card-content>
            <table mat-table [dataSource]="sprints" class="result-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let element">{{ element.user_id }}</td>
              </ng-container>
              <ng-container matColumnDef="rider">
                <th mat-header-cell *matHeaderCellDef>Rider</th>
                <td mat-cell *matCellDef="let element">{{ element.rider_id }}</td>
              </ng-container>
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef>Position</th>
                <td mat-cell *matCellDef="let element">{{ element.position }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="sprintColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: sprintColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Race Bets Section -->
        <mat-card>
          <mat-card-title>
            <mat-icon>flag</mat-icon>
            Race Bets ({{ bets.length }})
          </mat-card-title>
          <mat-card-content>
            <table mat-table [dataSource]="bets" class="result-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let element">{{ element.user_id }}</td>
              </ng-container>
              <ng-container matColumnDef="rider">
                <th mat-header-cell *matHeaderCellDef>Rider</th>
                <td mat-cell *matCellDef="let element">{{ element.rider_id }}</td>
              </ng-container>
              <ng-container matColumnDef="points">
                <th mat-header-cell *matHeaderCellDef>Points</th>
                <td mat-cell *matCellDef="let element">{{ element.points }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="betColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: betColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
      .main-content {
        color: black;
        padding: 70px 0px 0px 0px;
      }

    .result-table {
      width: 100%;
      margin: 1rem 0;

      th, td {
        padding: 1rem;
        text-align: left;
        color: #333;
      }

      th {
        background: rgba(var(--primary-color), 0.1);
        color: var(--primary-color);
      }

      tr:hover {
        background: #f5f5f5;
      }
    }

    mat-card {
      margin-bottom: 2rem;
      border-left: 4px solid var(--primary-color);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      border-radius: 12px;
      overflow: hidden;

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.5rem;
        margin: 0;
        background: rgba(var(--primary-color), 0.05);
      }
    }

    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      max-width: 1440px;
      margin: 0 auto;
      padding: 2rem;

      @media (max-width: 1200px) {
        grid-template-columns: 1fr;
      }
    }

    @media (min-width: 1200px) {
      mat-card {
        height: 600px;

        mat-card-content {
          overflow: auto;
          height: calc(100% - 80px);
        }
      }
    }
  `]
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  raceName: string = '';
  lineupColumns: string[] = ['user', 'qualifying_rider'];
  sprintColumns: string[] = ['user', 'rider', 'position'];
  betColumns: string[] = ['user', 'rider', 'points'];

  lineups: LineupsResult[] = [];
  sprints: BetResult[] = [];
  bets: BetResult[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService
  ) {}

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId === 0 || !this.raceId) return;

      // Load race details
      this.raceDetailService.getRaceDetails(champId, this.raceId).subscribe({
        next: (data) => {
          this.lineups = data.lineups;
          this.sprints = data.sprints;
          this.bets = data.bets;
        },
        error: (err) => console.error('Error fetching race details:', err)
      });

      // Load race name
      this.raceDetailService.getCalendarRace(champId, this.raceId).subscribe({
        next: ([race]) => this.raceName = race.race_id.name,
        error: (err) => console.error('Error fetching race info:', err)
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/calendar']);
  }
}
