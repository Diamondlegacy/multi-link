import { query } from "../../_lib/db.js";
import { getAuthedUser, decryptBankNumber } from "../../_lib/auth.js";

export default async function handler(req, res) {
  const authed = getAuthedUser(req);
  if (!authed) return res.status(401).json({ error: "Not logged in." });
  if (authed.role !== "admin") {
    return res.status(403).json({ error: "Admins only." });
  }

  const { id } = req.query;

  if (req.method === "GET") {
    const rateResult = await query("SELECT value FROM settings WHERE key = 'pay_rate'");
    const rate = rateResult.rows[0] ? Number(rateResult.rows[0].value) : 0;

    const userResult = await query(
      `SELECT id, email, role, full_name, phone, dob, avatar_url,
              bank_name, bank_account_name, bank_account_number_encrypted
       FROM users WHERE id = $1`,
      [id]
    );
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: "Worker not found." });

    const hoursResult = await query(
      `SELECT id, entry_date, hours, note, status FROM hours_entries
       WHERE user_id = $1 ORDER BY entry_date DESC`,
      [id]
    );

    const totalHours = hoursResult.rows
      .filter((r) => r.status === "approved")
      .reduce((sum, r) => sum + Number(r.hours), 0);

    let bankAccountNumber = "";
    try {
      bankAccountNumber = decryptBankNumber(user.bank_account_number_encrypted);
    } catch {
      bankAccountNumber = "";
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      role: user.role,
      profile: {
        fullName: user.full_name || "",
        phone: user.phone || "",
        dob: user.dob || "",
        avatarUrl: user.avatar_url || "",
        bankName: user.bank_name || "",
        bankAccountName: user.bank_account_name || "",
        bankAccountNumber,
      },
      totalHours,
      totalEarnings: totalHours * rate,
      hoursEntries: hoursResult.rows.map((r) => ({
        id: r.id,
        date: r.entry_date,
        hours: Number(r.hours),
        note: r.note || "",
        status: r.status,
      })),
    });
  }

  if (req.method === "PUT") {
    const { role, hasReleaseBadge } = req.body || {};

    if (role !== undefined) {
      if (!["admin", "worker"].includes(role)) {
        return res.status(400).json({ error: "Role must be 'admin' or 'worker'." });
      }
      if (id === authed.sub) {
        return res.status(400).json({ error: "You can't change your own role." });
      }
      await query("UPDATE users SET role = $1 WHERE id = $2", [role, id]);
    }

    if (hasReleaseBadge !== undefined) {
      await query("UPDATE users SET has_release_badge = $1 WHERE id = $2", [
        Boolean(hasReleaseBadge),
        id,
      ]);
    }

    if (role === undefined && hasReleaseBadge === undefined) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
