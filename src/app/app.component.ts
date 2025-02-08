import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<router-outlet></router-outlet>`,
  // Import necessary modules that this component (and its children via routing) might use
  imports: [RouterOutlet]
})
export class AppComponent {}
