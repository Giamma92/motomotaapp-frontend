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
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'settings.title' | t }}</h1>
      </header>
      <mat-card class="settings-card">
        <mat-card-content>
          <form [formGroup]="settingsForm" (ngSubmit)="save()">
            <mat-form-field appearance="fill" class="full-width">
              <mat-label>{{ 'settings.selectChampionship' | t }}</mat-label>
              <mat-select formControlName="championship_id">
                <mat-option *ngFor="let champ of championships" [value]="champ.id">
                  {{ champ.description }} ({{ champ.year }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>{{ 'settings.language' | t }}</mat-label>
              <mat-select formControlName="language">
                <mat-option *ngFor="let l of languages" [value]="l.code">
                  {{ l.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

          </form>
          <p *ngIf="successMessageKey" class="success-message">{{ successMessageKey | t }}</p>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="settingsForm.invalid || loading">{{ 'settings.save' | t }}</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      padding: 20px;
    }
    .settings-card {
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .full-width {
      width: 100%;
    }
    .success-message {
      color: green;
      margin-top: 10px;
      font-weight: bold;
    }
    mat-card-header.mat-mdc-card-header {
        padding-bottom: 20px;
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
        this.i18n.setLanguage(language).toPromise()
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
