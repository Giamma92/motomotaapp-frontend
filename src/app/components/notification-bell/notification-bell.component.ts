import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { InAppNotificationService, InAppNotification } from '../../services/in-app-notification.service';
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
          <button class="mark-all-read-btn" *ngIf="unreadCount > 0" (click)="markAllRead()">
            Segna tutte come lette
          </button>
        </div>

        <div class="dropdown-body">
          <div class="notification-empty" *ngIf="notifications.length === 0">
            <i class="fa-solid fa-bell-slash"></i>
            <span>Nessuna notifica</span>
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
      background: #1e1e2f;
      border: 1px solid #333;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      margin-top: 8px;
      overflow: hidden;
    }
    .dropdown-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #333;
    }
    .dropdown-title {
      font-weight: 600;
      font-size: 14px;
      color: #eee;
    }
    .mark-all-read-btn {
      background: none;
      border: none;
      color: #90caf9;
      font-size: 12px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
    }
    .mark-all-read-btn:hover {
      background: rgba(144,202,249,0.1);
    }
    .dropdown-body {
      overflow-y: auto;
      flex: 1;
    }
    .notification-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
      color: #666;
      gap: 8px;
    }
    .notification-empty i {
      font-size: 24px;
    }
    .notification-empty span {
      font-size: 13px;
    }
    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      transition: background 0.15s;
      border-bottom: 1px solid #2a2a3d;
    }
    .notification-item:hover {
      background: rgba(255,255,255,0.04);
    }
    .notification-item.unread {
      background: rgba(144,202,249,0.06);
    }
    .notif-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #90caf9;
      font-size: 14px;
    }
    .notif-content {
      flex: 1;
      min-width: 0;
    }
    .notif-title {
      font-size: 13px;
      font-weight: 600;
      color: #eee;
      margin-bottom: 2px;
    }
    .notif-body {
      font-size: 12px;
      color: #999;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .notif-time {
      font-size: 11px;
      color: #666;
    }
    .notif-unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #42a5f5;
      flex-shrink: 0;
      margin-top: 4px;
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

  private unreadSub?: Subscription;
  private notifSub?: Subscription;
  private closeHandler?: (e: MouseEvent) => void;

  constructor(
    private notificationService: InAppNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.unreadSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.notifSub = this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs;
    });

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
    if (this.closeHandler) {
      document.removeEventListener('click', this.closeHandler);
    }
  }

  toggleDropdown(): void {
    this.isOpen = !this.isOpen;
  }

  markAllRead(): void {
    this.notificationService.markAllAsRead().subscribe(() => {
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
      case 'race_bet': return 'fa-money-bill';
      case 'sprint_bet': return 'fa-bolt';
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
