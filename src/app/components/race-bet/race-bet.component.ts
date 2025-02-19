// src/app/race-bet/race-bet.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ChampionshipConfig, ChampionshipRider, DashboardService } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { HttpService } from '../../services/http.service';
import { BetResult } from '../../services/race-detail.service'
import { RaceDetailService } from '../../services/race-detail.service';
import { MatDialog } from '@angular/material/dialog';
import { ExistingBetsModalComponent } from './existing-bets-modal/existing-bets-modal.component';

@Component({
  selector: 'app-race-bet',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="settings-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Race Bet Configuration</h1>
      </header>
      <mat-card class="settings-card">
        <mat-card-header>
          <div class="header-content">
            <mat-card-title class="race-title"><h3>{{ raceTitle }}</h3></mat-card-title>
            <mat-card-subtitle class="session-info">
              Configure your bet for the race
            </mat-card-subtitle>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="raceBetForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Rider</mat-label>
              <mat-select formControlName="rider_id" required>
                <mat-option [value]="" disabled>Select a rider</mat-option>
                <mat-option *ngFor="let rider of riders" [value]="rider.rider_id.id">
                  {{ rider.rider_id.first_name }} {{ rider.rider_id.last_name }} (#{{ rider.rider_id.number }})
                </mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Position</mat-label>
              <input matInput type="number" formControlName="position" required [max]="riders.length">
              <mat-error *ngIf="raceBetForm.get('position')?.hasError('max')">
                Max allowed position: {{ riders.length }}
              </mat-error>
              <mat-error *ngIf="raceBetForm.get('position')?.hasError('required')">
                Position is required
              </mat-error>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Points</mat-label>
              <input matInput type="number" formControlName="points" required [max]="(championshipConfig?.bets_limit_points || 0) - existingBetsPointsSum">
              <mat-error *ngIf="raceBetForm.get('points')?.hasError('max')">
                Remaining points available: {{ (championshipConfig?.bets_limit_points || 0) - existingBetsPointsSum }}
              </mat-error>
              <mat-error *ngIf="raceBetForm.get('points')?.hasError('required')">
                Points are required
              </mat-error>
            </mat-form-field>
            <div *ngIf="raceBetForm.hasError('maxBetsReached')" class="form-level-error">
              <mat-icon>error</mat-icon>
              Maximum {{ championshipConfig?.bets_limit_race }} bets reached for this race
            </div>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button
                  color="primary"
                  class="action-button"
                  [disabled]="raceBetForm.invalid || loading"
                  (click)="onSubmit()">
            {{ loading ? 'Submitting...' : 'Save Race Bet' }}
          </button>
          <button mat-stroked-button
                  color="primary"
                  class="action-button"
                  (click)="openExistingBetsModal()"
                  [disabled]="existingBets.length === 0"
                  matTooltip="View existing bets">
            <mat-icon>history</mat-icon>
            View Bets
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      padding: 20px;
    }
    .settings-card {
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }
    .full-width {
      width: 100%;
    }
    .header {
      width: 100%;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      h1 {
        margin: 0;
        color: white;
      }
    }

    .header-content {
      width: 100%;
      padding: 24px 16px;
      background: white;
      border-bottom: 3px solid var(--primary-color);
      margin-bottom: 24px;
      background-color: whitesmoke;
    }

    .race-title {
      font-family: 'MotoGP-Bold', sans-serif;
      font-size: 1.8rem;
      color: var(--primary-color);
      letter-spacing: 1.5px;
      text-align: center;
      text-transform: uppercase;
    }

    .session-info {
      font-family: 'MotoGP Regular';
      font-size: 1rem;
      color: #666;
      text-align: center;
      letter-spacing: 0.8px;
      font-weight: 500;
    }

    mat-card-header {
      padding: 0px !important;
      margin-bottom: 24px !important;
    }

    mat-card-actions {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
      padding: 16px 0 0 0;
      min-height: 150px;
    }

    .action-button {
      padding: 0 16px;
      min-width: 120px;
      width: 100%;
    }

    mat-card-actions button:last-child {
      margin-top: auto;
    }

    .form-level-error {
      color: red;
      font-size: 0.8rem;
      margin-top: 10px;
    }
  `]
})
export class RaceBetComponent implements OnInit {
  raceBetForm: FormGroup;
  loading: boolean = false;
  riders: ChampionshipRider[] = [];
  private champId: number = 0;
  private raceId: string | null = '';
  raceTitle: string = '';
  championshipConfig: ChampionshipConfig | null = null;
  existingBets: BetResult[] = [];
  existingBetsPointsSum: number = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private httpService: HttpService,
    private route: ActivatedRoute,
    private raceDetailService: RaceDetailService,
    private dialog: MatDialog
  ) {
    this.raceBetForm = this.fb.group({
      rider_id: ['', Validators.required],
      position: ['', Validators.required],
      points: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId > 0) {
        this.champId = champId;
        this.loadChampionshipConfiguration(champId);
        this.loadRiders(champId);
        this.loadCalendarRace(champId);
      }
    });
  }

  loadExistingRaceBet(champId: number) {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/race_bet/${this.raceId}`).subscribe({
      next: (existingBets) => {
        this.existingBets = existingBets;
        this.existingBetsPointsSum = existingBets.reduce((acc, bet) => acc + bet.points, 0);
        this.updatePointsValidation();
        this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Error loading existing bet', err)
    });
  }

  loadRiders(championshipId: number): void {
    this.dashboardService.getAllRiders(championshipId).subscribe({
      next: (riders) => {
        this.riders = riders;
        this.loadExistingRaceBet(championshipId);
        const positionControl = this.raceBetForm.get('position');
        if (positionControl) {
          positionControl.addValidators(Validators.max(this.riders.length));
          positionControl.updateValueAndValidity();
        }
      },
      error: (err) => console.error('Failed to load riders', err)
    });
  }

  loadCalendarRace(championshipId: number) {
    this.raceDetailService.getCalendarRace(championshipId, this.raceId!).subscribe({
      next: (race) => {
        this.raceTitle = race.race_id.name;
      },
      error: (err) => console.error('Failed to load race details', err)
    });
  }

  onSubmit(): void {
    if (this.championshipConfig && this.existingBets.length >= this.championshipConfig.bets_limit_race) {
      alert(`Maximum ${this.championshipConfig.bets_limit_race} bets reached for this race`);
      return;
    }
    if (this.raceBetForm.valid && this.champId && this.raceId) {
      this.loading = true;
      const payload = {
        ...this.raceBetForm.value,
        calendar_id: this.raceId
      };

      this.httpService.genericPut(`/championship/${this.champId}/race_bet`, payload).subscribe({
        next: () => {
          this.loading = false;
          alert('race bet submitted successfully!');
          this.router.navigate(['/race-detail', this.raceId]);
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed', err);
          alert('Submission failed. Please try again.');
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  private loadChampionshipConfiguration(champId: number): void {
    this.dashboardService.getChampionshipConfig(champId).subscribe({
      next: (config) => {
        this.championshipConfig = config;
        this.updatePointsValidation();
        this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Failed to load championship configuration', err)
    });
  }

  private updatePointsValidation(): void {
    const pointsControl = this.raceBetForm.get('points');
    if (pointsControl && this.championshipConfig) {
      const maxPoints = this.championshipConfig.bets_limit_points - this.existingBetsPointsSum;
      pointsControl.setValidators([
        Validators.required,
        Validators.max(maxPoints)
      ]);
      pointsControl.updateValueAndValidity();
    }
  }

  private updateMaxBetsValidation(): void {
    if (this.championshipConfig) {
      const maxReached = this.existingBets.length >= this.championshipConfig.bets_limit_race;
      const currentErrors = this.raceBetForm.errors || {};

      if (maxReached) {
        this.raceBetForm.setErrors({ ...currentErrors, maxBetsReached: true });
        this.raceBetForm.disable();
      } else {
        const { maxBetsReached, ...remainingErrors } = currentErrors;
        this.raceBetForm.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
        this.raceBetForm.enable();
      }
    }
  }

  openExistingBetsModal(): void {
    this.dialog.open(ExistingBetsModalComponent, {
      width: '500px',
      data: { bets: this.existingBets, riders: this.riders }
    });
  }
}
