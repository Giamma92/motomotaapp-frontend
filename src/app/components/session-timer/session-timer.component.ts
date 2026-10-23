import { Component, OnInit, OnDestroy, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { HapticService } from '../../services/haptic.service';

@Component({
  selector: 'app-session-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible() && remainingSeconds() > 0) {
      <aside
        class="fixed inset-x-3 max-w-md mx-auto z-[80] p-3 rounded-2xl shadow-2xl border backdrop-blur-xl animate-fade-in flex items-center justify-between gap-3 text-xs"
        [style.top]="'calc(env(safe-area-inset-top, 0px) + 12px)'"
        [ngClass]="theme.mode() === 'light'
          ? 'bg-amber-50/95 border-amber-200 text-amber-950'
          : 'bg-[#1e1710]/95 border-amber-500/30 text-amber-100'"
        role="alert"
        aria-live="polite">

        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 animate-pulse">
            <i class="fa-solid fa-clock-rotate-left text-sm"></i>
          </div>
          <div class="min-w-0">
            <span class="font-black text-xs block leading-tight truncate">Sessione in scadenza</span>
            <span class="text-[11px] opacity-80">
              Tempo rimasto: <strong class="font-mono font-bold">{{ formattedRemaining() }}</strong>
            </span>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            (click)="renew()"
            [disabled]="renewing()"
            class="px-3 py-1.5 rounded-xl font-black text-xs bg-amber-500 hover:bg-amber-400 text-black shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50">
            {{ renewing() ? 'Rinnovo...' : 'Rinnova' }}
          </button>
          <button
            type="button"
            (click)="dismiss()"
            class="w-7 h-7 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
            aria-label="Chiudi avviso">
            <i class="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>
      </aside>
    }
  `
})
export class SessionTimerComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  theme = inject(ThemeService);
  haptic = inject(HapticService);
  private ngZone = inject(NgZone);

  remainingSeconds = signal<number>(0);
  formattedRemaining = signal<string>('');
  isVisible = signal<boolean>(false);
  renewing = signal<boolean>(false);
  private dismissedUntil = 0;
  private intervalId: any = null;

  ngOnInit(): void {
    this.checkTimer();
    this.ngZone.runOutsideAngular(() => {
      this.intervalId = setInterval(() => {
        this.ngZone.run(() => this.checkTimer());
      }, 1000);
    });
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private checkTimer(): void {
    const token = this.authService.getToken();
    if (!token) {
      this.isVisible.set(false);
      return;
    }
    const sec = this.authService.getRemainingSessionSeconds();
    this.remainingSeconds.set(sec);
    this.formattedRemaining.set(this.authService.formatRemainingTime(sec));

    // Show banner when 10 minutes (600s) or less remain, unless dismissed recently
    const shouldShow = sec > 0 && sec <= 600 && Date.now() > this.dismissedUntil;
    this.isVisible.set(shouldShow);
  }

  renew(): void {
    this.renewing.set(true);
    this.haptic.light();
    this.authService.refreshToken().subscribe({
      next: () => {
        this.renewing.set(false);
        this.isVisible.set(false);
        this.checkTimer();
      },
      error: () => {
        this.renewing.set(false);
      }
    });
  }

  dismiss(): void {
    // Hide for 2 minutes
    this.dismissedUntil = Date.now() + 120000;
    this.isVisible.set(false);
  }
}
