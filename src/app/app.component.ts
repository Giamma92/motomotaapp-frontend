import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InstallPromptComponent } from "./components/intall-prompt/install-prompt.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, InstallPromptComponent],
  template: `<app-install-prompt></app-install-prompt>
            <router-outlet></router-outlet>`,
})
export class AppComponent {}
