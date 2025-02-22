import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallPromptComponent } from "./components/intall-prompt/install-prompt.component";
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { UpdateService } from './services/update.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallPromptComponent, UpdateNotificationComponent],
  template: `<app-update-notification></app-update-notification>
            <app-install-prompt></app-install-prompt>
            <router-outlet></router-outlet>`,
})
export class AppComponent {
  constructor(private updateService: UpdateService) {}
}
