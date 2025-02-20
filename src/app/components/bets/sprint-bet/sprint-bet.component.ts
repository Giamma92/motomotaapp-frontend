// src/app/sprint-bet/sprint-bet.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BaseBetComponent } from '../base-bet.component';

@Component({
  selector: 'app-sprint-bet',
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
        <h1>Sprint Race Bet Configuration</h1>
      </header>
      <mat-card class="settings-card">
        <mat-card-header>
          <div class="header-content">
            <mat-card-title class="race-title"><h3>{{ raceTitle }}</h3></mat-card-title>
            <mat-card-subtitle class="session-info">
              Configure your sprint bet for the race
            </mat-card-subtitle>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="betForm" (ngSubmit)="onSubmit()">
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
              <mat-error *ngIf="betForm.get('position')?.hasError('max')">
                Max allowed position: {{ riders.length }}
              </mat-error>
              <mat-error *ngIf="betForm.get('position')?.hasError('required')">
                Position is required
              </mat-error>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Points</mat-label>
              <input matInput type="number" formControlName="points" required [max]="(pointsLimit || 0) - existingBetsPointsSum">
              <mat-error *ngIf="betForm.get('points')?.hasError('max')">
                Remaining points available: {{ (pointsLimit || 0) - existingBetsPointsSum }}
              </mat-error>
              <mat-error *ngIf="betForm.get('points')?.hasError('required')">
                Points are required
              </mat-error>
            </mat-form-field>
            <div *ngIf="betForm.hasError('maxBetsReached')" class="form-level-error">
              <mat-icon>error</mat-icon>
              Maximum {{ maxBets }} bets reached for this race
            </div>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button
                  color="primary"
                  class="action-button"
                  [disabled]="betForm.invalid || loading"
                  (click)="onSubmit()">
            {{ loading ? 'Submitting...' : 'Save Sprint Race Bet' }}
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
export class SprintBetComponent extends BaseBetComponent implements OnInit {
  betForm = this.fb.group({
    rider_id: ['', Validators.required],
    position: ['', Validators.required],
    points: ['', Validators.required]
  });
  betType = 'sprint' as const;

  override get betEndpoint() { return 'sprint_bet'; }
  override get pointsLimit() { return this.championshipConfig?.bets_limit_sprint_points || 0; }
  override get maxBets() { return this.championshipConfig?.bets_limit_sprint_race || 0; } // Sprint typically allows only 1 bet

  // Keep only sprint-specific overrides
}
