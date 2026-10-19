// src/app/user-info/user-info.component.ts
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserInfo } from '../../services/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LocalizedDatePipe } from '../../pipes/localized-date.pipe';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, TranslatePipe, LocalizedDatePipe],
  template: `
    <div class="profile-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'profile.title' | t }}</h1>
      </header>
      <main class="profile-main">
        <section *ngIf="userInfo; else notLoggedIn" class="profile-panel">
          <div class="profile-top">
            <div class="profile-image-container" *ngIf="userInfo.profile_image">
              <img [src]="userInfo.profile_image" alt="Profile Image">
            </div>
            <div class="profile-identity">
              <h2>{{ userInfo.first_name }} {{ userInfo.last_name }}</h2>
              <span class="profile-subid">{{ userInfo.id }}</span>
            </div>
          </div>

          <div class="profile-details">
            <div class="kv-row">
              <span class="kv-key"><mat-icon aria-hidden="true">badge</mat-icon>{{ 'profile.userId' | t }}</span>
              <span class="kv-value">{{ userInfo.profile_id }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key"><mat-icon aria-hidden="true">mail</mat-icon>{{ 'profile.email' | t }}</span>
              <span class="kv-value">{{ userInfo.email }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key"><mat-icon aria-hidden="true">schedule</mat-icon>{{ 'profile.lastAccess' | t }}</span>
              <span class="kv-value">{{ userInfo.last_access | localizedDate:'datetime' }}</span>
            </div>
          </div>

          <div class="profile-actions">
            <button mat-raised-button color="primary" (click)="logout()">{{ 'common.logout' | t }}</button>
          </div>
        </section>
        <ng-template #notLoggedIn>
          <section class="profile-panel">
            <h2 class="empty-title">{{ 'profile.noInfoTitle' | t }}</h2>
            <div class="empty-content">
              <p>{{ 'profile.noInfoDesc' | t }}</p>
            </div>
            <div class="profile-actions">
              <button mat-raised-button color="accent" (click)="goToLogin()">{{ 'common.login' | t }}</button>
            </div>
          </section>
        </ng-template>
      </main>
    </div>
  `,
  styles: [`
    .profile-container {
      min-height: 100vh;
      // Theme-aware backdrop: the old hardcoded white gradient was invisible
      // against the dark app background
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.16), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(200, 16, 46, 0.06), transparent 34%),
        var(--background-dark, #0e1015);
      color: var(--text-primary, #ffffff);
    }

    /* Header: canonical styles live in styles/_layout.scss */

    .profile-main {
      width: min(100%, 760px);
      margin: 0 auto;
      padding: var(--content-offset-top) 10px 12px;
    }

    .profile-panel {
      width: 100%;
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: 14px;
      background: var(--surface-card, #1e2128);
      box-shadow: var(--shadow-card, 0 2px 12px rgba(0, 0, 0, 0.2));
      padding: 10px;
    }

    .profile-top {
      display: flex;
      align-items: center;
      gap: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
    }

    .profile-image-container img {
      width: 62px;
      height: 62px;
      border-radius: 50%;
      border: 2px solid #d32f2f;
      object-fit: cover;
      box-shadow: 0 4px 10px rgba(0,0,0,0.14);
    }

    .profile-identity h2 {
      margin: 0;
      font-family: 'MotoGP Bold', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.15px;
      color: var(--text-primary, #ffffff);
      font-size: clamp(1.02rem, 2.5vw, 1.25rem);
    }

    .profile-subid {
      font-size: 0.72rem;
      color: var(--text-secondary, #a0a5b0);
    }

    .profile-details {
      display: grid;
      gap: 6px;
      padding-top: 9px;
    }

    .kv-row {
      display: grid;
      grid-template-columns: minmax(96px, 1fr) minmax(0, 1.4fr);
      gap: 8px;
      align-items: center;
      border: 1px solid var(--border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: 9px;
      padding: 6px 8px;
      background: var(--surface-elevated, #22262e);
    }

    .kv-key {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'MotoGP Bold', sans-serif;
      // Readability floor: >= 11.2px
      font-size: 0.7rem;
      letter-spacing: 0.28px;
      text-transform: uppercase;
      color: var(--text-secondary, #a0a5b0);
    }

    .kv-key mat-icon {
      width: 12px;
      height: 12px;
      line-height: 12px;
      font-size: 12px;
      color: #c8102e;
    }

    .kv-value {
      text-align: right;
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary, #ffffff);
      overflow-wrap: anywhere;
    }

    .profile-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 10px;
    }

    .empty-title {
      margin: 0;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: 1.1rem;
      color: var(--text-primary, #ffffff);
    }

    .empty-content {
      color: var(--text-secondary, #a0a5b0);
      font-size: 0.9rem;
      padding-top: 8px;
    }

    @media (max-width: 600px) {
      .profile-main {
        padding: var(--content-offset-top) 8px 10px;
      }

      .profile-panel {
        padding: 8px;
      }

      .kv-row {
        grid-template-columns: 1fr;
        gap: 2px;
      }

      .kv-value {
        text-align: left;
        font-size: 0.78rem;
      }

      .profile-actions {
        justify-content: stretch;
      }

      .profile-actions button {
        width: 100%;
      }
    }
  `]
})
export class UserInfoComponent implements OnInit {
  userInfo: UserInfo | null = null;
  @ViewChild('notLoggedIn', { static: true }) notLoggedIn!: TemplateRef<any>;

  constructor(
    private authService: AuthService,
    private router: Router,
    private navService: NavigationService
  ) {}

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
    this.navService.back('/');
  }
}
