import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HapticService } from '../../services/haptic.service';
import { MoreMenuService } from '../../services/more-menu.service';
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
          class="pointer-events-auto max-w-md mx-auto backdrop-blur-2xl rounded-[28px] p-1.5 grid grid-cols-5 gap-1 transition-all duration-200 shadow-2xl"
          [ngClass]="theme.mode() === 'light'
            ? 'bg-white/95 ring-1 ring-black/[0.08] shadow-[0_10px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.04)]'
            : 'bg-zinc-950/90 ring-1 ring-white/10 shadow-[0_14px_40px_rgba(0,0,0,0.7)]'">

          <!-- 4 Voci Principali -->
          @for (item of mainNavItems; track item.path) {
            <a
              [routerLink]="item.path"
              (click)="onNavItemClick()"
              routerLinkActive
              #rla="routerLinkActive"
              [routerLinkActiveOptions]="{exact: item.path === '/'}"
              class="group relative flex flex-col items-center justify-center py-1.5 px-1 rounded-[22px] transition-all duration-200 active:scale-95 no-underline select-none cursor-pointer"
              [class.bg-red-600/15]="rla.isActive && theme.mode() === 'dark'"
              [class.bg-red-600/10]="rla.isActive && theme.mode() === 'light'"
              [class.text-red-500]="rla.isActive && theme.mode() === 'dark'"
              [class.text-red-600]="rla.isActive && theme.mode() === 'light'"
              [class.text-zinc-400]="!rla.isActive && theme.mode() === 'dark'"
              [class.text-zinc-500]="!rla.isActive && theme.mode() === 'light'"
              [attr.aria-label]="item.label">

              <!-- Icona con micro-animazione e glow sportivo -->
              <div
                class="relative h-6 flex items-center justify-center text-[16px] transition-transform duration-200 group-hover:scale-110"
                [class.scale-110]="rla.isActive"
                [class.text-red-500]="rla.isActive && theme.mode() === 'dark'"
                [class.text-red-600]="rla.isActive && theme.mode() === 'light'"
                [class.drop-shadow-[0_0_8px_rgba(200,16,46,0.65)]]="rla.isActive && theme.mode() === 'dark'"
                [class.drop-shadow-[0_0_6px_rgba(200,16,46,0.3)]]="rla.isActive && theme.mode() === 'light'">
                <i [class]="item.icon"></i>
              </div>

              <!-- Label -->
              <span
                class="text-[10px] tracking-tight font-sans mt-0.5 whitespace-nowrap leading-tight transition-all duration-150"
                [class.font-extrabold]="rla.isActive"
                [class.font-semibold]="!rla.isActive"
                [class.text-red-500]="rla.isActive && theme.mode() === 'dark'"
                [class.text-red-600]="rla.isActive && theme.mode() === 'light'"
                [class.text-zinc-400]="!rla.isActive && theme.mode() === 'dark'"
                [class.text-zinc-500]="!rla.isActive && theme.mode() === 'light'">
                {{ item.label }}
              </span>
            </a>
          }

          <!-- 5° Elemento: Pulsante Altro per aprire il foglio opzioni -->
          <button
            type="button"
            (click)="toggleMore()"
            class="group relative flex flex-col items-center justify-center py-1.5 px-1 rounded-[22px] transition-all duration-200 active:scale-95 border-0 bg-transparent select-none cursor-pointer"
            [class.bg-red-600/15]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
            [class.bg-red-600/10]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'"
            [class.text-red-500]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
            [class.text-red-600]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'"
            [class.text-zinc-400]="!(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
            [class.text-zinc-500]="!(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'"
            aria-label="Altre sezioni">

            <div
              class="relative h-6 flex items-center justify-center text-[16px] transition-transform duration-200 group-hover:scale-110"
              [class.scale-110]="moreMenu.isOpen() || isMoreActive"
              [class.text-red-500]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
              [class.text-red-600]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'"
              [class.drop-shadow-[0_0_8px_rgba(200,16,46,0.65)]]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
              [class.drop-shadow-[0_0_6px_rgba(200,16,46,0.3)]]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'">
              <i class="fa-solid fa-ellipsis"></i>
            </div>

            <span
              class="text-[10px] tracking-tight font-sans mt-0.5 whitespace-nowrap leading-tight transition-all duration-150"
              [class.font-extrabold]="moreMenu.isOpen() || isMoreActive"
              [class.font-semibold]="!(moreMenu.isOpen() || isMoreActive)"
              [class.text-red-500]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
              [class.text-red-600]="(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'"
              [class.text-zinc-400]="!(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'dark'"
              [class.text-zinc-500]="!(moreMenu.isOpen() || isMoreActive) && theme.mode() === 'light'">
              Altro
            </span>
          </button>
        </div>
      </nav>

      <!-- Bottom / Center Modal Altro -->
      <app-more-sheet [isOpen]="moreMenu.isOpen()" (close)="moreMenu.close()"></app-more-sheet>
    }
  `
})
export class AppBottomNavComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  public theme = inject(ThemeService);
  public haptic = inject(HapticService);
  public moreMenu = inject(MoreMenuService);

  currentUrl = '/';

  mainNavItems = [
    { path: '/', label: 'Home', icon: 'fa-solid fa-house' },
    { path: '/calendar', label: 'Gare', icon: 'fa-solid fa-flag-checkered' },
    { path: '/teams', label: 'Teams', icon: 'fa-solid fa-people-group' },
    { path: '/standings-breakdown', label: 'Punteggi', icon: 'fa-solid fa-chart-column' },
  ];

  constructor() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.currentUrl = e.urlAfterRedirects;
      this.moreMenu.close();
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
