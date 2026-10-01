/**
 * Today's calendar date in India, as the UTC-midnight Date that Prisma uses for
 * `@db.Date` columns. Comparing a date-only column against `new Date()` (now)
 * dropped a festival from "upcoming" lists from 05:30 IST on its own day,
 * because its stored midnight is already in the past by then.
 */
export function todayIST(): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  return new Date(`${ymd}T00:00:00.000Z`);
}
