import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap, tap, catchError, forkJoin } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { UserSettingsService } from './user-settings.service';

export type TranslationsMap = Record<string, string>;

export interface Translation {
  value: string;
  i18n_keys: {
    key: string,
    namespace: string,
    description: string
  };
  language_id: {
    code: string,
    name: string
  }
}
@Injectable({ providedIn: 'root' })
export class I18nService {
  private translations: TranslationsMap = {};
  private languageSubject = new BehaviorSubject<string>('en');
  language$ = this.languageSubject.asObservable();
  private translationsSubject = new BehaviorSubject<TranslationsMap>({});
  translations$ = this.translationsSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {}

  init(): void {
    const saved = localStorage.getItem('lang');
    const browser = navigator.language?.split('-')[0] ?? 'en';
    const initial = (saved || browser || 'en').toLowerCase();
    this.setLanguage(initial).subscribe();
  }

  get currentLanguage(): string {
    return this.languageSubject.getValue();
  }

  get locale(): string {
    const lang = this.currentLanguage;
    switch (lang) {
      case 'it': return 'it-IT';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'de': return 'de-DE';
      case 'en-gb': return 'en-GB';
      default: return 'en-US';
    }
  }

  setLanguage(langCode: string, champId?: number): Observable<TranslationsMap> {
    const normalized = (langCode || 'en').toLowerCase();
    if (this.currentLanguage === normalized && Object.keys(this.translations).length > 0) {
      return of(this.translations);
    }
    this.languageSubject.next(normalized);
    localStorage.setItem('lang', normalized);
    return this.fetchTranslations(normalized).pipe(
      tap(map => {
        this.translations = map;
        this.translationsSubject.next(this.translations);
      }),
      tap(() => { if(champId) {this.persistUserPreferenceIfAuthenticated(champId, normalized)}}),
      catchError(() => {
        if(champId) { this.persistUserPreferenceIfAuthenticated(champId, normalized); }
        this.translations = {};
        this.translationsSubject.next(this.translations);
        return of(this.translations);
      })
    );
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    const value = this.translations[key] ?? key;
    if (value === key) console.warn('key not found', key);
    if (!params) return value;
    return Object.keys(params).reduce((acc, p) => acc.replace(new RegExp(`{${p}}`, 'g'), String(params[p])), value);
  }

  private fetchTranslations(langCode: string): Observable<TranslationsMap> {
    // Check cache first
    const cacheKey = `translations_${langCode}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

    // Cache for 1 hour (3600000 ms)
    const CACHE_DURATION = 3600000;
    const now = Date.now();

    if (cached && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
      try {
        const parsedCache = JSON.parse(cached);
        return of(parsedCache);
      } catch (e) {
        // Invalid cache, remove it
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_timestamp`);
      }
    }

    // Fetch from API and cache
    return this.httpService.genericGet<TranslationsMap>(`i18n/${langCode}`).pipe(
      tap(translations => {
        localStorage.setItem(cacheKey, JSON.stringify(translations));
        localStorage.setItem(`${cacheKey}_timestamp`, now.toString());
      })
    );
  }

  fetchRecentTranslations(): Observable<Translation[]> {
    return this.httpService.genericGet<Translation[]>(`i18n/translations/recent`);
  }

  // Method to clear cache (useful for development or when translations are updated)
  clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('translations_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Method to force refresh translations (bypass cache)
  refreshTranslations(langCode: string): Observable<TranslationsMap> {
    const cacheKey = `translations_${langCode}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
    return this.setLanguage(langCode);
  }

  // Preload all available languages for instant switching
  preloadLanguages(availableLanguages: string[] = ['en', 'it']): Observable<TranslationsMap[]> {
    // Filter out languages that are already loaded or currently being loaded
    const languagesToPreload = availableLanguages.filter(lang => {
      // Skip if it's the current language (already loaded)
      if (lang === this.currentLanguage) return false;

      // Skip if it's already cached
      const cached = this.getCachedTranslations(lang);
      if (cached) return false;

      return true;
    });

    if (languagesToPreload.length === 0) {
      return of([]);
    }

    const preloadObservables = languagesToPreload.map(lang =>
      this.fetchTranslations(lang).pipe(
        catchError(() => of({}))
      )
    );

    return forkJoin(preloadObservables);
  }

  // Get cached translations for a language without switching to it
  getCachedTranslations(langCode: string): TranslationsMap | null {
    const cacheKey = `translations_${langCode}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

    if (cached && cacheTimestamp) {
      const CACHE_DURATION = 3600000; // 1 hour
      const now = Date.now();

      if ((now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          localStorage.removeItem(cacheKey);
          localStorage.removeItem(`${cacheKey}_timestamp`);
        }
      }
    }

    return null;
  }

  private persistUserPreferenceIfAuthenticated(champId: number, langCode: string): void {
    const token = this.authService.getToken();
    if (!token) return;
    this.userSettingsService.updateUserLanguage(champId,langCode).subscribe({ next: () => {}, error: () => {} });
  }
}


