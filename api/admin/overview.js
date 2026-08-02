import { query } from "../_lib/db.js";
import { getAuthedUser } from "../_lib/auth.js";
import { resolveWeek } from "../_lib/weeks.js";

const ADMIN_CUT_PERCENT = 0.25;

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (authed.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { week } = req.query || {};
  const { weekNumber, currentWeekNumber, startDate, endDate } = await resolveWeek(week);

  const rateResult = await query("SELECT value FROM settings WHERE key = 'pay_rate'");
  const rate = rateResult.rows[0] ? Number(rateResult.rows[0].value) : 0;

  const allTimeResult = await query(`
    SELECT COALESCE(SUM(h.hours), 0) AS total_hours
    FROM hours_entries h
    JOIN users u ON u.id = h.user_id
    WHERE u.role = 'worker' AND h.status = 'approved'
  `);
  const allTimeHours = Number(allTimeResult.rows[0].total_hours);

  const weekResult = await query(
    `
    SELECT COALESCE(SUM(h.hours), 0) AS total_hours
    FROM hours_entries h
    JOIN users u ON u.id = h.user_id
    WHERE u.role = 'worker' AND h.status = 'approved'
      AND h.entry_date >= $1 AND h.entry_date < $2
    `,
    [startDate, endDate]
  );
  const weekHours = Number(weekResult.rows[0].total_hours);

  const pendingCountResult = await query(
    "SELECT COUNT(*)::int AS count FROM hours_entries WHERE status = 'pending'"
  );

  const workerCountResult = await query(
    "SELECT COUNT(*)::int AS count FROM users WHERE role = 'worker'"
  );

  const allTimeEarnings = allTimeHours * rate;
  const weekEarnings = weekHours * rate;
  const adminCutThisWeek = weekEarnings * ADMIN_CUT_PERCENT;

  return res.status(200).json({
    payRate: rate,
    workerCount: workerCountResult.rows[0].count,
    pendingApprovalsCount: pendingCountResult.rows[0].count,
    allTime: { hours: allTimeHours, earnings: allTimeEarnings },
    week: {
      weekNumber,
      currentWeekNumber,
      startDate,
      endDate,
      hours: weekHours,
      earnings: weekEarnings,
    },
    adminCutThisWeek,
    adminCutPercent: ADMIN_CUT_PERCENT * 100,
  });
}
