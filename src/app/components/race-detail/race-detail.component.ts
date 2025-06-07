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
import { RaceScheduleService } from '../../services/race-schedule.service';

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
        <h1>{{ raceName }}</h1>
      </header>
      <main class="main-content">
        <ng-container *ngIf="showLineups || showSprintBet || showRaceBet; else notStarted">
          <mat-card class="race-section-card" *ngIf="showLineups">
            <div class="card-header">
              <mat-icon>group</mat-icon>
              <span>Rider Lineups</span>
              <span class="section-count">({{ lineups.length }})</span>
            </div>
            <div class="section-subtitle">Lineups for this race</div>
            <mat-card-content>
              <ng-container *ngIf="!isMobile">
                <table mat-table [dataSource]="lineups" class="result-table">
                  <ng-container matColumnDef="user">
                    <th mat-header-cell *matHeaderCellDef>User</th>
                    <td mat-cell *matCellDef="let element">{{ element.user_id.first_name + ' ' + element.user_id.last_name || 'Unknown User' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="qualifying_rider">
                    <th mat-header-cell *matHeaderCellDef>Qualifying Rider</th>
                    <td mat-cell *matCellDef="let element">
                      {{ getRiderDisplay(element.qualifying_rider_id) }}
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="race_rider">
                    <th mat-header-cell *matHeaderCellDef>Race Rider</th>
                    <td mat-cell *matCellDef="let element">
                      {{ getRiderDisplay(element.race_rider_id) }}
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="lineupColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: lineupColumns;"></tr>
                </table>
              </ng-container>
              <ng-container *ngIf="isMobile">
                <div class="card-list-vertical">
                  <div class="bet-card" *ngFor="let element of lineups">
                    <div class="bet-row"><span class="bet-label">User:</span> {{ element.user_id.first_name + ' ' + element.user_id.last_name || 'Unknown User' }}</div>
                    <div class="bet-row"><span class="bet-label">Qualifying Rider:</span> {{ getRiderDisplay(element.qualifying_rider_id) }}</div>
                    <div class="bet-row"><span class="bet-label">Race Rider:</span> {{ getRiderDisplay(element.race_rider_id) }}</div>
                  </div>
                </div>
              </ng-container>
            </mat-card-content>
          </mat-card>

          <mat-card class="race-section-card" *ngIf="showSprintBet">
            <div class="card-header sprint">
              <mat-icon>speed</mat-icon>
              <span>Sprint Bets</span>
              <span class="section-count">({{ sprints.length }})</span>
            </div>
            <div class="section-subtitle">Sprint results and points</div>
            <mat-card-content>
              <ng-container *ngIf="!isMobile">
                <div class="table-responsive">
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
                      <td mat-cell *matCellDef="let element"><span class="badge position">{{ getPositionDisplay(element.position) }}</span></td>
                    </ng-container>
                    <ng-container matColumnDef="points">
                      <th mat-header-cell *matHeaderCellDef>Points</th>
                      <td mat-cell *matCellDef="let element"><span class="badge points">{{ element.points }}</span></td>
                    </ng-container>
                    <ng-container matColumnDef="outcome">
                      <th mat-header-cell *matHeaderCellDef>Result</th>
                      <td mat-cell *matCellDef="let element">{{ element.outcome || 'N/A' }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="sprintColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: sprintColumns;"></tr>
                  </table>
                </div>
              </ng-container>
              <ng-container *ngIf="isMobile">
                <div class="card-list-horizontal">
                  <div class="bet-card" *ngFor="let element of sprints">
                    <div class="bet-row"><span class="bet-label">User:</span> {{ element.user_id.first_name + ' ' + element.user_id.last_name }}</div>
                    <div class="bet-row"><span class="bet-label">Rider:</span> {{ element.rider_id.first_name + ' ' + element.rider_id.last_name }}</div>
                    <div class="bet-row"><span class="bet-label">Position:</span> <span class="badge position">{{ getPositionDisplay(element.position) }}</span></div>
                    <div class="bet-row"><span class="bet-label">Points:</span> <span class="badge points">{{ element.points }}</span></div>
                    <div class="bet-row"><span class="bet-label">Result:</span> {{ element.outcome || 'N/A' }}</div>
                  </div>
                </div>
              </ng-container>
            </mat-card-content>
          </mat-card>

          <mat-card class="race-section-card" *ngIf="showRaceBet">
            <div class="card-header race">
              <mat-icon>flag</mat-icon>
              <span>Race Bets</span>
              <span class="section-count">({{ bets.length }})</span>
            </div>
            <div class="section-subtitle">Main race results and points</div>
            <mat-card-content>
              <ng-container *ngIf="!isMobile">
                <div class="table-responsive">
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
                      <td mat-cell *matCellDef="let element"><span class="badge position">{{ getPositionDisplay(element.position) }}</span></td>
                    </ng-container>
                    <ng-container matColumnDef="points">
                      <th mat-header-cell *matHeaderCellDef>Points</th>
                      <td mat-cell *matCellDef="let element"><span class="badge points">{{ element.points }}</span></td>
                    </ng-container>
                    <ng-container matColumnDef="outcome">
                      <th mat-header-cell *matHeaderCellDef>Result</th>
                      <td mat-cell *matCellDef="let element">{{ element.outcome || 'N/A' }}</td>
                    </ng-container>
                    <tr mat-header-row *matHeaderRowDef="betColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: betColumns;"></tr>
                  </table>
                </div>
              </ng-container>
              <ng-container *ngIf="isMobile">
                <div class="card-list-horizontal">
                  <div class="bet-card" *ngFor="let element of bets">
                    <div class="bet-row"><span class="bet-label">User:</span> {{ element.user_id.first_name + ' ' + element.user_id.last_name }}</div>
                    <div class="bet-row"><span class="bet-label">Rider:</span> {{ element.rider_id.first_name + ' ' + element.rider_id.last_name }}</div>
                    <div class="bet-row"><span class="bet-label">Position:</span> <span class="badge position">{{ getPositionDisplay(element.position) }}</span></div>
                    <div class="bet-row"><span class="bet-label">Points:</span> <span class="badge points">{{ element.points }}</span></div>
                    <div class="bet-row"><span class="bet-label">Result:</span> {{ element.outcome || 'N/A' }}</div>
                  </div>
                </div>
              </ng-container>
            </mat-card-content>
          </mat-card>
        </ng-container>
        <ng-template #notStarted>
          <div class="not-started-label" style="text-align:center; margin-top:2rem; font-size:1.2rem; color:#888;">
            The race is not started yet
          </div>
        </ng-template>
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
      background: linear-gradient(135deg, #1976d2, #1565c0);
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
      background: linear-gradient(135deg, #1976d2, #1565c0);
    }
    .card-header.race {
      background: linear-gradient(135deg, #1976d2, #1565c0);
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
      border-radius: 18px;
      overflow: hidden;
      border-collapse: separate;
      border-spacing: 0;
      background: #faf8fc;
      box-shadow: 0 2px 8px rgba(76, 0, 130, 0.04);
    }
    .result-table th:first-child {
      border-top-left-radius: 18px;
    }
    .result-table th:last-child {
      border-top-right-radius: 18px;
    }
    .result-table tfoot td:first-child {
      border-bottom-left-radius: 18px;
    }
    .result-table tfoot td:last-child {
      border-bottom-right-radius: 18px;
    }
    .result-table tr:last-child td:first-child {
      border-bottom-left-radius: 18px;
    }
    .result-table tr:last-child td:last-child {
      border-bottom-right-radius: 18px;
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
      .table-responsive {
        margin: 0 -8px;
      }
      th, td {
        padding: 0.4rem;
        font-size: 0.90rem;
      }
      .result-table {
        min-width: 500px;
      }
    }
    .table-responsive {
      width: 100%;
      overflow-x: auto;
    }
    .card-list-horizontal {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      gap: 1rem;
      max-height: 60vh;
      padding: 0.5rem 0;
    }
    .bet-card {
      min-width: 220px;
      background: #faf8fc;
      border-radius: 14px;
      box-shadow: 0 2px 8px rgba(76, 0, 130, 0.08);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.98rem;
    }
    .bet-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .bet-label {
      font-weight: 600;
      color: var(--primary-color);
      min-width: 70px;
      display: inline-block;
    }
    .card-list-vertical {
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      gap: 1rem;
      max-height: 60vh;
      padding: 0.5rem 0;
    }
  `]
})
export class RaceDetailComponent implements OnInit {
  raceId: string | null = null;
  raceName: string = '';
  lineupColumns: string[] = ['user', 'qualifying_rider','race_rider'];
  sprintColumns: string[] = ['user', 'rider', 'position', 'points', 'outcome'];
  betColumns: string[] = ['user', 'rider', 'position', 'points', 'outcome'];

  lineups: LineupsResult[] = [];
  sprints: BetResult[] = [];
  bets: BetResult[] = [];

  isMobile: boolean = false;
  calendarRace: CalendarRace | null = null;
  showLineups = false;
  showSprintBet = false;
  showRaceBet = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private raceScheduleService: RaceScheduleService
  ) {}

  ngOnInit(): void {
    this.isMobile = window.innerWidth <= 600;
    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth <= 600;
    });
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId === 0 || !this.raceId) return;

      // Load race details
      this.raceDetailService.getRaceDetails(champId, this.raceId).subscribe({
        next: (data: { lineups: LineupsResult[]; sprints: BetResult[]; bets: BetResult[] }) => {
          this.lineups = data.lineups;
          this.sprints = data.sprints;
          this.bets = data.bets;
        },
        error: (err: any) => console.error('Error fetching race details:', err)
      });

      // Load race info for schedule logic
      this.raceDetailService.getCalendarRace(champId, this.raceId).subscribe({
        next: (race: CalendarRace) => {
          this.calendarRace = race;
          this.raceName = race.race_id.name;

          const now = new Date();
          const raceDate = new Date(race.event_date);
          const dayBeforeRace = new Date(raceDate);
          dayBeforeRace.setDate(dayBeforeRace.getDate() - 1);

          // If today is after race date, show all tables
          if (now > raceDate) {
            this.showLineups = true;
            this.showSprintBet = true;
            this.showRaceBet = true;
          }
          // Check if we're on or after the day before the race
          else if (now >= dayBeforeRace) {
            // Show lineups if we're past qualifying time
            const qualifyingTime = new Date(`${dayBeforeRace.toISOString().split('T')[0]}T${race.qualifications_time || '14:00:00'}`);
            this.showLineups = now > qualifyingTime;

            // Show sprint bet if we're past sprint time
            const sprintTime = new Date(`${dayBeforeRace.toISOString().split('T')[0]}T${race.sprint_time || '14:00:00'}`);
            this.showSprintBet = now > sprintTime;

            // Show race bet if we're on race day and past event time
            const isRaceDay = now.toDateString() === raceDate.toDateString();
            const eventTime = new Date(`${race.event_date}T${race.event_time || '14:00:00'}`);
            this.showRaceBet = isRaceDay && now > eventTime;
          } else {
            // If we're before the day before the race, use the normal schedule logic
            this.showLineups = this.raceScheduleService.canShowLineups(race);
            this.showSprintBet = this.raceScheduleService.canShowSprintBet(race);
            this.showRaceBet = this.raceScheduleService.canShowRaceBet(race);
          }
        },
        error: (err: any) => console.error('Error fetching race info:', err)
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/calendar']);
  }

  getRiderDisplay(rider: any): string {
    if (!rider) return 'N/A';
    const first = rider.first_name || '';
    const last = rider.last_name || '';
    const num = rider.number ? ' #' + rider.number : '';
    return (first + ' ' + last + num).trim() || 'N/A';
  }

  getPositionDisplay(position: number): string {
    if (typeof position !== 'number') return 'N/A';
    return `${position} / ${position + 1}`;
  }
}
