import { Component, EventEmitter, HostListener, Input, Output, inject, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HapticService } from '../../services/haptic.service';

@Component({
  selector: 'app-pull-to-refresh',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      *ngIf="pullDistance > 0 || isRefreshing"
      class="ptr-container"
      [style.height.px]="pullDistance"
      aria-hidden="true">
      <div class="ptr-content" [class.ptr-content--ready]="pullDistance >= threshold && !isRefreshing">
        <!-- Mechanical Recoil / Pulley Wheel Icon -->
        <i
          class="fa-solid fa-flag-checkered ptr-icon"
          [class.ptr-icon--spinning]="isRefreshing"
          [style.transform]="!isRefreshing ? 'rotate(' + (pullDistance * 5.5) + 'deg)' : ''"></i>

        <div class="ptr-labels">
          <span class="ptr-text">
            @if (isRefreshing) {
              Aggiornamento sessione...
            } @else if (pullDistance >= threshold) {
              Rilascia lo strappo!
            } @else {
              Tira per aggiornare
            }
          </span>
          <!-- Dynamic cord tension gauge -->
          <div class="ptr-gauge" *ngIf="!isRefreshing">
            <div class="ptr-gauge-fill" [style.width.%]="tensionPercent"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ptr-container {
      overflow: hidden;
      transition: height 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      margin-bottom: 8px;
      user-select: none;
      pointer-events: none;
    }

    .ptr-content {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 7px 18px;
      border-radius: 9999px;
      background: rgba(200, 16, 46, 0.12);
      border: 1px solid rgba(200, 16, 46, 0.35);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
      color: #ff3355;
      font-size: 12px;
      font-weight: 700;
      backdrop-filter: blur(12px);
      transition: all 0.15s ease;
    }

    .ptr-content--ready {
      background: rgba(200, 16, 46, 0.25);
      border-color: #ff1e46;
      box-shadow: 0 0 16px rgba(255, 30, 70, 0.6);
      color: #ffffff;
      transform: scale(1.04);
    }

    .ptr-icon {
      font-size: 16px;
      transition: transform 0.1s linear;
    }

    .ptr-icon--spinning {
      animation: ptr-spin 0.75s linear infinite;
    }

    .ptr-labels {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .ptr-text {
      line-height: 1.1;
      letter-spacing: 0.02em;
    }

    .ptr-gauge {
      width: 60px;
      height: 3px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.15);
      overflow: hidden;
    }

    .ptr-gauge-fill {
      height: 100%;
      background: linear-gradient(90deg, #ff5252, #ffffff);
      transition: width 0.05s linear;
      box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
    }

    @keyframes ptr-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class PullToRefreshComponent implements OnChanges {
  private haptic = inject(HapticService);
  private cdr = inject(ChangeDetectorRef);

  @Input() isRefreshing = false;
  @Output() refresh = new EventEmitter<() => void>();

  readonly threshold = 65;
  pullDistance = 0;

  private isTouching = false;
  private touchStartX = 0;
  private touchStartY = 0;
  private lastTensionStep = 0;
  private hasSnapped = false;
  private fallbackTimeout?: any;

  get tensionPercent(): number {
    return Math.min(100, Math.round((this.pullDistance / this.threshold) * 100));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isRefreshing']) {
      if (!changes['isRefreshing'].currentValue) {
        this.complete();
      } else {
        this.isRefreshing = true;
        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('window:touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    if (typeof window === 'undefined' || window.scrollY > 0 || this.isRefreshing) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('header, button, a, input, select, textarea, nav, [role="button"]')) {
      this.isTouching = false;
      return;
    }
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.isTouching = true;
    this.lastTensionStep = 0;
    this.hasSnapped = false;
  }

  @HostListener('window:touchmove', ['$event'])
  onTouchMove(e: TouchEvent): void {
    if (!this.isTouching || this.isRefreshing || typeof window === 'undefined') return;

    if (window.scrollY <= 0) {
      const diffX = Math.abs(e.touches[0].clientX - this.touchStartX);
      const diffY = e.touches[0].clientY - this.touchStartY;
      const deadzone = 16;
      if (diffY > deadzone && diffY > diffX * 1.2) {
        // Logarithmic / mechanical resistance curve after deadzone
        this.pullDistance = Math.min(85, (diffY - deadzone) * 0.42);

        // Tactile "rope ratchet" tick on every step
        const step = Math.floor(this.pullDistance / 13);
        if (step > this.lastTensionStep) {
          this.haptic.ropePullTick(step);
          this.lastTensionStep = step;
        }

        // Latch / Snap trigger when threshold crossed
        if (this.pullDistance >= this.threshold && !this.hasSnapped) {
          this.haptic.ropeSnap();
          this.hasSnapped = true;
        } else if (this.pullDistance < this.threshold && this.hasSnapped) {
          this.hasSnapped = false;
        }

        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('window:touchend')
  onTouchEnd(): void {
    if (!this.isTouching) return;
    this.isTouching = false;

    if (this.pullDistance === 0) return;

    if (this.pullDistance >= this.threshold && !this.isRefreshing) {
      this.isRefreshing = true;
      this.pullDistance = 50;
      this.cdr.markForCheck();
      this.refresh.emit(() => this.complete());

      // Auto-reset fallback after 2.8s in case network hangs or completes asynchronously
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = setTimeout(() => {
        if (this.isRefreshing) {
          this.complete();
        }
      }, 2800);
    } else {
      this.pullDistance = 0;
      this.cdr.markForCheck();
    }
  }

  complete(): void {
    clearTimeout(this.fallbackTimeout);
    this.isRefreshing = false;
    this.pullDistance = 0;
    this.hasSnapped = false;
    this.lastTensionStep = 0;
    this.haptic.success();
    this.cdr.markForCheck();
  }
}
