import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChampionshipService, Championship } from '../../services/championship.service';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserSettingsService } from '../../services/user-settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
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
        <h1>User settings</h1>
      </header>
      <mat-card class="settings-card">
        <mat-card-content>
          <form [formGroup]="settingsForm" (ngSubmit)="save()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Select Championship</mat-label>
              <mat-select formControlName="championship_id">
                <mat-option *ngFor="let champ of championships" [value]="champ.id">
                  {{ champ.description }} ({{ champ.year }})
                </mat-option>
              </mat-select>
            </mat-form-field>

          </form>
          <p *ngIf="successMessage" class="success-message">{{ successMessage }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="settingsForm.invalid || loading">Save</button>
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
    .form-group {
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
    }
    .success-message {
      color: green;
      margin-top: 10px;
      font-weight: bold;
    }
    mat-card-header.mat-mdc-card-header {
        padding-bottom: 20px;
    }
  `],
})
export class SettingsComponent implements OnInit {
  championships: Championship[] = [];
  settingsForm: FormGroup;
  loading = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private championshipService: ChampionshipService,
    private userSettingsService: UserSettingsService,
    private router: Router
  ) {
    this.settingsForm = this.fb.group({
      championship_id: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadChampionships();
    this.loadUserSettings();
  }

  /** Fetch available championships */
  loadChampionships(): void {
    this.championshipService.getChampionships().subscribe({
      next: (data: Championship[]) => {
        this.championships = data;
      },
      error: (err) => console.error('Error fetching championships', err),
    });
  }

  /** Fetch user settings */
  loadUserSettings(): void {
    this.userSettingsService.getUserSettings().subscribe({
      next: (userSettings) => {
        if (userSettings?.championship_id) {
          this.settingsForm.patchValue({ championship_id: userSettings.championship_id });
        }
      },
      error: (err) => console.error('Error fetching user settings', err),
    });
  }

  /** Save settings */
  save(): void {
    if (this.settingsForm.invalid) return;

    this.loading = true;
    this.successMessage = '';

    const championshipId = this.settingsForm.value.championship_id;
    this.championshipService.selectedChampionshipId = championshipId;

    this.userSettingsService.updateUserSettings(championshipId).subscribe({
      next: () => {
        this.successMessage = 'Settings updated successfully!';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error updating settings:', err);
        this.loading = false;
      },
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
