import { query } from "../../_lib/db.js";
import { getAuthedUser } from "../../_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (authed.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }

  const { id } = req.query;

  if (req.method === "PUT") {
    const { workerId, date } = req.body || {};
    if (!workerId || !date) {
      return res.status(400).json({ error: "workerId and date are required to assign a link." });
    }
    const result = await query(
      `UPDATE links
       SET assigned_worker_id = $1, assigned_date = $2, status = 'assigned', released_at = NULL
       WHERE id = $3`,
      [workerId, date, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found." });
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === "DELETE") {
    const result = await query("DELETE FROM links WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found." });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
