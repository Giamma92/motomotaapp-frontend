import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError, forkJoin } from 'rxjs';
import { HttpService } from './http.service';
import { AuthService } from './auth.service';
import { UserSettingsService } from './user-settings.service';

const I18N_CACHE_VERSION = 'v2026.2';

export const ALLOWED_LANGUAGES = ['it', 'en', 'es', 'fr'];
export const DEFAULT_LANGUAGE = 'it';

export type TranslationsMap = Record<string, string>;

export interface Translation {
  value: string;
  i18n_keys: {
    key: string;
    namespace: string;
    description: string;
  };
  language_id: {
    code: string;
    name: string;
  };
}

@Injectable({ providedIn: 'root' })
export class I18nService {
  private translations: TranslationsMap = {};
  private languageSubject = new BehaviorSubject<string>(I18nService.getInitialLanguage());
  language$ = this.languageSubject.asObservable();
  private translationsSubject = new BehaviorSubject<TranslationsMap>({});
  translations$ = this.translationsSubject.asObservable();

  constructor(
    private httpService: HttpService,
    private authService: AuthService,
    private userSettingsService: UserSettingsService
  ) {}

  static getInitialLanguage(): string {
    try {
      const saved = localStorage.getItem('lang')?.toLowerCase();
      if (saved && ALLOWED_LANGUAGES.includes(saved)) {
        return saved;
      }
      const browser = navigator.language?.split('-')[0]?.toLowerCase();
      if (browser && ALLOWED_LANGUAGES.includes(browser)) {
        return browser;
      }
    } catch {}
    return DEFAULT_LANGUAGE;
  }

  init(): void {
    const cachedVersion = localStorage.getItem('i18n_cache_version');
    if (cachedVersion !== I18N_CACHE_VERSION) {
      this.clearCache();
      localStorage.setItem('i18n_cache_version', I18N_CACHE_VERSION);
    }
    const initial = I18nService.getInitialLanguage();
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
    let normalized = (langCode || DEFAULT_LANGUAGE).toLowerCase().trim();
    if (!ALLOWED_LANGUAGES.includes(normalized)) {
      normalized = DEFAULT_LANGUAGE;
    }

    const alreadyLoaded = this.currentLanguage === normalized && Object.keys(this.translations).length > 0;
    this.languageSubject.next(normalized);
    localStorage.setItem('lang', normalized);

    if (champId !== undefined) {
      this.persistUserPreferenceIfAuthenticated(champId, normalized);
    }

    if (alreadyLoaded) {
      return of(this.translations);
    }

    return this.fetchTranslations(normalized).pipe(
      tap(map => {
        this.translations = map;
        this.translationsSubject.next(this.translations);
      }),
      catchError(() => {
        this.translations = {};
        this.translationsSubject.next(this.translations);
        return of(this.translations);
      })
    );
  }

  translate(key: string, params?: Record<string, string | number>): string {
    if (!key) return '';
    const value = this.translations[key] ?? key;
    if (value === key && !key.startsWith('nav.') && !key.startsWith('more.')) {
      console.warn('key not found', key);
    }
    if (!params) return value;
    return Object.keys(params).reduce((acc, p) => acc.replace(new RegExp(`{${p}}`, 'g'), String(params[p])), value);
  }

  private fetchTranslations(langCode: string): Observable<TranslationsMap> {
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
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(`${cacheKey}_timestamp`);
      }
    }

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

  clearCache(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('translations_')) {
        localStorage.removeItem(key);
      }
    });
  }

  refreshTranslations(langCode: string): Observable<TranslationsMap> {
    const cacheKey = `translations_${langCode}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_timestamp`);
    return this.setLanguage(langCode);
  }

  preloadLanguages(availableLanguages: string[] = ALLOWED_LANGUAGES): Observable<TranslationsMap[]> {
    const languagesToPreload = availableLanguages.filter(lang => {
      if (lang === this.currentLanguage) return false;
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

  getCachedTranslations(langCode: string): TranslationsMap | null {
    const cacheKey = `translations_${langCode}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);

    if (cached && cacheTimestamp) {
      const CACHE_DURATION = 3600000;
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

  persistUserPreferenceIfAuthenticated(champId: number | undefined, langCode: string): void {
    const token = this.authService.getToken();
    if (!token) return;
    this.userSettingsService.updateUserSettings(champId, langCode).subscribe({ next: () => {}, error: () => {} });
  }
}
