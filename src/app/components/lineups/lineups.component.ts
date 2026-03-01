// src/app/lineups/lineups.component.ts
import { Component, OnInit } from '@angular/core';
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
        <button mat-icon-button (click)="goBack()">
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
          <form [formGroup]="lineupsForm" (ngSubmit)="onSubmit()">

            <mat-form-field appearance="fill" class="full-width">
              <mat-label>{{ 'lineups.qualifyingRider' | t }}</mat-label>
              <mat-select formControlName="qualifying_rider_id" required (selectionChange)="lineupsForm.updateValueAndValidity()">
                <mat-option [value]="" disabled>{{ 'lineups.selectRider' | t }}</mat-option>
                <mat-option *ngFor="let rider of riders" [value]="rider.id">
                  {{ rider.first_name }} {{ rider.last_name }} (#{{ rider.number }})
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
                <mat-option *ngFor="let rider of riders" [value]="rider.id">
                  {{ rider.first_name }} {{ rider.last_name }} (#{{ rider.number }})
                </mat-option>
              </mat-select>
              <mat-error *ngIf="lineupsForm.get('race_rider_id')?.hasError('riderLimitExceeded')">
                {{ 'lineups.error.riderLimitExceeded' | t }}
              </mat-error>
            </mat-form-field>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button
                  color="primary"
                  [disabled]="lineupsForm.invalid || loading"
                  (click)="onSubmit()">
            {{ loading ? ('lineups.submitting' | t) : ('lineups.save' | t) }}
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    @font-face {
      font-family: 'MotoGP-Bold';
      src: url('/assets/fonts/MotoGP-Bold.woff2') format('woff2');
    }

    .header-content {
      width: 100%;
      padding: 24px 16px;
      background: white;
      border-bottom: 3px solid var(--primary-color);
      margin-bottom: 24px;
      background-color: whitesmoke;
    }

    .race-title {
      font-family: 'MotoGP-Bold', sans-serif;
      font-size: 1.8rem;
      color: var(--primary-color);
      letter-spacing: 1.5px;
      text-align: center;
      text-transform: uppercase;
    }

    .session-info {
      font-family: 'MotoGP Regular';
      font-size: 1rem;
      color: #666;
      text-align: center;
      letter-spacing: 0.8px;
      font-weight: 500;
    }

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
    .header {
      width: 100%;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      h1 {
        margin: 0;
        color: white;
      }
    }
    mat-card-header {
      padding: 0px !important;
      margin-bottom: 24px !important;

      mat-card-title {
        font-size: 1.25rem !important;
        font-weight: 500 !important;
      }
    }
    .full-width {
      width: 100%;
      margin-bottom: 20px;
    }
    mat-card-actions {
      display: flex;
      justify-content: flex-end;
      padding: 16px 0 0 0;
    }

    /* Dashboard-aligned compact full-page layout */
    .settings-container {
      display: block;
      min-height: 100vh;
      background:
        radial-gradient(circle at 8% -20%, rgba(200, 16, 46, 0.14), transparent 42%),
        radial-gradient(circle at 100% 0%, rgba(0, 0, 0, 0.05), transparent 34%),
        linear-gradient(158deg, #ffffff 0%, #f8f8f9 48%, #f1f2f4 100%);
      padding: calc(var(--app-header-height) + 10px) 10px 12px;
      color: #16181d;
    }

    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: var(--app-header-height);
      margin: 0;
      padding: 0 8px;
      background: rgba(17, 18, 20, 0.97);
      color: #fff;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
      z-index: 1000;
      gap: 8px;
    }

    .header button {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: #fff;
      color: #c8102e;
    }

    .header h1 {
      color: #fff;
      text-transform: uppercase;
      letter-spacing: .3px;
      font-size: clamp(1rem, 2.7vw, 1.3rem);
      padding-right: 42px;
      text-align: center;
      flex: 1;
    }

    .settings-card {
      max-width: none;
      width: 100%;
      padding: 0;
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: visible !important;
      margin: 0;
    }

    .header-content {
      background: #111214;
      color: #fff;
      border: 0;
      border-radius: 10px;
      margin: 0 0 8px;
      padding: .62rem .78rem;
    }

    .race-title {
      color: #fff;
      font-size: 1.08rem;
      letter-spacing: .4px;
      margin: 0;
    }

    .session-info {
      color: rgba(255, 255, 255, 0.88);
      font-size: .85rem;
      letter-spacing: .2px;
    }

    mat-card-header {
      margin-bottom: 0 !important;
      padding: 0 !important;
    }

    mat-card-content {
      background: #fff;
      border: 1px solid rgba(17, 18, 20, 0.12);
      border-radius: 10px;
      padding: .55rem .62rem .45rem !important;
    }

    .full-width {
      margin-bottom: 6px;
    }

    mat-card-actions {
      padding: 8px 0 0;
      justify-content: flex-end;
    }

    mat-card-actions button {
      min-height: 38px;
      border-radius: 9px;
      padding: 0 12px;
      background: #c8102e !important;
      color: #fff !important;
    }

    @media (max-width: 768px) {
      .settings-container {
        padding: calc(var(--app-header-height) + 8px) 8px 10px;
      }
    }
  `]
})
export class LineupsComponent implements OnInit {
  lineupsForm: FormGroup;
  loading: boolean = false;
  riders: Rider[] = [];
  existingLineupsAllCalendar: LineupsResult[] = [];
  maxLineupsPerPilot: number = 9999;
  championshipConfig: ChampionshipConfig | null = null;
  private champId: number = 0;
  private raceId: string|null = '';
  raceTitle: string = '';

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

  /**
   * Loads the championship configuration to get the formation_limit_driver value
   * This determines the maximum number of lineups allowed per rider
   */
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
        this.lineupsForm.patchValue({
          race_rider_id: existingLineup?.race_rider_id || this.riders[0]?.id,
          qualifying_rider_id: existingLineup?.qualifying_rider_id || this.riders[1]?.id
        });
      },
      error: (err) => console.error('Error loading existing lineup', err)
    });
  }

  protected loadAllLineupsAndUpdateRiders() {
    this.httpService.genericGet<LineupsResult[]>(`championship/${this.champId}/lineups/0?allCalendar=true`).subscribe({
      next: (existingBets) => {
        this.existingLineupsAllCalendar = existingBets;
        this.updateRiders();
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  private updateRiders() {
    const ridersToRemove: number[] = [];

    this.riders.forEach(rider => {
      // Count lineups for current rider
      const countLineupsPerRider = this.existingLineupsAllCalendar.reduce((acc, lineup) => {
        return (lineup.qualifying_rider_id?.id == rider.id || lineup.race_rider_id?.id == rider.id) ? acc + 1 : acc;
      }, 0);

      // Check if exceeds max lineups per pilot
      if (countLineupsPerRider >= this.maxLineupsPerPilot) {
        ridersToRemove.push(rider.id);
      }
    });

    // Filter out riders that reached max lineups using Array.filter
    this.riders = this.riders.filter(rider =>
      !ridersToRemove.includes(rider.id)
    );
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
          this.goToRaceDetail();
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed', err);
          this.notificationService.showError('lineups.submitFail');
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

  private riderSelectionValidator(form: FormGroup) {
    const raceId = form.get('race_rider_id')?.value;
    const qualId = form.get('qualifying_rider_id')?.value;
    const isDuplicate = raceId && qualId && raceId === qualId;

    // Check for duplicate riders
    const qualControl = form.get('qualifying_rider_id');
    if (isDuplicate) {
      qualControl?.setErrors({ ...qualControl?.errors, duplicateRider: true });
    } else {
      if (qualControl?.errors?.['duplicateRider']) {
        const { duplicateRider, ...remainingErrors } = qualControl.errors;
        qualControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
      }
    }

    // Check for rider limit exceeded
    if (this.championshipConfig && this.existingLineupsAllCalendar.length > 0) {
      this.checkRiderLimit(form, raceId, qualId);
    }

    return null;
  }

  /**
   * Validates that selected riders don't exceed the maximum number of lineups allowed per rider
   * This checks against the formation_limit_driver configuration from the championship
   */
  private checkRiderLimit(form: FormGroup, raceId: number, qualId: number): void {
    const raceControl = form.get('race_rider_id');
    const qualControl = form.get('qualifying_rider_id');

    // Count existing lineups for each selected rider
    const raceRiderCount = this.countRiderInLineups(raceId);
    const qualRiderCount = this.countRiderInLineups(qualId);

    // Check if adding this lineup would exceed the limit
    if (raceId && raceRiderCount >= this.maxLineupsPerPilot) {
      raceControl?.setErrors({ ...raceControl?.errors, riderLimitExceeded: true });
    } else {
      if (raceControl?.errors?.['riderLimitExceeded']) {
        const { riderLimitExceeded, ...remainingErrors } = raceControl.errors;
        raceControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
      }
    }

    if (qualId && qualRiderCount >= this.maxLineupsPerPilot) {
      qualControl?.setErrors({ ...qualControl?.errors, riderLimitExceeded: true });
    } else {
      if (qualControl?.errors?.['riderLimitExceeded']) {
        const { riderLimitExceeded, ...remainingErrors } = qualControl.errors;
        qualControl.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
      }
    }
  }

  /**
   * Counts how many times a rider appears in all lineups (both qualifying and race positions)
   * @param riderId The ID of the rider to count
   * @returns The number of lineups where this rider appears
   */
  private countRiderInLineups(riderId: number): number {
    if (!riderId) return 0;

    return this.existingLineupsAllCalendar.reduce((count, lineup) => {
      const isQualifyingRider = (lineup.qualifying_rider_id as any) == riderId;
      const isRaceRider = (lineup.race_rider_id as any) == riderId;
      return (isQualifyingRider || isRaceRider) ? count + 1 : count;
    }, 0);
  }

}
