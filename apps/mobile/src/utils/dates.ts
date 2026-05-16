export function daysUntil(date?: string | null) {
  if (!date) return 0;
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000));
}

export function formatDate(date?: string | null) {
  if (!date) return "Someday";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

export function formatLongDate(date?: string | null) {
  if (!date) return "Someday";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(date));
}

export interface TimeParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  fraction: number;
}

export function timeUntil(date?: string | null, anchor?: string | Date | null): TimeParts {
  const target = date ? new Date(date).getTime() : Date.now();
  const now = Date.now();
  const totalMs = Math.max(0, target - now);

  const days = Math.floor(totalMs / 86_400_000);
  const hours = Math.floor((totalMs % 86_400_000) / 3_600_000);
  const minutes = Math.floor((totalMs % 3_600_000) / 60_000);
  const seconds = Math.floor((totalMs % 60_000) / 1000);

  const start = anchor ? new Date(anchor).getTime() : target - 30 * 86_400_000;
  const span = Math.max(1, target - start);
  const elapsed = Math.max(0, Math.min(span, now - start));
  const fraction = elapsed / span;

  return { days, hours, minutes, seconds, totalMs, fraction };
}

export function padDigits(value: number, length = 2) {
  return value.toString().padStart(length, "0");
}
