import { Injectable } from '@angular/core';
import { CalendarRace } from './dashboard.service';
import { DateUtils } from '../utils/date-utils';

@Injectable({
  providedIn: 'root'
})
export class RaceScheduleService {
  private defaultTime: string = '00:00:00';

  constructor() {}

  /**
   * Lineups are visible from 00:00 on D‑3 until the day before the race (D‑1)
   * at the qualification time. Requires both event_date and qualifications_time.
   */
  canShowLineups(
    nextRace: CalendarRace | null | undefined,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date || !nextRace.qualifications_time) {
      return false;
    }

    const raceDate = DateUtils.parseLocalYyyyMmDd(nextRace.event_date);
    if (!raceDate) return false;

    const start = DateUtils.startOfDay(DateUtils.addDays(raceDate, -3));
    const end = DateUtils.setTimeOnDate(
      DateUtils.addDays(raceDate, -1),
      nextRace.qualifications_time
    );

    return now >= start && now <= end;
  }

  /**
   * Sprint bets open at midnight on D‑1 and close 30 minutes before the sprint starts.
   * Disabled on race day itself.
   */
  canShowSprintBet(
    nextRace: CalendarRace | null | undefined,
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date) return false;

    const eventDate = DateUtils.parseLocalYyyyMmDd(nextRace.event_date);
    if (!eventDate) return false;

    const sprintTime = this.getSprintTime(nextRace);
    if (!sprintTime) return false;

    // Don’t show on race day
    if (now.toDateString() === eventDate.toDateString()) return false;

    const start = DateUtils.startOfDay(DateUtils.addDays(eventDate, -1));
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
    now: Date = new Date()
  ): boolean {
    if (!nextRace?.event_date) return false;

    const eventDate = DateUtils.parseLocalYyyyMmDd(nextRace.event_date);
    if (!eventDate) return false;

    const eventTime = this.getEventTime(nextRace);
    const sprintTime = this.getSprintTime(nextRace);
    if (!eventTime || !sprintTime) return false;

    // Open 30 minutes after the sprint (on D‑1)
    const start = new Date(sprintTime.getTime() + 30 * 60 * 1000);

    let end: Date;
    if (eventTime.getHours() <= 14) {
      // For races at or before 14:00, end at 00:00 on race day
      end = DateUtils.startOfDay(eventDate);
    } else {
      // For races after 14:00, end at 13:59:59.999 on race day
      end = new Date(eventTime);
      end.setHours(13, 59, 59, 999);
    }

    return now >= start && now <= end;
  }

  /** Returns the event start time on race day, or midnight if no time is provided. */
  getEventTime(nextRace: CalendarRace | null | undefined): Date | null {
    if (!nextRace?.event_date) return null;
    return DateUtils.buildLocalDateTime(
      nextRace.event_date,
      nextRace.event_time ?? this.defaultTime
    );
  }

  /** Returns the qualifications time on race day (if provided). */
  getQualificationsTime(nextRace: CalendarRace | null | undefined): Date | null {
    if (!nextRace?.event_date) return null;
    return DateUtils.buildLocalDateTime(
      nextRace.event_date,
      nextRace.qualifications_time ?? this.defaultTime
    );
  }

  /**
   * Sprint time occurs on the day before the race (D‑1).
   * Returns a Date at D‑1 with sprint_time or midnight if missing.
   */
  getSprintTime(nextRace: CalendarRace | null | undefined): Date | null {
    if (!nextRace?.event_date) return null;
    const base = DateUtils.parseLocalYyyyMmDd(nextRace.event_date);
    if (!base) return null;

    const sprintDate = DateUtils.addDays(base, -1);
    return DateUtils.setTimeOnDate(
      sprintDate,
      nextRace.sprint_time ?? this.defaultTime
    );
  }
}
