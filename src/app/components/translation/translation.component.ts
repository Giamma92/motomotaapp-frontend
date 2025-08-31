import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../services/auth.service';
import { I18nService, Translation } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { HttpService } from '../../services/http.service';
import { NotificationServiceService } from '../../services/notification.service';

interface TranslationKey {
  key: string;
  description: string;
  namespace: string;
  languageName: string;
  value: string;
}

interface TranslationValue {
  key: string;
  language: string;
  value: string;
}

@Component({
  selector: 'app-translation',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    TranslatePipe
  ],
  template: `
    <div class="translation-container">
      <header class="header">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'translation.title' | t }}</h1>
      </header>

      <div class="content">
        <!-- Add New Translation Section -->
        <mat-card class="add-translation-card">
          <mat-card-header>
            <mat-card-title>{{ 'translation.addNew' | t }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="translationForm" (ngSubmit)="addTranslation()">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>{{ 'translation.key' | t }}</mat-label>
                  <input matInput formControlName="key" placeholder="e.g., common.save">
                  <mat-error *ngIf="translationForm.get('key')?.hasError('required')">
                    {{ 'translation.keyRequired' | t }}
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>{{ 'translation.namespace' | t }}</mat-label>
                  <mat-select formControlName="namespace">
                    <mat-option value="common">Common</mat-option>
                    <mat-option value="login">Login</mat-option>
                    <mat-option value="dashboard">Dashboard</mat-option>
                    <mat-option value="settings">Settings</mat-option>
                    <mat-option value="teams">Teams</mat-option>
                    <mat-option value="calendar">Calendar</mat-option>
                    <mat-option value="raceDetail">Race Detail</mat-option>
                    <mat-option value="lineups">Lineups</mat-option>
                    <mat-option value="bets">Bets</mat-option>
                    <mat-option value="profile">Profile</mat-option>
                    <mat-option value="reset">Reset Password</mat-option>
                    <mat-option value="reset">Admin</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>{{ 'translation.description' | t }}</mat-label>
                <textarea matInput formControlName="description" rows="2"></textarea>
              </mat-form-field>

              <div class="translations-row">
                <div class="translation-input">
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'translation.english' | t }}</mat-label>
                    <textarea matInput formControlName="englishValue" rows="3"></textarea>
                  </mat-form-field>
                </div>

                <div class="translation-input">
                  <mat-form-field appearance="outline">
                    <mat-label>{{ 'translation.italian' | t }}</mat-label>
                    <textarea matInput formControlName="italianValue" rows="3"></textarea>
                  </mat-form-field>
                </div>
              </div>

              <div class="actions">
                <button mat-raised-button color="primary" type="submit" [disabled]="translationForm.invalid || loading">
                  {{ loading ? ('translation.adding' | t) : ('translation.add' | t) }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Cache Management Section -->
        <mat-card class="cache-card">
          <mat-card-header>
            <mat-card-title>{{ 'translation.cacheManagement' | t }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>{{ 'translation.cacheDescription' | t }}</p>
            <div class="cache-actions">
              <button mat-raised-button color="warn" (click)="clearCache()" [disabled]="cacheLoading">
                <mat-icon>clear_all</mat-icon>
                {{ cacheLoading ? ('translation.clearing' | t) : ('translation.clearCache' | t) }}
              </button>
              <button mat-raised-button color="accent" (click)="refreshCache()" [disabled]="cacheLoading">
                <mat-icon>refresh</mat-icon>
                {{ cacheLoading ? ('translation.refreshing' | t) : ('translation.refreshCache' | t) }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Recent Translations Table -->
        <mat-card class="recent-translations-card">
          <mat-card-header>
            <mat-card-title>{{ 'translation.recentTranslations' | t }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container" *ngIf="!!recentTranslations && recentTranslations.length > 0">
              <table mat-table [dataSource]="recentTranslations" class="translations-table">
                <ng-container matColumnDef="key">
                  <th mat-header-cell *matHeaderCellDef>{{ 'translation.key' | t }}</th>
                  <td mat-cell *matCellDef="let element">{{ element.key }}</td>
                </ng-container>

                <ng-container matColumnDef="description">
                  <th mat-header-cell *matHeaderCellDef>{{ 'translation.description' | t }}</th>
                  <td mat-cell *matCellDef="let element">{{ element.description }}</td>
                </ng-container>

                <ng-container matColumnDef="namespace">
                  <th mat-header-cell *matHeaderCellDef>{{ 'translation.namespace' | t }}</th>
                  <td mat-cell *matCellDef="let element">{{ element.namespace }}</td>
                </ng-container>

                <ng-container matColumnDef="languageName">
                  <th mat-header-cell *matHeaderCellDef>{{ 'translation.languageName' | t }}</th>
                  <td mat-cell *matCellDef="let element">{{ element.languageName }}</td>
                </ng-container>

                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>{{ 'translation.value' | t }}</th>
                  <td mat-cell *matCellDef="let element">{{ element.value }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .translation-container {
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
      padding: 80px 20px 20px 20px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      color: white;

      h1 {
        margin: 0;
        font-size: 1.8rem;
      }
    }

    .content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 30px; /* Increased gap between cards */
    }

    /* Override Material Design card margins */
    .add-translation-card,
    .cache-card,
    .recent-translations-card {
      background: rgba(255, 255, 255, 0.95) !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1) !important;
      margin-bottom: 0 !important; /* Remove default margin */
    }

    /* Add spacing to card headers */
    .add-translation-card mat-card-header,
    .cache-card mat-card-header,
    .recent-translations-card mat-card-header {
      padding-bottom: 16px !important;
      margin-bottom: 16px !important;
      border-bottom: 1px solid #e0e0e0 !important;
    }

    /* Add spacing between form elements */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .translations-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .full-width {
      width: 100%;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .cache-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .table-container {
      max-height: 400px; /* Limit table height */
      overflow-y: auto; /* Add vertical scrollbar when needed */
      overflow-x: auto; /* Allow horizontal scrolling for table */
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }

    .translations-table {
      width: 100%;
      min-width: 600px; /* Ensure minimum width for table */
    }

    /* Style the scrollbar for better appearance */
    .table-container::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    .table-container::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    .table-container::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    .translation-input {
      display: flex;
      flex-direction: column;
    }

    @media (max-width: 768px) {
      .translation-container {
        padding: 60px 15px 15px 15px;
      }

      .content {
        gap: 20px;
      }

      .form-row,
      .translations-row {
        grid-template-columns: 1fr;
      }

      .cache-actions {
        flex-direction: column;
      }

      .table-container {
        max-height: 300px; /* Smaller height on mobile */
      }
    }
  `]
})
export class TranslationComponent implements OnInit {
  translationForm: FormGroup;
  loading = false;
  cacheLoading = false;
  recentTranslations: TranslationKey[] = [];
  displayedColumns: string[] = ['key', 'description', 'namespace', 'languageName', 'value'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private i18n: I18nService,
    private httpService: HttpService,
    private notificationService: NotificationServiceService
  ) {
    this.translationForm = this.fb.group({
      key: ['', [Validators.required]],
      namespace: ['common', Validators.required],
      description: ['', Validators.required],
      englishValue: ['', Validators.required],
      italianValue: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.isCurrentUserAdmin()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadRecentTranslations();
  }

  addTranslation(): void {
    if (this.translationForm.invalid) return;

    this.loading = true;
    const formValue = this.translationForm.value;

    // Create the translation key first
    const keyData = {
      key: formValue.key,
      description: formValue.description,
      namespace: formValue.namespace
    };

    // Add translations for both languages
    const translations = [
      { key: formValue.key, language: 'en', value: formValue.englishValue },
      { key: formValue.key, language: 'it', value: formValue.italianValue }
    ];

    let promises: Promise<any>[] = [];
    translations.forEach(t => {
      const payload = {
        code: t.language,
        namespace: keyData.namespace,
        key: keyData.key,
        value: t.value,
        description: keyData.description
      };
      promises.push(this.httpService.genericPut(`i18n/new`, payload).toPromise());
    });

    Promise.all(promises).then(results => {
      this.loading = false;
      this.translationForm.reset({ namespace: keyData.namespace });
      this.notificationService.showSuccess('translation.addSuccess');
      this.loadRecentTranslations();
      this.i18n.clearCache(); // Clear cache to force refresh
    });

  }

  clearCache(): void {
    this.cacheLoading = true;
    this.i18n.clearCache();

    setTimeout(() => {
      this.cacheLoading = false;
      this.notificationService.showSuccess('translation.clearCacheSuccess');
    }, 500);
  }

  refreshCache(): void {
    this.cacheLoading = true;

    // Refresh current language
    this.i18n.refreshTranslations(this.i18n.currentLanguage).subscribe({
      next: () => {
        this.cacheLoading = false;
        this.notificationService.showSuccess('translation.refreshCacheSuccess');
      },
      error: () => {
        this.cacheLoading = false;
        this.notificationService.showError('translation.refreshCacheFail');
      }
    });
  }

  private loadRecentTranslations(): void {
    this.recentTranslations = [];
    this.i18n.fetchRecentTranslations().subscribe((translations: Translation[]) => {
      translations.forEach((t: Translation) => {
        const tKey: TranslationKey = {
          key: t.i18n_keys.key,
          namespace: t.i18n_keys.namespace,
          description: t.i18n_keys.description,
          languageName: t.language_id.name,
          value: t.value
        };
        this.recentTranslations.push(tKey);
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
