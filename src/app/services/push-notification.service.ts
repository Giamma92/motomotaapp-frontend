import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Subject, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService implements OnDestroy {
  private currentEndpoint?: string;
  private cachedPublicKey?: string;

  private subscribedSubject = new Subject<boolean>();
  subscribed$ = this.subscribedSubject.asObservable();

  get isSwEnabled(): boolean {
    return this.swPush.isEnabled;
  }

  get isSubscribed(): boolean {
    return !!this.currentEndpoint;
  }

  constructor(
    private swPush: SwPush,
    private httpService: HttpService,
    private authService: AuthService,
    private zone: NgZone
  ) {
    if (!this.authService.getToken() || !this.swPush.isEnabled) return;
    this.checkExistingSubscription();
    this.cacheVapidKey();
  }

  private async checkExistingSubscription(): Promise<void> {
    try {
      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        this.currentEndpoint = sub.endpoint;
        this.zone.run(() => this.subscribedSubject.next(true));
      }
    } catch {
      // no existing subscription
    }
  }

  private async cacheVapidKey(): Promise<void> {
    try {
      const resp = await firstValueFrom(
        this.httpService.genericGet<{ publicKey: string }>('push/vapid-public-key')
      );
      this.cachedPublicKey = resp?.publicKey;
    } catch {
      // will retry on requestSubscription
    }
  }

  async requestSubscription(): Promise<boolean> {
    if (!this.swPush.isEnabled) return false;
    if (this.currentEndpoint) return true;

    if (!this.cachedPublicKey) {
      try {
        const resp = await firstValueFrom(
          this.httpService.genericGet<{ publicKey: string }>('push/vapid-public-key')
        );
        this.cachedPublicKey = resp?.publicKey;
      } catch {
        return false;
      }
    }

    try {
      const newSub = await this.swPush.requestSubscription({
        serverPublicKey: this.cachedPublicKey
      });

      this.currentEndpoint = newSub.endpoint;

      await firstValueFrom(
        this.httpService.genericPost('push/subscribe', {
          endpoint: newSub.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(newSub.getKey('p256dh')),
            auth: this.arrayBufferToBase64(newSub.getKey('auth'))
          }
        })
      );

      this.zone.run(() => this.subscribedSubject.next(true));
      return true;
    } catch (err) {
      console.warn('Push subscription failed:', err);
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.currentEndpoint || !this.swPush.isEnabled) return;

    try {
      await firstValueFrom(
        this.httpService.genericPost('push/unsubscribe', { endpoint: this.currentEndpoint })
      );

      const sub = await firstValueFrom(this.swPush.subscription);
      if (sub) {
        await sub.unsubscribe();
      }

      this.currentEndpoint = undefined;
      this.zone.run(() => this.subscribedSubject.next(false));
    } catch (err) {
      console.warn('Push unsubscribe failed:', err);
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  ngOnDestroy(): void {
    // nothing to clean up
  }
}
