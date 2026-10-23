import { Component, ViewEncapsulation, inject, OnInit, OnDestroy } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
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
import { UserSettingsService } from '../../services/user-settings.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
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

          <div class="live-season-badge">
            <span class="live-pulse-dot"></span>
            <span>{{ 'login.seasonBadge' | t }}</span>
          </div>

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
            <span>{{ 'login.tagline' | t }}</span>
          </p>

          <ul class="hero-chips">
            <li>
              <span class="chip-icon-box">
                <i class="fa-solid fa-trophy" aria-hidden="true"></i>
              </span>
              <span>{{ 'login.chips.standings' | t }}</span>
            </li>
            <li>
              <span class="chip-icon-box">
                <i class="fa-solid fa-users" aria-hidden="true"></i>
              </span>
              <span>{{ 'login.chips.lineups' | t }}</span>
            </li>
            <li>
              <span class="chip-icon-box">
                <i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>
              </span>
              <span>{{ 'login.chips.results' | t }}</span>
            </li>
          </ul>

          <div class="hero-divider" aria-hidden="true">
            <span class="hero-divider-mark"></span>
            <span class="hero-divider-track"></span>
          </div>
        </div>

        <div class="login-panel">
          <header class="login-header">
            <div class="login-title-group">
              <span class="login-kicker">{{ 'login.kicker' | t }}</span>
              <h2 class="app-title">{{ 'login.signIn' | t }}</h2>
            </div>

            <div class="login-header-actions">
              <!-- Compact language picker pill -->
              <div class="login-lang-pill" [title]="'login.selectLanguage' | t">
                <i class="fa-solid fa-globe lang-icon" aria-hidden="true"></i>
                <select
                  [(ngModel)]="currentLang"
                  (ngModelChange)="onLanguageChange($event)"
                  class="login-lang-select"
                  [attr.aria-label]="'login.language' | t">
                  <option *ngFor="let l of languages" [value]="l.code">{{ l.code.toUpperCase() }}</option>
                </select>
              </div>

              <!-- Theme switch button -->
              <button type="button"
                      class="login-theme-btn"
                      (click)="theme.toggle()"
                      [title]="theme.mode() === 'dark' ? ('common.theme.toLight' | t) : ('common.theme.toDark' | t)"
                      [attr.aria-label]="theme.mode() === 'dark' ? ('common.theme.toLight' | t) : ('common.theme.toDark' | t)">
                <mat-icon>{{ theme.mode() === 'dark' ? 'light_mode' : 'dark_mode' }}</mat-icon>
              </button>
            </div>
          </header>

          <form class="login-form" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <!-- Username Input -->
            <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
              <mat-label>{{ 'login.username' | t }}</mat-label>
              <input matInput formControlName="username" autocomplete="username" required>
              <mat-icon matPrefix>person</mat-icon>
            </mat-form-field>

            <!-- Password Input with Show/Hide Toggle -->
            <mat-form-field appearance="outline" class="full-width" subscriptSizing="dynamic">
              <mat-label>{{ 'login.password' | t }}</mat-label>
              <input
                matInput
                [type]="showPassword ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
                required>
              <mat-icon matPrefix>lock</mat-icon>
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="toggleShowPassword()"
                class="password-eye-btn"
                [attr.aria-label]="showPassword ? ('login.hidePassword' | t) : ('login.showPassword' | t)"
                [title]="showPassword ? ('login.hidePassword' | t) : ('login.showPassword' | t)">
                <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
            </mat-form-field>

            <!-- Ricordami Options Row -->
            <div class="login-options-row">
              <label class="remember-me-toggle">
                <input type="checkbox" [(ngModel)]="rememberMe" [ngModelOptions]="{standalone: true}">
                <span class="remember-label">{{ 'login.rememberUsername' | t }}</span>
              </label>
            </div>

            <!-- Submit Button with racing arrow -->
            <button mat-raised-button color="primary" class="login-button" type="submit"
                    [disabled]="loginForm.invalid || loading">
              <span *ngIf="!loading" class="login-button-inner">
                <span>{{ 'login.signIn' | t }}</span>
                <i class="fa-solid fa-arrow-right-to-bracket login-button-icon"></i>
              </span>
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
export class LoginComponent implements OnInit, OnDestroy {
  public theme = inject(ThemeService);
  loginForm: FormGroup;
  errorMessage: string | null = null;
  loading: boolean = false;
  showPassword: boolean = false;
  rememberMe: boolean = true;
  languages = [
    { code: 'it', label: 'Italiano' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];
  currentLang: string = 'it';
  langManuallyChanged: boolean = false;
  private langSub?: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private i18n: I18nService,
    private userSettingsService: UserSettingsService
  ) {
    const savedUser = localStorage.getItem('motomota_remembered_user') || '';
    this.loginForm = this.fb.group({
      username: [savedUser, Validators.required],
      password: ['', Validators.required],
    });
    this.rememberMe = !!savedUser;
    this.currentLang = this.i18n.currentLanguage || 'it';
  }

  ngOnInit(): void {
    this.currentLang = this.i18n.currentLanguage || 'it';
    this.langSub = this.i18n.language$.subscribe((lang) => {
      this.currentLang = lang;
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      let { username, password } = this.loginForm.value;

      if (this.rememberMe) {
        localStorage.setItem('motomota_remembered_user', username);
      } else {
        localStorage.removeItem('motomota_remembered_user');
      }

      // 🔹 Hash the password using SHA-256
      const hashedPassword = CryptoJS.SHA256(password).toString();

      this.authService.login(username, hashedPassword).subscribe({
        next: (res) => {
          this.authService.setToken(res.token);

          // If language was explicitly selected on the login page, save it to user_settings
          if (this.langManuallyChanged) {
            this.userSettingsService.updateUserSettings(undefined, this.currentLang).subscribe({ error: () => {} });
          } else if (res.language) {
            // Apply language preference stored in DB
            if (res.language !== this.i18n.currentLanguage) {
              this.i18n.setLanguage(res.language).subscribe();
            }
          } else {
            // No preference saved yet in DB: persist current active language
            this.userSettingsService.updateUserSettings(undefined, this.currentLang).subscribe({ error: () => {} });
          }

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
          });
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
    this.langManuallyChanged = true;
    this.i18n.setLanguage(code).subscribe();
  }
}
