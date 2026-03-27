import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { DateUtils } from '../utils/date-utils';

@Pipe({ name: 'timeFormat' })
export class TimeFormatPipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(value: string, eventDate?: string, eventType?: 'qualifying' | 'sprint' | 'race'): string {
    if (!value) return 'TBD';

    const baseDate = DateUtils.buildLocalDateTime('2000-01-01', value);
    const timeString = baseDate
      ? new Intl.DateTimeFormat(this.i18n.locale, { hour: '2-digit', minute: '2-digit' }).format(baseDate)
      : value;

    // Add day information if eventDate is provided
    if (eventDate && eventType) {
      const eventDateObj = DateUtils.parseLocalYyyyMmDd(eventDate);
      if (!eventDateObj) return timeString;
      let dayOffset = 0;

      // Calculate day offset based on event type
      switch (eventType) {
        case 'qualifying':
        case 'sprint':
          // Qualifying and sprint are typically on Saturday (day before race)
          dayOffset = -1;
          break;
        case 'race':
          // Race is on Sunday
          dayOffset = 0;
          break;
      }

      const eventDay = new Date(eventDateObj);
      eventDay.setDate(eventDay.getDate() + dayOffset);

      const dayName = eventDay.toLocaleDateString(this.i18n.locale, { weekday: 'short' });
      return `${dayName} ${timeString}`;
    }

    return timeString;
  }
}
