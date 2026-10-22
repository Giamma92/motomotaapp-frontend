// src/app/dashboard/dashboard.component.ts
import { Component, HostListener, OnInit, OnDestroy, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { DashboardService, StandingsRow, CalendarRace, FantasyTeam, StandingsBreakdownRow } from '../../services/dashboard.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ChampionshipConfig, ChampionshipService } from '../../services/championship.service';
import { RaceScheduleService } from '../../services/race-schedule.service';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { RaceDetails, LineupsResult, BetResult, MotoGPStoredResult } from '../../services/race-detail.service';
import { I18nService } from '../../services/i18n.service';
import { ThemeService } from '../../services/theme.service';
import { DateUtils } from '../../utils/date-utils';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';
import { AuthService, UserInfo } from '../../services/auth.service';
import { MotoGPAssetService } from '../../services/motogp-asset.service';
import { MoreMenuService } from '../../services/more-menu.service';
import { HapticService } from '../../services/haptic.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatMenuModule, MatIconModule, MatExpansionModule, TimeFormatPipe, TranslatePipe, NotificationBellComponent],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        query('.user-hero-card, .next-gp-card, .last-race-card, .team-quota-card, .championship-config-card', [
          style({ opacity: 0, transform: 'translateY(16px)' }),
          stagger(80, [
            animate('320ms cubic-bezier(0.4, 0, 0.2, 1)',
              style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  classificationData?: StandingsRow[];
  nextCalendarRace?: CalendarRace;
  fantasyTeam?: FantasyTeam;
  racesDetails?: RaceDetails;
  championshipConfig?: any;
  loggedUserId: string | null;
  userInfo?: UserInfo;
  championshipId: number = 0;
  totalRaces?: number;

  // New boolean flags for button visibility
  showLineupsButton: boolean = false;
  showSprintBetButton: boolean = false;
  showPlaceBetButton: boolean = false;

  //Map for riders and linups, sprint and races count
  ridersLineupsCount: Map<number, number> = new Map<number, number>();
  ridersQualifyingCount: Map<number, number> = new Map<number, number>();
  ridersRaceCount: Map<number, number> = new Map<number, number>();

  Math = Math;

  // Pull to refresh state
  pullDistance = 0;
  isPulling = false;
  isRefreshing = false;
  private touchStartY = 0;
  private hasVibratedThreshold = false;

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    if (typeof window !== 'undefined' && window.scrollY <= 0 && !this.isRefreshing) {
      this.touchStartY = e.touches[0].clientY;
      this.isPulling = true;
      this.hasVibratedThreshold = false;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent): void {
    if (this.isPulling && typeof window !== 'undefined' && window.scrollY <= 0) {
      const diff = e.touches[0].clientY - this.touchStartY;
      if (diff > 0) {
        this.pullDistance = Math.min(85, diff * 0.42);
        if (this.pullDistance >= 60 && !this.hasVibratedThreshold) {
          this.haptic.medium();
          this.hasVibratedThreshold = true;
        }
        this.cdr.markForCheck();
      }
    }
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    if (this.isPulling) {
      this.isPulling = false;
      if (this.pullDistance >= 60) {
        this.isRefreshing = true;
        this.pullDistance = 50;
        this.reload();
      } else {
        this.pullDistance = 0;
      }
      this.cdr.markForCheck();
    }
  }


  // Loading / error state per card (skeleton + UX states)
  loadingStandings = true;
  loadingTeam = true;
  loadingNext = true;
  loadingConfig = true;
  loadingLastRace = true;
  lastCompletedRaceEntry?: StandingsBreakdownRow;
  lastCompletedRaceRank?: number;
  lastCompletedRaceLineup?: LineupsResult;
  lastCompletedRaceSprintBet?: BetResult;
  lastCompletedRaceBet?: BetResult;
  lastCompletedRaceMotoGPPodium: MotoGPStoredResult[] = [];
  errorStandings = false;
  errorTeam = false;
  errorNext = false;
  errorConfig = false;

  // Race countdown ticker (refreshed every 30s)
  now = Date.now();
  private tickTimer?: ReturnType<typeof setInterval>;

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService,
    private raceScheduleService: RaceScheduleService,
    private i18nService: I18nService,
    public theme: ThemeService,
    public assetService: MotoGPAssetService,
    public moreMenu: MoreMenuService,
    private haptic: HapticService,
    private loadingService: LoadingService,
    private cdr: ChangeDetectorRef
  ) {
    this.loggedUserId = this.authService.getUserId();
  }

  ngOnInit(): void {
    this.authService.getUserInfo().subscribe({
      next: (info) => {
        this.userInfo = info;
        this.cdr.markForCheck();
      },
      error: () => {}
    });

    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      champId > 0 && this.loadDashboardData(champId);
      this.cdr.markForCheck();
    });

    // Keep the race countdown live
    this.tickTimer = setInterval(() => {
      this.now = Date.now();
      this.cdr.markForCheck();
    }, 30_000);
  }

  ngOnDestroy(): void {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = undefined;
    }
  }

  private loadDashboardData(champId: number): void {
    this.championshipId = champId;
    this.loadingStandings = true;
    this.loadingTeam = true;
    this.loadingNext = true;
    this.loadingConfig = true;
    this.errorStandings = false;
    this.errorTeam = false;
    this.errorNext = false;
    this.errorConfig = false;

    this.dashboardService.getClassification(champId).subscribe({
      next: (data: StandingsRow[]) => {
        this.classificationData = data;
        this.loadingStandings = false;
        checkAllLoaded();
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error fetching classification data:', error);
        this.loadingStandings = false;
        this.errorStandings = true;
        this.cdr.markForCheck();
      }
    });
    this.dashboardService.getNextRace(champId).subscribe({
      next: (race: CalendarRace) => {
        this.nextCalendarRace = race;
        this.loadingNext = false;
        this.computeButtonVisibility();
        checkAllLoaded();
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.nextCalendarRace = undefined;
        this.loadingNext = false;
        // 404 = no upcoming race (season over) → empty state, not an error
        if (error?.status !== 404) {
          console.error('Error fetching next race:', error);
          this.errorNext = true;
        }
        this.cdr.markForCheck();
      }
    });
    this.dashboardService.getCalendar(champId).subscribe({
      next: (races) => {
        this.totalRaces = Array.isArray(races) ? races.length : undefined;
        this.cdr.markForCheck();
      },
      error: (e) => console.warn('Could not fetch calendar to compute total races:', e)
    });
    this.dashboardService.getFantasyTeam(champId).subscribe({
      next: (team: FantasyTeam) => {
        this.fantasyTeam = team;
        this.loadingTeam = false;
        checkAllLoaded();
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        this.fantasyTeam = undefined;
        this.loadingTeam = false;
        // 404 = no fantasy team yet → empty state, not an error
        if (error?.status !== 404) {
          console.error('Error fetching fantasy team:', error);
          this.errorTeam = true;
        }
        this.cdr.markForCheck();
      }
    });
    const checkAllLoaded = () => {
      if (!this.loadingStandings && !this.loadingNext && !this.loadingTeam) {
        this.loadingService.markInitialAppLoaded();
        if (this.isRefreshing) {
          this.isRefreshing = false;
          this.pullDistance = 0;
          this.haptic.success();
        }
        this.cdr.markForCheck();
      }
    };
    this.loadingLastRace = true;
    this.dashboardService.getStandingsBreakdown(champId).subscribe({
      next: (rows: StandingsBreakdownRow[]) => {
        this.computeLastRaceBreakdown(rows);
        this.loadingLastRace = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.warn('Could not fetch standings breakdown for last race:', err);
        this.lastCompletedRaceEntry = undefined;
        this.loadingLastRace = false;
        this.cdr.markForCheck();
      }
    });
    this.dashboardService.getRaceDetails(champId).subscribe({
      next: (data: RaceDetails) => {
          this.racesDetails = data;
          this.computeRidersQualifyingAndRaceCounts();
          this.updateLastRaceDetails();
          this.cdr.markForCheck();
      },
      error: (err: any) => console.error('Error fetching race details:', err)
    });

    // Load championship configuration
    this.loadChampionshipConfig(champId);

  }

  /** Retry handler used by the card error states. */
  reload(): void {
    if (this.championshipId > 0) {
      this.loadDashboardData(this.championshipId);
    }
  }

  public get currentUserRow(): StandingsRow | undefined {
    return this.classificationData?.find(row => row.user_id.id === this.loggedUserId);
  }

  public get currentUserPoints(): number {
    return this.currentUserRow?.score || 0;
  }

  public get currentUserPosition(): number | null {
    return this.currentUserRow?.position || null;
  }

  public get leaderRow(): StandingsRow | undefined {
    return this.classificationData?.[0];
  }

    public get leaderName(): string {
    const r = this.leaderRow?.user_id;
    if (r?.alias) return r.alias;
    return r ? `${r.first_name} ${r.last_name || ''}`.trim() : '';
  }

  public get distanceToLeader(): number {
    if (!this.leaderRow || !this.currentUserRow) return 0;
    return Math.max(0, this.leaderRow.score - this.currentUserRow.score);
  }

  public get gapToLeader(): number {
    return this.distanceToLeader;
  }

  public get nextRiderBehind(): StandingsRow | undefined {
    if (!this.classificationData || !this.currentUserPosition) return undefined;
    return this.classificationData.find(row => row.position === (this.currentUserPosition! + 1));
  }

  public get nextRiderName(): string {
    const r = this.nextRiderBehind?.user_id;
    if (r?.alias) return r.alias;
    return r ? `${r.first_name} ${r.last_name || ''}`.trim() : '';
  }

  public get advantageOverNext(): number | null {
    if (!this.currentUserRow || !this.nextRiderBehind) return null;
    return Math.max(0, this.currentUserRow.score - this.nextRiderBehind.score);
  }

  public get loggedUserName(): string {
    if (this.userInfo?.alias) {
      return this.userInfo.alias;
    }
    if (this.currentUserRow?.user_id?.alias) {
      return this.currentUserRow.user_id.alias;
    }
    if (this.userInfo?.first_name) {
      return `${this.userInfo.first_name} ${this.userInfo.last_name || ''}`.trim();
    }
    const myUser = this.currentUserRow?.user_id;
    if (myUser?.first_name) {
      return `${myUser.first_name} ${myUser.last_name || ''}`.trim();
    }
    return 'Fanta-Manager';
  }

  public get userProfileImage(): string | null {
    return this.userInfo?.profile_image || this.currentUserRow?.user_id?.profile_image || null;
  }

  public getBatteryCells(riderId: number): Array<{ step: number; used: boolean }> {
    const count = this.getRiderLineupsCount(riderId);
    return Array.from({ length: this.maxLineups }, (_, i) => ({
      step: i + 1,
      used: (i + 1) <= count
    }));
  }

  /**
   * Progress-bar fill as % of the leader's score.
   * Non-positive or invalid scores return 0: a negative % would be
   * rejected by CSS and the div would fall back to width:auto (= full bar).
   */
  public progressPct(score: number, leaderScore: number): number {
    if (!Number.isFinite(score) || !Number.isFinite(leaderScore) || score <= 0 || leaderScore <= 0) {
      return 0;
    }
    return Math.min(100, (score / leaderScore) * 100);
  }

  /** Fill-level tier: near the leader → green, mid → amber, trailing → red. */
  public barTier(score: number, leaderScore: number): 'green' | 'amber' | 'red' {
    const pct = this.progressPct(score, leaderScore);
    if (pct >= 66) return 'green';
    if (pct >= 33) return 'amber';
    return 'red';
  }

  public get isCurrentRace() {
    const today = new Date();
    const eventDate = DateUtils.parseLocalYyyyMmDd(this.nextCalendarRace?.event_date);
    return eventDate ? today.toDateString() === eventDate.toDateString() : false;
  }

  private computeButtonVisibility(): void {
    if (!this.nextCalendarRace) {
      this.showLineupsButton = false;
      this.showSprintBetButton = false;
      this.showPlaceBetButton = false;
      return;
    }

    const timeZone = this.championshipConfig?.timezone;
    this.showLineupsButton = this.raceScheduleService.canShowLineups(this.nextCalendarRace, timeZone);
    this.showSprintBetButton = this.raceScheduleService.canShowSprintBet(this.nextCalendarRace, timeZone);
    this.showPlaceBetButton = this.raceScheduleService.canShowRaceBet(this.nextCalendarRace, timeZone);
  }

  hasCompletedLineup(raceId: number): boolean {
    return Boolean(this.racesDetails?.lineups?.some(lineup => this.extractCalendarId(lineup.calendar_id) === raceId));
  }

  hasCompletedSprintBet(raceId: number): boolean {
    return Boolean(this.racesDetails?.sprints?.some(bet => this.extractCalendarId(bet.calendar_id) === raceId));
  }

  hasCompletedRaceBet(raceId: number): boolean {
    return Boolean(this.racesDetails?.bets?.some(bet => this.extractCalendarId(bet.calendar_id) === raceId));
  }

  private extractCalendarId(value: any): number | null {
    if (value == null) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (typeof value === 'object') {
      const directId = this.extractCalendarId(value.id);
      if (directId != null) {
        return directId;
      }

      const nestedCalendarId = this.extractCalendarId(value.calendar_id);
      if (nestedCalendarId != null) {
        return nestedCalendarId;
      }
    }

    return null;
  }

  getPrimaryActionRoute(): string {
    if (!this.nextCalendarRace) return 'calendar';
    if (this.nextCalendarRace.cancelled) return 'race-detail';
    if (this.showLineupsButton && !this.hasCompletedLineup(this.nextCalendarRace.id)) return 'lineups';
    if (this.showSprintBetButton && !this.hasCompletedSprintBet(this.nextCalendarRace.id)) return 'sprint-bet';
    if (this.showPlaceBetButton && !this.hasCompletedRaceBet(this.nextCalendarRace.id)) return 'race-bet';
    return 'race-detail';
  }

  getPrimaryActionLabel(): string {
    if (!this.nextCalendarRace) return 'dashboard.actions.openCalendar';
    if (this.nextCalendarRace.cancelled) return 'dashboard.actions.openCancelledRace';
    const route = this.getPrimaryActionRoute();
    if (route === 'lineups') return 'dashboard.actions.placeLineups';
    if (route === 'sprint-bet') return 'dashboard.actions.placeSprintBet';
    if (route === 'race-bet') return 'dashboard.actions.placeRaceBet';
    if (this.countdownParts) return 'dashboard.actions.viewRaceDetail';
    return 'dashboard.actions.viewRaceResults';
  }

  getPrimaryActionTitle(): string {
    if (!this.nextCalendarRace) return 'dashboard.action.title.none';
    if (this.nextCalendarRace.cancelled) return 'dashboard.action.title.cancelled';
    if (this.showLineupsButton && !this.hasCompletedLineup(this.nextCalendarRace.id)) return 'dashboard.action.title.lineups';
    if (this.showSprintBetButton && !this.hasCompletedSprintBet(this.nextCalendarRace.id)) return 'dashboard.action.title.sprint';
    if (this.showPlaceBetButton && !this.hasCompletedRaceBet(this.nextCalendarRace.id)) return 'dashboard.action.title.race';
    return 'dashboard.action.title.done';
  }

  getPrimaryActionDescription(): string {
    if (!this.nextCalendarRace) return 'dashboard.action.desc.none';
    if (this.nextCalendarRace.cancelled) return 'dashboard.action.desc.cancelled';
    if (this.showLineupsButton && !this.hasCompletedLineup(this.nextCalendarRace.id)) return 'dashboard.action.desc.lineups';
    if (this.showSprintBetButton && !this.hasCompletedSprintBet(this.nextCalendarRace.id)) return 'dashboard.action.desc.sprint';
    if (this.showPlaceBetButton && !this.hasCompletedRaceBet(this.nextCalendarRace.id)) return 'dashboard.action.desc.race';
    return 'dashboard.action.desc.done';
  }

  getRaceWindowStatus(): string {
    if (this.nextCalendarRace?.cancelled) return 'dashboard.nextRace.windowCancelled';
    if (this.showLineupsButton) return 'dashboard.nextRace.windowLineups';
    if (this.showSprintBetButton) return 'dashboard.nextRace.windowSprint';
    if (this.showPlaceBetButton) return 'dashboard.nextRace.windowRace';
    return 'dashboard.nextRace.windowClosed';
  }

  // --- Countdown to lights out + open action-window deadline ---

  /** Parts of the countdown to race start: null when no race or already started. */
  get countdownParts(): { d: number; h: number; m: number } | null {
    if (!this.nextCalendarRace || this.nextCalendarRace.cancelled) return null;
    const start = DateUtils.buildLocalDateTime(
      this.nextCalendarRace.event_date,
      this.nextCalendarRace.event_time ?? '14:00:00'
    );
    if (!start) return null;
    const diff = start.getTime() - this.now;
    if (diff <= 0) return null;
    return {
      d: Math.floor(diff / 86_400_000),
      h: Math.floor((diff % 86_400_000) / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000)
    };
  }

  /** Close time of the action window currently open (lineups / sprint bet / race bet). */
  get openDeadline(): Date | null {
    if (!this.nextCalendarRace || this.nextCalendarRace.cancelled) return null;
    return this.raceScheduleService.getOpenWindowDeadline(
      this.nextCalendarRace,
      this.championshipConfig?.timezone
    );
  }

  formatDeadline(date: Date): string {
    return new Intl.DateTimeFormat(this.locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  goTo(path: string, extras: any = {}): void {
    if (path === 'motogp-results') {
      this.router.navigate(['/motogp-results', this.championshipId, extras]);
    } else {
      this.router.navigate([`/${path}`, extras]);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private computeLastRaceBreakdown(rows: StandingsBreakdownRow[]): void {
    if (!rows || !rows.length) {
      this.lastCompletedRaceEntry = undefined;
      return;
    }
    const myRows = rows.filter(r => r.user_id?.id === this.loggedUserId);
    if (!myRows.length) {
      this.lastCompletedRaceEntry = undefined;
      return;
    }
    const maxOrder = Math.max(...myRows.map(r => Number(r.calendar_id?.race_order || 0)));
    this.lastCompletedRaceEntry = myRows.find(r => Number(r.calendar_id?.race_order) === maxOrder);

    if (this.lastCompletedRaceEntry) {
      const calId = this.lastCompletedRaceEntry.calendar_id?.id;
      const roundRows = rows.filter(r => r.calendar_id?.id === calId);
      const sorted = [...roundRows].sort((a, b) => Number(b.score || 0) - Number(a.score || 0));
      const rank = sorted.findIndex(r => r.user_id?.id === this.loggedUserId);
      this.lastCompletedRaceRank = rank >= 0 ? rank + 1 : undefined;

      this.updateLastRaceDetails();
    }
  }

  private updateLastRaceDetails(): void {
    if (!this.lastCompletedRaceEntry || !this.racesDetails) return;
    const calId = Number(this.lastCompletedRaceEntry.calendar_id?.id);
    this.lastCompletedRaceLineup = this.racesDetails.lineups?.find(l => Number(l.calendar_id?.id) === calId);
    this.lastCompletedRaceSprintBet = this.racesDetails.sprints?.find(s => Number(s.calendar_id?.id) === calId);
    this.lastCompletedRaceBet = this.racesDetails.bets?.find(b => Number(b.calendar_id?.id) === calId);
    this.lastCompletedRaceMotoGPPodium = (this.racesDetails.motogpResults || [])
      .filter(r => Number(r.calendar_id) === calId && r.race_position != null && r.race_position >= 1 && r.race_position <= 3)
      .sort((a, b) => (a.race_position ?? 99) - (b.race_position ?? 99));
  }

  public getEventDateRange(eventDateString: string): { start: Date, end: Date } {
    if (!eventDateString) return { start: new Date(), end: new Date() };

    const eventDate = DateUtils.parseLocalYyyyMmDd(eventDateString);
    if (!eventDate) return { start: new Date(), end: new Date() };
    const startDate = DateUtils.addDays(eventDate, -2);

    return {
      start: startDate,
      end: eventDate
    };
  }

    goToLastRaceMotoGP(): void {
    if (!this.lastCompletedRaceEntry?.calendar_id?.id) return;
    this.router.navigate(['/race-detail', this.lastCompletedRaceEntry.calendar_id.id], { queryParams: { tab: 'motogp' } });
  }

isAdmin(): boolean {
    return this.authService.isCurrentUserAdmin();
  }

  // Rider statistics methods
  private computeRidersQualifyingAndRaceCounts(): void {
    if (!this.fantasyTeam || !this.racesDetails?.lineups) return;

    const riderIds = [
      this.fantasyTeam.official_rider_1.id,
      this.fantasyTeam.official_rider_2?.id,
      this.fantasyTeam.reserve_rider.id,
    ].filter((id): id is number => !!id);

    const counts = this.racesDetails.lineups.reduce<Record<number, { q: number; r: number }>>(
      (acc, { qualifying_rider_id, race_rider_id }) => {
        riderIds.forEach(riderId => {
          if (qualifying_rider_id?.id === riderId) acc[riderId].q++;
          if (race_rider_id?.id === riderId) acc[riderId].r++;
        });
        return acc;
      },
      Object.fromEntries(riderIds.map(id => [id, { q: 0, r: 0 }]))
    );

    riderIds.forEach(id => {
      const { q, r } = counts[id];
      this.ridersQualifyingCount.set(id, q);
      this.ridersRaceCount.set(id, r);
      this.ridersLineupsCount.set(id, q + r);
    });
  }


  getRiderLineupsCount(riderId: number): number {
    const count = this.ridersLineupsCount.has(riderId) ? this.ridersLineupsCount.get(riderId) : 0;
    return count ?? 0;
  }

  getRiderQualifyingCount(riderId: number): number {
    const count = this.ridersQualifyingCount.has(riderId) ? this.ridersQualifyingCount.get(riderId) : 0;
    return count ?? 0;
  }

  maxLineups = 5;

  getRiderQuotaPct(riderId: number): number {
    const used = this.getRiderLineupsCount(riderId);
    return Math.min(100, Math.round((used / this.maxLineups) * 100));
  }

  getRemainingUses(riderId: number): number {
    const used = this.getRiderLineupsCount(riderId);
    return Math.max(0, this.maxLineups - used);
  }

  getRiderRaceCount(riderId: number): number {
    const count = this.ridersRaceCount.has(riderId) ? this.ridersRaceCount.get(riderId) : 0;
    return count ?? 0;
  }

  getBettingStats(): Array<{
    pilotName: string;
    pilotNumber: number;
    sprintBets: number;
    raceBets: number;
    totalBets: number;
  }> {
    const rd = this.racesDetails;
    if (!rd) return [];

    // Tag entries so we can reduce in a single pass
    const tagged = [
      ...(rd.sprints ?? []).map(s => ({ rider: s.rider_id, isSprint: true })),
      ...(rd.bets ?? []).map(b => ({ rider: b.rider_id, isSprint: false })),
    ];

    const map = tagged.reduce<Map<number, {
      pilotName: string; pilotNumber: number; sprintBets: number; raceBets: number;
    }>>((acc, { rider, isSprint }) => {
      if (!rider) return acc;

      const curr = acc.get(rider.id) ?? {
        pilotName: `${rider.first_name} ${rider.last_name ?? ''}`.trim(),
        pilotNumber: rider.number,
        sprintBets: 0,
        raceBets: 0,
      };

      if (isSprint) curr.sprintBets++;
      else curr.raceBets++;

      acc.set(rider.id, curr);
      return acc;
    }, new Map());

    // Build final array with totals (optionally sort by totalBets desc)
    return Array.from(map.values())
      .map(s => ({ ...s, totalBets: s.sprintBets + s.raceBets }))
      // .sort((a, b) => b.totalBets - a.totalBets) // <- enable if you want a leaderboard
    ;
  }



  // Day methods for schedule display
  getQualifyingDay(eventDate: string): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(DateUtils.addDays(date, -1)) : '';
  }

  getSprintDay(eventDate: string): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(DateUtils.addDays(date, -1)) : '';
  }

  getRaceDay(eventDate: string): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(date) : '';
  }

  private getDayName(date: Date): string {
    return date.toLocaleDateString(this.locale, { weekday: 'long' });
  }

  get locale(): string {
    return this.i18nService.locale;
  }

  formatEventRange(eventDateString: string): string {
    if (!eventDateString) return '';
    const end = DateUtils.parseLocalYyyyMmDd(eventDateString);
    if (!end) return '';
    const start = DateUtils.addDays(end, -2);

    // Use browser's Intl with the current locale
    const fmt = new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'long', year: 'numeric' });
    // @ts-ignore: formatRange is supported in modern browsers
    return typeof fmt.formatRange === 'function'
      ? fmt.formatRange(start, end)
      : `${fmt.format(start)} – ${fmt.format(end)}`;
  }


  // Championship configuration methods
  getRaceScoringPoints(): Array<{position: number, points: number}> {
    // Default MotoGP race scoring system
    return [
      { position: 1, points: 25 },
      { position: 2, points: 20 },
      { position: 3, points: 16 },
      { position: 4, points: 13 },
      { position: 5, points: 11 },
      { position: 6, points: 10 },
      { position: 7, points: 9 },
      { position: 8, points: 8 },
      { position: 9, points: 7 },
      { position: 10, points: 6 },
      { position: 11, points: 5 },
      { position: 12, points: 4 },
      { position: 13, points: 3 },
      { position: 14, points: 2 },
      { position: 15, points: 1 }
    ];
  }

  getSprintScoringPoints(): Array<{position: number, points: number}> {
    // Default MotoGP sprint scoring system
    return [
      { position: 1, points: 12 },
      { position: 2, points: 9 },
      { position: 3, points: 7 },
      { position: 4, points: 6 },
      { position: 5, points: 5 },
      { position: 6, points: 4 },
      { position: 7, points: 3 },
      { position: 8, points: 2 },
      { position: 9, points: 1 }
    ];
  }

  private loadChampionshipConfig(champId: number): void {

    this.championshipService.getChampionshipConfig(champId).subscribe({
      next: (config: ChampionshipConfig) => {
        this.championshipConfig = {
          name: config.championship_id.description,
          season: config.championship_id.year,
          is_active: config.championship_id.is_active,
          bets_limit_points: config.bets_limit_points, // max points per race
          bets_limit_sprint_points: config.bets_limit_sprint_points, // max points per sprint race
          bets_limit_driver: config.bets_limit_driver, // max bets per pilot
          bets_limit_sprint_driver: config.bets_limit_sprint_driver, // max sprint bets per pilot
          bets_limit_race: config.bets_limit_race, // max bets per race
          bets_limit_sprint_race: config.bets_limit_sprint_race, // max bets per sprint race
          formation_limit_driver: config.formation_limit_driver, // max lineups per pilot
          timezone: config.timezone,
          race_scoring: this.getRaceScoringPoints(),
          sprint_scoring: this.getSprintScoringPoints()
        };
        if (config?.formation_limit_driver) {
          this.maxLineups = config.formation_limit_driver;
        }
        this.loadingConfig = false;
        this.computeButtonVisibility();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.championshipConfig = undefined;
        this.loadingConfig = false;
        // 404 = no configuration yet → empty state, not an error
        if (err?.status !== 404) {
          console.error('Failed to load championship configuration', err);
          this.errorConfig = true;
        }
        this.computeButtonVisibility();
        this.cdr.markForCheck();
      }
    });

  }
}
