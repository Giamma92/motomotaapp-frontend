import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  message: string;
  type?: ToastType;
  title?: string;
}

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-toast" [ngClass]="'app-toast--' + (data.type || 'info')" role="alert">
      <div class="toast-icon-wrap">
        <i class="fa-solid" [ngClass]="getIcon()"></i>
      </div>

      <div class="toast-body">
        <div class="toast-title" *ngIf="data.title">{{ data.title }}</div>
        <div class="toast-message">{{ data.message }}</div>
      </div>

      <button type="button" class="toast-close-btn" (click)="dismiss()" aria-label="Chiudi">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .app-toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px 12px 16px;
      border-radius: 14px;
      background: rgba(22, 24, 29, 0.96);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.65), 0 2px 6px rgba(0, 0, 0, 0.35);
      color: #ffffff;
      min-width: 280px;
      max-width: 440px;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Light Theme */
    :host-context([data-theme='light']) .app-toast,
    [data-theme='light'] .app-toast {
      background: rgba(255, 255, 255, 0.98);
      color: #111214;
      border-color: rgba(0, 0, 0, 0.08);
      box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.15), 0 2px 6px rgba(0, 0, 0, 0.06);
    }

    /* Type Accent Bar */
    .app-toast::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 4px;
      border-top-left-radius: 14px;
      border-bottom-left-radius: 14px;
    }

    .app-toast--success::before {
      background: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.7);
    }
    .app-toast--error::before {
      background: #ef4444;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.7);
    }
    .app-toast--warning::before {
      background: #f59e0b;
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.7);
    }
    .app-toast--info::before {
      background: #3b82f6;
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.7);
    }

    /* Icon badge */
    .toast-icon-wrap {
      flex: 0 0 34px;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
    }

    .app-toast--success .toast-icon-wrap {
      background: rgba(16, 185, 129, 0.16);
      color: #34d399;
    }
    .app-toast--error .toast-icon-wrap {
      background: rgba(239, 68, 68, 0.16);
      color: #f87171;
    }
    .app-toast--warning .toast-icon-wrap {
      background: rgba(245, 158, 11, 0.16);
      color: #fbbf24;
    }
    .app-toast--info .toast-icon-wrap {
      background: rgba(59, 130, 246, 0.16);
      color: #60a5fa;
    }

    /* Body */
    .toast-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toast-title {
      font-family: 'MotoGP Bold', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 0.76rem;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: inherit;
      line-height: 1.2;
    }

    .toast-message {
      font-size: 0.82rem;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.35;
      word-break: break-word;
    }

    :host-context([data-theme='light']) .toast-message,
    [data-theme='light'] .toast-message {
      color: #3d424d;
    }

    /* Close Button */
    .toast-close-btn {
      flex: 0 0 28px;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.18s ease;
      margin-left: 2px;
    }

    .toast-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
    }

    :host-context([data-theme='light']) .toast-close-btn,
    [data-theme='light'] .toast-close-btn {
      color: rgba(0, 0, 0, 0.4);
    }

    :host-context([data-theme='light']) .toast-close-btn:hover,
    [data-theme='light'] .toast-close-btn:hover {
      background: rgba(0, 0, 0, 0.06);
      color: #111214;
    }

    @media (max-width: 600px) {
      .app-toast {
        min-width: calc(100vw - 32px);
        max-width: calc(100vw - 32px);
      }
    }
  `]
})
export class ToastComponent {
  constructor(
    @Inject(MAT_SNACK_BAR_DATA) public data: ToastData,
    public snackBarRef: MatSnackBarRef<ToastComponent>
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'success':
        return 'fa-circle-check';
      case 'error':
        return 'fa-circle-xmark';
      case 'warning':
        return 'fa-triangle-exclamation';
      case 'info':
      default:
        return 'fa-circle-info';
    }
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
