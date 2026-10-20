import { Component, OnInit } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-install-prompt',
  template: `
  @if (deferredPrompt && !isDismissed) {
    <div [@slideDown] class="install-prompt">
      <div class="install-copy">
        <i class="fa-solid fa-mobile-screen-button install-icon"></i>
        <span>Installa <strong>Fanta MotoGP</strong> per un'esperienza migliore</span>
      </div>
      <div class="install-actions">
        <button class="btn-install" (click)="promptInstallation()">Installa</button>
        <button class="btn-dismiss" (click)="dismiss()" aria-label="Chiudi"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
  }
  `,
  styles: [`
    .install-prompt {
      position: fixed;
      bottom: calc(var(--app-bottom-nav-height, 68px) + 12px);
      left: 12px;
      right: 12px;
      max-width: 420px;
      margin: 0 auto;
      background: rgba(18, 20, 24, 0.94);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #fff;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-radius: 18px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
      z-index: 45;
    }
    .install-copy {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11.5px;
      color: #f4f4f5;
      min-width: 0;
    }
    .install-icon {
      color: #c8102e;
      font-size: 14px;
      flex-shrink: 0;
    }
    .install-copy span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .install-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }
    .btn-install {
      background-color: #c8102e;
      border: none;
      color: #fff;
      padding: 6px 14px;
      cursor: pointer;
      font-size: 11.5px;
      font-weight: 800;
      border-radius: 999px;
      transition: all 0.2s ease;
    }
    .btn-dismiss {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #a1a1aa;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
    }
  `],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(100%)', opacity: 0 }),
        animate('250ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class InstallPromptComponent implements OnInit {
  deferredPrompt: any = null;
  isDismissed = false;

  ngOnInit() {
    try {
      const dismissedTime = localStorage.getItem('mm-pwa-dismissed');
      if (dismissedTime) {
        const days = (Date.now() - Number(dismissedTime)) / (1000 * 60 * 60 * 24);
        if (days < 14) {
          this.isDismissed = true;
        }
      }
    } catch {
      /* ignore */
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      if (!this.isDismissed) {
        this.deferredPrompt = e;
      }
    });
  }

  promptInstallation() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then(() => {
        this.deferredPrompt = null;
      });
    }
  }

  dismiss() {
    this.deferredPrompt = null;
    this.isDismissed = true;
    try {
      localStorage.setItem('mm-pwa-dismissed', Date.now().toString());
    } catch {
      /* ignore */
    }
  }
}
