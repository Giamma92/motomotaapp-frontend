import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-redline-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="isVisible"
      class="redline-container"
      [class.redline-fading]="isFading"
      aria-hidden="true"
      role="progressbar"
      aria-label="Caricamento in corso">
      <div class="redline-track">
        <div class="redline-glow"></div>
        <div class="redline-head"></div>
      </div>
    </div>
  `,
  styles: [`
    .redline-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      z-index: 9999999;
      pointer-events: none;
      overflow: hidden;
      background: rgba(200, 16, 46, 0.12);
      transition: opacity 0.25s ease-out;
    }

    .redline-container.redline-fading {
      opacity: 0;
    }

    .redline-track {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .redline-glow {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      background: linear-gradient(
        90deg,
        rgba(200, 16, 46, 0) 0%,
        #c8102e 20%,
        #ff1e46 55%,
        #ff5252 85%,
        #ffffff 100%
      );
      box-shadow: 0 0 10px rgba(255, 30, 70, 0.8), 0 0 4px rgba(255, 255, 255, 0.9);
      animation: redline-rev 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    .redline-head {
      position: absolute;
      top: -1px;
      height: 5px;
      width: 30px;
      border-radius: 50%;
      background: #ffffff;
      filter: blur(1.5px);
      box-shadow: 0 0 12px 3px rgba(255, 255, 255, 0.95);
      animation: redline-head-rev 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }

    @keyframes redline-rev {
      0% {
        left: -40%;
        width: 35%;
      }
      60% {
        left: 20%;
        width: 65%;
      }
      100% {
        left: 100%;
        width: 40%;
      }
    }

    @keyframes redline-head-rev {
      0% {
        left: -5%;
      }
      60% {
        left: 85%;
      }
      100% {
        left: 105%;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .redline-glow, .redline-head {
        animation-duration: 2.5s;
      }
    }
  `]
})
export class RedlineProgressBarComponent implements OnInit, OnDestroy {
  public loadingService = inject(LoadingService);
  private router = inject(Router);

  isVisible = false;
  isFading = false;
  private fadeTimeout: any;
  private sub = new Subscription();

  ngOnInit(): void {
    // Router events subscription
    this.sub.add(
      this.router.events.subscribe(event => {
        if (event instanceof NavigationStart) {
          this.loadingService.setNavigating(true);
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.loadingService.setNavigating(false);
        }
      })
    );

    // Watch loading state
    let wasLoading = false;
    const interval = setInterval(() => {
      const active = this.loadingService.isLoading();
      if (active && !wasLoading) {
        clearTimeout(this.fadeTimeout);
        this.isFading = false;
        this.isVisible = true;
      } else if (!active && wasLoading) {
        this.isFading = true;
        this.fadeTimeout = setTimeout(() => {
          this.isVisible = false;
          this.isFading = false;
        }, 260);
      }
      wasLoading = active;
    }, 50);

    this.sub.add({
      unsubscribe: () => clearInterval(interval)
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
    }
  }
}
