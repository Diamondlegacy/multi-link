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
    const linksResult = await query(`
      SELECT id, account_name, account_email, notes
      FROM links ORDER BY created_at DESC
    `);

    const assignmentsResult = await query(`
      SELECT la.link_id, la.id AS assignment_id, la.status, la.worker_id,
             COALESCE(NULLIF(u.full_name, ''), u.email) AS worker_name
      FROM link_assignments la
      JOIN users u ON u.id = la.worker_id
      ORDER BY la.assigned_at ASC
    `);

    const assignmentsByLink = {};
    for (const a of assignmentsResult.rows) {
      if (!assignmentsByLink[a.link_id]) assignmentsByLink[a.link_id] = [];
      assignmentsByLink[a.link_id].push({
        assignmentId: a.assignment_id,
        workerId: a.worker_id,
        workerName: a.worker_name,
        status: a.status,
      });
    }

    const rows = linksResult.rows.map((l) => ({
      id: l.id,
      accountName: l.account_name,
      accountEmail: l.account_email,
      notes: l.notes || "",
      slots: assignmentsByLink[l.id] || [],
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
      `INSERT INTO links (account_name, account_email, account_password_encrypted, rdp_password_encrypted, notes)
       VALUES ($1, $2, $3, $4, $5)`,
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
    if (!id) return res.status(400).json({ error: "id is required." });
    const { workerIds } = req.body || {};
    const uniqueIds = [...new Set((workerIds || []).filter(Boolean))];

    if (uniqueIds.length === 0) {
      return res.status(400).json({ error: "Pick at least one worker to assign." });
    }
    if (uniqueIds.length > 2) {
      return res.status(400).json({ error: "A link can only be assigned to up to 2 workers." });
    }

    await query("DELETE FROM link_assignments WHERE link_id = $1", [id]);
    for (const workerId of uniqueIds) {
      await query(
        `INSERT INTO link_assignments (link_id, worker_id, status)
         VALUES ($1, $2, 'active')`,
        [id, workerId]
      );
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
