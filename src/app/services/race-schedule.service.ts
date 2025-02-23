import { Injectable } from '@angular/core';
import { CalendarRace } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class RaceScheduleService {

  private defaultTime: string =  '00:00:00';

  constructor() { }

  canShowLineups(nextRace: CalendarRace): boolean {
    if (!nextRace) return false;

    const now = new Date();
    const eventDate = new Date(nextRace.event_date);
    const isEventDay = now.toDateString() === eventDate.toDateString();
    const qualificationsTime = this.getQualificationsTime(nextRace);

    if (!qualificationsTime || isEventDay) return false;

    const twoDayBeforeEvent = this.getDayBeforeEvent(eventDate,2);

    const twoDayBeforeEventEnd = new Date(twoDayBeforeEvent);
    twoDayBeforeEventEnd.setHours(23, 59, 59, 999);

    return now.getTime() >= twoDayBeforeEvent.getTime() &&
           now.getTime() < twoDayBeforeEventEnd.getTime();
  }

  canShowSprintBet(nextRace: CalendarRace): boolean {
    if (!nextRace) return false;

    const now = new Date();
    const eventDate = new Date(nextRace.event_date);
    const isEventDay = now.toDateString() === eventDate.toDateString();
    const sprintTime = this.getSprintTime(nextRace);

    if (!sprintTime || isEventDay) return false;

    const dayBeforeEvent = this.getDayBeforeEvent(eventDate);
    return now.getTime() >= dayBeforeEvent.getTime() &&
           now.getTime() < sprintTime.getTime() - (30 * 60 * 1000);
  }

  canShowRaceBet(nextRace: CalendarRace): boolean {
    if (!nextRace) return false;

    const now = new Date();
    const eventDate = new Date(nextRace.event_date);
    const eventTime = new Date(`${nextRace.event_date}T${nextRace.event_time ?? '14:00:00'}`);
    const isEventDay = now.toDateString() === eventDate.toDateString();
    const sprintTime = this.getSprintTime(nextRace);
    const dayBeforeEvent = this.getDayBeforeEvent(eventDate);

    // Create end time as midnight of day before event
    const dayBeforeEventEnd = new Date(dayBeforeEvent);
    dayBeforeEventEnd.setHours(23, 59, 59, 999);

    if (!sprintTime) return false;

    const oneHourAfterSprint = sprintTime.getTime() + (60 * 60 * 1000);
    const condition1 =  !isEventDay &&
                        now.getTime() >= oneHourAfterSprint &&
                        now.getTime() <= dayBeforeEventEnd.getTime();
    const condition2 =  isEventDay &&
                        now.getTime() >= eventDate.getTime() &&
                        now.getTime() <= eventTime.getTime() - (60 * 60 * 1000);

    return condition1 || condition2
  }

  private getDiffDays(eventDate: Date, now: Date): number {
    return (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
  }

  private getDayBeforeEvent(eventDate: Date, numDays: number = 1): Date {
    return new Date(
      eventDate.getUTCFullYear(),
      eventDate.getUTCMonth(),
      eventDate.getUTCDate() - numDays
    );
  }

  private getQualificationsTime(nextRace: CalendarRace): Date | null {
    return this.createRaceDateTime(nextRace, nextRace.qualifications_time || this.defaultTime);
  }

  private getSprintTime(nextRace: CalendarRace): Date | null {
    return this.createRaceDateTime(nextRace, nextRace.sprint_time || this.defaultTime);
  }

  private getEventTime(nextRace: CalendarRace): Date | null {
    return nextRace.event_time
      ? new Date(`${nextRace.event_date}T${nextRace.event_time}`)
      : null;
  }

  private createRaceDateTime(nextRace: CalendarRace, timeString: string | null): Date | null {
    if (!timeString) return null;

    const eventDate = new Date(nextRace.event_date);
    const dayBeforeEvent = this.getDayBeforeEvent(eventDate);

    return new Date(
      `${dayBeforeEvent.getUTCFullYear()}-` +
      `${(dayBeforeEvent.getUTCMonth() + 1).toString().padStart(2, '0')}-` +
      `${(dayBeforeEvent.getUTCDate() + 1).toString().padStart(2, '0')}T` +
      timeString
    );
  }
}
