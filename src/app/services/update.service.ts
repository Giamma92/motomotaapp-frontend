import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private updateAvailableSubject = new BehaviorSubject<boolean>(false);
  updateAvailable$ = this.updateAvailableSubject.asObservable();

  constructor(private swUpdate: SwUpdate) {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe(event => {
        if (event.type === 'VERSION_READY') {
          this.updateAvailableSubject.next(true);
        }
      });
    }
  }

  reloadApp() {
    this.updateAvailableSubject.next(false);
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
