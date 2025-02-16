// src/app/lineups/lineups.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-lineups',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatInputModule],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Place Lineup</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="lineupsForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Race Rider ID</mat-label>
              <input matInput type="number" formControlName="race_rider_id" required>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Qualifying Rider ID</mat-label>
              <input matInput type="number" formControlName="qualifying_rider_id" required>
            </mat-form-field>
            <!-- Additional fields can be added here -->
            <button mat-raised-button color="primary" class="full-width-button" type="submit" [disabled]="lineupsForm.invalid || loading">
              Submit Lineup
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      padding: 20px;
    }
    .form-card {
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }
    .full-width {
      width: 100%;
    }
    .full-width-button {
      width: 100%;
      margin-top: 20px;
    }
  `]
})
export class LineupsComponent implements OnInit {
  lineupsForm: FormGroup;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.lineupsForm = this.fb.group({
      // In a real scenario, championship_id, race_id, and user_id might be auto‐populated.
      race_rider_id: ['', Validators.required],
      qualifying_rider_id: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.lineupsForm.valid) {
      this.loading = true;
      const payload = { ...this.lineupsForm.value };
      // Replace with actual HTTP POST call, e.g.:
      // this.http.post(`${apiUrl}/lineups`, payload).subscribe(...)
      setTimeout(() => {
        this.loading = false;
        alert('Lineup submitted successfully!');
        this.router.navigate(['/']);
      }, 1000);
    }
  }
}
