import { query } from "./db.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * "Week 1" starts on the Tuesday on/before the very first hours entry
 * ever logged (across all workers). Every week after that is numbered
 * sequentially, forever. If no hours have been logged yet, Week 1 is
 * just the current Tuesday-Monday period.
 */
export async function getWeekEpoch() {
  const result = await query(`
    SELECT COALESCE(
      MIN((date_trunc('week', entry_date - interval '1 day') + interval '1 day')::date),
      (date_trunc('week', CURRENT_DATE - interval '1 day') + interval '1 day')::date
    ) AS epoch
    FROM hours_entries
  `);
  return new Date(result.rows[0].epoch);
}

// Tuesday..Monday range for a given week number (1-indexed).
// `end` is exclusive (the following Tuesday).
export function weekRange(epoch, weekNumber) {
  const start = new Date(epoch);
  start.setUTCDate(start.getUTCDate() + (weekNumber - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  return { start, end };
}

export function currentWeekNumber(epoch) {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day - 2 + 7) % 7; // days since most recent Tuesday
  const thisWeekStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diff)
  );
  return Math.floor((thisWeekStart - epoch) / (7 * DAY_MS)) + 1;
}

export function toDateParam(d) {
  return d.toISOString().slice(0, 10);
}

// Resolves a requested week number (or "current" if none given) into
// an actual date range + the week number that was used.
export async function resolveWeek(requestedWeek) {
  const epoch = await getWeekEpoch();
  const current = currentWeekNumber(epoch);
  const weekNumber = requestedWeek ? Number(requestedWeek) : current;
  const { start, end } = weekRange(epoch, weekNumber);
  return {
    weekNumber,
    currentWeekNumber: current,
    startDate: toDateParam(start),
    endDate: toDateParam(end), // exclusive
  };
}
