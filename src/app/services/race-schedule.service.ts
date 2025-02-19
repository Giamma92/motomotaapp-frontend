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

    const dayBeforeEvent = this.getDayBeforeEvent(eventDate);
    return now.getTime() >= dayBeforeEvent.getTime() &&
           now.getTime() < qualificationsTime.getTime() - (60 * 60 * 1000);
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
    const isEventDay = now.toDateString() === eventDate.toDateString();
    const sprintTime = this.getSprintTime(nextRace);
    const eventTime = this.getEventTime(nextRace);

    // Condition 1: Day before event
    const condition1 = !isEventDay && !!sprintTime &&
                      this.getDiffDays(eventDate, now) <= 1 &&
                      now.getTime() >= sprintTime.getTime() + 3600 * 1000;

    // Condition 2: Event day
    const condition2 = !!isEventDay && !!eventTime &&
                      now.getTime() <= eventTime.getTime() - 2 * 3600 * 1000;

    return condition1 || condition2;
  }

  private getDiffDays(eventDate: Date, now: Date): number {
    return (eventDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
  }

  private getDayBeforeEvent(eventDate: Date): Date {
    return new Date(
      eventDate.getUTCFullYear(),
      eventDate.getUTCMonth(),
      eventDate.getUTCDate() - 1
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
