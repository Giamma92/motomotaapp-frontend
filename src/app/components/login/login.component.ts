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
import { MatSelectModule } from '@angular/material/select';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
    MatIconModule,
    MatSelectModule,
    TranslatePipe
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header class="card-header">
          <mat-card-title>
            <img src="assets/images/motomotaGPLogo512x512.png" alt="MotoMota Logo">
            <div class="header-content">
              {{ 'login.title' | t }}
              <div class="subtitle">{{ 'login.subtitle' | t }}</div>
            </div>
          </mat-card-title>
        </mat-card-header>

        <form class="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'login.language' | t }}</mat-label>
            <mat-select [value]="currentLang" (selectionChange)="onLanguageChange($event.value)">
              <mat-option *ngFor="let l of languages" [value]="l.code">
                {{ l.label }}
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>language</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'login.username' | t }}</mat-label>
            <input matInput formControlName="username" required>
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ 'login.password' | t }}</mat-label>
            <input matInput type="password" formControlName="password" required>
            <mat-icon matPrefix>lock</mat-icon>
          </mat-form-field>

          <button mat-raised-button color="primary" class="login-button" type="submit"
                  [disabled]="loginForm.invalid || loading">
            <span *ngIf="!loading">{{ 'login.signIn' | t }}</span>
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
      padding: 16px;
    }

    .login-card {
      width: 100%;
      max-width: 460px;
      padding: clamp(1.2rem, 3.8vw, 2.25rem);
      margin: 0;
      border-radius: 18px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.24);
      overflow: hidden;
      border: 1px solid rgba(74, 20, 140, 0.12);

      .login-form {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 8px;
        padding: 0 4px;
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
          gap: 1rem;

          img {
            width: 88px;
            height: 88px;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .header-content {
            text-align: center;
            font-family: 'MotoGP Bold', sans-serif;
            color: var(--primary-color);
            font-size: clamp(1.25rem, 4.8vw, 1.55rem);

            .subtitle {
              font-family: 'Roboto', sans-serif;
              font-size: 0.95rem;
              color: #666;
              margin-top: 0.35rem;
            }
          }
        }
      }

      .mat-form-field {
        margin: 0.4rem 0;

        .mat-icon {
          color: var(--accent-red);
          margin-right: 0.5rem;
        }
      }

      .login-button {
        width: 100%;
        min-height: 46px;
        font-size: 1rem;
        margin-top: 0.5rem;
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(var(--primary-color), 0.3);
        }
      }

      .error-message {
        background: #ffecec;
        color: var(--accent-red);
        padding: 0.85rem;
        border-radius: 8px;
        margin: 0.9rem 4px 0;
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
      .login-container {
        padding: 10px;
      }

      .login-card {
        padding: 1rem;

        .card-header mat-card-title .header-content {
          font-size: 1.15rem;
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
  languages = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];
  currentLang: string = 'en';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private i18n: I18nService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
    this.currentLang = localStorage.getItem('lang') || this.i18n.currentLanguage || 'en';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      let { username, password } = this.loginForm.value;

      // 🔹 Hash the password using SHA-256
      const hashedPassword = CryptoJS.SHA256(password).toString();

      this.authService.login(username, hashedPassword).subscribe({
        next: (res) => {
          this.authService.setToken(res.token);
          this.authService.getUserInfo().subscribe({
            next: (user) => {
              this.loading = false;
              if (user?.pwd_reset === 1) {
                this.router.navigate(['/reset-password']);
              } else {
                this.router.navigate(['/']);
              }
            },
            error: () => {
              this.loading = false;
              this.router.navigate(['/']);
            }
          })
        },
        error: (err) => {
          this.loading = false;
          console.error('Login error:', err);
          this.errorMessage = this.i18n.translate('login.invalid');
        },
      });
    }
  }

  onLanguageChange(code: string) {
    this.currentLang = code;
    this.i18n.setLanguage(code).subscribe();
  }
}
