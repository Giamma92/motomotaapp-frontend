import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HapticService } from '../../services/haptic.service';
import { MoreMenuService } from '../../services/more-menu.service';
import { InAppNotificationService } from '../../services/in-app-notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MoreSheetComponent } from './more-sheet.component';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslatePipe, MoreSheetComponent],
  template: `
    @if (isVisible) {
      <nav
        class="fixed inset-x-0 bottom-0 z-50 pointer-events-none px-4 pt-0 pb-[max(0.75rem,env(safe-area-inset-bottom,0.75rem))] md:bottom-5 md:pb-0 transition-all duration-200"
        [attr.aria-label]="'common.nav.primary' | t">
        <div
          class="liquid-glass-dock pointer-events-auto"
          [class.is-light]="theme.mode() === 'light'">

          <!-- 4 Voci Principali -->
          @for (item of mainNavItems; track item.path) {
            <a
              [routerLink]="item.path"
              (click)="onNavItemClick()"
              routerLinkActive
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{exact: item.path === '/'}"
              class="nav-item"
              [class.active]="rla.isActive"
              [attr.aria-label]="item.labelKey | t">

              <!-- Icona con micro-animazione e glow liquid glass -->
              <div class="nav-icon">
                <i [class]="item.icon"></i>
              </div>

              <!-- Label -->
              <span class="nav-label">
                {{ item.labelKey | t }}
              </span>
            </a>
          }

          <!-- 5° Elemento: Pulsante Altro per aprire il foglio opzioni -->
          <button
            type="button"
            (click)="toggleMore()"
            class="nav-item"
            [class.active]="moreMenu.isOpen() || isMoreActive"
            [attr.aria-label]="'nav.more' | t">

            <div class="nav-icon relative">
              <i class="fa-solid fa-ellipsis"></i>
              @if (unreadCount > 0) {
                <span class="absolute top-0.5 right-1 w-2 h-2 rounded-full bg-red-600 ring-2 ring-zinc-950 animate-pulse"></span>
              }
            </div>

            <span class="nav-label">
              {{ 'nav.more' | t }}
            </span>
          </button>
        </div>
      </nav>

      <!-- Bottom / Center Modal Altro -->
      <app-more-sheet [isOpen]="moreMenu.isOpen()" (close)="moreMenu.close()"></app-more-sheet>
    }
  `,
  styleUrl: './app-bottom-nav.component.scss'
})
export class AppBottomNavComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  public theme = inject(ThemeService);
  public haptic = inject(HapticService);
  public moreMenu = inject(MoreMenuService);
  private notificationService = inject(InAppNotificationService);

  currentUrl = '/';
  unreadCount = 0;

  mainNavItems = [
    { path: '/', labelKey: 'nav.home', icon: 'fa-solid fa-house' },
    { path: '/calendar', labelKey: 'nav.races', icon: 'fa-solid fa-flag-checkered' },
    { path: '/teams', labelKey: 'nav.teams', icon: 'fa-solid fa-people-group' },
    { path: '/standings-breakdown', labelKey: 'nav.scores', icon: 'fa-solid fa-chart-column' },
  ];

  constructor() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl = e.urlAfterRedirects;
      this.moreMenu.close();
    });

    this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  get isVisible(): boolean {
    const token = this.authService.getToken();
    if (!token) return false;
    const url = this.currentUrl;
    return !url.startsWith('/login') && !url.startsWith('/reset-password') && !url.startsWith('/admin');
  }

  get isMoreActive(): boolean {
    const url = this.currentUrl;
    return url.startsWith('/profile') || url.startsWith('/settings') || url.startsWith('/translation') || url.startsWith('/admin');
  }

  onNavItemClick(): void {
    this.haptic.light();
    this.moreMenu.close();
  }

  toggleMore(): void {
    this.haptic.medium();
    this.moreMenu.toggle();
  }
}
