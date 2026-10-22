import { Component, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
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
    @if (isVisible()) {
      <header
        class="fixed top-0 inset-x-0 h-[48px] z-[1000] pointer-events-auto px-3 sm:px-6 flex items-center justify-between backdrop-blur-xl transition-colors duration-200"
        [ngClass]="theme.mode() === 'light'
          ? 'bg-white/85 border-b border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
          : 'bg-zinc-950/80 border-b border-white/[0.08] shadow-[0_1px_8px_rgba(0,0,0,0.4)]'">

        <!-- Left: Unified Minimal Brand -->
        <div
          class="flex items-center gap-2 cursor-pointer select-none group"
          (click)="onBrandClick()"
          role="button"
          tabindex="0"
          aria-label="MotoMota Home">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white text-xs shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
            <i class="fa-solid fa-flag-checkered"></i>
          </div>
          <div class="flex items-baseline gap-1">
            <span
              class="font-black text-sm tracking-tight leading-none"
              [class.text-white]="theme.mode() === 'dark'"
              [class.text-zinc-900]="theme.mode() === 'light'">
              MOTO<span class="text-red-600">MOTA</span>
            </span>
            <span class="text-[9px] font-bold text-red-500 uppercase tracking-wider hidden sm:inline">GP</span>
          </div>
        </div>

        <!-- Right: Actions & Utilities (Notifications + Theme + Admin) -->
        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Admin Shortcut (Visible only to Admin) -->
          @if (isAdmin()) {
            <a
              routerLink="/admin"
              (click)="haptic.light()"
              class="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all no-underline cursor-pointer"
              [ngClass]="theme.mode() === 'light'
                ? 'bg-red-50 text-red-600 border border-red-200/60 hover:bg-red-100'
                : 'bg-red-600/15 text-red-400 border border-red-500/30 hover:bg-red-600/25'"
              aria-label="Pannello Amministratore">
              <i class="fa-solid fa-shield-halved text-[11px]"></i>
              <span class="hidden sm:inline text-[11px]">Admin</span>
            </a>
          }

          <!-- Global Notifications Bell -->
          <app-notification-bell></app-notification-bell>

          <!-- Theme Switcher -->
          <button
            type="button"
            class="cursor-pointer w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all duration-200 border"
            [ngClass]="theme.mode() === 'light'
              ? 'bg-black/[0.04] hover:bg-black/[0.08] border-black/[0.08] text-indigo-600 active:scale-95'
              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.1] text-amber-400 active:scale-95'"
            (click)="toggleTheme($event)"
            [attr.aria-label]="theme.mode() === 'dark' ? 'Passa a modalità chiara' : 'Passa a modalità scura'"
            [title]="theme.mode() === 'dark' ? 'Passa a modalità chiara' : 'Passa a modalità scura'">
            <i class="fa-solid" [class.fa-sun]="theme.mode() === 'dark'" [class.fa-moon]="theme.mode() === 'light'"></i>
          </button>
        </div>
      </header>
    }
  `
})
export class AppTopNavComponent {
  private authService = inject(AuthService);
  public theme = inject(ThemeService);
  public haptic = inject(HapticService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  currentUrl = signal<string>(this.router.url);

  constructor() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl.set(e.urlAfterRedirects.split('?')[0]);
      this.cdr.markForCheck();
    });
  }

  // Primary routes where the top-nav brand is shown instead of redundant headers
  readonly isPrimaryRoute = computed(() => {
    const url = this.currentUrl();
    const isHome = url === '' || url === '/' || url === '/dashboard';
    return isHome || url === '/calendar' || url === '/teams' || url === '/standings-breakdown';
  });

  readonly isVisible = computed(() => {
    const token = this.authService.getToken();
    if (!token) return false;
    const url = this.currentUrl();
    if (url.startsWith('/login') || url.startsWith('/reset-password')) return false;
    return this.isPrimaryRoute();
  });

  readonly isAdmin = computed(() => {
    return this.authService.isCurrentUserAdmin();
  });

  onBrandClick(): void {
    try {
      this.haptic.light();
    } catch {}
    if (this.currentUrl() !== '/') {
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
