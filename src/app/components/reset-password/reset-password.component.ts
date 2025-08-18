import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';


@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
  ],
  template: `
    <div class="reset-container">
      <mat-card class="reset-card">
        <mat-card-header class="card-header">
          <mat-card-title>{{ 'resetPassword.title' | t }}</mat-card-title>
        </mat-card-header>

        <form class="reset-form" [formGroup]="resetForm" (ngSubmit)="onSave()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'resetPassword.newPassword' | t }}</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" required>
            <button mat-icon-button matSuffix type="button" (click)="toggleShowPassword()" [attr.aria-label]="showPassword ? ('resetPassword.hide' | t) : ('resetPassword.show' | t)">
              <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'resetPassword.confirmPassword' | t }}</mat-label>
            <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="confirmPassword" required>
            <mat-icon matPrefix>lock</mat-icon>
          </mat-form-field>

          <div *ngIf="errorMessage" class="error-message">
            <mat-icon>error</mat-icon>
            {{ errorMessage }}
          </div>

          <button mat-raised-button color="primary" class="save-button" type="submit" [disabled]="resetForm.invalid || loading">
            {{ 'resetPassword.save' | t }}
          </button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .reset-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-red));
    }

    .reset-card {
      width: 100%;
      max-width: 440px;
      padding: 2rem;
      margin: 1rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);

      .card-header {
        background: transparent;
        padding: 0;
        margin-bottom: 1rem;
      }

      .reset-form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0px 10px;
      }

      .save-button {
        width: 100%;
        padding: 1rem;
        font-size: 1.1rem;
        margin-top: 1rem;
      }

      .error-message {
        background: #ffecec;
        color: var(--accent-red);
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 10px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid var(--accent-red);
      }
    }
  `]
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  loading: boolean = false;
  errorMessage: string | null = null;
  showPassword: boolean = false;

  constructor(private formBuilder: FormBuilder, private authService: AuthService, private router: Router) {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSave(): void {
    if (this.resetForm.invalid) return;

    const password: string = this.resetForm.value.password;
    const confirmPassword: string = this.resetForm.value.confirmPassword;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.errorMessage = null;

    const hashedPassword = CryptoJS.SHA256(password).toString();

    this.authService.resetPassword(hashedPassword).subscribe({
      next: () => {
        this.loading = false;
        this.authService.logout();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to reset password. Please try again.';
      }
    });
  }
}


