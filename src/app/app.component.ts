import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallPromptComponent } from "./components/intall-prompt/install-prompt.component";
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { AppBottomNavComponent } from './components/app-nav/app-bottom-nav.component';
import { SessionTimerComponent } from './components/session-timer/session-timer.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { UpdateService } from './services/update.service';
import { I18nService } from './services/i18n.service';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InstallPromptComponent, UpdateNotificationComponent, AppBottomNavComponent, SessionTimerComponent, SplashScreenComponent],
  template: `
    <app-splash-screen></app-splash-screen>
    <app-update-notification></app-update-notification>
    <app-session-timer></app-session-timer>
    <app-install-prompt></app-install-prompt>
    <router-outlet></router-outlet>
    <app-bottom-nav></app-bottom-nav>
  `
})
export class AppComponent {
  constructor(
    private updateService: UpdateService,
    private i18n: I18nService
  ) {
    // Initialize i18n with current language first
    this.i18n.init();

    // Wait for initial language to load, then preload others
    timer(100).pipe(
      switchMap(() => this.i18n.preloadLanguages(['en', 'it']))
    ).subscribe({
      error: (err) => console.warn('Failed to preload some languages:', err)
    });
  }
}
