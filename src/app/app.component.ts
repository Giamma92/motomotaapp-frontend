import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { InstallPromptComponent } from "./components/intall-prompt/install-prompt.component";
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { UpdateService } from './services/update.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallPromptComponent, UpdateNotificationComponent],
  template: `<app-update-notification></app-update-notification>
            <app-install-prompt></app-install-prompt>
            <router-outlet></router-outlet>`,
})
export class AppComponent {
  constructor(private updateService: UpdateService, private router: Router) {
    this.router.events
      .pipe(filter((event: any) => event instanceof NavigationEnd))
      .subscribe(() => {
        window.scrollTo({ top: 0, behavior: 'auto' });
      });
  }
}
