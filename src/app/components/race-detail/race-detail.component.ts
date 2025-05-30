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
        <mat-card class="race-section-card">
          <div class="card-header">
            <mat-icon>group</mat-icon>
            <span>Rider Lineups</span>
            <span class="section-count">({{ lineups.length }})</span>
          </div>
          <div class="section-subtitle">Lineups for this race</div>
          <mat-card-content>
            <table mat-table [dataSource]="lineups" class="result-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let element">{{ element.user_id.first_name + ' ' + element.user_id.last_name || 'Unknown User' }}</td>
              </ng-container>
              <ng-container matColumnDef="qualifying_rider">
                <th mat-header-cell *matHeaderCellDef>Qualifying Rider</th>
                <td mat-cell *matCellDef="let element">
                  {{ element.qualifying_rider_id?.first_name + ' ' + element.qualifying_rider_id.last_name + ' #' + element.qualifying_rider_id.number || 'N/A' }}
                </td>
              </ng-container>
              <ng-container matColumnDef="race_rider">
                <th mat-header-cell *matHeaderCellDef>Race Rider</th>
                <td mat-cell *matCellDef="let element">
                  {{ element.race_rider_id?.first_name + ' ' + element.race_rider_id.last_name + ' #' + element.race_rider_id.number || 'N/A' }}
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="lineupColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: lineupColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Sprint Results Section -->
        <mat-card class="race-section-card">
          <div class="card-header sprint">
            <mat-icon>speed</mat-icon>
            <span>Sprint Bets</span>
            <span class="section-count">({{ sprints.length }})</span>
          </div>
          <div class="section-subtitle">Sprint results and points</div>
          <mat-card-content>
            <table mat-table [dataSource]="sprints" class="result-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let element">{{ element.user_id.first_name + ' ' + element.user_id.last_name }}</td>
              </ng-container>
              <ng-container matColumnDef="rider">
                <th mat-header-cell *matHeaderCellDef>Rider</th>
                <td mat-cell *matCellDef="let element">{{ element.rider_id.first_name + ' ' + element.rider_id.last_name }}</td>
              </ng-container>
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef>Position</th>
                <td mat-cell *matCellDef="let element"><span class="badge position">{{ element.position }}</span></td>
              </ng-container>
              <ng-container matColumnDef="points">
                <th mat-header-cell *matHeaderCellDef>Points</th>
                <td mat-cell *matCellDef="let element"><span class="badge points">{{ element.points }}</span></td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="sprintColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: sprintColumns;"></tr>
            </table>
          </mat-card-content>
        </mat-card>

        <!-- Race Bets Section -->
        <mat-card class="race-section-card">
          <div class="card-header race">
            <mat-icon>flag</mat-icon>
            <span>Race Bets</span>
            <span class="section-count">({{ bets.length }})</span>
          </div>
          <div class="section-subtitle">Main race results and points</div>
          <mat-card-content>
            <table mat-table [dataSource]="bets" class="result-table">
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>User</th>
                <td mat-cell *matCellDef="let element">{{ element.user_id.first_name + ' ' + element.user_id.last_name }}</td>
              </ng-container>
              <ng-container matColumnDef="rider">
                <th mat-header-cell *matHeaderCellDef>Rider</th>
                <td mat-cell *matCellDef="let element">{{ element.rider_id.first_name + ' ' + element.rider_id.last_name }}</td>
              </ng-container>
              <ng-container matColumnDef="position">
                <th mat-header-cell *matHeaderCellDef>Position</th>
                <td mat-cell *matCellDef="let element"><span class="badge position">{{ element.position }}</span></td>
              </ng-container>
              <ng-container matColumnDef="points">
                <th mat-header-cell *matHeaderCellDef>Points</th>
                <td mat-cell *matCellDef="let element"><span class="badge points">{{ element.points }}</span></td>
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
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
      align-items: center;
    }
    .race-section-card {
      width: 100%;
      max-width: 900px;
      margin-bottom: 1.5rem;
      border-radius: 18px;
      box-shadow: 0 4px 24px rgba(76, 0, 130, 0.10);
      overflow: hidden;
      background: white;
    }
    .card-header {
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: white;
      padding: 1.2rem 1rem;
      border-radius: 18px 18px 0 0;
      font-family: 'MotoGP Bold', sans-serif;
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 1.3rem;
      letter-spacing: 1px;
    }
    .card-header.sprint {
      background: linear-gradient(135deg, #d81b60, #4a148c);
    }
    .card-header.race {
      background: linear-gradient(135deg, #4a148c, #d81b60);
    }
    .section-count {
      font-size: 1rem;
      opacity: 0.85;
      margin-left: auto;
      font-family: 'MotoGP Regular', sans-serif;
    }
    .section-subtitle {
      color: var(--secondary-color);
      font-size: 1rem;
      margin: 0.5rem 1.5rem 0.5rem 1.5rem;
      font-family: 'MotoGP Regular', sans-serif;
    }
    .result-table {
      width: 100%;
      margin: 1rem 0;
      border-radius: 12px;
      overflow: hidden;
      border-collapse: separate;
      border-spacing: 0;
      background: #faf8fc;
      box-shadow: 0 2px 8px rgba(76, 0, 130, 0.04);
    }
    th, td {
      padding: 1rem;
      text-align: left;
      color: #333;
      font-size: 1rem;
    }
    th {
      background: rgba(76, 0, 130, 0.08);
      color: var(--primary-color);
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.05rem;
      letter-spacing: 0.5px;
    }
    tr:nth-child(even) td {
      background: #f3eafd;
    }
    tr:hover td {
      background: #ede7f6;
      transition: background 0.2s;
    }
    .badge {
      display: inline-block;
      padding: 0.3em 0.8em;
      border-radius: 12px;
      font-size: 0.95em;
      font-weight: 600;
      color: white;
      background: var(--primary-color);
      margin-right: 0.2em;
    }
    .badge.points {
      background: var(--secondary-color);
    }
    .badge.position {
      background: #d81b60;
    }
    @media (max-width: 1000px) {
      .race-section-card {
        max-width: 98vw;
      }
    }
    @media (max-width: 600px) {
      .main-content {
        padding: 80px 0 0 0;
        gap: 1.2rem;
      }
      .race-section-card {
        max-width: 100vw;
        border-radius: 0;
      }
      .card-header {
        border-radius: 0;
        font-size: 1.1rem;
        padding: 1rem 0.5rem;
      }
      th, td {
        padding: 0.6rem;
        font-size: 0.95rem;
      }
    }
  `]
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  raceName: string = '';
  lineupColumns: string[] = ['user', 'qualifying_rider','race_rider'];
  sprintColumns: string[] = ['user', 'rider', 'position', 'points'];
  betColumns: string[] = ['user', 'rider', 'position', 'points'];

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
        next: (race) => this.raceName = race.race_id.name,
        error: (err) => console.error('Error fetching race info:', err)
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/calendar']);
  }
}
