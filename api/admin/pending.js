import { query } from "../_lib/db.js";
import { getAuthedUser } from "../_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (authed.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }

  if (req.method === "GET") {
    const result = await query(`
      SELECT h.id, h.entry_date, h.hours, h.note,
             u.id AS user_id, COALESCE(NULLIF(u.full_name, ''), u.email) AS name,
             u.avatar_url
      FROM hours_entries h
      JOIN users u ON u.id = h.user_id
      WHERE h.status = 'pending'
      ORDER BY h.entry_date ASC
    `);

    const rows = result.rows.map((r) => ({
      id: r.id,
      date: r.entry_date,
      hours: Number(r.hours),
      note: r.note || "",
      worker: { id: r.user_id, name: r.name, avatarUrl: r.avatar_url || "" },
    }));

    return res.status(200).json(rows);
  }

  if (req.method === "PUT") {
    const { id, action } = req.body || {};
    if (!id || !["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "id and a valid action are required." });
    }

    const newStatus = action === "approve" ? "approved" : "rejected";
    const result = await query(
      `UPDATE hours_entries SET status = $1 WHERE id = $2 AND status = 'pending'`,
      [newStatus, id]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: "That entry was already reviewed." });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
