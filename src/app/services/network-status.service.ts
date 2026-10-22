import { Injectable, signal, inject } from '@angular/core';
import { HapticService } from './haptic.service';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {
  private haptic = inject(HapticService);

  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly wasOffline = signal<boolean>(false);
  readonly showReconnectedBanner = signal<boolean>(false);

  private reconnectedTimeout: any;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        if (this.wasOffline()) {
          this.haptic.light();
          this.showReconnectedBanner.set(true);
          clearTimeout(this.reconnectedTimeout);
          this.reconnectedTimeout = setTimeout(() => {
            this.showReconnectedBanner.set(false);
            this.wasOffline.set(false);
          }, 3200);
        }
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
        this.wasOffline.set(true);
        this.showReconnectedBanner.set(false);
        this.haptic.medium();
      });
    }
  }
}
