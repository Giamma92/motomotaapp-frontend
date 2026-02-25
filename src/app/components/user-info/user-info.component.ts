// src/app/user-info/user-info.component.ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, TranslatePipe],
  template: `
    <div class="profile-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'profile.title' | t }}</h1>
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
              <p><strong>{{ 'profile.userId' | t }}</strong> {{ userInfo.profile_id }}</p>
              <p><strong>{{ 'profile.email' | t }}</strong> {{ userInfo.email }}</p>
              <p><strong>{{ 'profile.lastAccess' | t }}</strong> {{ userInfo.last_access | date:'short' }}</p>
            </div>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" (click)="logout()">{{ 'common.logout' | t }}</button>
          </mat-card-actions>
        </mat-card>
        <ng-template #notLoggedIn>
          <mat-card class="profile-card">
            <mat-card-title>{{ 'profile.noInfoTitle' | t }}</mat-card-title>
            <mat-card-content>
              <p>{{ 'profile.noInfoDesc' | t }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-raised-button color="accent" (click)="goToLogin()">{{ 'common.login' | t }}</button>
            </mat-card-actions>
          </mat-card>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    .profile-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      color: #fff;
      padding: 0 10px 14px;
    }

    .profile-main {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      width: min(100%, 680px);
      margin: 0 auto;
      padding: calc(var(--app-header-height) + 14px) 0 10px;
    }

    .profile-card {
      width: 100%;
      max-width: 460px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      border-radius: 16px;
      border: 1px solid rgba(211, 47, 47, 0.22);
      padding: 0.9rem;
      box-shadow: 0 10px 28px rgba(0,0,0,0.22);
    }

    .profile-image-container {
      text-align: center;
      margin-bottom: 12px;
    }

    .profile-image-container img {
      width: 108px;
      height: 108px;
      border-radius: 50%;
      border: 3px solid #d32f2f;
      object-fit: cover;
      box-shadow: 0 6px 14px rgba(0,0,0,0.14);
    }

    mat-card-header {
      text-align: center;
      justify-content: center;
      padding: 6px 8px;
    }

    mat-card-title {
      font-size: 1.24rem;
      color: var(--primary-color);
      line-height: 1.2;
    }

    mat-card-subtitle {
      font-size: 0.8rem;
      color: #555;
      word-break: break-all;
    }

    mat-card-content {
      padding: 0.4rem 0.65rem 0.2rem;
    }

    .profile-details p {
      margin: 9px 0;
      font-size: 0.92rem;
      line-height: 1.35;
      color: #303030;
      display: grid;
      gap: 2px;
    }

    .profile-details strong {
      color: #616161;
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    mat-card-actions {
      padding: 0.6rem 0.65rem 0.8rem;
      display: flex;
      justify-content: flex-end;
    }

    mat-card-actions button {
      min-height: 44px;
      min-width: 120px;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .profile-container {
        padding: 0 6px 10px;
      }

      .profile-main {
        padding-top: calc(var(--app-header-height) + 10px);
      }

      .profile-card {
        padding: 0.6rem;
      }

      mat-card-actions {
        justify-content: stretch;

        button {
          width: 100%;
        }
      }
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
