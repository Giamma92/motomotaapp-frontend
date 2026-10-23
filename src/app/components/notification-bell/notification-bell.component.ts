import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InAppNotificationService, InAppNotification } from '../../services/in-app-notification.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { HapticService } from '../../services/haptic.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-bell-wrapper" (click)="toggleDropdown()">
      <button
        type="button"
        class="notification-bell-btn"
        [class.has-unread]="unreadCount > 0"
        aria-label="Notifiche">
        <i class="fa-solid fa-bell"></i>
        <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <!-- Mobile Backdrop Overlay -->
      <div class="notification-backdrop" *ngIf="isOpen" (click)="closeDropdown($event)"></div>

      <div class="notification-dropdown" *ngIf="isOpen" (click)="$event.stopPropagation()">
        <div class="dropdown-header">
          <span class="dropdown-title">Notifiche</span>
          <div class="dropdown-actions">
            <button class="mark-all-read-btn" *ngIf="unreadCount > 0" (click)="markAllRead()">
              Segna tutte come lette
            </button>
            <button class="clear-read-btn" *ngIf="notifications.length > 0" (click)="deleteRead()">
              Cancella lette
            </button>
          </div>
        </div>

        <div class="dropdown-body">
          <div class="notification-empty" *ngIf="notifications.length === 0">
            <i class="fa-solid fa-bell-slash"></i>
            <span>Nessuna notifica</span>
          </div>

          <div class="push-error" *ngIf="pushError">
            <i class="fa-solid fa-circle-exclamation"></i>
            <span>{{ pushError }}</span>
          </div>

          <div
            class="notification-item"
            *ngFor="let notif of notifications.slice(0, 20)"
            [class.unread]="!notif.is_read"
            (click)="openNotification(notif)"
          >
            <div class="notif-icon">
              <i class="fa-solid" [ngClass]="getIcon(notif.category)"></i>
            </div>
            <div class="notif-content">
              <div class="notif-title">{{ notif.title }}</div>
              <div class="notif-body" *ngIf="notif.body">{{ notif.body }}</div>
              <div class="notif-time">{{ formatTime(notif.created_at) }}</div>
            </div>
            <div class="notif-unread-dot" *ngIf="!notif.is_read"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-bell-wrapper {
      position: relative;
      display: inline-flex;
      align-items: center;
    }
    .notification-bell-btn {
      position: relative;
      width: 32px;
      height: 32px;
      padding: 0;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        0 2px 6px rgba(0, 0, 0, 0.25);
      color: rgba(255, 255, 255, 0.9);
      cursor: pointer;
      user-select: none;
      transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
      flex-shrink: 0;

      @media (min-width: 640px) {
        width: 34px;
        height: 34px;
        border-radius: 11px;
      }
    }
    .notification-bell-btn i {
      font-size: 13px;
      line-height: 1;
    }
    .notification-bell-btn:hover {
      transform: translateY(-1px);
      border-color: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      background: rgba(255, 255, 255, 0.12);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.25),
        0 4px 10px rgba(0, 0, 0, 0.35);
    }
    .notification-bell-btn:active {
      transform: scale(0.92);
    }
    :host-context([data-theme='light']) .notification-bell-btn {
      border: 1px solid rgba(0, 0, 0, 0.08);
      background: rgba(0, 0, 0, 0.04);
      color: #1e293b;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.9),
        0 2px 6px rgba(0, 0, 0, 0.04);
    }
    :host-context([data-theme='light']) .notification-bell-btn:hover {
      border-color: rgba(0, 0, 0, 0.15);
      color: #0f172a;
      background: rgba(0, 0, 0, 0.07);
    }
    .notification-bell-btn.has-unread i.fa-bell {
      animation: bell-swing 3.2s ease-in-out infinite;
      transform-origin: top center;
      color: #ef4444;
    }
    @keyframes bell-swing {
      0%, 80%, 100% { transform: rotate(0); }
      83% { transform: rotate(15deg); }
      86% { transform: rotate(-13deg); }
      89% { transform: rotate(11deg); }
      92% { transform: rotate(-7deg); }
      95% { transform: rotate(3deg); }
    }
    .notification-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      background: #e11d48;
      color: #fff;
      font-size: 8.5px;
      font-weight: 800;
      line-height: 1;
      min-width: 15px;
      height: 15px;
      padding: 0 3px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border: 1.5px solid #0b0d13;
      box-shadow: 0 0 8px rgba(225, 29, 72, 0.7);
      animation: badge-breathe 2.4s ease-in-out infinite;
      pointer-events: none;
    }
    :host-context([data-theme='light']) .notification-badge {
      border-color: #ffffff;
    }
    @keyframes badge-breathe {
      0%, 100% { transform: scale(1); box-shadow: 0 0 8px rgba(200, 16, 46, 0.6); }
      50% { transform: scale(1.1); box-shadow: 0 0 16px rgba(200, 16, 46, 0.95); }
    }
    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 360px;
      max-height: 480px;
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.02) 60%, transparent 100%),
        linear-gradient(165deg, rgba(26, 30, 40, 0.88) 0%, rgba(16, 18, 24, 0.94) 100%);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 0.25),
        0 24px 60px -12px rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      margin-top: 10px;
      overflow: hidden;
      color: var(--text-primary, #eee);
      animation: dropdown-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transform-origin: top right;
    }
    @keyframes dropdown-enter {
      from { opacity: 0; transform: translateY(-8px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 14px 18px;
      background: rgba(30, 34, 46, 0.65);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .dropdown-title {
      font-weight: 800;
      font-size: 14px;
      color: var(--text-primary, #eee);
      letter-spacing: 0.3px;
      text-transform: uppercase;
      font-family: 'MotoGP Bold', sans-serif;
    }
    .dropdown-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mark-all-read-btn, .clear-read-btn {
      background: none;
      border: none;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.18s ease;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .mark-all-read-btn {
      color: var(--primary-color, #c8102e);
    }
    .mark-all-read-btn:hover {
      background: rgba(200, 16, 46, 0.12);
    }
    .clear-read-btn {
      color: #ef5350;
    }
    .clear-read-btn:hover {
      background: rgba(239, 83, 80, 0.12);
    }
    .dropdown-body {
      overflow-y: auto;
      flex: 1;
      background: transparent;
    }
    .notification-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 36px 16px;
      color: var(--text-muted, #8b909c);
      gap: 10px;
    }
    .notification-empty i {
      font-size: 26px;
      color: var(--text-muted, #8b909c);
    }
    .notification-empty span {
      font-size: 13px;
      font-weight: 600;
    }
    .push-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(239, 83, 80, 0.12);
      color: #ef5350;
      font-size: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .push-error i {
      font-size: 14px;
    }
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 18px;
      cursor: pointer;
      transition: background 0.18s ease, transform 0.18s ease;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .notification-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .notification-item:active {
      transform: scale(0.99);
    }
    .notification-item.unread {
      background: rgba(200, 16, 46, 0.08);
    }
    .notif-icon {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: var(--primary-color, #c8102e);
      font-size: 14px;
    }
    .notif-content {
      flex: 1;
      min-width: 0;
    }
    .notif-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary, #eee);
      margin-bottom: 2px;
    }
    .notif-body {
      font-size: 12px;
      color: var(--text-secondary, #999);
      margin-bottom: 4px;
      line-height: 1.35;
    }
    .notif-time {
      font-size: 11px;
      color: var(--text-muted, #777);
    }
    .notif-unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #c8102e;
      flex-shrink: 0;
      margin-top: 6px;
      box-shadow: 0 0 8px #c8102e;
    }

    /* Light Theme */
    [data-theme='light'] .notification-dropdown {
      background:
        radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.2) 60%, transparent 100%),
        linear-gradient(165deg, rgba(255, 255, 255, 0.94) 0%, rgba(244, 246, 250, 0.97) 100%);
      border-color: rgba(0, 0, 0, 0.1);
      box-shadow:
        inset 0 1px 1px 0 rgba(255, 255, 255, 1),
        0 20px 48px -10px rgba(0, 0, 0, 0.18);
    }
    [data-theme='light'] .dropdown-header {
      background: rgba(245, 247, 250, 0.8);
      border-bottom-color: rgba(0, 0, 0, 0.06);
    }
    [data-theme='light'] .dropdown-title {
      color: #18181b;
    }
    [data-theme='light'] .notification-item {
      border-bottom-color: rgba(0, 0, 0, 0.05);
    }
    [data-theme='light'] .notification-item:hover {
      background: rgba(0, 0, 0, 0.03);
    }
    [data-theme='light'] .notification-item.unread {
      background: rgba(200, 16, 46, 0.04);
    }
    [data-theme='light'] .notif-icon {
      background: #f4f4f5;
      color: #c8102e;
      border-color: rgba(0, 0, 0, 0.06);
    }
    [data-theme='light'] .notif-title {
      color: #18181b;
    }
    [data-theme='light'] .notif-body {
      color: #52525b;
    }
    [data-theme='light'] .notif-time {
      color: #71717a;
    }

    .notification-backdrop {
      display: none;
    }

    @media (max-width: 480px) {
      .notification-backdrop {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 1050;
      }
      .notification-dropdown {
        position: fixed;
        top: calc(env(safe-area-inset-top, 0px) + 16px);
        left: 12px;
        right: 12px;
        width: auto;
        max-height: calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 60px);
        border-radius: 24px;
        margin-top: 0;
        z-index: 1060;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.85);
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private haptic = inject(HapticService);
  isOpen = false;
  unreadCount = 0;
  notifications: InAppNotification[] = [];
  pushError: string | null = null;

  private unreadSub?: Subscription;
  private notifSub?: Subscription;
  private pushSub?: Subscription;
  private closeHandler?: (e: MouseEvent) => void;

  constructor(
    private notificationService: InAppNotificationService,
    private pushService: PushNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.unreadSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.notifSub = this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
    });

    this.pushSub = this.pushService.status$.subscribe(s => {
      if (s.error) this.pushError = s.error;
    });

    this.notificationService.pollNow();

    this.closeHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.notification-bell-wrapper')) {
        this.isOpen = false;
      }
    };
    document.addEventListener('click', this.closeHandler);
  }

  ngOnDestroy(): void {
    this.unreadSub?.unsubscribe();
    this.notifSub?.unsubscribe();
    this.pushSub?.unsubscribe();
    if (this.closeHandler) {
      document.removeEventListener('click', this.closeHandler);
    }
  }

  toggleDropdown(): void {
    this.haptic.light();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.pushService.requestSubscription();
    }
  }

  closeDropdown(e?: Event): void {
    e?.stopPropagation();
    this.isOpen = false;
  }

  markAllRead(): void {
    this.haptic.success();
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.pollNow();
    });
  }

  deleteRead(): void {
    this.haptic.light();
    this.notificationService.deleteReadNotifications().subscribe(() => {
      this.notificationService.pollNow();
    });
  }

  openNotification(notif: InAppNotification): void {
    this.haptic.light();
    if (!notif.is_read) {
      this.notificationService.markAsRead(notif.id).subscribe(() => {
        this.notificationService.pollNow();
      });
    }

    this.isOpen = false;

    if (notif.link) {
      this.router.navigateByUrl(notif.link);
    }
  }

  getIcon(category: string): string {
    switch (category) {
      case 'lineup': return 'fa-flag-checkered';
      case 'score_update': return 'fa-chart-line';
      case 'standing_change': return 'fa-ranking-star';
      case 'race_cancelled': return 'fa-ban';
      default: return 'fa-circle-info';
    }
  }

  formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Adesso';
    if (diffMin < 60) return `${diffMin}m fa`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h fa`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD}g fa`;

    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  }
}
