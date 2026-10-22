import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface UserSettings {
  id?: string | number;
  championship_id?: number | string;
  user_id?: string;
  language?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {

  constructor(private httpService: HttpService) {}

  getUserSettings(): Observable<UserSettings> {
    return this.httpService.genericGet<UserSettings>('user/settings');
  }

  /** Update user settings (championship, language, or both) */
  updateUserSettings(championshipId?: number, language?: string): Observable<any> {
    const payload: any = {};
    if (championshipId !== undefined && championshipId !== null) {
      payload.championship_id = championshipId;
    }
    if (language !== undefined && language !== null) {
      payload.language = language;
    }
    return this.httpService.genericPut('user/settings', payload);
  }

  /** Update only preferred language */
  updateUserLanguage(championshipId?: number, languageCode?: string): Observable<any> {
    return this.updateUserSettings(championshipId, languageCode);
  }
}
