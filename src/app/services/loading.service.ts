import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private activeRequests = signal<number>(0);
  private isRouteNavigating = signal<boolean>(false);
  
  // Flag to know if initial app load has finished (useful for splash screen fast dismiss)
  readonly isInitialAppLoaded = signal<boolean>(false);

  // Observable state
  readonly isLoading = computed(() => this.activeRequests() > 0 || this.isRouteNavigating());

  startRequest(): void {
    this.activeRequests.update(count => count + 1);
  }

  stopRequest(): void {
    this.activeRequests.update(count => Math.max(0, count - 1));
  }

  setNavigating(isNavigating: boolean): void {
    this.isRouteNavigating.set(isNavigating);
  }

  markInitialAppLoaded(): void {
    this.isInitialAppLoaded.set(true);
  }
}
