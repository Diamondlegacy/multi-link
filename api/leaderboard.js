import { query } from "./_lib/db.js";
import { getAuthedUser } from "./_lib/auth.js";
import { resolveWeek } from "./_lib/weeks.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { week } = req.query || {};
  const { weekNumber, currentWeekNumber, startDate, endDate } = await resolveWeek(week);

  const rateResult = await query("SELECT value FROM settings WHERE key = 'pay_rate'");
  const rate = rateResult.rows[0] ? Number(rateResult.rows[0].value) : 0;

  const result = await query(
    `
    SELECT u.id, u.avatar_url, COALESCE(NULLIF(u.full_name, ''), u.email) AS name,
           SUM(h.hours) AS total_hours
    FROM users u
    JOIN hours_entries h ON h.user_id = u.id
    WHERE u.role = 'worker'
      AND h.status = 'approved'
      AND h.entry_date >= $1 AND h.entry_date < $2
    GROUP BY u.id, name
    HAVING SUM(h.hours) > 0
    ORDER BY total_hours DESC
    `,
    [startDate, endDate]
  );

  const rows = result.rows.map((r) => ({
    userId: r.id,
    name: r.name,
    avatarUrl: r.avatar_url || "",
    totalHours: Number(r.total_hours),
    totalEarnings: Number(r.total_hours) * rate,
  }));

  return res.status(200).json({ weekNumber, currentWeekNumber, startDate, endDate, rows });
}
