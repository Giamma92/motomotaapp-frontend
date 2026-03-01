import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChampionshipService, Championship } from '../../services/championship.service';
import { Router } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { UserSettingsService } from '../../services/user-settings.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationServiceService } from '../../services/notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe,
  ],
  template: `
    <div class="settings-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'settings.title' | t }}</h1>
      </header>
      <main class="settings-main">
        <section class="settings-panel">
          <div class="panel-head">
            <h2>{{ 'settings.title' | t }}</h2>
          </div>

          <form class="settings-form" [formGroup]="settingsForm" (ngSubmit)="save()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'settings.selectChampionship' | t }}</mat-label>
              <mat-select formControlName="championship_id">
                <mat-option *ngFor="let champ of championships" [value]="champ.id">
                  {{ champ.description }} ({{ champ.year }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ 'settings.language' | t }}</mat-label>
              <mat-select formControlName="language">
                <mat-option *ngFor="let l of languages" [value]="l.code">
                  {{ l.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>
          </form>

          <p *ngIf="successMessageKey" class="success-message">{{ successMessageKey | t }}</p>

          <div class="settings-actions">
            <button mat-raised-button color="primary" (click)="save()" [disabled]="settingsForm.invalid || loading">{{ 'settings.save' | t }}</button>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.14), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(0, 0, 0, 0.05), transparent 34%),
        linear-gradient(158deg, #ffffff 0%, #f8f8f9 48%, #f1f2f4 100%);
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: var(--app-header-height);
      display: flex;
      align-items: center;
      background: rgba(17, 18, 20, 0.97);
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
      color: #fff;
      z-index: 1000;
      padding: 0 clamp(10px, 2.5vw, 20px);
    }

    .header button {
      background: #fff;
      color: #c8102e;
      border-radius: 50%;
      width: 42px;
      height: 42px;
    }

    .header h1 {
      flex: 1;
      text-align: center;
      margin: 0;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-size: clamp(1rem, 2.8vw, 1.5rem);
      font-family: 'MotoGP Bold', sans-serif;
      padding-right: 42px;
    }

    .settings-main {
      width: min(100%, 760px);
      margin: 0 auto;
      padding: calc(var(--app-header-height) + 10px) 10px 12px;
    }

    .settings-panel {
      width: 100%;
      border: 1px solid rgba(17, 18, 20, 0.12);
      border-radius: 14px;
      background: #fff;
      box-shadow: 0 8px 18px rgba(0,0,0,.08);
      padding: 10px;
    }

    .panel-head {
      border-bottom: 1px solid rgba(17, 18, 20, 0.1);
      padding-bottom: 8px;
      margin-bottom: 8px;
    }

    .panel-head h2 {
      margin: 0;
      color: #111214;
      font-family: 'MotoGP Bold', sans-serif;
      font-size: clamp(1rem, 2.2vw, 1.2rem);
      text-transform: uppercase;
      letter-spacing: 0.18px;
    }

    .settings-form {
      display: grid;
      gap: 2px;
    }

    .full-width {
      width: 100%;
    }

    .success-message {
      color: #1b5e20;
      background: #e9f7ec;
      border: 1px solid #b7dfbf;
      padding: 0.75rem;
      border-radius: 10px;
      margin-top: 10px;
      font-weight: 600;
      font-size: 0.92rem;
    }

    ::ng-deep .settings-form .mat-mdc-text-field-wrapper {
      background: #fff;
    }

    ::ng-deep .settings-form .mdc-notched-outline__leading,
    ::ng-deep .settings-form .mdc-notched-outline__notch,
    ::ng-deep .settings-form .mdc-notched-outline__trailing {
      border-color: rgba(0, 0, 0, 0.18) !important;
    }

    .settings-actions {
      display: flex;
      justify-content: flex-end;
      padding-top: 10px;
    }

    .settings-actions button {
      min-height: 44px;
      min-width: 120px;
      font-weight: 600;
    }

    @media (max-width: 600px) {
      .settings-main {
        padding: calc(var(--app-header-height) + 8px) 8px 10px;
      }

      .settings-panel {
        padding: 8px;
      }

      .settings-actions {
        justify-content: stretch;
      }

      .settings-actions button {
        width: 100%;
      }
    }
  `],
})
export class SettingsComponent implements OnInit {
  championships: Championship[] = [];
  settingsForm: FormGroup;
  loading = false;
  successMessageKey = '';
  languages = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' }
  ];
  private originalChampionshipId: number | null = null;
  private originalLanguage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private championshipService: ChampionshipService,
    private userSettingsService: UserSettingsService,
    private router: Router,
    private i18n: I18nService,
    private notificationService: NotificationServiceService
  ) {
    this.settingsForm = this.fb.group({
      championship_id: ['', Validators.required],
      language: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadChampionships();
    this.loadUserSettings();
  }

  /** Fetch available championships */
  loadChampionships(): void {
    this.championshipService.getChampionships().subscribe({
      next: (data: Championship[]) => {
        this.championships = data;
      },
      error: (err) => console.error('Error fetching championships', err),
    });
  }

  /** Fetch user settings */
  loadUserSettings(): void {
    this.userSettingsService.getUserSettings().subscribe({
      next: (userSettings) => {
        if (userSettings?.championship_id) {
          this.settingsForm.patchValue({ championship_id: userSettings.championship_id });
          this.originalChampionshipId = userSettings.championship_id as unknown as number;
        }
        const lang = userSettings?.language || localStorage.getItem('lang') || this.i18n.currentLanguage || 'en';
        this.settingsForm.patchValue({ language: lang });
        this.originalLanguage = lang;
      },
      error: (err) => console.error('Error fetching user settings', err),
    });
  }

  /** Save settings */
  save(): void {
    if (this.settingsForm.invalid) return;

    this.loading = true;
    this.successMessageKey = '';

    const championshipId = this.settingsForm.get('championship_id')?.value;
    const language = this.settingsForm.get('language')?.value;
    const updates: Promise<any>[] = [];

    if (this.originalChampionshipId !== championshipId) {
      updates.push(
        this.userSettingsService.updateUserSettings(championshipId).toPromise()
      );
    }

    if (this.originalLanguage !== language) {
      updates.push(
        this.i18n.setLanguage(language, championshipId).toPromise()
      );
    }

    if (updates.length === 0) {
      this.loading = false;
      this.successMessageKey = 'settings.noChanges';
      return;
    }

    Promise.all(updates)
      .then(() => {
        this.championshipService.subjChampId.next(championshipId);
        this.successMessageKey = 'settings.success';
        this.loading = false;
      })
      .catch((err) => {
        console.error('Error updating settings:', err);
        this.loading = false;
      });
  }

  // Development helper: Clear translation cache
  clearTranslationCache(): void {
    this.i18n.clearCache();
    this.notificationService.showSuccess('settings.clearTranslationCacheSuccess');
  }

  // Development helper: Refresh translations
  refreshTranslations(): void {
    const language = this.settingsForm.get('language')?.value || 'en';
    this.i18n.refreshTranslations(language).subscribe({
      next: () => this.notificationService.showSuccess('settings.refreshTranslationsSuccess'),
      error: () => this.notificationService.showError('settings.refreshTranslationsFail')
    });
  }

  goBack() {
    this.router.navigate(['/']);
  }
}
