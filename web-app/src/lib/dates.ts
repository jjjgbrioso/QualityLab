const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/** True only for a real calendar date in YYYY-MM-DD form, so 2030-02-30 is rejected. */
export function isValidDateOnly(value: string): boolean {
  if (!DATE_ONLY.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const parseDateOnly = (value: string) => new Date(`${value}T00:00:00.000Z`);
export const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);
export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function addDays(value: string, days: number): string {
  return formatDateOnly(new Date(parseDateOnly(value).getTime() + days * DAY_MS));
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((parseDateOnly(checkOut).getTime() - parseDateOnly(checkIn).getTime()) / DAY_MS);
}

export function formatDisplayDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function formatDisplayDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}
