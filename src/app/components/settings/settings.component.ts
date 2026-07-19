import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { InAppNotificationService, NotificationSettings } from '../../services/in-app-notification.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
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
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
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

        <section class="settings-panel notification-settings-panel" *ngIf="selectedChampionshipId">
          <div class="panel-head">
            <h2>Notifiche</h2>
          </div>

          <div class="notification-toggles">
            <label class="toggle-row">
              <span class="toggle-label">Schieramenti</span>
              <input type="checkbox" [checked]="notifSettings.lineup" (change)="toggleNotif('lineup', $event)" />
              <span class="toggle-switch"></span>
            </label>
            <label class="toggle-row">
              <span class="toggle-label">Aggiornamento punteggi</span>
              <input type="checkbox" [checked]="notifSettings.score_update" (change)="toggleNotif('score_update', $event)" />
              <span class="toggle-switch"></span>
            </label>
            <label class="toggle-row">
              <span class="toggle-label">Cambio posizione classifica</span>
              <input type="checkbox" [checked]="notifSettings.standing_change" (change)="toggleNotif('standing_change', $event)" />
              <span class="toggle-switch"></span>
            </label>
            <label class="toggle-row">
              <span class="toggle-label">Gara cancellata</span>
              <input type="checkbox" [checked]="notifSettings.race_cancelled" (change)="toggleNotif('race_cancelled', $event)" />
              <span class="toggle-switch"></span>
            </label>
            <label class="toggle-row">
              <span class="toggle-label">Generali</span>
              <input type="checkbox" [checked]="notifSettings.general" (change)="toggleNotif('general', $event)" />
              <span class="toggle-switch"></span>
            </label>
          </div>
        </section>
      </main>
    </div>
  `,
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  championships: Championship[] = [];
  settingsForm: FormGroup;
  loading = false;
  successMessageKey = '';
  notifSettings: NotificationSettings = {
    lineup: true,
    score_update: true,
    standing_change: true,
    race_cancelled: true,
    general: true
  };
  selectedChampionshipId: number | null = null;
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
    private notificationService: NotificationServiceService,
    private inAppNotificationService: InAppNotificationService
  ) {
    this.settingsForm = this.fb.group({
      championship_id: ['', Validators.required],
      language: ['', Validators.required],
    });

    this.settingsForm.get('championship_id')?.valueChanges.subscribe(champId => {
      if (champId) {
        this.loadNotificationSettings(champId);
      }
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

  loadNotificationSettings(championshipId: number): void {
    this.selectedChampionshipId = championshipId;
    this.inAppNotificationService.getSettings(championshipId).subscribe({
      next: (settings) => {
        this.notifSettings = { ...this.notifSettings, ...settings };
      },
      error: () => {}
    });
  }

  toggleNotif(category: keyof NotificationSettings, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.notifSettings[category] = checked;
    if (this.selectedChampionshipId) {
      this.inAppNotificationService.updateSettings(this.selectedChampionshipId, { [category]: checked })
        .subscribe({ error: () => {} });
    }
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
