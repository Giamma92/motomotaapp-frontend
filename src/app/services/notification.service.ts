import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { I18nService } from "./i18n.service";
import { ToastComponent, ToastType } from "../components/toast/toast.component";

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {

  constructor(private snackBar: MatSnackBar, private i18n: I18nService) {}

  showSuccess(key: string, params: Record<string, string | number> = {}, duration: number = 3500): void {
    const message = this.i18n.translate(key, params);
    this.showToast(message, 'success', undefined, duration);
  }

  showError(key: string, params: Record<string, string | number> = {}, duration: number = 4500): void {
    const message = this.i18n.translate(key, params);
    this.showToast(message, 'error', undefined, duration);
  }

  showSuccessMessage(message: string, durationOrTitle?: number | string, optionalTitle?: string): void {
    const duration = typeof durationOrTitle === 'number' ? durationOrTitle : 3500;
    const title = typeof durationOrTitle === 'string' ? durationOrTitle : optionalTitle;
    this.showToast(message, 'success', title, duration);
  }

  showErrorMessage(message: string, durationOrTitle?: number | string, optionalTitle?: string): void {
    const duration = typeof durationOrTitle === 'number' ? durationOrTitle : 4500;
    const title = typeof durationOrTitle === 'string' ? durationOrTitle : optionalTitle;
    this.showToast(message, 'error', title, duration);
  }

  showWarningMessage(message: string, durationOrTitle?: number | string, optionalTitle?: string): void {
    const duration = typeof durationOrTitle === 'number' ? durationOrTitle : 4000;
    const title = typeof durationOrTitle === 'string' ? durationOrTitle : optionalTitle;
    this.showToast(message, 'warning', title, duration);
  }

  showInfoMessage(message: string, durationOrTitle?: number | string, optionalTitle?: string): void {
    const duration = typeof durationOrTitle === 'number' ? durationOrTitle : 3500;
    const title = typeof durationOrTitle === 'string' ? durationOrTitle : optionalTitle;
    this.showToast(message, 'info', title, duration);
  }

  private showToast(message: string, type: ToastType, title?: string, duration: number = 3500): void {
    this.snackBar.openFromComponent(ToastComponent, {
      duration: duration,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['app-toast-snackbar-panel'],
      data: {
        message,
        type,
        title
      }
    });
  }

}
