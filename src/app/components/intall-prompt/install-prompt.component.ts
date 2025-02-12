import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-install-prompt',
  template: `
  @if (deferredPrompt) {
    <div [@slideDown] class="install-prompt">
      <p>Add Fanta MotoGP to your home screen for a better experience!</p>
      <button (click)="promptInstallation()">Install</button>
      <button (click)="dismiss()">Dismiss</button>
    </div>
  }
  `,
  styles: [`
    .install-prompt {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #fff;
      color: #333;
      padding: 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      z-index: 99999;
    }
    .install-prompt p {
      margin: 0 0 8px;
      font-size: 16px;
    }
    .install-prompt button {
      background-color: #d81b60;
      border: none;
      color: #fff;
      padding: 8px 16px;
      margin: 0 8px;
      cursor: pointer;
      font-size: 14px;
      border-radius: 4px;
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class InstallPromptComponent implements OnInit {
  deferredPrompt: any = null;

  ngOnInit() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile.
      e.preventDefault();
      // Save the event for later use and show the prompt UI.
      this.deferredPrompt = e;
      console.log('Install prompt event captured', e);
    });
  }

  promptInstallation() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult: any) => {
        console.log(`User response to the install prompt: ${choiceResult.outcome}`);
        // Optionally, hide the prompt after the user makes a choice.
        this.deferredPrompt = null;
      });
    }
  }

  dismiss() {
    // Optionally dismiss the prompt UI without triggering it.
    this.deferredPrompt = null;
  }
}
