import { query } from "./_lib/db.js";
import { getAuthedUser } from "./_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });

  if (req.method === "GET") {
    const result = await query(
      `SELECT id, entry_date, hours, note
       FROM hours_entries WHERE user_id = $1
       ORDER BY entry_date DESC`,
      [authed.sub]
    );
    return res.status(200).json(
      result.rows.map((r) => ({
        id: r.id,
        date: r.entry_date,
        hours: Number(r.hours),
        note: r.note || "",
      }))
    );
  }

  if (req.method === "POST") {
    const { date, hours, note } = req.body || {};
    if (!date || !hours || Number(hours) <= 0) {
      return res.status(400).json({ error: "A valid date and hours are required." });
    }
    await query(
      `INSERT INTO hours_entries (user_id, entry_date, hours, note)
       VALUES ($1, $2, $3, $4)`,
      [authed.sub, date, Number(hours), note || ""]
    );
    return res.status(201).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const { id } = req.query || {};
    if (!id) return res.status(400).json({ error: "id is required." });
    await query(
      `DELETE FROM hours_entries WHERE id = $1 AND user_id = $2`,
      [id, authed.sub]
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
