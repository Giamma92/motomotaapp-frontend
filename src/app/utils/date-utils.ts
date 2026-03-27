export class DateUtils {
  static readonly DEFAULT_CHAMPIONSHIP_TIMEZONE = 'Europe/Rome';

  /**
   * Returns a local midnight Date for YYYY‑MM‑DD.
   * Avoids UTC parsing bugs by using the `(year, monthIndex, day)` constructor.
   */
  static parseLocalYyyyMmDd(s: string | null | undefined): Date | null {
    if (!s) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    return Number.isFinite(dt.getTime()) ? dt : null;
  }

  /** Add a number of days to a date, preserving local time. */
  static addDays(dt: Date, days: number): Date {
    const r = new Date(dt);
    r.setDate(r.getDate() + days);
    return r;
  }

  /** Return the start of a given date (00:00:00.000). */
  static startOfDay(dt: Date): Date {
    const r = new Date(dt);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  /** Return the end of a given date (23:59:59.999). */
  static endOfDay(dt: Date): Date {
    const r = new Date(dt);
    r.setHours(23, 59, 59, 999);
    return r;
  }

  /** Set a time (HH:mm:ss) on a Date, preserving the date portion. */
  static setTimeOnDate(base: Date, hms: string): Date {
    const [hh = '00', mm = '00', ss = '00'] = hms.split(':');
    const dt = new Date(base);
    dt.setHours(+hh || 0, +mm || 0, +ss || 0, 0);
    return dt;
  }

  /** Build a Date from YYYY‑MM‑DD and HH:mm:ss (local). */
  static buildLocalDateTime(ymd: string, hms: string): Date | null {
    const base = this.parseLocalYyyyMmDd(ymd);
    if (!base) return null;
    return this.setTimeOnDate(base, hms);
  }

  static normalizeTimeZone(timeZone: string | null | undefined): string {
    if (!timeZone) return this.DEFAULT_CHAMPIONSHIP_TIMEZONE;

    try {
      Intl.DateTimeFormat(undefined, { timeZone }).format(new Date());
      return timeZone;
    } catch {
      return this.DEFAULT_CHAMPIONSHIP_TIMEZONE;
    }
  }

  static parseHms(hms: string | null | undefined): { hours: number; minutes: number; seconds: number } {
    const [hh = '00', mm = '00', ss = '00'] = String(hms || '00:00:00').split(':');
    return {
      hours: Number(hh) || 0,
      minutes: Number(mm) || 0,
      seconds: Number(ss) || 0
    };
  }

  static formatLocalYyyyMmDd(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static addDaysToYyyyMmDd(ymd: string, days: number): string | null {
    const date = this.parseLocalYyyyMmDd(ymd);
    if (!date) return null;
    return this.formatLocalYyyyMmDd(this.addDays(date, days));
  }

  static getYyyyMmDdInTimeZone(date: Date, timeZone: string): string {
    const parts = this.getTimeZoneParts(date, timeZone);
    const month = String(parts.month).padStart(2, '0');
    const day = String(parts.day).padStart(2, '0');
    return `${parts.year}-${month}-${day}`;
  }

  static isSameYyyyMmDdInTimeZone(date: Date, ymd: string, timeZone: string): boolean {
    return this.getYyyyMmDdInTimeZone(date, timeZone) === ymd;
  }

  static buildZonedDateTime(
    ymd: string,
    hms: string,
    timeZone: string = this.DEFAULT_CHAMPIONSHIP_TIMEZONE
  ): Date | null {
    const date = this.parseLocalYyyyMmDd(ymd);
    if (!date) return null;

    const { hours, minutes, seconds } = this.parseHms(hms);
    const tz = this.normalizeTimeZone(timeZone);
    const guessUtc = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      hours,
      minutes,
      seconds,
      0
    ));

    const initialOffset = this.getTimeZoneOffsetMs(guessUtc, tz);
    let result = new Date(guessUtc.getTime() - initialOffset);
    const correctedOffset = this.getTimeZoneOffsetMs(result, tz);

    if (correctedOffset !== initialOffset) {
      result = new Date(guessUtc.getTime() - correctedOffset);
    }

    return result;
  }

  private static getTimeZoneParts(date: Date, timeZone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.normalizeTimeZone(timeZone),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);

    return {
      year: get('year'),
      month: get('month'),
      day: get('day'),
      hour: get('hour'),
      minute: get('minute'),
      second: get('second')
    };
  }

  private static getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const parts = this.getTimeZoneParts(date, timeZone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0
    );

    return asUtc - date.getTime();
  }

}
