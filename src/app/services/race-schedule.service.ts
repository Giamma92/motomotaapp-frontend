import { Injectable } from '@angular/core';
import { CalendarRace } from './dashboard.service';
import { DateUtils } from '../utils/date-utils';

@Injectable({
  providedIn: 'root'
})
export class RaceScheduleService {
  private defaultTime: string = '00:00:00';
  private defaultTimezone: string = DateUtils.DEFAULT_CHAMPIONSHIP_TIMEZONE;

  constructor() {}

  /**
   * Lineups are available from 00:00 on D‑3 until 23:59:59.999 on D‑2
   * (the Friday before the race for the usual MotoGP weekend).
   */
  canShowLineups(
    nextRace: CalendarRace | null | undefined,
    timeZone: string = this.defaultTimezone,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date || nextRace.cancelled) {
      return false;
    }

    const tz = DateUtils.normalizeTimeZone(timeZone);
    const startDate = DateUtils.addDaysToYyyyMmDd(nextRace.event_date, -3);
    const endDate = DateUtils.addDaysToYyyyMmDd(nextRace.event_date, -2);
    if (!startDate || !endDate) return false;

    const start = DateUtils.buildZonedDateTime(startDate, this.defaultTime, tz);
    const end = DateUtils.buildZonedDateTime(endDate, '23:59:59', tz);
    if (!start || !end) return false;

    end.setMilliseconds(999);

    return now >= start && now <= end;
  }

  /**
   * Sprint bets open at midnight on D‑1 and close 30 minutes before the sprint starts.
   * Disabled on race day itself.
   */
  canShowSprintBet(
    nextRace: CalendarRace | null | undefined,
    timeZone: string = this.defaultTimezone,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date || nextRace.cancelled) return false;

    const tz = DateUtils.normalizeTimeZone(timeZone);

    const sprintTime = this.getSprintTime(nextRace, tz);
    if (!sprintTime) return false;

    // Don’t show on race day
    if (DateUtils.isSameYyyyMmDdInTimeZone(now, nextRace.event_date, tz)) return false;

    const startDate = DateUtils.addDaysToYyyyMmDd(nextRace.event_date, -1);
    if (!startDate) return false;
    const start = DateUtils.buildZonedDateTime(startDate, this.defaultTime, tz);
    if (!start) return false;
    const end   = new Date(sprintTime.getTime() - 30 * 60 * 1000);

    return now >= start && now < end;
  }

  /**
   * Race bets begin 30 minutes after the sprint (on D‑1) and end on race day.
   * - If event_time ≤ 14:00, betting closes at 00:00 on race day.
   * - If event_time > 14:00, betting closes at 13:59:59.999 on race day.
   */
  canShowRaceBet(
    nextRace: CalendarRace | null | undefined,
    timeZone: string = this.defaultTimezone,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date || nextRace.cancelled) return false;

    const tz = DateUtils.normalizeTimeZone(timeZone);
    const eventTime = this.getEventTime(nextRace, tz);
    const sprintTime = this.getSprintTime(nextRace, tz);
    if (!eventTime || !sprintTime) return false;

    // Open 30 minutes after the sprint (on D‑1)
    const start = new Date(sprintTime.getTime() + 30 * 60 * 1000);
    const end = this.getRaceDayCutoff(nextRace, tz);
    if (!end) return false;

    return now >= start && now <= end;
  }

  /**
   * Sprint bet results become visible as soon as the sprint bet button closes.
   */
  canShowSprintBetResults(
    nextRace: CalendarRace | null | undefined,
    timeZone: string = this.defaultTimezone,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date || nextRace.cancelled) return false;

    const tz = DateUtils.normalizeTimeZone(timeZone);
    const sprintTime = this.getSprintTime(nextRace, tz);
    if (!sprintTime) return false;

    const visibleFrom = new Date(sprintTime.getTime() - 30 * 60 * 1000);
    return now >= visibleFrom;
  }

  /**
   * Race bet results become visible as soon as the race bet button closes.
   */
  canShowRaceBetResults(
    nextRace: CalendarRace | null | undefined,
    timeZone: string = this.defaultTimezone,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date || nextRace.cancelled) return false;

    const tz = DateUtils.normalizeTimeZone(timeZone);
    const visibleFrom = this.getRaceDayCutoff(nextRace, tz);
    if (!visibleFrom) return false;

    return now >= visibleFrom;
  }

  /** Returns the event start time on race day, or midnight if no time is provided. */
  getEventTime(nextRace: CalendarRace | null | undefined, timeZone: string = this.defaultTimezone): Date | null {
    if (!nextRace?.event_date || nextRace.cancelled) return null;
    return DateUtils.buildZonedDateTime(
      nextRace.event_date,
      nextRace.event_time ?? this.defaultTime,
      timeZone
    );
  }

  /** Returns the qualifications time on race day (if provided). */
  getQualificationsTime(nextRace: CalendarRace | null | undefined, timeZone: string = this.defaultTimezone): Date | null {
    if (!nextRace?.event_date || nextRace.cancelled) return null;
    return DateUtils.buildZonedDateTime(
      nextRace.event_date,
      nextRace.qualifications_time ?? this.defaultTime,
      timeZone
    );
  }

  /**
   * Sprint time occurs on the day before the race (D‑1).
   * Returns a Date at D‑1 with sprint_time or midnight if missing.
   */
  getSprintTime(nextRace: CalendarRace | null | undefined, timeZone: string = this.defaultTimezone): Date | null {
    if (!nextRace?.event_date || nextRace.cancelled) return null;
    const sprintDate = DateUtils.addDaysToYyyyMmDd(nextRace.event_date, -1);
    if (!sprintDate) return null;
    return DateUtils.buildZonedDateTime(
      sprintDate,
      nextRace.sprint_time ?? this.defaultTime,
      timeZone
    );
  }

  private getRaceDayCutoff(nextRace: CalendarRace | null | undefined, timeZone: string = this.defaultTimezone): Date | null {
    if (!nextRace?.event_date || nextRace.cancelled) return null;

    const eventHours = DateUtils.parseHms(nextRace.event_time ?? this.defaultTime).hours;
    if (eventHours <= 14) {
      return DateUtils.buildZonedDateTime(nextRace.event_date, this.defaultTime, timeZone);
    }

    const cutoff = DateUtils.buildZonedDateTime(nextRace.event_date, '13:59:59', timeZone);
    if (!cutoff) return null;

    cutoff.setMilliseconds(999);
    return cutoff;
  }
}
