import { query } from "./_lib/db.js";
import { getAuthedUser, decryptSecret } from "./_lib/auth.js";

function todayParam() {
  return new Date().toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });

  if (req.method === "GET") {
    const userResult = await query(
      "SELECT has_release_badge FROM users WHERE id = $1",
      [authed.sub]
    );
    const hasBadge = userResult.rows[0]?.has_release_badge || false;

    const myLinksResult = await query(
      `SELECT id, account_name, account_email, account_password_encrypted,
              rdp_password_encrypted, notes, assigned_date, status
       FROM links
       WHERE assigned_worker_id = $1 AND status = 'assigned'
       ORDER BY assigned_date DESC`,
      [authed.sub]
    );

    const myLinks = myLinksResult.rows.map((r) => ({
      id: r.id,
      accountName: r.account_name,
      accountEmail: r.account_email,
      accountPassword: decryptSecret(r.account_password_encrypted),
      rdpPassword: decryptSecret(r.rdp_password_encrypted),
      notes: r.notes || "",
      assignedDate: r.assigned_date,
      status: r.status,
    }));

    let releasedLinks = [];
    if (hasBadge) {
      const releasedResult = await query(
        `SELECT l.id, l.account_name, l.account_email, l.notes, l.assigned_date, l.released_at,
                COALESCE(NULLIF(u.full_name, ''), u.email) AS released_by
         FROM links l
         LEFT JOIN users u ON u.id = l.assigned_worker_id
         WHERE l.status = 'released'
         ORDER BY l.released_at DESC`
      );
      releasedLinks = releasedResult.rows.map((r) => ({
        id: r.id,
        accountName: r.account_name,
        accountEmail: r.account_email,
        notes: r.notes || "",
        assignedDate: r.assigned_date,
        releasedBy: r.released_by,
      }));
    }

    return res.status(200).json({ hasReleaseBadge: hasBadge, myLinks, releasedLinks });
  }

  if (req.method === "PUT") {
    const { id, action } = req.body || {};
    if (!id || !["release", "claim"].includes(action)) {
      return res.status(400).json({ error: "id and a valid action are required." });
    }

    if (action === "release") {
      const result = await query(
        `UPDATE links SET status = 'released', released_at = now()
         WHERE id = $1 AND assigned_worker_id = $2 AND status = 'assigned'`,
        [id, authed.sub]
      );
      if (result.rowCount === 0) {
        return res.status(400).json({ error: "That link isn't currently assigned to you." });
      }
      return res.status(200).json({ ok: true });
    }

    if (action === "claim") {
      const userResult = await query(
        "SELECT has_release_badge FROM users WHERE id = $1",
        [authed.sub]
      );
      if (!userResult.rows[0]?.has_release_badge) {
        return res.status(403).json({ error: "You don't have access to claim released links." });
      }
      const result = await query(
        `UPDATE links
         SET assigned_worker_id = $1, assigned_date = $2, status = 'assigned', released_at = NULL
         WHERE id = $3 AND status = 'released'`,
        [authed.sub, todayParam(), id]
      );
      if (result.rowCount === 0) {
        return res.status(400).json({ error: "That link is no longer available." });
      }
      return res.status(200).json({ ok: true });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
