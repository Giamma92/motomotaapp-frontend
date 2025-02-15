import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as CryptoJS from 'crypto-js';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header class="card-header">
          <mat-card-title>
            <img src="assets/images/motomotaGPLogo512x512.png" alt="MotoMota Logo">
            <div class="header-content">
              Welcome to Fanta MotoGP
              <div class="subtitle">Manage your championship</div>
            </div>
          </mat-card-title>
        </mat-card-header>

        <form class="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" required>
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" required>
            <mat-icon matPrefix>lock</mat-icon>
          </mat-form-field>

          <button mat-raised-button color="primary" class="login-button" type="submit"
                  [disabled]="loginForm.invalid || loading">
            <span *ngIf="!loading">Sign In</span>
            <mat-spinner *ngIf="loading" diameter="24"></mat-spinner>
          </button>
        </form>

        <div *ngIf="errorMessage" class="error-message">
          <mat-icon>error</mat-icon>
          {{ errorMessage }}
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--accent-red));
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 2.5rem;
      margin: 1rem;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      overflow: hidden;

      .login-form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0px 10px;
      }

      .card-header {
        background: transparent;
        padding: 0;
        margin-bottom: 2rem;
        justify-content: center;

        mat-card-title {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;

          img {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .header-content {
            text-align: center;
            font-family: 'MotoGP Bold', sans-serif;
            color: var(--primary-color);
            font-size: 1.5rem;

            .subtitle {
              font-family: 'Roboto', sans-serif;
              font-size: 1rem;
              color: #666;
              margin-top: 0.5rem;
            }
          }
        }
      }

      .mat-form-field {
        margin: 1.5rem 0;

        .mat-icon {
          color: var(--accent-red);
          margin-right: 0.5rem;
        }
      }

      .login-button {
        width: 100%;
        padding: 1rem;
        font-size: 1.1rem;
        margin-top: 1rem;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--primary-color), 0.3);
        }
      }

      .error-message {
        background: #ffecec;
        color: var(--accent-red);
        padding: 1rem;
        border-radius: 8px;
        margin: 1.5rem 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border: 1px solid var(--accent-red);
      }

      .footer-links {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;

        a {
          color: var(--primary-color);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;

          &:hover {
            color: var(--accent-red);
          }
        }
      }
    }

    @media (max-width: 480px) {
      .login-card {
        padding: 1.5rem;

        .card-header mat-card-title .header-content {
          font-size: 1.3rem;
        }

        .footer-links {
          flex-direction: column;
          gap: 1rem;
          text-align: center;
        }
      }
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading: boolean = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      let { username, password } = this.loginForm.value;

      // 🔹 Hash the password using SHA-256
      const hashedPassword = CryptoJS.SHA256(password).toString();

      this.authService.login(username, hashedPassword).subscribe({
        next: (res) => {
          this.loading = false;
          this.authService.setToken(res.token);
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          console.error('Login error:', err);
          this.errorMessage = 'Invalid username or password';
        },
      });
    }
  }
}
