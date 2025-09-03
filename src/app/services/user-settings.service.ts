import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';

export interface UserSettings {
  id: string;
  championship_id: string;
  user_id: string;
  language?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {

  constructor(private httpService: HttpService) {
  }

  getUserSettings() {
    return this.httpService.genericGet<UserSettings>('user/settings');
  }

  /** Update user settings */
  updateUserSettings(championshipId: number): Observable<any> {
    return this.httpService.genericPut('user/settings', { championship_id: championshipId });
  }

  /** Update only preferred language */
  updateUserLanguage(championshipId: number, languageCode: string): Observable<any> {
    return this.httpService.genericPut('user/settings', { championship_id: championshipId, language: languageCode });
  }
}
