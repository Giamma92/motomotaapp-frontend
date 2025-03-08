import { Injectable } from '@angular/core';
import { CalendarRace } from './dashboard.service';

@Injectable({
  providedIn: 'root'
})
export class RaceScheduleService {

  private defaultTime: string =  '00:00:00';
  private thresholdTime: string =  '14:00:00';

  constructor() { }

  canShowLineups(nextRace: CalendarRace): boolean {
    if (!nextRace) return false;

    const now = new Date();
    const eventDate = new Date(nextRace.event_date);
    const eventTime = new Date(`${nextRace.event_date}T${nextRace.event_time ?? '14:00:00'}`);
    const isEventDay = now.toDateString() === eventDate.toDateString();
    const qualificationsTime = this.getQualificationsTime(nextRace);
    const isEveningRace = eventTime.getHours() >= 14;

    if (!qualificationsTime || isEventDay) return false;

    const threeDayBeforeEvent = this.getDayBeforeEvent(eventDate,3);
    const twoDayBeforeEvent = this.getDayBeforeEvent(eventDate,2);
    const oneDayBeforeEvent = this.getDayBeforeEvent(eventDate);

    const twoDayBeforeEventEnd = new Date(twoDayBeforeEvent);
    twoDayBeforeEventEnd.setHours(23, 59, 59, 999);

    const oneDayBeforeEventEnd = new Date(oneDayBeforeEvent);
    oneDayBeforeEventEnd.setHours(13, 59, 59, 999);

    const condition1 = !isEveningRace &&
                        now.getTime() >= threeDayBeforeEvent.getTime() &&
                        now.getTime() < twoDayBeforeEventEnd.getTime();

    const condition2 = isEveningRace &&
                        now.getTime() >= threeDayBeforeEvent.getTime() &&
                        now.getTime() < oneDayBeforeEventEnd.getTime();

    return condition1 || condition2;
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
    const eventTime = this.getEventTime(nextRace);
    const isEventDay = now.toDateString() === eventDate.toDateString();
    const sprintTime = this.getSprintTime(nextRace);
    const dayBeforeEvent = this.getDayBeforeEvent(eventDate);
    const isEveningRace = eventTime.getHours() >= 14;

    // Create end time as midnight of day before event
    const dayBeforeEventEnd = new Date(dayBeforeEvent);
    dayBeforeEventEnd.setHours(23, 59, 59, 999);

    const eventEnd = new Date(eventTime);
    eventEnd.setHours(13, 59, 59, 999);

    if (!sprintTime) return false;

    const oneHourAfterSprint = sprintTime.getTime() + (60 * 60 * 1000);

    const condition1 = isEveningRace &&
                       now.getTime() >= oneHourAfterSprint &&
                       now.getTime() <= eventEnd.getTime();

    const condition2 = !isEveningRace &&
                       now.getTime() >= oneHourAfterSprint &&
                       now.getTime() <= dayBeforeEventEnd.getTime();

    return condition1 || condition2;
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

  private getSprintTime(nextRace: CalendarRace): Date {
    return this.createRaceDateTime(nextRace, nextRace.sprint_time || this.defaultTime);
  }

  private getEventTime(nextRace: CalendarRace): Date {
    return new Date(`${nextRace.event_date}T${nextRace.event_time}`)

  }

  private createRaceDateTime(nextRace: CalendarRace, timeString: string | null): Date {

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
