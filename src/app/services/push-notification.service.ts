import { Injectable, OnDestroy } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService implements OnDestroy {
  private sub?: Subscription;
  private currentEndpoint?: string;

  constructor(
    private swPush: SwPush,
    private httpService: HttpService,
    private authService: AuthService
  ) {
    if (this.authService.getToken() && this.swPush.isEnabled) {
      this.trySubscribe();
    }
  }

  async trySubscribe(): Promise<void> {
    if (!this.swPush.isEnabled) return;

    try {
      const sub = await this.swPush.subscription;
      if (sub) {
        this.currentEndpoint = sub.endpoint;
        return;
      }

      const { publicKey } = await this.httpService
        .genericGet<{ publicKey: string }>('push/vapid-public-key')
        .toPromise();

      if (!publicKey) return;

      const newSub = await this.swPush.requestSubscription({
        serverPublicKey: publicKey
      });

      this.currentEndpoint = newSub.endpoint;

      await this.httpService
        .genericPost('push/subscribe', {
          endpoint: newSub.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(newSub.getKey('p256dh')),
            auth: this.arrayBufferToBase64(newSub.getKey('auth'))
          }
        })
        .toPromise();
    } catch (err) {
      console.warn('Push subscription failed:', err);
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.currentEndpoint || !this.swPush.isEnabled) return;

    try {
      await this.httpService
        .genericPost('push/unsubscribe', { endpoint: this.currentEndpoint })
        .toPromise();

      const sub = await this.swPush.subscription;
      if (sub) {
        await sub.unsubscribe();
      }

      this.currentEndpoint = undefined;
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
    this.sub?.unsubscribe();
  }
}
