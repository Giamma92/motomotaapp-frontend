import { Component, ViewEncapsulation } from '@angular/core';
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
  styleUrl: './login.component.scss'
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
