import { Injectable, NgZone } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private updateAvailableSubject = new BehaviorSubject<boolean>(false);
  updateAvailable$ = this.updateAvailableSubject.asObservable();

  constructor(
    private swUpdate: SwUpdate,
    private ngZone: NgZone
  ) {
    if (this.swUpdate.isEnabled) {
      // Ascolta le nuove versioni pronte per l'attivazione
      this.swUpdate.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(evt => {
          console.log('[UpdateService] Nuova versione pronta:', evt.latestVersion.hash);
          this.ngZone.run(() => {
            this.updateAvailableSubject.next(true);
          });
        });

      // Esegui controlli periodici e listener fuori da NgZone per non bloccare la stabilità dell'app
      this.ngZone.runOutsideAngular(() => {
        // Controllo iniziale dopo 4 secondi dall'avvio
        setTimeout(() => this.checkForUpdate(), 4000);

        // Controllo periodico ogni 15 minuti
        setInterval(() => this.checkForUpdate(), 15 * 60 * 1000);

        // Controllo quando l'utente torna sulla finestra/scheda o riapre l'app PWA
        if (typeof document !== 'undefined') {
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              this.checkForUpdate();
            }
          });
        }

        if (typeof window !== 'undefined') {
          window.addEventListener('focus', () => {
            this.checkForUpdate();
          });
        }
      });
    }
  }

  checkForUpdate(): void {
    if (!this.swUpdate.isEnabled) return;
    this.swUpdate.checkForUpdate().then(hasUpdate => {
      if (hasUpdate) {
        console.log('[UpdateService] Trovato nuovo aggiornamento sul server, download in corso...');
      }
    }).catch(err => {
      console.warn('[UpdateService] Controllo aggiornamenti fallito:', err);
    });
  }

  reloadApp() {
    this.updateAvailableSubject.next(false);
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
