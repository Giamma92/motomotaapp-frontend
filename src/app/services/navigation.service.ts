import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  private history: string[] = [];
  private router = inject(Router);

  constructor() {
    if (this.router.url) {
      this.history.push(this.router.url);
    }

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        const last = this.history[this.history.length - 1];
        if (last !== url) {
          this.history.push(url);
          if (this.history.length > 30) {
            this.history.shift();
          }
        }
      }
    });
  }

  /**
   * Navigate back to the previous screen in history, or fallback if history is empty.
   */
  back(fallbackUrl: string = '/'): void {
    const currentUrl = this.router.url;
    while (this.history.length > 0 && this.history[this.history.length - 1] === currentUrl) {
      this.history.pop();
    }

    const previousUrl = this.history.pop();
    if (previousUrl && previousUrl !== '/login' && previousUrl !== '/reset-password') {
      this.router.navigateByUrl(previousUrl);
    } else {
      this.router.navigateByUrl(fallbackUrl);
    }
  }
}
