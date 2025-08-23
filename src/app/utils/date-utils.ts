export class DateUtils {

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

}
