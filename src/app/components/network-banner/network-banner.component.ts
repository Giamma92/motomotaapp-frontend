import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStatusService } from '../../services/network-status.service';

@Component({
  selector: 'app-network-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!network.isOnline()) {
      <div class="network-bar network-bar--offline" role="alert" aria-live="assertive">
        <div class="network-content">
          <i class="fa-solid fa-wifi-slash"></i>
          <span><strong>Sei offline:</strong> visualizzazione dati in cache locale.</span>
        </div>
      </div>
    } @else if (network.showReconnectedBanner()) {
      <div class="network-bar network-bar--online" role="status" aria-live="polite">
        <div class="network-content">
          <i class="fa-solid fa-circle-check"></i>
          <span><strong>Connessione ripristinata:</strong> sincronizzazione completata.</span>
        </div>
      </div>
    }
  `,
  styles: [`
    .network-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: calc(env(safe-area-inset-top, 0px) + 6px) 16px 6px;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.3;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
      animation: slide-down 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .network-bar--offline {
      background: rgba(220, 38, 38, 0.95);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .network-bar--online {
      background: rgba(16, 185, 129, 0.95);
      color: #ffffff;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .network-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @keyframes slide-down {
      from {
        transform: translateY(-100%);
      }
      to {
        transform: translateY(0);
      }
    }
  `]
})
export class NetworkBannerComponent {
  public network = inject(NetworkStatusService);
}
