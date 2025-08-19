import { Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { I18nService } from "./i18n.service";

@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {

  constructor(private snackBar: MatSnackBar, private i18n: I18nService ) {}

  showSuccess(key: string, params: Record<string, string | number> = {}, duration: number = 4000): void {
    this.show(key, params, duration, 'success-snackbar');
  }

  showError(key: string, params: Record<string, string | number> = {}, duration: number = 4000): void {
    this.show(key, params, duration, 'error-snackbar');
  }

  private show(key: string, params: Record<string, string | number> = {}, duration: number = 4000, panelClass: string = 'success-snackbar'): void{
    const message = this.i18n.translate(key, params);
    this.snackBar.open(message, 'Close', {
      duration: duration,
      panelClass: [panelClass]
    });
  }

}
