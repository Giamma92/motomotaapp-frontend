import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HapticService } from '../../services/haptic.service';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationBellComponent],
  template: `
    @if (isVisible) {
      <header
        class="liquid-glass-header"
        [class.is-light]="theme.mode() === 'light'">

        <!-- Left: Unified Minimal Brand -->
        <div
          class="flex items-center gap-2 cursor-pointer select-none group shrink-0"
          (click)="onBrandClick()"
          role="button"
          tabindex="0"
          aria-label="MotoMota Home">
          <div class="header-brand-badge">
            <i class="fa-solid fa-flag-checkered"></i>
          </div>
          <div class="flex items-baseline gap-1">
            <span
              class="font-black text-xs sm:text-sm tracking-tight leading-none"
              [class.text-white]="theme.mode() === 'dark'"
              [class.text-zinc-900]="theme.mode() === 'light'">
              MOTO<span class="text-red-600">MOTA</span>
            </span>
            <span class="text-[9px] font-black text-red-500 uppercase tracking-widest hidden sm:inline">GP</span>
          </div>
        </div>

        <!-- Right: Actions & Utilities (Notifications + Theme + Admin) -->
        <div class="header-actions-dock shrink-0">
          <!-- Admin Shortcut (Visible only to Admin) -->
          @if (isAdmin) {
            <a
              routerLink="/admin"
              (click)="haptic.light()"
              class="header-btn header-btn--admin"
              aria-label="Pannello Amministratore">
              <i class="fa-solid fa-shield-halved text-xs"></i>
              <span class="hidden sm:inline">Admin</span>
            </a>
          }

          <!-- Global Notifications Bell -->
          <app-notification-bell></app-notification-bell>

          <!-- Theme Switcher -->
          <button
            type="button"
            class="header-btn header-btn--theme"
            [class.dark-mode]="theme.mode() === 'dark'"
            [class.light-mode]="theme.mode() === 'light'"
            (click)="toggleTheme($event)"
            [attr.aria-label]="theme.mode() === 'dark' ? 'Passa a modalità chiara' : 'Passa a modalità scura'"
            [title]="theme.mode() === 'dark' ? 'Passa a modalità chiara' : 'Passa a modalità scura'">
            <i class="fa-solid" [class.fa-sun]="theme.mode() === 'dark'" [class.fa-moon]="theme.mode() === 'light'"></i>
          </button>
        </div>
      </header>
    }
  `,
  styleUrl: './app-top-nav.component.scss'
})
export class AppTopNavComponent {
  private authService = inject(AuthService);
  public theme = inject(ThemeService);
  public haptic = inject(HapticService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUrl: string = '/';

  constructor() {
    this.currentUrl = this.cleanUrl(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl = this.cleanUrl(e.urlAfterRedirects);
      this.cdr.markForCheck();
    });
  }

  private cleanUrl(url: string): string {
    if (!url) return '/';
    const path = url.split('?')[0].split('#')[0];
    if (path.length > 1 && path.endsWith('/')) {
      return path.slice(0, -1);
    }
    return path;
  }

  // Primary routes where the top-nav brand is shown instead of redundant headers
  get isPrimaryRoute(): boolean {
    const url = this.cleanUrl(this.currentUrl);
    const isHome = url === '' || url === '/' || url === '/dashboard';
    return isHome || url === '/calendar' || url === '/teams' || url === '/standings-breakdown';
  }

  get isVisible(): boolean {
    const token = this.authService.tokenSignal() ?? this.authService.getToken();
    if (!token) return false;
    const url = this.cleanUrl(this.currentUrl);
    if (url.startsWith('/login') || url.startsWith('/reset-password')) return false;
    return this.isPrimaryRoute;
  }

  get isAdmin(): boolean {
    return this.authService.isCurrentUserAdmin();
  }

  onBrandClick(): void {
    try {
      this.haptic.light();
    } catch {}
    if (this.cleanUrl(this.currentUrl) !== '/') {
      this.router.navigate(['/']);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  toggleTheme(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    try {
      this.haptic.light();
    } catch {}
    this.theme.toggle();
    this.cdr.markForCheck();
  }
}
