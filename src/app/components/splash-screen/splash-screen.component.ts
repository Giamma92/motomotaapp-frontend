import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';

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
        role="status"
        aria-label="Loading MotoMota">
        <div class="splash-card">
          <!-- Racing Logo Icon -->
          <div class="splash-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.41 3.12 7.24.45.43 1.05.67 1.67.67h10.42c.62 0 1.22-.24 1.67-.67C20.8 17.41 22 14.85 22 12c0-5.52-4.48-10-10-10zm-1 3.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S8.5 9.38 8.5 8s1.12-2.5 2.5-2.5zm6.5 10.5h-11c-.55 0-1-.45-1-1 0-2.21 2.69-4 6.5-4s6.5 1.79 6.5 4c0 .55-.45 1-1 1z"/>
              <path d="M4 11h16v2H4z" opacity="0.3"/>
            </svg>
          </div>

          <!-- Brand Title -->
          <h1 class="splash-title">MOTO<span>MOTA</span></h1>
          <div class="splash-sub">Racing Manager</div>

          <!-- 5 MotoGP Start Lights -->
          <div class="lights-gantry" aria-hidden="true">
            <div class="light light-1"></div>
            <div class="light light-2"></div>
            <div class="light light-3"></div>
            <div class="light light-4"></div>
            <div class="light light-5"></div>
          </div>

          <!-- Racing Speed Line -->
          <div class="speed-bar" aria-hidden="true">
            <div class="speed-line"></div>
          </div>
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
      background: radial-gradient(circle at 50% 38%, rgba(200, 16, 46, 0.22) 0%, transparent 65%), #0b0c10;
      color: #ffffff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      overflow: hidden;
      opacity: 1;
      transform: scale(1);
      transition: opacity 0.45s cubic-bezier(0.4, 0, 0.2, 1), transform 0.45s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .splash-overlay[data-theme='light'] {
      background: radial-gradient(circle at 50% 38%, rgba(200, 16, 46, 0.12) 0%, transparent 65%), #f4f5f7;
      color: #111214;
    }

    .splash-overlay.splash-fading {
      opacity: 0;
      transform: scale(1.05);
      pointer-events: none;
    }

    .splash-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 34px 28px;
      border-radius: 28px;
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 100%),
        linear-gradient(165deg, rgba(28, 32, 42, 0.82) 0%, rgba(18, 21, 28, 0.90) 100%);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.25),
        inset 0 -1px 0 0 rgba(0, 0, 0, 0.5),
        0 24px 60px -12px rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      max-width: 320px;
      width: 86vw;
      text-align: center;
      animation: card-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    .splash-overlay[data-theme='light'] .splash-card {
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.2) 60%, transparent 100%),
        linear-gradient(165deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 246, 250, 0.95) 100%);
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 1),
        0 20px 48px -10px rgba(0, 0, 0, 0.15);
    }

    .splash-icon {
      width: 58px;
      height: 58px;
      border-radius: 18px;
      background: linear-gradient(135deg, #c8102e 0%, #8a0b1f 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 8px 24px -4px rgba(200, 16, 46, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.35);
      animation: icon-beat 1.8s ease-in-out infinite;
    }

    .splash-icon svg {
      width: 30px;
      height: 30px;
      fill: #ffffff;
    }

    .splash-title {
      font-size: 1.55rem;
      font-weight: 900;
      letter-spacing: 2px;
      margin: 0;
      line-height: 1.1;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }

    .splash-title span {
      color: #c8102e;
    }

    .splash-sub {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 3.5px;
      color: #8c93a4;
      text-transform: uppercase;
      margin-top: 6px;
    }

    .splash-overlay[data-theme='light'] .splash-sub {
      color: #636b7c;
    }

    /* Start Lights */
    .lights-gantry {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      margin-top: 24px;
      background: rgba(0, 0, 0, 0.45);
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
    }

    .splash-overlay[data-theme='light'] .lights-gantry {
      background: rgba(0, 0, 0, 0.06);
      border-color: rgba(0, 0, 0, 0.06);
      box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .light {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #252830;
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
      transition: all 0.2s ease;
    }

    .splash-overlay[data-theme='light'] .light {
      background: #d4d7df;
      border-color: rgba(0, 0, 0, 0.06);
    }

    .light-1 { animation: light-on 2.2s ease-in-out infinite 0.15s; }
    .light-2 { animation: light-on 2.2s ease-in-out infinite 0.35s; }
    .light-3 { animation: light-on 2.2s ease-in-out infinite 0.55s; }
    .light-4 { animation: light-on 2.2s ease-in-out infinite 0.75s; }
    .light-5 { animation: light-on 2.2s ease-in-out infinite 0.95s; }

    .speed-bar {
      width: 100%;
      height: 3px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      margin-top: 22px;
      overflow: hidden;
      position: relative;
    }

    .splash-overlay[data-theme='light'] .speed-bar {
      background: rgba(0, 0, 0, 0.08);
    }

    .speed-line {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 40%;
      background: linear-gradient(90deg, transparent, #c8102e 50%, #ff4d6d 100%);
      border-radius: 999px;
      animation: speed-race 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes card-in {
      from {
        opacity: 0;
        transform: scale(0.92) translateY(12px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    @keyframes icon-beat {
      0%, 100% {
        transform: scale(1);
        box-shadow: 0 8px 24px -4px rgba(200, 16, 46, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.35);
      }
      50% {
        transform: scale(1.05);
        box-shadow: 0 12px 30px -2px rgba(200, 16, 46, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.45);
      }
    }

    @keyframes light-on {
      0%, 15% {
        background: #252830;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
      }
      30%, 85% {
        background: #e40000;
        box-shadow: 0 0 10px #ff1a1a, 0 0 18px rgba(228, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.5);
      }
      100% {
        background: #252830;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.6);
      }
    }

    @keyframes speed-race {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(300%); }
    }

    @media (prefers-reduced-motion: reduce) {
      .splash-card,
      .splash-icon,
      .light,
      .speed-line {
        animation: none !important;
      }
      .light {
        background: #c8102e;
        box-shadow: 0 0 8px rgba(200, 16, 46, 0.6);
      }
    }
  `]
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  public theme = inject(ThemeService);
  isVisible = true;
  isFading = false;
  private fadeTimeoutId?: any;
  private hideTimeoutId?: any;

  ngOnInit(): void {
    // Show lights animation for 1.7s, then fade out smoothly
    this.fadeTimeoutId = setTimeout(() => {
      this.isFading = true;
      this.hideTimeoutId = setTimeout(() => {
        this.isVisible = false;
      }, 450);
    }, 1700);
  }

  ngOnDestroy(): void {
    if (this.fadeTimeoutId) clearTimeout(this.fadeTimeoutId);
    if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
  }
}
