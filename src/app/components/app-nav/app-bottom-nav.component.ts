import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  template: `
    @if (isVisible) {
      <nav class="app-global-bottom-nav" [attr.aria-label]="'common.nav.primary' | t">
        <a routerLink="/" class="nav-item" [class.active]="isCurrentRoute('/')" [attr.aria-label]="'dashboard.title' | t">
          <i class="fa-solid fa-house" aria-hidden="true"></i>
          <span class="nav-label">Home</span>
        </a>

        <a routerLink="/calendar" class="nav-item" [class.active]="isCurrentRoute('/calendar')" [attr.aria-label]="'dashboard.header.calendar' | t">
          <i class="fa-solid fa-flag-checkered" aria-hidden="true"></i>
          <span class="nav-label">Gare</span>
        </a>

        <a routerLink="/teams" class="nav-item" [class.active]="isCurrentRoute('/teams')" aria-label="Teams">
          <i class="fa-solid fa-people-group" aria-hidden="true"></i>
          <span class="nav-label">Teams</span>
        </a>

        <a routerLink="/standings-breakdown" class="nav-item" [class.active]="isCurrentRoute('/standings-breakdown')" aria-label="Punteggi">
          <i class="fa-solid fa-chart-column" aria-hidden="true"></i>
          <span class="nav-label">Punteggi</span>
        </a>

        <a routerLink="/settings" class="nav-item" [class.active]="isCurrentRoute('/settings')" [attr.aria-label]="'dashboard.menu.settings' | t">
          <i class="fa-solid fa-gear" aria-hidden="true"></i>
          <span class="nav-label">Profilo</span>
        </a>
      </nav>
    }
  `,
  styles: [`
    .app-global-bottom-nav {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      bottom: 12px;
      z-index: 999;
      height: 60px;
      display: none;
      grid-template-columns: repeat(5, 1fr);
      align-items: center;
      gap: 2px;
      padding: 5px 8px;
      background: rgba(18, 18, 24, 0.92);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 22px;
      width: min(440px, calc(100% - 24px));
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45), 0 2px 8px rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .app-global-bottom-nav {
        display: grid;
      }
    }

    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      min-height: 48px;
      padding: 4px 0;
      text-decoration: none;
      color: rgba(255, 255, 255, 0.55);
      background: transparent;
      border: 0;
      border-radius: 14px;
      font-size: 0.68rem;
      line-height: 1;
      font-weight: 600;
      text-align: center;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .nav-item i {
      font-size: 1.15rem;
      transition: transform 0.2s ease, color 0.2s ease;
    }

    .nav-label {
      display: block;
      max-width: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .nav-item:hover {
      color: rgba(255, 255, 255, 0.85);
    }

    .nav-item.active {
      color: #ff3344;
      font-weight: 700;
    }

    .nav-item.active i {
      color: #ff3344;
      transform: translateY(-2px);
    }
  `]
})
export class AppBottomNavComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentUrl = '/';

  constructor() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl = e.urlAfterRedirects;
    });
  }

  get isVisible(): boolean {
    const token = this.authService.getToken();
    if (!token) return false;
    const url = this.currentUrl;
    return !url.startsWith('/login') && !url.startsWith('/reset-password');
  }

  isCurrentRoute(basePath: string): boolean {
    if (basePath === '/') {
      return this.currentUrl === '/' || this.currentUrl === '' || this.currentUrl.startsWith('/?');
    }
    return this.currentUrl.startsWith(basePath);
  }
}
