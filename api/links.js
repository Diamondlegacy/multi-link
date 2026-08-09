import { query } from "./_lib/db.js";
import { getAuthedUser, decryptSecret } from "./_lib/auth.js";

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
      `SELECT la.id AS assignment_id, l.id AS link_id, l.account_name, l.account_email,
              l.account_password_encrypted, l.rdp_password_encrypted, l.notes
       FROM link_assignments la
       JOIN links l ON l.id = la.link_id
       WHERE la.worker_id = $1 AND la.status = 'active'
       ORDER BY la.assigned_at DESC`,
      [authed.sub]
    );

    const myLinks = myLinksResult.rows.map((r) => ({
      assignmentId: r.assignment_id,
      linkId: r.link_id,
      accountName: r.account_name,
      accountEmail: r.account_email,
      accountPassword: decryptSecret(r.account_password_encrypted),
      rdpPassword: decryptSecret(r.rdp_password_encrypted),
      notes: r.notes || "",
    }));

    let releasedLinks = [];
    if (hasBadge) {
      const releasedResult = await query(
        `SELECT la.id AS assignment_id, l.id AS link_id, l.account_name, l.account_email, l.notes,
                COALESCE(NULLIF(u.full_name, ''), u.email) AS released_by
         FROM link_assignments la
         JOIN links l ON l.id = la.link_id
         LEFT JOIN users u ON u.id = la.worker_id
         WHERE la.status = 'released'
         ORDER BY la.released_at DESC`
      );
      releasedLinks = releasedResult.rows.map((r) => ({
        assignmentId: r.assignment_id,
        linkId: r.link_id,
        accountName: r.account_name,
        accountEmail: r.account_email,
        notes: r.notes || "",
        releasedBy: r.released_by,
      }));
    }

    return res.status(200).json({ hasReleaseBadge: hasBadge, myLinks, releasedLinks });
  }

  if (req.method === "PUT") {
    const { action } = req.body || {};

    if (action === "release") {
      const { linkId } = req.body || {};
      if (!linkId) return res.status(400).json({ error: "linkId is required." });
      const result = await query(
        `UPDATE link_assignments SET status = 'released', released_at = now()
         WHERE link_id = $1 AND worker_id = $2 AND status = 'active'`,
        [linkId, authed.sub]
      );
      if (result.rowCount === 0) {
        return res.status(400).json({ error: "That link isn't currently assigned to you." });
      }
      return res.status(200).json({ ok: true });
    }

    if (action === "claim") {
      const { assignmentId } = req.body || {};
      if (!assignmentId) return res.status(400).json({ error: "assignmentId is required." });

      const userResult = await query(
        "SELECT has_release_badge FROM users WHERE id = $1",
        [authed.sub]
      );
      if (!userResult.rows[0]?.has_release_badge) {
        return res.status(403).json({ error: "You don't have access to claim released links." });
      }
      const result = await query(
        `UPDATE link_assignments
         SET worker_id = $1, status = 'active', assigned_at = now(), released_at = NULL
         WHERE id = $2 AND status = 'released'`,
        [authed.sub, assignmentId]
      );
      if (result.rowCount === 0) {
        return res.status(400).json({ error: "That link is no longer available." });
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: "action must be 'release' or 'claim'." });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
