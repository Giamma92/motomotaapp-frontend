// src/app/lineups/lineups.component.ts
import { Component, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CalendarRace, DashboardService, Rider } from '../../services/dashboard.service';
import { ChampionshipService, ChampionshipConfig } from '../../services/championship.service';
import { HttpService } from '../../services/http.service';
import { LineupsResult, RaceDetailService } from '../../services/race-detail.service';
import { NotificationServiceService } from '../../services/notification.service';
import { RaceScheduleService } from '../../services/race-schedule.service';
import { I18nService } from '../../services/i18n.service';
import { DateUtils } from '../../utils/date-utils';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-lineups',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './lineups.component.scss',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslatePipe
  ],
  template: `
    <div class="settings-container">
      <header class="header">
        <button mat-icon-button class="app-back-arrow" (click)="goBack()" aria-label="Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>{{ 'lineups.title' | t }}</h1>
      </header>

      <!-- ═══════════ Hero ═══════════ -->
      <section class="lineup-hero" *ngIf="raceTitle">
        <div class="lineup-hero-main">
          <span class="lineup-kicker" *ngIf="raceDateLabel">
            <i class="fa-regular fa-calendar"></i>
            {{ raceDateLabel }}
          </span>
          <h2 class="lineup-hero-title">{{ raceTitle }}</h2>
          <p class="lineup-hero-subtitle">{{ 'lineups.subtitle' | t }}</p>
          <div class="lineup-hero-pills">
            <span class="hero-pill hero-pill-primary" *ngIf="windowDeadline as deadline">
              <i class="fa-regular fa-clock"></i>
              Chiude {{ formatDeadline(deadline) }}
            </span>
            <span class="hero-pill hero-pill-countdown" [class.hero-pill-expired]="isDeadlinePassed" *ngIf="countdownText">
              <i class="fa-solid fa-stopwatch"></i>
              {{ countdownText }}
            </span>
            <span class="hero-pill">
              <i class="fa-solid fa-layer-group"></i>
              Limite: {{ maxLineupsPerPilot }} utilizzi per pilota
            </span>
          </div>
        </div>
      </section>

      <!-- ═══════════ Progress ═══════════ -->
      <div class="lineup-progress" [ngClass]="progressClass">
        <div class="lineup-progress-copy">
          <span class="summary-kicker">Schieramento</span>
          <strong>{{ progressLabel }}</strong>
        </div>
        <div class="lineup-progress-track" aria-hidden="true">
          <span [style.width.%]="slotsFilled * 50"></span>
        </div>
        <span class="lineup-progress-value">{{ slotsFilled * 50 }}%</span>
      </div>

      <!-- ═══════════ Main card ═══════════ -->
      <mat-card class="settings-card lineup-card">
        <div class="card-header">
          <i class="fa-solid fa-flag-checkered"></i>
          <span>Il tuo schieramento</span>
          <span class="card-header-meta">
            <span
              class="meta-tag"
              [class.ok-tag]="!!existingLineupForRace && !isDirty"
              [class.ko-tag]="!existingLineupForRace"
              [class.pending-tag]="!!existingLineupForRace && isDirty"
            >
              {{ savedStateLabel }}
            </span>
          </span>
        </div>

        <mat-card-content>
          <!-- ── Slots ── -->
          <section class="slot-grid">
            <div class="slot-card" [class.filled]="!!selectedQualifyingRider">
              <span class="slot-kicker">
                <i class="fa-solid fa-stopwatch"></i>
                Pilota qualifica
              </span>

              <div class="slot-rider" *ngIf="selectedQualifyingRider as qr">
                <span class="rider-number">#{{ qr.number }}</span>
                <div class="rider-copy">
                  <strong>{{ qr.first_name }} {{ qr.last_name }}</strong>
                  <span>Selezione attuale</span>
                </div>
                <button
                  type="button"
                  class="slot-clear"
                  (click)="clearSlot('qualifying')"
                  aria-label="Rimuovi pilota in qualifica"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="slot-empty" *ngIf="!selectedQualifyingRider">
                <i class="fa-regular fa-circle-xmark"></i>
                Non ancora scelto
              </div>

              <p class="slot-error-msg" *ngIf="slotError('qualifying_rider_id') as err">
                <i class="fa-solid fa-circle-exclamation"></i>
                {{ err | t }}
              </p>
            </div>

            <div class="slot-card" [class.filled]="!!selectedRaceRider">
              <span class="slot-kicker">
                <i class="fa-solid fa-flag-checkered"></i>
                Pilota gara
              </span>

              <div class="slot-rider" *ngIf="selectedRaceRider as rr">
                <span class="rider-number">#{{ rr.number }}</span>
                <div class="rider-copy">
                  <strong>{{ rr.first_name }} {{ rr.last_name }}</strong>
                  <span>Selezione attuale</span>
                </div>
                <button
                  type="button"
                  class="slot-clear"
                  (click)="clearSlot('race')"
                  aria-label="Rimuovi pilota in gara"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div class="slot-empty" *ngIf="!selectedRaceRider">
                <i class="fa-regular fa-circle-xmark"></i>
                Non ancora scelto
              </div>

              <p class="slot-error-msg" *ngIf="slotError('race_rider_id') as err">
                <i class="fa-solid fa-circle-exclamation"></i>
                {{ err | t }}
              </p>
            </div>
          </section>

          <!-- ── Rider assignment ── -->
          <section class="selection-section">
            <div class="section-head">
              <div class="section-head-copy">
                <h3>I tuoi piloti</h3>
                <p>Tocca "Qualifica" o "Gara" per assegnare il pilota a quello slot.</p>
              </div>
            </div>

            <!-- Search box for lineup riders -->
            <div class="rider-search-box" *ngIf="riders.length > 2">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input
                type="text"
                [(ngModel)]="riderSearchQuery"
                [ngModelOptions]="{standalone: true}"
                placeholder="Cerca tra i tuoi piloti per nome o #numero..."
                aria-label="Cerca pilota"
              />
              <button
                *ngIf="riderSearchQuery"
                type="button"
                class="search-clear-btn"
                (click)="riderSearchQuery = ''"
                aria-label="Cancella ricerca"
              >
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <p class="empty-note" *ngIf="riders.length === 0">Caricamento piloti...</p>
            <p class="empty-note" *ngIf="riders.length > 0 && filteredRiders.length === 0">
              Nessun pilota trovato per "{{ riderSearchQuery }}".
            </p>

            <div class="rider-list" *ngIf="filteredRiders.length > 0">
              <div
                class="rider-card"
                *ngFor="let rider of filteredRiders"
                [class.selected]="isInSlot(rider.id)"
                [class.blocked]="isRiderBlocked(rider.id)"
              >
                <div class="rider-card-main">
                  <span class="rider-number">#{{ rider.number }}</span>
                  <div class="rider-copy">
                    <strong>{{ rider.first_name }} {{ rider.last_name }}</strong>
                    <span>{{ getRiderUsageSummary(rider.id) }}</span>
                  </div>
                  <span class="rider-remaining" [class.tag-danger]="isRiderAtLimit(rider.id)">
                    {{ getRemainingUses(rider.id) }} liberi
                  </span>
                </div>

                <div class="rider-tags" *ngIf="isInSlot(rider.id) || isRiderBlocked(rider.id)">
                  <span class="tag tag-ok" *ngIf="isQualifying(rider.id)">
                    <i class="fa-solid fa-stopwatch"></i> In qualifica
                  </span>
                  <span class="tag tag-ok" *ngIf="isRace(rider.id)">
                    <i class="fa-solid fa-flag-checkered"></i> In gara
                  </span>
                  <span class="tag tag-warning" *ngIf="isRiderBlocked(rider.id)">
                    <i class="fa-solid fa-lock"></i> Limite raggiunto
                  </span>
                </div>

                <div class="rider-assign">
                  <button
                    type="button"
                    class="assign-btn"
                    [class.active]="isQualifying(rider.id)"
                    [disabled]="isRiderBlocked(rider.id)"
                    [attr.aria-pressed]="isQualifying(rider.id)"
                    (click)="assignToSlot('qualifying', rider.id)"
                  >
                    <i class="fa-solid fa-stopwatch"></i>
                    Qualifica
                  </button>
                  <button
                    type="button"
                    class="assign-btn"
                    [class.active]="isRace(rider.id)"
                    [disabled]="isRiderBlocked(rider.id)"
                    [attr.aria-pressed]="isRace(rider.id)"
                    (click)="assignToSlot('race', rider.id)"
                  >
                    <i class="fa-solid fa-flag-checkered"></i>
                    Gara
                  </button>
                </div>
              </div>
            </div>
          </section>
        </mat-card-content>

        <mat-card-actions class="lineup-actions">
          <button
            mat-raised-button
            color="primary"
            class="save-button"
            [disabled]="lineupsForm.invalid || loading"
            (click)="onSubmit()"
          >
            <mat-icon>{{ loading ? 'hourglass_top' : 'save' }}</mat-icon>
            {{ loading ? ('lineups.submitting' | t) : ('lineups.save' | t) }}
          </button>
          <button mat-stroked-button type="button" class="secondary-button" (click)="goToRaceDetail()">
            <mat-icon>flag</mat-icon>
            Dettaglio gara
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `
})
export class LineupsComponent implements OnInit, OnDestroy {
  lineupsForm: FormGroup;
  loading = false;
  riders: Rider[] = [];
  riderSearchQuery = '';
  countdownText = '';
  isDeadlinePassed = false;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  existingLineupsAllCalendar: LineupsResult[] = [];
  existingLineupForRace: LineupsResult | null = null;
  maxLineupsPerPilot = 9999;
  championshipConfig: ChampionshipConfig | null = null;
  calendarRace: CalendarRace | null = null;
  raceTitle = '';
  private champId = 0;
  private raceId: string | null = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private raceDetailService: RaceDetailService,
    private httpService: HttpService,
    private notificationService: NotificationServiceService,
    private raceScheduleService: RaceScheduleService,
    private i18nService: I18nService,
    private navService: NavigationService
  ) {
    this.lineupsForm = this.fb.group({
      race_rider_id: ['', Validators.required],
      qualifying_rider_id: ['', Validators.required]
    }, { validators: [this.riderSelectionValidator.bind(this)] });
  }

  get filteredRiders(): Rider[] {
    const q = this.riderSearchQuery.trim().toLowerCase();
    if (!q) return this.riders;
    return this.riders.filter(r => {
      const fullName = `${r.first_name} ${r.last_name}`.toLowerCase();
      const num = String(r.number);
      return fullName.includes(q) || num.includes(q);
    });
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

  startCountdown(): void {
    this.updateCountdown();
    if (!this.countdownTimer) {
      this.countdownTimer = setInterval(() => this.updateCountdown(), 1000);
    }
  }

  updateCountdown(): void {
    const deadline = this.windowDeadline;
    if (!deadline) {
      this.countdownText = '';
      this.isDeadlinePassed = false;
      return;
    }
    const diff = deadline.getTime() - Date.now();
    if (diff <= 0) {
      this.countdownText = 'Finestra chiusa';
      this.isDeadlinePassed = true;
      return;
    }
    this.isDeadlinePassed = false;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      this.countdownText = `${days}g ${hours}h ${minutes}m rimanenti`;
    } else if (hours > 0) {
      const padM = String(minutes).padStart(2, '0');
      const padS = String(seconds).padStart(2, '0');
      this.countdownText = `${hours}h ${padM}m ${padS}s rimanenti`;
    } else {
      const padM = String(minutes).padStart(2, '0');
      const padS = String(seconds).padStart(2, '0');
      this.countdownText = `${padM}m ${padS}s rimanenti`;
    }
  }

  ngOnDestroy(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  loadChampionshipConfig(championshipId: number): void {
    this.championshipService.getChampionshipConfig(championshipId).subscribe({
      next: (config) => {
        this.championshipConfig = config;
        this.maxLineupsPerPilot = config.formation_limit_driver;
        this.startCountdown();
      },
      error: (err) => console.error('Failed to load championship config', err)
    });
  }

  loadCalendarRace(championshipId: number) {
    this.raceDetailService.getCalendarRace(championshipId, this.raceId ?? '0').subscribe({
      next: (race) => {
        this.calendarRace = race;
        this.raceTitle = race.race_id.name;
        this.startCountdown();
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
        // Prefill only when a lineup is already saved; otherwise start empty so
        // nothing can be submitted without an explicit choice.
        this.lineupsForm.patchValue({
          race_rider_id: this.normalizeRiderId(existingLineup?.race_rider_id) || '',
          qualifying_rider_id: this.normalizeRiderId(existingLineup?.qualifying_rider_id) || ''
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
    } else {
      this.lineupsForm.markAllAsTouched();
      this.lineupsForm.updateValueAndValidity();
    }
  }

  goToRaceDetail(): void {
    this.router.navigate(['/race-detail', this.raceId]);
  }

  goBack() {
    this.navService.back(this.raceId ? `/race-detail/${this.raceId}` : '/calendar');
  }

  // ─── Slots ───

  get selectedQualifyingRider(): Rider | undefined {
    return this.riders.find(rider => rider.id === Number(this.lineupsForm.get('qualifying_rider_id')?.value));
  }

  get selectedRaceRider(): Rider | undefined {
    return this.riders.find(rider => rider.id === Number(this.lineupsForm.get('race_rider_id')?.value));
  }

  get slotsFilled(): number {
    return (this.selectedQualifyingRider ? 1 : 0) + (this.selectedRaceRider ? 1 : 0);
  }

  isQualifying(riderId: number): boolean {
    return Number(this.lineupsForm.get('qualifying_rider_id')?.value) === riderId;
  }

  isRace(riderId: number): boolean {
    return Number(this.lineupsForm.get('race_rider_id')?.value) === riderId;
  }

  isInSlot(riderId: number): boolean {
    return this.isQualifying(riderId) || this.isRace(riderId);
  }

  assignToSlot(slot: 'qualifying' | 'race', riderId: number): void {
    if (this.isRiderBlocked(riderId)) return;

    const targetName = slot === 'qualifying' ? 'qualifying_rider_id' : 'race_rider_id';
    const otherName = slot === 'qualifying' ? 'race_rider_id' : 'qualifying_rider_id';
    const target = this.lineupsForm.get(targetName);
    const other = this.lineupsForm.get(otherName);
    if (!target || !other) return;

    if (Number(target.value) === riderId) {
      // Toggle off: tapping the active slot button clears it.
      target.setValue('');
    } else {
      // A rider can only occupy one slot: moving frees the other one.
      if (Number(other.value) === riderId) {
        other.setValue('');
      }
      target.setValue(riderId);
    }

    this.lineupsForm.updateValueAndValidity();
  }

  clearSlot(slot: 'qualifying' | 'race'): void {
    const control = this.lineupsForm.get(slot === 'qualifying' ? 'qualifying_rider_id' : 'race_rider_id');
    control?.setValue('');
    this.lineupsForm.updateValueAndValidity();
  }

  slotError(controlName: 'qualifying_rider_id' | 'race_rider_id'): string | null {
    const errors = this.lineupsForm.get(controlName)?.errors;
    if (!errors) return null;
    if (errors['duplicateRider']) return 'lineups.error.duplicate';
    if (errors['riderLimitExceeded']) return 'lineups.error.riderLimitExceeded';
    return null;
  }

  // ─── Progress / status ───

  get isDirty(): boolean {
    const savedRace = this.normalizeRiderId(this.existingLineupForRace?.race_rider_id);
    const savedQual = this.normalizeRiderId(this.existingLineupForRace?.qualifying_rider_id);
    if (!savedRace && !savedQual) return this.slotsFilled > 0;

    const currentRace = Number(this.lineupsForm.get('race_rider_id')?.value) || null;
    const currentQual = Number(this.lineupsForm.get('qualifying_rider_id')?.value) || null;
    return savedRace !== currentRace || savedQual !== currentQual;
  }

  get savedStateLabel(): string {
    if (!this.existingLineupForRace) return 'Da completare';
    return this.isDirty ? 'Modifiche non salvate' : 'Salvato';
  }

  get progressLabel(): string {
    if (this.slotsFilled < 2) return this.slotsFilled + ' / 2 piloti scelti';
    if (!this.existingLineupForRace) return 'Pronto da salvare';
    return this.isDirty ? 'Modifiche non salvate' : 'Pronto per la gara';
  }

  get progressClass(): string {
    if (this.slotsFilled < 2) return '';
    if (this.existingLineupForRace && !this.isDirty) return 'is-complete';
    return 'is-dirty';
  }

  // ─── Hero: race info + open-window deadline ───

  get raceDateLabel(): string {
    const race = this.calendarRace;
    if (!race?.event_date) return '';
    const eventDate = DateUtils.buildLocalDateTime(race.event_date, race.event_time ?? '00:00:00');
    if (!eventDate) return '';
    const date = new Intl.DateTimeFormat(this.i18nService.locale, {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
    }).format(eventDate);
    const time = new Intl.DateTimeFormat(this.i18nService.locale, {
      hour: '2-digit', minute: '2-digit'
    }).format(eventDate);
    return `${date} · ${time}`;
  }

  get windowDeadline(): Date | null {
    if (!this.calendarRace) return null;
    return this.raceScheduleService.getOpenWindowDeadline(
      this.calendarRace,
      this.championshipConfig?.timezone
    );
  }

  formatDeadline(date: Date): string {
    return new Intl.DateTimeFormat(this.i18nService.locale, {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  // ─── Rider usage ───

  getRemainingUses(riderId: number): number {
    return Math.max(this.maxLineupsPerPilot - this.countRiderInLineups(riderId), 0);
  }

  getRiderUsageSummary(riderId: number): string {
    const used = this.countRiderInLineups(riderId);
    return `${used} / ${this.maxLineupsPerPilot} utilizzi`;
  }

  isRiderAtLimit(riderId: number): boolean {
    return this.countRiderInLineups(riderId) >= this.maxLineupsPerPilot;
  }

  isRiderBlocked(riderId: number): boolean {
    return this.isRiderAtLimit(riderId)
      && this.lineupsForm.get('qualifying_rider_id')?.value !== riderId
      && this.lineupsForm.get('race_rider_id')?.value !== riderId;
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
