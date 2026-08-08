import { query } from "../_lib/db.js";
import { getAuthedUser, encryptSecret } from "../_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (authed.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }

  const { id } = req.query;

  if (req.method === "GET") {
    const result = await query(`
      SELECT l.id, l.account_name, l.account_email, l.notes, l.status,
             l.assigned_date, l.released_at,
             u.id AS worker_id, COALESCE(NULLIF(u.full_name, ''), u.email) AS worker_name
      FROM links l
      LEFT JOIN users u ON u.id = l.assigned_worker_id
      ORDER BY l.created_at DESC
    `);

    const rows = result.rows.map((r) => ({
      id: r.id,
      accountName: r.account_name,
      accountEmail: r.account_email,
      notes: r.notes || "",
      status: r.status,
      assignedDate: r.assigned_date,
      releasedAt: r.released_at,
      worker: r.worker_id ? { id: r.worker_id, name: r.worker_name } : null,
    }));

    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { accountName, accountEmail, accountPassword, rdpPassword, notes } = req.body || {};
    if (!accountName || !accountEmail || !accountPassword || !rdpPassword) {
      return res.status(400).json({
        error: "Account name, email, account password, and RDP password are all required.",
      });
    }

    await query(
      `INSERT INTO links (account_name, account_email, account_password_encrypted, rdp_password_encrypted, notes, status)
       VALUES ($1, $2, $3, $4, $5, 'unassigned')`,
      [
        accountName,
        accountEmail,
        encryptSecret(accountPassword),
        encryptSecret(rdpPassword),
        notes || "",
      ]
    );
    return res.status(201).json({ ok: true });
  }

  if (req.method === "PUT") {
    const { workerId, date } = req.body || {};
    if (!id) return res.status(400).json({ error: "id is required." });
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
    if (!id) return res.status(400).json({ error: "id is required." });
    const result = await query("DELETE FROM links WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Link not found." });
    }
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
