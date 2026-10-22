import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { HapticService } from '../../services/haptic.service';

@Component({
  selector: 'app-splash-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isVisible) {
      <div
        class="splash-overlay"
        [class.splash-fading]="isFading"
        [attr.data-theme]="theme.mode()"
        (click)="dismissFast()"
        role="status"
        aria-label="Loading MotoMota">

        <!-- Ambient Race Background Blur -->
        <div class="ambient-glow" [class.ambient-glow--active]="litCount > 0" [class.ambient-glow--launch]="isLaunched"></div>

        <div class="splash-card" [class.splash-card--revving]="litCount >= 4" [class.splash-card--launched]="isLaunched">

          <!-- Racing Helmet Icon with throttle rev pulse -->
          <div class="splash-icon-wrapper">
            <div class="splash-icon" [class.splash-icon--redline]="litCount === 5" [class.splash-icon--launch]="isLaunched">
              <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.41 3.12 7.24.45.43 1.05.67 1.67.67h10.42c.62 0 1.22-.24 1.67-.67C20.8 17.41 22 14.85 22 12c0-5.52-4.48-10-10-10zm-1 3.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S8.5 9.38 8.5 8s1.12-2.5 2.5-2.5zm6.5 10.5h-11c-.55 0-1-.45-1-1 0-2.21 2.69-4 6.5-4s6.5 1.79 6.5 4c0 .55-.45 1-1 1z"/>
                <path d="M4 11h16v2H4z" opacity="0.3"/>
              </svg>
            </div>
          </div>

          <!-- Brand Title with Metallic Shimmer -->
          <h1 class="splash-title">
            <span class="brand-text">MOTO<span class="accent-text">MOTA</span></span>
          </h1>
          <div class="splash-sub">Racing Manager</div>

          <!-- Tachometer / RPM LED Bar -->
          <div class="tachometer-wrap" aria-hidden="true">
            <div class="rpm-labels">
              <span>RPM</span>
              <span class="rpm-number">{{ rpmValue }}</span>
            </div>
            <div class="rpm-bar">
              <div class="rpm-fill" [style.width.%]="rpmPercent"></div>
            </div>
          </div>

          <!-- 5 MotoGP Sequential Start Lights -->
          <div class="lights-gantry" aria-hidden="true">
            <div class="light" [class.light--on]="litCount >= 1"></div>
            <div class="light" [class.light--on]="litCount >= 2"></div>
            <div class="light" [class.light--on]="litCount >= 3"></div>
            <div class="light" [class.light--on]="litCount >= 4"></div>
            <div class="light" [class.light--on]="litCount >= 5"></div>
          </div>

          <!-- Status Message -->
          <div class="status-badge" [class.status-badge--go]="isLaunched">
            @if (isLaunched) {
              <span class="badge-go">LIGHTS OUT! GO!</span>
            } @else if (litCount === 5) {
              <span class="badge-ready">READY TO RACE...</span>
            } @else {
              <span class="badge-starting">STARTING ENGINE...</span>
            }
          </div>

          <!-- Tap to skip hint -->
          <div class="skip-hint">Tocca per entrare</div>
        </div>
      </div>
    }
  `,
  styles: [`
    .splash-overlay {
      position: fixed;
      inset: 0;
      z-index: 999999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 36%, rgba(200, 16, 46, 0.25) 0%, #0b0c10 70%);
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      overflow: hidden;
      opacity: 1;
      transform: scale(1);
      cursor: pointer;
      transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .splash-overlay[data-theme='light'] {
      background: radial-gradient(circle at 50% 36%, rgba(200, 16, 46, 0.14) 0%, #f4f5f7 70%);
      color: #111214;
    }

    .splash-overlay.splash-fading {
      opacity: 0;
      transform: scale(1.08);
      pointer-events: none;
    }

    /* Ambient animated lighting */
    .ambient-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(200, 16, 46, 0.35) 0%, transparent 68%);
      filter: blur(50px);
      transition: all 0.3s ease;
      pointer-events: none;
      transform: scale(0.8);
      opacity: 0.5;
    }

    .ambient-glow--active {
      transform: scale(1.2);
      opacity: 0.9;
    }

    .ambient-glow--launch {
      transform: scale(2);
      background: radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, rgba(200, 16, 46, 0.4) 40%, transparent 70%);
      opacity: 1;
      transition: all 0.15s ease-out;
    }

    /* Central Liquid Glass Card */
    .splash-card {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 34px 28px 22px;
      border-radius: 30px;
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.14) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 100%),
        linear-gradient(165deg, rgba(26, 30, 40, 0.84) 0%, rgba(16, 18, 24, 0.92) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.3),
        inset 0 -1px 0 0 rgba(0, 0, 0, 0.6),
        0 24px 64px -12px rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      max-width: 330px;
      width: 88vw;
      text-align: center;
      animation: card-spring 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.15s ease;
    }

    .splash-overlay[data-theme='light'] .splash-card {
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.2) 60%, transparent 100%),
        linear-gradient(165deg, rgba(255, 255, 255, 0.94) 0%, rgba(244, 246, 250, 0.97) 100%);
      border-color: rgba(0, 0, 0, 0.09);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 1),
        0 20px 48px -10px rgba(0, 0, 0, 0.16);
    }

    .splash-card--revving {
      border-color: rgba(200, 16, 46, 0.5);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.4),
        0 24px 64px -12px rgba(0, 0, 0, 0.8),
        0 0 28px rgba(200, 16, 46, 0.35);
    }

    .splash-card--launched {
      border-color: rgba(255, 255, 255, 0.6);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.8),
        0 30px 70px -10px rgba(0, 0, 0, 0.9),
        0 0 40px rgba(255, 255, 255, 0.4);
    }

    /* Icon */
    .splash-icon-wrapper {
      position: relative;
      margin-bottom: 14px;
    }

    .splash-icon {
      width: 60px;
      height: 60px;
      border-radius: 20px;
      background: linear-gradient(135deg, #c8102e 0%, #8a0b1f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 24px -4px rgba(200, 16, 46, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4);
      transition: all 0.2s ease;
    }

    .splash-icon svg {
      width: 32px;
      height: 32px;
      fill: #ffffff;
    }

    .splash-icon--redline {
      transform: scale(1.1);
      box-shadow: 0 0 30px #e40000, 0 10px 24px -4px rgba(200, 16, 46, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.6);
      animation: throttle-shake 0.08s infinite alternate;
    }

    .splash-icon--launch {
      transform: scale(1.2);
      background: linear-gradient(135deg, #ff1a1a 0%, #c8102e 100%);
      box-shadow: 0 0 40px rgba(255, 255, 255, 0.8), 0 0 60px rgba(200, 16, 46, 0.9);
    }

    /* Title */
    .splash-title {
      font-size: 1.65rem;
      font-weight: 900;
      letter-spacing: 2.5px;
      margin: 0;
      line-height: 1.1;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #ffffff 0%, #c8ccd6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .splash-overlay[data-theme='light'] .splash-title {
      background: linear-gradient(180deg, #111214 0%, #3a3f4d 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .splash-title .accent-text {
      color: #c8102e;
      -webkit-text-fill-color: #c8102e;
      text-shadow: 0 0 16px rgba(200, 16, 46, 0.4);
    }

    .splash-sub {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 3.5px;
      color: #8c93a4;
      text-transform: uppercase;
      margin-top: 4px;
    }

    .splash-overlay[data-theme='light'] .splash-sub {
      color: #636b7c;
    }

    /* Tachometer RPM Bar */
    .tachometer-wrap {
      width: 100%;
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .rpm-labels {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: #6b7280;
    }

    .rpm-number {
      font-family: monospace;
      font-size: 0.82rem;
      color: #c8102e;
      font-weight: 900;
      text-shadow: 0 0 8px rgba(200, 16, 46, 0.4);
    }

    .rpm-bar {
      width: 100%;
      height: 5px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .splash-overlay[data-theme='light'] .rpm-bar {
      background: rgba(0, 0, 0, 0.08);
      border-color: rgba(0, 0, 0, 0.06);
    }

    .rpm-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, #00c853 0%, #ffd600 65%, #c8102e 100%);
      box-shadow: 0 0 10px rgba(200, 16, 46, 0.6);
      transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    /* 5 MotoGP Start Lights */
    .lights-gantry {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 18px;
      margin-top: 16px;
      background: rgba(0, 0, 0, 0.55);
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.6);
    }

    .splash-overlay[data-theme='light'] .lights-gantry {
      background: rgba(0, 0, 0, 0.06);
      border-color: rgba(0, 0, 0, 0.06);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .light {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #252830;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.7);
      transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .splash-overlay[data-theme='light'] .light {
      background: #d4d7df;
      border-color: rgba(0, 0, 0, 0.06);
    }

    .light--on {
      background: #e40000 !important;
      border-color: #ff4d6d !important;
      box-shadow:
        0 0 14px #ff1a1a,
        0 0 24px rgba(228, 0, 0, 0.85),
        inset 0 1px 1px rgba(255, 255, 255, 0.6) !important;
      transform: scale(1.18);
    }

    /* Status Badge */
    .status-badge {
      margin-top: 18px;
      min-height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      color: #9ca3af;
      transition: all 0.2s ease;
    }

    .badge-ready {
      color: #ffd600;
      text-shadow: 0 0 10px rgba(255, 214, 0, 0.5);
      animation: pulse-ready 0.6s infinite alternate;
    }

    .badge-go {
      color: #00e676;
      font-size: 0.95rem;
      font-weight: 900;
      letter-spacing: 2px;
      text-shadow: 0 0 18px rgba(0, 230, 118, 0.9);
      animation: bounce-go 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .skip-hint {
      margin-top: 14px;
      font-size: 0.62rem;
      letter-spacing: 1px;
      color: rgba(255, 255, 255, 0.35);
      text-transform: uppercase;
      font-weight: 600;
    }

    .splash-overlay[data-theme='light'] .skip-hint {
      color: rgba(0, 0, 0, 0.35);
    }

    @keyframes card-spring {
      0% {
        opacity: 0;
        transform: scale(0.88) translateY(20px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes throttle-shake {
      0% { transform: scale(1.1) rotate(-1deg); }
      100% { transform: scale(1.1) rotate(1deg); }
    }

    @keyframes pulse-ready {
      0% { opacity: 0.8; transform: scale(0.98); }
      100% { opacity: 1; transform: scale(1.02); }
    }

    @keyframes bounce-go {
      0% { transform: scale(0.7); }
      80% { transform: scale(1.15); }
      100% { transform: scale(1.05); }
    }

    @media (prefers-reduced-motion: reduce) {
      .splash-card,
      .splash-icon,
      .light,
      .rpm-fill {
        animation: none !important;
        transition: none !important;
      }
    }
  `]
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  public theme = inject(ThemeService);
  private haptic = inject(HapticService);

  isVisible = true;
  isFading = false;
  isLaunched = false;
  litCount = 0;
  rpmValue = '1,200';
  rpmPercent = 15;

  private timeouts: any[] = [];

  ngOnInit(): void {
    this.startRaceSequence();
  }

  private startRaceSequence(): void {
    // Light 1 at 250ms
    this.timeouts.push(setTimeout(() => {
      this.litCount = 1;
      this.rpmValue = '4,500';
      this.rpmPercent = 35;
      this.haptic.light();
    }, 250));

    // Light 2 at 520ms
    this.timeouts.push(setTimeout(() => {
      this.litCount = 2;
      this.rpmValue = '8,000';
      this.rpmPercent = 55;
      this.haptic.light();
    }, 520));

    // Light 3 at 790ms
    this.timeouts.push(setTimeout(() => {
      this.litCount = 3;
      this.rpmValue = '11,500';
      this.rpmPercent = 72;
      this.haptic.light();
    }, 790));

    // Light 4 at 1060ms
    this.timeouts.push(setTimeout(() => {
      this.litCount = 4;
      this.rpmValue = '14,200';
      this.rpmPercent = 88;
      this.haptic.light();
    }, 1060));

    // Light 5 at 1330ms (All 5 RED - Redline!)
    this.timeouts.push(setTimeout(() => {
      this.litCount = 5;
      this.rpmValue = '17,800';
      this.rpmPercent = 100;
      this.haptic.medium();
    }, 1330));

    // LIGHTS OUT AT 1800ms! (All lights turn off instantly!)
    this.timeouts.push(setTimeout(() => {
      this.litCount = 0;
      this.isLaunched = true;
      this.rpmValue = '18,500 MAX';
      this.haptic.success();
    }, 1800));

    // Start smooth fade out at 2200ms
    this.timeouts.push(setTimeout(() => {
      this.isFading = true;
    }, 2200));

    // Unmount completely at 2650ms
    this.timeouts.push(setTimeout(() => {
      this.isVisible = false;
    }, 2650));
  }

  dismissFast(): void {
    if (this.isFading) return;
    this.timeouts.forEach(t => clearTimeout(t));
    this.isLaunched = true;
    this.litCount = 0;
    this.haptic.success();
    this.isFading = true;
    setTimeout(() => {
      this.isVisible = false;
    }, 350);
  }

  ngOnDestroy(): void {
    this.timeouts.forEach(t => clearTimeout(t));
  }
}
