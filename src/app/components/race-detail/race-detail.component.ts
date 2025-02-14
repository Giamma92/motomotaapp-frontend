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

@Component({
  selector: 'app-race-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatExpansionModule],
  template: `
    <div class="race-detail-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Race Details</h1>
      </header>
      <main class="main-content">
        <!-- Lineups Section -->
        <mat-card>
          <mat-card-title>Lineups</mat-card-title>
          <mat-card-content>
            <mat-accordion>
              <mat-expansion-panel *ngFor="let group of groupedLineups">
                <mat-expansion-panel-header>
                  <mat-panel-title> Race ID: {{ group.raceId }} </mat-panel-title>
                </mat-expansion-panel-header>
                <table mat-table [dataSource]="group.data" class="result-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>User</th>
                    <td mat-cell *matCellDef="let element">{{ element.user_id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="qualifying_rider">
                    <th mat-header-cell *matHeaderCellDef>Qualifying Rider ID</th>
                    <td mat-cell *matCellDef="let element">{{ element.qualifying_rider_id || 'N/A' }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="lineupColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: lineupColumns;"></tr>
                </table>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>

        <!-- Sprint Results Section -->
        <mat-card>
          <mat-card-title>Sprint Results</mat-card-title>
          <mat-card-content>
            <mat-accordion>
              <mat-expansion-panel *ngFor="let group of groupedSprints">
                <mat-expansion-panel-header>
                  <mat-panel-title> Race ID: {{ group.raceId }} </mat-panel-title>
                </mat-expansion-panel-header>
                <table mat-table [dataSource]="group.data" class="result-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>User</th>
                    <td mat-cell *matCellDef="let element">{{ element.user_id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="rider">
                    <th mat-header-cell *matHeaderCellDef>Rider ID</th>
                    <td mat-cell *matCellDef="let element">{{ element.rider_id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="position">
                    <th mat-header-cell *matHeaderCellDef>Position</th>
                    <td mat-cell *matCellDef="let element">{{ element.position }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="sprintColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: sprintColumns;"></tr>
                </table>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>

        <!-- Bet Results Section -->
        <mat-card>
          <mat-card-title>Bet Results</mat-card-title>
          <mat-card-content>
            <mat-accordion>
              <mat-expansion-panel *ngFor="let group of groupedBets">
                <mat-expansion-panel-header>
                  <mat-panel-title> Race ID: {{ group.raceId }} </mat-panel-title>
                </mat-expansion-panel-header>
                <table mat-table [dataSource]="group.data" class="result-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>User</th>
                    <td mat-cell *matCellDef="let element">{{ element.user_id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="rider">
                    <th mat-header-cell *matHeaderCellDef>Rider ID</th>
                    <td mat-cell *matCellDef="let element">{{ element.rider_id }}</td>
                  </ng-container>
                  <ng-container matColumnDef="points">
                    <th mat-header-cell *matHeaderCellDef>Points</th>
                    <td mat-cell *matCellDef="let element">{{ element.points }}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="betColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: betColumns;"></tr>
                </table>
              </mat-expansion-panel>
            </mat-accordion>
          </mat-card-content>
        </mat-card>
      </main>
    </div>
  `,
  styles: [`
    .race-detail-container {
      padding: 20px;
      background: #f5f5f5;
      min-height: 100vh;
    }
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
    }
    .header h1 {
      flex: 1;
      text-align: center;
      margin: 0;
    }
    .main-content {
      margin-top: 20px;
    }
    .result-table {
      width: 100%;
    }
    table th, table td {
      padding: 8px;
      text-align: left;
    }
    mat-card {
      margin-bottom: 20px;
    }
  `]
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  lineupColumns: string[] = ['user', 'qualifying_rider'];
  sprintColumns: string[] = ['user', 'rider', 'position'];
  betColumns: string[] = ['user', 'rider', 'points'];

  groupedLineups: { raceId: number, data: LineupsResult[] }[] = [];
  groupedSprints: { raceId: number, data: BetResult[] }[] = [];
  groupedBets: { raceId: number, data: BetResult[] }[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private raceDetailService: RaceDetailService
  ) {}

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    if (this.raceId) {
      this.raceDetailService.getRaceDetails(this.raceId).subscribe({
        next: (data) => {
          this.groupedLineups = this.groupByRaceId(data.lineups);
          this.groupedSprints = this.groupByRaceId(data.sprints);
          this.groupedBets = this.groupByRaceId(data.bets);
        },
        error: (err) => console.error('Error fetching race details:', err)
      });
    }
  }

  private groupByRaceId<T extends { calendar_id: CalendarRace }>(items: T[]): { raceId: number, data: T[] }[] {
    const grouped: { [key: number]: T[] } = {};
    items.forEach(item => {
      const race_id = item.calendar_id.race_id.id;
      if (!grouped[race_id]) {
        grouped[race_id] = [];
      }
      grouped[race_id].push(item);
    });
    return Object.keys(grouped).map(key => ({ raceId: +key, data: grouped[+key] }));
  }

  goBack(): void {
    this.router.navigate(['/calendar']);
  }
}
