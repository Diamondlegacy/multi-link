import { query } from "../../_lib/db.js";
import { getAuthedUser } from "../../_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (authed.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }
  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const { action } = req.body || {};
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ error: "Action must be 'approve' or 'reject'." });
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
