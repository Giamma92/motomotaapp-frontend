import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'mm-theme';

/**
 * Light/dark theme switcher.
 *
 * Applies `data-theme="light"` on <html>; the light palette is defined
 * in `src/styles/_tokens.scss` and `_material-overrides.scss` as
 * `[data-theme='light']` overrides. An inline script in index.html applies
 * the stored value before Angular boots (no flash).
 *
 * The `mode` signal is read in templates (`theme.mode()`) so OnPush
 * components update automatically.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(ThemeService.readStoredMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    this.set(this.mode() === 'dark' ? 'light' : 'dark');
  }

  set(mode: ThemeMode): void {
    this.mode.set(mode);
    this.apply(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* storage unavailable (private mode) — theme stays for this session */
    }
  }

  private apply(mode: ThemeMode): void {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
      // Keep the PWA/browser chrome in sync with the theme
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', mode === 'light' ? '#f4f5f7' : '#0b0c10');
      }
    }
  }

  private static readStoredMode(): ThemeMode {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  }
}
