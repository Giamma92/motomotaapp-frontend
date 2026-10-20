import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InAppNotificationService, InAppNotification } from '../../services/in-app-notification.service';
import { PushNotificationService } from '../../services/push-notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-bell-wrapper" (click)="toggleDropdown()">
      <button type="button" class="header-quick-link app-nav-chip app-nav-chip--light notification-bell-btn" aria-label="Notifiche">
        <i class="fa-solid fa-bell"></i>
        <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

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
      display: inline-block;
    }
    .notification-bell-btn {
      position: relative;
    }
    .notification-badge {
      position: absolute;
      top: -4px;
      right: -6px;
      background: #e53935;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
    }
    .notification-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 360px;
      max-height: 480px;
      background: var(--surface-card, #1e1e2f);
      border: 1px solid var(--border-medium, #333);
      border-radius: 12px;
      box-shadow: var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.4));
      z-index: 1000;
      display: flex;
      flex-direction: column;
      margin-top: 8px;
      overflow: hidden;
      color: var(--text-primary, #eee);
    }
    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      padding: 12px 16px;
      background: var(--surface-elevated, #22262e);
      border-bottom: 1px solid var(--border-subtle, #333);
    }
    .dropdown-title {
      font-weight: 700;
      font-size: 14px;
      color: var(--text-primary, #eee);
    }
    .dropdown-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mark-all-read-btn, .clear-read-btn {
      background: none;
      border: none;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: background 0.15s ease;
    }
    .mark-all-read-btn {
      color: var(--primary-color, #c8102e);
    }
    .mark-all-read-btn:hover {
      background: rgba(200, 16, 46, 0.08);
    }
    .clear-read-btn {
      color: #ef5350;
    }
    .clear-read-btn:hover {
      background: rgba(239,83,80,0.1);
    }
    .dropdown-body {
      overflow-y: auto;
      flex: 1;
      background: var(--surface-card, #1e1e2f);
    }
    .notification-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: var(--text-muted, #8b909c);
      gap: 8px;
    }
    .notification-empty i {
      font-size: 24px;
      color: var(--text-muted, #8b909c);
    }
    .notification-empty span {
      font-size: 13px;
    }
    .push-error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(239,83,80,0.1);
      color: #ef5350;
      font-size: 12px;
      border-top: 1px solid var(--border-subtle, #333);
    }
    .push-error i {
      font-size: 14px;
    }
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid var(--border-subtle, #2a2a3d);
    }
    .notification-item:hover {
      background: rgba(255,255,255,0.04);
    }
    .notification-item.unread {
      background: rgba(200, 16, 46, 0.06);
    }
    .notif-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-muted, #333);
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
      font-size: 11.5px;
      color: var(--text-muted, #8b909c);
    }
    .notif-unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color, #c8102e);
      flex-shrink: 0;
      margin-top: 4px;
    }

    /* Light Mode Overrides */
    :host-context([data-theme='light']) .notification-dropdown,
    :host-context(html[data-theme='light']) .notification-dropdown,
    [data-theme='light'] .notification-dropdown {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
      color: #111214;
    }
    :host-context([data-theme='light']) .dropdown-header,
    :host-context(html[data-theme='light']) .dropdown-header,
    [data-theme='light'] .dropdown-header {
      background: #fbfbfb;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }
    :host-context([data-theme='light']) .dropdown-title,
    :host-context(html[data-theme='light']) .dropdown-title,
    [data-theme='light'] .dropdown-title {
      color: #18181b;
    }
    :host-context([data-theme='light']) .dropdown-body,
    :host-context(html[data-theme='light']) .dropdown-body,
    [data-theme='light'] .dropdown-body {
      background: #ffffff;
    }
    :host-context([data-theme='light']) .notification-item,
    :host-context(html[data-theme='light']) .notification-item,
    [data-theme='light'] .notification-item {
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }
    :host-context([data-theme='light']) .notification-item:hover,
    :host-context(html[data-theme='light']) .notification-item:hover,
    [data-theme='light'] .notification-item:hover {
      background: rgba(0, 0, 0, 0.03);
    }
    :host-context([data-theme='light']) .notification-item.unread,
    :host-context(html[data-theme='light']) .notification-item.unread,
    [data-theme='light'] .notification-item.unread {
      background: rgba(200, 16, 46, 0.04);
    }
    :host-context([data-theme='light']) .notif-icon,
    :host-context(html[data-theme='light']) .notif-icon,
    [data-theme='light'] .notif-icon {
      background: #f4f4f5;
      color: #c8102e;
    }
    :host-context([data-theme='light']) .notif-title,
    :host-context(html[data-theme='light']) .notif-title,
    [data-theme='light'] .notif-title {
      color: #18181b;
    }
    :host-context([data-theme='light']) .notif-body,
    :host-context(html[data-theme='light']) .notif-body,
    [data-theme='light'] .notif-body {
      color: #52525b;
    }
    :host-context([data-theme='light']) .notif-time,
    :host-context(html[data-theme='light']) .notif-time,
    [data-theme='light'] .notif-time {
      color: #71717a;
    }

    @media (max-width: 480px) {
      .notification-dropdown {
        position: fixed;
        top: var(--app-header-height, 56px);
        left: 0;
        right: 0;
        width: 100%;
        max-height: calc(100vh - var(--app-header-height, 56px));
        border-radius: 0;
        margin-top: 0;
      }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
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
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.pushService.requestSubscription();
    }
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
      this.notificationService.pollNow();
    });
  }

  deleteRead(): void {
    this.notificationService.deleteReadNotifications().subscribe(() => {
      this.notificationService.pollNow();
    });
  }

  openNotification(notif: InAppNotification): void {
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
