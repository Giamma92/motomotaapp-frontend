// src/app/race-bet/race-bet.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-race-bet',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatInputModule],
  template: `
    <div class="form-container">
      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Place Race Bet</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="raceBetForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Rider ID</mat-label>
              <input matInput type="number" formControlName="rider_id" required>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Position</mat-label>
              <input matInput type="number" formControlName="position" required>
            </mat-form-field>
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>Points</mat-label>
              <input matInput type="number" formControlName="points" required>
            </mat-form-field>
            <button mat-raised-button color="primary" class="full-width-button" type="submit" [disabled]="raceBetForm.invalid || loading">
              Submit Race Bet
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
      background: linear-gradient(135deg, #4a148c, #d81b60);
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
export class RaceBetComponent implements OnInit {
  raceBetForm: FormGroup;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.raceBetForm = this.fb.group({
      rider_id: ['', Validators.required],
      position: ['', Validators.required],
      points: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.raceBetForm.valid) {
      this.loading = true;
      const payload = { ...this.raceBetForm.value };
      // Replace with your HTTP POST call.
      setTimeout(() => {
        this.loading = false;
        alert('Race Bet submitted successfully!');
        this.router.navigate(['/']);
      }, 1000);
    }
  }
}
