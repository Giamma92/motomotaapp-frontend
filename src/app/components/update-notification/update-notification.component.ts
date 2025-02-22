import { Component } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { UpdateService } from '../../services/update.service';

@Component({
  selector: 'app-update-notification',
  template: `
    @if (updateAvailable) {
      <div @fadeInOut class="update-popup">
        <div class="popup-content">
          <span class="icon">⚡</span>
          <p class="message">A new version is available!</p>
          <button (click)="reload()" class="reload-button">Update Now</button>
        </div>
      </div>
    }

  `,
  styles: [`
    .update-popup {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideUp 0.5s ease-out;
      max-width: 300px;
    }

    .popup-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .icon {
      font-size: 24px;
    }

    .message {
      font-size: 16px;
      font-weight: 500;
      flex-grow: 1;
    }

    .reload-button {
      background: #ff9800;
      color: white;
      border: none;
      padding: 8px 12px;
      font-size: 14px;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.3s ease-in-out;
    }

    .reload-button:hover {
      background: #e68900;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' }))
      ])
    ])
  ]
})
export class UpdateNotificationComponent {
  updateAvailable = false;

  constructor(private updateService: UpdateService) {
    this.updateService.updateAvailable$.subscribe(isAvailable => {
      this.updateAvailable = isAvailable;
    });
  }

  reload() {
    this.updateService.reloadApp();
  }
}
