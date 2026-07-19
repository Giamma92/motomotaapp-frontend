import { Injectable, OnDestroy, Inject } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';

export interface InAppNotification {
  id: number;
  user_id: string;
  championship_id?: number;
  category: string;
  title: string;
  body?: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  read_at?: string;
}

export interface NotificationSettings {
  lineup: boolean;
  score_update: boolean;
  standing_change: boolean;
  race_cancelled: boolean;
  general: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService implements OnDestroy {
  private unreadCountSubject = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<InAppNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private pollingSubscription?: Subscription;

  constructor(
    private httpService: HttpService,
    private authService: AuthService
  ) {
    this.startPolling();
  }

  startPolling(intervalMs = 30000): void {
    this.pollNow();
    this.pollingSubscription = interval(intervalMs).subscribe(() => this.pollNow());
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = undefined;
  }

  pollNow(): void {
    this.httpService.genericGet<InAppNotification[]>('notifications?unreadOnly=false&limit=50')
      .subscribe({
        next: (notifications) => this.notificationsSubject.next(notifications),
        error: () => {}
      });
    this.httpService.genericGet<{ count: number }>('notifications/unread-count')
      .subscribe({
        next: (res) => this.unreadCountSubject.next(res.count),
        error: () => {}
      });
  }

  markAsRead(id: number): Observable<InAppNotification> {
    return this.httpService.genericPut<InAppNotification>(`notifications/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ success: boolean }> {
    return this.httpService.genericPut<{ success: boolean }>('notifications/read-all', {});
  }

  deleteReadNotifications(): Observable<{ success: boolean }> {
    return this.httpService.genericDelete<{ success: boolean }>('notifications/read');
  }

  getSettings(championshipId: number): Observable<NotificationSettings> {
    return this.httpService.genericGet<NotificationSettings>(`notification-settings/${championshipId}`);
  }

  updateSettings(championshipId: number, settings: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.httpService.genericPut<NotificationSettings>(`notification-settings/${championshipId}`, settings);
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}
