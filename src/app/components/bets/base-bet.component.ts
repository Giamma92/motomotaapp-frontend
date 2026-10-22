import { Component, OnInit, OnDestroy, inject } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { Router, ActivatedRoute } from "@angular/router";
import { ChampionshipService, ChampionshipConfig } from "../../services/championship.service";
import { CalendarRace, ChampionshipRider, DashboardService } from "../../services/dashboard.service";
import { HttpService } from "../../services/http.service";
import { BetResult, LineupsResult, RaceDetailService } from "../../services/race-detail.service";
import { RaceScheduleService } from "../../services/race-schedule.service";
import { I18nService } from "../../services/i18n.service";
import { DateUtils } from "../../utils/date-utils";
import { ExistingBetsModalComponent } from "./existing-bets-modal/existing-bets-modal.component";
import { LineupModalComponent } from "./lineup-modal/lineup-modal.component";
import { NotificationServiceService } from "../../services/notification.service";
import { NavigationService } from "../../services/navigation.service";
import { MotoGPAssetService } from "../../services/motogp-asset.service";
import { ThemeService } from "../../services/theme.service";
import { HapticService } from "../../services/haptic.service";

@Component({
  template: ''
})
export abstract class BaseBetComponent implements OnInit, OnDestroy {
  protected navService = inject(NavigationService);
  public motogpAssetService = inject(MotoGPAssetService);
  public themeService = inject(ThemeService);
  protected haptic = inject(HapticService);

  get isLightTheme(): boolean {
    return this.themeService.mode() === 'light';
  }

  get circuitLayoutUrl(): string | null {
    if (!this.calendarRace?.race_id) return null;
    return this.motogpAssetService.getCircuitLayoutUrl(
      this.calendarRace.race_id.country,
      this.calendarRace.race_id.name
    );
  }
  abstract betForm: FormGroup;
  abstract betType: 'sprint' | 'race';
  abstract get betEndpoint(): string;
  abstract get maxPointsPerBet(): number;
  abstract get maxBetsPerRace(): number;
  abstract get maxBetsPerPilot(): number;
  abstract get formTitle(): string;
  abstract get formSubtitle(): string;
  abstract get removeRaceRider(): boolean;

  raceTitle = '';
  loading = false;
  riders: ChampionshipRider[] = [];
  riderSearchQuery = '';
  countdownText = '';
  isDeadlinePassed = false;
  private countdownTimer: ReturnType<typeof setInterval> | null = null;
  protected champId = 0;
  protected raceId: string | null = '';
  protected championshipConfig: ChampionshipConfig | null = null;
  existingBetsCurrentRace: any[] = [];
  existingBetsAllCalendar: any[] = [];
  existingLineup: LineupsResult|null = null;
  existingBetsPointsSum = 0;
  calendarRace: CalendarRace | null = null;
  lastSavedBetSummary: { riderName: string; position: number; points: number } | null = null;

  constructor(
    protected fb: FormBuilder,
    protected router: Router,
    protected dashboardService: DashboardService,
    protected championshipService: ChampionshipService,
    protected httpService: HttpService,
    protected route: ActivatedRoute,
    protected raceDetailService: RaceDetailService,
    protected notificationService: NotificationServiceService,
    protected dialog: MatDialog,
    protected raceScheduleService: RaceScheduleService,
    protected i18nService: I18nService
  ) {
    this.initForm();
  }

  protected initForm() {
    this.betForm = this.fb.group({
      rider_id: ['', Validators.required],
      position: ['', Validators.required],
      points: ['', [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.raceId = this.route.snapshot.paramMap.get('id');
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId > 0) {
        this.champId = champId;
        this.loadChampionshipConfiguration(champId);
        this.loadRiders(champId);
        this.loadCalendarRace(champId);
      }
    });
  }

  onSubmit(): void {
    if (this.maxBetsPerRace && this.existingBetsCurrentRace.length >= this.maxBetsPerRace) {
      this.notificationService.showError('bets.maxBetsReached', { count: this.maxBetsPerRace });
      return;
    }
    if (this.betForm.valid && this.champId && this.raceId) {
      this.loading = true;
      const payload = {
        ...this.betForm.value,
        calendar_id: this.raceId
      };

      this.httpService.genericPut(`championship/${this.champId}/${this.betEndpoint}`, payload).subscribe({
        next: () => {
          this.loading = false;
          this.haptic.success();
          this.notificationService.showSuccess('bets.submitSuccess');
          this.lastSavedBetSummary = {
            riderName: this.getSelectedRiderLabel(),
            position: Number(this.betForm.get('position')?.value),
            points: Number(this.betForm.get('points')?.value)
          };
          this.loadRaceBetsAndUpdateValidations();
          this.loadAllCalendarBetsAndUpdateRiders();
          //this.router.navigate(['/race-detail', this.raceId]);
        },
        error: (err) => {
          this.loading = false;
          console.error('Submission failed', err);
          const backendMessage = err?.error?.details?.message || err?.error?.error;
          if (backendMessage) {
            this.notificationService.showErrorMessage(backendMessage);
          } else {
            this.haptic.error();
            this.notificationService.showError('bets.submitFail');
          }
        }
      });
    } else {
      this.betForm.markAllAsTouched();
      this.betForm.updateValueAndValidity();
    }
  }

  protected loadRaceBetsAndUpdateValidations() {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/${this.betEndpoint}/${this.raceId}?allCalendar=false`).subscribe({
      next: (existingBets) => {
        this.existingBetsCurrentRace = existingBets;
        this.existingBetsPointsSum = existingBets.reduce((acc, bet) => acc + bet.points, 0);
        this.updatePointsValidation();
        this.betType === 'race' && this.updateMaxBetsValidation();
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  protected loadAllCalendarBetsAndUpdateRiders() {
    this.httpService.genericGet<BetResult[]>(`championship/${this.champId}/${this.betEndpoint}/0?allCalendar=true`).subscribe({
      next: (existingBets) => {
        this.existingBetsAllCalendar = existingBets;
        this.updateRiders();
      },
      error: (err) => console.error('Error loading existing bets', err)
    });
  }

  private updateRiders() {
    // Keep all riders visible in UI. Availability is handled by disabled state and reason labels.
  }

  get remainingPoints(): number {
    return Math.max(this.maxPointsPerBet - this.existingBetsPointsSum, 0);
  }

  get betsPlacedThisRace(): number {
    return this.existingBetsCurrentRace.length;
  }

  get selectedRiderId(): number | null {
    const raw = this.betForm.get('rider_id')?.value;
    const riderId = Number(raw);
    return Number.isFinite(riderId) ? riderId : null;
  }

  selectedConstructor = 'all';
  showRiderRoster = true;

  get constructorList(): string[] {
    const set = new Set<string>();
    for (const r of this.riders) {
      if (r.constructor_id?.name) {
        set.add(r.constructor_id.name);
      }
    }
    return Array.from(set).sort();
  }

  setConstructorFilter(team: string): void {
    this.selectedConstructor = this.selectedConstructor === team ? 'all' : team;
  }

  toggleRiderRoster(): void {
    this.showRiderRoster = !this.showRiderRoster;
  }

  get availableRiders(): ChampionshipRider[] {
    return this.riders;
  }

  get filteredRiders(): ChampionshipRider[] {
    const q = this.riderSearchQuery.trim().toLowerCase();
    const team = this.selectedConstructor;
    return this.riders.filter(r => {
      if (team !== 'all' && r.constructor_id?.name !== team) {
        return false;
      }
      if (!q) return true;
      const fullName = `${r.rider_id.first_name} ${r.rider_id.last_name}`.toLowerCase();
      const num = String(r.rider_id.number);
      const teamName = (r.constructor_id?.name || '').toLowerCase();
      return fullName.includes(q) || num.includes(q) || teamName.includes(q);
    });
  }

  getRiderUsageCount(riderId: number): number {
    return this.existingBetsAllCalendar.reduce((acc, bet) => {
      const betCalendarId = Number((bet.calendar_id as any)?.id ?? bet.calendar_id);
      if (betCalendarId === Number(this.raceId) && Number((bet.rider_id as any)?.id ?? bet.rider_id) === riderId) {
        return acc;
      }

      const existingId = typeof bet.rider_id === 'object' ? bet.rider_id?.id : bet.rider_id;
      return Number(existingId) === riderId ? acc + 1 : acc;
    }, 0);
  }

  getRiderRemainingUses(riderId: number): number {
    return Math.max(this.maxBetsPerPilot - this.getRiderUsageCount(riderId), 0);
  }

  isRiderUnavailable(rider: ChampionshipRider): boolean {
    const riderId = rider.rider_id.id;
    if (this.removeRaceRider && this.existingLineup) {
      const raceRider = this.existingLineup.race_rider_id as any;
      const lineupRaceRiderId = typeof raceRider === 'object' ? raceRider?.id : raceRider;
      if (Number(lineupRaceRiderId) === riderId) {
        return true;
      }
    }

    return this.getRiderUsageCount(riderId) >= this.maxBetsPerPilot && this.selectedRiderId !== riderId;
  }

  getRiderDisabledReason(rider: ChampionshipRider): string | null {
    const riderId = rider.rider_id.id;
    if (this.removeRaceRider && this.existingLineup) {
      const raceRider = this.existingLineup.race_rider_id as any;
      const lineupRaceRiderId = typeof raceRider === 'object' ? raceRider?.id : raceRider;
      if (Number(lineupRaceRiderId) === riderId) {
        return 'Già usato come pilota gara nello schieramento';
      }
    }

    if (this.getRiderUsageCount(riderId) >= this.maxBetsPerPilot && this.selectedRiderId !== riderId) {
      return 'Hai raggiunto il limite massimo su questo pilota';
    }

    return null;
  }

  selectRiderCard(riderId: number): void {
    this.haptic.light();
    const rider = this.riders.find(entry => entry.rider_id.id === riderId);
    if (!rider || this.isRiderUnavailable(rider)) {
      return;
    }

    this.betForm.get('rider_id')?.setValue(riderId);
    this.betForm.updateValueAndValidity();
    if (typeof window !== 'undefined' && window.innerWidth <= 820) {
      this.showRiderRoster = false;
    }
  }

  getSelectedRiderLabel(): string {
    const rider = this.riders.find(entry => entry.rider_id.id === this.selectedRiderId);
    return rider ? `${rider.rider_id.first_name} ${rider.rider_id.last_name} #${rider.rider_id.number}` : 'Pilota non selezionato';
  }

  get selectedRider(): ChampionshipRider | null {
    return this.riders.find(entry => entry.rider_id.id === this.selectedRiderId) ?? null;
  }

  /** FA icon for the card header strip (sprint vs race). */
  get betHeaderIcon(): string {
    return this.betType === 'sprint' ? 'fa-gauge-high' : 'fa-flag-checkered';
  }

  /**
   * True when the championship has no per-pilot bet limit configured
   * (the getter falls back to a huge sentinel that must not be shown).
   */
  get pilotUsesUnlimited(): boolean {
    return this.maxBetsPerPilot >= 999999;
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

  get sprintTimeLabel(): string | null {
    if (this.betType !== 'sprint' || !this.calendarRace) return null;
    const sprintTime = this.raceScheduleService.getSprintTime(
      this.calendarRace,
      this.championshipConfig?.timezone
    );
    if (!sprintTime) return null;
    const label = new Intl.DateTimeFormat(this.i18nService.locale, {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(sprintTime);
    return `Sprint · ${label}`;
  }

  formatDeadline(date: Date): string {
    return new Intl.DateTimeFormat(this.i18nService.locale, {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(date);
  }

  // ─── Position step (chips) ───

  get positionValue(): number | null {
    const value = Number(this.betForm.get('position')?.value);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  get positionOptions(): number[] {
    const max = this.riders.length;
    return max > 0 ? Array.from({ length: max }, (_, index) => index + 1) : [];
  }

  setPosition(position: number): void {
    if (this.betForm.disabled) return;
    this.haptic.light();
    this.betForm.get('position')?.setValue(position);
  }

  // ─── Points step (stepper + presets) ───

  get pointsValue(): number {
    const value = Number(this.betForm.get('points')?.value);
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  setPoints(points: number): void {
    if (this.betForm.disabled) return;
    const max = Math.max(this.remainingPoints, 1);
    const clamped = Math.min(Math.max(Math.round(points), 1), max);
    this.betForm.get('points')?.setValue(clamped);
  }

  stepPoints(delta: number): void {
    this.setPoints((this.pointsValue || 0) + delta);
  }

  get pointsPresets(): number[] {
    return [1, 5, 10, 25].filter(value => value <= this.remainingPoints);
  }

  setPointsPercent(percent: number): void {
    const pts = Math.max(1, Math.round((this.remainingPoints * percent) / 100));
    this.setPoints(pts);
  }

  get pointsAfterBet(): number {
    return Math.max(this.remainingPoints - this.pointsValue, 0);
  }

  get pointsBudgetPercent(): number {
    if (!this.maxPointsPerBet) return 100;
    return Math.max(0, Math.min(100, Math.round((this.remainingPoints / this.maxPointsPerBet) * 100)));
  }

  get isFormLocked(): boolean {
    return this.betForm.disabled;
  }

  get pointsMaxError(): boolean {
    return !!this.betForm.get('points')?.errors?.['max'];
  }

  get pointsMinError(): boolean {
    const control = this.betForm.get('points');
    const errors = control?.errors;
    if (!errors || !control?.touched) return false;
    return !!errors['min'] || !!errors['required'];
  }

  // ─── Placed bets list (inline recap) ───

  private findRiderById(raw: any): ChampionshipRider | null {
    const id = typeof raw === 'object' && raw ? raw.id : raw;
    return this.riders.find(entry => entry.rider_id.id === Number(id)) ?? null;
  }

  betRiderNumber(bet: BetResult): string {
    const rider = this.findRiderById(bet.rider_id);
    return rider ? `#${rider.rider_id.number}` : '#—';
  }

  displayBetRider(bet: BetResult): string {
    const rider = this.findRiderById(bet.rider_id);
    if (!rider) return 'Pilota sconosciuto';
    return `${rider.rider_id.first_name} ${rider.rider_id.last_name}`;
  }

  betStatusLabel(bet: BetResult): string {
    const outcome = (bet as any).outcome;
    if (outcome === null || outcome === undefined || String(outcome).trim() === '') return 'In attesa';
    const normalized = String(outcome).trim().toLowerCase();
    return ['true', 'ok', 'win', 'won', 'success', 'correct'].includes(normalized) ? 'Vinta' : 'Persa';
  }

  betStatusClass(bet: BetResult): string {
    const label = this.betStatusLabel(bet);
    return label === 'Vinta' ? 'ok-tag' : label === 'Persa' ? 'ko-tag' : 'pending-tag';
  }

  loadLineupRace(): void {
    this.raceDetailService.getLineupRace(this.champId, this.raceId ?? '0').subscribe({
      next: (existingLineup: LineupsResult[]) => {
        this.existingLineup = existingLineup[0];
        // update the riders list once lineup is loaded
        if (this.removeRaceRider) {
          this.updateRiders();
        }
      },
      error: (err) => console.error('Error loading existing lineup', err)
    });
  }

  loadRiders(championshipId: number): void {
    this.dashboardService.getAllRiders(championshipId).subscribe({
      next: (riders) => {
        this.riders = riders;
        this.loadRaceBetsAndUpdateValidations();
        this.loadAllCalendarBetsAndUpdateRiders();
        this.loadLineupRace();
        const positionControl = this.betForm.get('position');
        if (positionControl) {
          positionControl.addValidators(Validators.max(this.riders.length));
          positionControl.updateValueAndValidity();
        }
      },
      error: (err) => console.error('Failed to load riders', err)
    });
  }

  loadCalendarRace(championshipId: number) {
    this.raceDetailService.getCalendarRace(championshipId, this.raceId!).subscribe({
      next: (race) => {
        this.calendarRace = race;
        this.raceTitle = race.race_id.name;
        this.startCountdown();
      },
      error: (err) => console.error('Failed to load race details', err)
    });
  }

  goBack() {
    this.navService.back(this.raceId ? `/race-detail/${this.raceId}` : '/calendar');
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

  private loadChampionshipConfiguration(champId: number): void {
    this.championshipService.getChampionshipConfig(champId).subscribe({
      next: (config) => {
        this.championshipConfig = config;
        this.updatePointsValidation();
        this.updateMaxBetsValidation();
        this.startCountdown();
      },
      error: (err) => console.error('Failed to load championship configuration', err)
    });
  }

  private updatePointsValidation(): void {
    const pointsControl = this.betForm.get('points');
    if (pointsControl && this.maxPointsPerBet) {
      const maxPoints = this.maxPointsPerBet - this.existingBetsPointsSum;
      pointsControl.setValidators([
        Validators.required,
        Validators.max(maxPoints),
        Validators.min(1) // minimum of 1 point required
      ]);
      pointsControl.updateValueAndValidity();
    }
  }

  private updateMaxBetsValidation(): void {
    if (this.maxBetsPerRace) {
      const maxReached = this.existingBetsCurrentRace.length >= this.maxBetsPerRace;
      const currentErrors = this.betForm.errors || {};

      if (maxReached) {
        this.betForm.setErrors({ ...currentErrors, maxBetsReached: true });
        this.betForm.disable();
      } else {
        const { maxBetsReached, ...remainingErrors } = currentErrors;
        this.betForm.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
        this.betForm.enable();
      }
    }
  }

  openExistingBetsModal(): void {
    const dialogRef = this.dialog?.open(ExistingBetsModalComponent, {
      width: '500px',
      data: {
        bets: this.existingBetsCurrentRace,
        riders: this.riders,
        champId: this.champId,
        raceId: this.raceId,
        betEndpoint: this.betEndpoint   // 'race_bet' or 'sprint_bet'
      }
    });

    dialogRef?.afterClosed().subscribe(() => {
      this.loadRaceBetsAndUpdateValidations();
      this.loadAllCalendarBetsAndUpdateRiders();
    });
  }


  openLineupModal(): void {
    this.dialog?.open(LineupModalComponent, {
      width: '500px',
      data: { lineups: [this.existingLineup], riders: this.riders }
    });
  }
}
