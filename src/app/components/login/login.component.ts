import { Component } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatInputModule, MatButtonModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <div class="logo-container">
          <img src="assets/motogp-logo.png" alt="MotoGP Logo">
        </div>
        <h2>Fanta MotoGP Login</h2>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username" required>
          </mat-form-field>
          <mat-form-field appearance="fill" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" required>
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid">
            Login
          </button>
        </form>
        <div *ngIf="errorMessage" class="error-message">
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
      //background: url('assets/motogp-bg.jpg') no-repeat center center/cover;
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    .logo-container {
      text-align: center;
      margin-bottom: 16px;
    }
    .logo-container img {
      width: 100px;
      height: auto;
    }
    h2 {
      text-align: center;
      color: #d32f2f; /* A MotoGP-themed red */
      margin-bottom: 16px;
    }
    .full-width {
      width: 100%;
    }
    .error-message {
      color: red;
      text-align: center;
      margin-top: 12px;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      this.authService.login(username, password).subscribe({
        next: (res) => {
          // Save the token (e.g., in localStorage)
          this.authService.setToken(res.token);
          // Navigate to the dashboard after successful login
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Login error:', err);
          this.errorMessage = 'Invalid username or password';
        }
      });
    }
  }
}
