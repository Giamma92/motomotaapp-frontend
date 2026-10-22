import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallPromptComponent } from "./components/intall-prompt/install-prompt.component";
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { AppBottomNavComponent } from './components/app-nav/app-bottom-nav.component';
import { SessionTimerComponent } from './components/session-timer/session-timer.component';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { RedlineProgressBarComponent } from './components/redline-progress-bar/redline-progress-bar.component';
import { NetworkBannerComponent } from './components/network-banner/network-banner.component';
import { AppTopNavComponent } from './components/app-nav/app-top-nav.component';
import { UpdateService } from './services/update.service';
import { I18nService, ALLOWED_LANGUAGES } from './services/i18n.service';
import { AuthService } from './services/auth.service';
import { UserSettingsService } from './services/user-settings.service';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    InstallPromptComponent,
    UpdateNotificationComponent,
    AppBottomNavComponent,
    AppTopNavComponent,
    SessionTimerComponent,
    SplashScreenComponent,
    RedlineProgressBarComponent,
    NetworkBannerComponent
  ],
  template: `
    <app-redline-progress-bar></app-redline-progress-bar>
    <app-network-banner></app-network-banner>
    <app-top-nav></app-top-nav>
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
    private i18n: I18nService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {
    // 1. Initialize i18n with cached or browser language
    this.i18n.init();

    // 2. If user is authenticated, sync their preferred language from DB
    if (this.authService.getToken()) {
      this.userSettingsService.getUserSettings().subscribe({
        next: (settings) => {
          if (settings?.language && ALLOWED_LANGUAGES.includes(settings.language) && settings.language !== this.i18n.currentLanguage) {
            this.i18n.setLanguage(settings.language).subscribe();
          }
        },
        error: () => {}
      });
    }

    // 3. Preload all supported languages in the background for instant switching
    timer(300).pipe(
      switchMap(() => this.i18n.preloadLanguages(ALLOWED_LANGUAGES))
    ).subscribe({
      error: (err) => console.warn('Failed to preload some languages:', err)
    });
  }
}
