import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
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
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSelectModule,
    TranslatePipe
  ],
  template: `
    <div class="login-container">
      <section class="login-shell">
        <div class="hero-panel">
          <div class="hero-kicker">Fanta Moto GP</div>
          <div class="hero-brand">
            <img src="assets/images/motomotaGPLogo512x512.png" alt="Moto Mota logo">
            <h1 class="hero-title">Moto Mota</h1>
          </div>
          <p class="hero-subtitle">
            <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
            <span>Fantasy MotoGP, semplice e veloce.</span>
          </p>
          <div class="hero-divider" aria-hidden="true">
            <span class="hero-divider-mark"></span>
            <span class="hero-divider-track"></span>
          </div>
        </div>

        <div class="login-panel">
          <header class="login-header">
            <div class="header-content">
              <h2 class="app-title">{{ 'login.signIn' | t }}</h2>
            </div>
          </header>

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
              <mat-spinner *ngIf="loading" diameter="22"></mat-spinner>
            </button>
          </form>

          <div *ngIf="errorMessage" class="error-message">
            <mat-icon>error</mat-icon>
            {{ errorMessage }}
          </div>
        </div>
      </section>
      <div class="login-powered">powered by Gianmarco Moretti</div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #0b0b0d 0%, #2a0e14 40%, #7d1024 76%, #c8102e 100%);
      padding: clamp(12px, 2.6vw, 20px);
      overflow: hidden;
    }

    .login-container::before {
      content: '';
      position: absolute;
      inset: 0;
      transform: rotate(-8deg) scale(1.3);
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.88) 0 25%,
        rgba(0, 0, 0, 0.9) 25% 50%,
        rgba(255, 255, 255, 0.88) 50% 75%,
        rgba(0, 0, 0, 0.9) 75% 100%
      );
      background-size: 34px 34px;
      opacity: 0.12;
      pointer-events: none;
      z-index: 0;
    }

    .login-container::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 22% 18%, rgba(255, 255, 255, 0.14), transparent 35%),
        linear-gradient(180deg, rgba(0, 0, 0, 0.32), rgba(0, 0, 0, 0.28));
      pointer-events: none;
      z-index: 0;
    }

    .login-shell {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 900px;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 12px;
      padding: 0;
      margin: auto 0;
      border-radius: 0;
      box-shadow: none;
      overflow: hidden;
      border: 0;
      background: transparent;
    }

    .login-powered {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      font-size: 0.68rem;
      letter-spacing: 0.2px;
      color: rgba(255, 255, 255, 0.75);
      text-transform: none;
      white-space: nowrap;
      pointer-events: none;
    }

    .hero-panel {
      min-height: 100%;
      background: rgba(10, 10, 12, 0.58);
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 16px;
      padding: clamp(1rem, 2.8vw, 2rem);
      color: #fff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.7rem;
      position: relative;
      overflow: hidden;
    }

    .hero-kicker {
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      color: #ff8ca0;
    }

    .hero-title {
      margin: 0;
      font-family: 'MotoGP Bold', sans-serif;
      text-transform: uppercase;
      line-height: 0.95;
      font-size: clamp(1.6rem, 4.2vw, 2.7rem);
      letter-spacing: 0.8px;
    }

    .hero-brand {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
    }

    .hero-brand img {
      width: clamp(36px, 5vw, 52px);
      height: clamp(36px, 5vw, 52px);
      border-radius: 10px;
      object-fit: cover;
      flex: 0 0 auto;
    }

    .hero-subtitle {
      margin: 0;
      color: rgba(255, 255, 255, 0.88);
      font-size: 0.92rem;
      line-height: 1.35;
      max-width: 36ch;
      display: inline-flex;
      align-items: center;
      gap: 0.42rem;
    }

    .hero-subtitle mat-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      color: #ff8ca0;
      flex: 0 0 auto;
    }

    .hero-divider {
      margin-top: 0.45rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .hero-divider-mark {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      background: linear-gradient(135deg, #ffffff 0%, #ffffff 45%, #c8102e 45%, #c8102e 100%);
      transform: skewX(-16deg);
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.15);
    }

    .hero-divider-track {
      width: clamp(130px, 24vw, 210px);
      height: 5px;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.95) 0%,
        rgba(255, 255, 255, 0.95) 24%,
        rgba(200, 16, 46, 1) 24%,
        rgba(200, 16, 46, 1) 58%,
        rgba(17, 17, 17, 0.95) 58%,
        rgba(17, 17, 17, 0.95) 100%
      );
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16);
    }

    .login-header {
      padding: 0;
      margin-bottom: 0.85rem;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      gap: 0.62rem;

      .header-content {
        text-align: left;
        color: #111;

        .app-title {
          margin: 0 0 0.15rem;
          font-family: 'MotoGP Bold', sans-serif;
          color: #111214;
          font-size: clamp(1.12rem, 3vw, 1.3rem);
          letter-spacing: 0.4px;
          line-height: 1;
          text-transform: uppercase;
          transform: none;
          text-shadow: none;
        }

      }
    }

    .login-panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.52);
      border-radius: 12px;
      padding: 0.58rem 0.68rem 0.68rem;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.18);
      backdrop-filter: none;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 7px;
      padding: 0;
    }

    .mat-form-field {
      margin: 0.14rem 0;

      .mat-icon {
        color: var(--accent-red);
        margin-right: 0.35rem;
      }
    }

    ::ng-deep .login-form .mat-mdc-text-field-wrapper {
      background: #ffffff;
    }

    ::ng-deep .login-form .mdc-notched-outline__leading,
    ::ng-deep .login-form .mdc-notched-outline__notch,
    ::ng-deep .login-form .mdc-notched-outline__trailing {
      border-color: rgba(0, 0, 0, 0.18) !important;
    }

    ::ng-deep .login-form .mat-mdc-form-field.mat-focused .mdc-notched-outline__leading,
    ::ng-deep .login-form .mat-mdc-form-field.mat-focused .mdc-notched-outline__notch,
    ::ng-deep .login-form .mat-mdc-form-field.mat-focused .mdc-notched-outline__trailing {
      border-color: var(--primary-color) !important;
      border-width: 2px !important;
    }

    .login-button {
      width: 100%;
      min-height: 42px;
      font-size: 0.92rem;
      margin-top: 0.32rem;
      transition: all 0.3s ease;
      border-radius: 9px;
      font-weight: 700;
      letter-spacing: 0.2px;
      background: linear-gradient(135deg, #c8102e, #960920) !important;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 18px rgba(200, 16, 46, 0.32);
      }
    }

    .error-message {
      background: #ffecec;
      color: var(--accent-red);
      padding: 0.62rem;
      border-radius: 8px;
      margin: 0.56rem 0 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border: 1px solid var(--accent-red);
    }

    @media (max-width: 480px) {
      .login-container {
        padding: 10px 8px;
      }

      .login-shell {
        padding: 0;
        margin: 0;
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .login-panel {
        padding: 0.55rem 0.58rem 0.62rem;
      }

      .hero-panel {
        padding: 0.85rem 0.9rem;
      }

      .hero-title {
        font-size: 1.55rem;
      }

      .hero-divider-track {
        width: 150px;
      }

      .login-header {
        padding: 0;
      }

      .login-header .header-content .app-title {
        font-size: 1.05rem;
      }

    }

    @media (max-width: 900px) {
      .login-shell {
        grid-template-columns: 1fr;
        max-width: 560px;
      }

      .hero-panel {
        min-height: auto;
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
