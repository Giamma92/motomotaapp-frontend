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
import { NavigationService } from '../../services/navigation.service';


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
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'resetPassword.title' | t }}</h1>
      </header>

      <main class="reset-main">
        <section class="reset-panel">
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
        </section>
      </main>
    </div>
  `,
  styles: [`
    .reset-container {
      min-height: 100vh;
      // Theme-aware backdrop: the old hardcoded white gradient clashed with
      // the dark app background
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.16), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(200, 16, 46, 0.06), transparent 34%),
        var(--background-dark, #0e1015);
      color: var(--text-primary, #ffffff);
    }

    /* Header: canonical styles live in styles/_layout.scss */

    .reset-main {
      width: min(100%, 560px);
      margin: 0 auto;
      padding: var(--content-offset-top) 10px 12px;
    }

    .reset-panel {
      width: 100%;
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: 14px;
      background: var(--surface-card, #1e2128);
      box-shadow: var(--shadow-card, 0 2px 12px rgba(0, 0, 0, 0.2));
      padding: 10px;
    }

    .reset-form {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .full-width {
      width: 100%;
    }

    .save-button {
      width: 100%;
      min-height: 44px;
      font-weight: 700;
      margin-top: 6px;
    }

    .error-message {
      background: rgba(200, 16, 46, 0.1);
      color: #ff6b81;
      padding: .72rem;
      border-radius: 8px;
      margin: 4px 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid rgba(200, 16, 46, 0.45);
      font-size: .86rem;
    }

    @media (max-width: 600px) {
      .reset-main {
        padding: var(--content-offset-top) 8px 10px;
      }

      .reset-panel {
        padding: 8px;
      }
    }
  `]
})
export class ResetPasswordComponent {
  resetForm: FormGroup;
  loading: boolean = false;
  errorMessage: string | null = null;
  showPassword: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private navService: NavigationService
  ) {
    this.resetForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  goBack(): void {
    this.navService.back('/');
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


