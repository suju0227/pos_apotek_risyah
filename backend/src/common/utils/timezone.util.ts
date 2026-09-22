const MAKASSAR_OFFSET_MS = 8 * 60 * 60 * 1000;

export class TimezoneUtil {
  static toOperationalDate(date: Date): Date {
    return new Date(date.getTime() + MAKASSAR_OFFSET_MS);
  }

  static operationalDateToUtc(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month, day) - MAKASSAR_OFFSET_MS);
  }

  static startOfOperationalDay(date: Date): Date {
    const local = this.toOperationalDate(date);
    return this.operationalDateToUtc(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
    );
  }

  static parseOperationalDate(value: string): Date {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new Error(`Invalid date format: ${value}`);

    const [, year, month, day] = match;
    const parsed = this.operationalDateToUtc(
      Number(year),
      Number(month) - 1,
      Number(day),
    );

    if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid date: ${value}`);
    return parsed;
  }

  static nextOperationalDay(date: Date): Date {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000);
  }

  static nowOperationalDateString(date = new Date()): string {
    return this.toOperationalDate(date).toISOString().slice(0, 10);
  }

  static nowOperationalIso(date = new Date()): string {
    return this.toOperationalDate(date).toISOString();
  }
}

export const APP_TIMEZONE = 'Asia/Makassar';
