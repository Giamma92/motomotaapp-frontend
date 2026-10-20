import { Component, ViewEncapsulation, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
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
  encapsulation: ViewEncapsulation.None,
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
      <div class="login-speed" aria-hidden="true"></div>

      <section class="login-shell">
        <div class="hero-panel">
          <span class="hero-checker" aria-hidden="true"></span>
          <span class="hero-ghost" aria-hidden="true">GP</span>

          <span class="hero-kicker"><span class="hero-kicker-inner">Fanta Moto GP</span></span>

          <div class="hero-brand">
            <svg class="hero-logo" viewBox="0 0 100 100" role="img" aria-label="Moto Mota logo">
              <defs>
                <linearGradient id="mm-ring" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stop-color="#e8153a" />
                  <stop offset="0.55" stop-color="#c8102e" />
                  <stop offset="1" stop-color="#8f0b1e" />
                </linearGradient>
                <radialGradient id="mm-disc" cx="0.35" cy="0.28" r="0.95">
                  <stop offset="0" stop-color="#ffffff" />
                  <stop offset="0.7" stop-color="#f4f5f7" />
                  <stop offset="1" stop-color="#dee1e6" />
                </radialGradient>
                <pattern id="mm-check" width="9" height="9" patternUnits="userSpaceOnUse">
                  <rect width="9" height="9" fill="#141414" />
                  <rect width="4.5" height="4.5" fill="#ffffff" />
                  <rect x="4.5" y="4.5" width="4.5" height="4.5" fill="#ffffff" />
                </pattern>
                <clipPath id="mm-disc-clip">
                  <circle cx="50" cy="50" r="43" />
                </clipPath>
              </defs>

              <circle cx="50" cy="50" r="47.5" fill="url(#mm-ring)" />
              <circle cx="50" cy="50" r="43" fill="url(#mm-disc)" />

              <g clip-path="url(#mm-disc-clip)">
                <rect x="0" y="73.5" width="100" height="2.5" fill="#c8102e" />
                <rect x="0" y="76" width="100" height="40" fill="url(#mm-check)" />
              </g>

              <g font-family="'MotoGP Bold', 'Arial Black', sans-serif" font-weight="700" font-size="20"
                 text-anchor="middle">
                <text x="50" y="39" textLength="60" lengthAdjust="spacingAndGlyphs" fill="#d5102d"
                      transform="translate(0,39) skewX(-8) translate(0,-39)">MOTO</text>
                <text x="50" y="60" textLength="60" lengthAdjust="spacingAndGlyphs" fill="#141414"
                      transform="translate(0,60) skewX(-8) translate(0,-60)">MOTA</text>
              </g>
            </svg>
            <h1 class="hero-title">Moto Mota</h1>
          </div>

          <p class="hero-subtitle">
            <mat-icon aria-hidden="true">sports_motorsports</mat-icon>
            <span>Fantasy MotoGP, semplice e veloce.</span>
          </p>

          <ul class="hero-chips">
            <li><mat-icon aria-hidden="true">leaderboard</mat-icon>Classifiche</li>
            <li><mat-icon aria-hidden="true">groups</mat-icon>Schieramenti</li>
            <li><mat-icon aria-hidden="true">flag</mat-icon>Risultati</li>
          </ul>

          <div class="hero-divider" aria-hidden="true">
            <span class="hero-divider-mark"></span>
            <span class="hero-divider-track"></span>
          </div>
        </div>

        <div class="login-panel">
          <header class="login-header">
            <div class="login-title-group">
              <span class="login-kicker">Area piloti</span>
              <h2 class="app-title">{{ 'login.signIn' | t }}</h2>
            </div>
            <button type="button"
                    class="login-theme-btn"
                    (click)="theme.toggle()"
                    [title]="theme.mode() === 'dark' ? 'Passa al tema chiaro' : 'Passa al tema scuro'"
                    aria-label="Cambia tema">
              <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>
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
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  public theme = inject(ThemeService);
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
