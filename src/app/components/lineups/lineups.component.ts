// src/app/lineups/lineups.component.ts
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, Rider } from '../../services/dashboard.service';
import { ChampionshipService, ChampionshipConfig } from '../../services/championship.service';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { HttpService } from '../../services/http.service';
import { LineupsResult, RaceDetailService } from '../../services/race-detail.service';
import { NotificationServiceService } from '../../services/notification.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-lineups',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './lineups.component.scss',
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
  ],
  template: `
    <div class="settings-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'lineups.title' | t }}</h1>
      </header>
      <mat-card class="settings-card">
        <mat-card-header>
          <div class="header-content">
            <mat-card-title class="race-title"><h3>{{ raceTitle }}</h3></mat-card-title>
            <mat-card-subtitle class="session-info">
              {{ 'lineups.subtitle' | t }}
            </mat-card-subtitle>
          </div>
        </mat-card-header>
        <mat-card-content>
          <section class="lineup-status" *ngIf="championshipConfig">
            <div class="status-chip">
              <span class="status-label">Limite pilota</span>
              <strong>{{ maxLineupsPerPilot }}</strong>
            </div>
            <div class="status-chip">
              <span class="status-label">Schieramento attuale</span>
              <strong>{{ existingLineupForRace ? 'Salvato' : 'Da completare' }}</strong>
            </div>
          </section>

          <form [formGroup]="lineupsForm" (ngSubmit)="onSubmit()">
            <section class="selection-section">
              <div class="selection-heading">
                <h3>I tuoi piloti disponibili</h3>
                <p>Scegli dalle card e controlla subito quanti utilizzi restano prima del submit.</p>
              </div>

              <div class="rider-picks">
                <button
                  type="button"
                  class="rider-card"
                  *ngFor="let rider of riders"
                  [class.selected]="lineupsForm.get('qualifying_rider_id')?.value === rider.id || lineupsForm.get('race_rider_id')?.value === rider.id"
                  [class.blocked]="isRiderBlocked(rider.id)"
                  (click)="selectRider(rider.id)"
                >
                  <div class="rider-card-main">
                    <span class="rider-number">#{{ rider.number }}</span>
                    <div class="rider-copy">
                      <strong>{{ rider.first_name }} {{ rider.last_name }}</strong>
                      <span>{{ getRiderUsageSummary(rider.id) }}</span>
                    </div>
                  </div>
                  <div class="rider-card-tags">
                    <span class="tag" [class.tag-danger]="isRiderAtLimit(rider.id)">
                      {{ getRemainingUses(rider.id) }} utilizzi rimasti
                    </span>
                    <span class="tag" *ngIf="lineupsForm.get('qualifying_rider_id')?.value === rider.id">Qualifica</span>
                    <span class="tag" *ngIf="lineupsForm.get('race_rider_id')?.value === rider.id">Gara</span>
                  </div>
                </button>
              </div>
            </section>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>{{ 'lineups.qualifyingRider' | t }}</mat-label>
              <mat-select formControlName="qualifying_rider_id" required (selectionChange)="lineupsForm.updateValueAndValidity()">
                <mat-option [value]="" disabled>{{ 'lineups.selectRider' | t }}</mat-option>
                <mat-option *ngFor="let rider of riders" [value]="rider.id" [disabled]="isRiderBlocked(rider.id) && lineupsForm.get('qualifying_rider_id')?.value !== rider.id">
                  {{ rider.first_name }} {{ rider.last_name }} (#{{ rider.number }}) · {{ getRiderUsageSummary(rider.id) }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="lineupsForm.get('qualifying_rider_id')?.hasError('duplicateRider')">
                {{ 'lineups.error.duplicate' | t }}
              </mat-error>
              <mat-error *ngIf="lineupsForm.get('qualifying_rider_id')?.hasError('riderLimitExceeded')">
                {{ 'lineups.error.riderLimitExceeded' | t }}
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>{{ 'lineups.raceRider' | t }}</mat-label>
              <mat-select formControlName="race_rider_id" required (selectionChange)="lineupsForm.updateValueAndValidity()">
                <mat-option [value]="" disabled>{{ 'lineups.selectRider' | t }}</mat-option>
                <mat-option *ngFor="let rider of riders" [value]="rider.id" [disabled]="isRiderBlocked(rider.id) && lineupsForm.get('race_rider_id')?.value !== rider.id">
                  {{ rider.first_name }} {{ rider.last_name }} (#{{ rider.number }}) · {{ getRiderUsageSummary(rider.id) }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="lineupsForm.get('race_rider_id')?.hasError('riderLimitExceeded')">
                {{ 'lineups.error.riderLimitExceeded' | t }}
              </mat-error>
            </mat-form-field>

            <section class="lineup-summary" *ngIf="selectedQualifyingRider || selectedRaceRider">
              <h3>Riepilogo schieramento</h3>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="summary-label">Pilota qualifica</span>
                  <strong>{{ selectedQualifyingRider ? (selectedQualifyingRider.first_name + ' ' + selectedQualifyingRider.last_name + ' #' + selectedQualifyingRider.number) : 'Da selezionare' }}</strong>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Pilota gara</span>
                  <strong>{{ selectedRaceRider ? (selectedRaceRider.first_name + ' ' + selectedRaceRider.last_name + ' #' + selectedRaceRider.number) : 'Da selezionare' }}</strong>
                </div>
              </div>
            </section>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button
                  color="primary"
                  [disabled]="lineupsForm.invalid || loading"
                  (click)="onSubmit()">
            {{ loading ? ('lineups.submitting' | t) : ('lineups.save' | t) }}
          </button>
          <button mat-stroked-button type="button" (click)="goToRaceDetail()">
            Vai al dettaglio gara
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class LineupsComponent implements OnInit {
  lineupsForm: FormGroup;
  loading = false;
  riders: Rider[] = [];
  existingLineupsAllCalendar: LineupsResult[] = [];
  existingLineupForRace: LineupsResult | null = null;
  maxLineupsPerPilot = 9999;
  championshipConfig: ChampionshipConfig | null = null;
  private champId = 0;
  private raceId: string | null = '';
  raceTitle = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private httpService: HttpService,
    private notificationService: NotificationServiceService
  ) {
    this.lineupsForm = this.fb.group({
      race_rider_id: ['', Validators.required],
      qualifying_rider_id: ['', Validators.required]
    }, { validators: [this.riderSelectionValidator.bind(this)] });
  }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.riders = [];

    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId > 0) {
        this.champId = champId;
        this.loadChampionshipConfig(champId);
        this.loadRiders(champId);
        this.loadCalendarRace(champId);
      }
    });
  }

  loadChampionshipConfig(championshipId: number): void {
    this.championshipService.getChampionshipConfig(championshipId).subscribe({
      next: (config) => {
        this.championshipConfig = config;
        this.maxLineupsPerPilot = config.formation_limit_driver;
      },
      error: (err) => console.error('Failed to load championship config', err)
    });
  }

  loadCalendarRace(championshipId: number) {
    this.raceDetailService.getCalendarRace(championshipId, this.raceId ?? '0').subscribe({
      next: (race) => {
        this.raceTitle = race.race_id.name;
      },
      error: (err) => console.error('Failed to load race details', err)
    });
  }

  loadRiders(championshipId: number): void {
    this.dashboardService.getFantasyTeam(championshipId).subscribe({
      next: (team) => {
        this.riders = [
          team.official_rider_1,
          team.official_rider_2,
          team.reserve_rider
        ].filter((rider): rider is Rider => !!rider);
        this.loadExistingLineupAndUpdateForm(championshipId);
        this.loadAllLineupsAndUpdateRiders();
      },
      error: (err) => console.error('Failed to load riders', err)
    });
  }

  loadExistingLineupAndUpdateForm(champId: number) {
    this.raceDetailService.getLineupRace(champId, this.raceId ?? '0').subscribe({
      next: (existingLineups: LineupsResult[]) => {
        const existingLineup = existingLineups[0];
        this.existingLineupForRace = existingLineup ?? null;
        this.lineupsForm.patchValue({
          race_rider_id: this.normalizeRiderId(existingLineup?.race_rider_id) || this.riders[0]?.id,
          qualifying_rider_id: this.normalizeRiderId(existingLineup?.qualifying_rider_id) || this.riders[1]?.id
        });
      },
      error: (err) => console.error('Error loading existing lineup', err)
    });
  }

  protected loadAllLineupsAndUpdateRiders() {
    this.httpService.genericGet<LineupsResult[]>(`championship/${this.champId}/lineups/0?allCalendar=true`).subscribe({
      next: (existingBets) => {
        this.existingLineupsAllCalendar = existingBets;
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  onSubmit(): void {
    if (this.lineupsForm.valid && this.champId) {
      this.loading = true;
      const payload = {
        ...this.lineupsForm.value,
        calendar_id: this.raceId,
      };

      this.raceDetailService.upsertLineup(this.champId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.notificationService.showSuccess('lineups.submitSuccess');
          this.loadExistingLineupAndUpdateForm(this.champId);
          this.loadAllLineupsAndUpdateRiders();
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed', err);
          const backendMessage = err?.error?.details?.message || err?.error?.error;
          if (backendMessage) {
            this.notificationService.showErrorMessage(backendMessage);
          } else {
            this.notificationService.showError('lineups.submitFail');
          }
        }
      });
    }
  }

  goToRaceDetail(): void {
    this.router.navigate(['/race-detail', this.raceId]);
  }

  goBack() {
    this.router.navigate(['/']);
  }

  get selectedQualifyingRider(): Rider | undefined {
    return this.riders.find(rider => rider.id === Number(this.lineupsForm.get('qualifying_rider_id')?.value));
  }

  get selectedRaceRider(): Rider | undefined {
    return this.riders.find(rider => rider.id === Number(this.lineupsForm.get('race_rider_id')?.value));
  }

  getRemainingUses(riderId: number): number {
    return Math.max(this.maxLineupsPerPilot - this.countRiderInLineups(riderId), 0);
  }

  getRiderUsageSummary(riderId: number): string {
    const used = this.countRiderInLineups(riderId);
    return `${used} usi totali su ${this.maxLineupsPerPilot}`;
  }

  isRiderAtLimit(riderId: number): boolean {
    return this.countRiderInLineups(riderId) >= this.maxLineupsPerPilot;
  }

  isRiderBlocked(riderId: number): boolean {
    return this.isRiderAtLimit(riderId)
      && this.lineupsForm.get('qualifying_rider_id')?.value !== riderId
      && this.lineupsForm.get('race_rider_id')?.value !== riderId;
  }

  selectRider(riderId: number): void {
    if (this.isRiderBlocked(riderId)) return;

    const qualifyingControl = this.lineupsForm.get('qualifying_rider_id');
    const raceControl = this.lineupsForm.get('race_rider_id');

    if (!qualifyingControl?.value) {
      qualifyingControl?.setValue(riderId);
    } else if (!raceControl?.value || raceControl?.value === riderId) {
      raceControl?.setValue(riderId);
    } else if (qualifyingControl.value === riderId) {
      qualifyingControl.setValue('');
    } else {
      raceControl?.setValue(riderId);
    }

    this.lineupsForm.updateValueAndValidity();
  }

  private riderSelectionValidator(form: FormGroup) {
    const raceId = Number(form.get('race_rider_id')?.value);
    const qualId = Number(form.get('qualifying_rider_id')?.value);
    const isDuplicate = raceId && qualId && raceId === qualId;

    const qualControl = form.get('qualifying_rider_id');
    if (isDuplicate) {
      qualControl?.setErrors({ ...qualControl?.errors, duplicateRider: true });
    } else if (qualControl?.errors?.['duplicateRider']) {
      const { duplicateRider, ...remainingErrors } = qualControl.errors;
      qualControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }

    if (this.championshipConfig && this.existingLineupsAllCalendar.length > 0) {
      this.checkRiderLimit(form, raceId, qualId);
    }

    return null;
  }

  private checkRiderLimit(form: FormGroup, raceId: number, qualId: number): void {
    const raceControl = form.get('race_rider_id');
    const qualControl = form.get('qualifying_rider_id');

    const raceRiderCount = this.countRiderInLineups(raceId);
    const qualRiderCount = this.countRiderInLineups(qualId);

    if (raceId && raceRiderCount >= this.maxLineupsPerPilot) {
      raceControl?.setErrors({ ...raceControl?.errors, riderLimitExceeded: true });
    } else if (raceControl?.errors?.['riderLimitExceeded']) {
      const { riderLimitExceeded, ...remainingErrors } = raceControl.errors;
      raceControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }

    if (qualId && qualRiderCount >= this.maxLineupsPerPilot) {
      qualControl?.setErrors({ ...qualControl?.errors, riderLimitExceeded: true });
    } else if (qualControl?.errors?.['riderLimitExceeded']) {
      const { riderLimitExceeded, ...remainingErrors } = qualControl.errors;
      qualControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    }
  }

  private countRiderInLineups(riderId: number): number {
    if (!riderId) return 0;

    return this.existingLineupsAllCalendar.reduce((count, lineup) => {
      const lineupCalendarId = Number((lineup.calendar_id as any)?.id ?? lineup.calendar_id);
      if (lineupCalendarId === Number(this.raceId)) {
        return count;
      }

      const isQualifyingRider = this.normalizeRiderId(lineup.qualifying_rider_id) === riderId;
      const isRaceRider = this.normalizeRiderId(lineup.race_rider_id) === riderId;
      return (isQualifyingRider || isRaceRider) ? count + 1 : count;
    }, 0);
  }

  private normalizeRiderId(rider: any): number | null {
    if (!rider) return null;
    if (typeof rider === 'number') return rider;
    return Number(rider.id) || null;
  }
}
