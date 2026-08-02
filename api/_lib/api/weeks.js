import { getAuthedUser } from "./_lib/auth.js";
import { getWeekEpoch, currentWeekNumber, weekRange, toDateParam } from "./_lib/weeks.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const epoch = await getWeekEpoch();
  const current = currentWeekNumber(epoch);

  const weeks = [];
  for (let n = current; n >= 1; n--) {
    const { start, end } = weekRange(epoch, n);
    const endInclusive = new Date(end);
    endInclusive.setUTCDate(endInclusive.getUTCDate() - 1);
    weeks.push({
      weekNumber: n,
      startDate: toDateParam(start),
      endDate: toDateParam(endInclusive),
    });
  }

  return res.status(200).json({ currentWeekNumber: current, weeks });
}
