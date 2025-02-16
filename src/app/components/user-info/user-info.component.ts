// src/app/user-info/user-info.component.ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="profile-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>User profile</h1>
      </header>
      <main class="profile-main">
        <mat-card *ngIf="userInfo; else notLoggedIn" class="profile-card">
          <div class="profile-image-container" *ngIf="userInfo.profile_image">
            <img [src]="userInfo.profile_image" alt="Profile Image">
          </div>
          <mat-card-header>
            <mat-card-title>{{ userInfo.first_name }} {{ userInfo.last_name }}</mat-card-title>
            <mat-card-subtitle>{{ userInfo.id }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="profile-details">
              <p><strong>User ID:</strong> {{ userInfo.profile_id }}</p>
              <p><strong>Email:</strong> {{ userInfo.email }}</p>
              <p><strong>Last Access:</strong> {{ userInfo.last_access | date:'short' }}</p>
              <p><strong>First Change:</strong> {{ userInfo.first_change | date:'short' }}</p>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="logout()">Logout</button>
          </mat-card-actions>
        </mat-card>
        <ng-template #notLoggedIn>
          <mat-card class="profile-card">
            <mat-card-title>No User Info Available</mat-card-title>
            <mat-card-content>
              <p>You are not logged in.</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="accent" (click)="goToLogin()">Login</button>
            </mat-card-actions>
          </mat-card>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    /* Overall container with a vibrant gradient background */
    .profile-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff;
    }
    /* Main content area: center the profile card */
    .profile-main {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    /* Profile card styling */
    .profile-card {
      width: 100%;
      max-width: 400px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 8px;
      border: 2px solid #d32f2f;
      padding: 20px;
      box-shadow: none;
    }
    /* Profile image styling */
    .profile-image-container {
      text-align: center;
      margin-bottom: 16px;
    }
    .profile-image-container img {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      border: 2px solid #d32f2f;
      object-fit: cover;
    }
    mat-card-header {
      text-align: center;
    }
    mat-card-subtitle {
      font-size: 14px;
      color: #555;
    }
    .profile-details p {
      margin: 8px 0;
      font-size: 14px;
    }
  `]
})
export class UserInfoComponent implements OnInit {
  userInfo: UserInfo | null = null;
  @ViewChild('notLoggedIn', { static: true }) notLoggedIn!: TemplateRef<any>;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.authService.getUserInfo().subscribe({
      next: (data: UserInfo) => this.userInfo = data,
      error: (err) => {
        console.error('Error fetching user info:', err);
        this.userInfo = null;
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
