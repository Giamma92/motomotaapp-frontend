import { Injectable, NgZone } from '@angular/core';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

export interface PushStatus {
  swAvailable: boolean;
  swRegistered: boolean;
  swReady: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private cachedPublicKey?: string;
  private currentSub?: PushSubscription;

  private statusSubject = new BehaviorSubject<PushStatus>({
    swAvailable: 'serviceWorker' in navigator,
    swRegistered: false,
    swReady: false,
    permission: 'unsupported',
    subscribed: false,
    error: null
  });
  status$ = this.statusSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private zone: NgZone
  ) {
    if (!this.authService.getToken()) return;
    this.init();
  }

  private async init(): Promise<void> {
    const swOk = 'serviceWorker' in navigator;
    if (!swOk) return;

    const perm = Notification.permission as NotificationPermission;
    this.updateStatus({ permission: perm });

    // Pre-cache VAPID key early so requestSubscription has no async dependency
    this.cacheVapidKey();

    // Check existing subscription
    try {
      const reg = await navigator.serviceWorker.ready;
      this.updateStatus({ swReady: true });

      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        this.currentSub = sub;
        this.updateStatus({ subscribed: true });
      }
    } catch {
      // SW not ready yet
    }
  }

  private async cacheVapidKey(): Promise<void> {
    try {
      const resp = await this.httpService.genericGet<{ publicKey: string }>('push/vapid-public-key').toPromise();
      if (!resp) {
        this.updateStatus({ error: 'Nessuna risposta dal server (verifica deploy backend)' });
        return;
      }
      this.cachedPublicKey = resp.publicKey;
      if (!this.cachedPublicKey) {
        this.updateStatus({ error: 'Chiave VAPID mancante nel backend (aggiungi VAPID_PUBLIC_KEY su Vercel)' });
      }
    } catch {
      this.updateStatus({ error: 'Impossibile contattare il backend (verifica URL API e CORS)' });
    }
  }

  async requestSubscription(): Promise<boolean> {
    const status = this.statusSubject.value;
    if (!status.swAvailable) {
      this.updateStatus({ error: 'Service Worker non supportato' });
      return false;
    }
    if (status.subscribed && this.currentSub) return true;

    try {
      // 1) Wait for SW to be ready (this is fine, it resolves immediately if already active)
      const reg = await navigator.serviceWorker.ready;
      this.updateStatus({ swReady: true });

      // 2) Get or fetch VAPID key
      let key = this.cachedPublicKey;
      if (!key) {
        try {
          const resp = await this.httpService.genericGet<{ publicKey: string }>('push/vapid-public-key').toPromise();
          key = resp?.publicKey;
          this.cachedPublicKey = key;
        } catch {
          this.updateStatus({ error: 'Errore nel recupero della chiave VAPID (backend non raggiungibile)' });
          return false;
        }
      }
      if (!key) {
        this.updateStatus({ error: 'Chiave VAPID non configurata su Vercel (manca VAPID_PUBLIC_KEY)' });
        return false;
      }

      // 3) Subscribe using raw Push API (no SwPush dependency)
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(key) as BufferSource | string
      });

      this.currentSub = sub;

      // 4) Save subscription to backend
      await this.httpService.genericPost('push/subscribe', {
        endpoint: sub.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(sub.getKey('p256dh')),
          auth: this.arrayBufferToBase64(sub.getKey('auth'))
        }
      }).toPromise();

      this.updateStatus({ subscribed: true, error: null });
      return true;
    } catch (err: any) {
      this.updateStatus({ error: err?.message || err?.toString() || 'Errore sconosciuto' });
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.currentSub) return;

    try {
      await this.httpService.genericPost('push/unsubscribe', { endpoint: this.currentSub.endpoint }).toPromise();
      await this.currentSub.unsubscribe();
      this.currentSub = undefined;
      this.updateStatus({ subscribed: false, error: null });
    } catch (err: any) {
      this.updateStatus({ error: err?.message || 'Errore unsubscribe' });
    }
  }

  private updateStatus(partial: Partial<PushStatus>): void {
    this.zone.run(() => {
      this.statusSubject.next({ ...this.statusSubject.value, ...partial });
    });
  }

  private urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(b64);
    return Uint8Array.from([...raw].map(ch => ch.charCodeAt(0)));
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
}
