import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../services/i18n.service';
import { DateUtils } from '../utils/date-utils';

type LocalizedDatePreset = 'date' | 'short' | 'datetime' | 'time';

@Pipe({
  name: 'localizedDate',
  standalone: true,
  pure: false
})
export class LocalizedDatePipe implements PipeTransform {
  constructor(private i18n: I18nService) {}

  transform(value: string | Date | null | undefined, preset: LocalizedDatePreset = 'short'): string {
    if (!value) return '';

    const date = this.parseInput(value);
    if (!date || Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(this.i18n.locale, this.getOptions(preset)).format(date);
  }

  private parseInput(value: string | Date): Date | null {
    if (value instanceof Date) return value;

    const localDate = DateUtils.parseLocalYyyyMmDd(value);
    if (localDate) return localDate;

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private getOptions(preset: LocalizedDatePreset): Intl.DateTimeFormatOptions {
    switch (preset) {
      case 'date':
        return { day: '2-digit', month: '2-digit', year: 'numeric' };
      case 'datetime':
        return { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      case 'time':
        return { hour: '2-digit', minute: '2-digit' };
      case 'short':
      default:
        return { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' };
    }
  }
}
