import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DashboardService, CalendarRace, Rider } from '../../services/dashboard.service';
import { ChampionshipService } from '../../services/championship.service';
import { TimeFormatPipe } from '../../pipes/time-format.pipe';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { NotificationServiceService } from '../../services/notification.service';
import { I18nService } from '../../services/i18n.service';
import { DateUtils } from '../../utils/date-utils';
import { RaceDetails } from '../../services/race-detail.service';
import { RaceScheduleService } from '../../services/race-schedule.service';
import { ThemeService } from '../../services/theme.service';
import { MotoGPAssetService } from '../../services/motogp-asset.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, TimeFormatPipe, TranslatePipe],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent implements OnInit, OnDestroy {
  loading = true;
  currentRaceIndex: number = 0;
  calendar: CalendarRace[] = [];
  championshipId: number = 0;
  raceDetails: RaceDetails | null = null;

  /** Live countdown towards the featured (next) race start, e.g. "6g 12h 30m". */
  countdown = '';
  /** true → the template prefixes the value with "Partenza tra". */
  countdownPrefix = false;

  calendarFilter: 'all' | 'open' | 'past' = 'all';

  private raceStatusCache = new Map<number, { lineup: boolean; sprint: boolean; race: boolean }>();
  private countdownTimer?: number;

  constructor(
    private dashboardService: DashboardService,
    private championshipService: ChampionshipService,
    private authService: AuthService,
    private router: Router,
    private i18nService: I18nService,
    private notificationService: NotificationServiceService,
    private raceSchedule: RaceScheduleService,
    public theme: ThemeService,
    public assetService: MotoGPAssetService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.championshipService.getChampIdObs().subscribe((champId: number) => {
      if (champId == 0) return;
      this.championshipId = champId;
      this.dashboardService.getCalendar(champId).subscribe({
        next: (data: CalendarRace[]) => {
          this.calendar = data ?? [];
          this.findCurrentRace();
          this.rebuildRaceStatusCache();
          this.loading = false;
          this.startCountdown();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching calendar data:', err);
          this.calendar = [];
          this.currentRaceIndex = 0;
          this.loading = false;
          this.startCountdown();
          this.cdr.markForCheck();
        }
      });

      this.dashboardService.getRaceDetails(champId).subscribe({
        next: (data: RaceDetails) => {
          this.raceDetails = data;
          this.rebuildRaceStatusCache();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error fetching user race details:', err);
          this.raceDetails = null;
          this.cdr.markForCheck();
        }
      });
    });
  }

  ngOnDestroy(): void {
    if (this.countdownTimer !== undefined) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = undefined;
    }
  }

  private rebuildRaceStatusCache(): void {
    this.raceStatusCache.clear();
    if (!this.raceDetails) return;
    for (const race of this.calendar) {
      this.raceStatusCache.set(race.id, {
        lineup: Boolean(this.raceDetails.lineups?.some(l => this.matchesCalendarRefToRace(l.calendar_id, race))),
        sprint: Boolean(this.raceDetails.sprints?.some(b => this.matchesCalendarRefToRace(b.calendar_id, race))),
        race: Boolean(this.raceDetails.bets?.some(b => this.matchesCalendarRefToRace(b.calendar_id, race))),
      });
    }
  }

  private findCurrentRace() {
    if (!this.calendar.length) {
      this.currentRaceIndex = 0;
      return;
    }

    const now = new Date();
    const nextRaceIndex = this.calendar.findIndex(race =>
      (() => {
        if (race.cancelled) return false;
        const eventDate = DateUtils.parseLocalYyyyMmDd(race.event_date);
        return eventDate ? eventDate >= now : false;
      })()
    );

    this.currentRaceIndex = nextRaceIndex === -1 ? this.calendar.length - 1 : nextRaceIndex;
  }

  /** Race featured at the top of the page (next upcoming, or last of the season). */
  get featuredRace(): CalendarRace | null {
    return this.calendar[this.currentRaceIndex] ?? this.calendar[0] ?? null;
  }

  /** Races already held (races before the next upcoming one). */
  get completedCount(): number {
    if (!this.calendar.length) return 0;
    return Math.min(this.currentRaceIndex, this.calendar.length);
  }

  get seasonProgressPct(): number {
    if (!this.calendar.length) return 0;
    return Math.round((this.completedCount / this.calendar.length) * 100);
  }

  /* ── Countdown ── */

  private startCountdown(): void {
    this.refreshCountdown();
    if (this.countdownTimer === undefined) {
      this.countdownTimer = window.setInterval(() => this.refreshCountdown(), 1000);
    }
  }

  private refreshCountdown(): void {
    const next = this.computeCountdown(this.featuredRace);
    if (next.value !== this.countdown || next.prefix !== this.countdownPrefix) {
      this.countdown = next.value;
      this.countdownPrefix = next.prefix;
      this.cdr.markForCheck();
    }
  }

  private computeCountdown(race: CalendarRace | null): { value: string; prefix: boolean } {
    if (!race || race.cancelled) return { value: '', prefix: false };

    const start = this.raceSchedule.getEventTime(race);
    if (!start) return { value: '', prefix: false };

    const now = Date.now();
    const diff = start.getTime() - now;

    if (diff <= 0) {
      // Race started: show "live" only while the race weekend day is still today.
      const eventDate = DateUtils.parseLocalYyyyMmDd(race.event_date);
      if (!eventDate) return { value: '', prefix: false };
      const endOfDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate(), 23, 59, 59, 999);
      return now <= endOfDay.getTime() ? { value: 'Gara in corso', prefix: false } : { value: '', prefix: false };
    }

    const totalMinutes = Math.floor(diff / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return { value: `${days}g ${hours}h ${minutes}m`, prefix: true };
    }
    if (hours > 0) {
      return { value: `${hours}h ${minutes}m`, prefix: true };
    }
    const seconds = Math.floor((diff % 60000) / 1000);
    return { value: `${minutes}m ${seconds}s`, prefix: true };
  }

  /* ── Navigation ── */

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


  goToRaceDetail(race: CalendarRace): void {
    // Assumes that race.race_id has an 'id' property.
    const calendarRaceId = race.id;
    this.router.navigate(['/race-detail', calendarRaceId]);
  }

  goToMotoGPResults(race: CalendarRace): void {
    this.router.navigate(['/motogp-results', this.championshipId, race.id]);
  }

    getRaceWinner(race: CalendarRace): { rider: any; points: number } | null {
    if (!this.raceDetails?.motogpResults?.length) return null;
    const res = this.raceDetails.motogpResults.find(r => r.calendar_id === race.id && r.race_position === 1);
    if (!res || !res.rider_id) return null;
    return {
      rider: res.rider_id,
      points: res.race_points ?? 25
    };
  }

  goToRaceResults(race: CalendarRace, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.goToMotoGPResults(race);
  }

isAdmin() {
    return this.authService.isCurrentUserAdmin();
  }

  getDayBefore(eventDateString: string): Date {
    if (!eventDateString) return new Date();
    const eventDate = DateUtils.parseLocalYyyyMmDd(eventDateString);
    return eventDate ? DateUtils.addDays(eventDate, -1) : new Date();
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
    const fmt = new Intl.DateTimeFormat(this.locale, { day: 'numeric', month: 'short', year: 'numeric' });
    // @ts-ignore: formatRange is supported in modern browsers
    return typeof fmt.formatRange === 'function'
      ? fmt.formatRange(start, end)
      : `${fmt.format(start)} – ${fmt.format(end)}`;
  }

  hasCompletedLineup(race: CalendarRace): boolean {
    return this.raceStatusCache.get(race.id)?.lineup ?? false;
  }

  hasCompletedSprintBet(race: CalendarRace): boolean {
    return this.raceStatusCache.get(race.id)?.sprint ?? false;
  }

  hasCompletedRaceBet(race: CalendarRace): boolean {
    return this.raceStatusCache.get(race.id)?.race ?? false;
  }

  getRaceCompletionLabel(race: CalendarRace): string {
    if (race.cancelled) return 'Cancellata';

    const completed = [
      this.hasCompletedLineup(race),
      this.hasCompletedSprintBet(race),
      this.hasCompletedRaceBet(race)
    ].filter(Boolean).length;

    if (completed === 3) return 'Completa';
    if (completed === 0) return 'Da completare';
    return `${completed}/3 ok`;
  }

  get filteredCalendar(): CalendarRace[] {
    if (this.calendarFilter === 'open') {
      return this.calendar.filter((race, i) => !race.cancelled && !this.isRaceInPast(race));
    }
    if (this.calendarFilter === 'past') {
      return this.calendar.filter((race, i) => this.isRaceInPast(race));
    }
    return this.calendar;
  }

  get openRacesCount(): number {
    return this.calendar.filter(r => !r.cancelled && !this.isRaceInPast(r)).length;
  }

  get pastRacesCount(): number {
    return this.calendar.filter(r => this.isRaceInPast(r)).length;
  }

  getRaceCompletionBadge(race: CalendarRace): { label: string; class: string; icon: string } {
    if (race.cancelled) return { label: 'Cancellata', class: 'completion-cancelled', icon: 'cancel' };
    const completed = [
      this.hasCompletedLineup(race),
      this.hasCompletedSprintBet(race),
      this.hasCompletedRaceBet(race)
    ].filter(Boolean).length;

    if (completed === 3) return { label: 'Giocata Completa', class: 'completion-complete', icon: 'check_circle' };
    if (completed > 0) return { label: `${completed}/3 Giocate`, class: 'completion-partial', icon: 'timelapse' };
    if (this.isRaceInPast(race)) return { label: 'Non Giocata', class: 'completion-missed', icon: 'history' };
    return { label: 'Da Giocare', class: 'completion-empty', icon: 'notification_important' };
  }

  getMobileRaceStateLabel(race: CalendarRace, index?: number): string {
    if (race.cancelled) return 'Cancellata';

    const safeIndex = index ?? this.calendar.findIndex(item => item.id === race.id);
    if (safeIndex === this.currentRaceIndex) {
      return this.isRaceInPast(race) ? 'Ultima gara' : 'Prossima gara';
    }
    if (safeIndex !== -1 && safeIndex < this.currentRaceIndex) {
      return 'Conclusa';
    }
    return 'In calendario';
  }

  isRacePanelInitiallyOpen(index: number): boolean {
    return Math.abs(index - this.currentRaceIndex) <= 1;
  }

  private isRaceInPast(race: CalendarRace): boolean {
    const eventDate = DateUtils.parseLocalYyyyMmDd(race.event_date);
    if (!eventDate) return false;
    const today = new Date();
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    return eventDate < endOfToday;
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

  private matchesCalendarRefToRace(reference: any, race: CalendarRace): boolean {
    if (!reference || !race) {
      return false;
    }

    const referenceId = this.extractCalendarId(reference);
    if (referenceId != null && referenceId === race.id) {
      return true;
    }

    const referenceRaceOrder = Number(reference?.race_order ?? reference?.calendar_id?.race_order);
    if (Number.isFinite(referenceRaceOrder) && referenceRaceOrder === race.race_order) {
      return true;
    }

    const referenceEventDate = this.extractComparableString(reference?.event_date ?? reference?.calendar_id?.event_date);
    if (referenceEventDate && referenceEventDate === this.extractComparableString(race.event_date)) {
      return true;
    }

    const referenceName = this.extractComparableString(reference?.race_id?.name ?? reference?.calendar_id?.race_id?.name);
    const referenceLocation = this.extractComparableString(reference?.race_id?.location ?? reference?.calendar_id?.race_id?.location);
    const raceName = this.extractComparableString(race.race_id?.name);
    const raceLocation = this.extractComparableString(race.race_id?.location);

    return Boolean(referenceName && raceName && referenceName === raceName && referenceLocation && raceLocation && referenceLocation === raceLocation);
  }

  private extractComparableString(value: any): string {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
  }

  /* ── Session day helpers ── */

  getQualifyingDay(eventDate: string, short = false): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(DateUtils.addDays(date, -1), short) : '';
  }

  getSprintDay(eventDate: string, short = false): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(DateUtils.addDays(date, -1), short) : '';
  }

  getRaceDay(eventDate: string, short = false): string {
    const date = DateUtils.parseLocalYyyyMmDd(eventDate);
    return date ? this.getDayName(date, short) : '';
  }

  private getDayName(date: Date, short = false): string {
    return date.toLocaleDateString(this.locale, { weekday: short ? 'short' : 'long' });
  }
}
