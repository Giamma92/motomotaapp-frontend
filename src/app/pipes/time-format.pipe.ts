import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeFormat' })
export class TimeFormatPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return 'TBD';

    // Assuming time is in format "HH:mm:ss" or similar
    const [hours, minutes] = value.split(':');
    return `${hours}:${minutes}`;
  }
}
