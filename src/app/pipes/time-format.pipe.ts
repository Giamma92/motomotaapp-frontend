import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeFormat' })
export class TimeFormatPipe implements PipeTransform {
  transform(value: string, eventDate?: string, eventType?: 'qualifying' | 'sprint' | 'race'): string {
    if (!value) return 'TBD';

    // Assuming time is in format "HH:mm:ss" or similar
    const [hours, minutes] = value.split(':');
    const timeString = `${hours}:${minutes}`;

    // Add day information if eventDate is provided
    if (eventDate && eventType) {
      const eventDateObj = new Date(eventDate);
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

      const dayName = eventDay.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} ${timeString}`;
    }

    return timeString;
  }
}
